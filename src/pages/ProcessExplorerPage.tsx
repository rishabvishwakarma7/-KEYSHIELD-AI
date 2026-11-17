import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Box, GitBranch, Table2 } from 'lucide-react';
import type { InspectorSelection, ProcessNode } from '../types/security';
import { buildProcessTree, type ProcessTreeNode } from '../services/securityAdapter';
import { DemoBadge, GlassCard, SeverityBadge } from '../components/ui/GlassPrimitives';

const ProcessNetwork3D = lazy(() =>
  import('../3d-scenes/ProcessNetwork3D').then((m) => ({ default: m.ProcessNetwork3D })),
);

interface ProcessExplorerPageProps {
  processes: ProcessNode[];
  reducedMotion: boolean;
  onInspect: (sel: InspectorSelection) => void;
}

type ViewMode = '3d' | 'tree' | 'table';

const TreeRow: React.FC<{
  node: ProcessTreeNode;
  selectedPid: number;
  onSelect: (pid: number) => void;
}> = ({ node, selectedPid, onSelect }) => {
  const isSelected = node.process.pid === selectedPid;
  return (
    <div className="space-y-1.5">
      <div style={{ paddingLeft: `${node.depth * 20}px` }}>
        <button
          type="button"
          onClick={() => onSelect(node.process.pid)}
          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${
            isSelected
              ? 'border-cyan-300/45 bg-cyan-500/15 text-slate-50'
              : 'border-slate-300/10 bg-slate-900/45 text-slate-200 hover:border-cyan-300/30'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold">{node.process.name}</span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                PID {node.process.pid} · PPID {node.process.ppid ?? 'None'}
              </span>
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
              {node.process.executablePath}
            </div>
          </div>
          <div className="shrink-0">
            <SeverityBadge severity={node.process.riskLevel} />
          </div>
        </button>
      </div>
      {node.children.map((child) => (
        <TreeRow key={child.process.pid} node={child} selectedPid={selectedPid} onSelect={onSelect} />
      ))}
    </div>
  );
};

export const ProcessExplorerPage: React.FC<ProcessExplorerPageProps> = ({
  processes,
  reducedMotion,
  onInspect,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [selectedPid, setSelectedPid] = useState<number>(6812);

  const treeRoots = useMemo(() => buildProcessTree(processes), [processes]);
  const selectedProcess = useMemo(
    () => processes.find((p) => p.pid === selectedPid) ?? processes[0],
    [processes, selectedPid],
  );

  const handleSelect = (pid: number) => {
    setSelectedPid(pid);
    onInspect({ kind: 'process', pid });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Process Explorer</h1>
            <DemoBadge label="READ-ONLY TELEMETRY" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Interactive 3D parent-child process lineage, 2D process tree fallback, and signed metadata inspection.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-300/15 bg-slate-900/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              viewMode === '3d' ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="h-3.5 w-3.5" /> 3D Relationship View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              viewMode === 'tree' ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" /> 2D Process Tree
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" /> Process Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {viewMode === '3d' && (
            <Suspense
              fallback={
                <div className="flex h-[460px] items-center justify-center rounded-2xl border border-sky-300/15 bg-[#091224]/70 text-xs text-slate-400">
                  Loading 3D Process Network...
                </div>
              }
            >
              <ProcessNetwork3D
                processes={processes}
                selectedPid={selectedPid}
                onSelectProcess={handleSelect}
                reducedMotion={reducedMotion}
                className="h-[470px] w-full"
              />
            </Suspense>
          )}

          {viewMode === 'tree' && (
            <GlassCard className="space-y-2 overflow-x-auto">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-slate-100">
                  2D Process Hierarchy Tree
                </h2>
                <span className="text-xs text-slate-400">{processes.length} processes</span>
              </div>
              {treeRoots.map((root) => (
                <TreeRow
                  key={root.process.pid}
                  node={root}
                  selectedPid={selectedPid}
                  onSelect={handleSelect}
                />
              ))}
            </GlassCard>
          )}

          {viewMode === 'table' && (
            <GlassCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300/12 bg-slate-950/45 text-[11px] font-semibold text-slate-400">
                      <th className="px-4 py-3">Process</th>
                      <th className="px-4 py-3">PID / PPID</th>
                      <th className="px-4 py-3">Publisher</th>
                      <th className="px-4 py-3">CPU / RAM</th>
                      <th className="px-4 py-3">Risk State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300/10">
                    {processes.map((p) => (
                      <tr
                        key={p.pid}
                        onClick={() => handleSelect(p.pid)}
                        className={`cursor-pointer transition-colors hover:bg-cyan-500/8 ${
                          p.pid === selectedPid ? 'bg-cyan-500/12' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-slate-100">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-300 tabular-nums">
                          {p.pid} / {p.ppid ?? 'None'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{p.signatureStatus}</td>
                        <td className="px-4 py-3 font-mono text-slate-300 tabular-nums">
                          {p.cpuPercent}% · {p.memoryMb} MB
                        </td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={p.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Selected Process Metadata Card */}
        {selectedProcess && (
          <GlassCard className="space-y-4 xl:col-span-4">
            <div className="space-y-2 border-b border-slate-300/10 pb-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-cyan-300 tabular-nums">
                  PID {selectedProcess.pid} · PPID {selectedProcess.ppid ?? 'None'}
                </p>
                <div className="shrink-0">
                  <SeverityBadge severity={selectedProcess.riskLevel} />
                </div>
              </div>
              <h2 className="font-mono text-sm font-bold text-slate-50 break-words">
                {selectedProcess.name}
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-slate-400">Parent Process</span>
                <span className="truncate font-mono text-slate-100">{selectedProcess.parentName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-slate-400">Creation Time</span>
                <span className="truncate font-mono text-slate-200 tabular-nums">
                  {selectedProcess.creationTime.replace('T', ' ').replace('Z', '')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-slate-400">Publisher</span>
                <span className="truncate text-slate-200">{selectedProcess.publisher}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-slate-400">Signature</span>
                <span className="truncate font-mono text-slate-200">{selectedProcess.signatureStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-slate-400">Resource Usage</span>
                <span className="truncate font-mono text-slate-200 tabular-nums">
                  {selectedProcess.cpuPercent}% CPU · {selectedProcess.memoryMb} MB RAM
                </span>
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold text-slate-400">Executable Path</div>
              <div className="rounded-xl border border-slate-300/10 bg-slate-950/65 p-2.5 font-mono text-[11px] text-cyan-200 break-all">
                {selectedProcess.executablePath}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-slate-400">Risk Indicators</div>
              {selectedProcess.riskIndicators.length === 0 ? (
                <p className="text-xs text-slate-400">No suspicious indicators recorded for this process.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {selectedProcess.riskIndicators.map((ind, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border border-slate-300/10 bg-slate-900/45 px-3 py-2"
                    >
                      {ind}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
