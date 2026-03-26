import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Benefit } from '../data/benefitsData';
import { benefits } from '../data/benefitsData';
import { getEffectiveMassGrantPlusIncomeBand } from '../data/incomeThresholds';
import { isMassGrantPlusEligibleSchool, isMbtaEligibleSchool } from '../data/massachusettsSchools';

interface BenefitsContextType {
  answers: Record<string, string>;
  setAnswer: (questionId: string, answer: string) => void;
  setAnswers: (nextAnswers: Record<string, string>) => void;
  screeningBenefitFilters: Benefit['id'][];
  setScreeningBenefitFilters: (nextFilters: Benefit['id'][]) => void;
  matchedBenefits: Benefit[];
  isEvaluating: boolean;
  evaluationError: string | null;
  evaluateBenefits: (overrideAnswers?: Record<string, string>) => Promise<Benefit[]>;
  checklistProgress: Record<string, boolean[]>;
  setChecklistItemChecked: (benefitId: string, itemIndex: number, checked: boolean) => void;
  reset: () => void;
}

const BenefitsContext = createContext<BenefitsContextType | undefined>(undefined);

export const useBenefits = () => {
  const context = useContext(BenefitsContext);
  if (!context) {
    throw new Error('useBenefits must be used within a BenefitsProvider');
  }
  return context;
};

// Snap helper //
const SNAP_LIMITS: Record<string, number> = {
  '1': 20000,
  '2': 27000,
  '3': 34000,
  '4': 41400,
};
function isBelowSnapLimit(profile: Record<string, string>): boolean {
  const household = profile['household_sizes'];
  const income = parseInt(profile['income_level']);

  if (!household || !income) return false;

  const limit = SNAP_LIMITS[household];
  if (!limit) return false;

  return income <= limit;
}

// Masshealth helper
const MASSHEALTH_LIMITS: Record<string, number> = {
  '1': 20800,
  '2': 28200,
  '3': 35600,
  '4': 43000,
};
function isBelowMassHealthLimit(profile: Record<string, string>): boolean {
  const household = profile['household_sizes'];
  const income = parseInt(profile['income_level']);

  if (!household || !income) return false;

  const limit = MASSHEALTH_LIMITS[household];
  if (!limit) return false;

  return income <= limit;
}
///////

const getBenefitById = (id: string) => benefits.find((benefit) => benefit.id === id);

const applyScreeningBenefitFilters = (
  matches: Benefit[],
  selectedBenefitFilters: Benefit['id'][]
): Benefit[] => {
  if (!selectedBenefitFilters.length) {
    return matches;
  }

  const selectedBenefitIdSet = new Set(selectedBenefitFilters);
  return matches.filter((benefit) => selectedBenefitIdSet.has(benefit.id));
};

const getMassGrantPlusEnrollmentStatus = (profile: Record<string, string>): 'full_time' | 'part_time' | null => {
  if (profile['student_status'] === 'full_time' || profile['student_status'] === 'future_full_time') {
    return 'full_time';
  }

  if (profile['student_status'] === 'part_time' || profile['student_status'] === 'future_part_time') {
    return 'part_time';
  }

  return null;
};

const isMassGrantPlusEnrollmentEligible = (profile: Record<string, string>): boolean => {
  const enrollmentStatus = getMassGrantPlusEnrollmentStatus(profile);
  const incomeBand = getEffectiveMassGrantPlusIncomeBand(profile);

  if (!incomeBand || incomeBand === 'over_100k') {
    return false;
  }

  if (incomeBand === '85k_to_100k') {
    return enrollmentStatus === 'full_time';
  }

  if (enrollmentStatus === 'full_time') {
    return true;
  }

  return enrollmentStatus === 'part_time';
};

const isMassGrantEnrollmentEligible = (profile: Record<string, string>): boolean =>
  profile['student_status'] === 'full_time' || profile['student_status'] === 'future_full_time';

const evaluateBenefitsLocally = (profile: Record<string, string>): Benefit[] => {
  const matches: Benefit[] = [];

  const isEnrolled =
    profile['student_status'] === 'full_time' || profile['student_status'] === 'part_time';

  const isStudentOrFuture =
    isEnrolled ||
    profile['student_status'] === 'future_full_time' ||
    profile['student_status'] === 'future_part_time';

  const isSnapIncomeEligible =
    profile['masshealth_income_under_limit'] === 'yes' ||
    profile['snap_income_under_limit'] === 'yes';

  const residencyLength = profile['residency_length'];
  const isMassachusettsResident = Boolean(residencyLength) && residencyLength !== 'not_ma_resident';
  const hasQualifyingMassGrantResidency =
    isMassachusettsResident && residencyLength !== 'under_12_months';

  if (isStudentOrFuture && profile['citizen_status'] === 'yes') {
    const benefit = getBenefitById('pell-grant');
    if (benefit) {
      matches.push({
        ...benefit,
        actionStatus:
          profile['fafsa_completed'] === 'yes'
            ? 'No action needed (already applied to FAFSA)'
            : 'Action needed - Complete FAFSA',
      });
    }
  }

  if (
    isMassGrantEnrollmentEligible(profile) &&
    profile['citizen_status'] === 'yes' &&
    hasQualifyingMassGrantResidency &&
    profile['prior_bachelors_degree'] === 'no'
  ) {
    const benefit = getBenefitById('massgrant');
    if (benefit) {
      matches.push({
        ...benefit,
        actionStatus:
          profile['fafsa_completed'] === 'yes'
            ? 'No action needed (already applied to FAFSA)'
            : 'Action needed - Complete FAFSA',
      });
    }
  }

  if (
    profile['citizen_status'] === 'yes' &&
    profile['efc_level'] === 'zero'  &&
    profile['massgrant-plus-uni'] === 'yes'
  ) {
    const benefit = getBenefitById('massgrant-plus');
    if (benefit) {
      matches.push({
        ...benefit,
        actionStatus:
          profile['fafsa_completed'] === 'yes'
            ? 'No action needed (already applied to FAFSA)'
            : 'Action needed - Complete FAFSA',
      });
    }
  }

  if (
    profile['citizen_status'] === 'yes' &&
    profile['ma_resident'] === 'yes' &&
    (profile['work_study'] === 'yes' || isBelowSnapLimit(profile))

  ) {
    const benefit = getBenefitById('snap');
    if (benefit) {
      matches.push({
        ...benefit,
        actionStatus: 'You likely qualify for SNAP. Apply through your state SNAP portal.',
      });
    }
  }

  if (
    isMassachusettsResident &&
    profile['citizen_status'] === 'yes' &&
    isBelowMassHealthLimit(profile)
  ) {
    const benefit = getBenefitById('masshealth');
    if (benefit) {
      matches.push(benefit);
    }
  }

  if (
    isStudentOrFuture &&
    profile['mbta-uni'] === 'yes'
  ) {
    const benefit = getBenefitById('mbta-pass');
    if (benefit) {
      matches.push(benefit);
    }
  }

  const uniqueMatches = Array.from(new Set(matches.map((benefit) => benefit.id)))
    .map((id) => matches.find((benefit) => benefit.id === id))
    .filter((benefit): benefit is Benefit => benefit !== undefined);

  return uniqueMatches;
};

const parseEligibilityResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `Eligibility endpoint returned ${contentType || 'a non-JSON response'}.`
    );
  }

  let raw: any = {};
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error('Eligibility API returned invalid JSON.');
  }

  if (typeof raw?.body === 'string') {
    try {
      return JSON.parse(raw.body);
    } catch {
      return raw;
    }
  }

  return raw;
};

export const BenefitsProvider = ({ children }: { children: ReactNode }) => {
  const [answers, setAnswersState] = useState<Record<string, string>>({});
  const [matchedBenefits, setMatchedBenefits] = useState<Benefit[]>([]);
  const [screeningBenefitFilters, setScreeningBenefitFiltersState] = useState<Benefit['id'][]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean[]>>({});

  const setAnswer = (questionId: string, answer: string) => {
    setAnswersState((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const setAnswers = (nextAnswers: Record<string, string>) => {
    setAnswersState(nextAnswers);
  };

  const setScreeningBenefitFilters = (nextFilters: Benefit['id'][]) => {
    setScreeningBenefitFiltersState(Array.from(new Set(nextFilters)));
  };

  const evaluateBenefits = async (
    overrideAnswers?: Record<string, string>
  ): Promise<Benefit[]> => {
    const profile = overrideAnswers ?? answers;
    const configuredUrl = import.meta.env.VITE_ELIGIBILITY_API_URL?.trim();

    setIsEvaluating(true);
    setEvaluationError(null);

    if (!configuredUrl) {
      console.warn(
        'VITE_ELIGIBILITY_API_URL is missing. Falling back to local eligibility evaluation.'
      );

      const fallbackMatches = evaluateBenefitsLocally(profile);
      const filteredMatches = applyScreeningBenefitFilters(fallbackMatches, screeningBenefitFilters);
      setMatchedBenefits(filteredMatches);
      setEvaluationError(null);
      setIsEvaluating(false);
      return filteredMatches;
    }

    try {
      const response = await fetch(configuredUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      const data = await parseEligibilityResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to evaluate eligibility.');
      }

      const nextMatches = data?.matchedBenefits ?? data?.matches ?? data?.benefits ?? [];

      if (!Array.isArray(nextMatches)) {
        throw new Error('Eligibility API returned an invalid matches payload.');
      }

      const filteredMatches = applyScreeningBenefitFilters(nextMatches as Benefit[], screeningBenefitFilters);
      setMatchedBenefits(filteredMatches);
      return filteredMatches;
    } catch (error) {
      console.error(
        'Eligibility API failed. Falling back to local eligibility evaluation.',
        error
      );

      const fallbackMatches = evaluateBenefitsLocally(profile);
      const filteredMatches = applyScreeningBenefitFilters(fallbackMatches, screeningBenefitFilters);
      setMatchedBenefits(filteredMatches);
      setEvaluationError(null);
      return filteredMatches;
    } finally {
      setIsEvaluating(false);
    }
  };

  const setChecklistItemChecked = (
    benefitId: string,
    itemIndex: number,
    checked: boolean
  ) => {
    setChecklistProgress((prev) => {
      const nextBenefitProgress = [...(prev[benefitId] || [])];
      nextBenefitProgress[itemIndex] = checked;

      return {
        ...prev,
        [benefitId]: nextBenefitProgress,
      };
    });
  };

  const reset = () => {
    setAnswersState({});
    setMatchedBenefits([]);
    setChecklistProgress({});
    setScreeningBenefitFiltersState([]);
    setEvaluationError(null);
  };

  return (
    <BenefitsContext.Provider
      value={{
        answers,
        setAnswer,
        setAnswers,
        screeningBenefitFilters,
        setScreeningBenefitFilters,
        matchedBenefits,
        isEvaluating,
        evaluationError,
        evaluateBenefits,
        checklistProgress,
        setChecklistItemChecked,
        reset,
      }}
    >
      {children}
    </BenefitsContext.Provider>
  );
};
