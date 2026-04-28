import { faqData } from '../../data/faqData';
import {
  chatbotKnowledge,
  type ChatbotIntent,
  type ChatbotKnowledgeRecord,
} from '../../data/chatbotKnowledge';

type ChatbotAnswerConfidence = 'high' | 'medium' | 'low';

export interface ChatbotAnswerCitation {
  label: string;
  url: string;
}

export interface ChatbotAnswer {
  answerText: string;
  secondaryPoints: string[];
  citations: ChatbotAnswerCitation[];
  confidence: ChatbotAnswerConfidence;
  matchedTopics: string[];
  content: string;
}

type SourceKind = 'curated' | 'faq';

type UnifiedChatbotRecord = ChatbotKnowledgeRecord & {
  sourceKind: SourceKind;
  kindBoost: number;
  normalizedTopic: string;
  normalizedAliases: string[];
  normalizedQuestionPatterns: string[];
  tokens: Set<string>;
  corpus: string;
};

const BENEFIT_ENTITY_ALIASES: Record<string, string[]> = {
  'pell-grant': ['pell', 'pell grant', 'federal pell', 'federal grant'],
  massgrant: ['massgrant', 'mass grant', 'state grant', 'massachusetts state grant'],
  'massgrant-plus': ['massgrant plus', 'mass grant plus', 'massgrant+', 'public university grant'],
  masshealth: ['masshealth', 'medicaid', 'health insurance', 'health connector'],
  snap: ['snap', 'food stamps', 'ebt', 'dta', 'dta connect'],
  'mbta-pass': ['mbta', 't pass', 'student pass', 'semester pass', 'bus pass', 'train pass'],
  fafsa: ['fafsa', 'student aid application', 'financial aid application'],
  masfa: ['masfa', 'massachusetts application for state financial aid'],
};

const INTENT_PATTERNS: Record<ChatbotIntent, string[]> = {
  'what-is': ['what is', 'what are', 'explain', 'tell me about'],
  apply: ['apply', 'start', 'fill out', 'complete', 'sign up'],
  deadline: ['deadline', 'due date', 'when is it due', 'when is fafsa due', 'priority consideration'],
  eligibility: ['eligible', 'qualify', 'can i get', 'can i still get', 'who can get', 'requirements'],
  amount: ['how much', 'maximum', 'amount', 'award', 'cover', 'cost'],
  documents: ['documents', 'paperwork', 'verification', 'verify', 'what do i need', 'checklist'],
  status: ['status', 'check', 'manage', 'online', 'account', 'case', 'portal', 'track'],
  difference: ['difference', 'vs', 'versus', 'compare'],
  'renew-report-change': ['renew', 'report changes', 'report change', 'update information'],
  'after-submit': ['after submit', 'after i submit', 'next step', 'what happens after', 'correction'],
  'part-time': ['part-time', 'part time', '6 credits', 'less than 12 credits', 'half time'],
};

const COMMON_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'be',
  'can',
  'do',
  'for',
  'from',
  'get',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'the',
  'to',
  'what',
  'when',
  'where',
  'who',
  'with',
  'you',
  'your',
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !COMMON_STOP_WORDS.has(token));
}

function inferIntentsFromText(text: string): ChatbotIntent[] {
  const normalized = normalizeText(text);
  const intents = new Set<ChatbotIntent>();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [
    ChatbotIntent,
    string[],
  ][]) {
    if (patterns.some((pattern) => normalized.includes(normalizeText(pattern)))) {
      intents.add(intent);
    }
  }

  if (normalized.startsWith('what is') || normalized.startsWith('what are')) {
    intents.add('what-is');
  }

  return Array.from(intents);
}

function buildUnifiedRecord(
  record: ChatbotKnowledgeRecord,
  sourceKind: SourceKind,
  kindBoost: number
): UnifiedChatbotRecord {
  const corpus = [
    record.topic,
    record.answer,
    ...record.aliases,
    ...record.questionPatterns,
    ...record.supportingDetails,
  ].join(' ');

  return {
    ...record,
    sourceKind,
    kindBoost,
    normalizedTopic: normalizeText(record.topic),
    normalizedAliases: record.aliases.map(normalizeText),
    normalizedQuestionPatterns: record.questionPatterns.map(normalizeText),
    tokens: new Set(tokenize(corpus)),
    corpus,
  };
}

const FAQ_FALLBACK_RECORDS: UnifiedChatbotRecord[] = faqData.map((faq) =>
  buildUnifiedRecord(
    {
      id: `faq-${faq.id}`,
      benefitIds: faq.relatedBenefitIds ?? [],
      topic: faq.question,
      intents: inferIntentsFromText(`${faq.question} ${faq.answer} ${faq.keywords.join(' ')}`),
      aliases: faq.keywords,
      questionPatterns: [faq.question],
      answer: faq.answer,
      supportingDetails: [],
      officialUrl: faq.officialUrl ?? 'https://commonmass.org/faq',
      officialLabel: faq.officialUrl ? 'Open official page' : 'Open FAQ page',
      sourceUrl: faq.officialUrl ?? 'https://commonmass.org/faq',
      sourceTitle: 'CommonMASS FAQ data',
      effectiveDate: null,
      academicYear: null,
      timeSensitive: false,
    },
    'faq',
    8
  )
);

const CURATED_RECORDS: UnifiedChatbotRecord[] = chatbotKnowledge.map((record) =>
  buildUnifiedRecord(record, 'curated', 20)
);

const ALL_RECORDS: UnifiedChatbotRecord[] = [...CURATED_RECORDS, ...FAQ_FALLBACK_RECORDS];

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

function detectBenefitEntities(normalizedQuery: string): Set<string> {
  const matches = new Set<string>();

  for (const [entityId, aliases] of Object.entries(BENEFIT_ENTITY_ALIASES)) {
    if (aliases.some((alias) => normalizedQuery.includes(normalizeText(alias)))) {
      matches.add(entityId);
    }
  }

  return matches;
}

function detectIntents(normalizedQuery: string): Set<ChatbotIntent> {
  return new Set(inferIntentsFromText(normalizedQuery));
}

function countSharedTokens(left: Set<string>, right: Set<string>): number {
  let count = 0;

  for (const token of left) {
    if (right.has(token)) {
      count += 1;
    }
  }

  return count;
}

function extractAcademicYearSignals(normalizedQuery: string): Set<string> {
  const matches = normalizedQuery.match(/\b20\d{2}(?:-\d{2}|\s\d{2})?\b/g) ?? [];
  return new Set(matches.map((match) => match.replace(/\s+/g, '-')));
}

function deriveDefaultCitationLabel(
  record: UnifiedChatbotRecord,
  detectedIntents: Set<ChatbotIntent>
): string {
  if (record.officialLabel) {
    return record.officialLabel;
  }

  if (detectedIntents.has('apply')) {
    return 'Open official application page';
  }

  if (detectedIntents.has('documents')) {
    return 'Open official document checklist';
  }

  if (detectedIntents.has('deadline') || detectedIntents.has('eligibility')) {
    return 'Open official source';
  }

  return 'Open official page';
}

function buildCitations(
  record: UnifiedChatbotRecord,
  detectedIntents: Set<ChatbotIntent>
): ChatbotAnswerCitation[] {
  const citations: ChatbotAnswerCitation[] = [
    {
      label: deriveDefaultCitationLabel(record, detectedIntents),
      url: record.officialUrl,
    },
  ];

  if (record.sourceUrl && record.sourceUrl !== record.officialUrl) {
    citations.push({
      label: 'View source details',
      url: record.sourceUrl,
    });
  }

  const seenUrls = new Set<string>();
  return citations.filter((citation) => {
    if (!citation.url || seenUrls.has(citation.url)) {
      return false;
    }

    seenUrls.add(citation.url);
    return true;
  });
}

type QueryContext = {
  normalizedQuery: string;
  queryTokens: Set<string>;
  detectedBenefits: Set<string>;
  detectedIntents: Set<ChatbotIntent>;
  academicYearSignals: Set<string>;
};

function scoreRecord(record: UnifiedChatbotRecord, context: QueryContext): number {
  let score = record.kindBoost;
  const queryAsksAboutCredits =
    context.normalizedQuery.includes('credit') || context.normalizedQuery.includes('credits');

  for (const pattern of record.normalizedQuestionPatterns) {
    if (!pattern) {
      continue;
    }

    if (context.normalizedQuery === pattern) {
      score += 48;
    } else if (context.normalizedQuery.includes(pattern)) {
      score += 28;
    }
  }

  let aliasHits = 0;
  for (const alias of record.normalizedAliases) {
    if (!alias) {
      continue;
    }

    if (context.normalizedQuery.includes(alias)) {
      aliasHits += 1;
    }
  }
  score += Math.min(aliasHits * 10, 30);

  let benefitHits = 0;
  for (const benefitId of record.benefitIds) {
    if (context.detectedBenefits.has(benefitId)) {
      benefitHits += 1;
    }
  }
  score += benefitHits * 16;

  let intentHits = 0;
  for (const intent of record.intents) {
    if (context.detectedIntents.has(intent)) {
      intentHits += 1;
    }
  }
  score += intentHits * 14;

  if (
    record.normalizedTopic &&
    (context.normalizedQuery.includes(record.normalizedTopic) ||
      record.normalizedTopic.includes(context.normalizedQuery))
  ) {
    score += 10;
  }

  if (
    queryAsksAboutCredits &&
    (record.normalizedTopic.includes('credit') ||
      record.normalizedAliases.some((alias) => alias.includes('credit')) ||
      record.normalizedQuestionPatterns.some((pattern) => pattern.includes('credit')))
  ) {
    score += 22;
  }

  const sharedTokens = countSharedTokens(context.queryTokens, record.tokens);
  score += Math.min(sharedTokens * 2, 24);

  if (
    record.academicYear &&
    (context.academicYearSignals.has(record.academicYear) ||
      context.normalizedQuery.includes(normalizeText(record.academicYear)))
  ) {
    score += 14;
  }

  if (
    record.timeSensitive &&
    (context.detectedIntents.has('deadline') || context.detectedIntents.has('amount'))
  ) {
    score += 5;
  }

  if (context.detectedIntents.has('difference') && record.intents.includes('difference')) {
    score += 18;
  }

  if (context.detectedIntents.has('part-time') && record.intents.includes('part-time')) {
    score += 12;
  }

  return score;
}

function dedupeMatchedTopics(records: UnifiedChatbotRecord[]): string[] {
  return Array.from(new Set(records.map((record) => record.topic)));
}

function buildContent(
  answerText: string,
  secondaryPoints: string[],
  citations: ChatbotAnswerCitation[]
): string {
  const sections = [answerText];

  if (secondaryPoints.length > 0) {
    sections.push(secondaryPoints.map((point) => `- ${point}`).join('\n'));
  }

  if (citations.length > 0) {
    sections.push(citations.map((citation) => `[${citation.label}](${citation.url})`).join('\n'));
  }

  return sections.join('\n\n');
}

function buildLowConfidenceAnswer(
  rankedRecords: UnifiedChatbotRecord[],
  context: QueryContext
): ChatbotAnswer {
  const fallbackRecords = rankedRecords.slice(0, 2);
  const citations = fallbackRecords.flatMap((record) => buildCitations(record, context.detectedIntents));
  const seenUrls = new Set<string>();
  const uniqueCitations = citations.filter((citation) => {
    if (seenUrls.has(citation.url)) {
      return false;
    }

    seenUrls.add(citation.url);
    return true;
  });
  const secondaryPoints = fallbackRecords.map(
    (record) => `${record.topic}: ${record.answer}`
  );
  const answerText =
    'Here are the most relevant official topics I found for that question.';

  return {
    answerText,
    secondaryPoints,
    citations: uniqueCitations,
    confidence: 'low',
    matchedTopics: dedupeMatchedTopics(fallbackRecords),
    content: buildContent(answerText, secondaryPoints, uniqueCitations),
  };
}

function buildPrimaryAnswer(
  rankedRecords: UnifiedChatbotRecord[],
  context: QueryContext
): ChatbotAnswer {
  const [topRecord] = rankedRecords;
  const citations = buildCitations(topRecord, context.detectedIntents);
  const secondaryPoints = topRecord.supportingDetails.slice(0, 2);
  const topScore = scoreRecord(topRecord, context);

  const confidence: ChatbotAnswerConfidence =
    topScore >= 82 ? 'high' : topScore >= 52 ? 'medium' : 'low';

  return {
    answerText: topRecord.answer,
    secondaryPoints,
    citations,
    confidence,
    matchedTopics: dedupeMatchedTopics(rankedRecords.slice(0, 3)),
    content: buildContent(topRecord.answer, secondaryPoints, citations),
  };
}

export function answerChatbotQuery(rawQuery: string): ChatbotAnswer {
  if (isGreeting(rawQuery)) {
    const answerText =
      'Hi. I can help with Pell, FAFSA, MASFA, MASSGrant, MASSGrant Plus, SNAP, MassHealth, and MBTA student pass questions using official program information and CommonMASS FAQ guidance.';

    return {
      answerText,
      secondaryPoints: [],
      citations: [],
      confidence: 'high',
      matchedTopics: [],
      content: answerText,
    };
  }

  if (isThanks(rawQuery)) {
    const answerText = "You're welcome.";

    return {
      answerText,
      secondaryPoints: [],
      citations: [],
      confidence: 'high',
      matchedTopics: [],
      content: answerText,
    };
  }

  const normalizedQuery = normalizeText(rawQuery);
  const context: QueryContext = {
    normalizedQuery,
    queryTokens: new Set(tokenize(rawQuery)),
    detectedBenefits: detectBenefitEntities(normalizedQuery),
    detectedIntents: detectIntents(normalizedQuery),
    academicYearSignals: extractAcademicYearSignals(normalizedQuery),
  };

  const rankedRecords = ALL_RECORDS.map((record) => ({
    record,
    score: scoreRecord(record, context),
  }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ record }) => record);

  if (rankedRecords.length === 0) {
    return {
      answerText:
        "I couldn't find a supported answer for that yet. Try asking about FAFSA, MASFA, Pell, MASSGrant, MASSGrant Plus, SNAP, MassHealth, or the MBTA student pass.",
      secondaryPoints: [
        'Examples: FAFSA deadlines, SNAP documents, Pell eligibility, or how to report MassHealth changes.',
      ],
      citations: [],
      confidence: 'low',
      matchedTopics: [],
      content:
        "I couldn't find a supported answer for that yet. Try asking about FAFSA, MASFA, Pell, MASSGrant, MASSGrant Plus, SNAP, MassHealth, or the MBTA student pass.\n\n- Examples: FAFSA deadlines, SNAP documents, Pell eligibility, or how to report MassHealth changes.",
    };
  }

  const primaryAnswer = buildPrimaryAnswer(rankedRecords, context);
  return primaryAnswer.confidence === 'low'
    ? buildLowConfidenceAnswer(rankedRecords, context)
    : primaryAnswer;
}
