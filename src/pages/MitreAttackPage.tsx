import React, { useMemo, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import type { InspectorSelection, MitreTechnique, ThreatAlert } from '../types/security';
import { DemoBadge, GlassCard } from '../components/ui/GlassPrimitives';

interface MitreAttackPageProps {
  techniques: MitreTechnique[];
  alerts: ThreatAlert[];
  onInspect: (sel: InspectorSelection) => void;
}

const TACTIC_ORDER: MitreTechnique['tactic'][] = [
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Collection',
  'Command and Control',
];

export const MitreAttackPage: React.FC<MitreAttackPageProps> = ({
  techniques,
  alerts,
  onInspect,
}) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('T1056.001');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return techniques;
    return techniques.filter((t) =>
      `${t.id} ${t.name} ${t.tactic} ${t.description}`.toLowerCase().includes(q),
    );
  }, [techniques, search]);

  const activeTech = techniques.find((t) => t.id === selectedId) ?? techniques[0];
  const mappedAlerts = useMemo(
    () => alerts.filter((a) => activeTech?.relatedAlertIds.includes(a.id)),
    [alerts, activeTech],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">MITRE ATT&amp;CK Matrix</h1>
            <DemoBadge label="DEMO COVERAGE MAP" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Behavioral coverage across keylogging indicators (T1056.001), persistence, execution, and staging techniques.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search MITRE techniques"
            placeholder="Search ID, tactic, or technique..."
            className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 pr-3 pl-9 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Matrix Tactic Columns */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {TACTIC_ORDER.map((tactic) => {
          const items = filtered.filter((t) => t.tactic === tactic);
          return (
            <GlassCard key={tactic} className="flex flex-col gap-2.5 p-3.5">
              <div className="border-b border-slate-300/12 pb-2 text-xs font-semibold text-cyan-200">
                {tactic}
              </div>
              {items.length === 0 ? (
                <div className="py-3 text-[11px] text-slate-500">No matching techniques</div>
              ) : (
                items.map((tech) => {
                  const selected = tech.id === activeTech?.id;
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(tech.id);
                        onInspect({ kind: 'mitre', id: tech.id });
                      }}
                      className={`rounded-xl border p-2.5 text-left transition-colors ${
                        selected
                          ? 'border-cyan-300/45 bg-cyan-500/16 text-slate-50'
                          : 'border-slate-300/10 bg-slate-900/45 text-slate-300 hover:border-cyan-300/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-semibold text-violet-300">
                          {tech.id}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {tech.relatedAlertIds.length} alerts
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-medium leading-snug">{tech.name}</div>
                    </button>
                  );
                })
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Technique Detail Workspace */}
      {activeTech && (
        <GlassCard className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300/10 pb-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-violet-300">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-mono font-semibold">{activeTech.id}</span>
                <span>·</span>
                <span>{activeTech.tactic}</span>
              </div>
              <h2 className="font-display mt-1 text-lg font-semibold text-slate-50">
                {activeTech.name}
              </h2>
            </div>
            <span className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
              {activeTech.coverageStatus}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-200">{activeTech.description}</p>

          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-100">
            <strong>Telemetry Confidence Note:</strong> {activeTech.confidenceNote}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-200">Telemetry Signals</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeTech.telemetrySignals.map((sig, i) => (
                  <li key={i} className="rounded-xl border border-slate-300/10 bg-slate-900/45 p-2.5">
                    {sig}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-200">
                Detection Recommendations
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeTech.detectionRecommendations.map((rec, i) => (
                  <li key={i} className="rounded-xl border border-slate-300/10 bg-slate-900/45 p-2.5">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {mappedAlerts.length > 0 && (
            <div className="border-t border-slate-300/10 pt-3">
              <div className="mb-2 text-xs font-semibold text-slate-200">
                Related Alerts ({mappedAlerts.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {mappedAlerts.map((a) => (
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
          )}
        </GlassCard>
      )}
    </div>
  );
};
