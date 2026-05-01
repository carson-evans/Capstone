import chatbotKnowledgeJson from './chatbotKnowledge.generated.json';

export const CHATBOT_INTENTS = [
  'what-is',
  'apply',
  'deadline',
  'eligibility',
  'amount',
  'documents',
  'status',
  'difference',
  'renew-report-change',
  'after-submit',
  'part-time',
] as const;

export type ChatbotIntent = (typeof CHATBOT_INTENTS)[number];

export interface ChatbotKnowledgeRecord {
  id: string;
  benefitIds: string[];
  topic: string;
  intents: ChatbotIntent[];
  aliases: string[];
  questionPatterns: string[];
  answer: string;
  supportingDetails: string[];
  officialUrl: string;
  officialLabel?: string;
  sourceUrl: string;
  sourceTitle: string;
  effectiveDate: string | null;
  academicYear: string | null;
  timeSensitive: boolean;
}

export const chatbotKnowledge = chatbotKnowledgeJson as ChatbotKnowledgeRecord[];
