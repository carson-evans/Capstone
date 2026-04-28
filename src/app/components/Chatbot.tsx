import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ExternalLink,
  Maximize2,
  Minimize2,
  Send,
  User,
} from 'lucide-react';

import { answerChatbotQuery } from '../lib/chatbot/answerEngine';
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

const RESPONSE_DELAYS_MS = [1000, 1500, 2000, 2500, 3000] as const;

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRandomResponseDelayMs(): number {
  const randomIndex = Math.floor(Math.random() * RESPONSE_DELAYS_MS.length);
  return RESPONSE_DELAYS_MS[randomIndex];
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Assistant is typing">
      <style>
        {`
          @keyframes chatbot-typing-wave {
            0%, 60%, 100% {
              transform: translateY(0) scale(0.92);
              opacity: 0.35;
            }
            30% {
              transform: translateY(-5px) scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
      <span className="sr-only">Benefits Assistant is typing</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className="block h-2.5 w-2.5 shrink-0 rounded-full bg-[#355b8a] dark:bg-sky-300"
          style={{
            animationName: 'chatbot-typing-wave',
            animationDuration: '0.82s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: createId(),
      role: 'assistant',
      content:
        "Hi. I'm the CommonMASS benefits assistant. I answer questions using official benefit program sources plus CommonMASS FAQ guidance.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const replyTimeoutRef = useRef<number | null>(null);
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
  }, [messages, isMinimized, isAssistantTyping]);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        window.clearTimeout(replyTimeoutRef.current);
      }
    };
  }, []);

  const submitMessage = (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isAssistantTyping) {
      return;
    }

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    const assistantReply = answerChatbotQuery(trimmed);

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsAssistantTyping(true);

    if (replyTimeoutRef.current) {
      window.clearTimeout(replyTimeoutRef.current);
    }

    replyTimeoutRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: assistantReply.content,
        },
      ]);
      setIsAssistantTyping(false);
      replyTimeoutRef.current = null;
    }, getRandomResponseDelayMs());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitMessage(input);
  };

  return (
    <section
      role="region"
      aria-labelledby="benefits-assistant-title"
      className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 shadow-[0_32px_90px_-50px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/82 dark:shadow-[0_28px_90px_-46px_rgba(2,6,23,0.96)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent dark:via-slate-200/30"
      />

      <div className="border-b border-slate-200/75 bg-gradient-to-r from-[#f8fafc] via-white to-[#fff7ed] px-5 py-5 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#355b8a] shadow-[0_16px_34px_-22px_rgba(30,58,95,0.9)]">
              <Bot className="h-5 w-5 text-white" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#f97316] dark:border-slate-900" />
            </div>

            <div className="min-w-0">
              <h3
                id="benefits-assistant-title"
                className="text-lg font-bold tracking-tight text-black dark:text-slate-100 sm:text-[1.2rem]"
              >
                Benefits Assistant
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Ask about deadlines, application steps, eligibility rules, and what CommonMASS found for each program.
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
            className="h-11 w-11 shrink-0 rounded-2xl border border-white/60 bg-white/70 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-black dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="border-b border-slate-200/75 bg-white/55 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/35 sm:px-6">
              <p
                id={chatPromptLabelId}
                className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
              >
                Suggested questions
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5" aria-labelledby={chatPromptLabelId}>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    disabled={isAssistantTyping}
                    className="min-h-10 rounded-full border border-slate-200 bg-white/92 px-4 py-2 text-xs font-medium text-slate-700 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:border-[#355b8a] hover:text-[#1e3a5f] focus:outline-none focus:ring-4 focus:ring-[#1e3a5f]/12 disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-700 dark:bg-slate-900/92 dark:text-slate-300 dark:hover:border-sky-300 dark:hover:text-sky-200"
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
              className="h-[28rem] space-y-4 overflow-y-auto bg-gradient-to-b from-[#fff7ed]/55 via-white to-[#f8fafc] px-5 py-5 sm:h-[30rem] sm:px-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className={`flex items-end gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-800/90">
                      <Bot className="h-4 w-4 text-[#355b8a] dark:text-sky-200" aria-hidden="true" />
                    </div>
                  )}

                  <div
                    aria-label={message.role === 'user' ? 'Your message' : 'Assistant message'}
                    className={`max-w-[82%] px-4 py-3.5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.34)] ${
                      message.role === 'user'
                        ? 'rounded-[1.45rem] rounded-br-md bg-gradient-to-br from-[#1e3a5f] to-[#355b8a] text-white'
                        : 'rounded-[1.45rem] rounded-bl-md border border-white/80 bg-white/90 text-black backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/88 dark:text-slate-100'
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
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Links open in a new tab
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f97316] shadow-[0_12px_28px_-20px_rgba(249,115,22,0.9)]">
                      <User className="h-4 w-4 text-white" aria-hidden="true" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isAssistantTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-end gap-3 justify-start"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-800/90">
                    <Bot className="h-4 w-4 text-[#355b8a] dark:text-sky-200" aria-hidden="true" />
                  </div>

                  <div className="max-w-[82%] rounded-[1.45rem] rounded-bl-md border border-white/80 bg-white/90 px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.34)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/88">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-slate-200/75 bg-white/60 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/45 sm:px-6">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <label htmlFor={chatInputId} className="sr-only">
                  Ask the benefits assistant a question
                </label>
                <Input
                  id={chatInputId}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    isAssistantTyping
                      ? 'Benefits Assistant is thinking...'
                      : 'Ask about Pell, FAFSA, SNAP, MassHealth, deadlines, amounts, or eligibility...'
                  }
                  className="h-12 flex-1 rounded-2xl border-slate-200 bg-white/92 px-4 text-sm shadow-[0_12px_28px_-24px_rgba(15,23,42,0.4)] placeholder:text-slate-400 focus:border-[#355b8a] focus:ring-[#355b8a] dark:border-slate-700 dark:bg-slate-950/92 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  aria-label="Send question to benefits assistant"
                  className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#f9a86e] to-[#f97316] p-0 text-white shadow-[0_18px_38px_-20px_rgba(249,115,22,0.78)] transition-transform hover:-translate-y-0.5 hover:from-[#fb923c] hover:to-[#ea580c] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={!input.trim() || isAssistantTyping}
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
