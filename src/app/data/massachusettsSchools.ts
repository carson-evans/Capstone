const publicMassachusettsSchools = [
  'Berkshire Community College',
  'Bridgewater State University',
  'Bristol Community College',
  'Bunker Hill Community College',
  'Cape Cod Community College',
  'Fitchburg State University',
  'Framingham State University',
  'Greenfield Community College',
  'Holyoke Community College',
  'Massachusetts Bay Community College',
  'Massachusetts College of Art and Design',
  'Massachusetts College of Liberal Arts',
  'Massachusetts Maritime Academy',
  'Massasoit Community College',
  'Middlesex Community College',
  'Mount Wachusett Community College',
  'North Shore Community College',
  'Northern Essex Community College',
  'Quinsigamond Community College',
  'Roxbury Community College',
  'Salem State University',
  'Springfield Technical Community College',
  'University of Massachusetts Amherst',
  'University of Massachusetts Boston',
  'University of Massachusetts Dartmouth',
  'University of Massachusetts Lowell',
  'Westfield State University',
  'Worcester State University',
];

const privateMassachusettsSchools = [
  'Amherst College',
  'Anna Maria College',
  'Assumption University',
  'Babson College',
  'Bay Path University',
  'Bentley University',
  'Berklee College of Music',
  'Boston Architectural College',
  'Boston Baptist College',
  'Boston College',
  'Boston Graduate School of Psychoanalysis',
  'Boston University',
  'Brandeis University',
  'Cambridge College',
  'Clark University',
  'College of the Holy Cross',
  'Curry College',
  'Dean College',
  'Elms College',
  'Emerson College',
  'Emmanuel College',
  'Endicott College',
  'Fisher College',
  'Franklin Cummings Tech',
  'Gordon College',
  'Hampshire College',
  'Harvard University',
  'Hebrew College',
  'Laboure College of Healthcare',
  'Lasell University',
  'Lesley University',
  'Longy School of Music of Bard College',
  'Massachusetts Institute of Technology',
  'MCPHS University',
  'Merrimack College',
  'MGH Institute of Health Professions',
  'Montserrat College of Art',
  'Mount Holyoke College',
  'New England College of Optometry',
  'New England Conservatory of Music',
  'New England Law | Boston',
  'Nichols College',
  'Northeastern University',
  'Olin College of Engineering',
  'Quincy College',
  'Regis College',
  'Sattler College',
  'Simmons University',
  'Smith College',
  'Springfield College',
  'Stonehill College',
  'Suffolk University',
  'Thomas Aquinas College',
  'Tufts University',
  'Urban College of Boston',
  'Wellesley College',
  'Wentworth Institute of Technology',
  'Western New England University',
  'Wheaton College',
  'William James College',
  'Williams College',
  'Worcester Polytechnic Institute',
];

const schoolAliasMap: Record<string, string> = {
  'Benjamin Franklin Institute of Technology': 'Franklin Cummings Tech',
  'Harvard Graduate School of Arts and Sciences': 'Harvard University',
  'Harvard Divinity School': 'Harvard University',
  'Harvard Graduate School of Education': 'Harvard University',
  'Harvard Kennedy School': 'Harvard University',
  'Harvard Law School': 'Harvard University',
  'Harvard Medical School': 'Harvard University',
  'Harvard School of Dental Medicine': 'Harvard University',
  'Harvard T.H. Chan School of Public Health': 'Harvard University',
  'Harvard University Graduate School of Design': 'Harvard University',
  'Lasell College': 'Lasell University',
  'New England Conservatory': 'New England Conservatory of Music',
  'Simmons College': 'Simmons University',
  'Suffolk University Boston': 'Suffolk University',
  'Suffolk University Law School': 'Suffolk University',
};

export const massGrantPlusEligibleSchools = [
  'Bridgewater State University',
  'Fitchburg State University',
  'Framingham State University',
  'Massachusetts College of Art and Design',
  'Massachusetts College of Liberal Arts',
  'Massachusetts Maritime Academy',
  'Salem State University',
  'University of Massachusetts Amherst',
  'University of Massachusetts Boston',
  'University of Massachusetts Dartmouth',
  'University of Massachusetts Lowell',
  'Westfield State University',
  'Worcester State University',
] as const;

export const mbtaEligibleSchools = [
  'Berklee College of Music',
  'Boston Architectural College',
  'Boston College',
  'Boston Graduate School of Psychoanalysis',
  'Boston University',
  'Bridgewater State University',
  'Bunker Hill Community College',
  'Curry College',
  'Emerson College',
  'Emmanuel College',
  'Endicott College',
  'Fisher College',
  'Franklin Cummings Tech',
  'Harvard University',
  'Hebrew College',
  'Lasell University',
  'Lesley University',
  'Longy School of Music of Bard College',
  'Massachusetts College of Art and Design',
  'Massachusetts Institute of Technology',
  'MCPHS University',
  'MGH Institute of Health Professions',
  'New England College of Optometry',
  'New England Conservatory of Music',
  'New England Law | Boston',
  'Northeastern University',
  'Quincy College',
  'Salem State University',
  'Simmons University',
  'Stonehill College',
  'Suffolk University',
  'Tufts University',
  'University of Massachusetts Boston',
  'Wentworth Institute of Technology',
] as const;

const allMassachusettsSchools = Array.from(
  new Set([...publicMassachusettsSchools, ...privateMassachusettsSchools])
).sort((left, right) => left.localeCompare(right));

const massGrantPlusEligibleSchoolSet = new Set(massGrantPlusEligibleSchools);
const mbtaEligibleSchoolSet = new Set(mbtaEligibleSchools);

export function normalizeMassachusettsSchoolName(schoolName?: string | null): string {
  const trimmedSchoolName = schoolName?.trim();

  if (!trimmedSchoolName) {
    return '';
  }

  return schoolAliasMap[trimmedSchoolName] ?? trimmedSchoolName;
}

export function isMassGrantPlusEligibleSchool(schoolName?: string | null): boolean {
  const normalizedSchoolName = normalizeMassachusettsSchoolName(schoolName);
  return normalizedSchoolName !== '' && massGrantPlusEligibleSchoolSet.has(normalizedSchoolName as typeof massGrantPlusEligibleSchools[number]);
}

export function isMbtaEligibleSchool(schoolName?: string | null): boolean {
  const normalizedSchoolName = normalizeMassachusettsSchoolName(schoolName);
  return normalizedSchoolName !== '' && mbtaEligibleSchoolSet.has(normalizedSchoolName as typeof mbtaEligibleSchools[number]);
}

export const allMassachusettsSchoolOptions = allMassachusettsSchools.map((schoolName) => ({
  label: schoolName,
  value: schoolName,
}));
const otherSchoolOption = {
  label: 'Other',
  value: 'other',
} as const;
const undecidedSchoolOption = {
  label: 'Undecided',
  value: 'undecided',
} as const;
const massachusettsSchoolOptionsWithOther = [...allMassachusettsSchoolOptions, otherSchoolOption];
const massachusettsSchoolOptionsWithOtherAndUndecided = [
  ...massachusettsSchoolOptionsWithOther,
  undecidedSchoolOption,
];
export function getMassachusettsSchoolOptions(includeUndecided = false) {
  return includeUndecided
    ? massachusettsSchoolOptionsWithOtherAndUndecided
    : massachusettsSchoolOptionsWithOther;
}


