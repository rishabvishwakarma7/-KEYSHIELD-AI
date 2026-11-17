import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import type { InspectorSelection, SecurityEvent } from '../types/security';
import { DemoBadge, GlassCard, SeverityBadge, StatusLabel } from '../components/ui/GlassPrimitives';

interface EventTimelinePageProps {
  events: SecurityEvent[];
  onInspect: (sel: InspectorSelection) => void;
}

export const EventTimelinePage: React.FC<EventTimelinePageProps> = ({ events, onInspect }) => {
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['EVT-90418', 'EVT-90417']));

  const filtered = useMemo(() => {
    const base = severityFilter === 'All' ? events : events.filter((e) => e.severity === severityFilter);
    return [...base].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [events, severityFilter]);

  // Group events into hourly/phase clusters
  const clusters = useMemo(() => {
    const map = new Map<string, SecurityEvent[]>();
    for (const ev of filtered) {
      const hourKey = `${ev.timestamp.slice(0, 13)}:00 UTC`;
      const list = map.get(hourKey) ?? [];
      list.push(ev);
      map.set(hourKey, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Event Timeline</h1>
            <DemoBadge label="CHRONOLOGICAL DEMO FLOW" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Reconstruct endpoint execution sequence, persistence writes, and network beacons in chronological clusters.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-300/15 bg-slate-900/50 p-1 text-xs">
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors whitespace-nowrap ${
                severityFilter === sev ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {clusters.map(([clusterTime, items]) => (
          <div key={clusterTime} className="space-y-3">
            <div className="flex items-center gap-2.5 px-1 text-xs font-semibold text-cyan-200">
              <Clock className="h-3.5 w-3.5 text-cyan-300" />
              <span className="font-mono tabular-nums">{clusterTime}</span>
              <span className="text-slate-400">· {items.length} events</span>
            </div>

            <div className="relative space-y-3 pl-5 before:absolute before:top-2 before:bottom-2 before:left-1.5 before:w-px before:bg-gradient-to-b before:from-cyan-400/50 before:via-sky-400/30 before:to-transparent">
              {items.map((ev) => {
                const expanded = expandedIds.has(ev.id);
                const markerColor =
                  ev.severity === 'Critical'
                    ? 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : ev.severity === 'High'
                      ? 'bg-amber-400'
                      : ev.severity === 'Medium'
                        ? 'bg-sky-400'
                        : 'bg-emerald-400';

                return (
                  <div key={ev.id} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute top-5 -left-[18px] h-2.5 w-2.5 rounded-full ${markerColor}`}
                    />
                    <GlassCard className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            toggleExpand(ev.id);
                            onInspect({ kind: 'event', id: ev.id });
                          }}
                          className="flex flex-1 items-start gap-2.5 text-left"
                        >
                          {expanded ? (
                            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                          ) : (
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono text-cyan-300 tabular-nums">
                                {ev.timestamp.slice(11, 19)} UTC
                              </span>
                              <span>·</span>
                              <span className="font-mono font-semibold text-slate-200">{ev.id}</span>
                              <span>·</span>
                              <span className="font-mono text-slate-300">
                                {ev.processName} ({ev.pid})
                              </span>
                              <span>·</span>
                              <span>{ev.endpointId}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-100">{ev.summary}</p>
                          </div>
                        </button>

                        <div className="flex items-center gap-2.5">
                          <SeverityBadge severity={ev.severity} />
                          <StatusLabel status={ev.status} />
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-2.5 border-t border-slate-300/10 pt-3 text-xs">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <span className="text-slate-400">Source: </span>
                              <span className="font-mono text-slate-200">{ev.source}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Target: </span>
                              <span className="font-mono text-cyan-200 break-all">{ev.targetObject}</span>
                            </div>
                          </div>
                          <pre className="overflow-x-auto rounded-xl border border-slate-300/10 bg-slate-950/65 p-2.5 font-mono text-[11px] text-slate-200 whitespace-pre-wrap break-all">
                            {ev.commandLine}
                          </pre>
                          <div className="text-[11px] text-slate-400">
                            Evidence Tags: {ev.evidenceTags.join(' · ')}
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
