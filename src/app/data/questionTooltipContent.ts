import type { InlineTooltipDefinition } from './questionRichText';
import { massGrantPlusEligibleSchools, mbtaEligibleSchools } from './massachusettsSchools';

export const eligibleNonCitizenTooltip: InlineTooltipDefinition = {
  title: 'Eligible non-citizen',
  paragraphs: [
    'This usually means an immigration status that benefit programs commonly recognize, even if the person is not a U.S. citizen.',
  ],
  items: [
    'Often includes lawful permanent residents (green card holders), refugees, asylees, Cuban-Haitian entrants, parolees admitted for at least one year, T-visa holders, and some other humanitarian statuses.',
    'Usually does not include undocumented status, visitor visas, and most temporary student or work visas.',
  ],
  note:
    'Exact rules vary by benefit program and final eligibility is decided by the agency reviewing the application. Students who are not able to use federal aid rules may still have a separate Massachusetts state-aid path through MASFA and the Tuition Equity Law.',
};

export const masfaTooltip: InlineTooltipDefinition = {
  title: 'MASFA',
  paragraphs: [
    'MASFA stands for the Massachusetts Application for State Financial Aid.',
    'It is the Massachusetts state-aid application for some students who cannot complete the FAFSA because of immigration or citizenship status.',
  ],
  note:
    'Students should complete only one application, FAFSA or MASFA, based on which path they are eligible to use.',
};

export const residencyStatusTooltip: InlineTooltipDefinition = {
  title: 'Massachusetts residency status',
  paragraphs: [
    'Massachusetts residency generally means you live in Massachusetts and intend to stay here, not just visit temporarily.',
    'Some programs use stricter residency rules. MASSGrant and MASSGrant Plus are screened here using the 12-month option as a proxy for living in Massachusetts for reasons other than education.',
  ],
};

export const householdSizeTooltip: InlineTooltipDefinition = {
  title: 'Household size',
  paragraphs: [
    'Think about the people whose income and basic support are tied together in your home, not just everyone at your address.',
    'For SNAP especially, a household usually means the people who live with you and buy and prepare food together.',
  ],
  items: [
    'Usually include yourself, your spouse, and the people you support or who depend on you financially.',
    'Roommates who buy and prepare food separately usually do not count in the same SNAP household.',
  ],
  note: 'If your situation is complicated, the agency can make the final household-size determination.',
};

export const grossIncomeTooltip: InlineTooltipDefinition = {
  title: 'Gross income',
  paragraphs: [
    'Gross income means the money your household gets before taxes or other deductions are taken out.',
    'It is not the same as take-home pay.',
  ],
};

export const itinTooltip: InlineTooltipDefinition = {
  title: 'Individual Taxpayer Identification Number (ITIN)',
  paragraphs: [
    'An ITIN is a tax processing number issued by the IRS for people who are not eligible for a Social Security number.',
  ],
  note:
    'For the MASFA high-school-completer pathway, documentation showing that an ITIN was issued can satisfy one of the listed documentation options.',
};

export const selectiveServiceTooltip: InlineTooltipDefinition = {
  title: 'Selective Service registration',
  paragraphs: [
    'Selective Service registration is the federal registration requirement that may apply to some people assigned male at birth who live in the United States.',
  ],
  note:
    'If this requirement does not apply to you, Massachusetts says the other MASFA documentation options may still be relevant instead.',
};

export const taxDocumentsTooltip: InlineTooltipDefinition = {
  title: 'Tax Documents Needed for FAFSA / Pell Grant',
  items: [
    'Form 1040 (Federal Tax Return)',
    {
      groupLabel: 'Schedules (if applicable)',
      subItems: [
        'Schedule 1 (if applicable)',
        'Schedule 2 (if applicable)',
        'Schedule 3 (if applicable)',
      ],
    },
    'W-2 forms from all employers',
    {
      groupLabel: '1099 forms (if applicable)',
      subItems: [
        '1099-NEC (if applicable)',
        '1099-INT (if applicable)',
        '1099-DIV (if applicable)',
        '1099-G (if applicable)',
        '1099-R (if applicable)',
      ],
    },
    'Records of untaxed income (child support received, workers\u2019 comp, disability, veterans benefits, housing/food allowances)',
    'Bank account balances',
    'Investment account balances',
  ],
  scrollable: true,
  widthClassName: 'w-[26rem] max-w-[calc(100vw-2rem)]',
  maxHeightClassName: 'max-h-[13rem]',
};

export const massHealthDocumentsTooltip: InlineTooltipDefinition = {
  title: 'Documents Needed for MassHealth',
  items: [
    'Proof of identity (e.g. driver\u2019s license, passport, or state ID)',
    'Recent pay stubs (if currently employed)',
    'Rental income documentation (if applicable)',
    'Life insurance cash value statements (if applicable)',
    {
      groupLabel: 'Property & vehicle documents (if applicable)',
      subItems: [
        'Vehicle registration and loan balance (if applicable)',
        'Property tax bill or mortgage statement (if applicable)',
      ],
    },
    {
      groupLabel: 'Health & insurance cards (if applicable)',
      subItems: [
        'Medicare card (if applicable)',
        'Other health insurance cards (if applicable)',
      ],
    },
    {
      groupLabel: 'Special circumstances (if applicable)',
      subItems: [
        'Disability documentation (if applicable)',
        'Pregnancy verification (if applicable)',
        'Proof of incarceration status (if applicable)',
      ],
    },
  ],
  scrollable: true,
  widthClassName: 'w-[26rem] max-w-[calc(100vw-2rem)]',
  maxHeightClassName: 'max-h-[13rem]',
};

export const massHealthResidencyTooltip: InlineTooltipDefinition = {
  title: 'MassHealth Residency Documents',
  items: [
    'Proof of Massachusetts residency (MA ID or driver\'s license, utility bill, lease agreement, or mail with your MA address)',
  ],
};

export const massHealthIncomeDocumentationTooltip: InlineTooltipDefinition = {
  title: 'MassHealth Income Documentation',
  items: [
    'Recent pay stubs (if employed, usually from the last 30 days)',
    'Proof of self-employment income (if applicable, profit/loss statement or recent business invoices)',
    'Unemployment benefit statements (if applicable)',
    'Pension or retirement income statements (if applicable, SSA-1099 or pension benefit letter)',
    'Rental income documentation (if applicable, rent ledger or bank deposit records)',
  ],
  scrollable: true,
  widthClassName: 'w-[26rem] max-w-[calc(100vw-2rem)]',
  maxHeightClassName: 'max-h-[13rem]',
};

export const massHealthIdentityCitizenshipTooltip: InlineTooltipDefinition = {
  title: 'Identity and Citizenship Documents',
  items: [
    'Proof of identity (passport, school photo ID, or another government-issued photo ID)',
    'Proof of citizenship or immigration status (U.S. birth certificate, U.S. passport, permanent resident card, or immigration document)',
    'Social Security Number (if you have one; card, official letter, or a form that shows your SSN)',
  ],
};

export const massHealthApplicationStepTooltip: InlineTooltipDefinition = {
  title: 'Apply Through MAhealthconnector.org',
  paragraphs: [
    'Complete the application through Massachusetts Health Connector and upload requested documents during the online process.',
  ],
  note: 'Have your documents ready before you start so you can finish in one session.',
};

export const massHealthPlanSelectionTooltip: InlineTooltipDefinition = {
  title: 'Documents Commonly Needed Before Plan Finalization',
  items: [
    'Bank account statements (most recent monthly statement)',
    'Investment account statements (brokerage or retirement account statements)',
    'Life insurance cash value statements (if applicable)',
    'Vehicle registration and loan balance (if applicable, registration and current payoff statement)',
    'Property tax bill or mortgage statement (if applicable)',
    'Medicare card (if applicable)',
    'Other health insurance cards (if applicable)',
    'Disability documentation (if applicable)',
    'Pregnancy verification (if applicable)',
    'Proof of incarceration status (if applicable)',
  ],
  scrollable: true,
  widthClassName: 'w-[26rem] max-w-[calc(100vw-2rem)]',
  maxHeightClassName: 'max-h-[13rem]',
};

export const dheAffidavitTooltip: InlineTooltipDefinition = {
  title: 'DHE Tuition Equity Form and Affidavit',
  paragraphs: [
    'Massachusetts uses this Tuition Equity Law form for students who cannot provide a Social Security number, ITIN document, or Selective Service registration document for the MASFA high-school-completer pathway.',
    'The affidavit states that, if you are not currently a citizen or legal permanent resident, you will apply to become one within 120 days after you become eligible to do so.',
  ],
  note: 'The form is usually submitted to the Massachusetts college you attend or plan to attend.',
};

export const massGrantPlusSchoolsTooltip: InlineTooltipDefinition = {
  title: 'MASSGrant Plus participating colleges and universities',
  items: [...massGrantPlusEligibleSchools],
  scrollable: true,
  widthClassName: 'w-[26rem] max-w-[calc(100vw-2rem)]',
  maxHeightClassName: 'max-h-80',
};

export const mbtaSchoolsTooltip: InlineTooltipDefinition = {
  title: 'Participating MBTA student-pass schools',
  items: [...mbtaEligibleSchools],
  scrollable: true,
  widthClassName: 'w-[26rem] max-w-[calc(100vw-2rem)]',
  maxHeightClassName: 'max-h-80',
};
