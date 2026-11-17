import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  FileBarChart2,
  FolderKanban,
  HeartPulse,
  LayoutDashboard,
  Radar,
  Scale,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { RouteId } from '../types/security';
import { BrandLogo } from '../components/ui/BrandLogo';

export interface NavItemDef {
  id: RouteId;
  label: string;
  section: 'Workspace' | 'Intelligence' | 'Operations';
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface FloatingSidebarProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  openAlertCount: number;
}

export const NAV_ITEMS: NavItemDef[] = [
  { id: 'overview', label: 'Overview', section: 'Workspace', icon: LayoutDashboard },
  { id: 'live-monitor', label: 'Live Monitor', section: 'Workspace', icon: Activity },
  { id: 'threat-alerts', label: 'Threat Alerts', section: 'Workspace', icon: AlertTriangle },
  { id: 'process-explorer', label: 'Process Explorer', section: 'Workspace', icon: Cpu },
  { id: 'event-timeline', label: 'Event Timeline', section: 'Workspace', icon: Clock },

  { id: 'threat-hunting', label: 'Threat Hunting', section: 'Intelligence', icon: Radar },
  { id: 'ai-analyst', label: 'AI SOC Analyst', section: 'Intelligence', icon: Bot },
  { id: 'mitre-attack', label: 'MITRE ATT&CK', section: 'Intelligence', icon: ShieldAlert },
  { id: 'detection-rules', label: 'Detection Rules', section: 'Intelligence', icon: Scale },

  { id: 'incident-management', label: 'Incident Management', section: 'Operations', icon: FolderKanban },
  { id: 'reports', label: 'Reports', section: 'Operations', icon: FileBarChart2 },
  { id: 'system-health', label: 'System Health', section: 'Operations', icon: HeartPulse },
  { id: 'settings', label: 'Settings', section: 'Operations', icon: Settings },
];

const SECTIONS: NavItemDef['section'][] = ['Workspace', 'Intelligence', 'Operations'];

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({
  activeRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  openAlertCount,
}) => {
  const renderNavContent = (isMobile = false) => {
    const isCompact = !isMobile && collapsed;

    return (
      <div className="ks-glass flex h-full flex-col justify-between rounded-2xl p-3">
        <div className="flex flex-col gap-4 overflow-y-auto pr-0.5">
          {/* Brand Header */}
          <div className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'} px-1.5 py-1`}>
            <button
              type="button"
              onClick={() => {
                onNavigate('overview');
                if (isMobile) onCloseMobile();
              }}
              className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-cyan-400"
              aria-label="KEYSHIELD AI Home"
            >
              <BrandLogo size={32} />
              {!isCompact && (
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold tracking-wide text-slate-50 whitespace-nowrap">
                    KEYSHIELD AI
                  </div>
                  <div className="text-[10px] font-medium tracking-wide text-cyan-300/80 whitespace-nowrap">
                    Endpoint Intelligence
                  </div>
                </div>
              )}
            </button>

            {isMobile ? (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300/15 text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300/15 bg-slate-900/40 text-slate-300 transition-colors hover:border-cyan-300/35 hover:text-white"
              >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <nav aria-label="Primary Workspace Navigation" className="flex flex-col gap-4">
            {SECTIONS.map((section) => {
              const items = NAV_ITEMS.filter((i) => i.section === section);
              return (
                <div key={section} className="flex flex-col gap-1">
                  {!isCompact && (
                    <div className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400/90">
                      {section}
                    </div>
                  )}
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = activeRoute === item.id;
                    const showAlertCount = item.id === 'threat-alerts' && openAlertCount > 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigate(item.id);
                          if (isMobile) onCloseMobile();
                        }}
                        title={isCompact ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center ${
                          isCompact ? 'justify-center px-2' : 'justify-between px-3'
                        } h-9.5 rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          active
                            ? 'border border-cyan-300/30 bg-gradient-to-r from-cyan-500/18 via-sky-500/14 to-indigo-500/10 text-slate-50 shadow-[0_0_24px_-6px_rgba(34,211,238,0.35)]'
                            : 'border border-transparent text-slate-300/90 hover:border-slate-300/12 hover:bg-slate-800/45 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              active ? 'text-cyan-300' : 'text-slate-400 group-hover:text-sky-300'
                            }`}
                          />
                          {!isCompact && <span className="truncate whitespace-nowrap">{item.label}</span>}
                        </span>
                        {!isCompact && showAlertCount && (
                          <span className="font-mono text-[11px] font-semibold text-amber-300 tabular-nums">
                            {openAlertCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Analyst Profile Footer */}
        <div className={`mt-3 border-t border-slate-300/10 pt-3 ${isCompact ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${isCompact ? 'justify-center' : 'gap-2.5 px-1.5'}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-500/25 to-indigo-500/25 font-display text-xs font-semibold text-cyan-100">
              RP
            </div>
            {!isCompact && (
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-100">R. Patel</div>
                <div className="truncate text-[11px] text-slate-400">Lead SOC Analyst</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Floating Glass Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          collapsed ? 'w-[74px]' : 'w-[244px]'
        }`}
      >
        <div className="sticky top-4 h-[calc(100vh-2rem)]">{renderNavContent(false)}</div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation backdrop"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/75"
          />
          <aside className="relative z-10 h-full w-72 p-3">{renderNavContent(true)}</aside>
        </div>
      )}
    </>
  );
};
