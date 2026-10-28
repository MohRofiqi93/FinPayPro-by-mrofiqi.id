import React from 'react';

export type Payment3DVisualKey =
  | 'ALL'
  | 'TUNAI'
  | 'BANK'
  | 'EWALLET'
  | 'GOPAY'
  | 'DANA'
  | 'BRI'
  | 'BCA'
  | 'BSI'
  | 'COD'
  | 'TF'
  | 'QRIS'
  | 'OPTIONAL'
  | 'OPERASIONAL'
  | 'AIRA_SAVING';

interface Payment3DIconProps {
  kind: Payment3DVisualKey | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

interface PaletteSpec {
  gradient: string;
  border: string;
  glow: string;
  iconColor: string;
}

function resolveVisualKey(raw: string): Payment3DVisualKey {
  const upper = (raw || '').trim().toUpperCase();
  if (upper === 'ALL' || upper === 'SEMUA') return 'ALL';
  if (upper === 'TUNAI' || upper === 'CASH') return 'TUNAI';
  if (upper === 'BANK') return 'BANK';
  if (upper === 'EWALLET' || upper === 'E-WALLET') return 'EWALLET';
  if (upper === 'GOPAY') return 'GOPAY';
  if (upper === 'DANA') return 'DANA';
  if (upper === 'BRI') return 'BRI';
  if (upper === 'BCA') return 'BCA';
  if (upper === 'BSI') return 'BSI';
  if (upper === 'COD') return 'COD';
  if (upper === 'TF' || upper === 'TRANSFER') return 'TF';
  if (upper === 'QRIS') return 'QRIS';
  if (upper === 'OPERASIONAL') return 'OPERASIONAL';
  if (upper === 'AIRA_SAVING' || upper === 'AIRA') return 'AIRA_SAVING';
  return 'OPTIONAL';
}

const PALETTES: Record<Payment3DVisualKey, PaletteSpec> = {
  ALL: {
    gradient: 'from-amber-400 via-orange-500 to-amber-700',
    border: 'border-amber-300/60',
    glow: 'shadow-[0_2px_6px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  TUNAI: {
    gradient: 'from-emerald-400 via-green-500 to-teal-700',
    border: 'border-emerald-300/60',
    glow: 'shadow-[0_2px_6px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  BANK: {
    gradient: 'from-blue-400 via-indigo-500 to-blue-800',
    border: 'border-blue-300/60',
    glow: 'shadow-[0_2px_6px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  EWALLET: {
    gradient: 'from-cyan-400 via-sky-500 to-violet-700',
    border: 'border-cyan-300/60',
    glow: 'shadow-[0_2px_6px_rgba(6,182,212,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  GOPAY: {
    gradient: 'from-cyan-300 via-sky-500 to-teal-700',
    border: 'border-cyan-200/70',
    glow: 'shadow-[0_2px_6px_rgba(14,165,233,0.38),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  DANA: {
    gradient: 'from-sky-400 via-blue-500 to-indigo-700',
    border: 'border-sky-300/70',
    glow: 'shadow-[0_2px_6px_rgba(59,130,246,0.38),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  BRI: {
    gradient: 'from-blue-400 via-blue-600 to-indigo-900',
    border: 'border-blue-300/65',
    glow: 'shadow-[0_2px_6px_rgba(37,99,235,0.38),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  BCA: {
    gradient: 'from-indigo-400 via-blue-600 to-slate-900',
    border: 'border-indigo-300/65',
    glow: 'shadow-[0_2px_6px_rgba(99,102,241,0.38),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  BSI: {
    gradient: 'from-teal-300 via-emerald-500 to-teal-800',
    border: 'border-teal-200/70',
    glow: 'shadow-[0_2px_6px_rgba(20,184,166,0.38),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  COD: {
    gradient: 'from-emerald-300 via-emerald-500 to-green-800',
    border: 'border-emerald-200/70',
    glow: 'shadow-[0_2px_6px_rgba(16,185,129,0.38),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  TF: {
    gradient: 'from-cyan-300 via-blue-500 to-indigo-700',
    border: 'border-cyan-200/70',
    glow: 'shadow-[0_2px_6px_rgba(6,182,212,0.38),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  QRIS: {
    gradient: 'from-fuchsia-400 via-purple-500 to-indigo-700',
    border: 'border-fuchsia-300/65',
    glow: 'shadow-[0_2px_6px_rgba(217,70,239,0.38),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
  OPTIONAL: {
    gradient: 'from-amber-300 via-amber-500 to-orange-700',
    border: 'border-amber-200/70',
    glow: 'shadow-[0_2px_6px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  OPERASIONAL: {
    gradient: 'from-emerald-400 via-cyan-500 to-teal-700',
    border: 'border-emerald-300/60',
    glow: 'shadow-[0_2px_6px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-slate-950',
  },
  AIRA_SAVING: {
    gradient: 'from-amber-300 via-pink-500 to-rose-600',
    border: 'border-amber-200/70',
    glow: 'shadow-[0_2px_6px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1.5px_0_rgba(0,0,0,0.35)]',
    iconColor: 'text-white',
  },
};

/**
 * Proportional 3D Colored Mini Icon Badge.
 * Designed to sit cleanly beside text labels (`shrink-0`) without colliding with typography.
 */
export const Payment3DIcon: React.FC<Payment3DIconProps> = ({
  kind,
  size = 'sm',
  className = '',
}) => {
  const key = resolveVisualKey(kind);
  const palette = PALETTES[key] || PALETTES.OPTIONAL;

  const boxDims =
    size === 'xs'
      ? 'w-3.5 h-3.5 rounded-[5px]'
      : size === 'md'
      ? 'w-5 h-5 rounded-lg'
      : 'w-4 h-4 rounded-md';

  const svgDims =
    size === 'xs' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 bg-gradient-to-br ${palette.gradient} border ${palette.border} ${palette.glow} ${boxDims} ${palette.iconColor} select-none ${className}`}
    >
      {key === 'ALL' && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <path
            d="M8 1.5L14 5L8 8.5L2 5L8 1.5Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          <path
            d="M2 8.2L8 11.7L14 8.2M2 11.2L8 14.5L14 11.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {(key === 'TUNAI' || key === 'COD') && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <rect
            x="1.5"
            y="3.5"
            width="13"
            height="9"
            rx="1.8"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="8" cy="8" r="2.2" fill="currentColor" />
        </svg>
      )}

      {(key === 'BANK' || key === 'BRI' || key === 'BCA' || key === 'BSI') && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <path
            d="M8 1.8L14.2 5.2H1.8L8 1.8Z"
            fill="currentColor"
          />
          <path
            d="M3.5 6.5V11.2M6.5 6.5V11.2M9.5 6.5V11.2M12.5 6.5V11.2M2 13.2H14"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
        </svg>
      )}

      {(key === 'EWALLET' || key === 'GOPAY' || key === 'DANA') && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <rect
            x="2"
            y="3.2"
            width="12"
            height="9.6"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.55"
          />
          <path
            d="M10 6.5H14V9.5H10C9.2 9.5 8.5 8.8 8.5 8C8.5 7.2 9.2 6.5 10 6.5Z"
            fill="currentColor"
          />
        </svg>
      )}

      {key === 'TF' && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <path
            d="M2.5 5.5H12.5M12.5 5.5L9.8 2.8M12.5 5.5L9.8 8.2M13.5 10.5H3.5M3.5 10.5L6.2 7.8M3.5 10.5L6.2 13.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {key === 'QRIS' && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <rect x="2" y="2" width="4.5" height="4.5" rx="0.8" fill="currentColor" />
          <rect x="9.5" y="2" width="4.5" height="4.5" rx="0.8" fill="currentColor" />
          <rect x="2" y="9.5" width="4.5" height="4.5" rx="0.8" fill="currentColor" />
          <rect x="9.5" y="9.5" width="2.2" height="2.2" fill="currentColor" />
          <rect x="12" y="12" width="2.2" height="2.2" fill="currentColor" />
        </svg>
      )}

      {key === 'OPERASIONAL' && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <path
            d="M3 4.5H13.5L12.2 10.2H4.2L3 4.5ZM3 4.5L2.2 2.5H1"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="5.2" cy="13" r="1.3" fill="currentColor" />
          <circle cx="11.2" cy="13" r="1.3" fill="currentColor" />
        </svg>
      )}

      {(key === 'OPTIONAL' || key === 'AIRA_SAVING') && (
        <svg viewBox="0 0 16 16" fill="none" className={svgDims}>
          <path
            d="M8 2L9.8 5.7L13.9 6.3L10.9 9.1L11.6 13.2L8 11.3L4.4 13.2L5.1 9.1L2.1 6.3L6.2 5.7L8 2Z"
            fill="currentColor"
          />
        </svg>
      )}
    </span>
  );
};
