import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DEMO_ALERTS,
  DEMO_ENDPOINTS,
  DEMO_EVENTS,
  DEMO_HEALTH_COMPONENTS,
  DEMO_INCIDENTS,
  DEMO_MITRE_TECHNIQUES,
  DEMO_NOTIFICATIONS,
  DEMO_PROCESSES,
  DEMO_REPORTS,
  DEMO_RULES,
} from './mock-data/telemetryData';
import type {
  AlertStatus,
  AppSettings,
  DetectionRule,
  GeneratedReport,
  IncidentRecord,
  InspectorSelection,
  NotificationItem,
  ReportType,
  RouteId,
  ThreatAlert,
} from './types/security';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { pageVariants } from './animations/motionPresets';
import { updateAlertStatusInList } from './services/securityAdapter';
import { CosmicBackdrop } from './components/ui/CosmicBackdrop';
import { FloatingSidebar } from './layouts/FloatingSidebar';
import { GlassNavbar } from './layouts/GlassNavbar';
import { ContextInspector } from './layouts/ContextInspector';
import { CommandPalette } from './components/CommandPalette';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { ThreatAlertsPage } from './pages/ThreatAlertsPage';
import { ProcessExplorerPage } from './pages/ProcessExplorerPage';
import { EventTimelinePage } from './pages/EventTimelinePage';
import { ThreatHuntingPage } from './pages/ThreatHuntingPage';
import { AISocAnalystPage } from './pages/AISocAnalystPage';
import { MitreAttackPage } from './pages/MitreAttackPage';
import { DetectionRulesPage } from './pages/DetectionRulesPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1280 : true,
  );
  const [commandOpen, setCommandOpen] = useState(false);

  const [selectedEndpointId, setSelectedEndpointId] = useState(DEMO_ENDPOINTS[0].id);
  const [alerts, setAlerts] = useState<ThreatAlert[]>(DEMO_ALERTS);
  const [rules, setRules] = useState<DetectionRule[]>(DEMO_RULES);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(DEMO_INCIDENTS);
  const [reports, setReports] = useState<GeneratedReport[]>(DEMO_REPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [inspectorSelection, setInspectorSelection] = useState<InspectorSelection>({
    kind: 'alert',
    id: 'ALT-2041',
  });

  const [settings, setSettings] = useState<AppSettings>({
    glassIntensity: 'balanced',
    reducedMotionOverride: false,
    liveFeedAutoAppend: false,
    telemetryMode: 'DEMO',
    liveAiEnabled: false,
  });

  const reducedMotion = usePrefersReducedMotion(settings.reducedMotionOverride);

  // Auto-collapse inspector drawer when transitioning below xl viewport
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const onChange = (e: MediaQueryListEvent) => {
      setInspectorOpen(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((open) => !open);
      } else if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeEndpoint = useMemo(
    () => DEMO_ENDPOINTS.find((e) => e.id === selectedEndpointId) ?? DEMO_ENDPOINTS[0],
    [selectedEndpointId],
  );

  const openAlertCount = useMemo(
    () => alerts.filter((a) => a.status === 'New' || a.status === 'Investigating').length,
    [alerts],
  );

  const handleInspect = (sel: InspectorSelection, route?: RouteId) => {
    setInspectorSelection(sel);
    setInspectorOpen(true);
    if (route) setActiveRoute(route);
  };

  const handleUpdateAlertStatus = (alertId: string, status: AlertStatus) => {
    setAlerts((prev) => updateAlertStatusInList(prev, alertId, status));
  };

  const handleAddAlertNote = (alertId: string, text: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              notes: [
                ...a.notes,
                {
                  id: `NOTE-${Date.now()}`,
                  author: 'R. Patel (Tier 2 SOC)',
                  timestamp: new Date().toISOString().slice(0, 19) + 'Z',
                  content: text,
                },
              ],
            }
          : a,
      ),
    );
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const handleSaveRule = (updated: DetectionRule) => {
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleUpdateIncidentStatus = (
    incidentId: string,
    status: IncidentRecord['status'],
  ) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? { ...i, status, updatedAt: new Date().toISOString().slice(0, 19) + 'Z' }
          : i,
      ),
    );
  };

  const handleAddIncidentNote = (incidentId: string, text: string) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              notes: [
                ...i.notes,
                {
                  id: `INC-N-${Date.now()}`,
                  author: 'R. Patel',
                  timestamp: new Date().toISOString().slice(0, 19) + 'Z',
                  content: text,
                },
              ],
            }
          : i,
      ),
    );
  };

  const handleGenerateReport = (type: ReportType, dateRange: string): GeneratedReport => {
    const created: GeneratedReport = {
      id: `RPT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${type} (${dateRange}) · DEMO`,
      type,
      generatedAt: new Date().toISOString(),
      dateRange,
      endpointScope: activeEndpoint.id,
      author: 'R. Patel',
      summary: `Generated ${type} from synthetic DEMO telemetry for ${activeEndpoint.id} covering ${dateRange}.`,
      metrics: [
        { label: 'Events Scanned', value: activeEndpoint.events24h.toLocaleString() },
        { label: 'Open Alerts', value: String(openAlertCount) },
        { label: 'Active Rules', value: `${rules.filter((r) => r.enabled).length} / ${rules.length}` },
        { label: 'Open Incidents', value: String(incidents.filter((i) => i.status !== 'Closed').length) },
      ],
      isDemo: true,
    };
    setReports((prev) => [created, ...prev]);
    return created;
  };

  const handleSelectNotification = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    setActiveRoute(notif.routeTarget);
    if (notif.itemId?.startsWith('ALT')) {
      handleInspect({ kind: 'alert', id: notif.itemId });
    } else if (notif.itemId?.startsWith('INC')) {
      handleInspect({ kind: 'incident', id: notif.itemId });
    }
  };

  const renderPage = () => {
    switch (activeRoute) {
      case 'overview':
        return (
          <OverviewPage
            endpoint={activeEndpoint}
            events={DEMO_EVENTS}
            alerts={alerts}
            processes={DEMO_PROCESSES}
            mitre={DEMO_MITRE_TECHNIQUES}
            reducedMotion={reducedMotion}
            onNavigate={setActiveRoute}
            onInspect={handleInspect}
          />
        );
      case 'live-monitor':
        return (
          <LiveMonitorPage
            events={DEMO_EVENTS}
            selectedEndpointId={selectedEndpointId}
            onInspect={handleInspect}
          />
        );
      case 'threat-alerts':
        return (
          <ThreatAlertsPage
            alerts={alerts}
            onUpdateStatus={handleUpdateAlertStatus}
            onAddNote={handleAddAlertNote}
            onInspect={handleInspect}
          />
        );
      case 'process-explorer':
        return (
          <ProcessExplorerPage
            processes={DEMO_PROCESSES}
            reducedMotion={reducedMotion}
            onInspect={handleInspect}
          />
        );
      case 'event-timeline':
        return <EventTimelinePage events={DEMO_EVENTS} onInspect={handleInspect} />;
      case 'threat-hunting':
        return <ThreatHuntingPage events={DEMO_EVENTS} onInspect={handleInspect} />;
      case 'ai-analyst':
        return (
          <AISocAnalystPage
            alerts={alerts}
            processes={DEMO_PROCESSES}
            events={DEMO_EVENTS}
            liveAiEnabled={settings.liveAiEnabled}
            onInspect={handleInspect}
          />
        );
      case 'mitre-attack':
        return (
          <MitreAttackPage
            techniques={DEMO_MITRE_TECHNIQUES}
            alerts={alerts}
            onInspect={handleInspect}
          />
        );
      case 'detection-rules':
        return (
          <DetectionRulesPage
            rules={rules}
            events={DEMO_EVENTS}
            onToggleRule={handleToggleRule}
            onSaveRule={handleSaveRule}
          />
        );
      case 'incident-management':
        return (
          <IncidentManagementPage
            incidents={incidents}
            alerts={alerts}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onAddIncidentNote={handleAddIncidentNote}
            onInspect={handleInspect}
          />
        );
      case 'reports':
        return (
          <ReportsPage reports={reports} onGenerateReport={handleGenerateReport} />
        );
      case 'system-health':
        return <SystemHealthPage components={DEMO_HEALTH_COMPONENTS} />;
      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip text-slate-100">
      <CosmicBackdrop glassIntensity={settings.glassIntensity} />

      {/* Three-Panel Floating Glass Workspace */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1720px] gap-4 p-3 sm:p-4">
        <FloatingSidebar
          activeRoute={activeRoute}
          onNavigate={setActiveRoute}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          openAlertCount={openAlertCount}
        />

        {/* Center Main Column */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <GlassNavbar
            endpoints={DEMO_ENDPOINTS}
            selectedEndpointId={selectedEndpointId}
            onSelectEndpoint={setSelectedEndpointId}
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onSelectNotification={handleSelectNotification}
            onOpenCommandPalette={() => setCommandOpen(true)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen((o) => !o)}
            onNavigate={setActiveRoute}
          />

          <div className="flex min-w-0 flex-1 gap-4">
            <main className="min-w-0 flex-1 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRoute}
                  variants={reducedMotion ? undefined : pageVariants}
                  initial={reducedMotion ? false : 'initial'}
                  animate="animate"
                  exit={reducedMotion ? undefined : 'exit'}
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Desktop Right Contextual Intelligence Panel */}
            {inspectorOpen && (
              <div className="hidden xl:block w-[305px] shrink-0">
                <div className="sticky top-4 h-[calc(100vh-6rem)]">
                  <ContextInspector
                    open={inspectorOpen}
                    onClose={() => setInspectorOpen(false)}
                    selection={inspectorSelection}
                    alerts={alerts}
                    events={DEMO_EVENTS}
                    processes={DEMO_PROCESSES}
                    incidents={incidents}
                    mitre={DEMO_MITRE_TECHNIQUES}
                    onNavigate={setActiveRoute}
                    onSelectItem={(sel) => handleInspect(sel)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Drawer Inspector for viewports < xl when explicitly opened */}
      {inspectorOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-slate-950/70 xl:hidden"
            onClick={() => setInspectorOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-4 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] xl:hidden">
            <ContextInspector
              open={inspectorOpen}
              onClose={() => setInspectorOpen(false)}
              selection={inspectorSelection}
              alerts={alerts}
              events={DEMO_EVENTS}
              processes={DEMO_PROCESSES}
              incidents={incidents}
              mitre={DEMO_MITRE_TECHNIQUES}
              onNavigate={setActiveRoute}
              onSelectItem={(sel) => handleInspect(sel)}
            />
          </div>
        </>
      )}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={setActiveRoute}
        onInspect={handleInspect}
        events={DEMO_EVENTS}
        alerts={alerts}
        processes={DEMO_PROCESSES}
        incidents={incidents}
        mitre={DEMO_MITRE_TECHNIQUES}
      />
    </div>
  );
}
