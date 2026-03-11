import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
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
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
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

    // Helper function to check enrollment
    const isEnrolled = () =>
      answers['student_status'] === 'full_time' || answers['student_status'] === 'part_time';

    const isFullTime = () => answers['student_status'] === 'full_time';

    // Pell Grant (Federal)
    // Show if: Enrolled AND Citizen/eligible non-citizen = Yes
    // Action status: "No action needed" if FAFSA completed, "Action needed" if not
    if (
      isEnrolled() &&
      answers['citizen_status'] === 'yes'
    ) {
      const benefit = benefits.find(b => b.id === 'pell-grant');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus: answers['fafsa_completed'] === 'yes'
            ? 'No action needed (already applied to FAFSA)'
            : 'Action needed - Complete FAFSA'
        });
      }
    }

    // MASSGrant (MA state aid)
    // Show if: Enrolled AND MA resident = Yes AND Citizen/eligible non-citizen = Yes
    // Action status: "No action needed" if FAFSA completed, "Action needed" if not
    if (
      isEnrolled() &&
      answers['ma_resident'] === 'yes' &&
      answers['citizen_status'] === 'yes'
    ) {
      const benefit = benefits.find(b => b.id === 'massgrant');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus: answers['fafsa_completed'] === 'yes'
            ? 'No action needed (already applied to FAFSA)'
            : 'Action needed - Complete FAFSA'
        });
      }
    }

    // MASSGrant Plus (extra MA support)
    // Show if: All MASSGrant rules AND Income = Below $20k AND Full-time
    // Action status: "No action needed" if FAFSA completed, "Action needed" if not
    if (
      isFullTime() &&
      answers['ma_resident'] === 'yes' &&
      answers['citizen_status'] === 'yes' &&
      answers['income_level'] === 'low'
    ) {
      const benefit = benefits.find(b => b.id === 'massgrant-plus');
      if (benefit) {
        matches.push({
          ...benefit,
          actionStatus: answers['fafsa_completed'] === 'yes'
            ? 'No action needed (already applied to FAFSA)'
            : 'Action needed - Complete FAFSA'
        });
      }
    }

    // SNAP (Food Stamps)
    // Show if: MA resident = Yes AND Income below $40k AND (Work-Study = Yes OR Income = Below $20k)
    if (
      answers['ma_resident'] === 'yes' &&
      (answers['income_level'] === 'low' || answers['income_level'] === 'medium') &&
      (answers['work_study'] === 'yes' || answers['income_level'] === 'low')
    ) {
      const benefit = benefits.find(b => b.id === 'snap');
      if (benefit) matches.push(benefit);
    }

    // MassHealth (MA Medicaid)
    // Show if: MA resident = Yes AND Citizen/eligible non-citizen = Yes AND Income below $40k
    if (
      answers['ma_resident'] === 'yes' &&
      answers['citizen_status'] === 'yes' &&
      (answers['income_level'] === 'low' || answers['income_level'] === 'medium')
    ) {
      const benefit = benefits.find(b => b.id === 'masshealth');
      if (benefit) matches.push(benefit);
    }

    // MBTA Student Pass
    // Show if: Enrolled AND Public transport = Yes/Sometimes
    if (
      isEnrolled() &&
      (answers['transportation'] === 'yes' || answers['transportation'] === 'sometimes')
    ) {
      const benefit = benefits.find(b => b.id === 'mbta-pass');
      if (benefit) matches.push(benefit);
    }

    // Remove duplicates by ID
    const uniqueMatches = Array.from(new Set(matches.map(b => b.id)))
        .map(id => matches.find(b => b.id === id))
        .filter((b): b is Benefit => b !== undefined);

    return uniqueMatches;
  }, [answers]);

  const reset = () => {
    setAnswers({});
    setChecklistProgress({});
  };

  return (
    <BenefitsContext.Provider
      value={{ answers, setAnswer, matchedBenefits, checklistProgress, setChecklistItemChecked, reset }}
    >
      {children}
    </BenefitsContext.Provider>
  );
};
