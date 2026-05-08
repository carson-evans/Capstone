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
  MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM,
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
  matchedBenefits: Benefit[];
  isEvaluating: boolean;
  evaluationError: string | null;
  evaluateBenefits: (overrideAnswers?: AnswerMap) => Promise<Benefit[]>;
  checklistProgress: ChecklistProgressMap;
  setChecklistItemChecked: (benefitId: string, itemIndex: number, checked: boolean) => void;
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

function createEmptyChecklistState(): ChecklistState {
  return {
    progress: {},
    autoCheckedBenefits: {},
    itemsByBenefit: {},
  };
}

function shouldDefaultChecklistItemToChecked(benefitId: string, item: string): boolean {
  return (
    benefitId === 'massgrant-plus' && item === MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM
  );
}

function buildChecklistState(
  matches: Benefit[],
  previousState: ChecklistState
): ChecklistState {
  return matches.reduce<ChecklistState>((accumulator, benefit) => {
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

    const previousItems = previousState.itemsByBenefit[benefit.id] ?? [];
    const previousProgress = previousState.progress[benefit.id] ?? [];
    const previousProgressByItem = new Map(
      previousItems.map((item, index) => [item, previousProgress[index]])
    );
    const shouldResetAutoCheckedProgress =
      previousState.autoCheckedBenefits[benefit.id] && !shouldAutoCheckAllItems;

    accumulator.progress[benefit.id] = benefit.checklist.map((item) => {
      if (shouldAutoCheckAllItems) {
        return true;
      }

      // Reset auto-completed FAFSA or MASFA checkmarks once the answer changes back.
      if (shouldResetAutoCheckedProgress) {
        return shouldDefaultChecklistItemToChecked(benefit.id, item);
      }

      const savedProgress = previousProgressByItem.get(item);
      if (savedProgress !== undefined) {
        return savedProgress;
      }

      return shouldDefaultChecklistItemToChecked(benefit.id, item);
    });
    accumulator.autoCheckedBenefits[benefit.id] = shouldAutoCheckAllItems;
    accumulator.itemsByBenefit[benefit.id] = [...benefit.checklist];

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
  const [screeningBenefitFilters, setScreeningBenefitFiltersState] = useState<Benefit['id'][]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [checklistState, setChecklistState] = useState<ChecklistState>(
    createEmptyChecklistState
  );
  const checklistProgress = checklistState.progress;

  const matchedBenefits = useMemo(
    () => sortBenefitsForDisplay(withLocalChecklist(serverMatchedBenefits), answers),
    [answers, serverMatchedBenefits]
  );

  useEffect(() => {
    setChecklistState((previousState) =>
      buildChecklistState(matchedBenefits, previousState)
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
      const apiMatches = await evaluateEligibilityRequest(
        profile,
        screeningBenefitFilters
      );
      const nextMatches = withLocalChecklist(apiMatches);

      setServerMatchedBenefits(nextMatches);
      setEvaluationError(null);

      return nextMatches;
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
    setChecklistState((previousState) => {
      const nextBenefitProgress = [...(previousState.progress[benefitId] || [])];
      nextBenefitProgress[itemIndex] = checked;

      return {
        ...previousState,
        progress: {
          ...previousState.progress,
          [benefitId]: nextBenefitProgress,
        },
      };
    });
  };

  const reset = () => {
    setAnswersState({});
    setServerMatchedBenefits([]);
    setChecklistState(createEmptyChecklistState());
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
