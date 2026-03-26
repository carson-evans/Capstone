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
    text: 'Are you currently enrolled in a college or university? If you plan to enroll in the future, select “Yes” and choose full-time or part-time.',
    category: 'General',
    options: [
      { label: 'Yes, full-time', value: 'full_time' },
      { label: 'Yes, part-time', value: 'part_time' },
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
    text: 'How long have you lived in Massachusetts (MA)?',
    category: 'General',
    conditions: [
      {
      questionId : 'ma_resident',
      values: ['yes']
      }
    ],
    options: [
      { label: '0', value: '0' },
      { label: 'At least 1 year', value: '1_plus' },
    ],
  },

  {
    id: 'planning_move_ma',
    text: 'Are you planning on moving to Massachusetts?',
    category: 'General',
    // Only ask if the user indicated 0 years living in MA.
    conditions: [
      {
        questionId: 'residency_length',
        values: ['0'],
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'fafsa_completed',
    text: 'Have you completed the FAFSA for the current academic year?',
    category: 'Financial',
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
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'citizen_status',
    text: 'Do you have lawful presence in the United States now or will you have lawful presence in the future?',
    category: 'General',
    // Show citizenship only after the user answers the FAFSA question.
    conditions: [
      {
        questionId: 'fafsa_completed',
        values: ['yes', 'no'],
      },
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'age',
    text: 'Choose your age group?',
    category: 'General',
    // Show age only after the user answers the FAFSA question.
    conditions: [
      {
        questionId: 'fafsa_completed',
        values: ['yes', 'no'],
      },
    ],
    options: [
      { label: 'Under 18', value: 'low' },
      { label: '18 to 64', value: 'medium' },
      { label: 'Over 64', value: 'high' },
    ],
  },

  {
  id: 'efc_level',
  text: 'What is your Expected Family Contribution (EFC) from FAFSA?',
  category: 'Financial',
  conditions: [
    {
        questionId: 'student_status',
        values: ['full_time', 'part_time'],
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
      values: ['full_time', 'part_time'],
    }
  ],
  options: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
  },

  {
    id: 'mbta_special_role',
    text: 'If MBTA was selected, are you one of the following: blind, military, police, firefighter, or government official?',
    category: 'General',
    conditions: [
      {
        questionId: 'mbta-uni',
        values: ['yes'],
      },
    ],
    options: [
      { label: 'Blind', value: 'blind' },
      { label: 'Military', value: 'military' },
      { label: 'Police', value: 'police' },
      { label: 'Firefighter', value: 'firefighter' },
      { label: 'Government official', value: 'govt_official' },
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
        values: ['full_time', 'part_time'],
      }
    ],
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },

  {
    id: 'dependent_status',
    text: "Are you claimed as a dependent on someone else's tax return?",
    category: 'Financial',
    conditions:[
      {
        questionId: 'citizen_status',
        values: ['yes'],
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
  },

  {
    id: 'housing_status',
    text: 'What is or will be your living situation while attending college/university?',
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

/**
 * Checks if a question should be shown based on its conditions.
 * Uses AND logic: all conditions must be satisfied.
 */
export function shouldShowQuestion(question: Question, answers: Record<string, string>): boolean {
  // Gate all additional screener questions behind enrollment status.
  // Requirement: only show follow-up questions if the user selected half-time or full-time enrollment.
  if (question.id !== 'student_status') {
    const status = answers['student_status'];
    const isEnrolledHalfOrFull = status === 'full_time' || status === 'part_time';
    if (!isEnrolledHalfOrFull) return false;
  }

  // Screener is only for Massachusetts residents (current or future).
  // If the user indicates "no" at the appropriate MA step, hide all remaining questions.
  const maResident = answers['ma_resident'];
  const residencyLength = answers['residency_length']; // '0' | '1_plus'
  const planningMoveMA = answers['planning_move_ma']; // 'yes' | 'no'

  // Question ids we allow to remain visible while MA eligibility is being determined.
  // Keep this minimal so that when the user answers "No", the screener truly ends.
  const maDecisionAllowlist = new Set([
    'student_status',
    'ma_resident',
    'residency_length',
    'planning_move_ma',
  ]);

  // If they are not (current/future) MA eligible, stop the flow.
  if (maResident === 'no' && !maDecisionAllowlist.has(question.id)) {
    return false;
  }

  // If they have 0 years living in MA, require an explicit "Yes" to proceed.
  if (residencyLength === '0' && planningMoveMA !== 'yes' && !maDecisionAllowlist.has(question.id)) {
    return false;
  }

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
