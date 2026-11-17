import React, { useState } from 'react';
import { Bot, Check, Copy, Plus, Send } from 'lucide-react';
import type {
  AIAnalystMessage,
  InspectorSelection,
  ProcessNode,
  SecurityEvent,
  ThreatAlert,
} from '../types/security';
import { synthesizeDemoAIResponse } from '../services/securityAdapter';
import { DemoBadge, GlassCard } from '../components/ui/GlassPrimitives';

interface AISocAnalystPageProps {
  alerts: ThreatAlert[];
  processes: ProcessNode[];
  events: SecurityEvent[];
  liveAiEnabled: boolean;
  onInspect: (sel: InspectorSelection) => void;
}

const SUGGESTED_PROMPTS = [
  'Why was this process flagged?',
  'Explain this security alert.',
  'Summarize this incident.',
  'What evidence supports the detection?',
  'Which MITRE technique is relevant?',
  'What should I investigate next?',
];

export const AISocAnalystPage: React.FC<AISocAnalystPageProps> = ({
  alerts,
  processes,
  events,
  liveAiEnabled,
  onInspect,
}) => {
  const [conversations, setConversations] = useState<
    { id: string; title: string; messages: AIAnalystMessage[] }[]
  >(() => [
    {
      id: 'CONV-1',
      title: 'ALT-2041 · AudioSrvHelper.exe Triage',
      messages: [
        {
          id: 'MSG-0',
          role: 'assistant',
          timestamp: '10:07:10 UTC',
          structured: synthesizeDemoAIResponse('Why was this process flagged?', {
            alerts,
            processes,
            events,
            selectedAlertId: 'ALT-2041',
            selectedPid: 6812,
          }),
        },
      ],
    },
  ]);

  const [activeConvId, setActiveConvId] = useState('CONV-1');
  const [promptText, setPromptText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? conversations[0];

  const handleCopy = async (msg: AIAnalystMessage) => {
    const s = msg.structured;
    const text = s
      ? [
          `[${s.mode} OUTPUT]`,
          `Summary: ${s.summary}`,
          `Observed Evidence:\n- ${s.observedEvidence.join('\n- ')}`,
          `Risk Assessment: ${s.riskAssessment}`,
          `MITRE Context: ${s.mitreContext}`,
          `Recommended Steps:\n1. ${s.recommendedSteps.join('\n2. ')}`,
        ].join('\n\n')
      : msg.text ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleSend = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || isSending) return;

    const nowLabel = new Date().toISOString().slice(11, 19) + ' UTC';
    const userMsg: AIAnalystMessage = {
      id: `MSG-${Date.now()}-U`,
      role: 'user',
      timestamp: nowLabel,
      text: trimmed,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id ? { ...c, messages: [...c.messages, userMsg] } : c,
      ),
    );
    setPromptText('');

    if (liveAiEnabled) {
      setIsSending(true);
      try {
        const res = await fetch('/api/soc-analyst', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            contextSummary: {
              alert: alerts[0],
              process: processes.find((p) => p.pid === 6812),
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `AI endpoint returned HTTP ${res.status}`);
        }
        const assistantMsg: AIAnalystMessage = {
          id: `MSG-${Date.now()}-A`,
          role: 'assistant',
          timestamp: nowLabel,
          structured: data.structured,
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id ? { ...c, messages: [...c.messages, assistantMsg] } : c,
          ),
        );
      } catch (err) {
        const assistantErr: AIAnalystMessage = {
          id: `MSG-${Date.now()}-ERR`,
          role: 'assistant',
          timestamp: nowLabel,
          error:
            err instanceof Error
              ? err.message
              : 'Live AI provider unavailable. Disable Live AI in Settings to use DEMO synthesis.',
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id ? { ...c, messages: [...c.messages, assistantErr] } : c,
          ),
        );
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Frontend-first DEMO Investigation Synthesis (explicitly labeled DEMO)
    const structured = synthesizeDemoAIResponse(trimmed, {
      alerts,
      processes,
      events,
      selectedAlertId: 'ALT-2041',
      selectedPid: 6812,
    });
    const assistantMsg: AIAnalystMessage = {
      id: `MSG-${Date.now()}-A`,
      role: 'assistant',
      timestamp: nowLabel,
      structured,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id ? { ...c, messages: [...c.messages, assistantMsg] } : c,
      ),
    );
  };

  const handleNewChat = () => {
    const id = `CONV-${conversations.length + 1}`;
    setConversations((prev) => [
      {
        id,
        title: `Investigation Session #${conversations.length + 1}`,
        messages: [],
      },
      ...prev,
    ]);
    setActiveConvId(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">AI SOC Analyst</h1>
            <DemoBadge label={liveAiEnabled ? 'LIVE GEMINI ROUTE' : 'DEMONSTRATION OUTPUT'} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Structured endpoint investigation assistant grounded strictly in observed telemetry evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Conversation History Rail */}
        <GlassCard className="space-y-4 xl:col-span-3">
          <div className="text-xs font-semibold text-slate-200">Investigation Threads</div>
          <div className="space-y-1.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConvId(conv.id)}
                className={`flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                  conv.id === activeConv.id
                    ? 'border-cyan-300/35 bg-cyan-500/15 text-slate-50'
                    : 'border-slate-300/10 bg-slate-900/45 text-slate-300 hover:border-cyan-300/25'
                }`}
              >
                <span className="truncate font-medium">{conv.title}</span>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {conv.messages.length} messages
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-300/10 pt-3">
            <div className="mb-2 text-[11px] font-semibold text-slate-400">
              Suggested Prompts
            </div>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  className="flex w-full rounded-xl border border-slate-300/10 bg-slate-900/45 px-2.5 py-2 text-left text-xs text-slate-300 transition-colors hover:border-cyan-300/35 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Central AI Investigation Stream */}
        <div className="flex flex-col gap-4 xl:col-span-9">
          <GlassCard className="min-h-[430px] flex-1 space-y-5">
            {activeConv.messages.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center text-center">
                <Bot className="h-10 w-10 text-cyan-300/80" />
                <h2 className="font-display mt-3 text-base font-semibold text-slate-100">
                  Start a Structured SOC Investigation
                </h2>
                <p className="mt-1 max-w-md text-xs text-slate-400">
                  Select a suggested prompt or ask a question about flagged processes, hook API metadata, or MITRE ATT&amp;CK context.
                </p>
              </div>
            ) : (
              activeConv.messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-xl rounded-2xl border border-cyan-300/30 bg-cyan-500/15 px-4 py-3 text-xs text-slate-50">
                        <div className="mb-1 font-mono text-[10px] text-cyan-200">
                          Analyst · {msg.timestamp}
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                }

                if (msg.error) {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-xs text-rose-200"
                    >
                      <div className="font-semibold">Live AI Provider Error</div>
                      <p className="mt-1">{msg.error}</p>
                    </div>
                  );
                }

                const s = msg.structured!;
                return (
                  <div
                    key={msg.id}
                    className="space-y-4 rounded-2xl border border-slate-300/15 bg-slate-900/55 p-5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-cyan-300" />
                        <span className="font-semibold text-slate-100">KEYSHIELD AI Analyst</span>
                        <DemoBadge
                          label={s.mode === 'DEMO' ? 'DEMONSTRATION OUTPUT' : 'LIVE GEMINI'}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/15 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-300/35 hover:text-white"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-300" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy Response
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-semibold text-cyan-300">1. Summary</h3>
                      <p className="mt-1 leading-relaxed text-slate-100">{s.summary}</p>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-semibold text-cyan-300">2. Observed Evidence</h3>
                      <ul className="mt-1.5 space-y-1.5 text-slate-300">
                        {s.observedEvidence.map((ev, idx) => (
                          <li
                            key={idx}
                            className="rounded-xl border border-slate-300/10 bg-slate-950/50 px-3 py-2"
                          >
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-300/10 bg-slate-950/45 p-3">
                        <h3 className="text-[11px] font-semibold text-amber-300">
                          3. Risk Assessment
                        </h3>
                        <p className="mt-1 leading-relaxed text-slate-300">{s.riskAssessment}</p>
                      </div>
                      <div className="rounded-xl border border-slate-300/10 bg-slate-950/45 p-3">
                        <h3 className="text-[11px] font-semibold text-violet-300">
                          4. MITRE Context
                        </h3>
                        <p className="mt-1 leading-relaxed text-slate-300">{s.mitreContext}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-semibold text-cyan-300">
                        5. Recommended Investigation Steps
                      </h3>
                      <ol className="mt-1.5 space-y-1 text-slate-200">
                        {s.recommendedSteps.map((step, i) => (
                          <li key={i}>
                            {i + 1}. {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-300/10 pt-3">
                      <span className="text-[11px] text-slate-400">Evidence References:</span>
                      {s.referencedIds.map((refId) => (
                        <button
                          key={refId}
                          type="button"
                          onClick={() => {
                            if (refId.startsWith('ALT')) onInspect({ kind: 'alert', id: refId });
                            else if (refId.startsWith('EVT')) onInspect({ kind: 'event', id: refId });
                            else if (refId.startsWith('T')) onInspect({ kind: 'mitre', id: refId });
                            else if (refId.startsWith('INC')) onInspect({ kind: 'incident', id: refId });
                          }}
                          className="rounded-md border border-cyan-300/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] text-cyan-200 hover:border-cyan-300/50"
                        >
                          {refId}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </GlassCard>

          {/* Floating Glass Prompt Input */}
          <GlassCard className="p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(promptText);
              }}
              className="flex items-center gap-2.5"
            >
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                aria-label="Ask AI SOC Analyst"
                placeholder="Ask about flagged process lineage, evidence, MITRE mapping, or next triage steps..."
                className="h-10 flex-1 bg-transparent px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSending || !promptText.trim()}
                className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 px-4 text-xs font-semibold text-cyan-50 disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                {isSending ? 'Analyzing...' : 'Investigate'}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
