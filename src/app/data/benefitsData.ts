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

export interface Question {
  id: string;
  text: string;
  options: { label: string; value: string }[];
  category: string;
  // If present, this question is only shown when all conditions match prior answers.
  conditions?: {
    questionId: string;
    values: string[];
  }[];
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
    description: 'Additional need-based grant for Massachusetts residents with exceptional financial need, providing up to full tuition coverage.',
    details:
      'MASSGrant Plus is an additional state grant for students with very high financial need who attend eligible Massachusetts public colleges full-time. Eligibility is generally reviewed through the FAFSA and your school\'s aid process, so the most important next step is keeping your federal aid application and school records up to date through [StudentAid.gov](https://studentaid.gov/h/apply-for-aid/fafsa).',
    category: 'Education',
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialButtonLabel: 'Start Official Application',
    checklist: [
      'Complete the FAFSA',
      'Demonstrate Expected Family Contribution (EFC) of $0',
      'Enroll full-time at a Massachusetts public college',
      'Maintain good academic standing',
      'Review eligibility with financial aid office',
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
      "Visit school's transportation office or MBTA.com",
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
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'ma_resident',
    text: 'Are you a Massachusetts resident?',
    category: 'General',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
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
        questionId: 'student_status',
        values: ['full_time', 'part_time','future'],
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'mbta-specials',
    text: 'Are you blind, military, police, firefighter, government official?',
    category: 'General',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'mbta-disability',
    text: 'Do you have Medicare or a disability?',
    category: 'General',
    conditions: [
      {
        questionId: 'mbta-specials',
        values: ['no'],
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'mbta-program',
    text: 'Are you enrolled in an MBTA income-eligible program?',
    category: 'General',
    conditions: [
      {
        questionId: 'mbta-specials',
        values: ['no']
      },
      {
        questionId: 'mbta-disability',
        values: ['no']
      },
      {
        questionId: 'age',
        values: ['medium']
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'mbta-uni',
    text: 'Do you or will you attend any of these universities?(MBTA)',
    category: 'General',
    conditions: [
      {
        questionId: 'mbta-specials',
        values: ['no']
      },
      {
        questionId: 'mbta-disability',
        values: ['no']
      },
      {
        questionId: 'mbta-program',
        values: ['no']
      },
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
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'dependent_status',
    text: "Are you claimed as a dependent on someone else's tax return?",
    category: 'Financial',
    conditions: [
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time'],
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'work_study',
    text: 'Are you participating in Federal Work-Study?',
    category: 'Financial',
    conditions: [
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time'],
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'income_level',
    text: 'What is your estimated annual income?',
    category: 'Financial',
    options: [
      { label: 'Below $20,000', value: 'low' },
      { label: 'Between $20,000 and $40,000', value: 'medium' },
      { label: 'Above $40,000', value: 'high' },
    ],
  },
  {
    id: 'housing_status',
    text: 'What is your current living situation?',
    category: 'Housing',
    conditions: [
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time'],
      },
    ],
    options: [
      { label: 'On-campus housing', value: 'on_campus' },
      { label: 'Off-campus (renting)', value: 'off_campus' },
      { label: 'Living with family', value: 'family' },
    ],
  },
  {
    id: 'transportation',
    text: 'Do you use public transportation to get to school?',
    category: 'Transport',
    conditions: [
      {
        questionId: 'ma_resident',
        values: ['yes'],
      },
      {
        questionId: 'student_status',
        values: ['full_time', 'part_time'],
      },
    ],
    options: [
      { label: 'Yes, regularly', value: 'yes' },
      { label: 'Sometimes', value: 'sometimes' },
      { label: 'No', value: 'no' },
    ],
  },
];

/**
 * Checks if a question should be shown based on its conditions.
 * Uses AND logic: all conditions must be satisfied.
 */
export function shouldShowQuestion(question: Question, answers: Record<string, string>): boolean {
  if (!question.conditions || question.conditions.length === 0) {
    return true;
  }

  return question.conditions.every((condition) => {
    const answerValue = answers[condition.questionId];
    return answerValue && condition.values.includes(answerValue);
  });
}

/**
 * Gets the visible questions based on user answers.
 */
export function getVisibleQuestions(allQuestions: Question[], answers: Record<string, string>): Question[] {
  return allQuestions.filter((question) => shouldShowQuestion(question, answers));
}
