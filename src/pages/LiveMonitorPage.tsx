import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { InspectorSelection, SecurityEvent } from '../types/security';
import { filterAndSortEvents, paginateItems } from '../services/securityAdapter';
import {
  DemoBadge,
  GlassCard,
  GlassDrawer,
  SeverityBadge,
  StatusLabel,
} from '../components/ui/GlassPrimitives';

interface LiveMonitorPageProps {
  events: SecurityEvent[];
  selectedEndpointId: string;
  onInspect: (sel: InspectorSelection) => void;
}

export const LiveMonitorPage: React.FC<LiveMonitorPageProps> = ({
  events,
  selectedEndpointId,
  onInspect,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [timeWindow, setTimeWindow] = useState<'all' | '15m' | '1h' | '24h'>('all');
  const [endpointScope, setEndpointScope] = useState<'selected' | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'timestamp' | 'severity' | 'processName' | 'id'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [drawerEvent, setDrawerEvent] = useState<SecurityEvent | null>(null);

  const categories = useMemo(
    () => [
      'All',
      'Suspicious Process Activity',
      'Unexpected Registry Modification',
      'Suspicious Driver Activity',
      'Unusual File Activity',
      'Abnormal Network Connections',
      'Process Telemetry',
      'Authentication Audit',
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      filterAndSortEvents(
        events,
        {
          search,
          category,
          severity,
          timeWindow,
          endpointId: endpointScope === 'ALL' ? 'ALL' : selectedEndpointId,
        },
        sortField,
        sortDir,
      ),
    [events, search, category, severity, timeWindow, endpointScope, selectedEndpointId, sortField, sortDir],
  );

  const { rows, totalPages, currentPage } = useMemo(
    () => paginateItems(filtered, page, 7),
    [filtered, page],
  );

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Live Telemetry Monitor</h1>
            <DemoBadge label="DEMO STREAM · NO LIVE AGENT" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Simulated Sysmon &amp; ETW-Kernel event stream. Displaying synthetic DEMO telemetry rather than live host capture.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-300/15 bg-slate-900/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setEndpointScope('ALL');
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              endpointScope === 'ALL' ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Endpoints
          </button>
          <button
            type="button"
            onClick={() => {
              setEndpointScope('selected');
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors font-mono ${
              endpointScope === 'selected' ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
            }`}
          >
            {selectedEndpointId}
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Filter telemetry events"
              placeholder="Search event ID, process, command line, or MITRE ID..."
              className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 pr-3 pl-9 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by severity"
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none"
            >
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
                <option key={s} value={s}>
                  Severity: {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by timestamp window"
              value={timeWindow}
              onChange={(e) => {
                setTimeWindow(e.target.value as typeof timeWindow);
                setPage(1);
              }}
              className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-200 focus:border-cyan-400/50 focus:outline-none"
            >
              <option value="all">Window: All</option>
              <option value="15m">Last 15m</option>
              <option value="1h">Last 1h</option>
              <option value="24h">Last 24h</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Dark Glass Telemetry Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300/12 bg-slate-950/45 text-[11px] font-semibold text-slate-400">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('timestamp')}
                    className="inline-flex items-center gap-1 hover:text-white"
                  >
                    Timestamp <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('id')}
                    className="inline-flex items-center gap-1 hover:text-white"
                  >
                    Event ID <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('processName')}
                    className="inline-flex items-center gap-1 hover:text-white"
                  >
                    Process <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('severity')}
                    className="inline-flex items-center gap-1 hover:text-white"
                  >
                    Severity <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/10">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No synthetic DEMO events match your current filters.
                  </td>
                </tr>
              ) : (
                rows.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => {
                      setDrawerEvent(ev);
                      onInspect({ kind: 'event', id: ev.id });
                    }}
                    className="cursor-pointer transition-colors hover:bg-cyan-500/8"
                  >
                    <td className="px-4 py-3 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                      {ev.timestamp.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {ev.id}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{ev.category}</td>
                    <td className="px-4 py-3 font-mono text-slate-100 whitespace-nowrap">
                      {ev.processName} <span className="text-slate-400">({ev.pid})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{ev.source}</td>
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

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300/10 bg-slate-950/35 px-4 py-3 text-xs text-slate-400">
          <span className="tabular-nums">
            Showing {rows.length} of {filtered.length} DEMO events · Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300/15 bg-slate-900/50 px-2.5 text-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300/15 bg-slate-900/50 px-2.5 text-slate-200 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Event Detail Drawer */}
      <GlassDrawer
        open={Boolean(drawerEvent)}
        onClose={() => setDrawerEvent(null)}
        title={drawerEvent ? `${drawerEvent.id} · ${drawerEvent.processName}` : 'Event Details'}
        subtitle={drawerEvent ? `${drawerEvent.endpointId} · ${drawerEvent.source} · DEMO Telemetry` : ''}
      >
        {drawerEvent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <SeverityBadge severity={drawerEvent.severity} />
              <StatusLabel status={drawerEvent.status} />
            </div>
            <p className="text-sm leading-relaxed text-slate-100">{drawerEvent.summary}</p>
            <div className="space-y-2 rounded-xl border border-slate-300/10 bg-slate-900/50 p-3.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono text-slate-200 tabular-nums">{drawerEvent.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Process / PID</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {drawerEvent.processName} ({drawerEvent.pid})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Object</span>
                <span className="font-mono text-cyan-200 break-all text-right max-w-[260px]">
                  {drawerEvent.targetObject}
                </span>
              </div>
              {drawerEvent.mitreId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">MITRE Technique</span>
                  <span className="font-mono text-violet-300">{drawerEvent.mitreId}</span>
                </div>
              )}
            </div>
            <div>
              <div className="mb-1.5 font-semibold text-slate-300">Command Line</div>
              <pre className="overflow-x-auto rounded-xl border border-slate-300/10 bg-slate-950/75 p-3 font-mono text-[11px] text-cyan-200 whitespace-pre-wrap break-all">
                {drawerEvent.commandLine}
              </pre>
            </div>
            <div>
              <div className="mb-1.5 font-semibold text-slate-300">Evidence Tags</div>
              <div className="flex flex-wrap gap-2 text-slate-300">
                {drawerEvent.evidenceTags.join(' · ')}
              </div>
            </div>
          </div>
        )}
      </GlassDrawer>
    </div>
  );
};
