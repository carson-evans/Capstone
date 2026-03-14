export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  relatedBenefitIds?: string[];
  officialUrl?: string;
}

export const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is the Federal Pell Grant?',
    answer:
      'The Federal Pell Grant is federal gift aid for undergraduate students with financial need. It usually does not need to be repaid, and award amounts depend on factors such as your financial need, cost of attendance, and whether you attend full time or part time.',
    keywords: ['pell', 'federal grant', 'gift aid', 'tuition', 'full-time', 'part-time', 'sai'],
    relatedBenefitIds: ['pell-grant'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '2',
    question: 'What is MASSGrant and how do I qualify?',
    answer:
      'MASSGrant is Massachusetts need-based aid for eligible undergraduate students. In general, you must be a Massachusetts resident, file the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) or [MASFA](https://www.mass.edu/osfa/students/masfa.asp) each year by the applicable deadline, attend an eligible school, enroll full time in an eligible program, show financial need, and meet satisfactory academic progress requirements.',
    keywords: ['massgrant', 'state grant', 'resident', 'full-time', 'osfa', 'massachusetts aid'],
    relatedBenefitIds: ['massgrant'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '3',
    question: 'What is MASSGrant Plus?',
    answer:
      'MASSGrant Plus is Massachusetts aid designed to reduce tuition and fee costs for eligible students at public four-year colleges and universities. Eligibility depends on factors such as Massachusetts residency, financial need, school type, enrollment, and academic progress, and students are usually considered through the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) or [MASFA](https://www.mass.edu/osfa/students/masfa.asp).',
    keywords: ['massgrant plus', 'public college', 'umass', 'state university', 'tuition and fees'],
    relatedBenefitIds: ['massgrant-plus'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '4',
    question: 'How do I apply for MassHealth?',
    answer:
      'Most applicants can apply for or manage coverage online through the [Massachusetts Health Connector](https://www.mahix.org/individual/), and MassHealth can also help by phone. Be ready to provide information about your household, Massachusetts residency, income, and any other health coverage.',
    keywords: ['masshealth', 'medicaid', 'health insurance', 'health connector', 'apply'],
    relatedBenefitIds: ['masshealth'],
    officialUrl: 'https://www.mahix.org/individual/',
  },
  {
    id: '5',
    question: 'What MBTA discounts are available for students?',
    answer:
      'The MBTA offers institution-based pass programs, including semester and university programs, but availability depends on whether your school participates. Check the [MBTA student pass page](https://www.mbta.com/fares/college-student-semester-passes) and your campus transportation, commuter, or student affairs office to see which discounted pass options are available to you.',
    keywords: ['mbta', 't pass', 'semester pass', 'charliecard', 'transportation', 'commuter'],
    relatedBenefitIds: ['mbta-pass'],
    officialUrl: 'https://www.mbta.com/fares/college-student-semester-passes',
  },
  {
    id: '6',
    question: 'How do I apply for federal student aid?',
    answer:
      'Complete the [FAFSA through StudentAid.gov](https://studentaid.gov/h/apply-for-aid/fafsa). The FAFSA is the starting point for federal aid and is also used by many states and schools to determine eligibility for grants, loans, and work-study.',
    keywords: ['fafsa', 'student aid', 'financial aid', 'apply', 'studentaid'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '7',
    question: 'What types of federal student loans are available?',
    answer:
      'Main federal loan types include Direct Subsidized Loans, Direct Unsubsidized Loans, Direct PLUS Loans, and Direct Consolidation Loans. Subsidized loans are based on financial need, while unsubsidized loans are not. You can review the loan types on [StudentAid.gov](https://studentaid.gov/understand-aid/types/loans).',
    keywords: ['loans', 'subsidized', 'unsubsidized', 'plus', 'consolidation', 'borrow'],
    officialUrl: 'https://studentaid.gov/understand-aid/types/loans',
  },
  {
    id: '8',
    question: 'What is Federal Work-Study?',
    answer:
      'Federal Work-Study can help students with financial need earn money through part-time jobs. You usually indicate interest on the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa), then check with your school to see whether it participates and how work-study jobs are assigned.',
    keywords: ['work-study', 'job', 'campus job', 'part-time work', 'earn money'],
    officialUrl: 'https://studentaid.gov/understand-aid/types/work-study',
  },
  {
    id: '9',
    question: 'Can college students in Massachusetts qualify for SNAP?',
    answer:
      'Yes, some college students can qualify for SNAP. Eligibility depends on household circumstances, income, and program rules, and students enrolled at least half time may need to meet an additional student exemption. You can apply through [DTA Connect](https://dtaconnect.eohhs.mass.gov/), and DTA will tell you if more information is needed.',
    keywords: ['snap', 'food stamps', 'dta', 'dta connect', 'ebt', 'student exemption', 'half-time'],
    relatedBenefitIds: ['snap'],
    officialUrl: 'https://dtaconnect.eohhs.mass.gov/',
  },
  {
    id: '10',
    question: 'What is the difference between grants and scholarships?',
    answer:
      'Both are types of aid that usually do not need to be repaid. Grants are often based on financial need, while scholarships are often based on academics, talent, athletics, service, identity, or other criteria.',
    keywords: ['grant', 'scholarship', 'gift aid', 'merit aid', 'need-based'],
  },
  {
    id: '11',
    question: 'Who is eligible for federal student aid?',
    answer:
      'Federal student aid eligibility depends on factors such as citizenship or eligible noncitizen status, enrollment in an eligible program, satisfactory academic progress, and other federal requirements. Completing the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) is the main way to be considered.',
    keywords: ['eligible', 'citizenship', 'noncitizen', 'sap', 'federal aid'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '12',
    question: 'When are FAFSA deadlines?',
    answer:
      'The federal [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) deadline is later than many school and state priority deadlines, so it is best to file as early as you can. Check both your school financial aid deadlines and current Massachusetts aid deadlines so you do not miss grant consideration.',
    keywords: ['deadline', 'priority deadline', 'late', 'when', 'state deadline', 'school deadline'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '13',
    question: 'Are there other Massachusetts-specific benefits for students?',
    answer:
      'Yes. Massachusetts has additional grants, tuition waivers, and state aid programs beyond MASSGrant, and many schools also offer institution-specific support. Your financial aid office can help you identify programs that fit your residency, enrollment level, and family circumstances.',
    keywords: ['massachusetts benefits', 'state aid', 'tuition waiver', 'additional aid', 'local programs'],
  },
  {
    id: '14',
    question: 'Do I need to submit the FAFSA every year?',
    answer:
      'Yes. Federal Student Aid says you complete the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) once per academic year, and Massachusetts state programs such as MASSGrant also require students to apply again each year to be considered.',
    keywords: ['renew fafsa', 'each year', 'reapply', 'annual application', 'yearly'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '15',
    question: 'Can I correct my FAFSA after I submit it?',
    answer:
      'Usually yes. After your [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) is processed, you can make certain corrections online, such as fixing typos, updating contact information, or adding schools. Some financial changes must be handled through your school financial aid office instead.',
    keywords: ['edit fafsa', 'change fafsa', 'correction', 'add school', 'fix mistake'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  },
  {
    id: '16',
    question: 'What if I cannot complete the FAFSA because of my immigration or citizenship status?',
    answer:
      'Massachusetts offers the [MASFA](https://www.mass.edu/osfa/students/masfa.asp) for students who are ineligible or unable to complete the FAFSA but may still qualify for in-state tuition rates and state financial aid. Students should complete only one application, [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) or MASFA, depending on eligibility.',
    keywords: ['masfa', 'immigration', 'citizenship', 'noncitizen', 'undocumented', 'state financial aid'],
    officialUrl: 'https://www.mass.edu/osfa/students/masfa.asp',
  },
  {
    id: '17',
    question: 'Do parents or other contributors need their own FAFSA accounts?',
    answer:
      'Yes. Federal Student Aid says each contributor on the FAFSA needs their own [StudentAid.gov account](https://studentaid.gov/fafsa-apply/parents) to access and complete their section. Students should not share accounts with parents or spouses.',
    keywords: ['contributors', 'parents', 'fsa id', 'studentaid account', 'separate account', 'invite'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/fafsa-apply/parents',
  },
  {
    id: '18',
    question: 'Do I need to renew MassHealth or report changes after I enroll?',
    answer:
      'Yes. MassHealth reviews coverage regularly, and members must report changes such as address, phone number, email, or income as soon as possible and no later than 10 days after the change. If you receive a renewal notice, respond by the deadline to avoid losing coverage, and use the [MassHealth reporting page](https://www.mass.gov/how-to/report-changes-to-masshealth) when you need to submit updates.',
    keywords: ['renew masshealth', 'report changes', 'income change', 'address change', 'coverage renewal'],
    relatedBenefitIds: ['masshealth'],
    officialUrl: 'https://www.mass.gov/how-to/report-changes-to-masshealth',
  },
  {
    id: '19',
    question: 'Can I manage my SNAP case online after I apply?',
    answer:
      'Yes. [DTA Connect](https://dtaconnect.eohhs.mass.gov/) lets many Massachusetts residents check case status, upload documents, read notices, update contact information, request an EBT card, and complete required check-ins online.',
    keywords: ['manage snap', 'dta connect', 'upload documents', 'case status', 'ebt card', 'notices'],
    relatedBenefitIds: ['snap'],
    officialUrl: 'https://dtaconnect.eohhs.mass.gov/',
  },
  {
    id: '20',
    question: 'Can I get Massachusetts state aid if I attend college outside Massachusetts?',
    answer:
      'Sometimes. Massachusetts says some state aid programs, including MASSGrant, may transfer to approved schools in states that have reciprocity agreements with Massachusetts. Check with OSFA and your school financial aid office before assuming you qualify.',
    keywords: ['out-of-state', 'reciprocity', 'vermont', 'pennsylvania', 'district of columbia', 'transfer aid'],
    relatedBenefitIds: ['massgrant'],
  },
  {
    id: '21',
    question: 'What if my financial situation changes after I file the FAFSA?',
    answer:
      'If your family finances change significantly after filing, contact your school financial aid office. [Federal Student Aid](https://studentaid.gov/articles/things-after-fafsa/) explains that some changes are not handled directly through the FAFSA correction flow and may need to be reviewed by the school.',
    keywords: ['special circumstances', 'income change', 'job loss', 'appeal', 'professional judgment'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    officialUrl: 'https://studentaid.gov/articles/things-after-fafsa/',
  },
  {
    id: '22',
    question: 'Can part-time students still get aid?',
    answer:
      'Yes, but eligibility depends on the program. Some aid, such as Pell, can depend on enrollment status, while some Massachusetts programs have full-time requirements and others may not. Review your aid offer and ask your financial aid office which programs match your enrollment level.',
    keywords: ['part-time', 'half-time', 'less than full-time', 'enrollment status', 'reduced course load'],
    relatedBenefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
  },
];
