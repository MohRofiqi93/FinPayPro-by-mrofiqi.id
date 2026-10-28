import React, { useState } from 'react';
import {
  ChevronDown,
  Coffee,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  DailyExpenseItem,
  HangoutExpenseItem,
  MonthlyPeriodData,
  PaymentMethod,
  PeriodFinancialSummary,
} from '../types/finance';
import {
  computeDailyExpenseTotal,
  computeDailyPaymentCategoryAudit,
  formatCompactIDR,
  formatIDR,
  getPaymentCategory,
  normalizeTrackerDateString,
  PaymentCategoryType,
  sortDailyExpensesChronologically,
  sortHangoutExpensesChronologically,
} from '../utils/calculations';
import { TrackerExportFormat, triggerTrackerExportDownload } from '../utils/exportFormats';
import { ActionPopupData } from './Modals';
import { Payment3DIcon } from './Payment3DIcon';

interface DailyTrackerViewProps {
  period: MonthlyPeriodData;
  summary: PeriodFinancialSummary;
  onAddDailyExpense: (item: Omit<DailyExpenseItem, 'id' | 'updatedAt'>) => void;
  onUpdateDailyExpense: (item: DailyExpenseItem) => void;
  onDeleteDailyExpense: (id: string) => void;
  onAddHangoutExpense: (item: Omit<HangoutExpenseItem, 'id' | 'updatedAt'>) => void;
  onUpdateHangoutExpense: (item: HangoutExpenseItem) => void;
  onDeleteHangoutExpense: (id: string) => void;
  onTriggerPopup?: (
    status: ActionPopupData['status'],
    commandLabel: string,
    title: string,
    message: string
  ) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['BRI', 'BCA', 'BSI', 'COD', 'TF', 'GOPAY', 'DANA'];

const MONTH_OPTIONS = [
  { value: '01', label: '01 - Jan' },
  { value: '02', label: '02 - Feb' },
  { value: '03', label: '03 - Mar' },
  { value: '04', label: '04 - Apr' },
  { value: '05', label: '05 - Mei' },
  { value: '06', label: '06 - Jun' },
  { value: '07', label: '07 - Jul' },
  { value: '08', label: '08 - Agu' },
  { value: '09', label: '09 - Sep' },
  { value: '10', label: '10 - Okt' },
  { value: '11', label: '11 - Nov' },
  { value: '12', label: '12 - Des' },
];

export const DailyTrackerView: React.FC<DailyTrackerViewProps> = ({
  period,
  summary,
  onAddDailyExpense,
  onUpdateDailyExpense,
  onDeleteDailyExpense,
  onAddHangoutExpense,
  onUpdateHangoutExpense,
  onDeleteHangoutExpense,
  onTriggerPopup,
}) => {
  // Derive default month/year from active periodId (e.g., "2026-10" -> month "10", year "2026")
  const defaultPeriodParts = period.periodId.split('-');
  const defaultYear = defaultPeriodParts[0] || '2026';
  const defaultMonth = defaultPeriodParts[1] || '10';

  // Form State: New Daily Expense (Tanggal, Bulan, Tahun synchronized)
  const [dayPart, setDayPart] = useState<string>('25');
  const [monthPart, setMonthPart] = useState<string>(defaultMonth);
  const [yearPart, setYearPart] = useState<string>(defaultYear);
  const [date, setDate] = useState(`25/${defaultMonth}/${defaultYear.slice(-2)}`);
  const [description, setDescription] = useState('');
  const [qty, setQty] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BRI');
  const [groupTag, setGroupTag] = useState<'OPERASIONAL' | 'AIRA_SAVING'>('OPERASIONAL');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline Edit State: Daily Expense
  const [editingDailyId, setEditingDailyId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnitPrice, setEditUnitPrice] = useState('0');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('BRI');

  // Filter & Chronological Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | PaymentCategoryType>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<'ALL' | 'OPERASIONAL' | 'AIRA_SAVING'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Form State: New Hangout / Nongkrong
  const [hangoutDate, setHangoutDate] = useState(`26/${defaultMonth}/${defaultYear.slice(-2)}`);
  const [placeOrEvent, setPlaceOrEvent] = useState('');
  const [hangoutAmount, setHangoutAmount] = useState<string>('');
  const [hangoutMethod, setHangoutMethod] = useState<PaymentMethod>('GOPAY');
  const [hangoutNote, setHangoutNote] = useState('');

  // Inline Edit State: Hangout / Nongkrong
  const [editingHangoutId, setEditingHangoutId] = useState<string | null>(null);
  const [editHangoutDate, setEditHangoutDate] = useState('');
  const [editHangoutPlace, setEditHangoutPlace] = useState('');
  const [editHangoutAmount, setEditHangoutAmount] = useState('0');
  const [editHangoutMethod, setEditHangoutMethod] = useState<PaymentMethod>('GOPAY');
  const [editHangoutNote, setEditHangoutNote] = useState('');

  // Export Chooser Menu State (Next to Jajan De Aira + Nabung)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const computedTotal = computeDailyExpenseTotal(Number(qty) || 0, Number(unitPrice) || 0);
  const computedEditTotal = computeDailyExpenseTotal(Number(editQty) || 0, Number(editUnitPrice) || 0);

  const handleDatePartsChange = (nextDay: string, nextMonth: string, nextYear: string) => {
    setDayPart(nextDay);
    setMonthPart(nextMonth);
    setYearPart(nextYear);
    setDate(normalizeTrackerDateString('', nextDay, nextMonth, nextYear));
  };

  const handleManualDateInput = (rawVal: string) => {
    setDate(rawVal);
    const m = rawVal.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (m) {
      setDayPart(m[1].padStart(2, '0'));
      setMonthPart(m[2].padStart(2, '0'));
      setYearPart(m[3].length === 2 ? `20${m[3]}` : m[3]);
    }
  };

  const handleExportFormat = (format: TrackerExportFormat) => {
    const res = triggerTrackerExportDownload(format, period, summary, tagFilter);
    setIsExportMenuOpen(false);
    onTriggerPopup?.(
      'SUCCESS',
      `EKSPOR ${format}`,
      `Berhasil Ekspor ke ${res.formatLabel}`,
      `Berkas "${res.filename}" (${res.count} transaksi pada periode ${period.monthLabel}) telah berhasil dibuat dan diunduh ke perangkat Anda.`
    );
  };

  const handleSubmitDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      const msg = 'Keterangan pengeluaran wajib diisi sebelum menyimpan transaksi.';
      setFormError(msg);
      onTriggerPopup?.('ERROR', 'SIMPAN TRANSAKSI', 'Gagal Menyimpan Transaksi', msg);
      return;
    }
    const numericQty = Number(qty);
    const numericPrice = Number(unitPrice);
    if (!Number.isFinite(numericQty) || numericQty <= 0 || !Number.isFinite(numericPrice) || numericPrice < 0) {
      const msg = 'Jumlah (Qty) dan Harga Satuan harus berupa angka valid.';
      setFormError(msg);
      onTriggerPopup?.('ERROR', 'SIMPAN TRANSAKSI', 'Gagal Menyimpan Transaksi', msg);
      return;
    }

    setFormError(null);
    const normalizedDate = normalizeTrackerDateString(date.trim() || `${dayPart}/${monthPart}/${yearPart}`);
    const totalVal = computeDailyExpenseTotal(numericQty, numericPrice);
    onAddDailyExpense({
      date: normalizedDate,
      description: description.trim(),
      qty: numericQty,
      unitPrice: numericPrice,
      total: totalVal,
      paymentMethod,
      groupTag,
    });

    onTriggerPopup?.(
      'SUCCESS',
      'SIMPAN TRANSAKSI TERURUT',
      'Transaksi Harian Berhasil Disimpan & Diurutkan',
      `Transaksi "${description.trim()}" pada tanggal ${normalizedDate} (${numericQty}x ${formatIDR(
        numericPrice
      )} = ${formatIDR(
        totalVal
      )}) via ${paymentMethod} berhasil disimpan ke database dan diurutkan rapi sesuai urutan tanggal.`
    );

    setDescription('');
    setQty('1');
    setUnitPrice('');
  };

  const startEditDaily = (item: DailyExpenseItem) => {
    setEditingDailyId(item.id);
    setEditDate(item.date);
    setEditDescription(item.description);
    setEditQty(String(item.qty));
    setEditUnitPrice(String(item.unitPrice));
    setEditMethod(item.paymentMethod === 'PILIH' ? 'BSI' : item.paymentMethod);
  };

  const handleCancelEditDaily = (item: DailyExpenseItem) => {
    setEditingDailyId(null);
    onTriggerPopup?.(
      'CANCELLED',
      'BATAL REVISI (CANCEL)',
      'Revisi Transaksi Dibatalkan',
      `Perubahan pada transaksi "${item.description}" (${item.date}) telah dibatalkan. Data tetap aman menggunakan nilai semula (${formatIDR(
        item.total
      )}).`
    );
  };

  const handleSaveEditDaily = (item: DailyExpenseItem) => {
    if (!editDescription.trim()) {
      onTriggerPopup?.(
        'ERROR',
        'REVISI TRANSAKSI',
        'Gagal Menyimpan Revisi',
        'Keterangan transaksi tidak boleh kosong.'
      );
      return;
    }
    const numericQty = Math.max(1, Number(editQty) || 1);
    const numericPrice = Math.max(0, Number(editUnitPrice) || 0);
    const updatedTotal = computeDailyExpenseTotal(numericQty, numericPrice);
    const normalizedEditDate = normalizeTrackerDateString(editDate.trim() || item.date);
    const updatedItem: DailyExpenseItem = {
      ...item,
      date: normalizedEditDate,
      description: editDescription.trim(),
      qty: numericQty,
      unitPrice: numericPrice,
      total: updatedTotal,
      paymentMethod: editMethod,
      updatedAt: new Date().toISOString(),
    };
    onUpdateDailyExpense(updatedItem);
    setEditingDailyId(null);
    onTriggerPopup?.(
      'REVISED',
      'SIMPAN REVISI',
      'Revisi Transaksi Berhasil Disimpan & Diurutkan',
      `Data "${updatedItem.description}" (${updatedItem.date}) berhasil direvisi menjadi ${numericQty}x ${formatIDR(
        numericPrice
      )} = ${formatIDR(updatedTotal)} (${editMethod}) dan tersusun rapi sesuai tanggal.`
    );
  };

  const handleSubmitHangout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeOrEvent.trim()) {
      onTriggerPopup?.(
        'ERROR',
        'SIMPAN JAJAN',
        'Gagal Mencatat Jajan / Nongkrong',
        'Nama tempat atau keterangan nongkrong wajib diisi.'
      );
      return;
    }
    const numericAmount = Number(hangoutAmount) || 0;
    const normalizedHDate = normalizeTrackerDateString(hangoutDate.trim() || '26/10/26');
    onAddHangoutExpense({
      date: normalizedHDate,
      placeOrEvent: placeOrEvent.trim(),
      amount: numericAmount,
      paymentMethod: hangoutMethod,
      note: hangoutNote.trim() || 'Nongkrong / Sosial',
    });
    onTriggerPopup?.(
      'SUCCESS',
      'SIMPAN JAJAN',
      'Catatan Jajan & Nongkrong Disimpan',
      `Kegiatan "${placeOrEvent.trim()}" pada ${normalizedHDate} sebesar ${formatIDR(
        numericAmount
      )} (${hangoutMethod}) berhasil ditambahkan ke database.`
    );
    setPlaceOrEvent('');
    setHangoutAmount('');
    setHangoutNote('');
  };

  const startEditHangout = (he: HangoutExpenseItem) => {
    setEditingHangoutId(he.id);
    setEditHangoutDate(he.date);
    setEditHangoutPlace(he.placeOrEvent);
    setEditHangoutAmount(String(he.amount));
    setEditHangoutMethod(he.paymentMethod);
    setEditHangoutNote(he.note);
  };

  const handleCancelEditHangout = (he: HangoutExpenseItem) => {
    setEditingHangoutId(null);
    onTriggerPopup?.(
      'CANCELLED',
      'BATAL REVISI (CANCEL)',
      'Revisi Jajan Dibatalkan',
      `Revisi pada catatan "${he.placeOrEvent}" dibatalkan dan nilai dikembalikan ke ${formatIDR(
        he.amount
      )}.`
    );
  };

  const handleSaveEditHangout = (he: HangoutExpenseItem) => {
    if (!editHangoutPlace.trim()) {
      onTriggerPopup?.(
        'ERROR',
        'REVISI JAJAN',
        'Gagal Menyimpan Revisi',
        'Nama tempat atau kegiatan nongkrong tidak boleh kosong.'
      );
      return;
    }
    const updated: HangoutExpenseItem = {
      ...he,
      date: normalizeTrackerDateString(editHangoutDate.trim() || he.date),
      placeOrEvent: editHangoutPlace.trim(),
      amount: Math.max(0, Number(editHangoutAmount) || 0),
      paymentMethod: editHangoutMethod,
      note: editHangoutNote.trim() || he.note,
      updatedAt: new Date().toISOString(),
    };
    onUpdateHangoutExpense(updated);
    setEditingHangoutId(null);
    onTriggerPopup?.(
      'REVISED',
      'SIMPAN REVISI',
      'Revisi Jajan Berhasil Disimpan',
      `Catatan "${updated.placeOrEvent}" berhasil diperbarui menjadi ${formatIDR(
        updated.amount
      )} (${updated.paymentMethod}).`
    );
  };

  // First sort all period dailyExpenses chronologically so any date appears in exact chronological sequence
  const chronologicallySortedDaily = sortDailyExpensesChronologically(
    period.dailyExpenses,
    sortDirection
  );

  // Unique dates in chronological order for the Date Filter bar
  const uniqueChronologicalDates = Array.from(
    new Set(sortDailyExpensesChronologically(period.dailyExpenses, 'ASC').map((d) => d.date))
  );

  const paymentCategoryAudit = computeDailyPaymentCategoryAudit(period.dailyExpenses);

  const filteredDaily = chronologicallySortedDaily.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' || getPaymentCategory(item.paymentMethod) === categoryFilter;
    const matchesMethod = methodFilter === 'ALL' || item.paymentMethod === methodFilter;
    const matchesTag = tagFilter === 'ALL' || item.groupTag === tagFilter;
    const matchesDate = dateFilter === 'ALL' || item.date === dateFilter;
    return matchesSearch && matchesCategory && matchesMethod && matchesTag && matchesDate;
  });

  const filteredDailyTotal = filteredDaily.reduce((acc, i) => acc + i.total, 0);
  const sortedHangoutList = sortHangoutExpensesChronologically(period.hangoutExpenses, 'ASC');

  return (
    <div className="space-y-6">
      {/* TOP RECAP STRIP: COD, TF, BRI, BSI & FREKUENSI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl liquid-glass-interactive p-4">
          <span className="text-xs text-slate-300">Total Tracker Harian ({summary.dailyTrackerCount}x)</span>
          <p
            data-testid="tracker-daily-total"
            className="mt-1.5 text-xl font-bold font-mono tabular-nums text-emerald-400"
          >
            {formatIDR(summary.dailyTrackerTotal)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Umum: {formatCompactIDR(summary.dailyTrackerOperationalTotal)} · Aira: {formatCompactIDR(summary.dailyTrackerAiraSavingTotal)}
          </p>
        </div>

        <div className="rounded-3xl liquid-glass-interactive p-4">
          <span className="text-xs text-slate-300">Rekap Total COD</span>
          <p
            data-testid="tracker-cod-total"
            className="mt-1.5 text-xl font-bold font-mono tabular-nums text-amber-300"
          >
            {formatIDR(summary.totalCodExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Pembayaran Tunai / Kurir</p>
        </div>

        <div className="rounded-3xl liquid-glass-interactive p-4">
          <span className="text-xs text-slate-300">Rekap Total Transfer (TF)</span>
          <p
            data-testid="tracker-tf-total"
            className="mt-1.5 text-xl font-bold font-mono tabular-nums text-sky-400"
          >
            {formatIDR(summary.totalTfExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">BRI: {formatCompactIDR(summary.totalBriExpenses)} · BSI: {formatCompactIDR(summary.totalBsiExpenses)}</p>
        </div>

        <div className="rounded-3xl liquid-glass-interactive p-4">
          <span className="text-xs text-slate-300">Jajan &amp; Nongkrong ({summary.hangoutTrackerCount}x)</span>
          <p
            data-testid="tracker-hangout-total"
            className="mt-1.5 text-xl font-bold font-mono tabular-nums text-rose-400"
          >
            {formatIDR(summary.hangoutTrackerTotal)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Plafon Rencana: Rp 1,5 Jt</p>
        </div>
      </div>

      {/* SECTION 1: TRACKER PENGELUARAN SEHARI-HARI DALAM 1 BULAN */}
      <section className="rounded-3xl liquid-glass-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Tracker Pengeluaran Sehari-hari dalam 1 Bulan ({period.monthLabel})
              </h2>
              <p className="text-xs text-slate-300">
                Otomatis berurutan rapi berdasarkan Tanggal/Bulan/Tahun · Input baru otomatis tampil tepat setelah tanggal yang sama atau sebelumnya
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl liquid-glass-inset border border-emerald-400/30 text-[11px] font-mono text-emerald-300">
            Auto-Sort Kronologis Aktif · {filteredDaily.length}/{period.dailyExpenses.length} Baris
          </span>
        </div>

        {/* Form Input Pengeluaran Sehari-hari (Dengan Pemilih Tanggal - Bulan - Tahun Terintegrasi) */}
        <form
          onSubmit={handleSubmitDaily}
          className="mt-4 p-4 rounded-2xl liquid-glass-inset space-y-3"
        >
          {/* Row 1: Penyesuaian Tanggal - Bulan - Tahun + Format Cepat */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-300 font-semibold">
                Sesuaikan Tanggal · Bulan · Tahun:
              </span>
              <div className="inline-flex items-center gap-1.5 bg-slate-950/90 border border-white/10 rounded-xl px-2.5 py-1">
                <label htmlFor="daily-day-select" className="text-[10px] text-slate-400 font-mono">
                  Tgl
                </label>
                <select
                  id="daily-day-select"
                  value={dayPart}
                  onChange={(e) => handleDatePartsChange(e.target.value, monthPart, yearPart)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs font-mono text-emerald-300 cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <label htmlFor="daily-month-select" className="text-[10px] text-slate-400 font-mono ml-1">
                  Bln
                </label>
                <select
                  id="daily-month-select"
                  value={monthPart}
                  onChange={(e) => handleDatePartsChange(dayPart, e.target.value, yearPart)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs font-mono text-cyan-300 cursor-pointer"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <label htmlFor="daily-year-select" className="text-[10px] text-slate-400 font-mono ml-1">
                  Thn
                </label>
                <select
                  id="daily-year-select"
                  value={yearPart}
                  onChange={(e) => handleDatePartsChange(dayPart, monthPart, e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs font-mono text-amber-300 cursor-pointer"
                >
                  {['2025', '2026', '2027', '2028', '2029', '2030'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                &rarr; Akan disisipkan rapi pada urutan tanggal <strong className="text-emerald-400">{date}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-2">
              <label htmlFor="daily-date-input" className="block text-xs text-slate-400 mb-1">
                Tanggal (DD/MM/YY)
              </label>
              <input
                id="daily-date-input"
                type="text"
                value={date}
                onChange={(e) => handleManualDateInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
                placeholder="25/10/26"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="daily-desc-input" className="block text-xs text-slate-400 mb-1">
                Keterangan Pengeluaran
              </label>
              <input
                id="daily-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                placeholder="Contoh: Belanja Dapur / Mie Gacoan"
              />
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="daily-qty-input" className="block text-xs text-slate-400 mb-1">
                Qty
              </label>
              <input
                id="daily-qty-input"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 text-center"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="daily-price-input" className="block text-xs text-slate-400 mb-1">
                Harga Satuan (Rp)
              </label>
              <input
                id="daily-price-input"
                type="number"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
                placeholder="50000"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="daily-method-select" className="block text-xs text-slate-400 mb-1">
                Metode Bayar
              </label>
              <select
                id="daily-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Kelompok Pos:</span>
              <button
                type="button"
                onClick={() => setGroupTag('OPERASIONAL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  groupTag === 'OPERASIONAL'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Umum / Operasional
              </button>
              <button
                type="button"
                onClick={() => setGroupTag('AIRA_SAVING')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  groupTag === 'AIRA_SAVING'
                    ? 'bg-slate-800 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Jajan De Aira + Nabung
              </button>

              {/* TOMBOL EKSPOR DI SEBELAH JAJAN DE AIRA + NABUNG (.PDF / .EXCEL .XLSX / .JPG) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  data-testid="tracker-export-dropdown-btn"
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 border border-emerald-400/40 text-emerald-300 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor (.PDF / .XLSX / .JPG)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isExportMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Pilih Format Ekspor Tracker Harian"
                    className="absolute left-0 top-full mt-1.5 z-30 w-56 rounded-2xl bg-slate-950 border border-emerald-400/40 p-1.5 shadow-2xl space-y-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExportFormat('PDF')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-xs text-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>Dokumen PDF</span>
                      </span>
                      <span className="font-mono text-[10px] text-rose-300">.pdf</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExportFormat('XLSX')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-xs text-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Microsoft Excel</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-300">.excel / .xlsx</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExportFormat('JPG')}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-xs text-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Gambar Infografis</span>
                      </span>
                      <span className="font-mono text-[10px] text-cyan-300">.jpg</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="font-mono tabular-nums text-slate-300">
              Total Otomatis (Qty × Harga):{' '}
              <strong className="text-emerald-400">{formatIDR(computedTotal)}</strong>
            </div>
          </div>

          {formError && <p className="text-xs text-rose-400 font-medium">{formError}</p>}
        </form>

        {/* UPGRADED 3D LIQUID GLASS FILTER & CHRONOLOGICAL DATE BAR */}
        <div
          data-testid="daily-tracker-filter-bar"
          className="mt-5 p-4 rounded-2xl liquid-glass-inset border border-white/10 space-y-3.5"
        >
          {/* AUDIT KATEGORI PEMBAYARAN: SEMUA, TUNAI, BANK, E-WALLET */}
          <div
            data-testid="daily-payment-category-audit-bar"
            className="pb-3 border-b border-white/10 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
                <Payment3DIcon kind={categoryFilter} size="sm" />
                <span>Filter Audit Kategori Pembayaran (Tunai · Bank · E-Wallet):</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                Menampilkan {filteredDaily.length} Transaksi · Subtotal:{' '}
                <strong className="text-emerald-400">{formatIDR(filteredDailyTotal)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                [
                  paymentCategoryAudit.ALL,
                  paymentCategoryAudit.TUNAI,
                  paymentCategoryAudit.BANK,
                  paymentCategoryAudit.EWALLET,
                ] as const
              ).map((bucket) => {
                const isActive = categoryFilter === bucket.category;
                return (
                  <button
                    key={bucket.category}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(bucket.category);
                      if (
                        bucket.category !== 'ALL' &&
                        methodFilter !== 'ALL' &&
                        getPaymentCategory(methodFilter) !== bucket.category
                      ) {
                        setMethodFilter('ALL');
                      }
                    }}
                    data-testid={`daily-category-filter-${bucket.category}`}
                    className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex items-center justify-between gap-2.5 ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-400/60 shadow-[0_6px_20px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-950/80 border-white/10 hover:border-cyan-400/40 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Payment3DIcon kind={bucket.category} size="md" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {bucket.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {bucket.methodsSubtitle} · {bucket.count}x ({bucket.percentage}%)
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div
                        data-testid={`daily-category-total-${bucket.category}`}
                        className={`text-xs font-bold ${
                          isActive ? 'text-emerald-300' : 'text-emerald-400'
                        }`}
                      >
                        {formatIDR(bucket.total)}
                      </div>
                      <div className="text-[10px] text-slate-400">{bucket.count} Transaksi</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari transaksi harian"
                placeholder="Cari keterangan pengeluaran atau tanggal (DD/MM/YY)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400/60 focus:outline-none text-xs text-slate-100"
              />
            </div>

            {/* Chronological Order Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSortDirection('ASC')}
                data-testid="sort-chronological-asc"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  sortDirection === 'ASC'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Urut Tanggal Rapi (Awal &rarr; Akhir)
              </button>
              <button
                type="button"
                onClick={() => setSortDirection('DESC')}
                data-testid="sort-chronological-desc"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  sortDirection === 'DESC'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tanggal Terbaru &rarr; Terlama
              </button>
            </div>

            {/* Pos Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              {(['ALL', 'OPERASIONAL', 'AIRA_SAVING'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                    tagFilter === t
                      ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Payment3DIcon kind={t} size="xs" />
                  <span>
                    {t === 'ALL' ? 'Semua Pos' : t === 'OPERASIONAL' ? 'Belanja & Ops' : 'Jajan Aira'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 of Filter Bar: Metode / Kanal Filter + Filter Tanggal Berurutan */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              {['ALL', ...PAYMENT_METHODS].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMethodFilter(m);
                    if (
                      m !== 'ALL' &&
                      categoryFilter !== 'ALL' &&
                      getPaymentCategory(m) !== categoryFilter
                    ) {
                      setCategoryFilter('ALL');
                    }
                  }}
                  data-testid={`daily-method-filter-${m}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                    methodFilter === m
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Payment3DIcon kind={m} size="xs" />
                  <span>{m === 'ALL' ? 'Semua Metode' : m}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="tracker-date-filter-select" className="text-xs text-slate-300 font-medium">
                Filter Tanggal Berurutan:
              </label>
              <select
                id="tracker-date-filter-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 cursor-pointer"
              >
                <option value="ALL">Semua Tanggal ({uniqueChronologicalDates.length} Tgl)</option>
                {uniqueChronologicalDates.map((dStr) => {
                  const countOnDate = period.dailyExpenses.filter((x) => x.date === dStr).length;
                  return (
                    <option key={dStr} value={dStr}>
                      {dStr} ({countOnDate} transaksi)
                    </option>
                  );
                })}
              </select>

              {(searchQuery ||
                categoryFilter !== 'ALL' ||
                methodFilter !== 'ALL' ||
                tagFilter !== 'ALL' ||
                dateFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setMethodFilter('ALL');
                    setTagFilter('ALL');
                    setDateFilter('ALL');
                  }}
                  data-testid="daily-reset-filters-btn"
                  className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-medium cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Daftar Pengeluaran Harian (Bisa Direvisi, Disimpan & Dihapus) */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2.5 pr-3">Tanggal</th>
                <th className="py-2.5 px-3">Keterangan</th>
                <th className="py-2.5 px-3 text-center">Jumlah (Qty)</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 text-right">Total Otomatis</th>
                <th className="py-2.5 px-3 text-center">Metode</th>
                <th className="py-2.5 pl-3 text-right">Revisi / Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDaily.map((item) => {
                const isEditing = editingDailyId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isEditing ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          aria-label={`Edit tanggal ${item.description}`}
                          className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-xs text-slate-100"
                        />
                      ) : (
                        item.date
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          aria-label={`Edit keterangan ${item.description}`}
                          className="w-full min-w-[160px] px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                        />
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-300">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          aria-label={`Edit jumlah qty ${item.description}`}
                          className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-center font-mono text-xs text-slate-100"
                        />
                      ) : (
                        item.qty
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editUnitPrice}
                          onChange={(e) => setEditUnitPrice(e.target.value)}
                          aria-label={`Edit harga satuan ${item.description}`}
                          className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-amber-300"
                        />
                      ) : (
                        formatIDR(item.unitPrice)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-400 whitespace-nowrap">
                      {isEditing ? formatIDR(computedEditTotal) : formatIDR(item.total)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">
                      {isEditing ? (
                        <select
                          value={editMethod}
                          onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                          aria-label={`Edit metode bayar ${item.description}`}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-xs text-slate-100"
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-white/10">
                          <Payment3DIcon kind={item.paymentMethod} size="xs" />
                          <span>{item.paymentMethod}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEditDaily(item)}
                              aria-label={`Simpan revisi ${item.description}`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelEditDaily(item)}
                              aria-label={`Batal revisi ${item.description}`}
                              className="px-2 py-1 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 inline-flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Batal</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditDaily(item)}
                              aria-label={`Revisi transaksi ${item.description}`}
                              className="px-2 py-1 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 inline-flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteDailyExpense(item.id);
                                onTriggerPopup?.(
                                  'DELETED',
                                  'HAPUS TRANSAKSI (DELETE)',
                                  'Transaksi Harian Berhasil Dihapus',
                                  `Transaksi "${item.description}" (${item.date}) senilai ${formatIDR(
                                    item.total
                                  )} telah dihapus dari database dan saldo bulan ini telah diperbarui.`
                                );
                              }}
                              aria-label={`Hapus transaksi ${item.description} ${item.date}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700 font-semibold text-xs">
                <td colSpan={4} className="pt-3 text-slate-300">
                  <div className="inline-flex items-center gap-2">
                    <Payment3DIcon
                      kind={methodFilter !== 'ALL' ? methodFilter : categoryFilter}
                      size="sm"
                    />
                    <span data-testid="daily-filtered-total-label">
                      TOTAL PENGELUARAN TERFILTER
                      {categoryFilter !== 'ALL'
                        ? ` · KATEGORI ${paymentCategoryAudit[categoryFilter].label.toUpperCase()}`
                        : ''}
                      {methodFilter !== 'ALL' ? ` · METODE ${methodFilter}` : ''} ({filteredDaily.length}{' '}
                      Transaksi)
                    </span>
                  </div>
                </td>
                <td
                  data-testid="daily-filtered-total-amount"
                  className="pt-3 px-3 text-right font-mono tabular-nums text-emerald-400 text-sm"
                >
                  {formatIDR(filteredDailyTotal)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* SECTION 2: TRACKER JAJAN / NONGKRONG DALAM 1 BULAN */}
      <section className="rounded-3xl liquid-glass-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Tracker Jajan & Nongkrong dalam 1 Bulan
              </h2>
              <p className="text-xs text-slate-300">
                Pantau frekuensi nongkrong, kondangan & pengeluaran gaya hidup agar tetap di bawah plafon Rp 1.500.000
              </p>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums text-amber-300 font-semibold">
            Total Dihabiskan: {formatIDR(summary.hangoutTrackerTotal)} ({summary.hangoutTrackerCount}x)
          </span>
        </div>

        <form
          onSubmit={handleSubmitHangout}
          className="mt-4 p-4 rounded-2xl liquid-glass-inset grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label htmlFor="hangout-date" className="block text-xs text-slate-400 mb-1">
              Tanggal
            </label>
            <input
              id="hangout-date"
              type="text"
              value={hangoutDate}
              onChange={(e) => setHangoutDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
              placeholder="26/10/26"
            />
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="hangout-place" className="block text-xs text-slate-400 mb-1">
              Nama Tempat / Keterangan Nongkrong
            </label>
            <input
              id="hangout-place"
              type="text"
              value={placeOrEvent}
              onChange={(e) => setPlaceOrEvent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
              placeholder="Contoh: Kopi Kenangan / Bantu Nikah JHR"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="hangout-amount" className="block text-xs text-slate-400 mb-1">
              Dihabiskan (Rp)
            </label>
            <input
              id="hangout-amount"
              type="number"
              min="0"
              value={hangoutAmount}
              onChange={(e) => setHangoutAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
              placeholder="35000"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="hangout-method" className="block text-xs text-slate-400 mb-1">
              Metode
            </label>
            <select
              id="hangout-method"
              value={hangoutMethod}
              onChange={(e) => setHangoutMethod(e.target.value as PaymentMethod)}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Jajan</span>
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2 pr-3">Tanggal</th>
                <th className="py-2 px-3">Nongkrong / Kegiatan</th>
                <th className="py-2 px-3 text-right">Dihabiskan</th>
                <th className="py-2 px-3 text-center">Metode</th>
                <th className="py-2 px-3">Catatan</th>
                <th className="py-2 pl-3 text-right">Revisi / Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedHangoutList.map((he) => {
                const isEditing = editingHangoutId === he.id;
                return (
                  <tr key={he.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 pr-3 font-mono text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editHangoutDate}
                          onChange={(e) => setEditHangoutDate(e.target.value)}
                          className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-xs text-slate-100"
                        />
                      ) : (
                        he.date
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editHangoutPlace}
                          onChange={(e) => setEditHangoutPlace(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                        />
                      ) : (
                        he.placeOrEvent
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-amber-300">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editHangoutAmount}
                          onChange={(e) => setEditHangoutAmount(e.target.value)}
                          className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-amber-300"
                        />
                      ) : (
                        formatIDR(he.amount)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">
                      {isEditing ? (
                        <select
                          value={editHangoutMethod}
                          onChange={(e) => setEditHangoutMethod(e.target.value as PaymentMethod)}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-xs text-slate-100"
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-white/10">
                          <Payment3DIcon kind={he.paymentMethod} size="xs" />
                          <span>{he.paymentMethod}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editHangoutNote}
                          onChange={(e) => setEditHangoutNote(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                        />
                      ) : (
                        he.note
                      )}
                    </td>
                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEditHangout(he)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelEditHangout(he)}
                              className="px-2 py-1 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 inline-flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Batal</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditHangout(he)}
                              aria-label={`Revisi jajan ${he.placeOrEvent}`}
                              className="px-2 py-1 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 inline-flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteHangoutExpense(he.id);
                                onTriggerPopup?.(
                                  'DELETED',
                                  'HAPUS JAJAN (DELETE)',
                                  'Catatan Jajan Berhasil Dihapus',
                                  `Catatan "${he.placeOrEvent}" senilai ${formatIDR(
                                    he.amount
                                  )} telah dihapus dari database.`
                                );
                              }}
                              aria-label={`Hapus jajan ${he.placeOrEvent}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
