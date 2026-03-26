import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  ExternalLink,
  Maximize2,
  Minimize2,
  Send,
  User,
} from 'lucide-react';

import { benefits, type Benefit } from '../data/benefitsData';
import { faqData, type FAQItem } from '../data/faqData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { renderLinkedText } from './ui/render-linked-text';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Intent =
  | 'amount'
  | 'estimate'
  | 'apply'
  | 'eligibility'
  | 'documents'
  | 'checklist'
  | 'official-link'
  | 'deadline'
  | 'overview'
  | 'compare'
  | 'renewal'
  | 'correction'
  | 'status'
  | 'student-status'
  | 'citizenship'
  | 'help'
  | 'greeting'
  | 'gratitude'
  | 'unknown';

type OfficialLink = {
  label: string;
  url: string;
};

type ProgramGuidance = {
  title: string;
  aliases: string[];
  summary: string;
  amount: string;
  estimate: string;
  eligibility: string;
  apply: string;
  documents: string[];
  nextSteps: string[];
  deadline: string;
  renewal: string;
  status: string;
  correction: string;
  studentStatus: string;
  citizenship: string;
  notes: string[];
  links: OfficialLink[];
};

type SpecialTopicId = 'fafsa' | 'masfa';

type TopicGuidance = {
  title: string;
  directAnswer?: string;
  details?: string[];
  nextSteps?: string[];
  links?: OfficialLink[];
  relatedBenefitId?: Benefit['id'];
  followUp?: string;
};

type ConversationContext = {
  benefitId?: Benefit['id'];
  faqId?: string;
  topicId?: SpecialTopicId;
};

const URLS = {
  FAFSA: 'https://studentaid.gov/h/apply-for-aid/fafsa',
  FAFSA_2026_27_FORM: 'https://studentaid.gov/sites/default/files/2026-27-fafsa-form.pdf',
  AFTER_FAFSA: 'https://studentaid.gov/articles/things-after-fafsa/',
  STUDENTAID_ACCOUNT: 'https://studentaid.gov/articles/key-facts-accounts/',
  FAFSA_STEPS: 'https://studentaid.gov/articles/fafsa-student-steps/',
  FAFSA_PARENTS: 'https://studentaid.gov/articles/fafsa-for-parents',
  PELL: 'https://studentaid.gov/articles/dont-miss-out-on-pell-grants/',
  LOANS: 'https://studentaid.gov/articles/subsidized-vs-unsubsidized-loans',
  FEDERAL_AID_GUIDE: 'https://studentaid.gov/sites/default/files/funding-your-education.pdf',
  MASSGRANT: 'https://www.mass.edu/osfa/programs/massgrant.asp',
  MASSGRANT_TERMS: 'https://www.mass.edu/osfa/programs/massgrantawardterms.asp',
  MASSGRANT_PLUS: 'https://www.mass.edu/osfa/programs/massgrantplus.asp',
  MASFA: 'https://www.mass.edu/osfa/students/masfa.asp',
  TUITION_EQUITY: 'https://www.mass.edu/tuitionequity/',
  DHE_AFFIDAVIT: 'https://www.mass.edu/tuitionequity/documents/2025-09-10%20Tuition%20Equity%20Form%20and%20Affidavit_Fillable.pdf',
  MASSHEALTH_CONNECTOR: 'https://www.mahix.org/individual/',
  MASSHEALTH_REPORT_CHANGES: 'https://www.mass.gov/how-to/report-changes-to-masshealth',
  MASSHEALTH_HELP: 'https://www.mass.gov/how-to/find-help-with-your-masshealth-insurance-application',
  MASSHEALTH_MEMBER_FAQ: 'https://www.mass.gov/info-details/frequently-asked-questions-for-masshealth-members-younger-than-65',
  MBTA_STUDENT_PASS: 'https://www.mbta.com/fares/college-student-semester-passes',
  SNAP_APPLY: 'https://www.mass.gov/how-to/apply-for-snap-benefits-food-stamps',
  SNAP_DTA_CONNECT: 'https://dtaconnect.eohhs.mass.gov/',
  SNAP_STUDENTS: 'https://www.fns.usda.gov/snap/students',
  DTA_CONTACT: 'https://www.mass.gov/guides/how-to-contact-dta',
} as const;

const SUGGESTED_PROMPTS = [
  'How much can Pell Grant cover?',
  'What is the FAFSA deadline?',
  'Can part-time students still get Pell?',
  'How do I apply for MassHealth?',
  'How does SNAP work for college students?',
  'Compare Pell Grant and MASSGrant.',
];

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'of',
  'is',
  'are',
  'i',
  'me',
  'my',
  'you',
  'your',
  'about',
  'what',
  'how',
  'do',
  'does',
  'can',
  'where',
  'when',
  'who',
  'tell',
  'more',
  'with',
  'please',
  'it',
  'this',
  'that',
  'get',
  'help',
  'need',
]);

const CONTEXTUAL_INTENTS = new Set<Intent>([
  'amount',
  'estimate',
  'apply',
  'eligibility',
  'documents',
  'checklist',
  'official-link',
  'deadline',
  'overview',
  'renewal',
  'correction',
  'status',
  'student-status',
  'citizenship',
]);

const FAQ_FIRST_IDS = new Set(['7', '8', '10', '18', '19', '20']);

const BENEFIT_GUIDANCE: Record<Benefit['id'], ProgramGuidance> = {
  'pell-grant': {
    title: 'Federal Pell Grant',
    aliases: ['pell', 'pell grant', 'federal pell', 'federal pell grant'],
    summary:
      'The Federal Pell Grant is federal gift aid for undergraduate students with financial need. It usually does not need to be repaid.',
    amount:
      'For the 2026-27 award year, the maximum Federal Pell Grant is $7,395. Some students can receive up to 150% of their scheduled yearly award through year-round Pell if they attend an additional term in the same award year. Your actual amount depends on your FAFSA results, Student Aid Index, enrollment intensity, and your school cost of attendance.',
    estimate:
      'I cannot tell you a personal Pell amount from income alone. FAFSA uses more than one number, and your school makes the final award. After your FAFSA is processed, your confirmation page and FAFSA Submission Summary show an estimated Pell amount, but your school financial aid offer is what determines the final number.',
    eligibility:
      'Pell is mainly for undergraduate students in eligible programs who meet federal student-aid rules and show enough financial need through the FAFSA.',
    apply:
      'Start with the FAFSA on StudentAid.gov, make sure your school is listed, and then review your financial aid offer after the form is processed.',
    documents: [
      'your StudentAid.gov account information',
      'student and contributor identifying information',
      'income or tax information when the form requests it',
      'the list of schools you want to receive your FAFSA',
    ],
    nextSteps: [
      'complete the FAFSA on StudentAid.gov',
      'review your FAFSA Submission Summary after processing',
      'check your school financial aid portal for your final aid offer',
    ],
    deadline:
      'For the 2026-27 FAFSA, the federal deadline is June 30, 2027, and the form can be submitted as early as October 1, 2025. For 2025-26, the federal deadline is June 30, 2026. School and state deadlines can be earlier, so filing early is safer.',
    renewal:
      'You normally need to submit a FAFSA each academic year if you want to stay in consideration for Pell Grant.',
    status:
      'Your first status check is your FAFSA Submission Summary in StudentAid.gov. After that, your school financial aid portal is where you usually see the exact Pell amount in your aid offer.',
    correction:
      'If your FAFSA-related information needs to change, you can often fix certain items in StudentAid.gov after processing. Major financial changes usually need to be discussed with your school financial aid office.',
    studentStatus:
      'Part-time students can still receive Pell, but the amount is often lower than for full-time enrollment. Pell is not automatically limited to full-time students.',
    citizenship:
      'To receive federal aid like Pell, you generally must be a U.S. citizen or eligible noncitizen and meet the rest of the federal student-aid rules. Students who cannot complete the FAFSA because of immigration or citizenship status are generally not eligible for Pell, though they may still review MASFA for Massachusetts state aid.',
    notes: [
      'A lower or negative Student Aid Index usually means a higher chance of Pell eligibility.',
      'Your FAFSA Submission Summary is not your final financial aid offer.',
    ],
    links: [
      { label: 'Fill out the FAFSA on StudentAid.gov', url: URLS.FAFSA },
      { label: 'Federal Pell Grant details', url: URLS.PELL },
      { label: 'What to do after submitting the FAFSA', url: URLS.AFTER_FAFSA },
    ],
  },
  massgrant: {
    title: 'MASSGrant',
    aliases: ['massgrant', 'mass grant', 'massachusetts grant'],
    summary:
      'MASSGrant is Massachusetts need-based aid for eligible undergraduates, usually tied to residency, annual FAFSA or MASFA filing, enrollment level, and school requirements.',
    amount:
      'MASSGrant does not have one single statewide award amount. The official Massachusetts page says awards vary depending on your Student Aid Index and the type of institution you attend.',
    estimate:
      'I cannot predict your personal MASSGrant amount from income alone. Massachusetts says the award varies by Student Aid Index and institution type, and your school usually handles the final packaging.',
    eligibility:
      'To be eligible, students are generally expected to be Massachusetts residents, enrolled full-time as undergraduates in eligible programs, making satisfactory academic progress, and eligible for Title IV funds or Massachusetts state aid under the Tuition Equity Law. Students using MASFA may also need to meet the Massachusetts High School Completer and documentation rules.',
    apply:
      'The normal starting point is your FAFSA or MASFA, and then your school financial aid office handles the award packaging. If you are using MASFA and cannot provide the other listed documents, the DHE Tuition Equity Form and Affidavit can be part of that path.',
    documents: [
      'FAFSA or MASFA information',
      'Massachusetts residency information',
      'school enrollment information',
      'Massachusetts High School Completer and document records if you are using MASFA under the Tuition Equity Law',
      'anything your financial aid office requests to finish packaging',
    ],
    nextSteps: [
      'submit the FAFSA or MASFA early',
      'confirm your school has everything it needs',
      'watch your school financial aid portal for updates',
    ],
    deadline:
      'Massachusetts publishes MASSGrant timing by aid year, but you should not wait for the final federal FAFSA date. The federal 2026-27 FAFSA deadline is June 30, 2027, and school or state grant timelines can be earlier.',
    renewal:
      'Students normally need to submit the FAFSA or MASFA again each year to remain in consideration for MASSGrant.',
    status:
      'Your school financial aid office or student portal is usually the best place to check your MASSGrant status.',
    correction:
      'If the issue is on your FAFSA or MASFA, fix that first if possible. If the issue is about your packaged award, your financial aid office is usually the next step.',
    studentStatus:
      'MASSGrant is generally built around full-time undergraduate enrollment. The Massachusetts award terms say full-time means at least 12 semester credits or the equivalent.',
    citizenship:
      'The Massachusetts award terms say students generally must be eligible for Title IV funds or qualified for Massachusetts state aid under the Tuition Equity Law. For students using MASFA, that can mean Massachusetts residency for the program, at least 3 academic years of Massachusetts high school, a Massachusetts diploma or equivalent, and a valid SSN, ITIN document, Selective Service registration if applicable, or a completed DHE Tuition Equity Form and Affidavit when needed.',
    notes: [
      'State aid rules can be stricter about enrollment level than Pell Grant.',
      'If you transfer schools, the award can change based on institution type.',
    ],
    links: [
      { label: 'Massachusetts MASSGrant overview', url: URLS.MASSGRANT },
      { label: 'MASSGrant terms and conditions', url: URLS.MASSGRANT_TERMS },
      { label: 'MASFA for eligible Massachusetts students', url: URLS.MASFA },
      { label: 'Massachusetts Tuition Equity overview', url: URLS.TUITION_EQUITY },
      { label: 'DHE Tuition Equity Form and Affidavit', url: URLS.DHE_AFFIDAVIT },
    ],
  },
  'massgrant-plus': {
    title: 'MASSGrant Plus',
    aliases: ['massgrant plus', 'mass grant plus', 'massachusetts grant plus'],
    summary:
      'MASSGrant Plus is Massachusetts state aid designed to lower tuition and fee costs for eligible students at public four-year colleges and universities in Massachusetts.',
    amount:
      'According to the Massachusetts program page, if your family makes approximately $85,000 per year, MASSGrant Plus can cover the full cost of tuition and fees and provide up to $1,200 for books and supplies. If your family makes between approximately $85,000 and $100,000 per year, full-time students can see tuition and fees reduced by up to half of their out-of-pocket costs.',
    estimate:
      'I cannot promise a personal MASSGrant Plus amount from one message because the exact result depends on your school, residency, credit load, and the financial information used for aid review.',
    eligibility:
      'The official page says students generally must live in Massachusetts for at least one year, enroll in an eligible undergraduate program at an eligible public institution, and meet the program credit and aid-status rules. Students using MASFA may also need to meet the Massachusetts High School Completer and documentation rules.',
    apply:
      'Students are usually considered through the FAFSA or MASFA, and their school determines whether they meet the current program rules. If you are using MASFA and cannot provide the other listed documents, the DHE Tuition Equity Form and Affidavit can be part of that path.',
    documents: [
      'FAFSA or MASFA information',
      'Massachusetts residency information',
      'school enrollment and aid records',
      'Massachusetts High School Completer and document records if you are using MASFA under the Tuition Equity Law',
    ],
    nextSteps: [
      'submit the FAFSA or MASFA early',
      'confirm your school and credit load match the program rules',
      'watch for updates from your financial aid office',
    ],
    deadline:
      'Like other state aid, MASSGrant Plus depends on aid-year and school timing. File early rather than waiting for the final federal FAFSA deadline.',
    renewal:
      'You usually need to file the FAFSA or MASFA again each year to remain in consideration.',
    status:
      'Your school financial aid office is usually the most reliable place for MASSGrant Plus status updates.',
    correction:
      'If your FAFSA or MASFA information changed, correct that first. If the question is about school packaging or eligibility, contact your financial aid office.',
    studentStatus:
      'The official page says the minimum credit requirement depends on family income. If family income is under about $85,000, the minimum is 6 credits per term. If family income is between about $85,000 and $100,000, the minimum is 12 credits per term.',
    citizenship:
      'The official program page says students generally must be a U.S. citizen, lawful permanent resident, noncitizen eligible under Title IV rules, or have an approved status under the Massachusetts Tuition Equity Law. For students using MASFA, that can mean Massachusetts residency for the program, at least 3 academic years of Massachusetts high school, a Massachusetts diploma or equivalent, and a valid SSN, ITIN document, Selective Service registration if applicable, or a completed DHE Tuition Equity Form and Affidavit when needed.',
    notes: [
      'This program is more specific than Pell Grant, so school type and credit load matter a lot.',
      'Room and board are not included in the core tuition-and-fee promise.',
    ],
    links: [
      { label: 'MASSGrant Plus overview', url: URLS.MASSGRANT_PLUS },
      { label: 'FAFSA form', url: URLS.FAFSA },
      { label: 'MASFA for eligible Massachusetts students', url: URLS.MASFA },
      { label: 'Massachusetts Tuition Equity overview', url: URLS.TUITION_EQUITY },
      { label: 'DHE Tuition Equity Form and Affidavit', url: URLS.DHE_AFFIDAVIT },
    ],
  },
  masshealth: {
    title: 'MassHealth',
    aliases: ['masshealth', 'mass health', 'medicaid', 'ma medicaid'],
    summary:
      'MassHealth is Massachusetts Medicaid coverage. It helps eligible residents pay for health care rather than giving a cash payment.',
    amount:
      'MassHealth is not a cash award, so there is no set dollar amount like a grant. The value comes from the health coverage and services it pays for.',
    estimate:
      'I cannot tell from one message whether you personally will be approved. MassHealth eligibility depends on factors like Massachusetts residency, household size, income, age, disability status, pregnancy or parent status, and current health coverage.',
    eligibility:
      'MassHealth eligibility depends on household details such as residency, income, household composition, age, disability status, and other coverage. It is not decided by student status alone.',
    apply:
      'Most people under 65 start online through the Massachusetts Health Connector, which routes eligible applicants to the right coverage path.',
    documents: [
      'proof of Massachusetts residency',
      'income information',
      'identity information',
      'household or current coverage details',
    ],
    nextSteps: [
      'start or manage the application in the Massachusetts Health Connector',
      'gather household, identity, and income information',
      'respond quickly if MassHealth requests more information',
    ],
    deadline:
      'There is not a school-style annual filing deadline, but you should respond quickly to application requests, renewal notices, or change-reporting requirements. MassHealth says changes should be reported as soon as possible and no later than 10 days from the change.',
    renewal:
      'After enrollment, watch for renewal notices and report changes like address, income, phone, or household updates on time so coverage does not lapse.',
    status:
      'Coverage updates, notices, and next steps are usually handled through the Health Connector or MassHealth member communications.',
    correction:
      'If your household information changed, update it as soon as possible. MassHealth says changes should be reported no later than 10 days from the change.',
    studentStatus:
      'Student status is not usually the main MassHealth test. Income, household details, residency, age, disability, and other coverage matter more.',
    citizenship:
      'Citizenship or immigration status can matter, but Massachusetts also has multiple coverage categories, so the exact path depends on your situation rather than one single yes-or-no rule.',
    notes: [
      'MassHealth is coverage, not a scholarship or cash benefit.',
      'If you need help applying, Massachusetts has official support resources.',
    ],
    links: [
      { label: 'Massachusetts Health Connector', url: URLS.MASSHEALTH_CONNECTOR },
      { label: 'Report changes to MassHealth', url: URLS.MASSHEALTH_REPORT_CHANGES },
      { label: 'Find help with a MassHealth application', url: URLS.MASSHEALTH_HELP },
    ],
  },
  'mbta-pass': {
    title: 'MBTA Student Pass',
    aliases: ['mbta', 'mbta pass', 'student pass', 'semester pass', 'charliecard', 't pass'],
    summary:
      'The MBTA student pass program offers discounted transit access through participating schools rather than through a general government benefit decision.',
    amount:
      'This is not a cash benefit. The savings depend on the pass type, the school you attend, and whether your campus participates in the student pass program.',
    estimate:
      'I cannot quote your personal pass cost from one message because MBTA student pass pricing and availability depend on your school and the pass arrangement it uses.',
    eligibility:
      'Availability depends mostly on whether your school participates and whether you meet the school or program enrollment requirements.',
    apply:
      'The first stop is usually your school transportation, commuter, or student affairs office, along with the MBTA student pass page.',
    documents: [
      'student ID',
      'current enrollment verification',
      'school-specific pass purchase details',
    ],
    nextSteps: [
      'confirm that your school participates in the student pass program',
      'check your campus transportation or commuter office instructions',
      'purchase the pass through the school or MBTA process provided to you',
    ],
    deadline:
      'Deadlines can vary by semester pass program or school distribution schedule, so check with your campus office early.',
    renewal:
      'Pass enrollment often needs to be completed again each term or semester if your school uses a recurring program.',
    status:
      'Your school office is often the best source for pass availability, pickup timing, and troubleshooting.',
    correction:
      'If there is a problem, your campus transportation or commuter office is usually the fastest place to correct it.',
    studentStatus:
      'School participation and current enrollment usually matter more than anything else. Many campuses limit the program to certain enrolled students.',
    citizenship:
      'Citizenship is not normally the deciding factor. School participation and current student status matter more.',
    notes: [
      'This is more about campus participation than a state eligibility review.',
      'If your school does not participate, ask whether there are alternate commuter discounts.',
    ],
    links: [{ label: 'MBTA college student semester passes', url: URLS.MBTA_STUDENT_PASS }],
  },
  snap: {
    title: 'SNAP (Food Stamps)',
    aliases: ['snap', 'food stamps', 'food assistance', 'ebt', 'dta'],
    summary:
      'SNAP helps eligible households pay for food, and some college students can qualify if they also meet the student rules.',
    amount:
      'SNAP is a monthly food benefit, but there is no single student amount. DTA sets the amount based on household size, income, and certain expenses after reviewing your case.',
    estimate:
      'I cannot predict your personal SNAP amount or approval from one message. Student status, household size, income, and student exemptions all matter.',
    eligibility:
      'Eligibility usually depends on household income and student exemptions, especially for students enrolled at least half-time in college.',
    apply:
      'The main application route is DTA Connect, where you can apply and manage many case tasks online.',
    documents: [
      'proof of identity',
      'proof of income',
      'proof of enrollment',
      'any student exemption information that applies',
    ],
    nextSteps: [
      'start the application in DTA Connect',
      'gather income and enrollment documents',
      'watch DTA Connect for notices or document requests',
    ],
    deadline:
      'There is not an annual school-style filing deadline. After you apply, DTA says it will send a decision within 30 days, and some people can get expedited SNAP within 7 days.',
    renewal:
      'Once enrolled, you may need to complete periodic SNAP Interim Reports or recertification steps to keep benefits active.',
    status:
      'DTA Connect is usually the main place to check case status, upload documents, read notices, and view your EBT information.',
    correction:
      'If DTA needs updated information or documents, respond in DTA Connect as soon as possible so your case keeps moving.',
    studentStatus:
      'If you are enrolled more than half-time in college, you generally need a student exemption to qualify for SNAP. If you are enrolled less than half-time, the special student restrictions do not apply.',
    citizenship:
      'Federal SNAP rules include citizenship and immigration requirements, and DTA reviews that as part of eligibility.',
    notes: [
      'For college students, the student exemption rules matter just as much as household income.',
      'DTA Connect usually becomes available about one business day after you apply.',
    ],
    links: [
      { label: 'Apply for SNAP in Massachusetts', url: URLS.SNAP_APPLY },
      { label: 'DTA Connect', url: URLS.SNAP_DTA_CONNECT },
      { label: 'SNAP rules for college students', url: URLS.SNAP_STUDENTS },
    ],
  },
};

const SPECIAL_TOPIC_GUIDANCE: Record<SpecialTopicId, ProgramGuidance> = {
  fafsa: {
    title: 'FAFSA',
    aliases: ['fafsa', 'federal student aid', 'student aid', 'student aid index', 'sai', 'fsa id'],
    summary:
      'The FAFSA is the application used to determine federal student aid and many school and state aid decisions. It is not itself a grant, scholarship, or loan.',
    amount:
      'The FAFSA itself does not award money. After your FAFSA is processed, your confirmation page and FAFSA Submission Summary can show an estimated Pell amount and your Student Aid Index. For the 2026-27 award year, the maximum Pell Grant is $7,395. Federal loan limits also depend on your year in school and dependency status. For dependent undergraduates, common annual loan limits are $5,500 for first year, $6,500 for second year, and $7,500 for third year and beyond. For independent undergraduates, common annual loan limits are $9,500, $10,500, and $12,500.',
    estimate:
      'I cannot tell you a personal FAFSA dollar amount from income alone. FAFSA uses more than one number, and your school decides the final aid offer. A lower or negative Student Aid Index usually means a higher chance of Pell eligibility, but your school sends the exact offer.',
    eligibility:
      'Filing the FAFSA can put you in consideration for Pell Grants, federal loans, work-study, and many state or school aid programs.',
    apply:
      'The student starts the FAFSA in StudentAid.gov and invites any required contributors to complete and sign their own sections.',
    documents: [
      'the student StudentAid.gov account',
      'contributor account information if contributors are required',
      'student and contributor identifying information',
      'income or tax information when requested',
      'your school list',
    ],
    nextSteps: [
      'create or confirm your StudentAid.gov account',
      'start the FAFSA and add your school list',
      'invite contributors if the form asks for them',
      'review your FAFSA Submission Summary after processing',
    ],
    deadline:
      'For the 2026-27 FAFSA, the federal deadline is June 30, 2027, and the form can be filed as early as October 1, 2025. For 2025-26, the federal deadline is June 30, 2026. State and school deadlines may be much earlier.',
    renewal:
      'If you want to stay in consideration for aid, you usually need a new FAFSA for each academic year.',
    status:
      'After you submit the FAFSA online, it is usually processed in one to three days. Then you can log in to StudentAid.gov to view your FAFSA Submission Summary.',
    correction:
      'After your FAFSA is processed, you can correct certain fields online in StudentAid.gov. If your family finances changed significantly, that usually needs to be handled through your financial aid office rather than as a normal online correction.',
    studentStatus:
      'Enrollment level does not decide whether you can file the FAFSA, but it can affect the aid you receive. Part-time students can still be eligible for some aid, including Pell in some cases, though the amount can be smaller.',
    citizenship:
      'To receive federal student aid, you generally must be a U.S. citizen or eligible noncitizen. If you are not able to complete the FAFSA because of citizenship or immigration status, MASFA may be the right Massachusetts form instead.',
    notes: [
      'Your Student Aid Index is not a dollar amount of aid.',
      'Your school financial aid offer is the document that gives the final aid package.',
    ],
    links: [
      { label: 'Start the FAFSA on StudentAid.gov', url: URLS.FAFSA },
      { label: '2026-27 FAFSA deadline details', url: URLS.FAFSA_2026_27_FORM },
      { label: 'Federal Pell Grant details', url: URLS.PELL },
      { label: 'Federal loan limits and loan types', url: URLS.LOANS },
      { label: 'What to do after submitting the FAFSA', url: URLS.AFTER_FAFSA },
    ],
  },
  masfa: {
    title: 'MASFA',
    aliases: ['masfa', 'massachusetts application for state financial aid', 'tuition equity', 'undocumented aid', 'dhe affidavit'],
    summary:
      'MASFA is the Massachusetts application used by certain students who cannot complete the FAFSA because of citizenship or immigration status but may still qualify for Massachusetts state aid under the Tuition Equity Law.',
    amount:
      'MASFA is an application, not a direct award. The amount depends on which Massachusetts state aid programs you qualify for through that application.',
    estimate:
      'I cannot predict a personal MASFA-based award from one message because the outcome depends on the program, your school, and your financial information.',
    eligibility:
      'MASFA is meant for students who are not able to complete the FAFSA because of citizenship or immigration status but may qualify for Massachusetts aid under the Tuition Equity Law. For the High School Completer path, Massachusetts says students generally need at least 3 academic years of Massachusetts high school, a Massachusetts diploma or equivalent, and a valid SSN, ITIN document, Selective Service registration if applicable, or a completed DHE Tuition Equity Form and Affidavit when needed.',
    apply:
      'Complete the MASFA rather than the FAFSA if MASFA is the application that matches your eligibility situation. If your school requires it, send the DHE Tuition Equity Form and Affidavit to the Massachusetts colleges you want to attend.',
    documents: [
      'the information requested by the MASFA application',
      'Massachusetts high school attendance and diploma or equivalent information',
      'a valid SSN, ITIN document, or Selective Service registration if applicable',
      'the completed DHE Tuition Equity Form and Affidavit if you cannot provide the other listed document options',
      'financial information needed for the state aid review',
    ],
    nextSteps: [
      'confirm that MASFA is the right form for your situation',
      'complete the MASFA as early as possible',
      'complete the DHE Tuition Equity Form and Affidavit if you cannot provide the other listed document options',
      'watch for any requests from your school or state aid office',
    ],
    deadline:
      'State and school timelines matter. File as early as the school or state advises rather than waiting.',
    renewal:
      'If you want to stay in consideration for aid, you usually need to submit the appropriate state aid application each academic year.',
    status:
      'Status updates often flow through your school financial aid office because the final packaging is school-specific. Keep an eye on the MASFA portal you used and on any messages from your college.',
    correction:
      'If you entered something incorrectly, follow the school or state guidance for updating the MASFA-related record.',
    studentStatus:
      'Whether MASFA leads to aid depends on the rules of the underlying state program. Some programs require full-time enrollment and others are more flexible.',
    citizenship:
      'MASFA exists because some students are not eligible to complete the FAFSA but may still qualify for Massachusetts state aid. It does not create Pell Grant eligibility by itself.',
    notes: [
      'Do not assume FAFSA and MASFA are interchangeable. Use the application that matches your eligibility situation.',
      'For some students, the DHE Tuition Equity Form and Affidavit is part of the MASFA path rather than a separate aid program.',
    ],
    links: [
      { label: 'MASFA information', url: URLS.MASFA },
      { label: 'Massachusetts Tuition Equity overview', url: URLS.TUITION_EQUITY },
      { label: 'DHE Tuition Equity Form and Affidavit', url: URLS.DHE_AFFIDAVIT },
      { label: 'Massachusetts MASSGrant overview', url: URLS.MASSGRANT },
      { label: 'MASSGrant Plus overview', url: URLS.MASSGRANT_PLUS },
    ],
  },
};
const FAQ_TOPIC_GUIDANCE: Partial<Record<FAQItem['id'], TopicGuidance>> = {
  '4': {
    title: 'Applying for MassHealth',
    directAnswer:
      'Most people under 65 can start online through the Massachusetts Health Connector, which is the main front door for many MassHealth applications.',
    details: [
      'Have household, residency, income, and current coverage information ready before you start.',
      'If MassHealth needs more information later, respond quickly so your application keeps moving.',
    ],
    nextSteps: [
      'open the Massachusetts Health Connector',
      'gather household, identity, and income information',
      'follow up promptly if more documents are requested',
    ],
    links: BENEFIT_GUIDANCE.masshealth.links,
    relatedBenefitId: 'masshealth',
  },
  '5': {
    title: 'MBTA student discounts',
    directAnswer:
      'The MBTA student pass is usually handled through participating schools, so the most important first question is whether your campus is in the program.',
    details: [
      'Your commuter, transportation, or student affairs office is usually the best source for the exact sign-up process.',
    ],
    nextSteps: BENEFIT_GUIDANCE['mbta-pass'].nextSteps,
    links: BENEFIT_GUIDANCE['mbta-pass'].links,
    relatedBenefitId: 'mbta-pass',
  },
  '6': {
    title: 'Applying for federal student aid',
    directAnswer:
      'The FAFSA is the main starting point for federal student aid and is also used for many school and state aid decisions.',
    details: [
      'The student usually starts the form first and invites required contributors to complete their own sections.',
    ],
    nextSteps: SPECIAL_TOPIC_GUIDANCE.fafsa.nextSteps,
    links: SPECIAL_TOPIC_GUIDANCE.fafsa.links,
  },
  '7': {
    title: 'Federal student loans',
    directAnswer:
      'Federal student loans are separate from grants. Subsidized loans are based on financial need, while unsubsidized loans are not.',
    details: [
      'Common annual limits for dependent undergraduates are $5,500 for first year, $6,500 for second year, and $7,500 for third year and beyond. Independent undergraduates usually have higher limits.',
    ],
    links: [{ label: 'Federal loan limits and loan types', url: URLS.LOANS }],
  },
  '8': {
    title: 'Federal Work-Study',
    directAnswer:
      'Federal Work-Study is part-time employment connected to financial aid eligibility rather than a direct cash grant.',
    details: [
      'Students usually indicate interest on the FAFSA and then follow their school process for available jobs.',
    ],
    links: [{ label: 'StudentAid.gov guide to federal student aid', url: URLS.FEDERAL_AID_GUIDE }],
  },
  '9': {
    title: 'SNAP for college students',
    directAnswer:
      'Yes, some college students can qualify for SNAP, but student exemption rules matter in addition to household income.',
    details: [
      'Students enrolled more than half-time usually need a qualifying student exemption. Students enrolled less than half-time are not subject to those student restrictions.',
    ],
    nextSteps: BENEFIT_GUIDANCE.snap.nextSteps,
    links: BENEFIT_GUIDANCE.snap.links,
    relatedBenefitId: 'snap',
  },
  '10': {
    title: 'Grants vs scholarships',
    directAnswer:
      'Both are usually aid you do not repay. Grants are often tied more closely to financial need, while scholarships are often tied to merit, talent, or a specific selection process.',
  },
  '11': {
    title: 'Federal student aid eligibility',
    directAnswer:
      'Federal student aid eligibility usually depends on federal rules such as eligible citizenship or noncitizen status, enrollment in an eligible program, and satisfactory academic progress.',
    details: [
      'The FAFSA is the normal gateway for being considered, but the school and federal rules still determine the final outcome.',
    ],
    links: [{ label: 'Federal student aid basics', url: URLS.FEDERAL_AID_GUIDE }],
  },
  '12': {
    title: 'FAFSA deadlines',
    directAnswer:
      'For the 2026-27 FAFSA, the federal deadline is June 30, 2027, but school and state deadlines are often earlier.',
    details: [
      'If you wait for the final federal date, you can still miss state grants or school-based aid priorities.',
    ],
    nextSteps: [
      'check your school financial aid priority deadline',
      'check Massachusetts aid deadlines if state aid matters for you',
      'file the FAFSA as early as you reasonably can',
    ],
    links: [
      { label: 'Start the FAFSA on StudentAid.gov', url: URLS.FAFSA },
      { label: '2026-27 FAFSA deadline details', url: URLS.FAFSA_2026_27_FORM },
    ],
  },
  '14': {
    title: 'Submitting the FAFSA every year',
    directAnswer:
      'Yes. If you want to stay in consideration for federal aid and many related state or school programs, you usually need a new FAFSA each academic year.',
    nextSteps: [
      'file a new FAFSA for each academic year you need aid',
      'do not assume last year rolls over automatically',
      'watch school and state deadlines each year',
    ],
    links: [{ label: 'Start the FAFSA on StudentAid.gov', url: URLS.FAFSA }],
  },
  '15': {
    title: 'FAFSA corrections',
    directAnswer:
      'Yes. Once your FAFSA is processed, you can correct certain items online in StudentAid.gov.',
    details: [
      'Common corrections include typos, contact details, adding or removing schools, and other data fixes the system allows after processing.',
      'If your family finances changed significantly, that usually needs to be discussed with your financial aid office rather than handled as a normal online correction.',
    ],
    nextSteps: [
      'open your FAFSA Submission Summary in StudentAid.gov',
      'use the option to make a correction if the system allows it',
      'contact your financial aid office if the issue is a major financial change',
    ],
    links: [
      { label: 'Open the FAFSA on StudentAid.gov', url: URLS.FAFSA },
      { label: 'What to do after submitting the FAFSA', url: URLS.AFTER_FAFSA },
    ],
  },
  '16': {
    title: 'FAFSA vs MASFA',
    directAnswer:
      'If you cannot complete the FAFSA because of immigration or citizenship status, Massachusetts may direct you to the MASFA instead.',
    details: [
      'Students should complete the application that matches their eligibility situation rather than trying to submit both.',
      'For the Tuition Equity Law state-aid path, Massachusetts says students generally need at least 3 academic years of Massachusetts high school, a Massachusetts diploma or equivalent, and a valid SSN, ITIN document, Selective Service registration if applicable, or a completed DHE Tuition Equity Form and Affidavit when needed.',
    ],
    links: [
      { label: 'MASFA information', url: URLS.MASFA },
      { label: 'Massachusetts Tuition Equity overview', url: URLS.TUITION_EQUITY },
      { label: 'DHE Tuition Equity Form and Affidavit', url: URLS.DHE_AFFIDAVIT },
      { label: 'FAFSA form', url: URLS.FAFSA },
    ],
  },
  '17': {
    title: 'FAFSA contributors and accounts',
    directAnswer:
      'Yes. Each contributor needs a separate StudentAid.gov account to access and sign their own section of the FAFSA.',
    details: [
      'Students should not share accounts with parents or spouses.',
      'The student normally starts the FAFSA first, then invites contributors when the form asks for them.',
    ],
    nextSteps: [
      'make sure the student has a StudentAid.gov account',
      'have each contributor create their own account',
      'start the FAFSA and send contributor invitations from the form',
    ],
    links: [
      { label: 'StudentAid.gov account basics', url: URLS.STUDENTAID_ACCOUNT },
      { label: 'FAFSA guidance for parents and contributors', url: URLS.FAFSA_PARENTS },
    ],
  },
  '18': {
    title: 'MassHealth renewals and reporting changes',
    directAnswer:
      'Yes. MassHealth says you should report changes as soon as possible and no later than 10 days from the date of the change.',
    details: [
      'Address, phone, email, income, or household changes can all matter, and renewal notices should not be ignored.',
    ],
    nextSteps: [
      'report changes promptly',
      'watch for renewal notices',
      'complete renewal tasks before the deadline in the notice',
    ],
    links: [
      { label: 'Report changes to MassHealth', url: URLS.MASSHEALTH_REPORT_CHANGES },
      { label: 'Massachusetts Health Connector', url: URLS.MASSHEALTH_CONNECTOR },
    ],
    relatedBenefitId: 'masshealth',
  },
  '19': {
    title: 'Managing a SNAP case online',
    directAnswer:
      'Yes. DTA Connect is the main online tool for many SNAP case tasks in Massachusetts.',
    details: [
      'People commonly use it to check case status, upload documents, read notices, update contact information, complete SNAP Interim Reports or recertification, and view EBT information.',
    ],
    nextSteps: [
      'sign in to DTA Connect',
      'check whether DTA requested documents or action from you',
      'upload documents or respond to notices there if needed',
    ],
    links: BENEFIT_GUIDANCE.snap.links,
    relatedBenefitId: 'snap',
  },
  '20': {
    title: 'Massachusetts state aid outside Massachusetts',
    directAnswer:
      'Some Massachusetts state aid can transfer to approved schools outside Massachusetts, but you should not assume it does without checking the current program rule and your school status.',
    details: [
      'MASSGrant is one of the programs where reciprocity rules can matter, so this is a place where official confirmation is important.',
    ],
    links: [{ label: 'Massachusetts MASSGrant terms and conditions', url: URLS.MASSGRANT_TERMS }],
    relatedBenefitId: 'massgrant',
  },
  '21': {
    title: 'Financial changes after filing the FAFSA',
    directAnswer:
      'If your family finances changed significantly after filing, contact your financial aid office.',
    details: [
      'That kind of situation is often handled through the school rather than through a normal FAFSA correction alone.',
    ],
    nextSteps: [
      'contact your financial aid office',
      'explain what changed in your finances',
      'ask what documentation they want for a review',
    ],
    links: [{ label: 'What to do after submitting the FAFSA', url: URLS.AFTER_FAFSA }],
    relatedBenefitId: 'pell-grant',
  },
  '22': {
    title: 'Aid for part-time students',
    directAnswer:
      'Yes, sometimes. Pell can still apply for part-time students, but some Massachusetts programs have stricter enrollment or credit rules.',
    details: [
      'That means part-time status does not automatically end aid options, but it does change which programs are realistic.',
    ],
    nextSteps: [
      'review your current enrollment level',
      'check which programs require full-time or specific credit loads',
      'ask your financial aid office how your enrollment status affects your aid mix',
    ],
    links: [
      { label: 'FAFSA form', url: URLS.FAFSA },
      { label: 'Massachusetts MASSGrant terms and conditions', url: URLS.MASSGRANT_TERMS },
      { label: 'MASSGrant Plus overview', url: URLS.MASSGRANT_PLUS },
    ],
    relatedBenefitId: 'pell-grant',
  },
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token));
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function hasPersonalEstimateSignals(text: string): boolean {
  return (
    containsAny(text, [
      'will i get',
      'would i get',
      'am i eligible if',
      'if i make',
      'if my income',
      'if i earn',
      'my income is',
      'my family makes',
      'for me',
      'personally',
      'based on my income',
      'based on my situation',
    ]) || /\$?\d{2,}/.test(text)
  );
}

function looksLikeFollowUp(input: string): boolean {
  const text = normalize(input);
  const tokens = text.split(' ').filter(Boolean);

  return (
    tokens.length <= 8 &&
    (containsAny(text, [
      'what about',
      'how about',
      'and what',
      'and if',
      'break it down',
      'go deeper',
      'be more specific',
      'more specific',
      'explain that',
    ]) || tokens.some((token) => ['it', 'that', 'those', 'them', 'this'].includes(token)))
  );
}

function joinSections(sections: Array<string | null | undefined>): string {
  return sections.filter(Boolean).join('\n\n');
}

function formatList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function formatLinks(links: OfficialLink[]): string {
  const uniqueLinks = Array.from(
    new Map(links.map((link) => [`${link.label}|${link.url}`, link])).values()
  );

  return uniqueLinks.map((link) => `- [${link.label}](${link.url})`).join('\n');
}

function buildResponse(options: {
  title: string;
  paragraphs?: string[];
  bulletTitle?: string;
  bulletItems?: string[];
  links?: OfficialLink[];
  followUp?: string;
}): string {
  const { title, paragraphs = [], bulletTitle, bulletItems = [], links = [], followUp } = options;

  return joinSections([
    title,
    ...paragraphs.filter(Boolean),
    bulletItems.length ? `${bulletTitle ?? 'Next steps'}\n${formatList(bulletItems)}` : null,
    links.length ? `Official links\n${formatLinks(links)}` : null,
    followUp ?? null,
  ]);
}

function buildGuidanceResponse(
  guidance: ProgramGuidance,
  intent: Intent,
  checklistItems?: string[]
): string {
  switch (intent) {
    case 'amount':
      return buildResponse({
        title: `${guidance.title} amount`,
        paragraphs: [guidance.amount, guidance.estimate],
        links: guidance.links,
        followUp:
          'If you want, I can also explain eligibility, deadlines, student-status rules, or what the application process looks like.',
      });
    case 'estimate':
      return buildResponse({
        title: `${guidance.title} personal estimate`,
        paragraphs: [guidance.estimate, guidance.eligibility, `General amount guidance: ${guidance.amount}`],
        links: guidance.links,
        followUp:
          'If you want, I can also break down the official rules around deadlines, documents, student status, or citizenship.',
      });
    case 'apply':
      return buildResponse({
        title: guidance.title,
        paragraphs: [guidance.summary, guidance.apply],
        bulletTitle: 'What to do next',
        bulletItems: guidance.nextSteps,
        links: guidance.links,
        followUp: 'If you want, I can also explain documents, deadlines, or eligibility for this program.',
      });
    case 'eligibility':
      return buildResponse({
        title: `${guidance.title} eligibility`,
        paragraphs: [guidance.eligibility, guidance.estimate],
        links: guidance.links,
      });
    case 'documents':
      return buildResponse({
        title: `${guidance.title} documents`,
        paragraphs: ['These are the main documents or pieces of information that usually matter first.'],
        bulletTitle: 'What to gather',
        bulletItems: guidance.documents,
        links: guidance.links,
      });
    case 'checklist':
      return buildResponse({
        title: `${guidance.title} checklist`,
        paragraphs: [
          checklistItems?.length
            ? 'These are the main steps CommonMASS tracks for this program.'
            : 'These are the main next steps that usually matter most for this topic.',
        ],
        bulletTitle: checklistItems?.length ? 'Common checklist items' : 'Common next steps',
        bulletItems: checklistItems?.length ? checklistItems : guidance.nextSteps,
        links: guidance.links,
      });
    case 'official-link':
      return buildResponse({
        title: `${guidance.title} official links`,
        paragraphs: ['These are the most useful official pages for this topic.'],
        links: guidance.links,
      });
    case 'deadline':
      return buildResponse({
        title: `${guidance.title} deadlines`,
        paragraphs: [guidance.deadline],
        links: guidance.links,
      });
    case 'renewal':
      return buildResponse({
        title: `${guidance.title} renewals`,
        paragraphs: [guidance.renewal],
        links: guidance.links,
      });
    case 'correction':
      return buildResponse({
        title: `${guidance.title} corrections or updates`,
        paragraphs: [guidance.correction],
        links: guidance.links,
      });
    case 'status':
      return buildResponse({
        title: `${guidance.title} status`,
        paragraphs: [guidance.status],
        links: guidance.links,
      });
    case 'student-status':
      return buildResponse({
        title: `${guidance.title} and student status`,
        paragraphs: [guidance.studentStatus, guidance.eligibility],
        links: guidance.links,
      });
    case 'citizenship':
      return buildResponse({
        title: `${guidance.title} and citizenship status`,
        paragraphs: [guidance.citizenship, guidance.eligibility],
        links: guidance.links,
      });
    case 'overview':
    case 'unknown':
    default:
      return buildResponse({
        title: guidance.title,
        paragraphs: [guidance.summary, guidance.amount, `Keep in mind: ${guidance.notes.join(' ')}`],
        bulletTitle: 'Common next steps',
        bulletItems: guidance.nextSteps,
        links: guidance.links,
      });
  }
}

function detectIntent(input: string): Intent {
  const text = normalize(input);

  if (!text) return 'unknown';
  if (containsAny(text, ['thanks', 'thank you', 'appreciate it'])) return 'gratitude';
  if (containsAny(text, ['hello', 'hi ', 'hey ', 'good morning', 'good afternoon'])) return 'greeting';
  if (containsAny(text, ['compare', 'difference between', 'different from', 'versus', ' vs ', 'better than'])) return 'compare';
  if (
    containsAny(text, ['how much', 'amount', 'maximum', 'max', 'worth', 'award amount', 'how many dollars'])
  ) {
    return hasPersonalEstimateSignals(text) ? 'estimate' : 'amount';
  }
  if (hasPersonalEstimateSignals(text)) return 'estimate';
  if (containsAny(text, ['part-time', 'full-time', 'half-time', 'credit load', 'credits', 'semester credits'])) return 'student-status';
  if (
    containsAny(text, [
      'citizen',
      'citizenship',
      'eligible noncitizen',
      'noncitizen',
      'green card',
      'permanent resident',
      'daca',
      'immigration',
    ])
  ) {
    return 'citizenship';
  }
  if (containsAny(text, ['renew', 'renewal', 'reapply', 'every year', 'each year', 'report changes', 'recertification'])) return 'renewal';
  if (containsAny(text, ['correct', 'correction', 'fix', 'edit', 'change my fafsa', 'update my fafsa'])) return 'correction';
  if (containsAny(text, ['status', 'track', 'check my status', 'after i apply', 'after applying', 'submission summary'])) return 'status';
  if (containsAny(text, ['official link', 'official site', 'website', 'url', 'link'])) return 'official-link';
  if (containsAny(text, ['deadline', 'due date', 'priority date', 'when is it due', 'when do i file'])) return 'deadline';
  if (containsAny(text, ['document', 'documents', 'paperwork', 'proof', 'what do i need', 'what should i bring'])) return 'documents';
  if (containsAny(text, ['checklist', 'steps', 'what should i do first', 'what do i do first', 'next steps'])) return 'checklist';
  if (containsAny(text, ['eligible', 'eligibility', 'qualify', 'qualified', 'who qualifies', 'who can get'])) return 'eligibility';
  if (containsAny(text, ['apply', 'application', 'start', 'file the fafsa'])) return 'apply';
  if (containsAny(text, ['what can you do', 'what can i ask', 'help with', 'what do you know'])) return 'help';
  if (containsAny(text, ['what is', 'tell me about', 'overview', 'explain'])) return 'overview';

  return 'unknown';
}

function getBenefitById(benefitId?: string): Benefit | undefined {
  return benefits.find((benefit) => benefit.id === benefitId);
}

function getFaqById(faqId?: string): FAQItem | undefined {
  return faqData.find((faq) => faq.id === faqId);
}

function getBenefitAliases(benefit: Benefit): string[] {
  const guidance = BENEFIT_GUIDANCE[benefit.id];
  return [benefit.title.toLowerCase(), benefit.id.toLowerCase(), benefit.category.toLowerCase(), ...guidance.aliases];
}

function scoreBenefit(userInput: string, benefit: Benefit): number {
  const text = normalize(userInput);
  const tokens = tokenize(userInput);
  const haystack = normalize(
    [
      benefit.id,
      benefit.title,
      benefit.category,
      benefit.description,
      benefit.details,
      benefit.checklist.join(' '),
    ].join(' ')
  );

  let score = 0;

  for (const alias of getBenefitAliases(benefit)) {
    if (text.includes(normalize(alias))) {
      score += 10;
    }
  }

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += token.length > 4 ? 2 : 1;
    }
  }

  return score;
}

function scoreFaq(userInput: string, faq: FAQItem): number {
  const text = normalize(userInput);
  const tokens = tokenize(userInput);
  const searchable = normalize([faq.question, faq.answer, ...faq.keywords].join(' '));

  let score = 0;

  for (const keyword of faq.keywords) {
    if (text.includes(normalize(keyword))) {
      score += 8;
    }
  }

  if (text.includes(normalize(faq.question))) {
    score += 12;
  }

  for (const token of tokens) {
    if (searchable.includes(token)) {
      score += token.length > 4 ? 2 : 1;
    }
  }

  return score;
}
function scoreSpecialTopic(userInput: string, topic: ProgramGuidance): number {
  const text = normalize(userInput);
  const tokens = tokenize(userInput);
  const searchable = normalize([
    topic.title,
    topic.summary,
    topic.amount,
    topic.eligibility,
    topic.apply,
    topic.deadline,
    topic.renewal,
    topic.status,
    topic.correction,
    topic.studentStatus,
    topic.citizenship,
    ...topic.aliases,
  ].join(' '));

  let score = 0;

  for (const alias of topic.aliases) {
    if (text.includes(normalize(alias))) {
      score += 10;
    }
  }

  for (const token of tokens) {
    if (searchable.includes(token)) {
      score += token.length > 4 ? 2 : 1;
    }
  }

  return score;
}

function getRelatedBenefitForFaq(faq: FAQItem): Benefit | undefined {
  const overrideBenefitId = FAQ_TOPIC_GUIDANCE[faq.id]?.relatedBenefitId;

  if (overrideBenefitId) {
    return getBenefitById(overrideBenefitId);
  }

  const relatedBenefitIds = faq.relatedBenefitIds ?? [];
  return getBenefitById(relatedBenefitIds[0]);
}

function shouldPreferFaq(
  faq: FAQItem | undefined,
  faqScore: number,
  benefitScore: number,
  topicScore: number,
  intent: Intent
): boolean {
  if (!faq) return false;
  if (['amount', 'estimate', 'student-status', 'citizenship'].includes(intent)) return false;
  if (FAQ_FIRST_IDS.has(faq.id) && faqScore >= 6 && faqScore >= Math.max(benefitScore, topicScore)) return true;
  if (['correction', 'renewal', 'status'].includes(intent) && faqScore >= 5 && faqScore >= Math.max(benefitScore, topicScore)) return true;
  return faqScore >= Math.max(benefitScore, topicScore) + 2;
}

function shouldPreferSpecialTopic(topicScore: number, benefitScore: number, faqScore: number, intent: Intent): boolean {
  if (topicScore < 4) return false;

  if (
    [
      'amount',
      'estimate',
      'apply',
      'deadline',
      'renewal',
      'correction',
      'status',
      'student-status',
      'citizenship',
      'overview',
    ].includes(intent)
  ) {
    return topicScore >= benefitScore && topicScore >= faqScore - 1;
  }

  return topicScore >= benefitScore + 1 && topicScore >= faqScore + 1;
}

function buildBenefitResponse(benefit: Benefit, intent: Intent): string {
  return buildGuidanceResponse(BENEFIT_GUIDANCE[benefit.id], intent, benefit.checklist);
}

function buildSpecialTopicResponse(topicId: SpecialTopicId, intent: Intent): string {
  return buildGuidanceResponse(SPECIAL_TOPIC_GUIDANCE[topicId], intent);
}

function buildFaqResponse(faq: FAQItem, intent: Intent): string {
  const guidance = FAQ_TOPIC_GUIDANCE[faq.id];
  const relatedBenefit = getRelatedBenefitForFaq(faq);
  const relatedBenefitGuidance = relatedBenefit ? BENEFIT_GUIDANCE[relatedBenefit.id] : null;

  const title = guidance?.title ?? faq.question;
  const directAnswer = guidance?.directAnswer ?? faq.answer;
  const detailParagraphs = guidance?.details ?? [];

  let bulletTitle = 'What to do next';
  let bulletItems = guidance?.nextSteps ?? [];

  if (!bulletItems.length && intent === 'documents' && relatedBenefitGuidance) {
    bulletTitle = 'What to gather';
    bulletItems = relatedBenefitGuidance.documents;
  } else if (!bulletItems.length && intent === 'checklist' && relatedBenefit) {
    bulletItems = relatedBenefit.checklist;
  }

  const links = guidance?.links ?? relatedBenefitGuidance?.links ?? (faq.officialUrl ? [{ label: 'Open official page', url: faq.officialUrl }] : []);

  if (intent === 'official-link') {
    return buildResponse({
      title,
      paragraphs: ['These are the most useful official pages for this topic.'],
      links,
    });
  }

  if (intent === 'documents' && relatedBenefitGuidance) {
    return buildResponse({
      title,
      paragraphs: [directAnswer, ...detailParagraphs],
      bulletTitle: 'What to gather',
      bulletItems: relatedBenefitGuidance.documents,
      links,
      followUp:
        guidance?.followUp ??
        'If you want, I can also explain deadlines, next steps, or official application paths for this topic.',
    });
  }

  return buildResponse({
    title,
    paragraphs: [directAnswer, ...detailParagraphs],
    bulletTitle,
    bulletItems,
    links,
    followUp:
      guidance?.followUp ??
      (relatedBenefit
        ? `If you want, I can also break down ${relatedBenefit.title} amount, eligibility, deadlines, or next steps.`
        : 'If you want, ask a follow-up and I can narrow this down further.'),
  });
}

function buildProgramSnapshot(guidance: ProgramGuidance): string {
  return [
    guidance.title,
    `- What it is: ${guidance.summary}`,
    `- Money: ${guidance.amount}`,
    `- Who it is mainly for: ${guidance.eligibility}`,
    `- Timing: ${guidance.deadline}`,
  ].join('\n');
}

function buildComparisonResponse(matchedBenefits: Benefit[]): string {
  const [first, second] = matchedBenefits;
  const firstGuidance = BENEFIT_GUIDANCE[first.id];
  const secondGuidance = BENEFIT_GUIDANCE[second.id];

  return joinSections([
    `Comparing ${first.title} and ${second.title}`,
    `Biggest difference\n${first.title} and ${second.title} are separate programs, so you can be matched to both. The main differences are who each program is for, how the amount is decided, and whether the rules are federal or Massachusetts-specific.`,
    buildProgramSnapshot(firstGuidance),
    buildProgramSnapshot(secondGuidance),
    `Official links\n${formatLinks([...firstGuidance.links, ...secondGuidance.links])}`,
  ]);
}

function buildMixedComparisonResponse(topicId: SpecialTopicId, benefit: Benefit): string {
  const topic = SPECIAL_TOPIC_GUIDANCE[topicId];
  const benefitGuidance = BENEFIT_GUIDANCE[benefit.id];

  return joinSections([
    `Comparing ${topic.title} and ${benefit.title}`,
    `Biggest difference\n${topic.title} is an application or aid process. ${benefit.title} is the actual program or benefit you may receive if you qualify.`,
    buildProgramSnapshot(topic),
    buildProgramSnapshot(benefitGuidance),
    `Official links\n${formatLinks([...topic.links, ...benefitGuidance.links])}`,
  ]);
}

function buildHelpResponse(): string {
  return buildResponse({
    title: 'What I can help with',
    paragraphs: [
      'I can answer CommonMASS questions about benefit amounts, eligibility, deadlines, student-status rules, citizenship basics, corrections, renewals, status checks, official links, and the differences between programs.',
    ],
    bulletTitle: 'Try asking',
    bulletItems: SUGGESTED_PROMPTS,
  });
}

function buildGeneralResponse(input: string): string {
  const intent = detectIntent(input);

  if (intent === 'greeting') {
    return 'Hi - I can help with CommonMASS benefits, FAFSA or MASFA questions, benefit amounts, deadlines, student-status rules, renewals, and official links.';
  }

  if (intent === 'gratitude') {
    return 'You are welcome. If you want, ask another question about benefit amounts, eligibility, deadlines, renewals, or official links.';
  }

  return buildHelpResponse();
}
function generateResolution(
  userMessage: string,
  previousContext: ConversationContext | null
): { content: string; context: ConversationContext | null } {
  const intent = detectIntent(userMessage);
  const scoredBenefits = benefits
    .map((benefit) => ({ benefit, score: scoreBenefit(userMessage, benefit) }))
    .sort((a, b) => b.score - a.score);
  const scoredFaqs = faqData
    .map((faq) => ({ faq, score: scoreFaq(userMessage, faq) }))
    .sort((a, b) => b.score - a.score);
  const scoredTopics = (Object.entries(SPECIAL_TOPIC_GUIDANCE) as [SpecialTopicId, ProgramGuidance][])
    .map(([topicId, topic]) => ({ topicId, topic, score: scoreSpecialTopic(userMessage, topic) }))
    .sort((a, b) => b.score - a.score);

  const topBenefit = scoredBenefits[0]?.benefit;
  const topBenefitScore = scoredBenefits[0]?.score ?? 0;
  const topFaq = scoredFaqs[0]?.faq;
  const topFaqScore = scoredFaqs[0]?.score ?? 0;
  const topTopicId = scoredTopics[0]?.topicId;
  const topTopicScore = scoredTopics[0]?.score ?? 0;
  const previousBenefit = getBenefitById(previousContext?.benefitId);
  const previousFaq = getFaqById(previousContext?.faqId);
  const previousTopicId = previousContext?.topicId;

  if (intent === 'help' || intent === 'greeting' || intent === 'gratitude') {
    return { content: buildGeneralResponse(userMessage), context: previousContext };
  }

  if (intent === 'compare') {
    const comparedBenefits = Array.from(
      new Map(
        scoredBenefits
          .filter((entry) => entry.score >= 5)
          .map(({ benefit }) => [benefit.id, benefit])
      ).values()
    );

    if (comparedBenefits.length >= 2) {
      return {
        content: buildComparisonResponse(comparedBenefits.slice(0, 2)),
        context: { benefitId: comparedBenefits[0].id },
      };
    }

    if (topTopicId && topBenefit && topTopicScore >= 5 && topBenefitScore >= 5) {
      return {
        content: buildMixedComparisonResponse(topTopicId, topBenefit),
        context: { topicId: topTopicId, benefitId: topBenefit.id },
      };
    }

    if (previousTopicId && topBenefit && topBenefitScore >= 5) {
      return {
        content: buildMixedComparisonResponse(previousTopicId, topBenefit),
        context: { topicId: previousTopicId, benefitId: topBenefit.id },
      };
    }

    if (previousBenefit && topTopicId && topTopicScore >= 5) {
      return {
        content: buildMixedComparisonResponse(topTopicId, previousBenefit),
        context: { topicId: topTopicId, benefitId: previousBenefit.id },
      };
    }

    return {
      content:
        'Tell me which two programs or topics you want to compare, like Pell Grant vs MASSGrant or FAFSA vs Pell Grant.',
      context: previousContext,
    };
  }

  if (topTopicId && shouldPreferSpecialTopic(topTopicScore, topBenefitScore, topFaqScore, intent)) {
    return {
      content: buildSpecialTopicResponse(topTopicId, intent === 'unknown' ? 'overview' : intent),
      context: { topicId: topTopicId },
    };
  }

  if (shouldPreferFaq(topFaq, topFaqScore, topBenefitScore, topTopicScore, intent)) {
    const relatedBenefit = topFaq ? getRelatedBenefitForFaq(topFaq) : undefined;
    return {
      content: buildFaqResponse(topFaq as FAQItem, intent === 'unknown' ? 'overview' : intent),
      context: { faqId: topFaq?.id, benefitId: relatedBenefit?.id },
    };
  }

  if (topBenefit && topBenefitScore >= 5) {
    return {
      content: buildBenefitResponse(topBenefit, intent === 'unknown' ? 'overview' : intent),
      context: { benefitId: topBenefit.id },
    };
  }

  if (topTopicId && topTopicScore >= 4) {
    return {
      content: buildSpecialTopicResponse(topTopicId, intent === 'unknown' ? 'overview' : intent),
      context: { topicId: topTopicId },
    };
  }

  if ((CONTEXTUAL_INTENTS.has(intent) || looksLikeFollowUp(userMessage)) && previousTopicId) {
    return {
      content: buildSpecialTopicResponse(previousTopicId, intent === 'unknown' ? 'overview' : intent),
      context: previousContext,
    };
  }

  if (looksLikeFollowUp(userMessage) && previousFaq) {
    return {
      content: buildFaqResponse(previousFaq, intent === 'unknown' ? 'overview' : intent),
      context: previousContext,
    };
  }

  if ((CONTEXTUAL_INTENTS.has(intent) || looksLikeFollowUp(userMessage)) && previousBenefit) {
    return {
      content: buildBenefitResponse(previousBenefit, intent === 'unknown' ? 'overview' : intent),
      context: previousContext,
    };
  }

  return { content: buildGeneralResponse(userMessage), context: previousContext };
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi - I'm the CommonMASS Benefits Assistant. I can help with Pell Grant, MASSGrant, MassHealth, SNAP, MBTA student pass questions, plus FAFSA or MASFA basics, amounts, deadlines, eligibility, renewals, and official links.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<ConversationContext | null>(null);

  const quickPrompts = useMemo(() => SUGGESTED_PROMPTS, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submitMessage = (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const resolution = generateResolution(trimmed, contextRef.current);
      contextRef.current = resolution.context;

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: resolution.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 260);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitMessage(input);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_28px_80px_-44px_rgba(2,6,23,0.98)]">
      <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-black dark:text-slate-100">Benefits Assistant</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">Grounded in CommonMASS benefit and FAQ content</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(!isMinimized)}
          className="hover:bg-gray-200 dark:hover:bg-slate-800"
        >
          {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-300 dark:hover:text-sky-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div ref={scrollRef} className="h-96 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-slate-800">
                      <Bot className="h-4 w-4 text-gray-700" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'border border-gray-200 bg-gray-100 text-black dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className="space-y-3">
                      {renderLinkedText(message.content, {
                        paragraphClassName: 'text-sm leading-relaxed',
                        linkClassName:
                          message.role === 'user'
                            ? 'text-white underline underline-offset-4 hover:text-white/90'
                            : 'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
                      })}
                    </div>

                    {message.role === 'assistant' && message.content.includes('http') && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Links open in a new tab
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-950/80">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about Pell, FAFSA, SNAP, MassHealth, deadlines, amounts, or eligibility..."
                  className="flex-1 bg-white border-gray-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-[#f97316] text-white hover:bg-[#ea580c]"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
