import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import type { AlertStatus, ProcessRiskLevel, SeverityLevel } from '../../types/security';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  elevated = false,
}) => {
  return (
    <div
      className={`${elevated ? 'ks-glass-elevated' : 'ks-glass'} rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
};

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactiveTilt?: boolean;
  reducedMotion?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  interactiveTilt = false,
  reducedMotion = false,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveTilt || reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({
      transform: `perspective(900px) rotateX(${(-py * 3.5).toFixed(2)}deg) rotateY(${(px * 3.5).toFixed(2)}deg) translateY(-2px)`,
    });
  };

  const handleMouseLeave = () => {
    if (!interactiveTilt) return;
    setTiltStyle({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)' });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={tiltStyle}
      className={`ks-glass ks-glass-interactive rounded-2xl p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

interface GlassMetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  supportingText: string;
  trendText: string;
  trendDirection: 'up' | 'down' | 'neutral';
  accentTone: 'blue' | 'cyan' | 'amber' | 'emerald' | 'crimson';
  icon: React.ReactNode;
  reducedMotion: boolean;
  className?: string;
  onClick?: () => void;
}

export const GlassMetricCard: React.FC<GlassMetricCardProps> = ({
  label,
  value,
  suffix = '',
  supportingText,
  trendText,
  trendDirection,
  accentTone,
  icon,
  reducedMotion,
  className = '',
  onClick,
}) => {
  const [displayValue, setDisplayValue] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 520;
    const from = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reducedMotion]);

  const toneClasses: Record<GlassMetricCardProps['accentTone'], string> = {
    blue: 'text-sky-300 bg-sky-500/12 border-sky-400/20',
    cyan: 'text-cyan-300 bg-cyan-500/12 border-cyan-400/20',
    amber: 'text-amber-300 bg-amber-500/12 border-amber-400/20',
    emerald: 'text-emerald-300 bg-emerald-500/12 border-emerald-400/20',
    crimson: 'text-rose-300 bg-rose-500/12 border-rose-400/20',
  };

  return (
    <GlassCard
      interactiveTilt
      reducedMotion={reducedMotion}
      onClick={onClick}
      className={`flex flex-col justify-between gap-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-400">{label}</p>
          <p className="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {displayValue.toLocaleString()}
            {suffix}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClasses[accentTone]}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1 border-t border-slate-300/10 pt-3 text-xs">
        <span className="truncate text-slate-400">{supportingText}</span>
        <span
          className={`inline-flex items-center gap-1 font-medium tabular-nums ${
            trendDirection === 'up'
              ? 'text-cyan-300'
              : trendDirection === 'down'
                ? 'text-emerald-300'
                : 'text-slate-300'
          }`}
        >
          {trendDirection === 'up' && <TrendingUp className="h-3.5 w-3.5 shrink-0" />}
          {trendDirection === 'down' && <TrendingDown className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{trendText}</span>
        </span>
      </div>
    </GlassCard>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel | ProcessRiskLevel }> = ({
  severity,
}) => {
  const styles: Record<string, { wrap: string; icon: React.ReactNode }> = {
    Critical: {
      wrap: 'text-rose-300 bg-rose-500/14 border-rose-400/30',
      icon: <AlertOctagon className="h-3.5 w-3.5 shrink-0" />,
    },
    'High Risk': {
      wrap: 'text-rose-300 bg-rose-500/14 border-rose-400/30',
      icon: <AlertOctagon className="h-3.5 w-3.5 shrink-0" />,
    },
    High: {
      wrap: 'text-amber-300 bg-amber-500/14 border-amber-400/30',
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
    },
    Suspicious: {
      wrap: 'text-amber-300 bg-amber-500/14 border-amber-400/30',
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
    },
    Medium: {
      wrap: 'text-sky-300 bg-sky-500/14 border-sky-400/30',
      icon: <Info className="h-3.5 w-3.5 shrink-0" />,
    },
    Informational: {
      wrap: 'text-cyan-300 bg-cyan-500/14 border-cyan-400/30',
      icon: <Info className="h-3.5 w-3.5 shrink-0" />,
    },
    Low: {
      wrap: 'text-emerald-300 bg-emerald-500/14 border-emerald-400/30',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    },
    Normal: {
      wrap: 'text-emerald-300 bg-emerald-500/14 border-emerald-400/30',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    },
  };

  const entry = styles[severity] ?? styles.Medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${entry.wrap}`}
    >
      {entry.icon}
      <span>{severity}</span>
    </span>
  );
};

export const StatusLabel: React.FC<{ status: AlertStatus | string }> = ({ status }) => {
  const tone =
    status === 'Resolved' || status === 'Closed' || status === 'Nominal'
      ? 'text-emerald-300'
      : status === 'Investigating' || status === 'Containment Review' || status === 'Correlated'
        ? 'text-cyan-300'
        : status === 'New' || status === 'Flagged' || status === 'Open'
          ? 'text-amber-300'
          : 'text-slate-300';

  return <span className={`text-xs font-medium whitespace-nowrap ${tone}`}>{status}</span>;
};

export const DemoBadge: React.FC<{ label?: string }> = ({ label = 'DEMO TELEMETRY' }) => (
  <span className="inline-flex items-center rounded-md border border-cyan-300/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide text-cyan-200 whitespace-nowrap shrink-0">
    {label}
  </span>
);

interface GlassChartProps {
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const GlassChart: React.FC<GlassChartProps> = ({
  title,
  subtitle,
  rightSlot,
  children,
  className = '',
}) => {
  return (
    <GlassCard className={`flex flex-col justify-between gap-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        </div>
        {rightSlot}
      </div>
      <div className="w-full">{children}</div>
    </GlassCard>
  );
};

interface GlassDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const GlassDrawer: React.FC<GlassDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/65"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close drawer backdrop"
        onClick={onClose}
        className="flex-1 cursor-default bg-transparent"
      />
      <div className="ks-glass-elevated flex h-full w-full max-w-xl flex-col border-l border-sky-300/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-300/10 px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display truncate text-lg font-semibold text-slate-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300/15 bg-slate-800/60 text-slate-300 transition-colors hover:border-cyan-300/35 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="ks-glass-elevated w-full max-w-2xl overflow-hidden rounded-2xl border border-sky-300/20">
        <div className="flex items-center justify-between border-b border-slate-300/10 px-5 py-3.5">
          <h2 className="font-display text-base font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300/15 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
