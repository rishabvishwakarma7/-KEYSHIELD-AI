import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import type {
  IncidentRecord,
  InspectorSelection,
  MitreTechnique,
  ProcessNode,
  RouteId,
  SecurityEvent,
  ThreatAlert,
} from '../types/security';
import { NAV_ITEMS } from '../layouts/FloatingSidebar';
import { runGlobalSearch } from '../services/securityAdapter';
import { SeverityBadge } from './ui/GlassPrimitives';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: RouteId) => void;
  onInspect: (sel: InspectorSelection, route?: RouteId) => void;
  events: SecurityEvent[];
  alerts: ThreatAlert[];
  processes: ProcessNode[];
  incidents: IncidentRecord[];
  mitre: MitreTechnique[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onNavigate,
  onInspect,
  events,
  alerts,
  processes,
  incidents,
  mitre,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const matchingRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS.slice(0, 6);
    return NAV_ITEMS.filter((n) => `${n.label} ${n.section}`.toLowerCase().includes(q));
  }, [query]);

  const results = useMemo(
    () => runGlobalSearch(query, { events, alerts, processes, incidents, mitre }),
    [query, events, alerts, processes, incidents, mitre],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/75 px-4 pt-20"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette and Global Search"
    >
      <div className="ks-glass-elevated w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-300/25">
        <div className="flex items-center gap-3 border-b border-slate-300/10 px-4 py-3">
          <Search className="h-4 w-4 text-cyan-300 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a workspace page, alert ID, process name, event, or MITRE technique (e.g. T1056)..."
            aria-label="Global search input"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300/15 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-xs">
          {matchingRoutes.length > 0 && (
            <div>
              <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-400">
                Workspace Navigation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {matchingRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        onNavigate(route.id);
                        onClose();
                      }}
                      className="flex items-center justify-between rounded-xl border border-slate-300/10 bg-slate-900/45 px-3 py-2 text-left text-slate-200 hover:border-cyan-300/35 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-cyan-300" />
                        <span>{route.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{route.section}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {results.alerts.length > 0 && (
            <div>
              <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-400">
                Threat Alerts (DEMO)
              </div>
              <div className="space-y-1">
                {results.alerts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      onInspect({ kind: 'alert', id: a.id }, 'threat-alerts');
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300/10 bg-slate-900/40 px-3 py-2 text-left hover:border-cyan-300/35"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-semibold text-cyan-300">{a.id}</span>
                      <span className="ml-2 text-slate-200">{a.title}</span>
                    </div>
                    <SeverityBadge severity={a.severity} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.processes.length > 0 && (
            <div>
              <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-400">
                Processes (DEMO)
              </div>
              <div className="space-y-1">
                {results.processes.map((p) => (
                  <button
                    key={p.pid}
                    type="button"
                    onClick={() => {
                      onInspect({ kind: 'process', pid: p.pid }, 'process-explorer');
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300/10 bg-slate-900/40 px-3 py-2 text-left hover:border-cyan-300/35"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-mono font-semibold text-slate-100">{p.name}</span>
                      <span className="ml-2 font-mono text-slate-400">PID {p.pid}</span>
                    </div>
                    <SeverityBadge severity={p.riskLevel} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.mitre.length > 0 && (
            <div>
              <div className="mb-1.5 px-2 text-[11px] font-semibold text-slate-400">
                MITRE ATT&amp;CK Techniques
              </div>
              <div className="space-y-1">
                {results.mitre.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onInspect({ kind: 'mitre', id: m.id }, 'mitre-attack');
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300/10 bg-slate-900/40 px-3 py-2 text-left hover:border-cyan-300/35"
                  >
                    <span>
                      <span className="font-mono font-semibold text-violet-300">{m.id}</span>
                      <span className="ml-2 text-slate-200">{m.name}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
