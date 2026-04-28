import {
  formatCurrency,
  getEffectiveMassGrantPlusIncomeBand,
  getExactHouseholdSize,
  getIncomeQuestionHelperText,
  getIncomeQuestionText,
  getIncomeThreshold,
  getInferredMassGrantPlusIncomeBand,
  hasResolvedHouseholdSize,
  type BenefitProfile,
} from './incomeThresholds';
import type { InlineTextSegment } from './questionRichText';
import {
  dheAffidavitTooltip,
  eligibleNonCitizenTooltip,
  grossIncomeTooltip,
  householdSizeTooltip,
  itinTooltip,
  masfaTooltip,
  massHealthApplicationStepTooltip,
  massGrantPlusSchoolsTooltip,
  residencyStatusTooltip,
  selectiveServiceTooltip,
  massHealthIdentityCitizenshipTooltip,
  massHealthIncomeDocumentationTooltip,
  massHealthPlanSelectionTooltip,
  massHealthResidencyTooltip,
  taxDocumentsTooltip,
} from './questionTooltipContent';
import {
  allMassachusettsSchoolOptions,
  isMassGrantPlusEligibleSchool,
  isMbtaEligibleSchool,
  normalizeMassachusettsSchoolName,
} from './massachusettsSchools';

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
  actionStatuses?: string[];
  applicationType?: 'fafsa' | 'masfa';
  applicationCompleted?: boolean;
  dheAffidavitRequired?: boolean;
}
export interface QuestionOption {
  label: string;
  value: string;
}

interface QuestionVisibilityContext {
  questionIdsInScope: ReadonlySet<string>;
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
  isVisible?: (answers: BenefitProfile, context: QuestionVisibilityContext) => boolean;
  benefitIds?: string[];
}

const yesNoOptions: QuestionOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export const NOT_ENROLLED_NEXT_YEAR_VALUE = 'not_enrolled_next_year';

const yesNoOrNotEnrolledNextYearOptions: QuestionOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Not enrolling next academic year', value: NOT_ENROLLED_NEXT_YEAR_VALUE },
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

export const FAFSA_STATUS_URL =
  'https://studentaid.gov/fsa-id/sign-in/landing?redirectTo=%2Fmy-activity';
export const MASFA_START_URL = 'https://www.mass.edu/osfa/students/masfa.asp';
export const MASFA_STATUS_URL = 'https://madhestudentxprod.regenteducation.net/signin';
export const DHE_AFFIDAVIT_ACTION_STATUS = 'Action Needed, Complete DHE Affidavit';
export const GATHER_TAX_DOCUMENTS_CHECKLIST_ITEM = 'Gather tax documents';
export const MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM =
  'Attend a participating MASSGrant Plus school';
export const COMPLETE_DHE_AFFIDAVIT_CHECKLIST_ITEM =
  'Complete the DHE Tuition Equity Form and Affidavit';
export const PROVIDE_DHE_AFFIDAVIT_CHECKLIST_ITEM =
  'Provide the completed DHE Tuition Equity Form and Affidavit';

const masfaRouteBenefitIds = new Set<Benefit['id']>(['massgrant', 'massgrant-plus']);

function hasMassachusettsResidency(answers: BenefitProfile): boolean {
  const residencyLength = answers['residency_length'];
  return Boolean(residencyLength) && residencyLength !== 'not_ma_resident';
}

function hasQualifyingGrantResidency(answers: BenefitProfile): boolean {
  const residencyLength = answers['residency_length'];
  return Boolean(residencyLength) && residencyLength !== 'not_ma_resident' && residencyLength !== 'under_12_months';
}

function shouldContinueGrantQuestions(answers: BenefitProfile): boolean {
  if (answers['citizen_status'] !== 'no') {
    return true;
  }

  return answers['masfa_high_school_completer'] === 'yes';
}

function shouldAskPriorBachelorsDegree(answers: BenefitProfile): boolean {
  if (!isStudentOrFuture(answers)) {
    return false;
  }

  if (answers['citizen_status'] === 'yes') {
    return true;
  }

  if (answers['citizen_status'] === 'no') {
    return hasQualifyingGrantResidency(answers) && shouldContinueGrantQuestions(answers);
  }

  return false;
}

function isStudentOrFuture(answers: BenefitProfile): boolean {
  const studentStatus = answers['student_status'];
  return Boolean(studentStatus) && studentOrFutureValues.includes(studentStatus);
}

function isMassGrantEnrollmentEligible(answers: BenefitProfile): boolean {
  return isStudentOrFuture(answers);
}

function getMassGrantPlusEnrollmentStatus(
  answers: BenefitProfile
): 'full_time' | 'part_time' | null {
  if (answers['student_status'] === 'full_time' || answers['student_status'] === 'future_full_time') {
    return 'full_time';
  }

  if (answers['student_status'] === 'part_time' || answers['student_status'] === 'future_part_time') {
    return 'part_time';
  }

  return null;
}

function isMassGrantPlusEnrollmentEligible(answers: BenefitProfile): boolean {
  const enrollmentStatus = getMassGrantPlusEnrollmentStatus(answers);
  const incomeBand = getEffectiveMassGrantPlusIncomeBand(answers);

  if (!incomeBand || incomeBand === 'over_100k') {
    return false;
  }

  if (incomeBand === '85k_to_100k') {
    return enrollmentStatus === 'full_time';
  }

  if (enrollmentStatus === 'full_time') {
    return true;
  }

  return enrollmentStatus === 'part_time';
}

function usesMasfaRoute(answers: BenefitProfile): boolean {
  return answers['citizen_status'] === 'no';
}

function hasMasfaDocumentPath(answers: BenefitProfile): boolean {
  const documentationReady = answers['masfa_documentation_ready'];

  if (documentationReady === 'yes') {
    return true;
  }

  if (documentationReady === 'no') {
    const dheAffidavitStatus = answers['dhe_affidavit_completed'];
    return dheAffidavitStatus === 'yes' || dheAffidavitStatus === 'no';
  }

  return false;
}

function qualifiesUnderTuitionEquity(answers: BenefitProfile): boolean {
  return (
    usesMasfaRoute(answers) &&
    hasQualifyingGrantResidency(answers) &&
    answers['masfa_high_school_completer'] === 'yes' &&
    hasMasfaDocumentPath(answers)
  );
}

function hasStateAidPath(answers: BenefitProfile): boolean {
  if (answers['citizen_status'] === 'yes') {
    return true;
  }

  return qualifiesUnderTuitionEquity(answers);
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
      'MASSGrant is state financial aid for eligible Massachusetts residents enrolled at approved in-state colleges. Depending on your eligibility, schools may review you through the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) or the [MASFA](https://www.mass.edu/osfa/students/masfa.asp). Students using MASFA may need to meet additional Tuition Equity Law high-school-completer and documentation requirements.',
    category: 'Education',
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Complete the FAFSA or MASFA',
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
      'MASSGrant Plus eligibility here is based on Massachusetts residency for at least 12 months for reasons other than education before the academic year, attendance at a participating MASSGrant Plus school, at least 6 credits when family income is below $85,000, at least 12 credits when family income is $85,000 to $100,000, no prior bachelor\'s degree, and the correct state-aid application path through FAFSA or MASFA.',
    category: 'Education',
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Complete the FAFSA or MASFA',
      'Be a Massachusetts resident for at least 12 months for reasons other than education',
      MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM,
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
    description: 'Discounted passes offered through participating schools in the Greater Boston area. Eligibility depends on whether your school makes the program available to full-time students only or to both part-time and full-time students.',
    details:
      'The MBTA student pass is usually coordinated through participating colleges, not just through an individual checkout page. Start with your school\'s transportation page or transportation office instructions, then check the [official MBTA student pass page](https://www.mbta.com/fares/college-student-semester-passes) to confirm the steps your campus requires.',
    category: 'Transport',
    officialUrl: 'https://www.mbta.com/fares/college-student-semester-passes',
    officialButtonLabel: 'Visit Official Site',
    checklist: [
      'Get current student ID',
      'Verify enrollment status',
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
      'SNAP can help eligible students and households pay for groceries, but college students sometimes need to meet extra student-specific rules. In Massachusetts, applications and case updates are commonly handled through [DTA Connect](https://dtaconnect.eohhs.mass.gov), where you can submit documents, check notices, and track your case.',
    category: 'Food',
    officialUrl: 'https://dtaconnect.eohhs.mass.gov',
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
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus', 'mbta-pass'],
    options: [
      { label: 'Yes, full-time', value: 'full_time' },
      { label: 'Yes, part-time', value: 'part_time' },
      { label: 'I will be enrolled full-time within the next year', value: 'future_full_time' },
      { label: 'I will be enrolled part-time within the next year', value: 'future_part_time' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'citizen_status',
    text: 'Are you a U.S. citizen or an eligible non-citizen?',
    category: 'General',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus', 'snap', 'masshealth'],    
    options: yesNoOptions,
  },
  {
    id: 'residency_length',
    text: 'Which best describes your Massachusetts residency status?',
    category: 'General',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus', 'snap', 'masshealth'],
    options: residencyLengthOptions,
  },
  {
    id: 'school_name',
    text: 'Which Massachusetts college or university do you attend?',
    category: 'Education',
    benefitIds: ['massgrant-plus', 'mbta-pass'],
    control: 'select',
    placeholder: 'Select your college or university',
    conditions: [
      {
        questionId: 'student_status',
        values: studentOrFutureValues,
      },
    ],
    options: allMassachusettsSchoolOptions,
  },
  {
    id: 'fafsa_completed',
    text: 'Have you completed the FAFSA for the upcoming academic year?',
    category: 'Financial',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
      {
        questionId: 'student_status',
        values: studentOrFutureValues,
      },
    ],
    options: yesNoOrNotEnrolledNextYearOptions,
  },
  {
    id: 'masfa_completed',
    text: 'Have you completed the MASFA for the upcoming academic year?',
    category: 'Financial',
    benefitIds: ['massgrant', 'massgrant-plus'],
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['no'],
      },
      {
        questionId: 'student_status',
        values: studentOrFutureValues,
      },
    ],
    isVisible: (answers) => hasQualifyingGrantResidency(answers),
    options: yesNoOrNotEnrolledNextYearOptions,
  },
  {
    id: 'masfa_high_school_completer',
    text: 'Have you attended high school in Massachusetts for at least 3 academic years and earned a Massachusetts diploma or equivalent?',
    category: 'Education',
    benefitIds: ['massgrant', 'massgrant-plus'],
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['no'],
      },
      {
        questionId: 'student_status',
        values: studentOrFutureValues,
      },
    ],
    isVisible: (answers) => hasQualifyingGrantResidency(answers),
    options: yesNoOptions,
  },
  {
    id: 'masfa_documentation_ready',
    text: 'MASFA documentation question',
    category: 'Education',
    benefitIds: ['massgrant', 'massgrant-plus'],
    conditions: [
      {
        questionId: 'masfa_high_school_completer',
        values: ['yes'],
      },
    ],
    options: yesNoOptions,
  },
  {
    id: 'dhe_affidavit_completed',
    text: 'DHE affidavit question',
    category: 'Education',
    benefitIds: ['massgrant', 'massgrant-plus'],
    conditions: [
      {
        questionId: 'masfa_documentation_ready',
        values: ['no'],
      },
    ],
    options: yesNoOptions,
  },
  
  {
    id: 'household_sizes',
    text: 'What is your household size?',
    category: 'Financial',
    benefitIds: ['snap', 'masshealth'],
    control: 'select',
    placeholder: 'Select household size',
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
    ],
    isVisible: (answers) => hasMassachusettsResidency(answers),
    options: householdSizeOptions,
  },
  {
    id: 'household_size_exact',
    text: 'Enter your exact household size.',
    category: 'Financial',
    benefitIds: ['snap', 'masshealth'],
    control: 'number',
    placeholder: 'Enter a household size of 9 or greater',
    conditions: [
      {
        questionId: 'household_sizes',
        values: ['9_plus'],
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
    benefitIds: ['masshealth'],
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
    ],
    isVisible: (answers) => hasMassachusettsResidency(answers) && hasResolvedHouseholdSize(answers),
    getText: (answers) => getIncomeQuestionText('masshealth', answers),
    getHelperText: (answers) => getIncomeQuestionHelperText('masshealth', answers),
    options: yesNoOptions,
  },
  {
    id: 'snap_income_under_limit',
    text: 'SNAP income threshold question',
    category: 'Financial',
    benefitIds: ['snap'],
    conditions: [
      {
        questionId: 'citizen_status',
        values: ['yes'],
      },
    ],
    isVisible: (answers, context) =>
      hasMassachusettsResidency(answers) &&
      hasResolvedHouseholdSize(answers) &&
      (
        !context.questionIdsInScope.has('masshealth_income_under_limit') ||
        answers['masshealth_income_under_limit'] === 'no'
      ),
    getText: (answers) => getIncomeQuestionText('snap', answers),
    getHelperText: (answers) => getIncomeQuestionHelperText('snap', answers),
    options: yesNoOptions,
  },
  {
    id: 'massgrant_plus_income_band',
    text: 'Which family income range fits you best for MASSGrant Plus?',
    category: 'Education',
    benefitIds: ['massgrant-plus'],
    conditions: [
      {
        questionId: 'student_status',
        values: studentOrFutureValues,
      },
    ],
    isVisible: (answers) =>
      hasQualifyingGrantResidency(answers) &&
      shouldContinueGrantQuestions(answers) &&
      isMassGrantPlusEligibleSchool(answers['school_name']) &&
      !getInferredMassGrantPlusIncomeBand(answers),
    options: massGrantPlusIncomeBandOptions,
  },
  {
    id: 'prior_bachelors_degree',
    text: 'Have you already received a bachelor\'s degree or equivalent?',
    category: 'Education',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    conditions: [
      {
        questionId: 'student_status',
        values: studentOrFutureValues,
      },
    ],
    isVisible: (answers) => shouldAskPriorBachelorsDegree(answers),
    options: yesNoOptions,
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
    case 'masfa_completed':
      return [
        { type: 'text', text: 'Have you completed the ' },
        { type: 'tooltip', text: 'MASFA', tooltip: masfaTooltip },
        { type: 'text', text: ' for the upcoming academic year?' },
      ];
    case 'masfa_documentation_ready':
      return [
        { type: 'text', text: 'Can you provide at least one of the following: a valid SSN, documentation of an ' },
        { type: 'tooltip', text: 'ITIN', tooltip: itinTooltip },
        { type: 'text', text: ', or proof of registration with ' },
        { type: 'tooltip', text: 'Selective Service', tooltip: selectiveServiceTooltip },
        { type: 'text', text: ' if applicable?' },
      ];
    case 'dhe_affidavit_completed':
      return [
        { type: 'text', text: 'Have you already completed the ' },
        {
          type: 'tooltip',
          text: 'DHE Tuition Equity Form and Affidavit',
          tooltip: dheAffidavitTooltip,
          trailingText: '?',
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

export function getBenefitApplicationType(
  benefitId: string,
  answers: BenefitProfile
): 'fafsa' | 'masfa' | null {
  if (benefitId === 'pell-grant') {
    return 'fafsa';
  }

  if (masfaRouteBenefitIds.has(benefitId as Benefit['id']) && answers['citizen_status'] === 'no') {
    return 'masfa';
  }

  if (benefitId === 'massgrant' || benefitId === 'massgrant-plus') {
    return 'fafsa';
  }

  return null;
}

export function isBenefitApplicationCompleted(
  benefitId: string,
  answers: BenefitProfile
): boolean {
  const applicationType = getBenefitApplicationType(benefitId, answers);

  if (applicationType === 'masfa') {
    return answers['masfa_completed'] === 'yes';
  }

  if (applicationType === 'fafsa') {
    return answers['fafsa_completed'] === 'yes';
  }

  return false;
}

export function shouldDeprioritizeBenefit(
  benefitId: string,
  answers: BenefitProfile
): boolean {
  const applicationType = getBenefitApplicationType(benefitId, answers);

  if (applicationType === 'masfa') {
    const masfaStatus = answers['masfa_completed'];
    return masfaStatus === 'yes' || masfaStatus === NOT_ENROLLED_NEXT_YEAR_VALUE;
  }

  if (applicationType === 'fafsa') {
    const fafsaStatus = answers['fafsa_completed'];
    return fafsaStatus === 'yes' || fafsaStatus === NOT_ENROLLED_NEXT_YEAR_VALUE;
  }

  return false;
}

export function sortBenefitsForDisplay<T extends Pick<Benefit, 'id'>>(
  matchedBenefits: T[],
  answers: BenefitProfile
): T[] {
  return matchedBenefits
    .map((benefit, index) => ({ benefit, index }))
    .sort(
      (left, right) =>
        Number(shouldDeprioritizeBenefit(left.benefit.id, answers)) -
          Number(shouldDeprioritizeBenefit(right.benefit.id, answers)) ||
        left.index - right.index
    )
    .map(({ benefit }) => benefit);
}

export function mergeBenefitWithCatalog<T extends Benefit>(benefit: T): T {
  const catalogBenefit = benefits.find((catalogItem) => catalogItem.id === benefit.id);

  if (!catalogBenefit) {
    return benefit;
  }

  return {
    ...catalogBenefit,
    ...benefit,
    title: benefit.title || catalogBenefit.title,
    description: benefit.description || catalogBenefit.description,
    details: benefit.details || catalogBenefit.details,
    category: benefit.category || catalogBenefit.category,
    officialUrl: benefit.officialUrl || catalogBenefit.officialUrl,
    officialButtonLabel: benefit.officialButtonLabel || catalogBenefit.officialButtonLabel,
  } as T;
}

export function isPositiveActionStatus(actionStatus?: string): boolean {
  if (typeof actionStatus !== 'string') {
    return false;
  }

  const normalizedStatus = actionStatus.toLowerCase();
  return normalizedStatus.includes('no action needed') || normalizedStatus.includes('already completed');
}

export function getDisplayActionStatus(
  actionStatus: string,
  benefitId: string,
  answers: BenefitProfile
): string {
  if (!isPositiveActionStatus(actionStatus) || !isBenefitApplicationCompleted(benefitId, answers)) {
    return actionStatus;
  }

  const applicationType = getBenefitApplicationType(benefitId, answers);

  if (applicationType === 'fafsa') {
    return 'No action needed: already completed FAFSA';
  }

  if (applicationType === 'masfa') {
    return 'No action needed: already completed MASFA';
  }

  return actionStatus;
}

function isMassGrantPartTimeVariant(answers: BenefitProfile): boolean {
  return (
    answers['student_status'] === 'part_time' ||
    answers['student_status'] === 'future_part_time'
  );
}

function needsDheAffidavit(answers: BenefitProfile): boolean {
  return (
    qualifiesUnderTuitionEquity(answers) &&
    answers['masfa_documentation_ready'] === 'no' &&
    answers['dhe_affidavit_completed'] === 'no'
  );
}

function isNotEnrollingNextAcademicYear(
  answers: BenefitProfile,
  route: 'fafsa' | 'masfa'
): boolean {
  if (route === 'masfa') {
    return answers['masfa_completed'] === NOT_ENROLLED_NEXT_YEAR_VALUE;
  }

  return answers['fafsa_completed'] === NOT_ENROLLED_NEXT_YEAR_VALUE;
}

function getStateAidAction(answers: BenefitProfile): Partial<Benefit> {
  if (usesMasfaRoute(answers)) {
    if (isNotEnrollingNextAcademicYear(answers, 'masfa')) {
      return {
        applicationType: 'masfa',
        applicationCompleted: false,
        officialUrl: MASFA_START_URL,
        officialButtonLabel: 'View Official Site',
      };
    }

    if (answers['masfa_completed'] === 'yes') {
      return {
        applicationType: 'masfa',
        applicationCompleted: true,
        officialUrl: MASFA_STATUS_URL,
        officialButtonLabel: 'Check MASFA Status',
        actionStatus: 'No Action Needed - Already Completed',
      };
    }

    return {
      applicationType: 'masfa',
      applicationCompleted: false,
      officialUrl: MASFA_START_URL,
      officialButtonLabel: 'Start MASFA Application',
      actionStatus: 'Action Needed, Please Complete MASFA',
    };
  }

  if (isNotEnrollingNextAcademicYear(answers, 'fafsa')) {
    return {
      applicationType: 'fafsa',
      applicationCompleted: false,
      officialUrl: benefits.find((benefit) => benefit.id === 'massgrant')?.officialUrl ?? FAFSA_STATUS_URL,
      officialButtonLabel: 'View Official Site',
    };
  }

  if (answers['fafsa_completed'] === 'yes') {
    return {
      applicationType: 'fafsa',
      applicationCompleted: true,
      officialUrl: FAFSA_STATUS_URL,
      officialButtonLabel: 'Check FAFSA Status',
      actionStatus: 'No Action Needed - Already Completed',
    };
  }

  return {
    applicationType: 'fafsa',
    applicationCompleted: false,
    officialUrl: benefits.find((benefit) => benefit.id === 'massgrant')?.officialUrl ?? FAFSA_STATUS_URL,
    officialButtonLabel: 'Start FAFSA Application',
    actionStatus: 'Action needed - Complete FAFSA',
  };
}

function getPellAction(answers: BenefitProfile): Partial<Benefit> {
  if (isNotEnrollingNextAcademicYear(answers, 'fafsa')) {
    return {
      applicationType: 'fafsa',
      applicationCompleted: false,
      officialUrl: benefits.find((benefit) => benefit.id === 'pell-grant')?.officialUrl ?? FAFSA_STATUS_URL,
      officialButtonLabel: 'View Official Site',
    };
  }

  if (answers['fafsa_completed'] === 'yes') {
    return {
      applicationType: 'fafsa',
      applicationCompleted: true,
      officialUrl: FAFSA_STATUS_URL,
      officialButtonLabel: 'Check FAFSA Status',
      actionStatus: 'No Action Needed - Already Completed',
    };
  }

  return {
    applicationType: 'fafsa',
    applicationCompleted: false,
    officialUrl: benefits.find((benefit) => benefit.id === 'pell-grant')?.officialUrl ?? FAFSA_STATUS_URL,
    officialButtonLabel: 'Start FAFSA Application',
    actionStatus: 'Action needed - Complete FAFSA',
  };
}

function getDheAffidavitChecklistItem(answers: BenefitProfile): string | null {
  if (!qualifiesUnderTuitionEquity(answers)) {
    return null;
  }

  if (answers['masfa_documentation_ready'] !== 'no') {
    return null;
  }

  if (answers['dhe_affidavit_completed'] === 'yes') {
    return PROVIDE_DHE_AFFIDAVIT_CHECKLIST_ITEM;
  }

  return COMPLETE_DHE_AFFIDAVIT_CHECKLIST_ITEM;
}

function buildMassGrantActionStatuses(answers: BenefitProfile): string[] {
  const route = usesMasfaRoute(answers) ? 'masfa' : 'fafsa';

  if (isNotEnrollingNextAcademicYear(answers, route)) {
    return [];
  }

  const statuses: string[] = [];

  if (needsDheAffidavit(answers)) {
    statuses.push(DHE_AFFIDAVIT_ACTION_STATUS);
  }

  const actionStatus = getStateAidAction(answers).actionStatus;
  if (actionStatus) {
    statuses.push(actionStatus);
  }

  return statuses;
}

function buildMassGrantChecklist(answers: BenefitProfile): string[] {
  const checklist = [
    usesMasfaRoute(answers) ? 'Complete the MASFA' : 'Complete the FAFSA',
    'Be a Massachusetts resident',
    'Enroll in a Massachusetts college',
    'Maintain satisfactory academic progress',
  ];

  const dheItem = getDheAffidavitChecklistItem(answers);
  if (dheItem) {
    checklist.push(dheItem);
  }

  checklist.push('Check award notification from your school');
  return checklist;
}

function buildMassGrantPlusChecklist(answers: BenefitProfile): string[] {
  const checklist = [
    usesMasfaRoute(answers) ? 'Complete the MASFA' : 'Complete the FAFSA',
    'Be a Massachusetts resident for at least 12 months for reasons other than education',
    MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM,
    'Not already hold a bachelor\'s degree',
    'Review eligibility with your financial aid office',
  ];

  const dheItem = getDheAffidavitChecklistItem(answers);
  if (dheItem) {
    checklist.splice(checklist.length - 1, 0, dheItem);
  }

  return checklist;
}

function getMassGrantMatchedDetails(answers: BenefitProfile): string {
  if (isMassGrantPartTimeVariant(answers)) {
    return 'CommonMASS labels this match as MASSGrant (Part-Time) because your answers indicate a part-time enrollment path. This part-time grant path can help distinguish this result from the standard full-time MASSGrant route while still directing you to FAFSA or MASFA and your financial aid office for final review.';
  }

  return (
    benefits.find((benefit) => benefit.id === 'massgrant')?.details ??
    'MASSGrant is state financial aid for eligible Massachusetts residents enrolled at approved in-state colleges.'
  );
}

function isSnapIncomeEligible(answers: BenefitProfile): boolean {
  return (
    answers['masshealth_income_under_limit'] === 'yes' ||
    answers['snap_income_under_limit'] === 'yes'
  );
}

export function evaluateEligibilityLocally(
  profile: Record<string, string>,
  selectedBenefitIds: string[] = []
): Benefit[] {
  const answers = profile as BenefitProfile;
  const matches: Benefit[] = [];
  const catalogById = new Map(benefits.map((benefit) => [benefit.id, benefit]));

  const addMatch = (benefit: Benefit) => {
    if (!matches.some((match) => match.id === benefit.id)) {
      matches.push(benefit);
    }
  };

  if (
    isStudentOrFuture(answers) &&
    answers['citizen_status'] === 'yes' &&
    answers['prior_bachelors_degree'] === 'no'
  ) {
    const catalog = catalogById.get('pell-grant');
    if (catalog) {
      const action = getPellAction(answers);
      addMatch({
        ...catalog,
        ...action,
        actionStatuses: action.actionStatus ? [action.actionStatus] : [],
      });
    }
  }

  if (
    isMassGrantEnrollmentEligible(answers) &&
    hasStateAidPath(answers) &&
    hasQualifyingGrantResidency(answers) &&
    answers['prior_bachelors_degree'] === 'no'
  ) {
    const catalog = catalogById.get('massgrant');
    if (catalog) {
      const action = getStateAidAction(answers);
      addMatch({
        ...catalog,
        title: isMassGrantPartTimeVariant(answers) ? 'MASSGrant (Part-Time)' : catalog.title,
        details: getMassGrantMatchedDetails(answers),
        ...action,
        actionStatuses: buildMassGrantActionStatuses(answers),
        checklist: buildMassGrantChecklist(answers),
        dheAffidavitRequired: needsDheAffidavit(answers),
      });
    }
  }

  if (
    hasStateAidPath(answers) &&
    hasQualifyingGrantResidency(answers) &&
    answers['prior_bachelors_degree'] === 'no' &&
    isMassGrantPlusEligibleSchool(answers['school_name']) &&
    isMassGrantPlusEnrollmentEligible(answers)
  ) {
    const catalog = catalogById.get('massgrant-plus');
    if (catalog) {
      const action = getStateAidAction(answers);
      addMatch({
        ...catalog,
        ...action,
        actionStatuses: buildMassGrantActionStatuses(answers),
        checklist: buildMassGrantPlusChecklist(answers),
        dheAffidavitRequired: needsDheAffidavit(answers),
      });
    }
  }

  if (
    hasMassachusettsResidency(answers) &&
    answers['citizen_status'] === 'yes' &&
    isSnapIncomeEligible(answers)
  ) {
    const catalog = catalogById.get('snap');
    if (catalog) {
      addMatch({
        ...catalog,
        actionStatuses: [],
      });
    }
  }

  if (
    hasMassachusettsResidency(answers) &&
    answers['citizen_status'] === 'yes' &&
    answers['masshealth_income_under_limit'] === 'yes'
  ) {
    const catalog = catalogById.get('masshealth');
    if (catalog) {
      addMatch({
        ...catalog,
        actionStatuses: [],
      });
    }
  }

  if (isStudentOrFuture(answers) && isMbtaEligibleSchool(answers['school_name'])) {
    const catalog = catalogById.get('mbta-pass');
    if (catalog) {
      addMatch({
        ...catalog,
        actionStatuses: [],
      });
    }
  }

  const filteredMatches =
    selectedBenefitIds.length > 0
      ? matches.filter((match) => selectedBenefitIds.includes(match.id))
      : matches;

  return sortBenefitsForDisplay(filteredMatches, answers);
}

function getSelectedSchoolName(answers: BenefitProfile): string | null {
  const normalizedSchoolName = normalizeMassachusettsSchoolName(answers['school_name']);

  if (
    !normalizedSchoolName ||
    normalizedSchoolName === 'other' ||
    normalizedSchoolName === 'undecided'
  ) {
    return null;
  }

  return normalizedSchoolName;
}

function wasQuestionShown(
  questionId: string,
  answers: BenefitProfile,
  selectedBenefitIds: string[] = []
): boolean {
  const relevantQuestions = getQuestionsForBenefitFilters(questions, selectedBenefitIds);
  const question = relevantQuestions.find((entry) => entry.id === questionId);

  if (!question) {
    return false;
  }

  const visibilityContext = createQuestionVisibilityContext(relevantQuestions);
  return shouldShowQuestionWithContext(question, answers, visibilityContext);
}

function getStudentStatusIneligibilityReason(
  benefitTitle: string,
  answers: BenefitProfile,
  options?: { requireFullTime?: boolean }
): string | null {
  const studentStatus = answers['student_status'];
  const enrollmentRequirement = 'must be enrolled in college now or plan to enroll within the next year';

  if (!studentStatus) {
    return wasQuestionShown('student_status', answers)
      ? `${enrollmentRequirement}. Your enrollment answer was not provided.`
      : null;
  }

  if (studentStatus === 'no') {
    return `${enrollmentRequirement}. You answered that you are not currently enrolled and are not planning to enroll within the next year.`;
  }

  if (options?.requireFullTime) {
    if (studentStatus === 'part_time') {
      return 'must be enrolled full-time. You selected part-time enrollment.';
    }

    if (studentStatus === 'future_part_time') {
      return 'must be enrolled full-time. You selected planned part-time enrollment for the next academic year.';
    }
  }

  return null;
}

function getMassachusettsResidencyIneligibilityReason(
  benefitTitle: string,
  answers: BenefitProfile,
  options?: { requireTwelveMonths?: boolean }
): string | null {
  const residencyLength = answers['residency_length'];
  const residencyRequirement = options?.requireTwelveMonths
    ? 'must have been a Massachusetts resident for at least 12 months'
    : 'must be a Massachusetts resident';

  if (!residencyLength) {
    return wasQuestionShown('residency_length', answers)
      ? `${residencyRequirement}. Your residency answer was not provided.`
      : null;
  }

  if (residencyLength === 'not_ma_resident') {
    return `${residencyRequirement}. You answered that you are not currently a Massachusetts resident.`;
  }

  if (options?.requireTwelveMonths && residencyLength === 'under_12_months') {
    return `${residencyRequirement}. You selected less than 12 months of Massachusetts residency.`;
  }

  return null;
}

function getCitizenshipIneligibilityReason(
  benefitTitle: string,
  answers: BenefitProfile
): string | null {
  const citizenStatus = answers['citizen_status'];
  const citizenshipRequirement = 'must be a U.S. citizen or eligible non-citizen';

  if (citizenStatus === 'no') {
    return `${citizenshipRequirement}. You answered that you are not.`;
  }

  if (!citizenStatus) {
    return wasQuestionShown('citizen_status', answers)
      ? `${citizenshipRequirement}. Your citizenship answer was not provided.`
      : null;
  }

  return null;
}

function getSchoolParticipationIneligibilityReason(
  benefitTitle: string,
  answers: BenefitProfile,
  options: {
    isEligible: boolean;
    programLabel: string;
    requirementText: string;
  }
): string | null {
  if (options.isEligible) {
    return null;
  }

  const schoolAnswer = answers['school_name'];
  const selectedSchoolName = getSelectedSchoolName(answers);
  const schoolRequirement = `must ${options.requirementText}`;

  if (!schoolAnswer) {
    return wasQuestionShown('school_name', answers)
      ? `${schoolRequirement}. Your school selection was not provided.`
      : null;
  }

  if (schoolAnswer === 'undecided') {
    return `${schoolRequirement}. You marked your school as undecided, so we could not verify whether it participates.`;
  }

  if (schoolAnswer === 'other') {
    return `${schoolRequirement}. You selected Other, so we could not verify whether your school participates.`;
  }

  if (selectedSchoolName) {
    return `${schoolRequirement}. You selected ${selectedSchoolName}, which is not currently on the participating ${options.programLabel} school list.`;
  }

  return `${schoolRequirement}. We could not verify whether your school participates.`;
}

function getPriorBachelorsIneligibilityReason(
  benefitTitle: string,
  answers: BenefitProfile
): string | null {
  const degreeRequirement = "cannot already have a bachelor's degree or equivalent";

  if (answers['prior_bachelors_degree'] === 'yes') {
    return `${degreeRequirement}. You answered that you already have a bachelor's degree or equivalent.`;
  }

  if (!answers['prior_bachelors_degree']) {
    return wasQuestionShown('prior_bachelors_degree', answers)
      ? `${degreeRequirement}. Your degree answer was not provided.`
      : null;
  }

  return null;
}

function getStateAidPathIneligibilityReason(
  benefitTitle: string,
  answers: BenefitProfile
): string | null {
  if (!usesMasfaRoute(answers)) {
    return null;
  }

  if (!hasQualifyingGrantResidency(answers)) {
    return null;
  }

  const highSchoolRequirement =
    'must have attended high school in Massachusetts for at least 3 academic years and earned a Massachusetts diploma or equivalent to use the MASFA/Tuition Equity route';

  if (answers['masfa_high_school_completer'] === 'no') {
    return `${highSchoolRequirement}. You answered that this requirement is not met.`;
  }

  if (!answers['masfa_high_school_completer']) {
    return wasQuestionShown('masfa_high_school_completer', answers)
      ? `${highSchoolRequirement}. Your Massachusetts high school completion answer was not provided.`
      : null;
  }

  const documentationRequirement =
    'must have a confirmed MASFA documentation path, such as standard MASFA documentation or the DHE Tuition Equity Form and Affidavit path when needed';

  if (answers['masfa_documentation_ready'] === 'yes') {
    return null;
  }

  if (answers['masfa_documentation_ready'] === 'no') {
    if (
      answers['dhe_affidavit_completed'] === 'yes' ||
      answers['dhe_affidavit_completed'] === 'no'
    ) {
      return null;
    }

    return wasQuestionShown('dhe_affidavit_completed', answers)
      ? `${documentationRequirement}. You indicated that the standard MASFA documentation path does not apply, but your DHE Tuition Equity Form and Affidavit answer was not provided.`
      : null;
  }

  return wasQuestionShown('masfa_documentation_ready', answers)
    ? `${documentationRequirement}. Your documentation-path answer was not provided.`
    : null;
}

function getIncomeThresholdIneligibilityReason(
  program: 'masshealth' | 'snap',
  answers: BenefitProfile
): string {
  const householdSize = getExactHouseholdSize(answers);
  const threshold = getIncomeThreshold(program, answers);

  if (householdSize && threshold !== null) {
    if (program === 'masshealth') {
      return `must have yearly household gross income below the MassHealth limit for your household size. For a household of ${householdSize}, the limit used here is ${formatCurrency(threshold)}. You answered that your income is not below that amount, so your income appears above the eligible limit for this program.`;
    }

    return `must have monthly household gross income below the SNAP limit for your household size. For a household of ${householdSize}, the limit used here is ${formatCurrency(threshold)}. You answered that your income is not below that amount, so your income appears above the eligible limit for this program.`;
  }

  return program === 'masshealth'
    ? 'must have household income below the MassHealth limit for your household size. You answered that your income is not below that limit, so your income appears above the eligible limit for this program.'
    : 'must have household income below the SNAP limit for your household size. You answered that your income is not below that limit, so your income appears above the eligible limit for this program.';
}

function getHouseholdSizeRequirementReason(
  programTitle: 'MassHealth' | 'SNAP',
  answers: BenefitProfile
): string | null {
  if (wasQuestionShown('household_size_exact', answers) && !answers['household_size_exact']) {
    return `must provide your exact household size so the ${programTitle} income limit can be checked. You selected 9 or more people but did not provide the exact number.`;
  }

  if (wasQuestionShown('household_sizes', answers) && !hasResolvedHouseholdSize(answers)) {
    return `must provide your household size so the ${programTitle} income limit can be checked. Your household-size answer was not provided.`;
  }

  return null;
}

function getMassHealthIncomeIneligibilityReason(answers: BenefitProfile): string | null {
  if (answers['masshealth_income_under_limit'] === 'no') {
    return getIncomeThresholdIneligibilityReason('masshealth', answers);
  }

  if (wasQuestionShown('masshealth_income_under_limit', answers) && !answers['masshealth_income_under_limit']) {
    return 'must have household income below the MassHealth limit for your household size. Your MassHealth income-limit answer was not provided.';
  }

  return getHouseholdSizeRequirementReason('MassHealth', answers);
}

function getSnapIncomeIneligibilityReason(
  answers: BenefitProfile,
  selectedBenefitIds: string[] = []
): string | null {
  if (answers['masshealth_income_under_limit'] === 'yes') {
    return null;
  }

  if (answers['snap_income_under_limit'] === 'no') {
    return getIncomeThresholdIneligibilityReason('snap', answers);
  }

  if (
    wasQuestionShown('snap_income_under_limit', answers, selectedBenefitIds) &&
    !answers['snap_income_under_limit']
  ) {
    return 'must have household income below the SNAP limit for your household size. Your SNAP income-limit answer was not provided.';
  }

  return getHouseholdSizeRequirementReason('SNAP', answers);
}

function getMassGrantPlusIncomeIneligibilityReason(
  answers: BenefitProfile
): string | null {
  const incomeBand = getEffectiveMassGrantPlusIncomeBand(answers);
  const enrollmentStatus = getMassGrantPlusEnrollmentStatus(answers);

  if (!incomeBand) {
    return wasQuestionShown('massgrant_plus_income_band', answers)
      ? 'must fall within an eligible family income range. Your family-income-range answer was not provided.'
      : null;
  }

  if (incomeBand === 'over_100k') {
    return 'must have family income within the MASSGrant Plus range used here. Based on your answers, it appears above $100,000, which is outside that range.';
  }

  if (incomeBand === '85k_to_100k' && enrollmentStatus === 'part_time') {
    return 'must be enrolled full-time if family income is between $85,000 and $100,000. You selected part-time enrollment.';
  }

  return null;
}

export function getBenefitIneligibilityReasons(
  benefitId: string,
  answers: BenefitProfile,
  selectedBenefitIds: string[] = []
): string[] {
  const reasons: string[] = [];
  const benefitTitle = benefits.find((benefit) => benefit.id === benefitId)?.title ?? 'this program';

  const pushReason = (reason: string | null) => {
    if (reason) {
      reasons.push(reason);
    }
  };

  switch (benefitId) {
    case 'pell-grant':
      pushReason(getStudentStatusIneligibilityReason('the Pell Grant', answers));
      pushReason(getCitizenshipIneligibilityReason('the Pell Grant', answers));
      if (wasQuestionShown('prior_bachelors_degree', answers)) {
        pushReason(getPriorBachelorsIneligibilityReason('the Pell Grant', answers));
      }
      break;

    case 'massgrant':
      pushReason(getStudentStatusIneligibilityReason('MASSGrant', answers));
      pushReason(
        getMassachusettsResidencyIneligibilityReason('MASSGrant', answers, {
          requireTwelveMonths: true,
        })
      );
      pushReason(getStateAidPathIneligibilityReason('MASSGrant', answers));

      if (wasQuestionShown('prior_bachelors_degree', answers)) {
        pushReason(getPriorBachelorsIneligibilityReason('MASSGrant', answers));
      }
      break;

    case 'massgrant-plus':
      pushReason(getStudentStatusIneligibilityReason('MASSGrant Plus', answers));
      pushReason(
        getMassachusettsResidencyIneligibilityReason('MASSGrant Plus', answers, {
          requireTwelveMonths: true,
        })
      );
      pushReason(getStateAidPathIneligibilityReason('MASSGrant Plus', answers));

      if (wasQuestionShown('school_name', answers)) {
        pushReason(
          getSchoolParticipationIneligibilityReason('MASSGrant Plus', answers, {
            isEligible: isMassGrantPlusEligibleSchool(answers['school_name']),
            programLabel: 'MASSGrant Plus',
            requirementText: 'attend a participating MASSGrant Plus school',
          })
        );
      }

      if (wasQuestionShown('prior_bachelors_degree', answers)) {
        pushReason(getPriorBachelorsIneligibilityReason('MASSGrant Plus', answers));
      }

      pushReason(getMassGrantPlusIncomeIneligibilityReason(answers));
      break;

    case 'masshealth':
      pushReason(getMassachusettsResidencyIneligibilityReason('MassHealth', answers));
      pushReason(getCitizenshipIneligibilityReason('MassHealth', answers));
      pushReason(getMassHealthIncomeIneligibilityReason(answers));
      break;

    case 'snap':
      pushReason(getMassachusettsResidencyIneligibilityReason('SNAP', answers));
      pushReason(getCitizenshipIneligibilityReason('SNAP', answers));
      pushReason(getSnapIncomeIneligibilityReason(answers, selectedBenefitIds));
      break;

    case 'mbta-pass':
      pushReason(getStudentStatusIneligibilityReason('the MBTA Student Pass', answers));

      if (wasQuestionShown('school_name', answers)) {
        pushReason(
          getSchoolParticipationIneligibilityReason('the MBTA Student Pass', answers, {
            isEligible: isMbtaEligibleSchool(answers['school_name']),
            programLabel: 'the MBTA Student Pass',
            requirementText: 'attend a school that participates in the MBTA Student Pass program',
          })
        );
      }
      break;

    default:
      break;
  }

  return reasons.length > 0
    ? Array.from(new Set(reasons))
    : [`We could not determine which requirement blocked ${benefitTitle} from the answers currently on file.`];
}
export function shouldShowDheAffidavitActionStatus(
  benefitId: string,
  answers: BenefitProfile
): boolean {
  return (
    masfaRouteBenefitIds.has(benefitId as Benefit['id']) &&
    answers['citizen_status'] === 'no' &&
    answers['masfa_high_school_completer'] === 'yes' &&
    answers['masfa_documentation_ready'] === 'no' &&
    answers['dhe_affidavit_completed'] === 'no'
  );
}

export function getBenefitRichTextSegments(
  text: string,
  options?: { massGrantPlusSchoolNote?: string }
): InlineTextSegment[] | null {
  switch (text) {
    case GATHER_TAX_DOCUMENTS_CHECKLIST_ITEM:
      return [
        { type: 'tooltip', text: 'Gather tax documents', tooltip: taxDocumentsTooltip },
      ];
    case 'Verify Massachusetts residency':
      return [
        { type: 'tooltip', text: 'Verify Massachusetts residency', tooltip: massHealthResidencyTooltip },
      ];
    case 'Gather income documentation':
      return [
        { type: 'tooltip', text: 'Gather income documentation', tooltip: massHealthIncomeDocumentationTooltip },
      ];
    case 'Collect proof of identity and citizenship':
      return [
        { type: 'tooltip', text: 'Collect proof of identity and citizenship', tooltip: massHealthIdentityCitizenshipTooltip },
      ];
    case 'Apply online at MAhealthconnector.org':
      return [
        { type: 'tooltip', text: 'Apply online at MAhealthconnector.org', tooltip: massHealthApplicationStepTooltip },
      ];
    case 'Choose a MassHealth plan':
      return [
        { type: 'tooltip', text: 'Choose a MassHealth plan', tooltip: massHealthPlanSelectionTooltip },
      ];
    case MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM:
      return [
        {
          type: 'tooltip',
          text: MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM,
          tooltip: options?.massGrantPlusSchoolNote
            ? {
                ...massGrantPlusSchoolsTooltip,
                note: options.massGrantPlusSchoolNote,
              }
            : massGrantPlusSchoolsTooltip,
        },
      ];
    case DHE_AFFIDAVIT_ACTION_STATUS:
      return [
        { type: 'text', text: 'Action Needed, Complete the ' },
        {
          type: 'tooltip',
          text: 'DHE Affidavit',
          tooltip: dheAffidavitTooltip,
          triggerClassName:
            'font-semibold text-inherit no-underline decoration-transparent hover:text-inherit dark:text-inherit dark:hover:text-inherit',
        },
      ];
    case COMPLETE_DHE_AFFIDAVIT_CHECKLIST_ITEM:
      return [
        { type: 'text', text: 'Complete the ' },
        { type: 'tooltip', text: 'DHE Tuition Equity Form and Affidavit', tooltip: dheAffidavitTooltip },
      ];
    case PROVIDE_DHE_AFFIDAVIT_CHECKLIST_ITEM:
      return [
        { type: 'text', text: 'Provide the completed ' },
        { type: 'tooltip', text: 'DHE Tuition Equity Form and Affidavit', tooltip: dheAffidavitTooltip },
      ];
    default:
      return null;
  }
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

function createQuestionVisibilityContext(allQuestions: Question[]): QuestionVisibilityContext {
  return {
    questionIdsInScope: new Set(allQuestions.map((question) => question.id)),
  };
}

function shouldShowQuestionWithContext(
  question: Question,
  answers: BenefitProfile,
  context: QuestionVisibilityContext
): boolean {
  const conditionsMatch = !question.conditions || question.conditions.every((condition) => {
    const answerValue = answers[condition.questionId];
    return Boolean(answerValue) && condition.values.includes(answerValue);
  });

  if (!conditionsMatch) {
    return false;
  }

  return question.isVisible ? question.isVisible(answers, context) : true;
}

export function shouldShowQuestion(
  question: Question,
  answers: BenefitProfile,
  allQuestions: Question[] = questions
): boolean {
  return shouldShowQuestionWithContext(
    question,
    answers,
    createQuestionVisibilityContext(allQuestions)
  );
}

export function getVisibleQuestions(allQuestions: Question[], answers: BenefitProfile): Question[] {
  const visibilityContext = createQuestionVisibilityContext(allQuestions);
  return allQuestions.filter((question) =>
    shouldShowQuestionWithContext(question, answers, visibilityContext)
  );
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
















