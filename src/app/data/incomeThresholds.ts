import incomeThresholds from './incomeThresholds.json';

export type BenefitProfile = Record<string, string>;

type ThresholdProgram = 'snap' | 'masshealth';

type ThresholdConfig = {
  programLabel: string;
  unit: 'monthly' | 'yearly';
  basisLabel: string;
  thresholds: Record<string, number>;
  additionalPersonIncrement: number;
};

const thresholdConfigs = incomeThresholds as Record<ThresholdProgram, ThresholdConfig>;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function getExactHouseholdSize(profile: BenefitProfile): number | null {
  const rawHouseholdSize = profile['household_sizes'];

  if (!rawHouseholdSize) {
    return null;
  }

  const exactValue = rawHouseholdSize === '9_plus'
    ? profile['household_size_exact']
    : rawHouseholdSize;

  const parsedValue = Number.parseInt(exactValue ?? '', 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  if (rawHouseholdSize === '9_plus' && parsedValue < 9) {
    return null;
  }

  return parsedValue;
}

export function hasResolvedHouseholdSize(profile: BenefitProfile): boolean {
  return getExactHouseholdSize(profile) !== null;
}

export function getIncomeThreshold(
  program: ThresholdProgram,
  profileOrHouseholdSize: BenefitProfile | number
): number | null {
  const householdSize =
    typeof profileOrHouseholdSize === 'number'
      ? profileOrHouseholdSize
      : getExactHouseholdSize(profileOrHouseholdSize);

  if (!householdSize) {
    return null;
  }

  const config = thresholdConfigs[program];

  if (householdSize <= 8) {
    return config.thresholds[String(householdSize)] ?? null;
  }

  const householdSizeEightThreshold = config.thresholds['8'];

  if (householdSizeEightThreshold === undefined) {
    return null;
  }

  return householdSizeEightThreshold + (householdSize - 8) * config.additionalPersonIncrement;
}

export function getIncomeQuestionText(
  program: ThresholdProgram,
  profile: BenefitProfile
): string {
  const householdSize = getExactHouseholdSize(profile);
  const threshold = getIncomeThreshold(program, profile);

  if (!householdSize || threshold === null) {
    return 'Income threshold unavailable for this household size.';
  }

  const unitLabel = thresholdConfigs[program].unit === 'monthly' ? 'monthly' : 'yearly';

  return `Is your household of ${householdSize}'s ${unitLabel} gross income less than ${formatCurrency(threshold)}?`;
}

export function getIncomeQuestionHelperText(
  program: ThresholdProgram,
  profile: BenefitProfile
): string {
  const householdSize = getExactHouseholdSize(profile);
  const config = thresholdConfigs[program];

  if (!householdSize) {
    return '';
  }

  if (program === 'masshealth') {
    return `This uses the 2026 MassHealth screening guideline for a household of ${householdSize}.`;
  }

  return `This uses SNAP's ${config.basisLabel.toLowerCase()} for a household of ${householdSize}.`;
}

const MASSGRANT_PLUS_UNDER_85K_LIMIT = 85000;

export type MassGrantPlusIncomeBand = 'under_85k' | '85k_to_100k' | 'over_100k';

export function getInferredMassGrantPlusIncomeBand(
  profile: BenefitProfile
): MassGrantPlusIncomeBand | null {
  const massHealthThreshold = getIncomeThreshold('masshealth', profile);
  if (
    profile['masshealth_income_under_limit'] === 'yes' &&
    massHealthThreshold !== null &&
    massHealthThreshold <= MASSGRANT_PLUS_UNDER_85K_LIMIT
  ) {
    return 'under_85k';
  }

  const snapThreshold = getIncomeThreshold('snap', profile);
  if (
    profile['snap_income_under_limit'] === 'yes' &&
    snapThreshold !== null &&
    snapThreshold * 12 <= MASSGRANT_PLUS_UNDER_85K_LIMIT
  ) {
    return 'under_85k';
  }

  return null;
}

export function getEffectiveMassGrantPlusIncomeBand(
  profile: BenefitProfile
): MassGrantPlusIncomeBand | null {
  const inferredBand = getInferredMassGrantPlusIncomeBand(profile);

  if (inferredBand) {
    return inferredBand;
  }

  const explicitBand = profile['massgrant_plus_income_band'];
  if (
    explicitBand === 'under_85k' ||
    explicitBand === '85k_to_100k' ||
    explicitBand === 'over_100k'
  ) {
    return explicitBand;
  }

  return null;
}
