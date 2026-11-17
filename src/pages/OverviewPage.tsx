import React, { Suspense, lazy, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  EndpointHost,
  InspectorSelection,
  MitreTechnique,
  ProcessNode,
  RouteId,
  SecurityEvent,
  ThreatAlert,
} from '../types/security';
import { EVENTS_OVER_TIME_DATA, THREAT_CATEGORIES_DATA } from '../mock-data/telemetryData';
import {
  DemoBadge,
  GlassCard,
  GlassChart,
  GlassMetricCard,
  SeverityBadge,
  StatusLabel,
} from '../components/ui/GlassPrimitives';
import { ThreeDSecurityCore } from '../3d-scenes/ThreeDSecurityCore';

const ThreatNetwork3D = lazy(() =>
  import('../3d-scenes/ThreatNetwork3D').then((m) => ({ default: m.ThreatNetwork3D })),
);

interface OverviewPageProps {
  endpoint: EndpointHost;
  events: SecurityEvent[];
  alerts: ThreatAlert[];
  processes: ProcessNode[];
  mitre: MitreTechnique[];
  reducedMotion: boolean;
  onNavigate: (route: RouteId) => void;
  onInspect: (sel: InspectorSelection) => void;
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(13, 21, 36, 0.94)',
  border: '1px solid rgba(125, 211, 252, 0.25)',
  borderRadius: '12px',
  color: '#F1F5F9',
  fontSize: '12px',
  boxShadow: '0 12px 32px rgba(2, 6, 18, 0.75)',
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  endpoint,
  events,
  alerts,
  processes,
  mitre,
  reducedMotion,
  onNavigate,
  onInspect,
}) => {
  const activeAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'New' || a.status === 'Investigating').length,
    [alerts],
  );
  const highRiskProcCount = useMemo(
    () => processes.filter((p) => p.riskLevel === 'High Risk' || p.riskLevel === 'Suspicious').length,
    [processes],
  );

  const severityDistData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const a of alerts) counts[a.severity] += 1;
    return [
      { name: 'Critical', value: counts.Critical, color: '#EF4444' },
      { name: 'High', value: counts.High, color: '#F59E0B' },
      { name: 'Medium', value: counts.Medium, color: '#60A5FA' },
      { name: 'Low', value: Math.max(counts.Low, 1), color: '#22C55E' },
    ];
  }, [alerts]);

  const mitreChartData = useMemo(
    () =>
      mitre.slice(0, 5).map((m) => ({
        id: m.id,
        name: m.id,
        signals: m.telemetrySignals.length + m.relatedAlertIds.length * 2,
        alerts: m.relatedAlertIds.length,
      })),
    [mitre],
  );

  return (
    <div className="space-y-6">
      {/* A. Hero Area with Integrated 3D Security Core */}
      <GlassCard className="relative overflow-hidden p-6">
        <div className="grid grid-cols-1 items-center gap-6 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <DemoBadge label="DEMO TELEMETRY MODE" />
              <span className="text-xs text-slate-400">
                {endpoint.id} · {endpoint.osVersion} · {endpoint.monitoringMode}
              </span>
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl [text-wrap:balance]">
                Security Command Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Your endpoint intelligence and threat monitoring workspace.
              </p>
            </div>

            {/* Clean unboxed telemetry metadata strip */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-300/12 py-4 sm:grid-cols-4">
              <div>
                <div className="text-[11px] font-medium text-slate-400">Endpoint</div>
                <div className="mt-1 font-mono text-sm font-semibold text-slate-100">
                  {endpoint.id}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Monitoring Mode</div>
                <div className="mt-1 font-mono text-sm font-semibold text-cyan-300">
                  {endpoint.monitoringMode}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Threat Posture</div>
                <div
                  className={`mt-1 text-sm font-semibold ${
                    endpoint.posture === 'Elevated'
                      ? 'text-amber-300'
                      : endpoint.posture === 'Guarded'
                        ? 'text-sky-300'
                        : 'text-emerald-300'
                  }`}
                >
                  {endpoint.posture}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Last Event (UTC)</div>
                <div className="mt-1 font-mono text-sm font-medium text-slate-200 tabular-nums">
                  {endpoint.lastCollectedEvent.slice(11, 19)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('threat-alerts')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-50 shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)] transition-all hover:border-cyan-200/60 hover:from-cyan-500/35 hover:to-sky-500/30 whitespace-nowrap shrink-0"
              >
                <span>Investigate Alerts</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('process-explorer')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300/15 bg-slate-900/55 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-300/35 hover:text-white whitespace-nowrap shrink-0"
              >
                <span>3D Process Graph</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ai-analyst')}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-500/12 px-3.5 py-2 text-xs font-medium text-indigo-100 transition-colors hover:border-indigo-300/40 whitespace-nowrap shrink-0"
              >
                <span>AI SOC Analyst</span>
              </button>
            </div>
          </div>

          <div className="xl:col-span-5">
            <ThreeDSecurityCore
              posture={endpoint.posture}
              reducedMotion={reducedMotion}
              className="h-[290px] w-full rounded-2xl border border-sky-300/15 bg-[#050914]/65"
            />
          </div>
        </div>
      </GlassCard>

      {/* B. KPI Bento Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassMetricCard
          label="Total Security Events (24h)"
          value={endpoint.events24h}
          supportingText="Sysmon EID 1/3/7/11/13 + ETW"
          trendText="+12.4% vs baseline"
          trendDirection="up"
          accentTone="cyan"
          icon={<Activity className="h-5 w-5" />}
          reducedMotion={reducedMotion}
          onClick={() => onNavigate('live-monitor')}
          className="border-cyan-300/25 bg-gradient-to-br from-cyan-500/[0.08] via-slate-900/55 to-sky-500/[0.05]"
        />
        <GlassMetricCard
          label="Active Threat Alerts"
          value={activeAlertsCount}
          supportingText="New & Investigating queue"
          trendText="1 Critical hook alert"
          trendDirection="up"
          accentTone="amber"
          icon={<AlertTriangle className="h-5 w-5" />}
          reducedMotion={reducedMotion}
          onClick={() => onNavigate('threat-alerts')}
        />
        <GlassMetricCard
          label="High-Risk Processes"
          value={highRiskProcCount}
          supportingText="Unsigned / Office lineage"
          trendText="PID 6812 primary focus"
          trendDirection="neutral"
          accentTone="crimson"
          icon={<Cpu className="h-5 w-5" />}
          reducedMotion={reducedMotion}
          onClick={() => onNavigate('process-explorer')}
        />
        <GlassMetricCard
          label="Detection Engine Health"
          value={99}
          suffix="%"
          supportingText="Simulated rules (5/5)"
          trendText="DEMO Mode Active"
          trendDirection="down"
          accentTone="emerald"
          icon={<ShieldCheck className="h-5 w-5" />}
          reducedMotion={reducedMotion}
          onClick={() => onNavigate('system-health')}
        />
      </div>

      {/* C. Interactive Recharts Analytics Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <GlassChart
          title="Security Events Over Time"
          subtitle="Hourly synthetic event volume and flagged anomaly cadence (DEMO)"
          className="lg:col-span-8"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={EVENTS_OVER_TIME_DATA} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="ksEventArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#CBD5E1' }} />
                <Bar dataKey="suspicious" name="Suspicious Signals" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={16} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Telemetry"
                  stroke="#22D3EE"
                  strokeWidth={2.2}
                  fill="url(#ksEventArea)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassChart>

        <GlassChart
          title="Alert Severity Distribution"
          subtitle="Active & resolved synthetic alerts by risk tier"
          className="lg:col-span-4"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={4}
                  stroke="none"
                >
                  {severityDistData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassChart>

        <GlassChart
          title="Threat Categories"
          subtitle="Distribution across process, registry, network, file, and driver telemetry"
          className="lg:col-span-6"
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={THREAT_CATEGORIES_DATA} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Signals" radius={[6, 6, 0, 0]} barSize={28}>
                  {THREAT_CATEGORIES_DATA.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassChart>

        <GlassChart
          title="MITRE ATT&CK Techniques"
          subtitle="Correlated telemetry signal density (including T1056.001 indicators)"
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('mitre-attack')}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap"
            >
              View Matrix →
            </button>
          }
          className="lg:col-span-6"
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mitreChartData} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#CBD5E1" fontSize={11} width={78} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="signals" name="Correlated Signals" fill="#8B7CFF" radius={[0, 6, 6, 0]} barSize={14} />
                <Bar dataKey="alerts" name="Mapped Alerts" fill="#22D3EE" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassChart>
      </div>

      {/* D. Animated Activity Feed + 3D Threat Network Visualization */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <GlassCard className="xl:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Recent Security Activity Feed
              </h2>
              <p className="text-xs text-slate-400">
                Click any DEMO event to populate the Contextual Intelligence Panel
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('live-monitor')}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 whitespace-nowrap"
            >
              Open Live Monitor →
            </button>
          </div>
          <div className="space-y-2">
            {events.slice(0, 6).map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => onInspect({ kind: 'event', id: ev.id })}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300/10 bg-slate-900/45 px-3.5 py-2.5 text-left transition-colors hover:border-cyan-300/35 hover:bg-slate-900/75"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-300 tabular-nums">
                      {ev.timestamp.slice(11, 19)}
                    </span>
                    <span>·</span>
                    <span className="font-medium text-slate-300">{ev.category}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-300">{ev.processName}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-100">{ev.summary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <SeverityBadge severity={ev.severity} />
                  <StatusLabel status={ev.status} />
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4 xl:col-span-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                3D Threat Network Topology
              </h2>
              <p className="text-xs text-slate-400">
                Endpoint, flagged processes, external destinations, and correlated events
              </p>
            </div>
            <DemoBadge label="DEMO GRAPH" />
          </div>
          <Suspense
            fallback={
              <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-2xl border border-sky-300/15 bg-[#091224]/70 text-xs text-slate-400">
                Loading 3D Threat Network...
              </div>
            }
          >
            <ThreatNetwork3D
              endpointId={endpoint.id}
              reducedMotion={reducedMotion}
              onSelectEntity={(entity) => {
                if (entity.pid) onInspect({ kind: 'process', pid: entity.pid });
                else if (entity.eventId) onInspect({ kind: 'event', id: entity.eventId });
              }}
              className="min-h-[360px] flex-1 w-full"
            />
          </Suspense>
        </GlassCard>
      </div>
    </div>
  );
};
