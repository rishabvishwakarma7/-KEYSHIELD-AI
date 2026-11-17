import React, { useMemo, useState } from 'react';
import { History, Play, Search } from 'lucide-react';
import type { InspectorSelection, SecurityEvent } from '../types/security';
import { filterAndSortEvents } from '../services/securityAdapter';
import { DemoBadge, GlassCard, SeverityBadge, StatusLabel } from '../components/ui/GlassPrimitives';

interface ThreatHuntingPageProps {
  events: SecurityEvent[];
  onInspect: (sel: InspectorSelection) => void;
}

const HUNT_TEMPLATES = [
  {
    label: 'Suspicious process execution',
    query: 'powershell',
    category: 'Suspicious Process Activity',
  },
  {
    label: 'Unexpected persistence changes',
    query: 'CurrentVersion\\Run',
    category: 'Unexpected Registry Modification',
  },
  {
    label: 'Abnormal outbound connections',
    query: '8443',
    category: 'Abnormal Network Connections',
  },
  {
    label: 'Unusual file activity',
    query: '.cache_idx',
    category: 'Unusual File Activity',
  },
];

export const ThreatHuntingPage: React.FC<ThreatHuntingPageProps> = ({ events, onInspect }) => {
  const [queryInput, setQueryInput] = useState('SetWindowsHookEx');
  const [submittedQuery, setSubmittedQuery] = useState('SetWindowsHookEx');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [history, setHistory] = useState<string[]>([
    'SetWindowsHookEx',
    'AudioSrvHelper',
    'CurrentVersion\\Run',
  ]);

  const results = useMemo(() => {
    return filterAndSortEvents(events, {
      search: submittedQuery,
      category: categoryFilter,
      severity: 'All',
    });
  }, [events, submittedQuery, categoryFilter]);

  const executeHunt = (q: string, cat = categoryFilter) => {
    const clean = q.trim();
    setSubmittedQuery(clean);
    setCategoryFilter(cat);
    if (clean && !history.includes(clean)) {
      setHistory((prev) => [clean, ...prev].slice(0, 6));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Threat Hunting Workspace</h1>
            <DemoBadge label="DEMO HUNT CORPUS" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Proactively query endpoint telemetry across processes, hook metadata, registry keys, and outbound sockets.
          </p>
        </div>
      </div>

      {/* Central AI Studio-Inspired Glass Prompt Query Bar */}
      <GlassCard className="space-y-4 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeHunt(queryInput);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-cyan-300" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              aria-label="Threat hunt query"
              placeholder="Hunt query (e.g. SetWindowsHookEx, AudioSrvHelper, Run, 198.51.100.74)..."
              className="h-11 w-full rounded-xl border border-cyan-300/25 bg-slate-950/65 pr-4 pl-10 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 px-5 text-xs font-semibold text-cyan-50 hover:from-cyan-500/35 hover:to-sky-500/30 whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5" />
            Run Hunt
          </button>
        </form>

        {/* Investigation Templates */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Templates:</span>
          {HUNT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => {
                setQueryInput(tpl.query);
                executeHunt(tpl.query, tpl.category);
              }}
              className="rounded-xl border border-slate-300/15 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-cyan-300/35 hover:text-white"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Left Filter & History Rail */}
        <GlassCard className="space-y-5 xl:col-span-3">
          <div>
            <h2 className="text-xs font-semibold text-slate-200">Category Scope</h2>
            <div className="mt-2 space-y-1">
              {[
                'All',
                'Suspicious Process Activity',
                'Unexpected Registry Modification',
                'Suspicious Driver Activity',
                'Unusual File Activity',
                'Abnormal Network Connections',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex w-full rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    categoryFilter === cat
                      ? 'bg-cyan-500/18 text-cyan-100 border border-cyan-300/25'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-300/10 pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <History className="h-3.5 w-3.5 text-cyan-300" />
              <span>Recent Hunts</span>
            </div>
            <div className="space-y-1">
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setQueryInput(h);
                    executeHunt(h, 'All');
                  }}
                  className="flex w-full truncate rounded-lg border border-slate-300/10 bg-slate-900/45 px-2.5 py-1.5 text-left font-mono text-[11px] text-slate-300 hover:border-cyan-300/35"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Results Table */}
        <GlassCard className="overflow-hidden p-0 xl:col-span-9">
          <div className="flex items-center justify-between border-b border-slate-300/10 px-4 py-3 text-xs">
            <span className="font-semibold text-slate-200">
              Hunt Matches ({results.length})
            </span>
            <span className="font-mono text-slate-400">Query: {submittedQuery || '*'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300/10 bg-slate-950/45 text-[11px] font-semibold text-slate-400">
                  <th className="px-4 py-2.5">Event ID</th>
                  <th className="px-4 py-2.5">Process</th>
                  <th className="px-4 py-2.5">Summary</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/10">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No synthetic telemetry events matched "{submittedQuery}". Try clearing category scope or selecting a template.
                    </td>
                  </tr>
                ) : (
                  results.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => onInspect({ kind: 'event', id: ev.id })}
                      className="cursor-pointer transition-colors hover:bg-cyan-500/8"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                        {ev.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-100 whitespace-nowrap">
                        {ev.processName} ({ev.pid})
                      </td>
                      <td className="px-4 py-3 text-slate-300">{ev.summary}</td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={ev.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusLabel status={ev.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
