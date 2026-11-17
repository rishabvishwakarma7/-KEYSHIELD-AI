import React, { useState } from 'react';
import { MessageSquarePlus, UserCheck } from 'lucide-react';
import type { IncidentRecord, InspectorSelection, ThreatAlert } from '../types/security';
import { DemoBadge, GlassCard, SeverityBadge, StatusLabel } from '../components/ui/GlassPrimitives';

interface IncidentManagementPageProps {
  incidents: IncidentRecord[];
  alerts: ThreatAlert[];
  onUpdateIncidentStatus: (incidentId: string, status: IncidentRecord['status']) => void;
  onAddIncidentNote: (incidentId: string, text: string) => void;
  onInspect: (sel: InspectorSelection) => void;
}

const INCIDENT_STATUSES: IncidentRecord['status'][] = [
  'Open',
  'Investigating',
  'Containment Review',
  'Closed',
];

export const IncidentManagementPage: React.FC<IncidentManagementPageProps> = ({
  incidents,
  alerts,
  onUpdateIncidentStatus,
  onAddIncidentNote,
  onInspect,
}) => {
  const [selectedId, setSelectedId] = useState(incidents[0]?.id ?? '');
  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState('');

  const activeIncident = incidents.find((i) => i.id === selectedId) ?? incidents[0];
  const relatedAlerts = alerts.filter((a) => activeIncident?.relatedAlertIds.includes(a.id));

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident) return;
    if (!noteInput.trim()) {
      setNoteError('Please enter an investigation note.');
      return;
    }
    setNoteError('');
    onAddIncidentNote(activeIncident.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Incident Management</h1>
            <DemoBadge label="SOC CASE WORKSPACE" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Coordinate multi-alert endpoint investigations, evidence chains, and containment sign-offs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Incident Queue */}
        <div className="space-y-3 xl:col-span-4">
          {incidents.map((inc) => {
            const selected = inc.id === activeIncident?.id;
            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => {
                  setSelectedId(inc.id);
                  onInspect({ kind: 'incident', id: inc.id });
                }}
                className={`ks-glass w-full rounded-2xl p-4 text-left transition-all ${
                  selected ? 'border-cyan-300/45' : 'hover:border-sky-300/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-300">{inc.id}</span>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <h2 className="mt-2 text-sm font-semibold text-slate-100">{inc.title}</h2>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-sky-300" />
                    {inc.assignedAnalyst}
                  </span>
                  <StatusLabel status={inc.status} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Incident Details */}
        {activeIncident && (
          <GlassCard className="space-y-5 xl:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300/10 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono font-semibold text-cyan-300">{activeIncident.id}</span>
                  <span>·</span>
                  <span className="font-mono">{activeIncident.endpointId}</span>
                  <span>·</span>
                  <span>Analyst: {activeIncident.assignedAnalyst}</span>
                </div>
                <h2 className="font-display mt-1 text-lg font-semibold text-slate-50">
                  {activeIncident.title}
                </h2>
              </div>
              <SeverityBadge severity={activeIncident.severity} />
            </div>

            {/* Status Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-300">Case Lifecycle</span>
              <div className="flex flex-wrap gap-1.5">
                {INCIDENT_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateIncidentStatus(activeIncident.id, st)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      activeIncident.status === st
                        ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                        : 'border-slate-300/15 bg-slate-900/45 text-slate-300 hover:border-cyan-300/30'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Summary */}
            <div className="rounded-xl border border-slate-300/10 bg-slate-950/45 p-3.5 text-xs">
              <div className="font-semibold text-slate-200">Resolution &amp; Containment Summary</div>
              <p className="mt-1 leading-relaxed text-slate-300">
                {activeIncident.resolutionSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Evidence Collection */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200">Evidence Collection</h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeIncident.evidenceCollection.map((ev, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border border-slate-300/10 bg-slate-900/45 px-3 py-2"
                    >
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200">Case Activity Timeline</h3>
                <div className="space-y-1.5 text-xs">
                  {activeIncident.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-300/10 bg-slate-900/45 px-3 py-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-cyan-300 tabular-nums">
                          {item.timestamp}
                        </span>
                        <span className="font-mono">{item.actor}</span>
                      </div>
                      <div className="mt-0.5 text-slate-200">{item.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Alerts */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-200">
                Correlated Alerts ({relatedAlerts.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedAlerts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onInspect({ kind: 'alert', id: a.id })}
                    className="rounded-xl border border-slate-300/15 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/35"
                  >
                    <span className="font-mono font-semibold text-cyan-300">{a.id}</span> · {a.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Investigation Notes */}
            <div className="space-y-2.5 border-t border-slate-300/10 pt-4">
              <h3 className="text-xs font-semibold text-slate-200">Case Notes</h3>
              {activeIncident.notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-300/10 bg-slate-900/45 p-3 text-xs"
                >
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-cyan-200">{n.author}</span>
                    <span className="font-mono tabular-nums">{n.timestamp}</span>
                  </div>
                  <p className="mt-1 text-slate-200">{n.content}</p>
                </div>
              ))}
              <form onSubmit={handleNoteSubmit} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => {
                      setNoteInput(e.target.value);
                      if (noteError) setNoteError('');
                    }}
                    aria-label="Add incident case note"
                    placeholder="Document containment or forensic handoff note..."
                    className="h-9.5 flex-1 rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-3.5 text-xs font-semibold text-cyan-100 whitespace-nowrap shrink-0"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Log Note
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
