import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Navbar } from '@/app/components/layout/Navbar';
import { PageBackdrop } from '@/app/components/layout/PageBackdrop';
import { InlineTooltipText } from '@/app/components/ui/inline-tooltip-text';
import { useIsMobile } from '@/app/components/ui/use-mobile';
import { SiteFooter } from '@/app/components/layout/SiteFooter';

import { useBenefits } from '@/app/context/BenefitsContext';
import {
  getQuestionHelperText,
  getQuestionTextSegments,
  getQuestionsForBenefitFilters,
  getVisibleQuestions,
  NOT_ENROLLED_NEXT_YEAR_VALUE,
  pruneHiddenAnswers,
  questions,
  type Question,
} from '@/app/data/benefitsData';
import { getMassachusettsSchoolOptions } from '@/app/data/massachusettsSchools';

const MOBILE_PAGE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

const SCHOOL_LISTBOX_HEIGHT_CLASSES = 'max-h-56 md:max-h-[22rem]';
const SCHOOL_LISTBOX_MEASUREMENT_HEIGHT_CLASSES =
  'max-h-56 min-h-56 md:max-h-[22rem] md:min-h-[22rem]';
const DEFAULT_QUESTION_MEASUREMENT_ANSWERS: Record<string, string> = {
  student_status: 'future_part_time',
  citizen_status: 'yes',
  residency_length: 'one_to_five_years',
  household_sizes: '9_plus',
  household_size_exact: '9',
  masshealth_income_under_limit: 'no',
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
  const schoolInputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [schoolListOpen, setSchoolListOpen] = useState(false);
  const [highlightedSchoolIndex, setHighlightedSchoolIndex] = useState(-1);

  const schoolListboxId = useId();
  const schoolInstructionsId = useId();
  const schoolStatusId = useId();

  const screeningQuestions = useMemo(() => {
    return getQuestionsForBenefitFilters(questions, screeningBenefitFilters);
  }, [screeningBenefitFilters]);

  const getQuestionOptions = useCallback(
    (question: Question, questionAnswers: Record<string, string>) => {
      const isFutureStudent =
        questionAnswers.student_status === 'future_full_time' ||
        questionAnswers.student_status === 'future_part_time';

      if (question.id === 'school_name') {
        return getMassachusettsSchoolOptions(isFutureStudent);
      }

      if (
        isFutureStudent &&
        (question.id === 'fafsa_completed' || question.id === 'masfa_completed')
      ) {
        return (question.options ?? []).filter(
          (option) => option.value !== NOT_ENROLLED_NEXT_YEAR_VALUE
        );
      }

      return question.options ?? [];
    },
    []
  );

  const findMatchingSelectOption = useCallback(
    (question: Question, value: string, questionAnswers: Record<string, string>) => {
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

  const getPrunedAnswers = useCallback(
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
          if (!answer) continue;

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

  const visibleQuestions = useMemo(() => {
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

  const currentQuestionOptions = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return getQuestionOptions(currentQuestion, answers);
  }, [answers, currentQuestion, getQuestionOptions]);
  const currentQuestionOptionsSignature = currentQuestionOptions
    .map((option) => option.value)
    .join('|');

  useEffect(() => {
    if (currentQuestion?.id === 'school_name') {
      setSchoolListOpen(true);
      setHighlightedSchoolIndex(-1);
      return;
    }

    setSchoolListOpen(false);
    setHighlightedSchoolIndex(-1);
  }, [currentQuestion?.id]);

  const normalizedSelectedOption = selectedOption.trim();

  const currentValidationError =
    currentQuestion && normalizedSelectedOption
      ? currentQuestion.validate
        ? currentQuestion.validate(normalizedSelectedOption, answers)
        : currentQuestion.control === 'select' &&
            !findMatchingSelectOption(currentQuestion, normalizedSelectedOption, answers)
          ? currentQuestion.id === 'school_name'
            ? 'Select a school from the list.'
            : 'Please select a valid option.'
          : null
      : null;

  const isLastStep =
    visibleQuestions.length > 0 && currentStep === visibleQuestions.length - 1;

  const willSubmitCurrentStep = useMemo(() => {
    if (!currentQuestion || !normalizedSelectedOption || currentValidationError) {
      return isLastStep;
    }

    if (currentQuestion.id === 'citizen_status') {
      const restrictedBenefits = ['masshealth', 'snap', 'pell-grant'];

      const isOnlyRestricted =
        screeningBenefitFilters.length > 0 &&
        screeningBenefitFilters.every((benefitId) =>
          restrictedBenefits.includes(benefitId)
        );

      if (normalizedSelectedOption === 'no' && isOnlyRestricted) {
        return true;
      }
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

    return safeCurrentQuestionIndex >= nextVisibleQuestions.length - 1;
  }, [
    answers,
    currentQuestion,
    currentStep,
    currentValidationError,
    findMatchingSelectOption,
    getPrunedAnswers,
    isLastStep,
    normalizedSelectedOption,
    screeningBenefitFilters,
    screeningQuestions,
  ]);

  const progress =
    visibleQuestions.length > 0
      ? ((currentStep + 1) / visibleQuestions.length) * 100
      : 0;

  useEffect(() => {
    if (!currentQuestion) return;

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
  }, [answers, currentQuestion, currentQuestionOptions]);

  useLayoutEffect(() => {
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateContentHeight = () => {
      const tallestHeight = questions.reduce((maxHeight, question) => {
        const element = measurementRefs.current[question.id];
        return element ? Math.max(maxHeight, element.offsetHeight) : maxHeight;
      }, 0);

      if (tallestHeight > 0) {
        setContentHeight((currentHeight) =>
          currentHeight === tallestHeight ? currentHeight : tallestHeight
        );
      }
    };

    const scheduleContentHeightUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        updateContentHeight();
      });
    };

    updateContentHeight();
    window.addEventListener('resize', scheduleContentHeightUpdate);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleContentHeightUpdate();
      });

      questions.forEach((question) => {
        const element = measurementRefs.current[question.id];
        if (element) {
          resizeObserver.observe(element);
        }
      });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleContentHeightUpdate);
      resizeObserver?.disconnect();
    };
  }, [isMobile]);

  useEffect(() => {
    if (!currentQuestion) return;

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

    if (
      currentQuestion.id === 'citizen_status' &&
      nextAnswers.citizen_status === 'no'
    ) {
      const restrictedBenefits = ['masshealth', 'snap', 'pell-grant'];

      const isOnlyRestricted =
        screeningBenefitFilters.length > 0 &&
        screeningBenefitFilters.every((benefitId) =>
          restrictedBenefits.includes(benefitId)
        );

      if (isOnlyRestricted) {
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
    }

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

  const renderMeasurementInput = (question: Question) => {
    const measurementAnswers =
      question.id === 'fafsa_completed' || question.id === 'masfa_completed'
        ? {
            ...DEFAULT_QUESTION_MEASUREMENT_ANSWERS,
            student_status: 'full_time',
          }
        : DEFAULT_QUESTION_MEASUREMENT_ANSWERS;
    const questionOptions = getQuestionOptions(question, measurementAnswers);

    if (question.control === 'select' && question.id === 'school_name') {
      return (
        <div className="space-y-3">
          <div className="h-14 rounded-lg border border-gray-200 bg-white px-4" />
          <div className="h-5 text-sm leading-5 text-transparent">
            Showing available schools.
          </div>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div
              className={`${SCHOOL_LISTBOX_MEASUREMENT_HEIGHT_CLASSES} overflow-y-scroll p-2`}
            >
              {questionOptions.slice(0, 6).map((option) => (
                <div
                  key={option.value}
                  className="rounded-md px-3 py-2 text-left text-sm text-slate-700 md:text-base"
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (question.control === 'select') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-500">
          {question.placeholder ?? 'Select an option'}
        </div>
      );
    }

    if (question.control === 'number') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-500">
          {question.placeholder ?? 'Enter a value'}
        </div>
      );
    }

    return (
      <div className="space-y-2.5 md:space-y-4">
        {questionOptions.map((option) => (
          <div
            key={option.value}
            className="flex items-start space-x-3 rounded-lg border border-transparent px-3 py-2 md:p-4"
          >
            <div className="mt-1 h-4 w-4 rounded-full border border-slate-400" />
            <div className="flex-1 text-[0.98rem] font-medium leading-relaxed md:text-lg">
              {option.label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestionInput = (question: Question) => {
    const helperId = `${question.id}-helper`;
    const errorId = `${question.id}-error`;
    const questionOptions = getQuestionOptions(question, answers);
    const describedByIds = [
      currentQuestionHelperText ? helperId : null,
      currentValidationError ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ');

    if (question.control === 'select') {
      if (question.id === 'school_name') {
        const searchTerm = selectedOption.trim().toLowerCase();

        const filteredOptions = searchTerm
          ? questionOptions.filter((option) =>
              option.label.toLowerCase().includes(searchTerm)
            )
          : questionOptions;

        const selectedSchool = findMatchingSelectOption(
          question,
          selectedOption,
          answers
        );
        const activeOption =
          highlightedSchoolIndex >= 0 && highlightedSchoolIndex < filteredOptions.length
            ? filteredOptions[highlightedSchoolIndex]
            : null;

        const handleSchoolSelection = (label: string) => {
          setSelectedOption(label);
          setSchoolListOpen(false);
          setHighlightedSchoolIndex(-1);
          schoolInputRef.current?.focus();
        };

        const handleSchoolKeyDown = (
          event: React.KeyboardEvent<HTMLInputElement>
        ) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSchoolListOpen(true);
            setHighlightedSchoolIndex((current) => {
              const nextIndex = current + 1;
              return nextIndex >= filteredOptions.length ? 0 : nextIndex;
            });
            return;
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSchoolListOpen(true);
            setHighlightedSchoolIndex((current) => {
              if (current <= 0) {
                return Math.max(filteredOptions.length - 1, 0);
              }
              return current - 1;
            });
            return;
          }

          if (event.key === 'Enter' && activeOption) {
            event.preventDefault();
            handleSchoolSelection(activeOption.label);
            return;
          }

          if (event.key === 'Escape') {
            setHighlightedSchoolIndex(-1);
          }
        };

        const schoolDescribedBy = [
          currentQuestionHelperText ? helperId : null,
          currentValidationError ? errorId : null,
          schoolInstructionsId,
          schoolListOpen ? schoolStatusId : null,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div className="space-y-3">
            <label htmlFor="school-search" className="sr-only">
              Search for your college or university
            </label>

            <p id={schoolInstructionsId} className="sr-only">
              Type to filter schools. Use the up and down arrow keys to review
              results, Enter to select, and Escape to close the list.
            </p>

            <div className="relative">
              <Input
                ref={schoolInputRef}
                id="school-search"
                role="combobox"
                type="text"
                value={selectedOption}
                onChange={(event) => {
                  setSelectedOption(event.target.value);
                  setSchoolListOpen(true);
                  setHighlightedSchoolIndex(-1);
                }}
                onFocus={() => setSchoolListOpen(true)}
                onClick={() => setSchoolListOpen(true)}
                onBlur={() => {
                  if (selectedSchool) {
                    setSchoolListOpen(false);
                  }
                  setHighlightedSchoolIndex(-1);
                }}
                onKeyDown={handleSchoolKeyDown}
                placeholder="Start typing or scroll to select"
                autoComplete="off"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-controls={schoolListboxId}
                aria-expanded={schoolListOpen ? 'true' : 'false'}
                aria-activedescendant={
                  activeOption ? `${question.id}-${activeOption.value}` : undefined
                }
                aria-describedby={schoolDescribedBy || undefined}
                aria-invalid={currentValidationError ? 'true' : 'false'}
                className="h-14 rounded-lg border-gray-200 bg-white px-4 pr-12 text-base font-medium md:text-lg"
              />

              {selectedOption.trim() && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSelectedOption('');
                    setSchoolListOpen(true);
                    setHighlightedSchoolIndex(-1);
                    schoolInputRef.current?.focus();
                  }}
                  aria-label="Clear selected school"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {schoolListOpen && (
              <p
                id={schoolStatusId}
                role="status"
                aria-live="polite"
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                {searchTerm
                  ? `${filteredOptions.length} school${filteredOptions.length === 1 ? '' : 's'} found.`
                  : `Showing ${filteredOptions.length} available schools.`}
              </p>
            )}

            {schoolListOpen && (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div
                  id={schoolListboxId}
                  role="listbox"
                  aria-label="Matching schools"
                  className={`${SCHOOL_LISTBOX_HEIGHT_CLASSES} overflow-y-scroll p-2`}
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => {
                      const isSelected = selectedSchool?.value === option.value;
                      const isActive = index === highlightedSchoolIndex;

                      return (
                        <button
                          key={option.value}
                          id={`${question.id}-${option.value}`}
                          type="button"
                          role="option"
                          tabIndex={-1}
                          aria-selected={isSelected ? 'true' : 'false'}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setHighlightedSchoolIndex(index)}
                          onClick={() => handleSchoolSelection(option.label)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors md:text-base ${
                            isSelected
                              ? 'bg-[#1e3a5f] text-white'
                              : isActive
                                ? 'bg-slate-100 text-slate-900'
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
            )}

            {currentValidationError && (
              <p
                id={errorId}
                role="alert"
                className="text-sm font-medium text-red-600 dark:text-red-400"
              >
                {currentValidationError}
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <Select value={selectedOption} onValueChange={setSelectedOption}>
            <SelectTrigger
              aria-describedby={describedByIds || undefined}
              aria-invalid={currentValidationError ? 'true' : 'false'}
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

          {currentValidationError && (
            <p
              id={errorId}
              role="alert"
              className="text-sm font-medium text-red-600 dark:text-red-400"
            >
              {currentValidationError}
            </p>
          )}
        </div>
      );
    }

    if (question.control === 'number') {
      return (
        <div className="space-y-3">
          <Input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={selectedOption}
            onChange={(event) => setSelectedOption(event.target.value)}
            placeholder={question.placeholder ?? 'Enter a value'}
            aria-describedby={describedByIds || undefined}
            aria-invalid={currentValidationError ? 'true' : 'false'}
            className="h-14 rounded-lg border-gray-200 bg-white px-4 text-base font-medium md:text-lg"
          />
          {currentValidationError && (
            <p
              id={errorId}
              role="alert"
              className="text-sm font-medium text-red-600 dark:text-red-400"
            >
              {currentValidationError}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <RadioGroup
          key={`${question.id}:${questionOptions.map((option) => option.value).join('|')}`}
          value={selectedOption}
          onValueChange={setSelectedOption}
          aria-labelledby="current-question-heading"
          aria-describedby={describedByIds || undefined}
          className="space-y-2.5 md:space-y-4"
        >
          {questionOptions.map((option) => {
            const optionId = `${question.id}-${option.value}`;
            const isSelected = selectedOption === option.value;

            return (
              <motion.div
                key={option.value}
                whileHover={!isMobile ? { y: -2 } : undefined}
                whileTap={isMobile ? { scale: 0.995 } : undefined}
                transition={
                  isMobile
                    ? { duration: 0.14, ease: 'easeOut' }
                    : { type: 'spring', stiffness: 420, damping: 28 }
                }
                className="rounded-lg"
              >
                <Label
                  htmlFor={optionId}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-[0.98rem] font-medium leading-relaxed transition-colors md:p-4 md:text-lg ${
                    isSelected
                      ? 'border-[#355b8a] bg-[#eff6ff] dark:border-sky-300/50 dark:bg-slate-800/90'
                        : 'border-transparent bg-gray-100/55 hover:border-gray-200 hover:bg-gray-100/80 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={optionId}
                    className="size-3.5 border-gray-400 bg-gray-100 text-[#1e3a5f] dark:border-slate-500 dark:bg-slate-800 dark:text-sky-300"
                  />
                  <span className="flex-1">{option.label}</span>
                </Label>
              </motion.div>
            );
          })}
        </RadioGroup>

        {currentValidationError && (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-medium text-red-600 dark:text-red-400"
          >
            {currentValidationError}
          </p>
        )}
      </div>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="container mx-auto max-w-3xl px-6 py-12"
        >
          <p className="text-base text-slate-600 dark:text-slate-300">
            Loading questionnaire...
          </p>
        </main>
      </div>
    );
  }

  const helperId = `${currentQuestion.id}-helper`;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto max-w-3xl flex-1 px-5 py-4 sm:px-6 md:py-14"
      >
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleNext();
            }}
            className="flex h-full flex-1 flex-col"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentQuestion.id}:${currentQuestionOptionsSignature}`}
                initial={isMobile ? { opacity: 0, x: 16 } : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={isMobile ? { opacity: 0, x: -16 } : { opacity: 0, x: -20 }}
                transition={isMobile ? MOBILE_PAGE_TRANSITION : { duration: 0.3 }}
                className="min-w-0 flex-1 transform-gpu will-change-transform"
                style={contentHeight ? { minHeight: contentHeight } : undefined}
              >
                <span className="mb-4 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-slate-800 dark:text-slate-300 md:mb-4 md:px-3 md:py-1.5 md:text-sm">
                  {currentQuestion.category}
                </span>

                <h2
                  id="current-question-heading"
                  ref={questionHeadingRef}
                  tabIndex={-1}
                  className="mb-4 max-w-2xl text-[1.66rem] font-bold leading-[1.08] outline-none md:mb-5 md:text-[2.15rem] md:leading-[1.08]"
                >
                  <InlineTooltipText segments={currentQuestionTextSegments} />
                </h2>

                {currentQuestionHelperText && (
                  <p
                    id={helperId}
                    className="mb-7 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 md:mb-8 md:text-base"
                  >
                    {currentQuestionHelperText}
                  </p>
                )}

                {renderQuestionInput(currentQuestion)}
              </motion.div>
            </AnimatePresence>

            <div className="mt-2 flex shrink-0 items-center justify-between border-t border-gray-100 pt-2.5 dark:border-white/10 md:mt-12 md:pt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isEvaluating}
                className="group text-gray-500 hover:bg-gray-100 hover:text-black dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:text-base"
              >
                <ArrowLeft
                  className="mr-1.5 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                Back
              </Button>

              <Button
                type="submit"
                disabled={
                  !normalizedSelectedOption ||
                  Boolean(currentValidationError) ||
                  isEvaluating
                }
                className="group rounded-md bg-[#1e3a5f] px-8 text-white transition-all hover:bg-[#f97316] dark:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.95)] disabled:opacity-50 md:text-base"
              >
                {willSubmitCurrentStep
                  ? isEvaluating
                    ? 'Checking...'
                    : 'See Results'
                  : 'Next'}
                {!willSubmitCurrentStep && (
                  <ArrowRight
                    className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />

      <div
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-x-0 top-0 -z-10"
      >
        <div className="container mx-auto max-w-3xl px-5 py-4 sm:px-6 md:py-14">
          {questions.map((question) => {
            const questionTextSegments = getQuestionTextSegments(question, DEFAULT_QUESTION_MEASUREMENT_ANSWERS);
            const questionHelperText = getQuestionHelperText(question, DEFAULT_QUESTION_MEASUREMENT_ANSWERS);

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

                  {renderMeasurementInput(question)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


