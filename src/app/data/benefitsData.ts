export interface Benefit {
  id: string;
  title: string;
  description: string;
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
}

export const benefits: Benefit[] = [
  {
    id: 'pell-grant',
    title: 'Federal Pell Grant',
    description: 'A subsidy the U.S. federal government provides for students who need it to pay for college.',
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
      { label: 'No', value: 'no' },
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
    id: 'fafsa_completed',
    text: 'Have you completed the FAFSA for the current academic year?',
    category: 'Financial',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'dependent_status',
    text: "Are you claimed as a dependent on someone else's tax return?",
    category: 'Financial',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'work_study',
    text: 'Are you participating in Federal Work-Study?',
    category: 'Financial',
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
    options: [
      { label: 'Yes, regularly', value: 'yes' },
      { label: 'Sometimes', value: 'sometimes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'health_insurance',
    text: 'Do you currently have health insurance?',
    category: 'Health',
    options: [
      { label: 'Yes, through parents', value: 'parents' },
      { label: 'Yes, through school', value: 'school' },
      { label: 'No', value: 'no' },
    ],
  },
];