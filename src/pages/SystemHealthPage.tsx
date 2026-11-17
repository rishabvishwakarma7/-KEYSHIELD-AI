import React, { useState } from 'react';
import { CheckCircle2, RefreshCw, Unplug } from 'lucide-react';
import type { SystemHealthComponent } from '../types/security';
import { DemoBadge, GlassCard } from '../components/ui/GlassPrimitives';

interface SystemHealthPageProps {
  components: SystemHealthComponent[];
}

export const SystemHealthPage: React.FC<SystemHealthPageProps> = ({ components }) => {
  const [liveProbeResult, setLiveProbeResult] = useState<{
    checkedAt: string;
    serverReachable: boolean;
    aiConfigured: boolean;
    note: string;
  } | null>(null);
  const [probing, setProbing] = useState(false);

  const runHealthProbe = async () => {
    setProbing(true);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveProbeResult({
        checkedAt: new Date().toISOString().slice(11, 19) + ' UTC',
        serverReachable: true,
        aiConfigured: Boolean(data.aiConfigured),
        note: data.note ?? 'Server health endpoint responded; host telemetry remains in DEMO mode.',
      });
    } catch {
      setLiveProbeResult({
        checkedAt: new Date().toISOString().slice(11, 19) + ' UTC',
        serverReachable: false,
        aiConfigured: false,
        note: 'Static Vite frontend or backend telemetry endpoint unreachable. Running in pure frontend DEMO mode.',
      });
    } finally {
      setProbing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">System Health</h1>
            <DemoBadge label="HONEST DEMO TELEMETRY" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Component readiness across collection, ingestion pipeline, detection engine, and AI provider. Live host connectors are explicitly shown as unconnected in DEMO mode.
          </p>
        </div>

        <button
          type="button"
          onClick={runHealthProbe}
          disabled={probing}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${probing ? 'animate-spin' : ''}`} />
          {probing ? 'Checking...' : 'Check Server Probe'}
        </button>
      </div>

      {liveProbeResult && (
        <GlassCard className="border-cyan-300/25 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-cyan-200">
              Runtime Probe ({liveProbeResult.checkedAt})
            </span>
            <span className="font-mono text-slate-300">
              API Server: {liveProbeResult.serverReachable ? 'Reachable' : 'Frontend-Only'} · Gemini Key:{' '}
              {liveProbeResult.aiConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          <p className="mt-1 text-slate-300">{liveProbeResult.note}</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {components.map((comp) => {
          const isSimulatedNominal = comp.demoState === 'Simulated Nominal';
          return (
            <GlassCard key={comp.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium text-slate-400">{comp.layer} Layer</div>
                  <h2 className="font-display mt-0.5 text-base font-semibold text-slate-100">
                    {comp.name}
                  </h2>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                    isSimulatedNominal
                      ? 'border-cyan-400/30 bg-cyan-500/12 text-cyan-200'
                      : 'border-slate-400/25 bg-slate-800/70 text-slate-300'
                  }`}
                >
                  {isSimulatedNominal ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Unplug className="h-3.5 w-3.5" />
                  )}
                  {comp.demoState}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">{comp.detail}</p>

              <div className="flex items-center justify-between border-t border-slate-300/10 pt-2.5 text-[11px] text-slate-400">
                <span>Live Connector: {comp.liveState}</span>
                <span className="font-mono tabular-nums">
                  {comp.latencyMs !== null ? `Sim Latency ${comp.latencyMs}ms` : 'No Live Socket'}
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
