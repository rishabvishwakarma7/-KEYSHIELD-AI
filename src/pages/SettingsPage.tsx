import React from 'react';
import type { AppSettings } from '../types/security';
import { DemoBadge, GlassCard } from '../components/ui/GlassPrimitives';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings }) => {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold text-slate-50">Workspace Settings</h1>
          <DemoBadge label="FRONTEND ADAPTER" />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Customize glassmorphism depth, motion accessibility, and AI SOC Analyst routing preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-100">
            Visual Atmosphere &amp; Motion
          </h2>

          <div>
            <div className="mb-2 text-xs font-medium text-slate-300">
              Glass Atmospheric Intensity
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['subtle', 'balanced', 'deep'] as AppSettings['glassIntensity'][]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSettings({ glassIntensity: mode })}
                  className={`rounded-xl border py-2 text-xs font-medium capitalize transition-colors ${
                    settings.glassIntensity === mode
                      ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                      : 'border-slate-300/15 bg-slate-900/45 text-slate-300 hover:border-cyan-300/30'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-300/10 pt-4">
            <div>
              <div className="text-xs font-semibold text-slate-200">Reduced Motion Mode</div>
              <div className="text-[11px] text-slate-400">
                Pauses continuous 3D orbital loops and hover perspective tilt.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reducedMotionOverride}
              aria-label="Toggle reduced motion mode"
              onClick={() =>
                onUpdateSettings({ reducedMotionOverride: !settings.reducedMotionOverride })
              }
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                settings.reducedMotionOverride
                  ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-300/15 bg-slate-900/50 text-slate-300'
              }`}
            >
              {settings.reducedMotionOverride ? 'Enabled' : 'System Default'}
            </button>
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-100">
            Telemetry &amp; AI Provider Integration
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-200">Telemetry Source Mode</div>
              <div className="text-[11px] text-slate-400">
                Frontend-first synthetic dataset via SecurityDataAdapter interface.
              </div>
            </div>
            <DemoBadge label="DEMO ONLY" />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-300/10 pt-4">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Server-Side Live AI SOC Analyst (/api/soc-analyst)
              </div>
              <div className="text-[11px] text-slate-400">
                When enabled, sends analyst queries to the server-side Gemini endpoint instead of deterministic DEMO synthesis.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.liveAiEnabled}
              aria-label="Toggle Live Gemini AI SOC Analyst"
              onClick={() => onUpdateSettings({ liveAiEnabled: !settings.liveAiEnabled })}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                settings.liveAiEnabled
                  ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                  : 'border-slate-300/15 bg-slate-900/50 text-slate-300'
              }`}
            >
              {settings.liveAiEnabled ? 'Live API' : 'Demo Output'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
