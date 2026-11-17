import React, { useMemo, useState } from 'react';
import { CheckCircle2, Play, Save, XCircle } from 'lucide-react';
import type { DetectionRule, SecurityEvent } from '../types/security';
import {
  testDetectionRuleAgainstEvents,
  validateDetectionRuleSyntax,
} from '../services/securityAdapter';
import { DemoBadge, GlassCard, SeverityBadge } from '../components/ui/GlassPrimitives';

interface DetectionRulesPageProps {
  rules: DetectionRule[];
  events: SecurityEvent[];
  onToggleRule: (ruleId: string) => void;
  onSaveRule: (rule: DetectionRule) => void;
}

export const DetectionRulesPage: React.FC<DetectionRulesPageProps> = ({
  rules,
  events,
  onToggleRule,
  onSaveRule,
}) => {
  const [selectedId, setSelectedId] = useState(rules[0]?.id ?? '');
  const activeRule = rules.find((r) => r.id === selectedId) ?? rules[0];

  const [draftQuery, setDraftQuery] = useState(activeRule?.queryText ?? '');
  const [draftPattern, setDraftPattern] = useState(activeRule?.matchPattern ?? '');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [testMatches, setTestMatches] = useState<SecurityEvent[] | null>(null);

  const selectRule = (rule: DetectionRule) => {
    setSelectedId(rule.id);
    setDraftQuery(rule.queryText);
    setDraftPattern(rule.matchPattern);
    setSaveFeedback('');
    setTestMatches(null);
  };

  const validation = useMemo(() => {
    if (!activeRule) return { valid: false, errors: ['No rule selected'], warnings: [] };
    return validateDetectionRuleSyntax({
      name: activeRule.name,
      queryText: draftQuery,
      matchPattern: draftPattern,
      mitreId: activeRule.mitreId,
    });
  }, [activeRule, draftQuery, draftPattern]);

  const handleSave = () => {
    if (!activeRule || !validation.valid) return;
    onSaveRule({
      ...activeRule,
      queryText: draftQuery,
      matchPattern: draftPattern,
      lastModified: new Date().toISOString().slice(0, 10),
    });
    setSaveFeedback('Rule updated in client session.');
    window.setTimeout(() => setSaveFeedback(''), 2500);
  };

  const handleTest = () => {
    if (!activeRule || !validation.valid) return;
    const simulated: DetectionRule = {
      ...activeRule,
      queryText: draftQuery,
      matchPattern: draftPattern,
    };
    setTestMatches(testDetectionRuleAgainstEvents(simulated, events));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Detection Rules</h1>
            <DemoBadge label="SIGMA-STYLE DEMO ENGINE" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Author, validate, toggle, and test behavioral rules against synthetic endpoint telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Rule List */}
        <div className="space-y-2.5 xl:col-span-5">
          {rules.map((rule) => {
            const selected = rule.id === activeRule?.id;
            return (
              <div
                key={rule.id}
                className={`ks-glass rounded-2xl p-4 transition-colors ${
                  selected ? 'border-cyan-300/45' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => selectRule(rule)}
                    className="font-mono text-xs font-semibold text-cyan-300 hover:underline"
                  >
                    {rule.id}
                  </button>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={rule.severity} />
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rule.enabled}
                      aria-label={`Toggle rule ${rule.id}`}
                      onClick={() => onToggleRule(rule.id)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        rule.enabled
                          ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                          : 'border-slate-400/25 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectRule(rule)}
                  className="mt-2 block w-full text-left"
                >
                  <div className="text-sm font-semibold text-slate-100">{rule.name}</div>
                  <p className="mt-1 text-xs text-slate-400">{rule.description}</p>
                  <div className="mt-2 font-mono text-[11px] text-violet-300">
                    {rule.mitreId} · {rule.category}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Code-Editor-Inspired Glass Rule Editor & Test Panel */}
        {activeRule && (
          <GlassCard className="space-y-4 xl:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/10 pb-3">
              <div>
                <div className="font-mono text-xs font-semibold text-cyan-300">{activeRule.id}</div>
                <h2 className="font-display text-base font-semibold text-slate-50">
                  {activeRule.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!validation.valid}
                  onClick={handleTest}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/30 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-100 disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" /> Test Rule
                </button>
                <button
                  type="button"
                  disabled={!validation.valid}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-50 disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="rule-pattern-input" className="mb-1 block text-xs font-medium text-slate-300">
                Simulated Match Regex ({activeRule.matchField})
              </label>
              <input
                id="rule-pattern-input"
                type="text"
                value={draftPattern}
                onChange={(e) => setDraftPattern(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-300/15 bg-slate-950/65 px-3 font-mono text-xs text-cyan-200 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="rule-yaml-editor" className="mb-1 block text-xs font-medium text-slate-300">
                Rule Definition (YAML / Sigma Syntax)
              </label>
              <textarea
                id="rule-yaml-editor"
                rows={12}
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                spellCheck={false}
                className="w-full rounded-xl border border-slate-300/15 bg-[#050914]/85 p-3.5 font-mono text-xs leading-relaxed text-slate-100 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            {/* Validation Status */}
            <div className="rounded-xl border border-slate-300/10 bg-slate-900/50 p-3 text-xs">
              {validation.valid ? (
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Syntax &amp; schema validation passed.</span>
                </div>
              ) : (
                <div className="space-y-1 text-rose-300">
                  {validation.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
              {saveFeedback && <div className="mt-1.5 text-cyan-300">{saveFeedback}</div>}
            </div>

            {/* Rule Test Results */}
            {testMatches !== null && (
              <div className="space-y-2 border-t border-slate-300/10 pt-3">
                <div className="text-xs font-semibold text-slate-200">
                  Test Output: {testMatches.length} matching DEMO events
                </div>
                {testMatches.length === 0 ? (
                  <p className="text-xs text-slate-400">No DEMO events matched this rule pattern.</p>
                ) : (
                  <div className="space-y-1.5">
                    {testMatches.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-slate-300/10 bg-slate-900/45 px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-mono font-semibold text-cyan-300">{m.id}</span>
                          <span className="ml-2 text-slate-200">{m.summary}</span>
                        </div>
                        <SeverityBadge severity={m.severity} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
};
