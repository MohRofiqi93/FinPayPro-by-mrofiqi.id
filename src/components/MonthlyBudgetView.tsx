import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  FixedCostItem,
  IncomeItem,
  MonthlyPeriodData,
  PaymentMethod,
  PeriodFinancialSummary,
  PriorityLevel,
  SavingItem,
  SubscriptionDebtItem,
  VariableCostItem,
} from '../types/finance';
import { formatIDR } from '../utils/calculations';
import { ActionPopupData } from './Modals';

interface MonthlyBudgetViewProps {
  period: MonthlyPeriodData;
  summary: PeriodFinancialSummary;
  onToggleFixedPaid: (id: string) => void;
  onUpdateFixedCost: (item: FixedCostItem) => void;
  onAddFixedCost: (item: Omit<FixedCostItem, 'id' | 'updatedAt'>) => void;
  onDeleteFixedCost: (id: string) => void;
  onToggleSubDebtPaid: (id: string) => void;
  onUpdateSubDebt: (item: SubscriptionDebtItem) => void;
  onAddSubDebt: (item: Omit<SubscriptionDebtItem, 'id' | 'updatedAt'>) => void;
  onUpdateVariableCost: (item: VariableCostItem) => void;
  onUpdateIncome: (item: IncomeItem) => void;
  onAddIncome: (item: Omit<IncomeItem, 'id' | 'updatedAt'>) => void;
  onUpdateSaving: (item: SavingItem) => void;
  onAddSaving: (item: Omit<SavingItem, 'id' | 'updatedAt'>) => void;
  onToggleSpecialLiability: (id: string) => void;
  onTriggerPopup?: (
    status: ActionPopupData['status'],
    commandLabel: string,
    title: string,
    message: string
  ) => void;
}

export const MonthlyBudgetView: React.FC<MonthlyBudgetViewProps> = ({
  period,
  summary,
  onToggleFixedPaid,
  onUpdateFixedCost,
  onAddFixedCost,
  onDeleteFixedCost,
  onToggleSubDebtPaid,
  onUpdateSubDebt,
  onAddSubDebt,
  onUpdateVariableCost,
  onUpdateIncome,
  onAddIncome,
  onUpdateSaving,
  onAddSaving,
  onToggleSpecialLiability,
  onTriggerPopup,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlanned, setEditPlanned] = useState<string>('0');
  const [editActual, setEditActual] = useState<string>('0');
  const [editIsPaid, setEditIsPaid] = useState<boolean>(false);

  // 3D Perspective Tilt states for Section 02 (Subscription & Debt) and Section 03 (Variable Cost)
  const [subDebtTilt3D, setSubDebtTilt3D] = useState<{ rotateX: number; rotateY: number }>({
    rotateX: 0,
    rotateY: 0,
  });
  const [hoveredSubBarIdx, setHoveredSubBarIdx] = useState<number | null>(null);

  const [variableTilt3D, setVariableTilt3D] = useState<{ rotateX: number; rotateY: number }>({
    rotateX: 0,
    rotateY: 0,
  });
  const [hoveredVarBarIdx, setHoveredVarBarIdx] = useState<number | null>(null);

  const handleSubDebtMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setSubDebtTilt3D({
      rotateX: Number((-y * 7).toFixed(2)),
      rotateY: Number((x * 7).toFixed(2)),
    });
  };

  const handleVariableMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setVariableTilt3D({
      rotateX: Number((-y * 7).toFixed(2)),
      rotateY: Number((x * 7).toFixed(2)),
    });
  };

  // New Fixed Cost form state
  const [showAddFixed, setShowAddFixed] = useState(false);
  const [newFixedDay, setNewFixedDay] = useState('05');
  const [newFixedTitle, setNewFixedTitle] = useState('');
  const [newFixedMethod, setNewFixedMethod] = useState<PaymentMethod | 'Optional'>('GOPAY');
  const [newFixedPlanned, setNewFixedPlanned] = useState('');
  const [newFixedActual, setNewFixedActual] = useState('');

  // New Subscription/Debt form state
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubDay, setNewSubDay] = useState('10');
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubPriority, setNewSubPriority] = useState<PriorityLevel>('High');
  const [newSubPlanned, setNewSubPlanned] = useState('');
  const [newSubActual, setNewSubActual] = useState('');

  // New Income form state
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [newIncomeSource, setNewIncomeSource] = useState('');
  const [newIncomeType, setNewIncomeType] = useState<'Utama' | 'Sampingan'>('Sampingan');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');

  const startInlineEdit = (id: string, planned: number, actual: number, isPaid = false) => {
    setEditingId(id);
    setEditPlanned(String(planned));
    setEditActual(String(actual));
    setEditIsPaid(isPaid);
  };

  const handleCancelInlineEdit = (label: string) => {
    setEditingId(null);
    onTriggerPopup?.(
      'CANCELLED',
      'BATAL REVISI (CANCEL)',
      'Revisi Anggaran Dibatalkan',
      `Perubahan pada pos "${label}" telah dibatalkan. Data tetap menggunakan nominal semula.`
    );
  };

  const handleCreateFixed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixedTitle.trim()) return;
    const planned = Number(newFixedPlanned) || 0;
    const actual = Number(newFixedActual) || 0;
    onAddFixedCost({
      dueDay: newFixedDay.trim() || '01',
      title: newFixedTitle.trim(),
      methodOrPriority: newFixedMethod,
      planned,
      actual,
      isPaid: false,
    });
    onTriggerPopup?.(
      'SUCCESS',
      'SIMPAN POS TETAP',
      'Pos Pengeluaran Tetap Berhasil Disimpan',
      `Pos "${newFixedTitle.trim()}" (Rencana: ${formatIDR(planned)}, Aktual: ${formatIDR(
        actual
      )}) berhasil disimpan ke database.`
    );
    setNewFixedTitle('');
    setNewFixedPlanned('');
    setNewFixedActual('');
    setShowAddFixed(false);
  };

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTitle.trim()) return;
    const planned = Number(newSubPlanned) || 0;
    const actual = Number(newSubActual) || 0;
    onAddSubDebt({
      dueDay: newSubDay.trim() || '-',
      title: newSubTitle.trim(),
      priority: newSubPriority,
      planned,
      actual,
      isPaid: false,
      includeInMonthlyTotal: true,
    });
    onTriggerPopup?.(
      'SUCCESS',
      'SIMPAN LANGGANAN / HUTANG',
      'Pos Langganan & Hutang Berhasil Disimpan',
      `Pos "${newSubTitle.trim()}" sebesar ${formatIDR(actual)} berhasil ditambahkan ke database.`
    );
    setNewSubTitle('');
    setNewSubPlanned('');
    setNewSubActual('');
    setShowAddSub(false);
  };

  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeSource.trim()) return;
    const amountVal = Number(newIncomeAmount) || 0;
    onAddIncome({
      source: newIncomeSource.trim(),
      type: newIncomeType,
      amount: amountVal,
    });
    onTriggerPopup?.(
      'SUCCESS',
      'SIMPAN PENDAPATAN',
      'Sumber Pendapatan Berhasil Disimpan',
      `Sumber pendapatan "${newIncomeSource.trim()}" (${newIncomeType}) sebesar ${formatIDR(
        amountVal
      )} berhasil disimpan ke database.`
    );
    setNewIncomeSource('');
    setNewIncomeAmount('');
    setShowAddIncome(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. PENGELUARAN TETAP / FIXED COST / OPERASIONAL RUMAH */}
      <section className="rounded-3xl liquid-glass-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">
              01. Pengeluaran Tetap · Fixed Cost & Operasional Rumah
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Klik ikon status untuk mengubah Lunas/Belum Lunas, atau klik Edit untuk menyesuaikan nominal Rencana & Aktual
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right font-mono tabular-nums text-xs">
              <span className="text-slate-300">Rencana: {formatIDR(summary.fixedCostPlanned)}</span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="text-emerald-400 font-semibold">Aktual: {formatIDR(summary.fixedCostActual)}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFixed((v) => !v)}
              className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 liquid-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pos Tetap</span>
            </button>
          </div>
        </div>

        {showAddFixed && (
          <form
            onSubmit={handleCreateFixed}
            className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tgl Jatuh Tempo</label>
              <input
                type="text"
                value={newFixedDay}
                onChange={(e) => setNewFixedDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono"
                placeholder="02"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Keterangan Pos Operasional</label>
              <input
                type="text"
                required
                value={newFixedTitle}
                onChange={(e) => setNewFixedTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                placeholder="Contoh: WiFi Indihome / Listrik PLN"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Metode / Prioritas</label>
              <select
                value={newFixedMethod}
                onChange={(e) => setNewFixedMethod(e.target.value as PaymentMethod | 'Optional')}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
              >
                <option value="GOPAY">GOPAY</option>
                <option value="DANA">DANA</option>
                <option value="BRI">BRI</option>
                <option value="BCA">BCA</option>
                <option value="BSI">BSI</option>
                <option value="Optional">Optional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rencana (Rp)</label>
              <input
                type="number"
                value={newFixedPlanned}
                onChange={(e) => setNewFixedPlanned(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono"
                placeholder="250000"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Aktual (Rp)</label>
                <input
                  type="number"
                  value={newFixedActual}
                  onChange={(e) => setNewFixedActual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono"
                  placeholder="250000"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                <th className="py-2.5 pr-3">Tgl</th>
                <th className="py-2.5 px-3">Keterangan Operasional</th>
                <th className="py-2.5 px-3">Metode / Kanal</th>
                <th className="py-2.5 px-3 text-right">Rencana</th>
                <th className="py-2.5 px-3 text-right">Aktual</th>
                <th className="py-2.5 px-3 text-center">Status Lunas</th>
                <th className="py-2.5 pl-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {period.fixedCosts.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-3 font-mono tabular-nums text-slate-400">{item.dueDay}</td>
                    <td className="py-3 px-3 font-medium text-slate-100">{item.title}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{item.methodOrPriority}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPlanned}
                          onChange={(e) => setEditPlanned(e.target.value)}
                          aria-label={`Rencana ${item.title}`}
                          className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-slate-100"
                        />
                      ) : (
                        formatIDR(item.planned)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-100 font-medium">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editActual}
                          onChange={(e) => setEditActual(e.target.value)}
                          aria-label={`Aktual ${item.title}`}
                          className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-emerald-400"
                        />
                      ) : (
                        formatIDR(item.actual)
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditIsPaid((prev) => !prev);
                          } else {
                            const nextPaid = !item.isPaid;
                            onToggleFixedPaid(item.id);
                            const nextPlannedTotal = nextPaid
                              ? Math.max(0, summary.fixedCostPlanned - item.planned)
                              : summary.fixedCostPlanned + item.planned;
                            const nextActualTotal = nextPaid
                              ? Math.max(0, summary.fixedCostActual - item.actual)
                              : summary.fixedCostActual + item.actual;
                            onTriggerPopup?.(
                              'REVISED',
                              nextPaid ? 'LUNAS & SIMPAN FIXED COST' : 'AKTIFKAN TAGIHAN FIXED COST',
                              nextPaid
                                ? `Pos "${item.title}" Disimpan Lunas`
                                : `Pos "${item.title}" Dikembalikan Belum Lunas`,
                              nextPaid
                                ? `Tagihan "${item.title}" (Rencana ${formatIDR(
                                    item.planned
                                  )}, Aktual ${formatIDR(
                                    item.actual
                                  )}) telah ditandai LUNAS. TOTAL PENGELUARAN TETAP (FIXED COST) otomatis berkurang menjadi Rencana ${formatIDR(
                                    nextPlannedTotal
                                  )} & Aktual ${formatIDR(nextActualTotal)}.`
                                : `Tagihan "${item.title}" kembali aktif (Belum Lunas). TOTAL PENGELUARAN TETAP (FIXED COST) menjadi Rencana ${formatIDR(
                                    nextPlannedTotal
                                  )} & Aktual ${formatIDR(nextActualTotal)}.`
                            );
                          }
                        }}
                        aria-label={`Toggle status lunas ${item.title}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:opacity-80"
                      >
                        {(isEditing ? editIsPaid : item.isPaid) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Lunas</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400">Belum</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const pVal = Number(editPlanned) || 0;
                                const aVal = Number(editActual) || 0;
                                onUpdateFixedCost({
                                  ...item,
                                  planned: pVal,
                                  actual: aVal,
                                  isPaid: editIsPaid,
                                  updatedAt: new Date().toISOString(),
                                });
                                setEditingId(null);
                                const updatedList = period.fixedCosts.map((fc) =>
                                  fc.id === item.id
                                    ? { ...fc, planned: pVal, actual: aVal, isPaid: editIsPaid }
                                    : fc
                                );
                                const newPlannedSum = updatedList
                                  .filter((fc) => !fc.isPaid)
                                  .reduce((acc, fc) => acc + fc.planned, 0);
                                const newActualSum = updatedList
                                  .filter((fc) => !fc.isPaid)
                                  .reduce((acc, fc) => acc + fc.actual, 0);
                                onTriggerPopup?.(
                                  'REVISED',
                                  'SIMPAN REVISI FIXED COST',
                                  editIsPaid
                                    ? `Pos "${item.title}" Lunas & Total Fixed Cost Berkurang`
                                    : 'Revisi Pengeluaran Tetap Berhasil Disimpan',
                                  `Pos "${item.title}" disimpan (${
                                    editIsPaid ? 'Status: LUNAS ✅' : 'Status: BELUM LUNAS'
                                  }, Rencana ${formatIDR(pVal)}, Aktual ${formatIDR(
                                    aVal
                                  )}). TOTAL PENGELUARAN TETAP (FIXED COST) kini menjadi Rencana ${formatIDR(
                                    newPlannedSum
                                  )} & Aktual ${formatIDR(newActualSum)}.`
                                );
                              }}
                              aria-label={`Simpan ${item.title}`}
                              className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelInlineEdit(item.title)}
                              aria-label={`Batal edit ${item.title}`}
                              className="px-2 py-1 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800 text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Batal</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                startInlineEdit(item.id, item.planned, item.actual, item.isPaid)
                              }
                              aria-label={`Edit ${item.title}`}
                              className="px-2 py-1 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 inline-flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteFixedCost(item.id);
                                onTriggerPopup?.(
                                  'DELETED',
                                  'HAPUS POS TETAP (DELETE)',
                                  'Pos Pengeluaran Tetap Dihapus',
                                  `Pos "${item.title}" (${formatIDR(
                                    item.actual
                                  )}) telah dihapus dari daftar Fixed Cost.`
                                );
                              }}
                              aria-label={`Hapus ${item.title}`}
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
              {(() => {
                const paidPlannedSum = period.fixedCosts
                  .filter((fc) => fc.isPaid)
                  .reduce((acc, fc) => acc + (fc.planned || 0), 0);
                const paidActualSum = period.fixedCosts
                  .filter((fc) => fc.isPaid)
                  .reduce((acc, fc) => acc + (fc.actual || 0), 0);

                return (
                  <>
                    {(paidPlannedSum > 0 || paidActualSum > 0) && (
                      <tr className="border-t border-slate-800/80 text-[11px] text-emerald-300/90">
                        <td colSpan={3} className="pt-2.5">
                          TAGIHAN SUDAH LUNAS (OTOMATIS MENGURANGI TOTAL FIXED COST)
                        </td>
                        <td className="pt-2.5 px-3 text-right font-mono tabular-nums">
                          -{formatIDR(paidPlannedSum)}
                        </td>
                        <td className="pt-2.5 px-3 text-right font-mono tabular-nums">
                          -{formatIDR(paidActualSum)}
                        </td>
                        <td colSpan={2} className="pt-2.5 pl-3 text-right font-mono text-[10px]">
                          {summary.paidFixedCount} Pos Lunas ✅
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-700 font-semibold text-xs">
                      <td colSpan={3} className="pt-3 text-slate-200">
                        TOTAL PENGELUARAN TETAP (FIXED COST)
                        <span className="ml-2 text-[10px] font-normal text-slate-400">
                          (Sisa Tagihan Aktif Belum Lunas: {summary.totalFixedCount - summary.paidFixedCount} Pos)
                        </span>
                      </td>
                      <td
                        data-testid="fixed-cost-total-planned"
                        className="pt-3 px-3 text-right font-mono tabular-nums text-slate-100"
                      >
                        {formatIDR(summary.fixedCostPlanned)}
                      </td>
                      <td
                        data-testid="fixed-cost-total-actual"
                        className="pt-3 px-3 text-right font-mono tabular-nums text-emerald-400"
                      >
                        {formatIDR(summary.fixedCostActual)}
                      </td>
                      <td colSpan={2} className="pt-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerPopup?.(
                              'SUCCESS',
                              'SIMPAN TOTAL FIXED COST',
                              'Total Pengeluaran Tetap (Fixed Cost) Tersimpan',
                              `Rekapitulasi Fixed Cost berhasil disimpan. Total Rencana Aktif: ${formatIDR(
                                summary.fixedCostPlanned
                              )} · Total Aktual Aktif: ${formatIDR(
                                summary.fixedCostActual
                              )} (${summary.paidFixedCount}/${summary.totalFixedCount} Pos Lunas).`
                            )
                          }
                          data-testid="save-fixed-cost-summary-btn"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>Simpan</span>
                        </button>
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tfoot>
          </table>
        </div>
      </section>

      {/* 2. BIAYA LANGGANAN & HUTANG + 3. VARIABLE COST (2-COLUMN GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Subscription Cost & Debt */}
        <section className="lg:col-span-7 rounded-3xl liquid-glass-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-semibold text-white">
                  02. Biaya Langganan &amp; Hutang · Subscription &amp; Debt
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  SPP Sekolah Aira, Aden Hijab, Uang Adat, Forkel &amp; Mental Health Tim IT
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSub((v) => !v)}
                className="px-3 py-1.5 rounded-xl liquid-glass-inset hover:border-emerald-400/40 text-slate-100 text-xs font-medium flex items-center gap-1.5 liquid-btn whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {showAddSub && (
              <form
                onSubmit={handleCreateSub}
                className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Keterangan</label>
                  <input
                    type="text"
                    required
                    value={newSubTitle}
                    onChange={(e) => setNewSubTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                    placeholder="Contoh: Cicilan / SPP"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Prioritas</label>
                  <select
                    value={newSubPriority}
                    onChange={(e) => setNewSubPriority(e.target.value as PriorityLevel)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newSubActual}
                    onChange={(e) => {
                      setNewSubPlanned(e.target.value);
                      setNewSubActual(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
                    placeholder="Nominal"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </form>
            )}

            {/* GRAFIK TRAFIK BAR GANDA 3D (RENCANA POS VS SALDO AKTUAL) — 02. BIAYA LANGGANAN & HUTANG */}
            <div
              data-testid="subdebt-3d-traffic-panel"
              onMouseMove={handleSubDebtMouseMove}
              onMouseLeave={() => {
                setSubDebtTilt3D({ rotateX: 0, rotateY: 0 });
                setHoveredSubBarIdx(null);
              }}
              style={{
                transform: `perspective(1100px) rotateX(${subDebtTilt3D.rotateX}deg) rotateY(${subDebtTilt3D.rotateY}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="mt-4 p-4 rounded-2xl liquid-glass-inset border border-cyan-500/25 space-y-3 relative overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-semibold text-white">
                    Grafik Trafik Bar Ganda 3D (Rencana Pos vs Aktual)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Efek kemiringan perspektif 3D interaktif &amp; animasi shimmer
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />
                    <span>Rencana Pos</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                    <span>Saldo Aktual</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const maxSubVal = Math.max(
                    1,
                    ...period.subscriptionsAndDebts.flatMap((s) => [s.planned, s.actual])
                  );
                  return period.subscriptionsAndDebts.map((sd, idx) => {
                    const plannedPct = Math.min(
                      100,
                      Math.max(5, Math.round((sd.planned / maxSubVal) * 100))
                    );
                    const actualPct = Math.min(
                      100,
                      Math.max(5, Math.round((sd.actual / maxSubVal) * 100))
                    );
                    const ratioPct =
                      sd.planned > 0 ? Math.round((sd.actual / sd.planned) * 100) : 100;
                    const isHovered = hoveredSubBarIdx === idx;

                    return (
                      <div
                        key={`bar-${sd.id}`}
                        onMouseEnter={() => setHoveredSubBarIdx(idx)}
                        onMouseLeave={() => setHoveredSubBarIdx(null)}
                        style={{
                          transform: isHovered ? 'translateZ(10px) scale(1.01)' : 'translateZ(0px)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isHovered
                            ? 'bg-slate-900/90 border-cyan-400/45 shadow-md'
                            : 'bg-slate-950/60 border-white/5'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-white truncate">{sd.title}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                sd.isPaid
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-cyan-500/20 text-cyan-300'
                              }`}
                            >
                              {sd.isPaid ? 'Lunas ✅' : `${ratioPct}% Aktif`}
                            </span>
                          </div>
                          <div className="font-mono tabular-nums text-[11px] flex items-center gap-1.5 shrink-0">
                            <span className="text-slate-400">Rencana: {formatIDR(sd.planned)}</span>
                            <span className="text-slate-600">·</span>
                            <span
                              className={
                                sd.isPaid
                                  ? 'text-emerald-400 font-semibold'
                                  : 'text-cyan-300 font-semibold'
                              }
                            >
                              Aktual: {formatIDR(sd.actual)}
                            </span>
                          </div>
                        </div>

                        {/* Dual 3D Shimmer Bars */}
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400 liquid-bar-fill"
                              style={{ width: `${plannedPct}%` }}
                            />
                          </div>
                          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full liquid-bar-fill bg-gradient-to-r ${
                                sd.isPaid
                                  ? 'from-emerald-500 via-teal-400 to-emerald-300'
                                  : 'from-sky-500 via-cyan-400 to-indigo-400'
                              }`}
                              style={{ width: `${actualPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400">
                    <th className="py-2 pr-2">Tgl</th>
                    <th className="py-2 px-2">Keterangan</th>
                    <th className="py-2 px-2">Prioritas</th>
                    <th className="py-2 px-2 text-right">Rencana</th>
                    <th className="py-2 px-2 text-right">Aktual</th>
                    <th className="py-2 pl-2 text-center">Status / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {period.subscriptionsAndDebts.map((sd) => {
                    const isEditing = editingId === sd.id;
                    return (
                      <tr key={sd.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 pr-2 font-mono text-slate-400">{sd.dueDay}</td>
                        <td className="py-2.5 px-2 text-slate-100 font-medium">{sd.title}</td>
                        <td className="py-2.5 px-2 text-slate-300">{sd.priority}</td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-300">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPlanned}
                              onChange={(e) => setEditPlanned(e.target.value)}
                              className="w-24 px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs"
                            />
                          ) : (
                            formatIDR(sd.planned)
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-100 font-medium">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editActual}
                              onChange={(e) => setEditActual(e.target.value)}
                              className="w-24 px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-emerald-400"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startInlineEdit(sd.id, sd.planned, sd.actual, sd.isPaid)}
                              className="hover:text-emerald-400 underline decoration-dotted cursor-pointer"
                            >
                              {formatIDR(sd.actual)}
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 pl-2 text-center">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const pVal = Number(editPlanned) || 0;
                                  const aVal = Number(editActual) || 0;
                                  onUpdateSubDebt({
                                    ...sd,
                                    planned: pVal,
                                    actual: aVal,
                                    isPaid: editIsPaid,
                                  });
                                  setEditingId(null);
                                  onTriggerPopup?.(
                                    'REVISED',
                                    'SIMPAN LANGGANAN & HUTANG',
                                    'Revisi Langganan & Hutang Disimpan',
                                    `Pos "${sd.title}" berhasil disimpan menjadi Rencana ${formatIDR(
                                      pVal
                                    )} & Aktual ${formatIDR(aVal)}.`
                                  );
                                }}
                                className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-semibold text-[11px] cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelInlineEdit(sd.title)}
                                className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-amber-300 text-[11px] cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextPaid = !sd.isPaid;
                                  onToggleSubDebtPaid(sd.id);
                                  onTriggerPopup?.(
                                    'REVISED',
                                    nextPaid ? 'LUNAS LANGGANAN/HUTANG' : 'AKTIFKAN LANGGANAN/HUTANG',
                                    nextPaid
                                      ? `Pos "${sd.title}" Ditandai Lunas`
                                      : `Pos "${sd.title}" Kembali Aktif`,
                                    `Status "${sd.title}" (${formatIDR(
                                      sd.actual
                                    )}) berhasil diperbarui menjadi ${
                                      nextPaid ? 'LUNAS' : 'AKTIF'
                                    }.`
                                  );
                                }}
                                className="inline-flex items-center gap-1 text-xs cursor-pointer"
                              >
                                {sd.isPaid ? (
                                  <span className="text-emerald-400 font-medium">Lunas</span>
                                ) : (
                                  <span className="text-amber-400 font-medium">Aktif</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  startInlineEdit(sd.id, sd.planned, sd.actual, sd.isPaid)
                                }
                                aria-label={`Revisi ${sd.title}`}
                                className="p-1 rounded text-slate-400 hover:text-emerald-400 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">TOTAL AKTIF BULANAN</span>
            <div className="space-x-3">
              <span className="text-slate-300">Rencana: {formatIDR(summary.subDebtPlanned)}</span>
              <span className="text-emerald-400 font-semibold">
                Aktual: {formatIDR(summary.subDebtActual)}
              </span>
            </div>
          </div>
        </section>

        {/* Variable Cost */}
        <section className="lg:col-span-5 rounded-3xl liquid-glass-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">
                03. Pengeluaran Tidak Tetap · Variable Cost
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Terhubung otomatis dengan Tracker Pengeluaran Sehari-hari &amp; Tracker Jajan/Nongkrong
              </p>
            </div>

            {/* GRAFIK TRAFIK BAR GANDA 3D (RENCANA POS VS SALDO AKTUAL) — 03. PENGELUARAN TIDAK TETAP (VARIABLE COST) */}
            <div
              data-testid="variable-3d-traffic-panel"
              onMouseMove={handleVariableMouseMove}
              onMouseLeave={() => {
                setVariableTilt3D({ rotateX: 0, rotateY: 0 });
                setHoveredVarBarIdx(null);
              }}
              style={{
                transform: `perspective(1100px) rotateX(${variableTilt3D.rotateX}deg) rotateY(${variableTilt3D.rotateY}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="mt-4 p-4 rounded-2xl liquid-glass-inset border border-amber-500/25 space-y-3 relative overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-semibold text-white">
                    Grafik Trafik Bar Ganda 3D (Rencana Pos vs Aktual)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Efek kemiringan perspektif 3D interaktif &amp; animasi shimmer
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block" />
                    <span>Rencana Pos</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                    <span>Saldo Aktual</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const variableTrafficRows = [
                    ...period.variableCosts.map((vc) => {
                      const effectiveActual =
                        period.syncVariableWithTrackers && vc.linkedToTracker === 'DAILY'
                          ? summary.dailyTrackerTotal
                          : period.syncVariableWithTrackers && vc.linkedToTracker === 'HANGOUT'
                          ? summary.hangoutTrackerTotal
                          : vc.actual;
                      return {
                        id: vc.id,
                        label: vc.title,
                        planned: vc.planned,
                        actual: effectiveActual,
                      };
                    }),
                    {
                      id: 'vc-sub-ops',
                      label: 'Pos Operasional & Belanja Harian',
                      planned: 1_000_000,
                      actual: summary.dailyTrackerOperationalTotal,
                    },
                    {
                      id: 'vc-sub-aira',
                      label: 'Pos Jajan De Aira + Nabung (20x)',
                      planned: 2_000_000,
                      actual: summary.dailyTrackerAiraSavingTotal,
                    },
                  ];

                  const maxVarVal = Math.max(
                    1,
                    ...variableTrafficRows.flatMap((r) => [r.planned, r.actual])
                  );

                  return variableTrafficRows.map((row, idx) => {
                    const plannedPct = Math.min(
                      100,
                      Math.max(5, Math.round((row.planned / maxVarVal) * 100))
                    );
                    const actualPct = Math.min(
                      100,
                      Math.max(5, Math.round((row.actual / maxVarVal) * 100))
                    );
                    const ratioPct =
                      row.planned > 0 ? Math.round((row.actual / row.planned) * 100) : 0;
                    const isOver = row.actual > row.planned && row.planned > 0;
                    const isHovered = hoveredVarBarIdx === idx;

                    return (
                      <div
                        key={row.id}
                        onMouseEnter={() => setHoveredVarBarIdx(idx)}
                        onMouseLeave={() => setHoveredVarBarIdx(null)}
                        style={{
                          transform: isHovered ? 'translateZ(10px) scale(1.01)' : 'translateZ(0px)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isHovered
                            ? 'bg-slate-900/90 border-amber-400/45 shadow-md'
                            : 'bg-slate-950/60 border-white/5'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-white truncate">{row.label}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                isOver
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {ratioPct}%
                            </span>
                          </div>
                          <div className="font-mono tabular-nums text-[11px] flex items-center gap-1.5 shrink-0">
                            <span className="text-slate-400">Rencana: {formatIDR(row.planned)}</span>
                            <span className="text-slate-600">·</span>
                            <span
                              className={
                                isOver
                                  ? 'text-rose-400 font-semibold'
                                  : 'text-amber-300 font-semibold'
                              }
                            >
                              Aktual: {formatIDR(row.actual)}
                            </span>
                          </div>
                        </div>

                        {/* Dual 3D Shimmer Bars */}
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400 liquid-bar-fill"
                              style={{ width: `${plannedPct}%` }}
                            />
                          </div>
                          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full liquid-bar-fill bg-gradient-to-r ${
                                isOver
                                  ? 'from-rose-500 via-amber-400 to-orange-400'
                                  : 'from-amber-500 via-yellow-400 to-emerald-400'
                              }`}
                              style={{ width: `${actualPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {period.variableCosts.map((vc) => {
                const effectiveActual =
                  period.syncVariableWithTrackers && vc.linkedToTracker === 'DAILY'
                    ? summary.dailyTrackerTotal
                    : period.syncVariableWithTrackers && vc.linkedToTracker === 'HANGOUT'
                    ? summary.hangoutTrackerTotal
                    : vc.actual;

                const isEditing = editingId === vc.id;

                return (
                  <div
                    key={vc.id}
                    className="p-4 rounded-2xl liquid-glass-inset space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-100">{vc.title}</p>
                        <p className="text-[11px] text-slate-400">
                          Prioritas: {vc.priority} ·{' '}
                          {vc.linkedToTracker
                            ? 'Tersinkronisasi otomatis dari Tracker Harian'
                            : 'Input Manual'}
                        </p>
                      </div>
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const pVal = Number(editPlanned) || 0;
                              const aVal = Number(editActual) || 0;
                              onUpdateVariableCost({
                                ...vc,
                                planned: pVal,
                                actual: aVal,
                              });
                              setEditingId(null);
                              onTriggerPopup?.(
                                'REVISED',
                                'SIMPAN PLAFON VARIABLE COST',
                                'Plafon Variable Cost Disimpan',
                                `Plafon rencana "${vc.title}" berhasil diperbarui menjadi ${formatIDR(
                                  pVal
                                )}.`
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold cursor-pointer"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelInlineEdit(vc.title)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-300 text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startInlineEdit(vc.id, vc.planned, effectiveActual)}
                          className="text-xs text-slate-400 hover:text-slate-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Plafon</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono tabular-nums">
                      <div>
                        <span className="text-slate-400 block text-[10px]">RENCANA PLAFON</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPlanned}
                            onChange={(e) => setEditPlanned(e.target.value)}
                            className="mt-1 w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
                          />
                        ) : (
                          <span className="text-slate-200 font-semibold">{formatIDR(vc.planned)}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">REALISASI AKTUAL</span>
                        <span
                          className={`font-bold ${
                            effectiveActual > vc.planned ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatIDR(effectiveActual)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">TOTAL VARIABLE COST</span>
            <div className="space-x-3">
              <span className="text-slate-300">Rencana: {formatIDR(summary.variablePlanned)}</span>
              <span className="text-amber-300 font-semibold">Aktual: {formatIDR(summary.variableActual)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. PENDAPATAN / INCOME & 5. NABUNG / SAVING MASA DEPAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Income */}
        <section className="lg:col-span-6 rounded-3xl liquid-glass-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-semibold text-white">
                  04. Sumber Pendapatan · Monthly Income
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pekerjaan Utama, Uang Cuti, Saham Digital, Freelance & Investasi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddIncome((v) => !v)}
                className="px-3 py-1.5 rounded-xl liquid-glass-inset hover:border-emerald-400/40 text-slate-100 text-xs font-medium flex items-center gap-1.5 liquid-btn whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sumber</span>
              </button>
            </div>

            {showAddIncome && (
              <form
                onSubmit={handleCreateIncome}
                className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end"
              >
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sumber Pendapatan</label>
                  <input
                    type="text"
                    required
                    value={newIncomeSource}
                    onChange={(e) => setNewIncomeSource(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                    placeholder="Bonus Proyek"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tipe</label>
                  <select
                    value={newIncomeType}
                    onChange={(e) => setNewIncomeType(e.target.value as 'Utama' | 'Sampingan')}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                  >
                    <option value="Utama">Utama</option>
                    <option value="Sampingan">Sampingan</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newIncomeAmount}
                    onChange={(e) => setNewIncomeAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100"
                    placeholder="Nominal"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 divide-y divide-slate-800/70 text-xs">
              {period.incomes.map((inc) => {
                const isEditing = editingId === inc.id;
                return (
                  <div key={inc.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{inc.source}</p>
                      <p className="text-[11px] text-slate-400">Kategori: {inc.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={editActual}
                            onChange={(e) => setEditActual(e.target.value)}
                            className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateIncome({
                                ...inc,
                                amount: Number(editActual) || 0,
                              });
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                          >
                            Simpan
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-mono tabular-nums font-semibold text-slate-100">
                            {formatIDR(inc.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => startInlineEdit(inc.id, inc.amount, inc.amount)}
                            aria-label={`Edit pendapatan ${inc.source}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">TOTAL PENDAPATAN BULANAN</span>
            <span className="text-emerald-400 font-bold text-sm">{formatIDR(summary.totalIncome)}</span>
          </div>
        </section>

        {/* Saving "MASA DEPAN" */}
        <section className="lg:col-span-6 rounded-3xl liquid-glass-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">
                05. Nabung / Saving "Masa Depan"
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Alokasi Dana Darurat, Investasi Saham, Beli Emas, Crypto & Celengan
              </p>
            </div>

            <div className="mt-4 divide-y divide-white/10 text-xs">
              {period.savings.map((sav) => {
                const isEditing = editingId === sav.id;
                return (
                  <div key={sav.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{sav.title}</p>
                      <p className="text-[11px] text-slate-400">
                        Prioritas: {sav.priority} · Rencana: {formatIDR(sav.planned)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={editActual}
                            onChange={(e) => setEditActual(e.target.value)}
                            className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-xs text-amber-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateSaving({
                                ...sav,
                                planned: Number(editActual) || sav.planned,
                                actual: Number(editActual) || 0,
                              });
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold text-xs cursor-pointer"
                          >
                            Simpan
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-mono tabular-nums font-semibold text-amber-300">
                            {formatIDR(sav.actual)}
                          </span>
                          <button
                            type="button"
                            onClick={() => startInlineEdit(sav.id, sav.planned, sav.actual)}
                            aria-label={`Edit tabungan ${sav.title}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-300">TOTAL TABUNGAN MASA DEPAN</span>
            <span className="text-amber-300 font-bold text-sm">{formatIDR(summary.savingActual)}</span>
          </div>
        </section>
      </div>

      {/* 6. CATATAN HUTANG KHUSUS (SESUAI BARIS 140-141 CSV) */}
      <section className="rounded-3xl liquid-glass-interactive p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">
              06. Catatan Kewajiban Khusus
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Rekap catatan kewajiban bawah spreadsheet: Hutang Kas Masjid dan Hutang PLN Mobile Tagihan
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-rose-400 font-semibold">
            Sisa Kewajiban Khusus: {formatIDR(summary.totalSpecialLiabilities)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {period.specialLiabilities.map((liab) => (
            <div
              key={liab.id}
              className="p-4 rounded-2xl liquid-glass-inset flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100">{liab.title}</span>
                  {liab.category === 'HUTANG_KHUSUS' && (
                    <button
                      type="button"
                      onClick={() => onToggleSpecialLiability(liab.id)}
                      className="text-xs text-emerald-400 hover:underline cursor-pointer"
                    >
                      {liab.isSettled ? 'Lunas ✅' : 'Tandai Lunas'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{liab.detail}</p>
              </div>
              {liab.amount > 0 && (
                <p
                  className={`text-sm font-bold font-mono tabular-nums ${
                    liab.isSettled ? 'text-slate-500 line-through' : 'text-rose-400'
                  }`}
                >
                  {formatIDR(liab.amount)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
