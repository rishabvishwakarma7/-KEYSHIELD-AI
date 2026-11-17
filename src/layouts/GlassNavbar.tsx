import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Command,
  Menu,
  Monitor,
  PanelRightClose,
  PanelRightOpen,
  Search,
  User,
} from 'lucide-react';
import type { EndpointHost, NotificationItem, RouteId } from '../types/security';
import { DemoBadge, SeverityBadge } from '../components/ui/GlassPrimitives';

interface GlassNavbarProps {
  endpoints: EndpointHost[];
  selectedEndpointId: string;
  onSelectEndpoint: (id: string) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
  onOpenCommandPalette: () => void;
  onOpenMobileNav: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onNavigate: (route: RouteId) => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  endpoints,
  selectedEndpointId,
  onSelectEndpoint,
  notifications,
  onMarkAllRead,
  onSelectNotification,
  onOpenCommandPalette,
  onOpenMobileNav,
  inspectorOpen,
  onToggleInspector,
  onNavigate,
}) => {
  const [endpointOpen, setEndpointOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nowStr, setNowStr] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );

  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowStr(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setEndpointOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeEndpoint = endpoints.find((e) => e.id === selectedEndpointId) ?? endpoints[0];

  return (
    <header ref={navRef} className="ks-glass relative z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
      {/* Left: Mobile Nav + Global Search Trigger + Endpoint Selector */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300/15 bg-slate-900/50 text-slate-200 hover:border-cyan-300/35 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Global Search & Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Open global search and command palette"
          className="flex h-9 min-w-[200px] sm:min-w-[260px] items-center justify-between gap-3 rounded-xl border border-slate-300/15 bg-slate-900/50 px-3 text-xs text-slate-300 transition-colors hover:border-cyan-300/35 hover:text-white"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <span className="truncate">Search events, alerts, processes, MITRE...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300/20 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 shrink-0">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Endpoint Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setEndpointOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            aria-expanded={endpointOpen}
            aria-label="Select endpoint"
            className="flex h-9 items-center gap-2 rounded-xl border border-slate-300/15 bg-slate-900/50 px-3 text-xs font-medium text-slate-100 transition-colors hover:border-cyan-300/35 whitespace-nowrap shrink-0"
          >
            <Monitor className="h-3.5 w-3.5 text-sky-300" />
            <span className="font-mono">{activeEndpoint?.id}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {endpointOpen && (
            <div className="ks-glass-elevated absolute left-0 top-11 z-40 w-72 rounded-2xl p-2">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400">
                Simulated Endpoints (DEMO)
              </div>
              {endpoints.map((ep) => {
                const selected = ep.id === selectedEndpointId;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      onSelectEndpoint(ep.id);
                      setEndpointOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      selected
                        ? 'bg-cyan-500/15 text-cyan-100 border border-cyan-300/25'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-semibold">{ep.id}</div>
                      <div className="text-[11px] text-slate-400">{ep.department}</div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                      {ep.activeAlertsCount} alerts
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Monitoring Mode + Clock + Notifications + Inspector Toggle + Profile */}
      <div className="flex items-center gap-2.5">
        <DemoBadge label="DEMO SIMULATION" />

        <div className="hidden xl:flex items-center px-2 font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
          {nowStr}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setEndpointOpen(false);
              setProfileOpen(false);
            }}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notifOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300/15 bg-slate-900/50 text-slate-200 transition-colors hover:border-cyan-300/35 hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 font-mono text-[10px] font-bold text-slate-950 tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="ks-glass-elevated absolute right-0 top-11 z-40 w-80 sm:w-96 rounded-2xl p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-100">Notification Center</span>
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-[11px] font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Mark all read
                </button>
              </div>
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onSelectNotification(n);
                      setNotifOpen(false);
                    }}
                    className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-colors ${
                      n.read
                        ? 'border-slate-300/10 bg-slate-900/30 text-slate-300'
                        : 'border-cyan-300/25 bg-cyan-500/10 text-slate-100'
                    } hover:border-cyan-300/40`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold">{n.title}</span>
                      <SeverityBadge severity={n.severity} />
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">{n.description}</p>
                    <span className="font-mono text-[10px] text-slate-500">{n.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Right Context Inspector */}
        <button
          type="button"
          onClick={onToggleInspector}
          aria-label={inspectorOpen ? 'Collapse intelligence panel' : 'Expand intelligence panel'}
          title={inspectorOpen ? 'Hide Context Panel' : 'Show Context Panel'}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-300/15 bg-slate-900/50 px-2.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-300/35 hover:text-white whitespace-nowrap shrink-0"
        >
          {inspectorOpen ? (
            <PanelRightClose className="h-4 w-4 text-cyan-300" />
          ) : (
            <PanelRightOpen className="h-4 w-4 text-slate-300" />
          )}
          <span className="hidden sm:inline">Inspector</span>
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setEndpointOpen(false);
              setNotifOpen(false);
            }}
            aria-label="Open analyst profile menu"
            aria-expanded={profileOpen}
            className="flex h-9 items-center gap-2 rounded-xl border border-slate-300/15 bg-slate-900/50 px-2.5 text-xs font-medium text-slate-200 hover:border-cyan-300/35"
          >
            <User className="h-3.5 w-3.5 text-cyan-300" />
            <span className="hidden md:inline whitespace-nowrap">R. Patel</span>
          </button>

          {profileOpen && (
            <div className="ks-glass-elevated absolute right-0 top-11 z-40 w-56 rounded-2xl p-2 text-xs">
              <div className="border-b border-slate-300/10 px-2.5 py-2">
                <div className="font-semibold text-slate-100">R. Patel</div>
                <div className="text-[11px] text-slate-400">Tier 2 SOC · Demo Workspace</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigate('system-health');
                  setProfileOpen(false);
                }}
                className="mt-1 flex w-full rounded-xl px-2.5 py-2 text-left text-slate-300 hover:bg-slate-800/60 hover:text-white"
              >
                System Health &amp; Telemetry
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('settings');
                  setProfileOpen(false);
                }}
                className="flex w-full rounded-xl px-2.5 py-2 text-left text-slate-300 hover:bg-slate-800/60 hover:text-white"
              >
                Workspace Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
