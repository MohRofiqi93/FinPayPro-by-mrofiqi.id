import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { MonthlyPeriodData, PeriodFinancialSummary } from '../types/finance';
import { formatIDR } from '../utils/calculations';

export interface ActionPopupData {
  isOpen: boolean;
  status: 'SUCCESS' | 'REVISED' | 'DELETED' | 'CANCELLED' | 'ERROR';
  commandLabel: string;
  title: string;
  message: string;
  timestamp: string;
}

interface ActionFeedbackPopupModalProps {
  popup: ActionPopupData | null;
  onClose: () => void;
}

export const ActionFeedbackPopupModal: React.FC<ActionFeedbackPopupModalProps> = ({
  popup,
  onClose,
}) => {
  if (!popup || !popup.isOpen) return null;

  const styleConfig =
    popup.status === 'SUCCESS'
      ? {
          border: 'border-emerald-400/45',
          bar: 'from-emerald-400 via-teal-400 to-cyan-500',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
        }
      : popup.status === 'REVISED'
      ? {
          border: 'border-cyan-400/45',
          bar: 'from-cyan-400 via-sky-400 to-indigo-500',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          btnBg: 'bg-cyan-400 hover:bg-cyan-300 text-slate-950',
          icon: <Edit3 className="w-6 h-6 text-cyan-400" />,
        }
      : popup.status === 'DELETED'
      ? {
          border: 'border-rose-400/45',
          bar: 'from-rose-500 via-pink-500 to-amber-500',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          btnBg: 'bg-rose-500 hover:bg-rose-400 text-white',
          icon: <Trash2 className="w-6 h-6 text-rose-400" />,
        }
      : popup.status === 'CANCELLED'
      ? {
          border: 'border-amber-400/45',
          bar: 'from-amber-400 via-orange-400 to-yellow-500',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
          icon: <RotateCcw className="w-6 h-6 text-amber-400" />,
        }
      : {
          border: 'border-rose-500/60',
          bar: 'from-rose-600 via-red-500 to-orange-500',
          badgeBg: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
          btnBg: 'bg-rose-500 hover:bg-rose-400 text-white',
          icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
        };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-feedback-popup-title"
      data-testid="action-feedback-popup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <div
        className={`w-full max-w-md rounded-3xl liquid-glass border ${styleConfig.border} p-6 shadow-2xl space-y-4 relative overflow-hidden`}
      >
        <div
          aria-hidden="true"
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${styleConfig.bar}`}
        />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${styleConfig.badgeBg} shrink-0`}>
              {styleConfig.icon}
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold text-slate-300">
                STATUS PERINTAH · {popup.commandLabel}
              </span>
              <h3
                id="action-feedback-popup-title"
                className="text-base font-bold text-white mt-0.5"
              >
                {popup.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pesan popup"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 leading-relaxed">
          {popup.message}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-mono text-slate-400">
            Waktu: {popup.timestamp}
          </span>
          <button
            type="button"
            onClick={onClose}
            data-testid="action-popup-close-btn"
            className={`px-5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${styleConfig.btnBg}`}
          >
            OK, Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReviseBalanceModalProps {
  isOpen: boolean;
  period: MonthlyPeriodData;
  summary: PeriodFinancialSummary;
  onClose: () => void;
  onCancel?: () => void;
  onSaveRevision: (newBalance: number, reason: string) => void;
}

export const ReviseBalanceModal: React.FC<ReviseBalanceModalProps> = ({
  isOpen,
  period,
  summary,
  onClose,
  onCancel,
  onSaveRevision,
}) => {
  const [balanceInput, setBalanceInput] = useState<string>(String(summary.openingBalance));
  const [reasonInput, setReasonInput] = useState<string>(period.openingBalanceRevisionNote || '');

  useEffect(() => {
    if (isOpen) {
      setBalanceInput(String(summary.openingBalance));
      setReasonInput(period.openingBalanceRevisionNote || '');
    }
  }, [isOpen, period.periodId, summary.openingBalance, period.openingBalanceRevisionNote]);

  if (!isOpen) return null;

  const previewNewOpening = Number(balanceInput) || 0;
  const previewClosing = previewNewOpening + summary.netMonthlyCashflow;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRevision(
      previewNewOpening,
      reasonInput.trim() || 'Rekonsiliasi saldo awal manual via aplikasi'
    );
    onClose();
  };

  const handleCancelClick = () => {
    onClose();
    if (onCancel) onCancel();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revise-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h2 id="revise-modal-title" className="text-base font-semibold text-slate-100">
              Edit / Revisi Saldo Awal & Rekonsiliasi ({period.monthLabel})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancelClick}
            aria-label="Tutup modal revisi saldo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Saldo Carry-Over Bulan Lalu:</span>
              <span className="font-mono tabular-nums text-slate-200">
                {formatIDR(period.openingBalanceCarryOver)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Kas Bank Saat Ini (BCA+BRI+BSI):</span>
              <span className="font-mono tabular-nums text-emerald-400">
                {formatIDR(summary.totalBankBalance)}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="revise-balance-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Nominal Saldo Awal / Akumulasi Baru (Rp)
            </label>
            <input
              id="revise-balance-input"
              type="number"
              required
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-amber-300"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setBalanceInput(String(summary.totalBankBalance));
                  setReasonInput('Disamakan dengan total kas riil Bank BCA + BRI + BSI');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-400 font-mono cursor-pointer"
              >
                Gunakan Kas Bank ({formatIDR(summary.totalBankBalance)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setBalanceInput(String(period.openingBalanceCarryOver));
                  setReasonInput('Kembali ke nilai rollover otomatis');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono cursor-pointer"
              >
                Reset ke Rollover ({formatIDR(period.openingBalanceCarryOver)})
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="revise-reason-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Catatan Revisi / Alasan Rekonsiliasi
            </label>
            <input
              id="revise-reason-input"
              type="text"
              required
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Contoh: Penyesuaian selisih kas tunai & rekening BRI"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-300">Proyeksi Sisa Uang Bulan Ini setelah revisi:</span>
            <strong
              className={`font-mono tabular-nums text-sm ${
                previewClosing >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatIDR(previewClosing, true)}
            </strong>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Simpan Revisi Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateNewMonthModalProps {
  isOpen: boolean;
  sourcePeriod: MonthlyPeriodData;
  sourceSummary: PeriodFinancialSummary;
  existingPeriods: MonthlyPeriodData[];
  onClose: () => void;
  onCancel?: () => void;
  onCreateMonth: (newPeriodId: string, newMonthLabel: string) => void;
}

const SUGGESTED_MONTHS = [
  { id: '2026-12', label: 'Desember 2026' },
  { id: '2027-01', label: 'Januari 2027' },
  { id: '2027-02', label: 'Februari 2027' },
  { id: '2027-03', label: 'Maret 2027' },
];

export const CreateNewMonthModal: React.FC<CreateNewMonthModalProps> = ({
  isOpen,
  sourcePeriod,
  sourceSummary,
  existingPeriods,
  onClose,
  onCancel,
  onCreateMonth,
}) => {
  const existingIds = new Set(existingPeriods.map((p) => p.periodId));
  const nextDefault =
    SUGGESTED_MONTHS.find((m) => !existingIds.has(m.id)) || {
      id: `2027-0${existingPeriods.length}`,
      label: `Bulan Baru ${existingPeriods.length + 1}`,
    };

  const [periodId, setPeriodId] = useState(nextDefault.id);
  const [monthLabel, setMonthLabel] = useState(nextDefault.label);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodId.trim() || !monthLabel.trim()) return;
    onCreateMonth(periodId.trim(), monthLabel.trim());
    onClose();
  };

  const handleCancelClick = () => {
    onClose();
    if (onCancel) onCancel();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-month-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarPlus className="w-5 h-5 text-emerald-400" />
            <h2 id="new-month-modal-title" className="text-base font-semibold text-slate-100">
              Buat Periode Bulan Baru & Auto-Generate Sheet
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancelClick}
            aria-label="Tutup modal bulan baru"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <p className="text-slate-300 font-medium">
              Rollover Otomatis dari <strong className="text-emerald-400">{sourcePeriod.monthLabel}</strong>:
            </p>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>
                Saldo Akhir <strong>{formatIDR(sourceSummary.closingBalance)}</strong> otomatis menjadi Saldo Awal bulan baru.
              </li>
              <li>
                Seluruh kategori rutin ({sourcePeriod.fixedCosts.length} Fixed Cost, {sourcePeriod.subscriptionsAndDebts.length} Langganan/Hutang, {sourcePeriod.savings.length} Tabungan) disalin otomatis.
              </li>
              <li>Nilai realisasi aktual dan Tracker Harian di-reset ke Rp 0.</li>
              <li>Sheet baru otomatis dibuat di Google Sheets saat terhubung ke internet.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-month-id" className="block text-xs text-slate-300 mb-1">
                Kode Periode (YYYY-MM)
              </label>
              <input
                id="new-month-id"
                type="text"
                required
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="new-month-label" className="block text-xs text-slate-300 mb-1">
                Nama Sheet di Google Drive
              </label>
              <input
                id="new-month-label"
                type="text"
                required
                value={monthLabel}
                onChange={(e) => setMonthLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              + Buat Sheet Bulan Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

