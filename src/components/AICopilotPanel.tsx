import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User as UserIcon, Loader2, CalendarDays, Database, ShieldCheck } from 'lucide-react';
import type { JournalEntry } from '../types';
import { TripFitPanel, loadTripFitContext, type TripFitContext } from './TripFitPanel';

interface AICopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const buildSandboxNexusReply = (
  prompt: string,
  entries: JournalEntry[],
  tripFitContext: TripFitContext,
) => {
  if (entries.length === 0) {
    return 'Sandbox Atlas analysis — add one meaningful place and a short note about why it mattered. Nexus can then connect that signal to future-trip ideas.';
  }

  const lowerPrompt = prompt.toLowerCase();
  const countries = [...new Set(entries.map((entry) => entry.country).filter(Boolean))];
  const natureMemory = entries.find((entry) => entry.category === 'trek' || entry.category === 'nature') ?? entries[0];
  const cityMemory = entries.find((entry) => entry.category === 'city' || entry.category === 'culture') ?? entries[1] ?? entries[0];
  const tripContext = tripFitContext.updatedAt > 0
    ? `${tripFitContext.leaveDaysRemaining ?? 'your saved'} leave days, ${tripFitContext.budgetBand} budget${tripFitContext.preferredMonth ? `, ${tripFitContext.preferredMonth} preference` : ''}`
    : 'No Trip Fit constraints are saved yet';

  if (lowerPrompt.includes('summarize') || lowerPrompt.includes('style')) {
    return `Sandbox Atlas analysis · ${entries.length} memories across ${countries.length || 'several'} countries.\n\nYour pattern: nature with a story, followed by slow city discovery. ${natureMemory.title} signals that landscapes and effort matter to you; ${cityMemory.title} shows you also remember atmosphere, food and neighbourhood-scale moments.\n\nTravel archetype: Curious Trailblazer — active mornings, culturally rich afternoons, and enough unplanned space for a place to surprise you.\n\nNext step: save Trip Fit constraints so Nexus can turn this pattern into a month, budget band and leave-aware shortlist.`;
  }

  if (lowerPrompt.includes('window') || lowerPrompt.includes('month') || lowerPrompt.includes('leave')) {
    return `Sandbox Atlas analysis · ${entries.length} memories available as context.\n\nTrip Fit status: ${tripContext}.\n\nBest planning shape: a 3–4 day long weekend from Bengaluru. Because you loved ${natureMemory.title}, start with a Western Ghats trail such as Kudremukh or Coorg in a seasonally suitable month.\n\nFit: high for a short nature reset.\nWhy: it repeats the mist, elevation and slow-road signals in your Atlas without needing a full week away.\nTradeoff: monsoon scenery can also mean slippery trails and transport delays; verify local conditions before booking.\n\nNext step: open Trip Fit and add your leave balance, preferred month and budget band.`;
  }

  return `Sandbox Atlas analysis · ${entries.length} memories available as context.\n\nRecommendation: a long-weekend trek around Kudremukh, Karnataka.\n\nFit: High.\nWhy: because you loved ${natureMemory.title}, your Atlas suggests you value elevation, dramatic landscapes and journeys that become stories—not checklist tourism.\nTradeoff: this is relative seasonal guidance, not live weather, pricing or availability. A relaxed coastal alternative would fit better if you want lower physical effort.\n\nWhat I ruled out: another fast city break, because your strongest recent signal is restorative nature.\n\nNext step: open Trip Fit and add your month, leave days and budget to refine this into a practical shortlist.`;
};

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({ isOpen, onClose, entries }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTripFitOpen, setIsTripFitOpen] = useState(false);
  const [tripFitContext, setTripFitContext] = useState<TripFitContext>(() => loadTripFitContext());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKeyConfigured = Boolean(import.meta.env.VITE_OPENAI_API_KEY);
  const suggestions = entries.length > 0
    ? ['Find my best trip window', "Find a hiking trip I'd love", 'Summarize my travel style']
    : ['How should I start my atlas?', 'What makes a great memory pin?'];

  // Initialize chat with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm Nexus, your personal AI travel copilot. I connect your Atlas memories to explain what fits you, what may not, and where you could go next."
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent, promptOverride?: string) => {
    e?.preventDefault();
    const nextPrompt = (promptOverride ?? input).trim();
    if (!nextPrompt || isLoading) return;

    const userMessage = nextPrompt;
    setInput('');

    // Add user message to UI
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build RAG Context from entries
      const contextSummary = entries.map(e =>
        `- Location: ${e.locationName || (e.lat + ',' + e.lng)} | Date: ${new Date(e.date).toLocaleDateString()} | Title: ${e.title} | Notes: ${e.body}`
      ).join('\n');
      const planningContext = tripFitContext.updatedAt > 0
        ? [
            `Home city: ${tripFitContext.homeCity || 'not provided'}`,
            `Leave days remaining: ${tripFitContext.leaveDaysRemaining ?? 'not provided'}`,
            `Budget style: ${tripFitContext.budgetBand}`,
            `Preferred month: ${tripFitContext.preferredMonth || 'not provided'}`,
            `Office/public holiday notes: ${tripFitContext.holidayNotes || 'none provided'}`,
            `Calendar events: ${tripFitContext.calendarEvents.slice(0, 12).map((event) => `${event.start.slice(0, 10)} ${event.summary}`).join('; ') || 'none imported'}`,
          ].join('\n')
        : 'No Trip Fit context has been saved yet.';

      const systemPrompt: ChatMessage = {
        role: 'system',
        content: `You are Nexus, an AI personal travel assistant built into GeoJournal.
Your job is to help the user reflect on their travels, plan new trips, and analyze their spatial memory.
You have access to the user's travel history (their pins). Be conversational, enthusiastic, and insightful.

When the user asks for recommendations:
- Start with "Atlas signal: ${entries.length} ${entries.length === 1 ? 'memory' : 'memories'} analyzed."
- Recommend no more than 3 options.
- Ground every option in a specific signal from their history using "Because you loved..." language.
- For each option, clearly give Fit, Why, and Tradeoff.
- Respect the user's leave balance, preferred month, calendar events, holiday notes, home city, and budget style when that Trip Fit context is available.
- When discussing monthly suitability or budget, describe seasonal patterns and relative cost bands. Do not invent live fares, exact prices, current weather, or availability.
- Briefly say what you ruled out and why, then end with one practical next step.
- Never claim live prices, availability, weather, or booking access because those tools are not connected.

USER'S TRAVEL HISTORY (PIN DATA):
${contextSummary || "User has no travel pins yet."}

USER'S TRIP FIT CONTEXT:
${planningContext}`
      };

      const apiMessages = [systemPrompt, ...newMessages];

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: buildSandboxNexusReply(userMessage, entries, tripFitContext),
        }]);
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: apiMessages,
          reasoning_effort: 'minimal',
          max_completion_tokens: 700,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch AI response');
      }

      const data = await response.json();
      const aiReply = data.choices[0].message.content;

      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);

    } catch (err: any) {
      console.error("Nexus AI Error:", err);
      const locations = entries
        .slice(0, 3)
        .map((entry) => entry.locationName || entry.title)
        .filter(Boolean);
      const fallbackInsight = entries.length > 0
        ? `Fallback insight — live Nexus is temporarily unavailable, but your Atlas already holds ${entries.length} ${entries.length === 1 ? 'memory' : 'memories'}${locations.length ? ` across ${locations.join(', ')}` : ''}. Try comparing the places that felt most energizing with the ones you would revisit slowly.`
        : 'Fallback insight — live Nexus is temporarily unavailable. Start with one meaningful place, add what you noticed there, and Nexus will have context to reflect on once the connection returns.';
      setMessages([...newMessages, {
        role: 'assistant',
        content: fallbackInsight,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-overlay workspace-overlay"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="glass-panel side-panel nexus-panel slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nexus-panel-title"
        style={{
          border: '1px solid rgba(167, 139, 250, 0.3)',
          background: 'rgba(15, 23, 42, 0.85)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '19px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', padding: '8px', borderRadius: '12px' }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <h2 id="nexus-panel-title" style={{ margin: 0, fontSize: '1.16rem', fontWeight: 700, color: 'white' }}>Nexus AI</h2>
              <span style={{ fontSize: '0.72rem', color: '#a78bfa' }}>
                {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'memory' : 'memories'} available as Atlas context` : 'Memory-aware travel copilot'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="nexus-trip-fit-trigger"
              onClick={() => setIsTripFitOpen(true)}
              title="Set leave, budget, month, holidays, and calendar context"
            >
              <CalendarDays size={14} />
              <span>Trip Fit</span>
              {tripFitContext.updatedAt > 0 && <i aria-label="Trip Fit context saved" />}
            </button>
            <span style={{ padding: '4px 8px', borderRadius: '999px', color: apiKeyConfigured ? '#86efac' : '#c4b5fd', background: apiKeyConfigured ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.11)', border: `1px solid ${apiKeyConfigured ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)'}`, fontSize: '0.62rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {apiKeyConfigured ? 'OpenAI configured' : 'Sandbox preview'}
            </span>
          <button aria-label="Close Nexus AI" onClick={onClose} style={{ width: '34px', height: '34px', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
          </div>
        </div>

        {/* Chat Area */}
        <div role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="nexus-synap-proof">
            <span className="nexus-synap-icon"><Database size={16} aria-hidden="true" /></span>
            <div>
              <span>Synap setup status</span>
              <strong>GeoJournal Nexus · Synap B2C instance active</strong>
              <small><ShieldCheck size={12} aria-hidden="true" /> Server bridge and consent controls are the next integration step; this browser does not send private memories to Synap.</small>
            </div>
          </div>
          {entries.length === 0 && (
            <div style={{ padding: '11px 13px', border: '1px solid rgba(96,165,250,0.16)', borderRadius: '12px', color: 'rgba(255,255,255,0.58)', background: 'rgba(59,130,246,0.06)', fontSize: '0.76rem', lineHeight: 1.45 }}>
              <strong style={{ display: 'block', marginBottom: '2px', color: '#bfdbfe' }}>Your Atlas is a blank canvas</strong>
              Capture a memory pin and Nexus will use its place, date, and notes as travel context.
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'linear-gradient(135deg, #a855f7, #6366f1)'
              }}>
                {msg.role === 'user' ? <UserIcon size={16} color="#60a5fa" /> : <Bot size={16} color="white" />}
              </div>

              <div style={{
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopRightRadius: msg.role === 'user' ? 0 : '16px',
                borderTopLeftRadius: msg.role === 'assistant' ? 0 : '16px',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                maxWidth: '85%'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && !isLoading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', paddingLeft: '44px' }}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(undefined, suggestion)}
                  style={{ padding: '7px 10px', borderRadius: '999px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(167,139,250,0.18)', fontSize: '0.69rem' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'row' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)'
              }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ padding: '10px 13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', fontSize: '0.72rem' }}>
                <Loader2 size={18} className="animate-spin" />
                Connecting the dots…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px 18px 18px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(3,7,18,0.18)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nexus about your travels..."
              aria-label="Message Nexus AI"
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '12px 20px',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message to Nexus AI"
              style={{
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: input.trim() && !isLoading ? '#a855f7' : 'rgba(255,255,255,0.1)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                color: 'white',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} style={{ marginLeft: '2px' }} />
            </button>
          </form>
        </div>
      </div>
      <TripFitPanel
        isOpen={isTripFitOpen}
        onClose={() => setIsTripFitOpen(false)}
        onSaved={setTripFitContext}
      />
    </>
  );
};
