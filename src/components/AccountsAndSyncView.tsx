import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Check,
  Cloud,
  Code2,
  Copy,
  CreditCard,
  Database,
  Download,
  Edit3,
  Eye,
  FolderOpen,
  History,
  Lock,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AccountBalanceItem,
  CloudSyncConfig,
  MonthlyPeriodData,
  PeriodFinancialSummary,
  SyncQueueItem,
} from '../types/finance';
import { formatCompactIDR, formatIDR } from '../utils/calculations';
import {
  GAS_INDEX_HTML_CODE,
  GOOGLE_APPS_SCRIPT_CODE,
  KOTLIN_CLEAN_ARCH_CODE,
  SWAGGER_OPENAPI_SPEC,
} from '../data/architectureBlueprints';
import { AndroidAndHostingGuide } from './AndroidAndHostingGuide';
import { ActionPopupData } from './Modals';

interface AccountsAndSyncViewProps {
  period: MonthlyPeriodData;
  summary: PeriodFinancialSummary;
  syncQueue: SyncQueueItem[];
  syncConfig: CloudSyncConfig;
  isSyncing: boolean;
  onUpdateSyncConfig: (partial: Partial<CloudSyncConfig>) => void;
  onTriggerSyncNow: () => void;
  onOpenReviseOpeningBalance: () => void;
  onReviseAccountBalance: (accountId: string, newBalance: number, reason: string) => void;
  onExportCSV: () => void;
  onPrintPDF: () => void;
  onTriggerPopup?: (
    status: ActionPopupData['status'],
    commandLabel: string,
    title: string,
    message: string
  ) => void;
}

export const AccountsAndSyncView: React.FC<AccountsAndSyncViewProps> = ({
  period,
  summary,
  syncQueue,
  syncConfig,
  isSyncing,
  onUpdateSyncConfig,
  onTriggerSyncNow,
  onOpenReviseOpeningBalance,
  onReviseAccountBalance,
  onExportCSV,
  onPrintPDF,
  onTriggerPopup,
}) => {
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [newAccBalance, setNewAccBalance] = useState<string>('');
  const [accReason, setAccReason] = useState<string>('');

  const [activeCodeTab, setActiveCodeTab] = useState<'GAS' | 'HTML' | 'KOTLIN' | 'SWAGGER'>('GAS');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // 3D Animated Traffic & Comparison State
  const [animateBars, setAnimateBars] = useState(false);
  const [trafficFilter, setTrafficFilter] = useState<'ALL' | 'BANK' | 'EWALLET'>('ALL');
  const [hoveredTrafficIdx, setHoveredTrafficIdx] = useState<number | null>(null);
  const [tilt3D, setTilt3D] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [showRawDbPreview, setShowRawDbPreview] = useState(false);

  useEffect(() => {
    setAnimateBars(false);
    const timer = setTimeout(() => setAnimateBars(true), 60);
    return () => clearTimeout(timer);
  }, [period.periodId, summary.totalAllAccountsBalance, trafficFilter]);

  const pendingQueueCount = syncQueue.filter((q) => !q.isSynced).length;

  const filteredTrafficAccounts = period.accounts.filter((a) =>
    trafficFilter === 'ALL' ? true : a.category === trafficFilter
  );

  const totalPlannedAccounts = period.accounts.reduce(
    (acc, item) => acc + (item.plannedAllocation || 0),
    0
  );
  const maxAccountBarVal = Math.max(
    1,
    summary.totalAllAccountsBalance,
    totalPlannedAccounts,
    ...period.accounts.flatMap((a) => [a.balance, a.plannedAllocation])
  );

  const startEditAccount = (acc: AccountBalanceItem) => {
    setEditingAccId(acc.id);
    setNewAccBalance(String(acc.balance));
    setAccReason(acc.reconciliationNote || '');
  };

  const handleCancelAccount = (acc: AccountBalanceItem) => {
    setEditingAccId(null);
    onTriggerPopup?.(
      'CANCELLED',
      'BATAL REVISI REKENING (CANCEL)',
      'Revisi Saldo Rekening Dibatalkan',
      `Perubahan saldo pada rekening "${acc.name}" telah dibatalkan. Saldo tetap menggunakan nilai semula (${formatIDR(
        acc.balance
      )}).`
    );
  };

  const handleSaveAccount = (accountId: string) => {
    const targetAcc = period.accounts.find((a) => a.id === accountId);
    const val = Number(newAccBalance);
    if (!Number.isFinite(val) || val < 0) {
      onTriggerPopup?.(
        'ERROR',
        'SIMPAN SALDO REKENING',
        'Gagal Menyimpan Saldo',
        'Nominal saldo rekening harus berupa angka yang valid.'
      );
      return;
    }
    const reasonText = accReason.trim() || 'Penyesuaian saldo rekening via Rekonsiliasi Manual';
    onReviseAccountBalance(accountId, val, reasonText);
    setEditingAccId(null);
    onTriggerPopup?.(
      'REVISED',
      'SIMPAN REVISI SALDO',
      `Saldo ${targetAcc?.name || 'Rekening'} Berhasil Direvisi`,
      `Saldo aktual "${targetAcc?.name || accountId}" berhasil diperbarui menjadi ${formatIDR(
        val
      )} dengan catatan: "${reasonText}".`
    );
  };

  const handleDownloadJsonVault = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      ownerEmail: 'itptgaramofficial@gmail.com',
      googleDriveAppsScriptEndpoint: syncConfig.appsScriptUrl,
      activePeriod: period,
      summary,
      syncQueue,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DATABASE_VAULT_${period.periodId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onTriggerPopup?.(
      'SUCCESS',
      'UNDUH DATABASE MANUAL',
      'Database JSON Cloud Vault Berhasil Diunduh',
      `Salinan lengkap database (${period.monthLabel}) telah diunduh sebagai berkas "DATABASE_VAULT_${period.periodId}.json".`
    );
  };

  const handleCopyCode = (code: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedTab(label);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const currentCodeContent =
    activeCodeTab === 'GAS'
      ? GOOGLE_APPS_SCRIPT_CODE
      : activeCodeTab === 'HTML'
      ? GAS_INDEX_HTML_CODE
      : activeCodeTab === 'KOTLIN'
      ? KOTLIN_CLEAN_ARCH_CODE
      : SWAGGER_OPENAPI_SPEC;

  return (
    <div className="space-y-6">
      {/* SECTION 1: PANEL SALDO REKENING BANK & E-WALLET + FITUR REVISI SALDO */}
      <section className="rounded-3xl liquid-glass-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Panel Saldo Rekening Bank & E-Wallet ({period.monthLabel})
              </h2>
              <p className="text-xs text-slate-300">
                Rekonsiliasi saldo riil di Bank BSI, BRI, BCA, GoPay & DANA kapan saja (Offline maupun Online)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenReviseOpeningBalance}
              className="px-3.5 py-2 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-medium flex items-center gap-1.5 liquid-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Revisi Saldo Awal Bulan ({formatIDR(summary.openingBalance)})</span>
            </button>
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-2xl liquid-glass-inset hover:border-emerald-400/40 text-slate-100 text-xs font-medium flex items-center gap-1.5 liquid-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={onPrintPDF}
              className="px-3.5 py-2 rounded-2xl liquid-glass-inset hover:border-emerald-400/40 text-slate-100 text-xs font-medium flex items-center gap-1.5 liquid-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {period.accounts.map((acc) => {
            const isEditing = editingAccId === acc.id;
            return (
              <div
                key={acc.id}
                className="rounded-2xl liquid-glass-inset hover:border-emerald-400/30 transition-all p-4 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {acc.category} · {acc.code}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{acc.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEditAccount(acc)}
                      aria-label={`Sesuaikan saldo ${acc.name}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Revisi</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{acc.holderNote}</p>
                </div>

                {isEditing ? (
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Saldo Aktual Baru (Rp)
                      </label>
                      <input
                        type="number"
                        value={newAccBalance}
                        onChange={(e) => setNewAccBalance(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Catatan Rekonsiliasi
                      </label>
                      <input
                        type="text"
                        value={accReason}
                        onChange={(e) => setAccReason(e.target.value)}
                        placeholder="Contoh: Sesuai mutasi m-Banking"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancelAccount(acc)}
                        className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-amber-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveAccount(acc.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                      >
                        Simpan Saldo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">SALDO RIIL SAAT INI</span>
                      <span className="text-lg font-bold font-mono tabular-nums text-slate-100">
                        {formatIDR(acc.balance)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">RENCANA POS</span>
                      <span className="text-xs font-mono tabular-nums text-slate-300">
                        {formatIDR(acc.plannedAllocation)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 6th Card: Ringkasan Likuiditas & Cadangan Tabungan */}
          <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-4 flex flex-col justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-emerald-400">
                REKAP LIKUIDITAS · 5 KANAL AKTIF
              </span>
              <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                Total Kas Rekening & E-Wallet
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Gabungan seluruh saldo Bank (BSI, BRI, BCA) dan dompet digital (GoPay, DANA)
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">TOTAL LIKUIDITAS</span>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                  {formatIDR(summary.totalAllAccountsBalance)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">ALOKASI TABUNGAN</span>
                <span className="text-xs font-mono tabular-nums text-amber-300">
                  {formatIDR(summary.savingActual)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================
            NEW: 3D ANIMATED TRAFFIC & PERBANDINGAN RENCANA VS SALDO AKTUAL REKENING
            ======================================================================== */}
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
            const ny = 0.5 - (e.clientY - rect.top) / rect.height;
            setTilt3D({ rx: ny * 5, ry: nx * 5 });
          }}
          onMouseLeave={() => setTilt3D({ rx: 0, ry: 0 })}
          style={{
            transform: `perspective(1200px) rotateX(${tilt3D.rx}deg) rotateY(${tilt3D.ry}deg)`,
            transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          data-testid="accounts-3d-traffic-panel"
          className="mt-6 rounded-3xl liquid-glass-inset border border-emerald-400/25 p-5 sm:p-6 space-y-5 relative overflow-hidden preserve-3d shadow-2xl"
        >
          {/* Ambient 3D Traffic Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl"
          />

          {/* Header & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/20 to-indigo-500/25 border border-emerald-400/35 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Trafik Likuiditas 3D &amp; Perbandingan Rencana vs Saldo Aktual Rekening
                </h3>
                <p className="text-xs text-slate-300">
                  Visualisasi trafik bar bergerak 3D untuk membandingkan Rencana Pos vs Saldo Riil ({period.monthLabel})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {(['ALL', 'BANK', 'EWALLET'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTrafficFilter(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      trafficFilter === tf
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf === 'ALL' ? 'Semua Kanal (5)' : tf === 'BANK' ? 'Bank (3)' : 'E-Wallet (2)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3D Animated Total Traffic Wave & Distribution Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative z-10">
            {/* Left 7 Cols: Animated Dual Bar Comparison (Rencana Pos vs Saldo Aktual) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-white">
                  Grafik Trafik Rencana Pos vs Saldo Aktual
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />
                    <span>Rencana Pos</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                    <span>Saldo Aktual</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {filteredTrafficAccounts.map((acc, idx) => {
                  const plannedPct = animateBars
                    ? Math.min(100, Math.max(4, Math.round((acc.plannedAllocation / maxAccountBarVal) * 100)))
                    : 0;
                  const actualPct = animateBars
                    ? Math.min(100, Math.max(4, Math.round((acc.balance / maxAccountBarVal) * 100)))
                    : 0;
                  const ratioPct =
                    acc.plannedAllocation > 0
                      ? Math.round((acc.balance / acc.plannedAllocation) * 100)
                      : acc.balance > 0
                      ? 100
                      : 0;
                  const shareOfTotal =
                    summary.totalAllAccountsBalance > 0
                      ? Math.round((acc.balance / summary.totalAllAccountsBalance) * 100)
                      : 0;
                  const isSurplusAcc = acc.balance >= acc.plannedAllocation;

                  return (
                    <div
                      key={acc.id}
                      onMouseEnter={() => setHoveredTrafficIdx(idx)}
                      onMouseLeave={() => setHoveredTrafficIdx(null)}
                      className={`p-3.5 rounded-2xl transition-all ${
                        hoveredTrafficIdx === idx
                          ? 'bg-slate-900/90 border border-emerald-400/40 translate-x-1'
                          : 'bg-slate-950/65 border border-white/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{acc.name}</span>
                          <span className="font-mono text-[11px] text-emerald-400">
                            ({ratioPct}% dari Rencana · {shareOfTotal}% Trafik Kas)
                          </span>
                        </div>
                        <div className="font-mono tabular-nums text-xs">
                          <span className="text-slate-400">
                            Rencana: {formatCompactIDR(acc.plannedAllocation)}
                          </span>
                          <span className="mx-1.5 text-slate-600">·</span>
                          <strong className={isSurplusAcc ? 'text-emerald-400' : 'text-amber-300'}>
                            Aktual: {formatIDR(acc.balance)}
                          </strong>
                        </div>
                      </div>

                      {/* Dual Animated 3D Bars */}
                      <div className="space-y-1.5">
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            style={{ width: `${plannedPct}%` }}
                            className="h-full rounded-full bg-slate-500/80 transition-all duration-700"
                          />
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden shadow-inner">
                          <div
                            style={{ width: `${actualPct}%` }}
                            className={`h-full rounded-full liquid-bar-fill bg-gradient-to-r ${
                              acc.category === 'BANK'
                                ? 'from-emerald-500 via-teal-400 to-cyan-400'
                                : 'from-sky-500 via-cyan-400 to-indigo-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: 3D Total Animated Wave & Grand Total Comparison */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-950/85 border border-white/10 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>TOTAL TRAFIK LIKUIDITAS 3D</span>
                  </span>
                  <span>100% REAL-TIME</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums bg-gradient-to-r from-white via-emerald-300 to-cyan-300 bg-clip-text text-transparent pt-1">
                  {formatIDR(summary.totalAllAccountsBalance)}
                </p>
                <p className="text-xs text-slate-400">
                  Total Rencana Alokasi Rekening: {formatIDR(totalPlannedAccounts)} (
                  {totalPlannedAccounts > 0
                    ? Math.round((summary.totalAllAccountsBalance / totalPlannedAccounts) * 100)
                    : 100}
                  % Terpenuhi)
                </p>
              </div>

              {/* Animated 3D SVG Traffic Wave */}
              <div className="rounded-xl bg-slate-900/75 border border-white/10 p-3">
                <svg
                  viewBox="0 0 360 110"
                  className="w-full h-24 overflow-visible"
                  role="img"
                  aria-label="Grafik Gelombang 3D Trafik Saldo Rekening"
                >
                  <defs>
                    <linearGradient id="trafficWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="trafficAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.38)" />
                      <stop offset="100%" stopColor="rgba(6, 182, 212, 0.0)" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 10 92 Q 55 18, 100 45 T 190 35 T 280 55 T 350 24 L 350 100 L 10 100 Z"
                    fill="url(#trafficAreaGrad)"
                  />
                  <path
                    d="M 10 92 Q 55 18, 100 45 T 190 35 T 280 55 T 350 24"
                    fill="none"
                    stroke="url(#trafficWaveGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {period.accounts.map((acc, i) => {
                    const cx = 20 + i * 78;
                    const cy =
                      90 -
                      Math.min(
                        68,
                        Math.round((acc.balance / Math.max(1, maxAccountBarVal)) * 68)
                      );
                    return (
                      <g key={acc.id}>
                        <circle cx={cx} cy={cy} r="5" fill="#10b981" />
                        <text
                          x={cx}
                          y={104}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {acc.code}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Distribution Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Trafik Kas Bank (BSI + BRI + BCA)</span>
                  <strong className="text-emerald-400">{formatIDR(summary.totalBankBalance)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Trafik E-Wallet (GoPay + DANA)</span>
                  <strong className="text-sky-400">{formatIDR(summary.totalEwalletBalance)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cadangan Tabungan Masa Depan</span>
                  <strong className="text-amber-300">{formatIDR(summary.savingActual)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-400">Total Kas Bank (BCA + BRI + BSI): </span>
            <strong className="text-emerald-400">{formatIDR(summary.totalBankBalance)}</strong>
          </div>
          <div>
            <span className="text-slate-400">Total Saldo E-Wallet (GoPay + DANA): </span>
            <strong className="text-sky-400">{formatIDR(summary.totalEwalletBalance)}</strong>
          </div>
          <div>
            <span className="text-slate-400">Total Gabungan Seluruh Rekening: </span>
            <strong className="text-amber-300 text-sm">{formatIDR(summary.totalAllAccountsBalance)}</strong>
          </div>
        </div>
      </section>

      {/* SECTION 1B: LOKASI DATABASE MANUAL (GOOGLE DRIVE SPREADSHEET & CLOUD VAULT INSPECTOR) */}
      <section
        data-testid="database-location-panel"
        className="rounded-3xl liquid-glass-interactive p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Lokasi Penyimpanan Database &amp; Akses Pemeriksaan Manual (Google Drive &amp; Cloud Vault)
              </h2>
              <p className="text-xs text-slate-300">
                Panduan lokasi fisik database Anda untuk dilihat secara manual di Google Drive (`itptgaramofficial@gmail.com`) maupun diunduh langsung
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawDbPreview((prev) => !prev)}
              className="px-3.5 py-2 rounded-2xl liquid-glass-inset hover:border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showRawDbPreview ? 'Sembunyikan Isi Database' : 'Lihat Isi Database Manual'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadJsonVault}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Database (.JSON)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl liquid-glass-inset space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <FolderOpen className="w-4 h-4" />
              <span>1. Di Google Drive Anda (Cloud)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Login ke <strong>drive.google.com</strong> dengan akun{' '}
              <span className="font-mono text-emerald-300">itptgaramofficial@gmail.com</span>, lalu
              buka file Google Sheets <strong>FINANCIAL PLANNER</strong> &amp;{' '}
              <strong>DATA UPROVE LOG IN</strong> yang terhubung ke Apps Script Web App.
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-inset space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>2. Di Server Cloud Vault Aplikasi</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Tersimpan otomatis secara persisten pada file{' '}
              <span className="font-mono text-cyan-300">/.data/finplanner-cloud-vault.json</span>{' '}
              serta master CSV{' '}
              <span className="font-mono text-cyan-300">
                /public/assets/aistudio/FINANCIAL_PLANNER_4b47ce17.csv
              </span>
              .
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-inset space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Download className="w-4 h-4" />
              <span>3. Di Perangkat Anda (Local &amp; Excel)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Tersimpan di LocalStorage terenkripsi (`aurelia_finplanner_periods_v2`) dan dapat
              dibuka manual di Microsoft Excel menggunakan tombol <strong>Ekspor CSV / .XLSX</strong>.
            </p>
          </div>
        </div>

        {showRawDbPreview && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span>LIVE INSPECTOR: /.data/finplanner-cloud-vault.json ({period.monthLabel})</span>
              <span>{period.dailyExpenses.length} Transaksi · {period.accounts.length} Rekening</span>
            </div>
            <pre className="text-[11px] font-mono text-slate-200 max-h-64 overflow-y-auto leading-relaxed">
              {JSON.stringify(
                {
                  periodId: period.periodId,
                  monthLabel: period.monthLabel,
                  summary: {
                    totalIncome: summary.totalIncome,
                    totalExpenseActual: summary.totalExpenseActual,
                    savingActual: summary.savingActual,
                    closingBalance: summary.closingBalance,
                    totalAllAccountsBalance: summary.totalAllAccountsBalance,
                  },
                  accounts: period.accounts,
                  dailyExpensesSample: period.dailyExpenses.slice(0, 5),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </section>

      {/* SECTION 2: KONFIGURASI AUTO-SYNC GOOGLE DRIVE & ANTREAN SINKRONISASI OFFLINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Konfigurasi Endpoint Google Apps Script & Network Simulator */}
        <section className="lg:col-span-5 rounded-3xl liquid-glass-interactive p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">
                  Koneksi Google Sheets & Offline Engine
                </h2>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Simulasi Mode Offline / Online Toggle untuk Pengujian */}
            <div className="p-4 rounded-2xl liquid-glass-inset flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {syncConfig.simulateOfflineMode ? (
                  <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    {syncConfig.simulateOfflineMode
                      ? 'Mode Offline Aktif (Tanpa Internet)'
                      : 'Terhubung ke Jaringan (Auto-Sync Aktif)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {syncConfig.simulateOfflineMode
                      ? 'Perubahan disimpan di LocalDB & masuk ke Sync Queue'
                      : 'Begitu online, antrean otomatis dikirim ke Google Sheets'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onUpdateSyncConfig({ simulateOfflineMode: !syncConfig.simulateOfflineMode })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  syncConfig.simulateOfflineMode
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                }`}
              >
                {syncConfig.simulateOfflineMode ? 'Hubungkan Online' : 'Uji Mode Offline'}
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl liquid-glass-inset space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Database Cloud:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    Terhubung Otomatis (Aktif)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Endpoint Apps Script:</span>
                  <span className="font-mono text-emerald-300 truncate max-w-[220px]" title={syncConfig.appsScriptUrl}>
                    {syncConfig.appsScriptUrl}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Admin Email:</span>
                  <span className="font-mono text-emerald-300">itptgaramofficial@gmail.com</span>
                </div>
              </div>

              <div>
                <label htmlFor="gas-token-input" className="block text-xs text-slate-300 mb-1">
                  Enkripsi Keamanan Cloud Vault
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="gas-token-input"
                    type="text"
                    readOnly
                    value={syncConfig.apiSecretToken}
                    className="w-full pl-8 pr-3 py-2 rounded-xl liquid-glass-inset text-xs font-mono text-emerald-400 cursor-default"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              <span>Antrean Tertunda: </span>
              <strong className="font-mono text-amber-300">{pendingQueueCount} item</strong>
            </div>

            <button
              type="button"
              disabled={isSyncing || syncConfig.simulateOfflineMode}
              onClick={onTriggerSyncNow}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Sekarang ke Cloud'}</span>
            </button>
          </div>
        </section>

        {/* Right: Tabel Antrean Sinkronisasi (Sync Queue) & Log Revisi Saldo */}
        <section className="lg:col-span-7 rounded-3xl liquid-glass-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Antrean Sinkronisasi Lokal (Offline Sync Queue)
                  </h2>
                  <p className="text-xs text-slate-300">
                    Setiap perubahan data dicatat dengan timestamp, SHA-256 Checksum & enkripsi AES-256-GCM
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-300">
                Total Log: {syncQueue.length} Operasi
              </span>
            </div>

            {syncQueue.length === 0 ? (
              <div className="my-8 text-center py-8 border border-dashed border-white/15 rounded-2xl">
                <p className="text-xs text-slate-300">
                  Belum ada aktivitas perubahan baru. Semua data awal telah tersinkronisasi.
                </p>
              </div>
            ) : (
              <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-white/10 pr-1">
                {syncQueue.map((q) => (
                  <div key={q.queueId} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                          {q.operation}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{q.monthLabel}</span>
                      </div>
                      <p className="text-slate-100 font-medium truncate">{q.summary}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        {q.checksumSha256} · {q.encryptedPayloadPreview}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          q.isSynced ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {q.isSynced ? 'isSynced = true' : 'isSynced = false'}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {new Date(q.timestamp).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Riwayat Revisi Saldo */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-xs font-semibold text-slate-200 mb-2">
              Riwayat Rekonsiliasi & Revisi Saldo ({period.revisionHistory.length})
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
              {period.revisionHistory.slice(0, 4).map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between gap-2 text-[11px] text-slate-300 py-1 border-b border-white/5 last:border-b-0"
                >
                  <span className="truncate">
                    <strong className="text-white">{rev.targetName}:</strong> {rev.reason}
                  </span>
                  <span className="font-mono tabular-nums text-amber-300 shrink-0">
                    {formatIDR(rev.newBalance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 3: KODE BACKEND GOOGLE APPS SCRIPT (`Code.gs`), KOTLIN ANDROID & SWAGGER */}
      <section className="rounded-3xl liquid-glass-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Blueprint Kode Backend Google Apps Script (`Code.gs`), Kotlin Android & OpenAPI
              </h2>
              <p className="text-xs text-slate-400">
                Salin skrip `Code.gs` ke menu Extensions → Apps Script di Google Sheets Anda, lalu jalankan `setupDatabase()`
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCodeTab('GAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCodeTab === 'GAS'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Backend (Code.gs)
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('HTML')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCodeTab === 'HTML'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Frontend (index.html)
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('KOTLIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCodeTab === 'KOTLIN'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Kotlin Android
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('SWAGGER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCodeTab === 'SWAGGER'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                4. OpenAPI
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopyCode(currentCodeContent, activeCodeTab)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedTab === activeCodeTab ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step-by-step Setup Guide */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-emerald-400">Langkah 1: Pasang Code.gs</p>
            <p className="text-slate-400 mt-1">
              Buka Google Sheets Anda di Google Drive → klik <strong>Extensions &gt; Apps Script</strong> → tempel kode `Code.gs` di bawah lalu jalankan fungsi `setupDatabase()`.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-amber-300">Langkah 2: Deploy Web App</p>
            <p className="text-slate-400 mt-1">
              Klik <strong>Deploy &gt; New Deployment</strong> → pilih jenis <strong>Web App</strong>, atur <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-sky-400">Langkah 3: Hubungkan URL</p>
            <p className="text-slate-400 mt-1">
              Salin URL Web App (`https://script.google.com/macros/s/.../exec`) ke kolom konfigurasi di atas untuk mengaktifkan Auto-Sync 2 arah.
            </p>
          </div>
        </div>

        <pre className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
          <code>{currentCodeContent}</code>
        </pre>
      </section>

      {/* SECTION 4: ANDROID (.APK / .AAB) & RUMAHWEB (mrofiqi.id) HOSTING GUIDE */}
      <AndroidAndHostingGuide />
    </div>
  );
};
