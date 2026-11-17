import React, { useMemo, useState } from 'react';
import { MessageSquarePlus, ShieldAlert } from 'lucide-react';
import type { AlertStatus, InspectorSelection, ThreatAlert } from '../types/security';
import { DemoBadge, GlassCard, SeverityBadge, StatusLabel } from '../components/ui/GlassPrimitives';

interface ThreatAlertsPageProps {
  alerts: ThreatAlert[];
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  onAddNote: (alertId: string, noteText: string) => void;
  onInspect: (sel: InspectorSelection) => void;
}

const ALERT_STATUSES: AlertStatus[] = ['New', 'Investigating', 'Resolved', 'False Positive'];

export const ThreatAlertsPage: React.FC<ThreatAlertsPageProps> = ({
  alerts,
  onUpdateStatus,
  onAddNote,
  onInspect,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | AlertStatus>('All');
  const [selectedId, setSelectedId] = useState<string>(alerts[0]?.id ?? '');
  const [noteDraft, setNoteDraft] = useState('');
  const [noteError, setNoteError] = useState('');

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return alerts;
    return alerts.filter((a) => a.status === statusFilter);
  }, [alerts, statusFilter]);

  const activeAlert = alerts.find((a) => a.id === selectedId) ?? filtered[0] ?? alerts[0];

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlert) return;
    if (!noteDraft.trim()) {
      setNoteError('Please enter an analyst observation before saving.');
      return;
    }
    setNoteError('');
    onAddNote(activeAlert.id, noteDraft.trim());
    setNoteDraft('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Threat Alerts</h1>
            <DemoBadge label="DEMO ALERT QUEUE" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Triage behavioral detections across process activity, registry persistence, drivers, files, and network anomalies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-300/15 bg-slate-900/50 p-1 text-xs">
          {(['All', ...ALERT_STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors whitespace-nowrap ${
                statusFilter === st ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Alert Queue List */}
        <div className="space-y-3 xl:col-span-5">
          {filtered.map((alert) => {
            const isSelected = activeAlert?.id === alert.id;
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  setSelectedId(alert.id);
                  onInspect({ kind: 'alert', id: alert.id });
                }}
                className={`ks-glass w-full rounded-2xl p-4 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-300/45 shadow-[0_0_28px_-8px_rgba(34,211,238,0.3)]'
                    : 'hover:border-sky-300/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-300">{alert.id}</span>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <h2 className="mt-2 text-sm font-semibold text-slate-100">{alert.title}</h2>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>
                    {alert.category} · <span className="font-mono text-slate-300">{alert.processName}</span>
                  </span>
                  <StatusLabel status={alert.status} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Alert Investigation Workspace */}
        {activeAlert && (
          <GlassCard className="space-y-5 xl:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300/10 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                  <span className="font-mono font-semibold text-cyan-300">{activeAlert.id}</span>
                  <span>·</span>
                  <span className="font-mono">{activeAlert.endpointId}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{activeAlert.timestamp}</span>
                </div>
                <h2 className="font-display text-lg font-semibold text-slate-50">
                  {activeAlert.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={activeAlert.severity} />
                <div className="rounded-xl border border-slate-300/15 bg-slate-900/55 px-3 py-1 font-mono text-xs font-semibold text-slate-100 tabular-nums">
                  Risk {activeAlert.riskScore}/100
                </div>
              </div>
            </div>

            {/* Workflow Status Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-medium text-slate-300">Alert Triage Status</div>
              <div className="flex flex-wrap gap-1.5">
                {ALERT_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateStatus(activeAlert.id, st)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      activeAlert.status === st
                        ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                        : 'border-slate-300/15 bg-slate-900/45 text-slate-300 hover:border-cyan-300/30'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-200">{activeAlert.description}</p>

            {/* Rule & MITRE Mapping */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-300/10 bg-slate-950/45 p-3.5 text-xs sm:grid-cols-2">
              <div>
                <div className="text-[11px] text-slate-400">Detection Rule</div>
                <div className="mt-0.5 font-mono font-semibold text-slate-100">
                  {activeAlert.detectionRuleId}
                </div>
                <div className="mt-0.5 text-slate-300">{activeAlert.detectionRuleName}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">MITRE ATT&amp;CK Mapping</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono font-semibold text-violet-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {activeAlert.mitreId}
                </div>
                <div className="mt-0.5 text-slate-300">{activeAlert.mitreName}</div>
              </div>
            </div>

            {/* Evidence */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-200">Observed Evidence</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeAlert.evidence.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-slate-300/10 bg-slate-900/45 px-3 py-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Analyst Notes */}
            <div className="space-y-3 border-t border-slate-300/10 pt-4">
              <h3 className="text-xs font-semibold text-slate-200">
                Analyst Investigation Notes ({activeAlert.notes.length})
              </h3>
              {activeAlert.notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-300/10 bg-slate-900/45 p-3 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-cyan-200">{n.author}</span>
                    <span className="font-mono tabular-nums">{n.timestamp}</span>
                  </div>
                  <p className="mt-1 text-slate-200">{n.content}</p>
                </div>
              ))}

              <form onSubmit={handleSubmitNote} className="space-y-2">
                <label htmlFor="alert-note-input" className="sr-only">
                  Add analyst note
                </label>
                <div className="flex gap-2">
                  <input
                    id="alert-note-input"
                    type="text"
                    value={noteDraft}
                    onChange={(e) => {
                      setNoteDraft(e.target.value);
                      if (noteError) setNoteError('');
                    }}
                    placeholder="Record investigation observation or triage finding..."
                    className="h-9.5 flex-1 rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-3.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30 whitespace-nowrap shrink-0"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Add Note
                  </button>
                </div>
                {noteError && <p className="text-[11px] text-rose-300">{noteError}</p>}
              </form>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
