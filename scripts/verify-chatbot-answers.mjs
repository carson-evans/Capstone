import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_PATH = path.resolve(
  __dirname,
  '..',
  'src',
  'app',
  'data',
  'chatbotKnowledge.generated.json'
);

const BENEFIT_ENTITY_ALIASES = {
  'pell-grant': ['pell', 'pell grant', 'federal pell', 'federal grant'],
  massgrant: ['massgrant', 'mass grant', 'state grant', 'massachusetts state grant'],
  'massgrant-plus': ['massgrant plus', 'mass grant plus', 'massgrant+', 'public university grant'],
  masshealth: ['masshealth', 'medicaid', 'health insurance', 'health connector'],
  snap: ['snap', 'food stamps', 'ebt', 'dta', 'dta connect'],
  'mbta-pass': ['mbta', 't pass', 'student pass', 'semester pass', 'bus pass', 'train pass'],
  fafsa: ['fafsa', 'student aid application', 'financial aid application'],
  masfa: ['masfa', 'massachusetts application for state financial aid'],
};

const INTENT_PATTERNS = {
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

const GOLDEN_QUERIES = [
  {
    query: "Can I still get Pell if I already have a bachelor's degree?",
    expectedRecordId: 'pell-bachelors-eligibility',
    expectedIncludes: ['Usually no', "bachelor's"],
  },
  {
    query: 'What is the FAFSA deadline for 2026-27?',
    expectedRecordId: 'fafsa-deadline-2026-27',
    expectedIncludes: ['June 30, 2027', '2026-27'],
  },
  {
    query: 'Can part-time students get Massachusetts state aid?',
    expectedRecordId: 'part-time-state-aid',
    expectedIncludes: ['Part-Time Grant Program', '6 but fewer than 12'],
  },
  {
    query: 'What documents do I need for SNAP?',
    expectedRecordId: 'snap-documents',
    expectedIncludes: ['identity', 'Massachusetts residency'],
  },
  {
    query: 'Can I manage my SNAP case online after I apply?',
    expectedRecordId: 'snap-manage-case',
    expectedIncludes: ['DTA Connect', 'case status'],
  },
  {
    query: 'How do I report changes to MassHealth?',
    expectedRecordId: 'masshealth-report-changes',
    expectedIncludes: ['10 days', 'report changes'],
  },
  {
    query: 'What is the difference between FAFSA and MASFA?',
    expectedRecordId: 'fafsa-vs-masfa',
    expectedIncludes: ['FAFSA is the federal student aid application', 'only one'],
  },
  {
    query: 'Do parents need their own FAFSA accounts?',
    expectedRecordId: 'fafsa-contributors',
    expectedIncludes: ['own StudentAid.gov account', 'should not be shared'],
  },
  {
    query: 'Can I fix my FAFSA after I submit it?',
    expectedRecordId: 'fafsa-corrections',
    expectedIncludes: ['Make a Correction', 'processed'],
  },
  {
    query: 'How much can Pell cover?',
    expectedRecordId: 'pell-amount-2026-27',
    expectedIncludes: ['$7,395', '2026-27'],
  },
  {
    query: 'How many credits do I need for MASSGrant Plus if my family income is around $90,000?',
    expectedRecordId: 'massgrant-plus-credits',
    expectedIncludes: ['12 credits', '$85,000 and $100,000'],
  },
  {
    query: 'Does MASSGrant work outside Massachusetts?',
    expectedRecordId: 'massgrant-reciprocity',
    expectedIncludes: ['Vermont', 'Pennsylvania'],
  },
  {
    query: 'How do MBTA student passes work at colleges?',
    expectedRecordId: 'mbta-student-pass-overview',
    expectedIncludes: ['institution-based pass programs', 'school participates'],
  },
];

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !COMMON_STOP_WORDS.has(token));
}

function detectBenefits(normalizedQuery) {
  const matches = new Set();

  for (const [benefitId, aliases] of Object.entries(BENEFIT_ENTITY_ALIASES)) {
    if (aliases.some((alias) => normalizedQuery.includes(normalizeText(alias)))) {
      matches.add(benefitId);
    }
  }

  return matches;
}

function detectIntents(normalizedQuery) {
  const matches = new Set();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some((pattern) => normalizedQuery.includes(normalizeText(pattern)))) {
      matches.add(intent);
    }
  }

  return matches;
}

function scoreRecord(record, normalizedQuery, queryTokens, detectedBenefits, detectedIntents) {
  let score = 20;
  const queryAsksAboutCredits =
    normalizedQuery.includes('credit') || normalizedQuery.includes('credits');

  for (const pattern of record.questionPatterns ?? []) {
    const normalizedPattern = normalizeText(pattern);
    if (normalizedQuery === normalizedPattern) {
      score += 48;
    } else if (normalizedQuery.includes(normalizedPattern)) {
      score += 28;
    }
  }

  let aliasHits = 0;
  for (const alias of record.aliases ?? []) {
    if (normalizedQuery.includes(normalizeText(alias))) {
      aliasHits += 1;
    }
  }
  score += Math.min(aliasHits * 10, 30);

  for (const benefitId of record.benefitIds ?? []) {
    if (detectedBenefits.has(benefitId)) {
      score += 16;
    }
  }

  for (const intent of record.intents ?? []) {
    if (detectedIntents.has(intent)) {
      score += 14;
    }
  }

  const recordTokens = new Set(
    tokenize(
      [
        record.topic,
        record.answer,
        ...(record.aliases ?? []),
        ...(record.questionPatterns ?? []),
        ...(record.supportingDetails ?? []),
      ].join(' ')
    )
  );

  let sharedTokens = 0;
  for (const token of queryTokens) {
    if (recordTokens.has(token)) {
      sharedTokens += 1;
    }
  }
  score += Math.min(sharedTokens * 2, 24);

  const normalizedTopic = normalizeText(record.topic ?? '');
  const normalizedAliases = (record.aliases ?? []).map(normalizeText);
  const normalizedPatterns = (record.questionPatterns ?? []).map(normalizeText);

  if (
    queryAsksAboutCredits &&
    (normalizedTopic.includes('credit') ||
      normalizedAliases.some((alias) => alias.includes('credit')) ||
      normalizedPatterns.some((pattern) => pattern.includes('credit')))
  ) {
    score += 22;
  }

  if (record.academicYear && normalizedQuery.includes(normalizeText(record.academicYear))) {
    score += 14;
  }

  return score;
}

async function main() {
  const raw = await readFile(KNOWLEDGE_PATH, 'utf8');
  const records = JSON.parse(raw);

  let hasFailure = false;

  for (const golden of GOLDEN_QUERIES) {
    const normalizedQuery = normalizeText(golden.query);
    const queryTokens = new Set(tokenize(golden.query));
    const detectedBenefits = detectBenefits(normalizedQuery);
    const detectedIntents = detectIntents(normalizedQuery);

    const ranked = records
      .map((record) => ({
        record,
        score: scoreRecord(record, normalizedQuery, queryTokens, detectedBenefits, detectedIntents),
      }))
      .sort((left, right) => right.score - left.score);

    const top = ranked[0]?.record;

    if (!top) {
      hasFailure = true;
      console.error(`FAIL: No result for "${golden.query}"`);
      continue;
    }

    const missingPhrases = golden.expectedIncludes.filter(
      (phrase) => !top.answer.includes(phrase) && !(top.supportingDetails ?? []).some((detail) => detail.includes(phrase))
    );

    if (top.id !== golden.expectedRecordId || missingPhrases.length > 0) {
      hasFailure = true;
      console.error(`FAIL: ${golden.query}`);
      console.error(`  Expected record: ${golden.expectedRecordId}`);
      console.error(`  Actual record:   ${top.id}`);
      if (missingPhrases.length > 0) {
        console.error(`  Missing phrases: ${missingPhrases.join(', ')}`);
      }
      continue;
    }

    console.log(`PASS: ${golden.query} -> ${top.id}`);
  }

  if (hasFailure) {
    process.exitCode = 1;
    return;
  }

  console.log(`Verified ${GOLDEN_QUERIES.length} golden chatbot queries.`);
}

main().catch((error) => {
  console.error('Failed to verify chatbot answers:', error);
  process.exitCode = 1;
});
