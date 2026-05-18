import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';

const AGENT_OPTIONS = [
  { value: 'TRIP_PLANNER', label: 'Planificador de viajes' },
  { value: 'FLIGHT_HUNTER', label: 'Cazador de vuelos' },
  { value: 'LOCAL_GUIDE', label: 'Guía local' },
  { value: 'BUDGET_ADVISOR', label: 'Asesor de presupuesto' },
] as const;

type AgentType = (typeof AGENT_OPTIONS)[number]['value'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AiAgentsPage() {
  const [agentType, setAgentType] = useState<AgentType>('TRIP_PLANNER');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const send = useMutation({
    mutationFn: async (message: string) => {
      const res = await api.post<{ conversationId: string; reply: string }>('/ai/messages', {
        agentType,
        conversationId,
        message,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    },
  });

  const onSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    send.mutate(text);
    setInput('');
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asistente IA</h1>
          <p className="text-slate-500">Habla con un agente especializado.</p>
        </div>
        <select
          className="input max-w-xs"
          value={agentType}
          onChange={(e) => {
            setAgentType(e.target.value as AgentType);
            setConversationId(undefined);
            setMessages([]);
          }}
        >
          {AGENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </header>

      <div className="card flex-1 overflow-y-auto space-y-3 min-h-[300px]">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Inicia la conversación con una pregunta…</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[80%] rounded-lg bg-brand-600 text-white px-3 py-2 text-sm'
                : 'mr-auto max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm whitespace-pre-wrap'
            }
          >
            {m.content}
          </div>
        ))}
        {send.isPending && (
          <div className="mr-auto max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
            Pensando…
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Escribe tu mensaje…"
        />
        <button onClick={onSend} className="btn-primary" disabled={send.isPending}>
          <Send size={16} /> Enviar
        </button>
      </div>
    </div>
  );
}
