import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  benefits as localBenefitCatalog,
  getBenefitApplicationType,
  sortBenefitsForDisplay,
  type Benefit,
} from '../data/benefitsData';
import {
  evaluateEligibilityRequest,
  type AnswerMap,
  type ChecklistProgressMap,
} from '@/lib/api';

const localBenefitCatalogById = new Map(
  localBenefitCatalog.map((benefit) => [benefit.id, benefit])
);

function withLocalChecklist(matches: Benefit[]): Benefit[] {
  return matches.map((match) => {
    const localDefinition = localBenefitCatalogById.get(match.id);

    if (!localDefinition) {
      return match;
    }

    return {
      ...localDefinition,
      ...match,
      officialUrl:
        match.id === 'snap'
          ? localDefinition.officialUrl
          : match.officialUrl ?? localDefinition.officialUrl,
      checklist: match.checklist ?? localDefinition.checklist,
    };
  });
}

interface BenefitsContextType {
  answers: AnswerMap;
  setAnswer: (questionId: string, answer: string) => void;
  setAnswers: (nextAnswers: AnswerMap) => void;
  screeningBenefitFilters: Benefit['id'][];
  setScreeningBenefitFilters: (nextFilters: Benefit['id'][]) => void;
  startNewScreening: (nextFilters?: Benefit['id'][]) => void;
  matchedBenefits: Benefit[];
  isEvaluating: boolean;
  evaluationError: string | null;
  evaluateBenefits: (overrideAnswers?: AnswerMap) => Promise<Benefit[]>;
  checklistProgress: ChecklistProgressMap;
  setChecklistItemChecked: (
    benefitId: string,
    itemIndex: number,
    checked: boolean
  ) => void;
  reset: () => void;
}

const BenefitsContext = createContext<BenefitsContextType | undefined>(undefined);

type ChecklistState = {
  progress: ChecklistProgressMap;
  autoCheckedBenefits: Record<string, boolean>;
  itemsByBenefit: Record<string, string[]>;
};

function uniqueBenefitIds(values: Benefit['id'][]): Benefit['id'][] {
  return Array.from(new Set(values));
}

const grantBenefitIds = new Set(['pell-grant', 'massgrant', 'massgrant-plus']);

function getGrantApplicationStatus(
  benefitId: string,
  answers: AnswerMap
): string | null {
  if (!grantBenefitIds.has(benefitId)) {
    return null;
  }

  const applicationType = getBenefitApplicationType(benefitId, answers);

  if (applicationType === 'fafsa') {
    return answers.fafsa_completed ?? null;
  }

  if (applicationType === 'masfa') {
    return answers.masfa_completed ?? null;
  }

  return null;
}

function buildChecklistState(
  matches: Benefit[],
  previousProgress: ChecklistProgressMap,
  answers: AnswerMap
): ChecklistProgressMap {
  return matches.reduce<ChecklistProgressMap>((accumulator, benefit) => {
    const checklist = benefit.checklist ?? [];
    const grantApplicationStatus = getGrantApplicationStatus(benefit.id, answers);

    if (grantApplicationStatus) {
      accumulator[benefit.id] = checklist.map(
        () => grantApplicationStatus === 'yes'
      );
      return accumulator;
    }

    accumulator[benefit.id] = checklist.map(
      (_item, index) => previousProgress[benefit.id]?.[index] ?? false
    );

    return accumulator;
  }, createEmptyChecklistState());
}

export const useBenefits = () => {
  const context = useContext(BenefitsContext);

  if (!context) {
    throw new Error('useBenefits must be used within a BenefitsProvider');
  }

  return context;
};

export const BenefitsProvider = ({ children }: { children: ReactNode }) => {
  const [answers, setAnswersState] = useState<AnswerMap>({});
  const [serverMatchedBenefits, setServerMatchedBenefits] = useState<Benefit[]>([]);
  const [screeningBenefitFilters, setScreeningBenefitFiltersState] = useState<
    Benefit['id'][]
  >([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [checklistProgress, setChecklistProgress] =
    useState<ChecklistProgressMap>({});

  const matchedBenefits = useMemo(
    () => sortBenefitsForDisplay(withLocalChecklist(serverMatchedBenefits), answers),
    [answers, serverMatchedBenefits]
  );

  useEffect(() => {
    if (matchedBenefits.length === 0) {
      setChecklistProgress({});
      return;
    }

    setChecklistProgress((previousProgress) =>
      buildChecklistProgress(matchedBenefits, previousProgress, answers)
    );
  }, [answers, matchedBenefits]);

  const clearPreviousResults = useCallback(() => {
    setServerMatchedBenefits([]);
    setChecklistProgress({});
    setEvaluationError(null);
  }, []);

  const reset = useCallback(() => {
    setAnswersState({});
    setServerMatchedBenefits([]);
    setChecklistProgress({});
    setScreeningBenefitFiltersState([]);
    setEvaluationError(null);
    setIsEvaluating(false);
  }, []);

  const startNewScreening = useCallback((nextFilters: Benefit['id'][] = []) => {
    setAnswersState({});
    setServerMatchedBenefits([]);
    setChecklistProgress({});
    setEvaluationError(null);
    setIsEvaluating(false);
    setScreeningBenefitFiltersState(uniqueBenefitIds(nextFilters));
  }, []);

  const setAnswer = useCallback(
    (questionId: string, answer: string) => {
      setAnswersState((previousAnswers) => ({
        ...previousAnswers,
        [questionId]: answer,
      }));

      clearPreviousResults();
    },
    [clearPreviousResults]
  );

  const setAnswers = useCallback(
    (nextAnswers: AnswerMap) => {
      setAnswersState(nextAnswers);
      clearPreviousResults();
    },
    [clearPreviousResults]
  );

  const setScreeningBenefitFilters = useCallback((nextFilters: Benefit['id'][]) => {
    setScreeningBenefitFiltersState(uniqueBenefitIds(nextFilters));
    setServerMatchedBenefits([]);
    setChecklistProgress({});
    setEvaluationError(null);
  }, []);

  const evaluateBenefits = useCallback(
    async (overrideAnswers?: AnswerMap): Promise<Benefit[]> => {
      const profile = { ...(overrideAnswers ?? answers) };

      setIsEvaluating(true);
      setEvaluationError(null);
      setServerMatchedBenefits([]);
      setChecklistProgress({});

      try {
        const apiMatches = await evaluateEligibilityRequest(
          profile,
          screeningBenefitFilters
        );

        const nextMatches = withLocalChecklist(apiMatches);

        setAnswersState(profile);
        setServerMatchedBenefits(nextMatches);
        setChecklistProgress(buildChecklistProgress(nextMatches, {}, profile));
        setEvaluationError(null);

        return nextMatches;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong while checking eligibility.';

        console.error('Eligibility API error:', error);

        setServerMatchedBenefits([]);
        setChecklistProgress({});
        setEvaluationError(message);

        throw new Error(message);
      } finally {
        setIsEvaluating(false);
      }
    },
    [answers, screeningBenefitFilters]
  );

  const setChecklistItemChecked = useCallback(
    (benefitId: string, itemIndex: number, checked: boolean) => {
      setChecklistProgress((previousProgress) => {
        const nextBenefitProgress = [...(previousProgress[benefitId] || [])];
        nextBenefitProgress[itemIndex] = checked;

        return {
          ...previousProgress,
          [benefitId]: nextBenefitProgress,
        };
      });
    },
    []
  );

  return (
    <BenefitsContext.Provider
      value={{
        answers,
        setAnswer,
        setAnswers,
        screeningBenefitFilters,
        setScreeningBenefitFilters,
        startNewScreening,
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