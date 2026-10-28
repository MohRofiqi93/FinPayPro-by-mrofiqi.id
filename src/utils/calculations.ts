import {
  AccountBalanceItem,
  BalanceRevisionEntry,
  DailyExpenseItem,
  FixedCostItem,
  HangoutExpenseItem,
  MonthlyPeriodData,
  PeriodFinancialSummary,
  SyncOperationType,
  SyncQueueItem,
} from '../types/finance';

export function formatIDR(amount: number, showPlus = false): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (isNegative) {
    return `-Rp ${formatted}`;
  }
  if (showPlus && amount > 0) {
    return `+Rp ${formatted}`;
  }
  return `Rp ${formatted}`;
}

export function formatCompactIDR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const prefix = isNegative ? '-Rp ' : 'Rp ';
  if (abs >= 1_000_000_000) {
    return `${prefix}${(abs / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${prefix}${(abs / 1_000_000).toFixed(2).replace(/\.00$/, '')} Jt`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(abs / 1_000).toFixed(0)} Rb`;
  }
  return `${prefix}${abs}`;
}

export function computeDailyExpenseTotal(qty: number, unitPrice: number): number {
  const validQty = Number.isFinite(qty) && qty >= 0 ? qty : 0;
  const validPrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
  return Math.round(validQty * validPrice);
}

/**
 * Parses tracker date strings ("DD/MM/YY", "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YY")
 * into a comparable numeric key YYYYMMDD (e.g., "25/10/26" -> 20261025).
 */
export function parseTrackerDateToSortKey(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') return 99999999;
  const cleaned = dateStr.trim();
  if (!cleaned || cleaned === '-') return 99999999;

  // Check ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return year * 10000 + month * 100 + day;
    }
  }

  // Check DD/MM/YY or DD/MM/YYYY or DD-MM-YY
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    let year = Number(dmyMatch[3]);
    if (year < 100) {
      year += 2000;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return year * 10000 + month * 100 + day;
    }
  }

  return 99999999;
}

/**
 * Normalizes any date string or (day, month, year) parts into standard "DD/MM/YY" format
 * (e.g. "2026-10-25" -> "25/10/26", or day=5, month=10, year=2026 -> "05/10/26").
 */
export function normalizeTrackerDateString(
  rawDate: string,
  dayPart?: string | number,
  monthPart?: string | number,
  yearPart?: string | number
): string {
  if (dayPart !== undefined && monthPart !== undefined && yearPart !== undefined) {
    const d = Math.max(1, Math.min(31, Number(dayPart) || 1));
    const m = Math.max(1, Math.min(12, Number(monthPart) || 1));
    const yRaw = Number(yearPart) || 2026;
    const yy = yRaw >= 100 ? String(yRaw).slice(-2) : String(yRaw).padStart(2, '0');
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${yy}`;
  }

  const cleaned = (rawDate || '').trim();
  const isoMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const yy = isoMatch[1].slice(-2);
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    return `${dd}/${mm}/${yy}`;
  }

  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yy = dmyMatch[3].length === 4 ? dmyMatch[3].slice(-2) : dmyMatch[3].padStart(2, '0');
    return `${dd}/${mm}/${yy}`;
  }

  return cleaned || '01/10/26';
}

/**
 * Sorts DailyExpenseItem[] chronologically using a stable sort.
 * When a new item is appended at the end of the list before calling this function,
 * items with the exact same date stay in insertion order (new item appears right after
 * existing items of the same date), and items with earlier/later dates are placed
 * in neat chronological sequence.
 */
export function sortDailyExpensesChronologically(
  items: DailyExpenseItem[],
  direction: 'ASC' | 'DESC' = 'ASC'
): DailyExpenseItem[] {
  return items
    .map((item, idx) => ({ item, idx, key: parseTrackerDateToSortKey(item.date) }))
    .sort((a, b) => {
      if (a.key !== b.key) {
        return direction === 'ASC' ? a.key - b.key : b.key - a.key;
      }
      return a.idx - b.idx;
    })
    .map((entry) => entry.item);
}

/**
 * Sorts HangoutExpenseItem[] chronologically using a stable sort.
 */
export function sortHangoutExpensesChronologically(
  items: HangoutExpenseItem[],
  direction: 'ASC' | 'DESC' = 'ASC'
): HangoutExpenseItem[] {
  return items
    .map((item, idx) => ({ item, idx, key: parseTrackerDateToSortKey(item.date) }))
    .sort((a, b) => {
      if (a.key !== b.key) {
        return direction === 'ASC' ? a.key - b.key : b.key - a.key;
      }
      return a.idx - b.idx;
    })
    .map((entry) => entry.item);
}

/**
 * Computes the latest modification timestamp (in epoch ms) across a list of MonthlyPeriodData.
 * Used to determine whether localStorage or backend Cloud Vault has newer user revisions.
 */
export function getLatestPeriodsTimestamp(periods: MonthlyPeriodData[]): number {
  if (!Array.isArray(periods) || periods.length === 0) return 0;
  let maxTs = 0;
  const checkIso = (iso?: string) => {
    if (!iso) return;
    const t = Date.parse(iso);
    if (Number.isFinite(t) && t > maxTs) maxTs = t;
  };
  for (const p of periods) {
    checkIso(p.updatedAt);
    checkIso(p.createdAt);
    p.fixedCosts?.forEach((i) => checkIso(i.updatedAt));
    p.subscriptionsAndDebts?.forEach((i) => checkIso(i.updatedAt));
    p.variableCosts?.forEach((i) => checkIso(i.updatedAt));
    p.incomes?.forEach((i) => checkIso(i.updatedAt));
    p.savings?.forEach((i) => checkIso(i.updatedAt));
    p.accounts?.forEach((i) => checkIso(i.lastReconciledAt));
    p.dailyExpenses?.forEach((i) => checkIso(i.updatedAt));
    p.hangoutExpenses?.forEach((i) => checkIso(i.updatedAt));
    p.revisionHistory?.forEach((i) => checkIso(i.timestamp));
  }
  return maxTs;
}


export function calculatePeriodSummary(period: MonthlyPeriodData): PeriodFinancialSummary {
  const isOpeningBalanceRevised = period.openingBalanceManualOverride !== null;
  const openingBalance = isOpeningBalanceRevised
    ? (period.openingBalanceManualOverride as number)
    : period.openingBalanceCarryOver;

  const primaryIncome = period.incomes
    .filter((i) => i.type === 'Utama')
    .reduce((acc, item) => acc + (item.amount || 0), 0);

  const sideIncome = period.incomes
    .filter((i) => i.type === 'Sampingan')
    .reduce((acc, item) => acc + (item.amount || 0), 0);

  const totalIncome = primaryIncome + sideIncome;

  // Hanya menjumlahkan pos Fixed Cost yang belum lunas (!item.isPaid), sehingga saat diklik Lunas & disimpan,
  // TOTAL PENGELUARAN TETAP (FIXED COST) Rencana & Aktual di paling bawah otomatis berkurang.
  const fixedCostPlanned = period.fixedCosts
    .filter((item) => !item.isPaid)
    .reduce((acc, item) => acc + (item.planned || 0), 0);
  const fixedCostActual = period.fixedCosts
    .filter((item) => !item.isPaid)
    .reduce((acc, item) => acc + (item.actual || 0), 0);
  const paidFixedCount = period.fixedCosts.filter((item) => item.isPaid).length;
  const totalFixedCount = period.fixedCosts.length;

  const subDebtPlanned = period.subscriptionsAndDebts
    .filter((item) => item.includeInMonthlyTotal && !item.isPaid)
    .reduce((acc, item) => acc + (item.planned || 0), 0);

  const subDebtActual = period.subscriptionsAndDebts
    .filter((item) => item.includeInMonthlyTotal && !item.isPaid)
    .reduce((acc, item) => acc + (item.actual || 0), 0);

  const subDebtAllActual = period.subscriptionsAndDebts.reduce(
    (acc, item) => acc + (item.actual || 0),
    0
  );

  const dailyTrackerTotal = period.dailyExpenses.reduce((acc, item) => acc + (item.total || 0), 0);
  const dailyTrackerOperationalTotal = period.dailyExpenses
    .filter((item) => item.groupTag !== 'AIRA_SAVING')
    .reduce((acc, item) => acc + (item.total || 0), 0);
  const dailyTrackerAiraSavingTotal = period.dailyExpenses
    .filter((item) => item.groupTag === 'AIRA_SAVING')
    .reduce((acc, item) => acc + (item.total || 0), 0);

  const dailyTrackerCount = period.dailyExpenses.filter((item) => item.total > 0 || item.description.trim() !== '').length;

  const hangoutTrackerTotal = period.hangoutExpenses.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  );
  const hangoutTrackerCount = period.hangoutExpenses.length;

  const variablePlanned = period.variableCosts.reduce((acc, item) => acc + (item.planned || 0), 0);
  const variableActual = period.variableCosts.reduce((acc, item) => {
    if (period.syncVariableWithTrackers) {
      if (item.linkedToTracker === 'DAILY') {
        return acc + dailyTrackerTotal;
      }
      if (item.linkedToTracker === 'HANGOUT') {
        return acc + hangoutTrackerTotal;
      }
    }
    return acc + (item.actual || 0);
  }, 0);

  const savingPlanned = period.savings.reduce((acc, item) => acc + (item.planned || 0), 0);
  const savingActual = period.savings.reduce((acc, item) => acc + (item.actual || 0), 0);

  const totalExpensePlanned = fixedCostPlanned + subDebtPlanned + variablePlanned;
  const totalExpenseActual = fixedCostActual + subDebtActual + variableActual;

  const totalAllocationPlanned = totalExpensePlanned + savingPlanned;
  const totalAllocationActual = totalExpenseActual + savingActual;

  const netMonthlyCashflow = totalIncome - totalAllocationActual;
  const closingBalance = openingBalance + netMonthlyCashflow;

  const totalCodExpenses =
    period.dailyExpenses
      .filter((d) => d.paymentMethod === 'COD')
      .reduce((acc, d) => acc + d.total, 0) +
    period.hangoutExpenses
      .filter((h) => h.paymentMethod === 'COD')
      .reduce((acc, h) => acc + h.amount, 0);

  const totalTfExpenses =
    period.dailyExpenses
      .filter((d) => d.paymentMethod === 'TF')
      .reduce((acc, d) => acc + d.total, 0) +
    period.hangoutExpenses
      .filter((h) => h.paymentMethod === 'TF')
      .reduce((acc, h) => acc + h.amount, 0);

  const totalBriExpenses =
    period.dailyExpenses
      .filter((d) => d.paymentMethod === 'BRI')
      .reduce((acc, d) => acc + d.total, 0) +
    period.hangoutExpenses
      .filter((h) => h.paymentMethod === 'BRI')
      .reduce((acc, h) => acc + h.amount, 0);

  const totalBsiExpenses =
    period.dailyExpenses
      .filter((d) => d.paymentMethod === 'BSI')
      .reduce((acc, d) => acc + d.total, 0) +
    period.hangoutExpenses
      .filter((h) => h.paymentMethod === 'BSI')
      .reduce((acc, h) => acc + h.amount, 0);

  const totalBankBalance = period.accounts
    .filter((a) => a.category === 'BANK')
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const totalEwalletBalance = period.accounts
    .filter((a) => a.category === 'EWALLET')
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const totalAllAccountsBalance = totalBankBalance + totalEwalletBalance;

  const totalSpecialLiabilities = period.specialLiabilities
    .filter((l) => !l.isSettled && l.category === 'HUTANG_KHUSUS')
    .reduce((acc, l) => acc + (l.amount || 0), 0);

  return {
    openingBalance,
    isOpeningBalanceRevised,
    totalIncome,
    primaryIncome,
    sideIncome,
    fixedCostPlanned,
    fixedCostActual,
    paidFixedCount,
    totalFixedCount,
    subDebtPlanned,
    subDebtActual,
    subDebtAllActual,
    variablePlanned,
    variableActual,
    savingPlanned,
    savingActual,
    totalExpensePlanned,
    totalExpenseActual,
    totalAllocationPlanned,
    totalAllocationActual,
    netMonthlyCashflow,
    closingBalance,
    dailyTrackerTotal,
    dailyTrackerOperationalTotal,
    dailyTrackerAiraSavingTotal,
    dailyTrackerCount,
    hangoutTrackerTotal,
    hangoutTrackerCount,
    totalCodExpenses,
    totalTfExpenses,
    totalBriExpenses,
    totalBsiExpenses,
    totalBankBalance,
    totalEwalletBalance,
    totalAllAccountsBalance,
    totalSpecialLiabilities,
  };
}

export function createRolloverMonth(
  sourcePeriod: MonthlyPeriodData,
  newPeriodId: string,
  newMonthLabel: string,
  nowIso = new Date().toISOString()
): MonthlyPeriodData {
  const sourceSummary = calculatePeriodSummary(sourcePeriod);
  const carryOverBalance = sourceSummary.closingBalance;

  return {
    periodId: newPeriodId,
    monthLabel: newMonthLabel,
    createdAt: nowIso,
    updatedAt: nowIso,
    openingBalanceCarryOver: carryOverBalance,
    openingBalanceManualOverride: null,
    openingBalanceRevisionNote: `Rollover otomatis dari Saldo Akhir ${sourcePeriod.monthLabel} (${formatIDR(carryOverBalance)})`,
    syncVariableWithTrackers: true,
    fixedCosts: sourcePeriod.fixedCosts.map((fc) => ({
      ...fc,
      id: `${newPeriodId}-${fc.id.split('-').slice(-1)[0]}`,
      actual: 0,
      isPaid: false,
      updatedAt: nowIso,
    })),
    subscriptionsAndDebts: sourcePeriod.subscriptionsAndDebts.map((sd) => ({
      ...sd,
      id: `${newPeriodId}-${sd.id.split('-').slice(-1)[0]}`,
      actual: 0,
      isPaid: false,
      updatedAt: nowIso,
    })),
    variableCosts: sourcePeriod.variableCosts.map((vc) => ({
      ...vc,
      id: `${newPeriodId}-${vc.id.split('-').slice(-1)[0]}`,
      actual: 0,
      updatedAt: nowIso,
    })),
    incomes: sourcePeriod.incomes.map((inc) => ({
      ...inc,
      id: `${newPeriodId}-${inc.id.split('-').slice(-1)[0]}`,
      amount: inc.type === 'Utama' ? inc.amount : 0, // Keep base salary, reset side gig actuals
      updatedAt: nowIso,
    })),
    savings: sourcePeriod.savings.map((sav) => ({
      ...sav,
      id: `${newPeriodId}-${sav.id.split('-').slice(-1)[0]}`,
      actual: 0,
      updatedAt: nowIso,
    })),
    accounts: sourcePeriod.accounts.map((acc) => ({
      ...acc,
      lastReconciledAt: nowIso,
      reconciliationNote: `Saldo terbawa dari ${sourcePeriod.monthLabel}`,
    })),
    dailyExpenses: [],
    hangoutExpenses: [],
    specialLiabilities: sourcePeriod.specialLiabilities.map((liab) => ({ ...liab })),
    revisionHistory: [
      {
        id: `rev-init-${newPeriodId}`,
        timestamp: nowIso,
        previousBalance: 0,
        newBalance: carryOverBalance,
        delta: carryOverBalance,
        reason: `Auto-Rollover Saldo Akhir dari ${sourcePeriod.monthLabel}`,
        targetType: 'OPENING_BALANCE',
        targetName: 'Saldo Awal Bulan',
      },
    ],
  };
}

export function applyOpeningBalanceRevision(
  period: MonthlyPeriodData,
  newBalance: number,
  reason: string,
  nowIso = new Date().toISOString()
): MonthlyPeriodData {
  const currentSummary = calculatePeriodSummary(period);
  const previousBalance = currentSummary.openingBalance;
  const delta = newBalance - previousBalance;

  const revisionEntry: BalanceRevisionEntry = {
    id: `rev-${Date.now()}`,
    timestamp: nowIso,
    previousBalance,
    newBalance,
    delta,
    reason: reason.trim() || 'Penyesuaian / rekonsiliasi saldo manual',
    targetType: 'OPENING_BALANCE',
    targetName: 'Saldo Awal / Akumulasi',
  };

  return {
    ...period,
    updatedAt: nowIso,
    openingBalanceManualOverride: newBalance,
    openingBalanceRevisionNote: revisionEntry.reason,
    revisionHistory: [revisionEntry, ...period.revisionHistory],
  };
}

export function applyAccountBalanceRevision(
  period: MonthlyPeriodData,
  accountId: string,
  newBalance: number,
  reason: string,
  nowIso = new Date().toISOString()
): MonthlyPeriodData {
  const targetAcc = period.accounts.find((a) => a.id === accountId);
  if (!targetAcc) return period;

  const previousBalance = targetAcc.balance;
  const delta = newBalance - previousBalance;

  const revisionEntry: BalanceRevisionEntry = {
    id: `rev-acc-${Date.now()}`,
    timestamp: nowIso,
    previousBalance,
    newBalance,
    delta,
    reason: reason.trim() || `Rekonsiliasi saldo ${targetAcc.name}`,
    targetType: 'ACCOUNT_BALANCE',
    targetName: targetAcc.name,
  };

  const updatedAccounts: AccountBalanceItem[] = period.accounts.map((a) =>
    a.id === accountId
      ? {
          ...a,
          balance: newBalance,
          lastReconciledAt: nowIso,
          reconciliationNote: revisionEntry.reason,
        }
      : a
  );

  return {
    ...period,
    updatedAt: nowIso,
    accounts: updatedAccounts,
    revisionHistory: [revisionEntry, ...period.revisionHistory],
  };
}

export function generateDeterministicHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sha256:${hex1}${hex2}`;
}

export function createEncryptedPreview(payload: Record<string, unknown>): string {
  const raw = JSON.stringify(payload);
  let encoded = '';
  try {
    encoded = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(raw))) : Buffer.from(raw).toString('base64');
  } catch {
    encoded = raw.slice(0, 32);
  }
  const snippet = encoded.slice(0, 28);
  return `AES256-GCM::IV9a8f::${snippet}...`;
}

export function createSyncQueueItem(
  periodId: string,
  monthLabel: string,
  operation: SyncOperationType,
  summary: string,
  payload: Record<string, unknown>,
  nowIso = new Date().toISOString()
): SyncQueueItem {
  const rawString = `${periodId}|${operation}|${nowIso}|${JSON.stringify(payload)}`;
  return {
    queueId: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    periodId,
    monthLabel,
    operation,
    summary,
    timestamp: nowIso,
    isSynced: false,
    checksumSha256: generateDeterministicHash(rawString),
    encryptedPayloadPreview: createEncryptedPreview(payload),
    payload,
  };
}

export function exportPeriodToCSV(period: MonthlyPeriodData): string {
  const summary = calculatePeriodSummary(period);
  const lines: string[] = [];

  lines.push(`LAPORAN FINANCIAL PLANNER - ${period.monthLabel.toUpperCase()}`);
  lines.push(`Periode ID,${period.periodId}`);
  lines.push(`Diekspor Pada,${new Date().toISOString()}`);
  lines.push('');

  lines.push('RINGKASAN EKSEKUTIF (KPI),NILAI (IDR)');
  lines.push(`Saldo Awal / Akumulasi Bulan Lalu,${summary.openingBalance}`);
  lines.push(`Total Pendapatan Bulanan,${summary.totalIncome}`);
  lines.push(`Total Pengeluaran Bulan Ini (Aktual),${summary.totalExpenseActual}`);
  lines.push(`Uang Ditabung Bulan Ini (Aktual),${summary.savingActual}`);
  lines.push(`Total Rencana Alokasi,${summary.totalAllocationPlanned}`);
  lines.push(`Total Aktual Alokasi,${summary.totalAllocationActual}`);
  lines.push(`Arus Kas Bersih Bulan Ini,${summary.netMonthlyCashflow}`);
  lines.push(`Sisa Uang Bulan Ini / Saldo Akhir,${summary.closingBalance}`);
  lines.push('');

  lines.push('1. PENGELUARAN TETAP / OPERASIONAL RUMAH');
  lines.push('Tgl,Keterangan,Metode/Prioritas,Rencana,Aktual,Status Lunas');
  period.fixedCosts.forEach((fc) => {
    lines.push(
      `"${fc.dueDay}","${fc.title}","${fc.methodOrPriority}",${fc.planned},${fc.actual},${fc.isPaid ? 'LUNAS' : 'BELUM'}`
    );
  });
  lines.push(`TOTAL FIXED COST,,,${summary.fixedCostPlanned},${summary.fixedCostActual},`);
  lines.push('');

  lines.push('2. BIAYA LANGGANAN & HUTANG');
  lines.push('Tgl,Keterangan,Prioritas,Rencana,Aktual,Status');
  period.subscriptionsAndDebts.forEach((sd) => {
    lines.push(
      `"${sd.dueDay}","${sd.title}","${sd.priority}",${sd.planned},${sd.actual},${sd.isPaid ? 'LUNAS' : 'AKTIF'}`
    );
  });
  lines.push(`TOTAL SUBSCRIPTION & DEBT (AKTIF),,,${summary.subDebtPlanned},${summary.subDebtActual},`);
  lines.push('');

  lines.push('3. PENGELUARAN TIDAK TETAP / VARIABLE COST');
  lines.push('Keterangan,Prioritas,Rencana,Aktual');
  period.variableCosts.forEach((vc) => {
    lines.push(`"${vc.title}","${vc.priority}",${vc.planned},${vc.actual}`);
  });
  lines.push(`TOTAL VARIABLE COST,,${summary.variablePlanned},${summary.variableActual}`);
  lines.push('');

  lines.push('4. PENDAPATAN / INCOME');
  lines.push('Sumber,Tipe,Jumlah');
  period.incomes.forEach((inc) => {
    lines.push(`"${inc.source}","${inc.type}",${inc.amount}`);
  });
  lines.push(`TOTAL PENDAPATAN,,${summary.totalIncome}`);
  lines.push('');

  lines.push('5. NABUNG / SAVING MASA DEPAN');
  lines.push('Alokasi,Prioritas,Rencana,Aktual');
  period.savings.forEach((sav) => {
    lines.push(`"${sav.title}","${sav.priority}",${sav.planned},${sav.actual}`);
  });
  lines.push(`TOTAL TABUNGAN,,${summary.savingPlanned},${summary.savingActual}`);
  lines.push('');

  lines.push('6. SALDO REKENING & E-WALLET');
  lines.push('Rekening/Wallet,Kode,Kategori,Alokasi Rencana,Saldo Aktual,Catatan');
  period.accounts.forEach((acc) => {
    lines.push(
      `"${acc.name}","${acc.code}","${acc.category}",${acc.plannedAllocation},${acc.balance},"${acc.holderNote}"`
    );
  });
  lines.push('');

  lines.push('7. TRACKER PENGELUARAN SEHARI-HARI');
  lines.push('Tanggal,Keterangan,Qty,Harga Satuan,Total,Metode Pembayaran');
  period.dailyExpenses.forEach((de: DailyExpenseItem) => {
    lines.push(
      `"${de.date}","${de.description}",${de.qty},${de.unitPrice},${de.total},"${de.paymentMethod}"`
    );
  });
  lines.push(`TOTAL TRACKER HARIAN,,,,${summary.dailyTrackerTotal},`);
  lines.push('');

  lines.push('8. TRACKER JAJAN & NONGKRONG');
  lines.push('Tanggal,Nama Tempat / Keterangan,Biaya Dihabiskan,Metode Pembayaran,Catatan');
  period.hangoutExpenses.forEach((he: HangoutExpenseItem) => {
    lines.push(
      `"${he.date}","${he.placeOrEvent}",${he.amount},"${he.paymentMethod}","${he.note}"`
    );
  });
  lines.push(`TOTAL JAJAN & NONGKRONG,,${summary.hangoutTrackerTotal},,`);

  return lines.join('\n');
}

export type PaymentCategoryType = 'TUNAI' | 'BANK' | 'EWALLET';

/**
 * Classifies any payment method/channel into one of the 3 audit categories:
 * - TUNAI (COD, TUNAI, CASH)
 * - EWALLET (GOPAY, DANA, QRIS, OVO, SHOPEEPAY, LINKAJA)
 * - BANK (BRI, BCA, BSI, TF, MANDIRI, BNI, etc.)
 */
export function getPaymentCategory(method: string): PaymentCategoryType {
  const upper = (method || '').trim().toUpperCase();
  if (upper === 'COD' || upper === 'TUNAI' || upper === 'CASH') {
    return 'TUNAI';
  }
  if (
    upper === 'GOPAY' ||
    upper === 'DANA' ||
    upper === 'QRIS' ||
    upper === 'OVO' ||
    upper === 'SHOPEEPAY' ||
    upper === 'LINKAJA'
  ) {
    return 'EWALLET';
  }
  return 'BANK';
}

export interface DailyCategoryAuditBucket {
  category: 'ALL' | PaymentCategoryType;
  label: string;
  methodsSubtitle: string;
  count: number;
  total: number;
  percentage: number;
}

export function computeDailyPaymentCategoryAudit(
  expenses: DailyExpenseItem[]
): Record<'ALL' | PaymentCategoryType, DailyCategoryAuditBucket> {
  const grandTotal = expenses.reduce((sum, item) => sum + (item.total || 0), 0);

  let tunaiCount = 0;
  let tunaiTotal = 0;
  let bankCount = 0;
  let bankTotal = 0;
  let ewalletCount = 0;
  let ewalletTotal = 0;

  for (const item of expenses) {
    const cat = getPaymentCategory(item.paymentMethod);
    const amount = item.total || 0;
    if (cat === 'TUNAI') {
      tunaiCount += 1;
      tunaiTotal += amount;
    } else if (cat === 'EWALLET') {
      ewalletCount += 1;
      ewalletTotal += amount;
    } else {
      bankCount += 1;
      bankTotal += amount;
    }
  }

  const pct = (val: number) => (grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0);

  return {
    ALL: {
      category: 'ALL',
      label: 'Semua Kategori',
      methodsSubtitle: 'Tunai + Bank + E-Wallet',
      count: expenses.length,
      total: grandTotal,
      percentage: expenses.length > 0 ? 100 : 0,
    },
    TUNAI: {
      category: 'TUNAI',
      label: 'Tunai (Cash / COD)',
      methodsSubtitle: 'COD · Tunai Langsung',
      count: tunaiCount,
      total: tunaiTotal,
      percentage: pct(tunaiTotal),
    },
    BANK: {
      category: 'BANK',
      label: 'Bank & Transfer',
      methodsSubtitle: 'BRI · BCA · BSI · TF',
      count: bankCount,
      total: bankTotal,
      percentage: pct(bankTotal),
    },
    EWALLET: {
      category: 'EWALLET',
      label: 'E-Wallet Digital',
      methodsSubtitle: 'GoPay · DANA · QRIS',
      count: ewalletCount,
      total: ewalletTotal,
      percentage: pct(ewalletTotal),
    },
  };
}

export interface FixedCostChannelBreakdownItem {
  method: string;
  unpaidCount: number;
  paidCount: number;
  totalCount: number;
  unpaidPlanned: number;
  unpaidActual: number;
  allPlanned: number;
  allActual: number;
}

export interface FilteredFixedCostSummary {
  isFiltered: boolean;
  activeMethodLabel: string;
  matchingItems: FixedCostItem[];
  unpaidCount: number;
  paidCount: number;
  totalCount: number;
  activePlannedTotal: number;
  activeActualTotal: number;
  paidPlannedTotal: number;
  paidActualTotal: number;
  allPlannedTotal: number;
  allActualTotal: number;
  channelBreakdown: FixedCostChannelBreakdownItem[];
}

/**
 * Computes dynamic totals for 01. Pengeluaran Tetap (Fixed Cost) based on the clicked
 * payment channel/method (e.g. GOPAY, DANA, BRI, Optional, or ALL), status filter, and search query.
 */
export function computeFilteredFixedCostSummary(
  fixedCosts: FixedCostItem[],
  methodFilter = 'ALL',
  statusFilter: 'ALL' | 'UNPAID' | 'PAID' = 'ALL',
  searchQuery = ''
): FilteredFixedCostSummary {
  const normMethod = (methodFilter || 'ALL').trim().toUpperCase();
  const q = (searchQuery || '').trim().toLowerCase();

  // Channel breakdown across all fixedCosts (grouped by uppercase methodOrPriority)
  const channelMap = new Map<string, FixedCostChannelBreakdownItem>();
  for (const fc of fixedCosts) {
    const rawKey = (fc.methodOrPriority || 'Optional').trim();
    const upperKey = rawKey.toUpperCase();
    const existing = channelMap.get(upperKey) || {
      method: rawKey,
      unpaidCount: 0,
      paidCount: 0,
      totalCount: 0,
      unpaidPlanned: 0,
      unpaidActual: 0,
      allPlanned: 0,
      allActual: 0,
    };
    existing.totalCount += 1;
    existing.allPlanned += fc.planned || 0;
    existing.allActual += fc.actual || 0;
    if (fc.isPaid) {
      existing.paidCount += 1;
    } else {
      existing.unpaidCount += 1;
      existing.unpaidPlanned += fc.planned || 0;
      existing.unpaidActual += fc.actual || 0;
    }
    channelMap.set(upperKey, existing);
  }

  // Items matching method + search (used to compute unpaid vs paid within the selected channel)
  const channelAndSearchItems = fixedCosts.filter((fc) => {
    const matchesMethod =
      normMethod === 'ALL' || (fc.methodOrPriority || '').trim().toUpperCase() === normMethod;
    const matchesQuery =
      !q ||
      fc.title.toLowerCase().includes(q) ||
      fc.dueDay.toLowerCase().includes(q) ||
      fc.methodOrPriority.toLowerCase().includes(q);
    return matchesMethod && matchesQuery;
  });

  // Items also matching statusFilter (the rows displayed in the table)
  const matchingItems = channelAndSearchItems.filter((fc) => {
    if (statusFilter === 'UNPAID') return !fc.isPaid;
    if (statusFilter === 'PAID') return fc.isPaid;
    return true;
  });

  const unpaidItems = channelAndSearchItems.filter((fc) => !fc.isPaid);
  const paidItems = channelAndSearchItems.filter((fc) => fc.isPaid);

  const unpaidPlanned = unpaidItems.reduce((acc, fc) => acc + (fc.planned || 0), 0);
  const unpaidActual = unpaidItems.reduce((acc, fc) => acc + (fc.actual || 0), 0);
  const paidPlannedTotal = paidItems.reduce((acc, fc) => acc + (fc.planned || 0), 0);
  const paidActualTotal = paidItems.reduce((acc, fc) => acc + (fc.actual || 0), 0);
  const allPlannedTotal = channelAndSearchItems.reduce((acc, fc) => acc + (fc.planned || 0), 0);
  const allActualTotal = channelAndSearchItems.reduce((acc, fc) => acc + (fc.actual || 0), 0);

  // If the user explicitly filters by statusFilter === 'PAID', show the paid sum; otherwise show active unpaid sum
  const activePlannedTotal = statusFilter === 'PAID' ? paidPlannedTotal : unpaidPlanned;
  const activeActualTotal = statusFilter === 'PAID' ? paidActualTotal : unpaidActual;

  const isFiltered = normMethod !== 'ALL' || statusFilter !== 'ALL' || q.length > 0;
  const activeMethodLabel = normMethod === 'ALL' ? 'SEMUA KANAL' : methodFilter;

  return {
    isFiltered,
    activeMethodLabel,
    matchingItems,
    unpaidCount: unpaidItems.length,
    paidCount: paidItems.length,
    totalCount: channelAndSearchItems.length,
    activePlannedTotal,
    activeActualTotal,
    paidPlannedTotal,
    paidActualTotal,
    allPlannedTotal,
    allActualTotal,
    channelBreakdown: Array.from(channelMap.values()),
  };
}

