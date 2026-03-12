import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { benefits } from '../data/benefitsData';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Intent =
  | 'apply'
  | 'eligibility'
  | 'documents'
  | 'checklist'
  | 'official-link'
  | 'deadline'
  | 'overview'
  | 'unknown';

const SUGGESTED_PROMPTS = [
  'What is MASSGrant?',
  'How do I apply for Pell Grant?',
  'Who qualifies for SNAP?',
  'What documents do I need for MassHealth?',
  'Where is the official MBTA pass link?',
];

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'of',
  'is',
  'are',
  'i',
  'me',
  'my',
  'you',
  'your',
  'about',
  'what',
  'how',
  'do',
  'does',
  'can',
  'where',
  'when',
  'who',
  'tell',
  'more',
  'with',
  'please',
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t && !STOP_WORDS.has(t));
}

function detectIntent(input: string): Intent {
  const text = normalize(input);

  if (
    text.includes('how do i apply') ||
    text.includes('apply') ||
    text.includes('application') ||
    text.includes('start')
  ) {
    return 'apply';
  }

  if (
    text.includes('eligible') ||
    text.includes('eligibility') ||
    text.includes('qualify') ||
    text.includes('qualified') ||
    text.includes('who gets')
  ) {
    return 'eligibility';
  }

  if (
    text.includes('document') ||
    text.includes('documents') ||
    text.includes('paperwork') ||
    text.includes('proof') ||
    text.includes('what do i need')
  ) {
    return 'documents';
  }

  if (
    text.includes('checklist') ||
    text.includes('steps') ||
    text.includes('what should i do first') ||
    text.includes('what do i do first')
  ) {
    return 'checklist';
  }

  if (
    text.includes('official link') ||
    text.includes('website') ||
    text.includes('site') ||
    text.includes('url') ||
    text.includes('link')
  ) {
    return 'official-link';
  }

  if (
    text.includes('deadline') ||
    text.includes('due date') ||
    text.includes('when is it due') ||
    text.includes('when due') ||
    text.includes('when')
  ) {
    return 'deadline';
  }

  if (
    text.includes('what is') ||
    text.includes('tell me about') ||
    text.includes('overview') ||
    text.includes('explain')
  ) {
    return 'overview';
  }

  return 'unknown';
}

function getBenefitAliases(benefitId: string, title: string): string[] {
  const base = [title.toLowerCase(), benefitId.toLowerCase()];

  switch (benefitId) {
    case 'pell-grant':
      return [...base, 'pell', 'federal pell grant', 'pell grant'];
    case 'massgrant':
      return [...base, 'massgrant', 'mass grant', 'massachusetts grant'];
    case 'massgrant-plus':
      return [...base, 'massgrant plus', 'mass grant plus', 'massachusetts grant plus'];
    case 'masshealth':
      return [...base, 'mass health', 'medicaid', 'ma medicaid'];
    case 'mbta-pass':
      return [...base, 'mbta', 'student pass', 'mbta pass', 'transit pass'];
    case 'snap':
      return [...base, 'food stamps', 'snap benefits', 'food assistance'];
    default:
      return base;
  }
}

function scoreBenefit(userInput: string, benefit: (typeof benefits)[number]): number {
  const text = normalize(userInput);
  const tokens = tokenize(userInput);
  const haystack = normalize(
    [
      benefit.id,
      benefit.title,
      benefit.category,
      benefit.description,
      benefit.checklist.join(' '),
    ].join(' ')
  );

  const aliases = getBenefitAliases(benefit.id, benefit.title);

  let score = 0;

  for (const alias of aliases) {
    if (text.includes(alias)) score += 8;
  }

  for (const token of tokens) {
    if (haystack.includes(token)) score += 2;
  }

  if (text.includes(benefit.category.toLowerCase())) score += 2;

  return score;
}

function buildBenefitResponse(
  benefit: (typeof benefits)[number],
  intent: Intent
): string {
  switch (intent) {
    case 'apply':
      return [
        `${benefit.title}:`,
        `To get started, use the official application page: ${benefit.officialUrl}`,
        benefit.checklist.length
          ? `Suggested first steps: ${benefit.checklist.slice(0, 3).join('; ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' ');

    case 'eligibility':
      return [
        `${benefit.title}:`,
        benefit.description,
        `CommonMASS can help screen for likely eligibility, but the final decision comes from the official program or agency.`,
      ].join(' ');

    case 'documents':
      return [
        `${benefit.title}:`,
        benefit.checklist.length
          ? `Based on our checklist, you may need items such as: ${benefit.checklist.join('; ')}.`
          : `Please review the official program page for required documents: ${benefit.officialUrl}`,
      ].join(' ');

    case 'checklist':
      return [
        `${benefit.title} checklist:`,
        benefit.checklist.length
          ? benefit.checklist.map((item, index) => `${index + 1}. ${item}`).join(' ')
          : 'No checklist steps are currently available for this benefit.',
      ].join(' ');

    case 'official-link':
      return `${benefit.title} official link: ${benefit.officialUrl}`;

    case 'deadline':
      return `${benefit.title}: deadlines can vary by program, school, or agency. Please confirm the latest deadline on the official page: ${benefit.officialUrl}`;

    case 'overview':
    case 'unknown':
    default:
      return [
        `${benefit.title}:`,
        benefit.description,
        benefit.checklist.length
          ? `Main steps include: ${benefit.checklist.slice(0, 3).join('; ')}.`
          : '',
        `Official page: ${benefit.officialUrl}`,
      ]
        .filter(Boolean)
        .join(' ');
  }
}

function buildGeneralResponse(input: string): string {
  const text = normalize(input);
  const intent = detectIntent(text);

  if (intent === 'apply') {
    return 'I can help with CommonMASS-listed benefits only. Try asking how to apply for Pell Grant, MASSGrant, MASSGrant Plus, MassHealth, MBTA Student Pass, or SNAP.';
  }

  if (intent === 'eligibility') {
    return 'I can only answer questions about benefits listed in CommonMASS. Try asking who qualifies for Pell Grant, MASSGrant, MassHealth, MBTA Student Pass, or SNAP.';
  }

  if (intent === 'documents') {
    return 'Try asking about documents for a specific benefit, such as MassHealth, SNAP, or Pell Grant.';
  }

  return 'I can only answer questions about CommonMASS-listed benefits. Try asking about Pell Grant, MASSGrant, MASSGrant Plus, MassHealth, MBTA Student Pass, or SNAP.';
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi — I'm the CommonMASS Benefits Assistant. I only answer questions about the benefits listed on this site, such as Pell Grant, MASSGrant, MassHealth, MBTA Student Pass, and SNAP.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = useMemo(() => SUGGESTED_PROMPTS, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const intent = detectIntent(userMessage);

    const scoredBenefits = benefits
      .map((benefit) => ({
        benefit,
        score: scoreBenefit(userMessage, benefit),
      }))
      .sort((a, b) => b.score - a.score);

    const bestMatch = scoredBenefits[0];

    if (bestMatch && bestMatch.score >= 4) {
      return buildBenefitResponse(bestMatch.benefit, intent);
    }

    return buildGeneralResponse(userMessage);
  };

  const submitMessage = (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: generateResponse(trimmed),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  return (
    <div className="w-full max-w-2xl mx-auto border border-gray-300 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-black">Benefits Assistant</h3>
            <p className="text-sm text-gray-600">
              Answers only from CommonMASS benefit content
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(!isMinimized)}
          className="hover:bg-gray-200"
        >
          {isMinimized ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-b border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={scrollRef}
              className="h-96 overflow-y-auto p-4 space-y-4 bg-white"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-gray-700" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-black border border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>

                    {message.role === 'assistant' &&
                      message.content.includes('http') && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Official program link included above
                        </div>
                      )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-300 bg-gray-50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Pell Grant, MassHealth, SNAP, MBTA pass..."
                  className="flex-1 bg-white border-gray-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-[#f97316] text-white hover:bg-[#ea580c]"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}