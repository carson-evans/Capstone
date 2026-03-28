import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  ExternalLink,
  Maximize2,
  Minimize2,
  Send,
  User,
} from 'lucide-react';

import { benefits, type Benefit } from '../data/benefitsData';
import { faqData, type FAQItem } from '../data/faqData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { renderLinkedText } from './ui/render-linked-text';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED_PROMPTS = [
  'How much can Pell Grant cover?',
  'What is the FAFSA deadline?',
  'Can part-time students still get aid?',
  'How do I apply for MassHealth?',
  'How does SNAP work for college students?',
  'What is the MBTA student pass?',
] as const;

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean);
}

function scoreText(query: string, corpus: string): number {
  const queryTokens = tokenize(query);
  const normalizedCorpus = normalizeText(corpus);

  let score = 0;

  for (const token of queryTokens) {
    if (normalizedCorpus.includes(token)) {
      score += 1;
    }
  }

  return score;
}

function findBestFaq(query: string): FAQItem | null {
  let best: FAQItem | null = null;
  let bestScore = 0;

  for (const faq of faqData) {
    const corpus = `${faq.question} ${faq.answer} ${faq.keywords.join(' ')}`;
    const score = scoreText(query, corpus);

    if (score > bestScore) {
      best = faq;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}

function findBestBenefit(query: string): Benefit | null {
  let best: Benefit | null = null;
  let bestScore = 0;

  for (const benefit of benefits) {
    const corpus = `${benefit.id} ${benefit.title} ${benefit.description} ${benefit.details} ${benefit.category}`;
    const score = scoreText(query, corpus);

    if (score > bestScore) {
      best = benefit;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}

function isGreeting(query: string): boolean {
  const normalized = normalizeText(query);
  return ['hi', 'hello', 'hey', 'good morning', 'good afternoon'].some((phrase) =>
    normalized.includes(phrase)
  );
}

function isThanks(query: string): boolean {
  const normalized = normalizeText(query);
  return ['thanks', 'thank you', 'thx'].some((phrase) => normalized.includes(phrase));
}

function buildAssistantReply(query: string): string {
  if (isGreeting(query)) {
    return 'Hi. I can help with Pell Grant, MASSGrant, MASSGrant Plus, SNAP, MassHealth, MBTA student discounts, FAFSA, and MASFA.';
  }

  if (isThanks(query)) {
    return 'You’re welcome.';
  }

  const faqMatch = findBestFaq(query);
  if (faqMatch) {
    return `${faqMatch.answer}${
      faqMatch.officialUrl ? `\n\n[Open the official page](${faqMatch.officialUrl})` : ''
    }`;
  }

  const benefitMatch = findBestBenefit(query);
  if (benefitMatch) {
    return `${benefitMatch.title}\n\n${benefitMatch.details}${
      benefitMatch.officialUrl ? `\n\n[Visit the official site](${benefitMatch.officialUrl})` : ''
    }`;
  }

  return [
    'I can help with questions about Pell Grant, FAFSA, MASSGrant, MASSGrant Plus, SNAP, MassHealth, and MBTA student discounts.',
    '',
    'Try asking one of these:',
    '- What is the FAFSA deadline?',
    '- Can college students qualify for SNAP?',
    '- How do I apply for MassHealth?',
    '- What is MASSGrant Plus?',
  ].join('\n');
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: createId(),
      role: 'assistant',
      content:
        'Hi. I’m the CommonMASS benefits assistant. I answer questions using the site’s benefit and FAQ content.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatLogId = useId();
  const chatInputId = useId();
  const chatPromptLabelId = useId();

  const quickPrompts = useMemo(() => [...SUGGESTED_PROMPTS], []);

  useEffect(() => {
    if (!scrollRef.current || isMinimized) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isMinimized]);

  const submitMessage = (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    const assistantMessage: Message = {
      id: createId(),
      role: 'assistant',
      content: buildAssistantReply(trimmed),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(input);
  };

  return (
    <section
      role="region"
      aria-labelledby="benefits-assistant-title"
      className="mx-auto w-full max-w-2xl rounded-lg border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_28px_80px_-44px_rgba(2,6,23,0.98)]"
    >
      <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f]">
            <Bot className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 id="benefits-assistant-title" className="font-bold text-black dark:text-slate-100">
              Benefits Assistant
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Grounded in CommonMASS benefit and FAQ content
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized((current) => !current)}
          aria-expanded={!isMinimized}
          aria-controls={chatLogId}
          aria-label={isMinimized ? 'Expand benefits assistant' : 'Minimize benefits assistant'}
          className="h-10 w-10 hover:bg-gray-200 dark:hover:bg-slate-800"
        >
          {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/70">
              <p
                id={chatPromptLabelId}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Suggested questions
              </p>
              <div className="mt-2 flex flex-wrap gap-2" aria-labelledby={chatPromptLabelId}>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    className="min-h-10 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f] focus:outline-none focus:ring-4 focus:ring-[#1e3a5f]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-300 dark:hover:text-sky-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div
              id={chatLogId}
              ref={scrollRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label="Benefits assistant conversation"
              className="h-96 space-y-4 overflow-y-auto bg-white p-4 dark:bg-slate-900"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800">
                      <Bot className="h-4 w-4 text-gray-700 dark:text-slate-200" aria-hidden="true" />
                    </div>
                  )}

                  <div
                    aria-label={message.role === 'user' ? 'Your message' : 'Assistant message'}
                    className={`max-w-[78%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'border border-gray-200 bg-gray-100 text-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className="space-y-3">
                      {renderLinkedText(message.content, {
                        paragraphClassName: 'text-sm leading-relaxed',
                        linkClassName:
                          message.role === 'user'
                            ? 'text-white underline underline-offset-4 hover:text-white/90'
                            : 'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
                      })}
                    </div>

                    {message.role === 'assistant' && message.content.includes('http') && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Links open in a new tab
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f97316]">
                      <User className="h-4 w-4 text-white" aria-hidden="true" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-950/80">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <label htmlFor={chatInputId} className="sr-only">
                  Ask the benefits assistant a question
                </label>
                <Input
                  id={chatInputId}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about Pell, FAFSA, SNAP, MassHealth, deadlines, amounts, or eligibility..."
                  className="flex-1 border-gray-300 bg-white focus:border-[#1e3a5f] focus:ring-[#1e3a5f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  aria-label="Send question to benefits assistant"
                  className="h-10 w-10 bg-[#f97316] p-0 text-white hover:bg-[#ea580c]"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Chatbot;