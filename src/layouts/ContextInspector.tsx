import React, { useState } from 'react';
import { Bot, ChevronRight, FileText, Layers, Shield, X } from 'lucide-react';
import type {
  IncidentRecord,
  InspectorSelection,
  MitreTechnique,
  ProcessNode,
  RouteId,
  SecurityEvent,
  ThreatAlert,
} from '../types/security';
import { synthesizeDemoAIResponse } from '../services/securityAdapter';
import { DemoBadge, SeverityBadge, StatusLabel } from '../components/ui/GlassPrimitives';

interface ContextInspectorProps {
  open: boolean;
  onClose: () => void;
  selection: InspectorSelection;
  alerts: ThreatAlert[];
  events: SecurityEvent[];
  processes: ProcessNode[];
  incidents: IncidentRecord[];
  mitre: MitreTechnique[];
  onNavigate: (route: RouteId) => void;
  onSelectItem: (sel: InspectorSelection) => void;
}

type InspectorTab = 'Overview' | 'Evidence' | 'Related Events' | 'AI Insights';

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  open,
  onClose,
  selection,
  alerts,
  events,
  processes,
  incidents,
  mitre,
  onNavigate,
  onSelectItem,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('Overview');

  if (!open) return null;

  const selectedAlert =
    selection.kind === 'alert'
      ? alerts.find((a) => a.id === selection.id)
      : undefined;
  const selectedEvent =
    selection.kind === 'event'
      ? events.find((e) => e.id === selection.id)
      : undefined;
  const selectedProcess =
    selection.kind === 'process'
      ? processes.find((p) => p.pid === selection.pid)
      : undefined;
  const selectedIncident =
    selection.kind === 'incident'
      ? incidents.find((i) => i.id === selection.id)
      : undefined;
  const selectedMitre =
    selection.kind === 'mitre'
      ? mitre.find((m) => m.id === selection.id)
      : undefined;

  const relatedEvents = (() => {
    if (selectedAlert) {
      return events.filter((e) => selectedAlert.relatedEventIds.includes(e.id));
    }
    if (selectedProcess) {
      return events.filter((e) => selectedProcess.associatedEventIds.includes(e.id));
    }
    if (selectedEvent) {
      return events.filter((e) => e.pid === selectedEvent.pid && e.id !== selectedEvent.id);
    }
    return events.slice(0, 4);
  })();

  const aiInsight = synthesizeDemoAIResponse('Why was this process flagged?', {
    alerts,
    processes,
    events,
    selectedAlertId: selectedAlert?.id,
    selectedPid: selectedProcess?.pid ?? selectedEvent?.pid,
  });

  const title =
    selectedAlert?.id ??
    selectedEvent?.id ??
    (selectedProcess ? `${selectedProcess.name} (${selectedProcess.pid})` : undefined) ??
    selectedIncident?.id ??
    selectedMitre?.id ??
    'Context Inspector';

  const subtitle =
    selectedAlert?.title ??
    selectedEvent?.summary ??
    selectedProcess?.executablePath ??
    selectedIncident?.title ??
    selectedMitre?.name ??
    'Select any item to inspect telemetry evidence.';

  return (
    <aside
      aria-label="Contextual Intelligence Panel"
      className="ks-glass-elevated flex h-full w-full flex-col rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-300/10 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-cyan-300">{title}</span>
            <DemoBadge label="DEMO" />
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contextual intelligence panel"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300/15 bg-slate-900/50 text-slate-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl border border-slate-300/10 bg-slate-950/45 p-1">
        {(['Overview', 'Evidence', 'Related Events', 'AI Insights'] as InspectorTab[]).map((tab) => {
          const active = activeTab === tab;
          const label =
            tab === 'Related Events' ? 'Events' : tab === 'AI Insights' ? 'AI Brief' : tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-300/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
        {activeTab === 'Overview' && (
          <>
            {selectedAlert && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SeverityBadge severity={selectedAlert.severity} />
                  <StatusLabel status={selectedAlert.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-300/10 bg-slate-900/45 p-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Risk Score</div>
                    <div className="font-mono text-base font-semibold text-slate-100 tabular-nums">
                      {selectedAlert.riskScore}/100
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">MITRE Mapping</div>
                    <div className="truncate font-mono text-sm font-semibold text-cyan-300">
                      {selectedAlert.mitreId}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Process</div>
                    <div className="truncate font-mono text-slate-200" title={selectedAlert.processName}>
                      {selectedAlert.processName}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Endpoint</div>
                    <div className="truncate font-mono text-slate-200">
                      {selectedAlert.endpointId}
                    </div>
                  </div>
                </div>
                <p className="leading-relaxed text-slate-300">{selectedAlert.description}</p>
              </div>
            )}

            {selectedEvent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={selectedEvent.severity} />
                  <StatusLabel status={selectedEvent.status} />
                </div>
                <div className="space-y-2 rounded-xl border border-slate-300/10 bg-slate-900/45 p-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source</span>
                    <span className="font-mono text-slate-200">{selectedEvent.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Process</span>
                    <span className="font-mono text-slate-200">
                      {selectedEvent.processName} ({selectedEvent.pid})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Endpoint</span>
                    <span className="font-mono text-slate-200">{selectedEvent.endpointId}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold text-slate-400">Command Line</div>
                  <pre className="overflow-x-auto rounded-xl border border-slate-300/10 bg-slate-950/70 p-2.5 font-mono text-[11px] text-cyan-200 whitespace-pre-wrap break-all">
                    {selectedEvent.commandLine}
                  </pre>
                </div>
              </div>
            )}

            {selectedProcess && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={selectedProcess.riskLevel} />
                  <span className="font-mono text-[11px] text-slate-400">
                    {selectedProcess.signatureStatus}
                  </span>
                </div>
                <div className="space-y-2 rounded-xl border border-slate-300/10 bg-slate-900/45 p-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">PID / PPID</span>
                    <span className="font-mono text-slate-100 tabular-nums">
                      {selectedProcess.pid} / {selectedProcess.ppid ?? 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parent</span>
                    <span className="font-mono text-slate-200">{selectedProcess.parentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPU / Memory</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {selectedProcess.cpuPercent}% · {selectedProcess.memoryMb} MB
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold text-slate-400">Executable Path</div>
                  <div className="rounded-xl border border-slate-300/10 bg-slate-950/60 p-2.5 font-mono text-[11px] text-slate-200 break-all">
                    {selectedProcess.executablePath}
                  </div>
                </div>
              </div>
            )}

            {selectedIncident && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={selectedIncident.severity} />
                  <StatusLabel status={selectedIncident.status} />
                </div>
                <p className="leading-relaxed text-slate-300">{selectedIncident.resolutionSummary}</p>
                <div className="rounded-xl border border-slate-300/10 bg-slate-900/45 p-3">
                  <div className="text-[11px] text-slate-400">Assigned Analyst</div>
                  <div className="mt-0.5 font-semibold text-slate-100">
                    {selectedIncident.assignedAnalyst}
                  </div>
                </div>
              </div>
            )}

            {selectedMitre && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-cyan-300">{selectedMitre.tactic}</div>
                <p className="leading-relaxed text-slate-300">{selectedMitre.description}</p>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200">
                  {selectedMitre.confidenceNote}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Evidence' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <FileText className="h-3.5 w-3.5 text-cyan-300" />
              <span>Observed Indicators (DEMO)</span>
            </div>
            {(
              selectedAlert?.evidence ??
              selectedProcess?.riskIndicators ??
              selectedIncident?.evidenceCollection ??
              selectedMitre?.telemetrySignals ??
              selectedEvent?.evidenceTags ??
              []
            ).map((ev, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-300/10 bg-slate-900/45 p-2.5 leading-relaxed text-slate-300"
              >
                {ev}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Related Events' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Layers className="h-3.5 w-3.5 text-sky-300" />
              <span>Correlated Telemetry ({relatedEvents.length})</span>
            </div>
            {relatedEvents.length === 0 ? (
              <p className="text-slate-400">No directly correlated events for this selection.</p>
            ) : (
              relatedEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectItem({ kind: 'event', id: ev.id })}
                  className="flex w-full flex-col gap-1 rounded-xl border border-slate-300/10 bg-slate-900/45 p-2.5 text-left hover:border-cyan-300/35"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-cyan-300">{ev.id}</span>
                    <SeverityBadge severity={ev.severity} />
                  </div>
                  <div className="text-slate-200">{ev.summary}</div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'AI Insights' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-200">
                <Bot className="h-3.5 w-3.5" /> AI Synthesis
              </span>
              <DemoBadge label="DEMO OUTPUT" />
            </div>
            <p className="leading-relaxed text-slate-200">{aiInsight.summary}</p>
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-300">Recommended Next Steps</div>
              {aiInsight.recommendedSteps.map((step, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-300/10 bg-slate-900/45 p-2 text-slate-300"
                >
                  {i + 1}. {step}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ai-analyst')}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-300/30 bg-cyan-500/15 py-2 font-medium text-cyan-100 hover:bg-cyan-500/25"
            >
              <span>Open Full AI SOC Analyst</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Quick Link */}
      <div className="mt-3 border-t border-slate-300/10 pt-3">
        <button
          type="button"
          onClick={() => onNavigate('threat-alerts')}
          className="flex w-full items-center justify-between rounded-xl border border-slate-300/15 bg-slate-900/50 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-300/35"
        >
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-cyan-300" />
            Inspect in Threat Alerts
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </aside>
  );
};
