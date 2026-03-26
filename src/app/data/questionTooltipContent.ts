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
  note: 'Exact rules vary by benefit program and final eligibility is decided by the agency reviewing the application.',
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
