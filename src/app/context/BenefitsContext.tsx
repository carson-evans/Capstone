import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Benefit } from '../data/benefitsData';
import { benefits } from '../data/benefitsData';

interface BenefitsContextType {
  answers: Record<string, string>;
  setAnswer: (questionId: string, answer: string) => void;
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

const getBenefitById = (id: string) => benefits.find((benefit) => benefit.id === id);

const evaluateBenefitsLocally = (profile: Record<string, string>): Benefit[] => {
  const matches: Benefit[] = [];

  const isEnrolled =
    profile['student_status'] === 'full_time' || profile['student_status'] === 'part_time';

  const isStudentOrFuture = isEnrolled || profile['student_status'] === 'future';

  const isFullTimeOrFuture =
    profile['student_status'] === 'full_time' || profile['student_status'] === 'future';

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
    isStudentOrFuture &&
    profile['ma_resident'] === 'yes' &&
    profile['citizen_status'] === 'yes'
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
    isFullTimeOrFuture &&
    profile['ma_resident'] === 'yes' &&
    profile['citizen_status'] === 'yes' &&
    profile['income_level'] === 'low'
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
    profile['ma_resident'] === 'yes' &&
    (profile['income_level'] === 'low' || profile['income_level'] === 'medium') &&
    (profile['work_study'] === 'yes' || profile['income_level'] === 'low')
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
    profile['ma_resident'] === 'yes' &&
    profile['citizen_status'] === 'yes' &&
    (profile['income_level'] === 'low' || profile['income_level'] === 'medium')
  ) {
    const benefit = getBenefitById('masshealth');
    if (benefit) {
      matches.push(benefit);
    }
  }

  if (
    isEnrolled &&
    (profile['transportation'] === 'yes' || profile['transportation'] === 'sometimes')
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

export const BenefitsProvider = ({ children }: { children: ReactNode }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [matchedBenefits, setMatchedBenefits] = useState<Benefit[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean[]>>({});

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const evaluateBenefits = async (
    overrideAnswers?: Record<string, string>
  ): Promise<Benefit[]> => {
    const profile = overrideAnswers ?? answers;
    const apiUrl = import.meta.env.VITE_ELIGIBILITY_API_URL || '/api/eligibility/check';

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

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

      let data = raw;
      if (typeof raw?.body === 'string') {
        try {
          data = JSON.parse(raw.body);
        } catch {
          data = raw;
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to evaluate eligibility.');
      }

      const nextMatches = data?.matchedBenefits ?? data?.matches ?? data?.benefits ?? [];

      if (!Array.isArray(nextMatches)) {
        throw new Error('Eligibility API returned an invalid matches payload.');
      }

      setMatchedBenefits(nextMatches);
      return nextMatches;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while checking eligibility.';

      if (import.meta.env.DEV) {
        console.warn(
          'Eligibility API failed in dev. Falling back to local evaluation.',
          message
        );

        const fallbackMatches = evaluateBenefitsLocally(profile);
        setMatchedBenefits(fallbackMatches);
        setEvaluationError(null);
        return fallbackMatches;
      }

      setEvaluationError(message);
      setMatchedBenefits([]);
      throw error;
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
    setAnswers({});
    setMatchedBenefits([]);
    setChecklistProgress({});
    setEvaluationError(null);
  };

  return (
    <BenefitsContext.Provider
      value={{
        answers,
        setAnswer,
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