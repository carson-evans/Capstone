import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Benefit, benefits } from '../data/benefitsData';

interface BenefitsContextType {
  answers: Record<string, string>;
  setAnswer: (questionId: string, answer: string) => void;
  matchedBenefits: Benefit[];
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

export const BenefitsProvider = ({ children }: { children: ReactNode }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean[]>>({});

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const setChecklistItemChecked = (benefitId: string, itemIndex: number, checked: boolean) => {
    setChecklistProgress((prev) => {
      const nextBenefitProgress = [...(prev[benefitId] || [])];
      nextBenefitProgress[itemIndex] = checked;

      return {
        ...prev,
        [benefitId]: nextBenefitProgress,
      };
    });
  };

  const matchedBenefits = useMemo(() => {
    const matches: Benefit[] = [];

    const isEnrolled = () =>
      answers['student_status'] === 'full_time' || answers['student_status'] === 'part_time';

    const isFullTime = () => answers['student_status'] === 'full_time';

    if (isEnrolled() && answers['citizen_status'] === 'yes') {
      const benefit = benefits.find((b) => b.id === 'pell-grant');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus:
            answers['fafsa_completed'] === 'yes'
              ? 'No action needed (already applied to FAFSA)'
              : 'Action needed - Complete FAFSA',
        });
      }
    }

    if (
      isEnrolled() &&
      answers['ma_resident'] === 'yes' &&
      answers['citizen_status'] === 'yes'
    ) {
      const benefit = benefits.find((b) => b.id === 'massgrant');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus:
            answers['fafsa_completed'] === 'yes'
              ? 'No action needed (already applied to FAFSA)'
              : 'Action needed - Complete FAFSA',
        });
      }
    }

    if (
      isFullTime() &&
      answers['ma_resident'] === 'yes' &&
      answers['citizen_status'] === 'yes' &&
      answers['income_level'] === 'low'
    ) {
      const benefit = benefits.find((b) => b.id === 'massgrant-plus');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus:
            answers['fafsa_completed'] === 'yes'
              ? 'No action needed (already applied to FAFSA)'
              : 'Action needed - Complete FAFSA',
        });
      }
    }

    if (
      answers['ma_resident'] === 'yes' &&
      (answers['income_level'] === 'low' || answers['income_level'] === 'medium') &&
      (answers['work_study'] === 'yes' || answers['income_level'] === 'low')
    ) {
      const benefit = benefits.find((b) => b.id === 'snap');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus: 'You likely qualify for SNAP. Apply through your state SNAP portal.',
        });
      }
    }

    if (
      answers['ma_resident'] === 'yes' &&
      answers['citizen_status'] === 'yes' &&
      (answers['income_level'] === 'low' || answers['income_level'] === 'medium')
    ) {
      const benefit = benefits.find((b) => b.id === 'masshealth');
      if (benefit) matches.push(benefit);
    }

    if (
      isEnrolled() &&
      (answers['transportation'] === 'yes' || answers['transportation'] === 'sometimes')
    ) {
      const benefit = benefits.find((b) => b.id === 'mbta-pass');
      if (benefit) matches.push(benefit);
    }

    const uniqueMatches = Array.from(new Set(matches.map((b) => b.id)))
      .map((id) => matches.find((b) => b.id === id))
      .filter((b): b is Benefit => b !== undefined);

    return uniqueMatches;
  }, [answers]);

  const reset = () => {
    setAnswers({});
    setChecklistProgress({});
  };

  return (
    <BenefitsContext.Provider
      value={{
        answers,
        setAnswer,
        matchedBenefits,
        checklistProgress,
        setChecklistItemChecked,
        reset,
      }}
    >
      {children}
    </BenefitsContext.Provider>
  );
};