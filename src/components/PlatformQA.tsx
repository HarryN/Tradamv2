'use client';

import React, { useMemo, useState } from 'react';
import { askPlatformQuestion } from '@/services/ai-service';
import { MessageSquare, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PlatformQAProps {
  role: 'seller' | 'buyer' | 'admin';
}

export default function PlatformQA({ role }: PlatformQAProps) {
  const { locale, t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const language = useMemo(() => (locale === 'fr' ? 'French' : 'English'), [locale]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError(t('platformQaEmpty') || 'Please enter a question about Tradam.');
      return;
    }

    setLoading(true);
    const userMessage = question.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setQuestion('');
    try {
      const response = await askPlatformQuestion(userMessage, role, language);
      setMessages((prev) => [...prev, { sender: 'ai', text: response }]);
    } catch (err: any) {
      setError(err.message || (t('platformQaError') || 'Unable to answer your question right now.'));
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    seller: 'seller profile & store performance',
    buyer: 'shopping persona & order history',
    admin: 'platform statistics & system oversight'
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-border shadow-xs p-6 md:p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-neutral-text">{t('askTradamAi') || 'Ask Tradam AI'}</h2>
          <p className="text-sm text-neutral-muted mt-1 font-medium">
            {(t('platformQaSub') || 'Get specific answers about your')} {roleLabels[role]}. {(t('platformQaOnly') || 'Only Tradam-related queries are supported.')}
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mb-6 space-y-3">
          {messages.map((m, i) => (
            <div
              key={`${m.sender}-${i}`}
              className={`rounded-3xl border px-5 py-4 text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'border-neutral-border bg-white text-neutral-text'
                  : 'border-neutral-border bg-neutral-bg/60 text-neutral-text'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-neutral-muted mb-2">
                {m.sender === 'user' ? (t('you') || 'You') : (t('tradamAi') || 'Tradam AI')}
              </div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <textarea
            id="platform-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            className="w-full rounded-[2rem] border border-neutral-border px-6 py-5 text-sm font-bold text-neutral-text placeholder-neutral-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-neutral-bg/30 resize-none"
            placeholder={`Ask about ${role === 'admin' ? 'platform growth' : role === 'seller' ? 'store strategies' : 'shopping habits'}...`}
          />
          <div className="absolute bottom-4 right-4 text-[10px] font-black text-neutral-muted uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
            {question.length} chars
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-black text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            {loading ? (t('thinking') || 'Thinking...') : (t('askTradam') || 'Ask Tradam')}
          </button>
          <span className="text-xs text-neutral-muted">{t('platformQaOnlyLine') || 'This assistant only responds to Tradam platform queries.'}</span>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
