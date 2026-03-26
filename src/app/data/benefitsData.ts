import { Value } from "@radix-ui/react-select";

export interface Benefit {
  id: string;
  title: string;
  description: string;
  details: string;
  category: string;
  checklist: string[];
  officialUrl: string;
  officialButtonLabel?: string;
  actionStatus?: string;
}

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  options?: QuestionOption[];
  category: string;
  control?: 'radio' | 'select' | 'number';
  placeholder?: string;
  helperText?: string;
  getText?: (answers: BenefitProfile) => string;
  getHelperText?: (answers: BenefitProfile) => string;
  validate?: (value: string, answers: BenefitProfile) => string | null;
  conditions?: {
    questionId: string;
    values: string[];
  }[];
  isVisible?: (answers: BenefitProfile) => boolean;
  benefitIds?: string[];
}

const yesNoOptions: QuestionOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const studentOrFutureValues = ['full_time', 'part_time', 'future_full_time', 'future_part_time'];

const householdSizeOptions: QuestionOption[] = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9 or more', value: '9_plus' },
];

const residencyLengthOptions: QuestionOption[] = [
  { label: 'Not a Massachusetts resident', value: 'not_ma_resident' },
  { label: 'Less than 12 months', value: 'under_12_months' },
  { label: '12 months or more', value: 'one_to_five_years' },
];


const massGrantPlusIncomeBandOptions: QuestionOption[] = [
  { label: 'Less than $85,000 per year before taxes', value: 'under_85k' },
  { label: '$85,000 to $100,000 per year before taxes', value: '85k_to_100k' },
  { label: 'More than $100,000 per year before taxes', value: 'over_100k' },
];


function hasMassachusettsResidency(answers: BenefitProfile): boolean {
  const residencyLength = answers['residency_length'];
  return Boolean(residencyLength) && residencyLength !== 'not_ma_resident';
}

function hasQualifyingGrantResidency(answers: BenefitProfile): boolean {
  const residencyLength = answers['residency_length'];
  return Boolean(residencyLength) && residencyLength !== 'not_ma_resident' && residencyLength !== 'under_12_months';
}

function shouldAskPriorBachelorsDegree(answers: BenefitProfile): boolean {
  if (!hasQualifyingGrantResidency(answers)) {
    return false;
  }

  if (answers['student_status'] === 'full_time' || answers['student_status'] === 'future_full_time') {
    return true;
  }

  return (
    isMassGrantPlusEligibleSchool(answers['school_name']) &&
    getEffectiveMassGrantPlusIncomeBand(answers) === 'under_85k'
  );
}

function isFutureStudent(answers: BenefitProfile): boolean {
  return answers['student_status'] === 'future_full_time' || answers['student_status'] === 'future_part_time';
}

function getAttendancePromptPrefix(answers: BenefitProfile): 'Do you' | 'Will you' {
  return isFutureStudent(answers) ? 'Will you' : 'Do you';
}

function getIncomeQuestionTextSegments(
  program: 'snap' | 'masshealth',
  answers: BenefitProfile
): InlineTextSegment[] {
  const householdSize = getExactHouseholdSize(answers);
  const threshold = getIncomeThreshold(program, answers);

  if (!householdSize || threshold === null) {
    return [{ type: 'text', text: 'Income threshold unavailable for this household size.' }];
  }

  const unitLabel = program === 'snap' ? 'monthly' : 'yearly';

  return [
    { type: 'text', text: `Is your household of ${householdSize}'s ${unitLabel} ` },
    { type: 'tooltip', text: 'gross income', tooltip: grossIncomeTooltip },
    { type: 'text', text: ` less than ${formatCurrency(threshold)}?` },
  ];
}

export const benefits: Benefit[] = [
  {
    id: 'pell-grant',
    title: 'Federal Pell Grant',
    description: 'A subsidy the U.S. federal government provides for students who need it to pay for college.',
    details:
      'The Pell Grant is federal gift aid, which means it usually does not need to be repaid. Your school determines the final amount based on your FAFSA information, enrollment status, and cost of attendance. You can start and manage the form through [StudentAid.gov](https://studentaid.gov/h/apply-for-aid/fafsa).',
    category: 'Education',
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Create an FSA ID',
      'Gather tax documents',
      'Complete the FAFSA form',
      'Review your Student Aid Report (SAR)',
    ],
  },
  {
    id: 'massgrant',
    title: 'MASSGrant',
    description: 'Need-based grant for Massachusetts residents attending college in-state. Awards range from $300 to $1,900 per year.',
    details:
      'MASSGrant is state financial aid for eligible Massachusetts residents enrolled at approved in-state colleges. Schools typically use your FAFSA information to review eligibility, so it is important to complete the federal form and follow any requests from your financial aid office. You can review the application entry point through [StudentAid.gov](https://studentaid.gov/h/apply-for-aid/fafsa).',
    category: 'Education',
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Complete the FAFSA',
      'Be a Massachusetts resident',
      'Enroll in a Massachusetts college',
      'Maintain satisfactory academic progress',
      'Check award notification from your school',
    ],
  },
  {
    id: 'massgrant-plus',
    title: 'MASSGrant Plus',
    description: 'State grant that can reduce tuition and fees for eligible Massachusetts residents at participating public institutions.',
    details:
      'This screener treats MASSGrant Plus as requiring Massachusetts residency for at least 12 months for reasons other than education before the academic year, attendance at a participating MASSGrant Plus school, at least 6 credits when family income is below $85,000, at least 12 credits when family income is $85,000 to $100,000, and no prior bachelor\'s degree. Keep your FAFSA and school records current through [StudentAid.gov](https://studentaid.gov/h/apply-for-aid/fafsa).',
    category: 'Education',
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Complete the FAFSA',
      'Be a Massachusetts resident for at least 12 months for reasons other than education',
      'Attend a participating MASSGrant Plus school',
      'Not already hold a bachelor\'s degree',
      'Review eligibility with your financial aid office',
    ],
  },
  {
    id: 'masshealth',
    title: 'MassHealth',
    description: 'Massachusetts Medicaid and CHIP program providing comprehensive health coverage for eligible residents.',
    details:
      'MassHealth provides low-cost or no-cost health coverage for eligible Massachusetts residents. Many applicants complete the process through the [Massachusetts Health Connector](https://www.mahix.org/individual/), where you may also be routed to the correct MassHealth program based on your household and income information.',
    category: 'Health',
    officialUrl: 'https://www.mahix.org/individual/',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Verify Massachusetts residency',
      'Gather income documentation',
      'Collect proof of identity and citizenship',
      'Apply online at MAhealthconnector.org',
      'Choose a MassHealth plan',
    ],
  },
  {
    id: 'mbta-pass',
    title: 'MBTA Student Pass',
    description: 'Discounted monthly passes for full-time students using MBTA services in the Greater Boston area.',
    details:
      'The MBTA student pass is usually coordinated through participating colleges, not just through an individual checkout page. Your school may have its own process or transportation office instructions, so check the [official MBTA student pass page](https://www.mbta.com/fares/college-student-semester-passes) and confirm the steps your campus requires.',
    category: 'Transport',
    officialUrl: 'https://www.mbta.com/fares/college-student-semester-passes',
    officialButtonLabel: 'Visit Official Site',
    checklist: [
      'Get current student ID',
      'Verify full-time enrollment status',
      'Visit school\'s transportation office or MBTA.com',
      'Purchase discounted semester or monthly pass',
      'Carry student ID when using pass',
    ],
  },
  {
    id: 'snap',
    title: 'SNAP (Food Stamps)',
    description: 'Provides food purchasing assistance for low- and no-income people.',
    details:
      'SNAP can help eligible students and households pay for groceries, but college students sometimes need to meet extra student-specific rules. In Massachusetts, applications and case updates are commonly handled through [DTA Connect](https://dtaconnect.eohhs.mass.gov/), where you can submit documents, check notices, and track your case.',
    category: 'Food',
    officialUrl: 'https://dtaconnect.eohhs.mass.gov/',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Check student eligibility requirements',
      'Gather proof of enrollment',
      'Gather proof of income',
      'Submit application through state portal',
    ],
  },
];


export const questions: Question[] = [
  {
    id: 'student_status',
    text: 'Are you currently enrolled in a college or university?',
    category: 'General',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus', 'snap', 'mbta-pass'],
    options: [
      { label: 'Yes, full-time', value: 'full_time' },
      { label: 'Yes, part-time', value: 'part_time' },
      { label: 'I will be enrolled within the next year', value: 'future' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'age',
    text: 'Choose your age group?',
    category: 'General',
    options: [
      { label: 'Under 18', value: 'low' },
      { label: '18 to 64', value: 'medium' },
      { label: 'Over 64', value: 'high' },
    ],
  },

  {
    id: 'citizen_status',
    text: 'Are you a U.S. citizen or an eligible non-citizen?',
    category: 'General',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus', 'snap', 'masshealth', 'mbta-pass'],
    options: yesNoOptions,
  },
  {
    id: 'residency_length',
    text: 'Which best describes your Massachusetts residency status?',
    category: 'General',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus', 'snap', 'masshealth', 'mbta-pass'],
    options: residencyLengthOptions,
  },

  {
    id: 'residency_length',
    text: 'How many years have you lived in MA?',
    category: 'General',
    conditions: [
      {
      questionId : 'ma_resident',
      values: ['yes']
      }
    ],
    options: [
      { label: 'Less than 5 years', value: 'low' },
      { label: '5 - 10 years', value: 'medium' },
      { label: 'More than 10 years', value: 'high' },
    ],
  },
  {
    id: 'fafsa_completed',
    text: 'Have you completed the FAFSA for the current academic year?',
    category: 'Financial',
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
      {
        questionId: 'ma_resident',
        values: ['yes'],
      },
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time', 'future'],
      },
    ],
    options: yesNoOptions,
  },

  {
  id: 'efc_level',
  text: 'What is your Expected Family Contribution (EFC) from FAFSA?',
  category: 'Financial',
  conditions: [
    {
        questionId: 'student_status',
        values: ['full_time', 'part_time', 'future'],
      },
  ],
  options: [
    { label: '$0', value: 'zero' },
    { label: 'Above $0', value: '1' },
  ],
},

{
  id: 'mbta-uni',
  text: 'Do you or will you attend any of these universities?(MBTA)',
  category: 'General',
  conditions: [
    {
      questionId: 'citizen_status',
      values: ['yes'],
    },
    {
      questionId: 'ma_resident',
      values: ['yes'],
    },
    {
      questionId: 'student_status',
      values: ['full_time', 'part_time', 'future'],
    }
  ],
  options: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
  },

  {
    id: 'massgrant-plus-uni',
    text: 'Do you or will you attend any of these universities?(MassGrantPlus)',
    category: 'General',
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
      {
        questionId: 'ma_resident',
        values: ['yes'],
      },
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time', 'future'],
      }
    ],
    isVisible: (answers) => hasMassachusettsResidency(answers),
    options: householdSizeOptions,
  },
  {
    id: 'household_size_exact',
    text: 'Enter your exact household size.',
    category: 'Financial',
    conditions:[
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
    ],
    validate: (value) => {
      const parsedValue = Number.parseInt(value, 10);

      if (!Number.isInteger(parsedValue) || parsedValue < 9) {
        return 'Enter a household size of 9 or greater.';
      }

      return null;
    },
  },
  {
    id: 'masshealth_income_under_limit',
    text: 'MassHealth income threshold question',
    category: 'Financial',
    benefitIds: ['snap', 'masshealth'],
    conditions: [
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time','future'],
      },
    ],
    isVisible: (answers) => hasMassachusettsResidency(answers) && hasResolvedHouseholdSize(answers),
    getText: (answers) => getIncomeQuestionText('masshealth', answers),
    getHelperText: (answers) => getIncomeQuestionHelperText('masshealth', answers),
    options: yesNoOptions,
  },
  {
    id: 'household_sizes',
    text: 'What is your household size?',
    category: 'Financial',
    conditions:[
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
      {
        questionId: 'ma_resident',
        values: ['yes'],
      },
    ],

    options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
    ],
    isVisible: (answers) =>
      hasMassachusettsResidency(answers) &&
      hasResolvedHouseholdSize(answers) &&
      answers['masshealth_income_under_limit'] === 'no' &&
      answers['work_study'] !== 'yes',
    getText: (answers) => getIncomeQuestionText('snap', answers),
    getHelperText: (answers) => getIncomeQuestionHelperText('snap', answers),
    options: yesNoOptions,
  },

  {
    id: 'housing_status',
    text: 'What is or will be your living situation while attending college/university?',
    category: 'Housing',
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time','future'],
      },
    ],
    isVisible: (answers) =>
      hasQualifyingGrantResidency(answers) &&
      isMassGrantPlusEligibleSchool(answers['school_name']) &&
      !getInferredMassGrantPlusIncomeBand(answers),
    options: massGrantPlusIncomeBandOptions,
  },

  {
    id: 'income_level',
    text: 'What is your estimated annual income for your household?',
    category: 'Financial',
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
      {
        questionId: 'ma_resident',
        values: ['yes'],
      },
    ],
    options: [
    { label: 'Under $20,000', value: '20000' },
    { label: '$20,000 - $27,000', value: '27000' },
    { label: '$27,000 - $34,000', value: '34000' },
    { label: '$34,000 - $41,400,', value: '41400' },
    { label: 'Above 41,400$', value: '999999' }
  ],
  },

];

export function getQuestionTextSegments(question: Question, answers: BenefitProfile): InlineTextSegment[] {
  switch (question.id) {
    case 'citizen_status':
      return [
        { type: 'text', text: 'Are you a U.S. citizen or an ' },
        { type: 'tooltip', text: 'eligible non-citizen', tooltip: eligibleNonCitizenTooltip },
        { type: 'text', text: '?' },
      ];
    case 'residency_length':
      return [
        { type: 'text', text: 'Which best describes your Massachusetts ' },
        { type: 'tooltip', text: 'residency status', tooltip: residencyStatusTooltip },
        { type: 'text', text: '?' },
      ];
    case 'school_name':
      return [
        {
          type: 'text',
          text:
            getAttendancePromptPrefix(answers) === 'Will you'
              ? 'Which Massachusetts college or university will you attend?'
              : 'Which Massachusetts college or university do you attend?',
        },
      ];
    case 'household_sizes':
      return [
        { type: 'text', text: 'What is your ' },
        { type: 'tooltip', text: 'household size', tooltip: householdSizeTooltip },
        { type: 'text', text: '?' },
      ];
    case 'masshealth_income_under_limit':
      return getIncomeQuestionTextSegments('masshealth', answers);
    case 'snap_income_under_limit':
      return getIncomeQuestionTextSegments('snap', answers);
    case 'massgrant_plus_income_band':
      return [
        { type: 'text', text: 'Which Family ' },
        { type: 'tooltip', text: 'Gross Income', tooltip: grossIncomeTooltip },
        { type: 'text', text: ' Range Fits You Best?' },
      ];
    default: {
      const defaultText = question.getText ? question.getText(answers) : question.text;
      return [{ type: 'text', text: defaultText }];
    }
  }
}

export function getQuestionText(question: Question, answers: BenefitProfile): string {
  return getQuestionTextSegments(question, answers)
    .map((segment) => segment.text)
    .join('');
}

export function getQuestionHelperText(question: Question, answers: BenefitProfile): string {
  if (question.getHelperText) {
    return question.getHelperText(answers);
  }

  return question.helperText ?? '';
}

export function getQuestionsForBenefitFilters(
  allQuestions: Question[],
  selectedBenefitIds: string[]
): Question[] {
  if (!selectedBenefitIds.length) {
    return allQuestions;
  }

  return allQuestions.filter(
    (question) =>
      !question.benefitIds ||
      question.benefitIds.some((benefitId) => selectedBenefitIds.includes(benefitId))
  );
}

export function shouldShowQuestion(question: Question, answers: BenefitProfile): boolean {
  const conditionsMatch = !question.conditions || question.conditions.every((condition) => {
    const answerValue = answers[condition.questionId];
    return Boolean(answerValue) && condition.values.includes(answerValue);
  });

  if (!conditionsMatch) {
    return false;
  }

  return question.isVisible ? question.isVisible(answers) : true;
}

export function getVisibleQuestions(allQuestions: Question[], answers: BenefitProfile): Question[] {
  return allQuestions.filter((question) => shouldShowQuestion(question, answers));
}

export function pruneHiddenAnswers(
  allQuestions: Question[],
  answers: BenefitProfile
): BenefitProfile {
  const nextAnswers = { ...answers };
  let didChange = true;

  while (didChange) {
    didChange = false;
    const visibleQuestionIds = new Set(
      getVisibleQuestions(allQuestions, nextAnswers).map((question) => question.id)
    );

    for (const answerKey of Object.keys(nextAnswers)) {
      if (!visibleQuestionIds.has(answerKey)) {
        delete nextAnswers[answerKey];
        didChange = true;
      }
    }
  }

  return nextAnswers;
}

