import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Navbar } from '../components/layout/Navbar';
import { PageBackdrop } from '../components/layout/PageBackdrop';
import { InlineTooltipText } from '../components/ui/inline-tooltip-text';
import { useIsMobile } from '../components/ui/use-mobile';

import { useBenefits } from '../context/BenefitsContext';
import {
  getQuestionHelperText,
  getQuestionTextSegments,
  getQuestionsForBenefitFilters,
  getVisibleQuestions,
  pruneHiddenAnswers,
  questions,
  type Question,
} from '../data/benefitsData';
import { getMassachusettsSchoolOptions } from '../data/massachusettsSchools';
import { SiteFooter } from "@/app/components/layout/SiteFooter";


const MOBILE_PAGE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    setAnswers,
    answers,
    evaluateBenefits,
    isEvaluating,
    screeningBenefitFilters,
  } = useBenefits();

  const measurementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const questionHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const screeningQuestions = React.useMemo(() => {
    return getQuestionsForBenefitFilters(questions, screeningBenefitFilters);
  }, [screeningBenefitFilters]);

  const getQuestionOptions = React.useCallback(
    (question: Question, questionAnswers: Record<string, string>) => {
      if (question.id === 'school_name') {
        const isFutureStudent =
          questionAnswers['student_status'] === 'future_full_time' ||
          questionAnswers['student_status'] === 'future_part_time';

        return getMassachusettsSchoolOptions(isFutureStudent);
      }

      return question.options ?? [];
    },
    []
  );

  const findMatchingSelectOption = React.useCallback(
    (
      question: Question,
      value: string,
      questionAnswers: Record<string, string>
    ) => {
      const normalizedValue = value.trim().toLowerCase();

      if (!normalizedValue || question.control !== 'select') {
        return null;
      }

      return (
        getQuestionOptions(question, questionAnswers).find(
          (option) =>
            option.value.toLowerCase() === normalizedValue ||
            option.label.toLowerCase() === normalizedValue
        ) ?? null
      );
    },
    [getQuestionOptions]
  );

  const getPrunedAnswers = React.useCallback(
    (nextAnswers: Record<string, string>) => {
      let currentAnswers = pruneHiddenAnswers(screeningQuestions, nextAnswers);
      let didChange = true;

      while (didChange) {
        didChange = false;
        const nextVisibleQuestions = getVisibleQuestions(
          screeningQuestions,
          currentAnswers
        );

        for (const question of nextVisibleQuestions) {
          const answer = currentAnswers[question.id];

          if (!answer) {
            continue;
          }

          const questionOptions = getQuestionOptions(question, currentAnswers);

          if (
            questionOptions.length > 0 &&
            !questionOptions.some((option) => option.value === answer)
          ) {
            delete currentAnswers[question.id];
            didChange = true;
          }
        }

        if (didChange) {
          currentAnswers = pruneHiddenAnswers(screeningQuestions, currentAnswers);
        }
      }

      return currentAnswers;
    },
    [getQuestionOptions, screeningQuestions]
  );

  const visibleQuestions = React.useMemo(() => {
    return getVisibleQuestions(screeningQuestions, answers);
  }, [answers, screeningQuestions]);

  useEffect(() => {
    if (currentStep >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentStep(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, currentStep]);

  const currentQuestion = visibleQuestions[currentStep];

  const currentQuestionTextSegments = currentQuestion
    ? getQuestionTextSegments(currentQuestion, answers)
    : [];

  const currentQuestionHelperText = currentQuestion
    ? getQuestionHelperText(currentQuestion, answers)
    : '';

  const currentQuestionOptions = currentQuestion
    ? getQuestionOptions(currentQuestion, answers)
    : [];

  const normalizedSelectedOption = selectedOption.trim();

  const currentValidationError =
    currentQuestion && normalizedSelectedOption
      ? currentQuestion.validate
        ? currentQuestion.validate(normalizedSelectedOption, answers)
        : currentQuestion.control === 'select' &&
          !findMatchingSelectOption(
            currentQuestion,
            normalizedSelectedOption,
            answers
          )
        ? currentQuestion.id === 'school_name'
          ? 'Select a school from the list.'
          : 'Please select a valid option.'
        : null
      : null;

  const isLastStep =
    visibleQuestions.length > 0 && currentStep === visibleQuestions.length - 1;

  const progress =
    visibleQuestions.length > 0
      ? ((currentStep + 1) / visibleQuestions.length) * 100
      : 0;

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    const nextSelectedOption = answers[currentQuestion.id] || '';
    const isValidSelectedOption =
      !nextSelectedOption ||
      currentQuestionOptions.length === 0 ||
      currentQuestionOptions.some((option) => option.value === nextSelectedOption);

    if (!isValidSelectedOption) {
      setSelectedOption('');
      return;
    }

    if (
      currentQuestion.control === 'select' &&
      currentQuestion.id === 'school_name' &&
      nextSelectedOption
    ) {
      const matchedOption = currentQuestionOptions.find(
        (option) => option.value === nextSelectedOption
      );
      setSelectedOption(matchedOption?.label ?? nextSelectedOption);
      return;
    }

    setSelectedOption(nextSelectedOption);
  }, [answers, currentQuestion, currentQuestionOptions, currentStep]);

  useLayoutEffect(() => {
    let frameId = 0;

    const measureContentHeight = () => {
      frameId = window.requestAnimationFrame(() => {
        const tallestHeight = visibleQuestions.reduce((maxHeight, question) => {
          const element = measurementRefs.current[question.id];
          return element ? Math.max(maxHeight, element.offsetHeight) : maxHeight;
        }, 0);

        if (tallestHeight > 0) {
          setContentHeight(tallestHeight);
        }
      });
    };

    measureContentHeight();
    window.addEventListener('resize', measureContentHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', measureContentHeight);
    };
  }, [visibleQuestions, answers]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    window.requestAnimationFrame(() => {
      questionHeadingRef.current?.focus();
    });
  }, [currentQuestion?.id]);

  const handleNext = async () => {
    if (
      !currentQuestion ||
      !normalizedSelectedOption ||
      currentValidationError ||
      isEvaluating
    ) {
      return;
    }

    const normalizedAnswerValue =
      currentQuestion.control === 'select'
        ? findMatchingSelectOption(
            currentQuestion,
            normalizedSelectedOption,
            answers
          )?.value ?? normalizedSelectedOption
        : normalizedSelectedOption;

    const nextAnswers = getPrunedAnswers({
      ...answers,
      [currentQuestion.id]: normalizedAnswerValue,
    });

    const nextVisibleQuestions = getVisibleQuestions(
      screeningQuestions,
      nextAnswers
    );

    const currentQuestionIndex = nextVisibleQuestions.findIndex(
      (question) => question.id === currentQuestion.id
    );

    const safeCurrentQuestionIndex =
      currentQuestionIndex >= 0 ? currentQuestionIndex : currentStep;

    const isLastVisibleStep =
      safeCurrentQuestionIndex >= nextVisibleQuestions.length - 1;

    setSubmissionError(null);
    setAnswers(nextAnswers);

    if (isLastVisibleStep) {
      try {
        await evaluateBenefits(nextAnswers);
        navigate('/results');
      } catch (error) {
        console.error('Eligibility evaluation error:', error);
        setSubmissionError(
          error instanceof Error
            ? error.message
            : 'Something went wrong while checking eligibility.'
        );
      }
      return;
    }

    setSelectedOption('');
    setCurrentStep(safeCurrentQuestionIndex + 1);
  };

  const handleBack = () => {
    if (isEvaluating) {
      return;
    }

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/');
    }
  };

  const renderQuestionInput = (question: Question, interactive: boolean) => {
    const questionOptions = getQuestionOptions(question, answers);

    if (question.control === 'select') {
      if (question.id === 'school_name') {
        if (!interactive) {
          return (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-500">
                {question.placeholder ?? 'Search for your college or university'}
              </div>
            </div>
          );
        }

        const searchTerm = selectedOption.trim().toLowerCase();

        const filteredOptions = (
          searchTerm
            ? questionOptions.filter((option) =>
                option.label.toLowerCase().includes(searchTerm)
              )
            : questionOptions
        ).slice(0, 12);

        const selectedSchool = findMatchingSelectOption(
          question,
          selectedOption,
          answers
        );

        return (
          <div className="space-y-3">
            <label htmlFor="school-search" className="sr-only">
              Search for your college or university
            </label>
            <Input
              id="school-search"
              type="text"
              value={selectedOption}
              onChange={(event) => setSelectedOption(event.target.value)}
              placeholder="Start typing your college or university"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="school-search-results"
              aria-expanded={filteredOptions.length > 0}
              aria-describedby={currentValidationError ? 'school-search-error' : 'school-search-helper'}
              aria-invalid={currentValidationError ? true : undefined}
              className="h-14 rounded-lg border-gray-200 bg-white px-4 text-base font-medium md:text-lg"
            />

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div
                id="school-search-results"
                role="listbox"
                aria-label="Matching schools"
                className="max-h-64 overflow-y-auto p-2"
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const isSelected = selectedSchool?.value === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => setSelectedOption(option.label)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors md:text-base ${
                          isSelected
                            ? 'bg-[#1e3a5f] text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500 md:text-base">
                    No matching schools found.
                  </p>
                )}
              </div>
            </div>

            <p id="school-search-helper" className="text-sm text-slate-600 dark:text-slate-300">
              {selectedSchool
                ? `Selected: ${selectedSchool.label}`
                : 'Type to search, then choose your school from the list.'}
            </p>

            {questionOptions.length > 12 && !selectedSchool && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing the first 12 matches. Keep typing to narrow the list.
              </p>
            )}

            {currentValidationError && (
              <p id="school-search-error" role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {currentValidationError}
              </p>
            )}
          </div>
        );
      }

      if (!interactive) {
        return (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-500">
            {question.placeholder ?? 'Select an option'}
          </div>
        );
      }

      return (
        <Select value={selectedOption} onValueChange={setSelectedOption}>
          <SelectTrigger
            aria-describedby={currentValidationError ? 'question-error' : currentQuestionHelperText ? 'question-helper' : undefined}
            aria-invalid={currentValidationError ? true : undefined}
            className="h-14 rounded-lg border-gray-200 bg-white text-left text-base font-medium md:text-lg"
          >
            <SelectValue placeholder={question.placeholder ?? 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {questionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (question.control === 'number') {
      if (!interactive) {
        return (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-500">
            {question.placeholder ?? 'Enter a value'}
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <Input
            type="number"
            min={9}
            step={1}
            inputMode="numeric"
            value={selectedOption}
            onChange={(event) => setSelectedOption(event.target.value)}
            placeholder={question.placeholder ?? 'Enter a value'}
            aria-describedby={currentValidationError ? 'question-error' : currentQuestionHelperText ? 'question-helper' : undefined}
            aria-invalid={currentValidationError ? true : undefined}
            className="h-14 rounded-lg border-gray-200 bg-white px-4 text-base font-medium md:text-lg"
          />
          {currentValidationError && (
            <p id="question-error" role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {currentValidationError}
            </p>
          )}
        </div>
      );
    }

    return (
      <RadioGroup
        value={interactive ? selectedOption : undefined}
        onValueChange={interactive ? setSelectedOption : undefined}
        aria-labelledby="current-question-heading"
        aria-describedby={currentQuestionHelperText ? 'question-helper' : undefined}
        className="space-y-2.5 md:space-y-4"
      >
        {questionOptions.map((option) => {
          const optionId = `${question.id}-${option.value}`;
          const optionClasses =
            'flex cursor-pointer items-start space-x-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-gray-200 hover:bg-gray-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 md:p-4';

          return (
            <motion.div
              key={option.value}
              whileHover={interactive && !isMobile ? { y: -2 } : undefined}
              whileTap={interactive && isMobile ? { scale: 0.995 } : undefined}
              transition={
                interactive
                  ? isMobile
                    ? { duration: 0.14, ease: 'easeOut' }
                    : { type: 'spring', stiffness: 420, damping: 28 }
                  : undefined
              }
              className={optionClasses}
              onClick={interactive ? () => setSelectedOption(option.value) : undefined}
            >
              <RadioGroupItem value={option.value} id={optionId} className="mt-1" />
              <Label
                htmlFor={optionId}
                className="flex-1 cursor-pointer text-[0.98rem] font-medium leading-relaxed md:text-lg"
              >
                {option.label}
              </Label>
            </motion.div>
          );
        })}
      </RadioGroup>
    );
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const questionContent = (
    <>
      <span className="mb-4 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-slate-800 dark:text-slate-300 md:mb-4 md:px-3 md:py-1.5 md:text-sm">
        {currentQuestion.category}
      </span>

      <h2 id="current-question-heading" ref={questionHeadingRef} tabIndex={-1} className="mb-4 max-w-2xl text-[1.66rem] font-bold leading-[1.08] outline-none md:mb-5 md:text-[2.15rem] md:leading-[1.08]">
        <InlineTooltipText segments={currentQuestionTextSegments} />
      </h2>

      {currentQuestionHelperText && (
        <p id="question-helper" className="mb-7 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 md:mb-8 md:text-base">
          {currentQuestionHelperText}
        </p>
      )}

      {renderQuestionInput(currentQuestion, true)}
    </>
  );

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-3xl flex-1 px-5 py-4 sm:px-6 md:py-14">
        <div className="mb-5 space-y-2 md:mb-10">
          {submissionError && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {submissionError}
            </p>
          )}
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 md:text-sm">
            <span>
              Step {currentStep + 1} of {visibleQuestions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>

          <Progress
            value={progress}
            aria-label="Questionnaire progress"
            className="h-2 bg-slate-200/90 shadow-inner dark:bg-slate-800/90 md:h-2.5"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/82 px-4 py-4 shadow-[0_34px_80px_-52px_rgba(15,23,42,0.45)] backdrop-blur-none dark:border-white/10 dark:bg-slate-900/78 dark:shadow-[0_28px_80px_-40px_rgba(2,6,23,0.95)] md:min-h-0 md:p-12 md:backdrop-blur-sm">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQuestion.id}
              initial={isMobile ? { opacity: 0, x: 16 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={isMobile ? { opacity: 0, x: -16 } : { opacity: 0, x: -20 }}
              transition={isMobile ? MOBILE_PAGE_TRANSITION : { duration: 0.3 }}
              className="min-w-0 flex-1 transform-gpu will-change-transform"
              style={contentHeight ? { minHeight: contentHeight } : undefined}
            >
              {questionContent}
            </motion.div>
          </AnimatePresence>

          <div className="mt-2 flex shrink-0 items-center justify-between border-t border-gray-100 pt-2.5 dark:border-white/10 md:mt-12 md:pt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isEvaluating}
              className="text-gray-500 hover:bg-gray-100 hover:text-black dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={
                !normalizedSelectedOption ||
                Boolean(currentValidationError) ||
                isEvaluating
              }
              className="rounded-md bg-[#1e3a5f] px-8 text-white transition-all hover:bg-[#f97316] dark:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.95)] disabled:opacity-50 md:text-base"
            >
              {isLastStep ? (isEvaluating ? 'Checking...' : 'See Results') : 'Next'}
              {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />

      <div
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-x-0 top-0 -z-10"
      >
        <div className="container mx-auto max-w-3xl px-5 py-4 sm:px-6 md:py-14">
          {visibleQuestions.map((question) => {
            const questionTextSegments = getQuestionTextSegments(question, answers);
            const questionHelperText = getQuestionHelperText(question, answers);

            return (
              <div
                key={question.id}
                className="rounded-[1.75rem] border border-transparent bg-white/82 px-4 py-4 shadow-sm md:p-12"
              >
                <div
                  ref={(element) => {
                    measurementRefs.current[question.id] = element;
                  }}
                  className="min-w-0"
                >
                  <span className="mb-4 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500 md:px-3 md:py-1.5 md:text-sm">
                    {question.category}
                  </span>

                  <h2 className="mb-4 max-w-2xl text-[1.66rem] font-bold leading-[1.08] md:mb-5 md:text-[2.15rem] md:leading-[1.08]">
                    <InlineTooltipText segments={questionTextSegments} />
                  </h2>

                  {questionHelperText && (
                    <p className="mb-7 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 md:mb-8 md:text-base">
                      {questionHelperText}
                    </p>
                  )}

                  {renderQuestionInput(question, false)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}