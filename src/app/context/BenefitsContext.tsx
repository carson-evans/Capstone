import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  benefits as localBenefitCatalog,
  isPositiveActionStatus,
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
  matchedBenefits: Benefit[];
  isEvaluating: boolean;
  evaluationError: string | null;
  evaluateBenefits: (overrideAnswers?: AnswerMap) => Promise<Benefit[]>;
  checklistProgress: ChecklistProgressMap;
  setChecklistItemChecked: (benefitId: string, itemIndex: number, checked: boolean) => void;
  reset: () => void;
}

const BenefitsContext = createContext<BenefitsContextType | undefined>(undefined);

function uniqueBenefitIds(values: Benefit['id'][]): Benefit['id'][] {
  return Array.from(new Set(values));
}

function applyScreeningBenefitFilters(
  matches: Benefit[],
  selectedBenefitFilters: Benefit['id'][]
): Benefit[] {
  if (!selectedBenefitFilters.length) {
    return matches;
  }

  const selectedBenefitIdSet = new Set(selectedBenefitFilters);
  return matches.filter((benefit) => selectedBenefitIdSet.has(benefit.id));
}

function buildChecklistProgress(
  matches: Benefit[],
  previousProgress: ChecklistProgressMap
): ChecklistProgressMap {
  return matches.reduce<ChecklistProgressMap>((accumulator, benefit) => {
    const statuses =
      benefit.actionStatuses ?? (benefit.actionStatus ? [benefit.actionStatus] : []);

    const hasAlreadyCompletedStatus = statuses.some(
      (status) =>
        isPositiveActionStatus(status) &&
        status.toLowerCase().includes('already completed')
    );

    const allStatusesPositive =
      statuses.length > 0 &&
      statuses.every((status) => isPositiveActionStatus(status));

    const shouldAutoCheckAllItems =
      hasAlreadyCompletedStatus && allStatusesPositive;

    accumulator[benefit.id] = benefit.checklist.map((_, index) => {
      if (shouldAutoCheckAllItems) {
        return true;
      }

      return previousProgress[benefit.id]?.[index] ?? false;
    });

    return accumulator;
  }, {});
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
  const [screeningBenefitFilters, setScreeningBenefitFiltersState] = useState<Benefit['id'][]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [checklistProgress, setChecklistProgress] = useState<ChecklistProgressMap>({});

  const normalizedMatchedBenefits = useMemo(
    () => withLocalChecklist(serverMatchedBenefits),
    [serverMatchedBenefits]
  );

  const matchedBenefits = useMemo(
    () => applyScreeningBenefitFilters(normalizedMatchedBenefits, screeningBenefitFilters),
    [normalizedMatchedBenefits, screeningBenefitFilters]
  );

  useEffect(() => {
    setChecklistProgress((previousProgress) =>
      buildChecklistProgress(matchedBenefits, previousProgress)
    );
  }, [matchedBenefits]);

  const setAnswer = (questionId: string, answer: string) => {
    setAnswersState((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer,
    }));
  };

  const setAnswers = (nextAnswers: AnswerMap) => {
    setAnswersState(nextAnswers);
  };

  const setScreeningBenefitFilters = (nextFilters: Benefit['id'][]) => {
    setScreeningBenefitFiltersState(uniqueBenefitIds(nextFilters));
  };

  const evaluateBenefits = async (overrideAnswers?: AnswerMap): Promise<Benefit[]> => {
    const profile = overrideAnswers ?? answers;

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const apiMatches = await evaluateEligibilityRequest(profile);
      const nextMatches = withLocalChecklist(apiMatches);
      const filteredMatches = applyScreeningBenefitFilters(
        nextMatches,
        screeningBenefitFilters
      );

      setServerMatchedBenefits(nextMatches);
      setEvaluationError(null);

      return filteredMatches;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while checking eligibility.';

      console.error('Eligibility API error:', error);
      setServerMatchedBenefits([]);
      setEvaluationError(message);

      throw new Error(message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const setChecklistItemChecked = (
    benefitId: string,
    itemIndex: number,
    checked: boolean
  ) => {
    setChecklistProgress((previousProgress) => {
      const nextBenefitProgress = [...(previousProgress[benefitId] || [])];
      nextBenefitProgress[itemIndex] = checked;

      return {
        ...previousProgress,
        [benefitId]: nextBenefitProgress,
      };
    });
  };

  const reset = () => {
    setAnswersState({});
    setServerMatchedBenefits([]);
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
