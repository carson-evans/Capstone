import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(
  __dirname,
  '..',
  'src',
  'app',
  'data',
  'chatbotKnowledge.generated.json'
);

const SOURCE_MANIFEST = [
  {
    id: 'pell-article',
    url: 'https://studentaid.gov/articles/dont-miss-out-on-pell-grants/',
    fallbackTitle: "Don't Miss Out on Federal Pell Grants - Federal Student Aid",
  },
  {
    id: 'fafsa-steps',
    url: 'https://studentaid.gov/articles/fafsa-student-steps/',
    fallbackTitle: 'Steps for Students Filling Out the FAFSA Form - Federal Student Aid',
  },
  {
    id: 'fafsa-checklist',
    url: 'https://studentaid.gov/articles/things-you-need-for-fafsa/',
    fallbackTitle: 'FAFSA Checklist: What Students Need - Federal Student Aid',
  },
  {
    id: 'fafsa-2026-form',
    url: 'https://studentaid.gov/sites/default/files/2026-27-fafsa-form.pdf',
    fallbackTitle: '2026-27 FAFSA Form',
  },
  {
    id: 'fafsa-deadlines',
    url: 'https://studentaid.gov/articles/3-fafsa-deadlines/',
    fallbackTitle: '3 FAFSA Deadlines You Need To Know Now - Federal Student Aid',
  },
  {
    id: 'fafsa-summary',
    url: 'https://studentaid.gov/articles/fafsa-submission-summary/',
    fallbackTitle: 'FAFSA Submission Summary: What You Need To Know - Federal Student Aid',
  },
  {
    id: 'fafsa-accounts',
    url: 'https://studentaid.gov/articles/key-facts-accounts/',
    fallbackTitle: 'Key Facts About Your StudentAid.gov Account - Federal Student Aid',
  },
  {
    id: 'fafsa-parents',
    url: 'https://studentaid.gov/articles/fafsa-for-parents/',
    fallbackTitle: 'Completing the FAFSA Form: Steps for Parents - Federal Student Aid',
  },
  {
    id: 'masfa',
    url: 'https://www.mass.edu/osfa/students/masfa.asp',
    fallbackTitle: 'Massachusetts Application for State Financial Aid (MASFA)',
  },
  {
    id: 'massgrant',
    url: 'https://www.mass.edu/osfa/programs/massgrant.asp',
    fallbackTitle: 'MASSGrant - Office of Student Financial Assistance',
  },
  {
    id: 'massgrant-award-terms',
    url: 'https://www.mass.edu/osfa/programs/massgrantawardterms.asp',
    fallbackTitle: 'MASSGrant Award Terms & Conditions',
  },
  {
    id: 'massgrant-plus',
    url: 'https://www.mass.edu/osfa/programs/massgrantplus.asp',
    fallbackTitle: 'MASSGrant Plus - Office of Student Financial Assistance',
  },
  {
    id: 'part-time-grant',
    url: 'https://www.mass.edu/osfa/programs/parttime.asp',
    fallbackTitle: 'Part-Time Grant Program - Office of Student Financial Assistance',
  },
  {
    id: 'snap-apply',
    url: 'https://www.mass.gov/how-to/apply-for-snap-benefits-food-stamps',
    fallbackTitle: 'Apply for SNAP Benefits - Mass.gov',
  },
  {
    id: 'snap-verifications',
    url: 'https://www.mass.gov/info-details/snap-verifications-what-information-you-need-to-provide',
    fallbackTitle: 'SNAP Verifications - Mass.gov',
  },
  {
    id: 'snap-case',
    url: 'https://dtaconnect.eohhs.mass.gov/',
    fallbackTitle: 'DTA Connect',
  },
  {
    id: 'masshealth-apply',
    url: 'https://www.mass.gov/how-to/apply-for-masshealth-the-health-safety-net-or-the-childrens-medical-security-plan',
    fallbackTitle: 'Apply for MassHealth, the Health Safety Net, or the Children\'s Medical Security Plan',
  },
  {
    id: 'masshealth-report',
    url: 'https://www.mass.gov/how-to/report-changes-to-masshealth',
    fallbackTitle: 'Report changes to MassHealth',
  },
  {
    id: 'mbta-student-pass',
    url: 'https://www.mbta.com/fares/college-student-semester-passes',
    fallbackTitle: 'MBTA College Student Semester Passes',
  },
  {
    id: 'mbta-university-terms',
    url: 'https://passprogram.mbta.com/Account/Signup.aspx?p=8',
    fallbackTitle: 'MBTA University Pass Program Terms',
  },
];

const CURATED_RECORDS = [
  {
    id: 'pell-overview',
    sourceId: 'pell-article',
    benefitIds: ['pell-grant'],
    topic: 'Federal Pell Grant basics',
    intents: ['what-is', 'eligibility'],
    aliases: ['pell grant', 'federal pell', 'federal grant', 'gift aid'],
    questionPatterns: [
      'what is the federal pell grant',
      'what is pell grant',
      'what is pell',
    ],
    answer:
      'The Federal Pell Grant is federal gift aid for undergraduate students with financial need. It usually does not need to be repaid.',
    supportingDetails: [
      'Federal Student Aid says Pell is aimed at undergraduate students and is considered through the FAFSA.',
      'Schools determine the final award using FAFSA information, enrollment intensity, and cost of attendance.',
    ],
    officialUrl: 'https://studentaid.gov/articles/dont-miss-out-on-pell-grants/',
    officialLabel: 'Open Pell Grant guide',
    timeSensitive: false,
  },
  {
    id: 'pell-amount-2026-27',
    sourceId: 'pell-article',
    benefitIds: ['pell-grant'],
    topic: 'Federal Pell Grant amount',
    intents: ['amount'],
    aliases: ['pell amount', 'how much pell', 'pell maximum', 'pell award amount'],
    questionPatterns: [
      'how much can pell cover',
      'how much is pell',
      'what is the maximum pell grant',
      'how much can i get from pell',
    ],
    answer:
      'For the 2026-27 award year, the maximum Federal Pell Grant is $7,395.',
    supportingDetails: [
      'Some students can receive up to 150% of their scheduled yearly award through year-round Pell if they attend an additional term in the same award year.',
      'Your actual Pell amount depends on FAFSA results, enrollment intensity, and your school cost of attendance.',
    ],
    officialUrl: 'https://studentaid.gov/articles/dont-miss-out-on-pell-grants/',
    officialLabel: 'Open Pell amount details',
    academicYear: '2026-27',
    timeSensitive: true,
  },
  {
    id: 'pell-bachelors-eligibility',
    sourceId: 'pell-article',
    benefitIds: ['pell-grant'],
    topic: 'Pell Grant and prior bachelor\'s degree',
    intents: ['eligibility'],
    aliases: ['bachelor degree pell', 'already have a degree pell', 'pell after bachelor'],
    questionPatterns: [
      'can i still get pell if i already have a bachelor degree',
      'can you get pell with a bachelor degree',
      'do i qualify for pell if i already graduated college',
    ],
    answer:
      'Usually no. Federal Student Aid says Pell Grants are typically for undergraduate students who have not earned a bachelor\'s, graduate, or professional degree.',
    supportingDetails: [
      'If you already earned one of those degrees, Pell usually would not be the main federal grant path.',
    ],
    officialUrl: 'https://studentaid.gov/articles/dont-miss-out-on-pell-grants/',
    officialLabel: 'Open Pell eligibility guide',
    timeSensitive: false,
  },
  {
    id: 'fafsa-apply',
    sourceId: 'fafsa-steps',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: 'How to apply through FAFSA',
    intents: ['apply'],
    aliases: ['apply fafsa', 'start fafsa', 'fill out fafsa', 'student aid application'],
    questionPatterns: [
      'how do i apply for fafsa',
      'how do i apply for federal student aid',
      'where do i fill out fafsa',
    ],
    answer:
      'To apply for federal student aid, complete the FAFSA through StudentAid.gov.',
    supportingDetails: [
      'Federal Student Aid says the FAFSA is also used by many states and schools to determine aid eligibility.',
      'The FAFSA is free to complete, and most students can finish it in under 30 minutes once their information is ready.',
    ],
    officialUrl: 'https://studentaid.gov/h/apply-for-aid/fafsa',
    officialLabel: 'Start FAFSA',
    timeSensitive: false,
  },
  {
    id: 'fafsa-documents',
    sourceId: 'fafsa-checklist',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: 'FAFSA document checklist',
    intents: ['documents', 'apply'],
    aliases: ['fafsa documents', 'what do i need for fafsa', 'fafsa checklist'],
    questionPatterns: [
      'what documents do i need for fafsa',
      'what do i need to fill out the fafsa',
      'what should i have before starting fafsa',
    ],
    answer:
      'Students usually need their StudentAid.gov account, contributor information, federal tax return data, records of child support received, records of assets, and a list of schools they are considering.',
    supportingDetails: [
      'Federal Student Aid says contributors also need their own account plus their required tax and financial information.',
    ],
    officialUrl: 'https://studentaid.gov/articles/things-you-need-for-fafsa/',
    officialLabel: 'Open FAFSA checklist',
    academicYear: '2026-27',
    timeSensitive: true,
  },
  {
    id: 'fafsa-contributors',
    sourceId: 'fafsa-accounts',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: 'FAFSA contributors need their own accounts',
    intents: ['status', 'apply'],
    aliases: ['contributors', 'parent account', 'fafsa parent login', 'own studentaid account'],
    questionPatterns: [
      'do parents need their own fafsa accounts',
      'does each contributor need their own studentaid account',
      'can i share my fafsa account with my parent',
    ],
    answer:
      'Yes. Each FAFSA contributor must have their own StudentAid.gov account to access and sign their section.',
    supportingDetails: [
      'That includes the student and any required parent, spouse, or stepparent contributor.',
      'StudentAid.gov accounts should not be shared.',
    ],
    officialUrl: 'https://studentaid.gov/articles/key-facts-accounts/',
    officialLabel: 'Open StudentAid.gov account guide',
    academicYear: '2026-27',
    timeSensitive: true,
  },
  {
    id: 'fafsa-corrections',
    sourceId: 'fafsa-summary',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: 'Correcting the FAFSA',
    intents: ['status', 'after-submit'],
    aliases: ['fix fafsa', 'edit fafsa', 'correct fafsa', 'change fafsa after submit'],
    questionPatterns: [
      'can i fix my fafsa after i submit it',
      'can i correct my fafsa after submitting it',
      'how do i change my fafsa after submission',
    ],
    answer:
      'Yes. After your FAFSA is processed, you can usually fix mistakes by using the "Make a Correction" option in your FAFSA Submission Summary or from the details page of your processed form.',
    supportingDetails: [
      'Online corrections can include typos, missing signatures, contact info, and adding or removing schools.',
      'If your financial situation changed after filing, contact your school\'s financial aid office instead of relying only on an online correction.',
    ],
    officialUrl: 'https://studentaid.gov/articles/fafsa-submission-summary/',
    officialLabel: 'Open FAFSA correction guide',
    timeSensitive: false,
  },
  {
    id: 'fafsa-after-submit',
    sourceId: 'fafsa-summary',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: 'What happens after FAFSA submission',
    intents: ['after-submit', 'status'],
    aliases: ['after submitting fafsa', 'fafsa submission summary', 'what happens next fafsa'],
    questionPatterns: [
      'what happens after i submit fafsa',
      'what should i do after fafsa',
      'how do i check my fafsa after submitting it',
    ],
    answer:
      'After you submit the FAFSA, review your FAFSA Submission Summary and any next steps in your StudentAid.gov account.',
    supportingDetails: [
      'Federal Student Aid says the processed summary is usually available about 1 to 3 business days after a completed submission.',
      'The summary shows your Student Aid Index, estimated Pell eligibility, school list, and any correction or verification alerts.',
    ],
    officialUrl: 'https://studentaid.gov/articles/fafsa-submission-summary/',
    officialLabel: 'Open FAFSA Submission Summary guide',
    timeSensitive: false,
  },
  {
    id: 'fafsa-deadline-2026-27',
    sourceId: 'fafsa-2026-form',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: '2026-27 FAFSA deadline',
    intents: ['deadline'],
    aliases: ['fafsa deadline', 'when is fafsa due', '2026 27 fafsa deadline'],
    questionPatterns: [
      'what is the fafsa deadline for 2026-27',
      'when is fafsa due for 2026 27',
      'fafsa federal deadline 2026-27',
    ],
    answer:
      'For the 2026-27 FAFSA, the federal deadline is June 30, 2027. State and school deadlines can be much earlier.',
    supportingDetails: [
      'The 2026-27 FAFSA form says students can submit as early as possible for that award year, but not later than June 30, 2027 for federal aid.',
      'Federal Student Aid also says school and state priority deadlines often arrive before the federal cutoff.',
    ],
    officialUrl: 'https://studentaid.gov/sites/default/files/2026-27-fafsa-form.pdf',
    officialLabel: 'Open 2026-27 FAFSA deadline source',
    academicYear: '2026-27',
    effectiveDate: '2027-06-30',
    timeSensitive: true,
  },
  {
    id: 'masfa-overview',
    sourceId: 'masfa',
    benefitIds: ['massgrant', 'massgrant-plus'],
    topic: 'MASFA basics',
    intents: ['what-is', 'eligibility', 'apply'],
    aliases: ['masfa', 'massachusetts state financial aid application', 'tuition equity application'],
    questionPatterns: [
      'what is masfa',
      'who should complete masfa',
      'what if i cannot complete fafsa because of immigration status',
    ],
    answer:
      'MASFA is the Massachusetts Application for State Financial Aid. It is for students who are ineligible or unable to complete the FAFSA but may still qualify for Massachusetts state financial aid and in-state tuition consideration.',
    supportingDetails: [
      'Massachusetts says students should complete only one application: FAFSA or MASFA.',
      'Eligible MASFA students generally need 3 years of Massachusetts high school, a Massachusetts diploma or equivalent, and at least 1 year of Massachusetts residency.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/students/masfa.asp',
    officialLabel: 'Open MASFA page',
    academicYear: '2026-27',
    timeSensitive: true,
  },
  {
    id: 'masfa-deadline-2026-27',
    sourceId: 'masfa',
    benefitIds: ['massgrant', 'massgrant-plus'],
    topic: '2026-27 MASFA deadline',
    intents: ['deadline'],
    aliases: ['masfa deadline', 'when is masfa due', '2026 27 masfa deadline'],
    questionPatterns: [
      'what is the masfa deadline for 2026-27',
      'when is masfa due for 2026 27',
      'masfa priority deadline',
    ],
    answer:
      'For priority consideration, the 2026-27 MASFA should be completed before May 1, 2026.',
    supportingDetails: [
      'The MASFA page says the 2026-27 application is for students enrolled during Fall 2026, Spring 2027, and/or Summer 2027.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/students/masfa.asp',
    officialLabel: 'Open MASFA deadline page',
    academicYear: '2026-27',
    effectiveDate: '2026-05-01',
    timeSensitive: true,
  },
  {
    id: 'fafsa-vs-masfa',
    sourceId: 'masfa',
    benefitIds: ['pell-grant', 'massgrant', 'massgrant-plus'],
    topic: 'FAFSA vs MASFA',
    intents: ['difference', 'apply'],
    aliases: ['fafsa vs masfa', 'difference between fafsa and masfa', 'which application should i use'],
    questionPatterns: [
      'what is the difference between fafsa and masfa',
      'fafsa vs masfa',
      'should i fill out fafsa or masfa',
    ],
    answer:
      'FAFSA is the federal student aid application. MASFA is Massachusetts\'s state-aid application for certain students who cannot use the FAFSA.',
    supportingDetails: [
      'Massachusetts says students should complete only one of the two, not both.',
      'FAFSA can open federal aid plus many state and school programs, while MASFA is for qualifying Massachusetts state-aid and in-state tuition pathways.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/students/masfa.asp',
    officialLabel: 'Open FAFSA vs MASFA guidance',
    academicYear: '2026-27',
    timeSensitive: true,
  },
  {
    id: 'massgrant-overview',
    sourceId: 'massgrant',
    benefitIds: ['massgrant'],
    topic: 'MASSGrant basics',
    intents: ['what-is', 'eligibility'],
    aliases: ['massgrant', 'state grant', 'massachusetts state grant'],
    questionPatterns: [
      'what is massgrant',
      'how does massgrant work',
      'what is the state grant in massachusetts',
    ],
    answer:
      'MASSGrant is need-based Massachusetts aid for eligible undergraduates who live in Massachusetts and attend approved institutions.',
    supportingDetails: [
      'OSFA says the standard MASSGrant page requires full-time enrollment of at least 12 credits.',
      'Students must apply each year through FAFSA, or an alternative DHE-designated application path such as MASFA when applicable.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/massgrant.asp',
    officialLabel: 'Open MASSGrant page',
    timeSensitive: false,
  },
  {
    id: 'massgrant-degree-full-time',
    sourceId: 'massgrant-award-terms',
    benefitIds: ['massgrant'],
    topic: 'MASSGrant enrollment and prior degree rules',
    intents: ['eligibility'],
    aliases: ['massgrant bachelor degree', 'massgrant full-time requirement', 'massgrant 12 credits'],
    questionPatterns: [
      'does massgrant require full time enrollment',
      'can i get massgrant if i already have a bachelor degree',
      'what are the massgrant enrollment rules',
    ],
    answer:
      'Standard MASSGrant generally requires full-time undergraduate enrollment and no prior bachelor\'s degree.',
    supportingDetails: [
      'OSFA lists full-time as at least 12 credits or the equivalent.',
      'Students also must meet residency, citizenship or approved Tuition Equity status, financial need, and satisfactory academic progress rules.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/massgrantawardterms.asp',
    officialLabel: 'Open MASSGrant terms',
    academicYear: '2025-26',
    timeSensitive: true,
  },
  {
    id: 'massgrant-reciprocity',
    sourceId: 'massgrant',
    benefitIds: ['massgrant'],
    topic: 'MASSGrant outside Massachusetts',
    intents: ['eligibility'],
    aliases: ['massgrant outside massachusetts', 'massgrant out of state', 'massgrant reciprocity'],
    questionPatterns: [
      'does massgrant work outside massachusetts',
      'can i use massgrant out of state',
      'what states accept massgrant',
    ],
    answer:
      'Sometimes. MASSGrant can also be used at certain approved institutions in Vermont, Pennsylvania, and the District of Columbia that have reciprocity agreements with Massachusetts.',
    supportingDetails: [
      'OSFA says those schools must be approved nonprofit institutions that award associate\'s and/or bachelor\'s degrees.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/massgrant.asp',
    officialLabel: 'Open MASSGrant reciprocity details',
    timeSensitive: false,
  },
  {
    id: 'massgrant-plus-overview',
    sourceId: 'massgrant-plus',
    benefitIds: ['massgrant-plus'],
    topic: 'MASSGrant Plus basics',
    intents: ['what-is', 'eligibility'],
    aliases: ['massgrant plus', 'massgrant+', 'public university grant'],
    questionPatterns: [
      'what is massgrant plus',
      'how does massgrant plus work',
      'what does massgrant plus cover',
    ],
    answer:
      'MASSGrant Plus is Massachusetts aid aimed at reducing tuition and fee costs at eligible public four-year colleges and universities in the state.',
    supportingDetails: [
      'For students under roughly $85,000 family income, the program can cover full tuition and fees and provide up to $1,200 for books and supplies.',
      'Students in the approximately $85,000 to $100,000 range may qualify for partial tuition and fee relief if they are full-time.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/massgrantplus.asp',
    officialLabel: 'Open MASSGrant Plus page',
    timeSensitive: false,
  },
  {
    id: 'massgrant-plus-credits',
    sourceId: 'massgrant-plus',
    benefitIds: ['massgrant-plus'],
    topic: 'MASSGrant Plus credit requirements',
    intents: ['eligibility', 'amount', 'part-time'],
    aliases: [
      'massgrant plus credits',
      'massgrant plus 85000 100000',
      'massgrant plus 90000 income',
      'how many credits massgrant plus',
      '12 credits massgrant plus',
      '90000',
      '90 000',
    ],
    questionPatterns: [
      'how many credits do i need for massgrant plus if my family income is around 90000',
      'how many credits do i need for massgrant plus if my family income is around 90 000',
      'what are the credit requirements for massgrant plus',
      'can part-time students get massgrant plus',
      'massgrant plus 90000 credits',
    ],
    answer:
      'If family income is between about $85,000 and $100,000 per year before taxes, MASSGrant Plus requires at least 12 credits per term. If family income is under about $85,000, the minimum is 6 credits per term.',
    supportingDetails: [
      'Students also must attend an eligible public four-year institution, file FAFSA or MASFA as applicable, and not already hold a bachelor\'s degree.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/massgrantplus.asp',
    officialLabel: 'Open MASSGrant Plus eligibility details',
    timeSensitive: false,
  },
  {
    id: 'massgrant-plus-schools',
    sourceId: 'massgrant-plus',
    benefitIds: ['massgrant-plus'],
    topic: 'MASSGrant Plus participating schools',
    intents: ['eligibility'],
    aliases: ['massgrant plus schools', 'umass massgrant plus', 'participating public universities'],
    questionPatterns: [
      'what schools participate in massgrant plus',
      'does umass offer massgrant plus',
      'which colleges are eligible for massgrant plus',
    ],
    answer:
      'MASSGrant Plus is primarily awarded at Massachusetts state universities and UMass campuses, including UMass Amherst, Boston, Dartmouth, and Lowell.',
    supportingDetails: [
      'The official page also lists participating state universities such as Bridgewater State, Salem State, Westfield State, and Worcester State.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/massgrantplus.asp',
    officialLabel: 'View participating MASSGrant Plus schools',
    timeSensitive: false,
  },
  {
    id: 'part-time-state-aid',
    sourceId: 'part-time-grant',
    benefitIds: ['massgrant', 'massgrant-plus'],
    topic: 'Massachusetts part-time state aid',
    intents: ['eligibility', 'part-time'],
    aliases: ['part time grant', 'massachusetts part-time grant', 'part time state aid'],
    questionPatterns: [
      'can part-time students get massachusetts state aid',
      'is there a state grant for part-time students in massachusetts',
      'can part-time students still get aid',
    ],
    answer:
      'Yes. Massachusetts has an official Part-Time Grant Program for eligible students who enroll in at least 6 but fewer than 12 undergraduate credits per term.',
    supportingDetails: [
      'The program requires Massachusetts residency, financial need, no prior bachelor\'s or professional degree, and FAFSA or another DHE-authorized equivalent application.',
      'MASSGrant Plus can also support some part-time students when family income is under about $85,000, while the standard MASSGrant page lists full-time enrollment as the default rule.',
    ],
    officialUrl: 'https://www.mass.edu/osfa/programs/parttime.asp',
    officialLabel: 'Open Part-Time Grant details',
    timeSensitive: false,
  },
  {
    id: 'snap-student-eligibility',
    sourceId: 'snap-apply',
    benefitIds: ['snap'],
    topic: 'SNAP for college students',
    intents: ['eligibility', 'what-is'],
    aliases: ['snap student eligibility', 'food stamps student', 'college student snap', 'ebt student'],
    questionPatterns: [
      'can college students in massachusetts qualify for snap',
      'how does snap work for college students',
      'can students get food stamps',
    ],
    answer:
      'Some college students in Massachusetts can qualify for SNAP, but students enrolled at least half time may need to meet an additional student exemption.',
    supportingDetails: [
      'DTA Connect is the main online hub for applying and managing the case.',
    ],
    officialUrl: 'https://www.mass.gov/how-to/apply-for-snap-benefits-food-stamps',
    officialLabel: 'Open SNAP application page',
    timeSensitive: false,
  },
  {
    id: 'snap-apply',
    sourceId: 'snap-apply',
    benefitIds: ['snap'],
    topic: 'How to apply for SNAP',
    intents: ['apply', 'status'],
    aliases: ['apply snap', 'apply for food stamps', 'dta connect apply'],
    questionPatterns: [
      'how do i apply for snap',
      'where do i apply for food stamps in massachusetts',
      'how do i start a snap application',
    ],
    answer:
      'Apply for SNAP through DTA Connect or the Massachusetts SNAP application page.',
    supportingDetails: [
      'Mass.gov says DTA will send a decision within 30 days after you apply, and some people can qualify for an expedited decision within 7 days.',
    ],
    officialUrl: 'https://dtaconnect.eohhs.mass.gov/',
    officialLabel: 'Start SNAP application',
    sourceUrl: 'https://www.mass.gov/how-to/apply-for-snap-benefits-food-stamps',
    timeSensitive: false,
  },
  {
    id: 'snap-documents',
    sourceId: 'snap-verifications',
    benefitIds: ['snap'],
    topic: 'SNAP verification documents',
    intents: ['documents', 'apply'],
    aliases: ['snap documents', 'food stamps documents', 'snap verification', 'what do i need for snap'],
    questionPatterns: [
      'what documents do i need for snap',
      'what verifications do i need for snap',
      'what do i need to submit with my snap application',
    ],
    answer:
      'Common SNAP verifications include identity, Social Security number if you have one, proof of Massachusetts residency, income details, and other household information that applies to your case.',
    supportingDetails: [
      'Mass.gov says the more verifications you submit with the application, the sooner DTA can decide.',
      'A lease can sometimes verify shelter expense, Massachusetts residency, and who lives with you.',
    ],
    officialUrl: 'https://www.mass.gov/info-details/snap-verifications-what-information-you-need-to-provide',
    officialLabel: 'Open SNAP verification list',
    timeSensitive: false,
  },
  {
    id: 'snap-manage-case',
    sourceId: 'snap-case',
    benefitIds: ['snap'],
    topic: 'Manage a SNAP case online',
    intents: ['status'],
    aliases: ['manage snap case', 'snap case status', 'upload snap documents', 'dta connect case'],
    questionPatterns: [
      'can i manage my snap case online after i apply',
      'can i check my snap case online',
      'what can i do in dta connect',
    ],
    answer:
      'Yes. DTA Connect lets many Massachusetts residents check case status, upload documents, read notices, update contact information, request an EBT card, and complete required check-ins online.',
    supportingDetails: [],
    officialUrl: 'https://dtaconnect.eohhs.mass.gov/',
    officialLabel: 'Open DTA Connect',
    timeSensitive: false,
  },
  {
    id: 'snap-amount',
    sourceId: 'snap-apply',
    benefitIds: ['snap'],
    topic: 'SNAP benefit amount',
    intents: ['amount'],
    aliases: ['snap amount', 'how much snap', 'ebt amount', 'food stamp amount'],
    questionPatterns: [
      'how much can i get from snap',
      'how much is snap',
      'how are snap benefits calculated',
    ],
    answer:
      'SNAP is not a flat amount. DTA sets the monthly benefit after reviewing household size, income, expenses, and program rules.',
    supportingDetails: [
      'Your amount can change if your income, housing costs, or household situation changes.',
    ],
    officialUrl: 'https://www.mass.gov/how-to/apply-for-snap-benefits-food-stamps',
    officialLabel: 'Open SNAP overview',
    timeSensitive: false,
  },
  {
    id: 'masshealth-apply',
    sourceId: 'masshealth-apply',
    benefitIds: ['masshealth'],
    topic: 'How to apply for MassHealth',
    intents: ['apply'],
    aliases: ['apply masshealth', 'masshealth application', 'apply for medicaid in massachusetts'],
    questionPatterns: [
      'how do i apply for masshealth',
      'where do i apply for masshealth',
      'how do i start a masshealth application',
    ],
    answer:
      'Most applicants under 65 can start online through the Massachusetts Health Connector / MassHealth application path and then follow the instructions for the correct MassHealth or Connector program.',
    supportingDetails: [
      'The Mass.gov application page says applicants should be ready with household, income, Massachusetts residency, and current insurance information.',
    ],
    officialUrl:
      'https://www.mass.gov/how-to/apply-for-masshealth-the-health-safety-net-or-the-childrens-medical-security-plan',
    officialLabel: 'Open MassHealth application page',
    timeSensitive: false,
  },
  {
    id: 'masshealth-report-changes',
    sourceId: 'masshealth-report',
    benefitIds: ['masshealth'],
    topic: 'Report changes to MassHealth',
    intents: ['renew-report-change', 'status'],
    aliases: ['report changes masshealth', 'renew masshealth', 'masshealth address change', 'masshealth income change'],
    questionPatterns: [
      'how do i report changes to masshealth',
      'do i need to renew masshealth or report changes after i enroll',
      'when do i have to tell masshealth about changes',
    ],
    answer:
      'Yes. MassHealth says you must report changes such as address, email, income, or phone number as soon as possible and no later than 10 days after the change.',
    supportingDetails: [
      'For members under 65, the fastest online path is usually through the Health Connector account tools listed on the reporting page.',
    ],
    officialUrl: 'https://www.mass.gov/how-to/report-changes-to-masshealth',
    officialLabel: 'Open MassHealth reporting page',
    timeSensitive: true,
  },
  {
    id: 'mbta-student-pass-overview',
    sourceId: 'mbta-student-pass',
    benefitIds: ['mbta-pass'],
    topic: 'MBTA student pass basics',
    intents: ['what-is', 'eligibility'],
    aliases: ['mbta student pass', 't pass for students', 'college pass', 'semester pass'],
    questionPatterns: [
      'what is the mbta student pass',
      'how do mbta student passes work at colleges',
      'what mbta discounts are available for students',
    ],
    answer:
      'MBTA student discounts are typically institution-based pass programs, so availability depends on whether your school participates.',
    supportingDetails: [
      'Students should check both the official MBTA student pass page and their own campus transportation or commuter office instructions.',
    ],
    officialUrl: 'https://www.mbta.com/fares/college-student-semester-passes',
    officialLabel: 'Open MBTA student pass page',
    timeSensitive: false,
  },
  {
    id: 'mbta-enrollment-rules',
    sourceId: 'mbta-university-terms',
    benefitIds: ['mbta-pass'],
    topic: 'MBTA pass program full-time vs part-time rules',
    intents: ['eligibility', 'part-time'],
    aliases: ['mbta part time', 'mbta full time only', 'university pass program part time'],
    questionPatterns: [
      'are mbta student passes only for full-time students',
      'can part-time students get the mbta student pass',
      'how do colleges decide mbta pass eligibility',
    ],
    answer:
      'It depends on the school\'s MBTA program setup. The MBTA university pass terms say a college can choose to offer the pass to both part-time and full-time students or to full-time students only.',
    supportingDetails: [
      'That is why school-specific MBTA eligibility can differ even within the same overall pass program.',
    ],
    officialUrl: 'https://www.mbta.com/fares/college-student-semester-passes',
    officialLabel: 'Open MBTA pass overview',
    sourceUrl: 'https://passprogram.mbta.com/Account/Signup.aspx?p=8',
    timeSensitive: false,
  },
];

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveSourceTitle(source) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CommonMASS Chatbot Knowledge Import/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('pdf')) {
      return source.fallbackTitle;
    }

    const html = await response.text();
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) {
      return source.fallbackTitle;
    }

    const cleanTitle = stripHtml(match[1]);
    return cleanTitle || source.fallbackTitle;
  } catch {
    return source.fallbackTitle;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildKnowledgeRecords() {
  const sourceTitleEntries = await Promise.all(
    SOURCE_MANIFEST.map(async (source) => [source.id, await resolveSourceTitle(source)])
  );

  const sourceTitleById = new Map(sourceTitleEntries);
  const sourceById = new Map(SOURCE_MANIFEST.map((source) => [source.id, source]));

  return CURATED_RECORDS.map((record) => {
    const source = sourceById.get(record.sourceId);
    if (!source) {
      throw new Error(`Missing source manifest entry for ${record.sourceId}`);
    }

    return {
      id: record.id,
      benefitIds: record.benefitIds,
      topic: record.topic,
      intents: record.intents,
      aliases: record.aliases,
      questionPatterns: record.questionPatterns,
      answer: record.answer,
      supportingDetails: record.supportingDetails,
      officialUrl: record.officialUrl,
      officialLabel: record.officialLabel,
      sourceUrl: record.sourceUrl ?? source.url,
      sourceTitle: sourceTitleById.get(source.id) ?? source.fallbackTitle,
      effectiveDate: record.effectiveDate ?? null,
      academicYear: record.academicYear ?? null,
      timeSensitive: record.timeSensitive,
    };
  });
}

async function main() {
  const records = await buildKnowledgeRecords();

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  console.log(`Generated ${records.length} chatbot knowledge records at ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Failed to generate chatbot knowledge:', error);
  process.exitCode = 1;
});
