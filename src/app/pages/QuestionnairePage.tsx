import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Navbar } from '../components/layout/Navbar';
import { PageBackdrop } from '../components/layout/PageBackdrop';
import { useBenefits } from '../context/BenefitsContext';
import { getVisibleQuestions, questions } from '../data/benefitsData';
import { useIsMobile } from '../components/ui/use-mobile';

const MOBILE_PAGE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setAnswer, answers, evaluateBenefits, isEvaluating } = useBenefits();
  const measurementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [desktopContentHeight, setDesktopContentHeight] = useState<number | null>(null);

  const visibleQuestions = React.useMemo(() => {
    return getVisibleQuestions(questions, answers);
  }, [answers]);

  useEffect(() => {
    if (currentStep >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentStep(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, currentStep]);

  useEffect(() => {
    if (isMobile && desktopContentHeight !== null) {
      setDesktopContentHeight(null);
    }
  }, [desktopContentHeight, isMobile]);

  const currentQuestion = visibleQuestions[currentStep];
  const isLastStep = visibleQuestions.length > 0 && currentStep === visibleQuestions.length - 1;
  const progress = visibleQuestions.length > 0 ? ((currentStep + 1) / visibleQuestions.length) * 100 : 0;

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(answers[currentQuestion.id] || '');
    }
  }, [currentStep, currentQuestion, answers]);

  useLayoutEffect(() => {
    if (isMobile) {
      return;
    }

    let frameId = 0;

    const measureDesktopContentHeight = () => {
      frameId = window.requestAnimationFrame(() => {
        const tallestHeight = visibleQuestions.reduce((maxHeight, question) => {
          const element = measurementRefs.current[question.id];
          return element ? Math.max(maxHeight, element.offsetHeight) : maxHeight;
        }, 0);

        if (tallestHeight > 0) {
          setDesktopContentHeight(tallestHeight);
        }
      });
    };

    measureDesktopContentHeight();
    window.addEventListener('resize', measureDesktopContentHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', measureDesktopContentHeight);
    };
  }, [isMobile, visibleQuestions]);

  const handleNext = async () => {
    if (!currentQuestion || !selectedOption || isEvaluating) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: selectedOption,
    };

    const nextVisibleQuestions = getVisibleQuestions(questions, nextAnswers);
    const isLastVisibleStep = currentStep >= nextVisibleQuestions.length - 1;

    setAnswer(currentQuestion.id, selectedOption);

    if (isLastVisibleStep) {
      try {
        await evaluateBenefits(nextAnswers);
        navigate('/results');
      } catch (error) {
        console.error('Eligibility evaluation error:', error);
        alert(
          error instanceof Error
            ? error.message
            : 'Something went wrong while checking eligibility.'
        );
      }
      return;
    }

    setSelectedOption('');
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (isEvaluating) return;

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/');
    }
  };

  if (!currentQuestion) return <div>Loading...</div>;

  const questionContent = (
    <>
      <span className="mb-4 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-slate-800 dark:text-slate-300 md:mb-4 md:px-3 md:py-1.5 md:text-sm">
        {currentQuestion.category}
      </span>

      <h2 className="mb-7 max-w-2xl text-[1.66rem] font-bold leading-[1.08] md:mb-10 md:text-[2.15rem] md:leading-[1.08]">
        {currentQuestion.text}
      </h2>
      {Array.isArray(currentQuestion.description) && (
        <ul className="mb-4 list-disc pl-5 text-sm text-gray-600 dark:text-slate-400">
          {currentQuestion.description.map((school) => (
            <li key={school}>{school}</li>
          ))}
        </ul>
      )}
      <RadioGroup
        value={selectedOption}
        onValueChange={setSelectedOption}
        className="space-y-2.5 md:space-y-4"
      >
        {currentQuestion.options.map((option) => {
          const optionId = `${currentQuestion.id}-${option.value}`;
          const optionClasses =
            'flex cursor-pointer items-start space-x-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-gray-200 hover:bg-gray-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 md:p-4';

          return (
            <motion.div
              key={option.value}
              whileHover={isMobile ? undefined : { y: -2 }}
              whileTap={isMobile ? { scale: 0.995 } : undefined}
              transition={
                isMobile
                  ? { duration: 0.14, ease: 'easeOut' }
                  : { type: 'spring', stiffness: 420, damping: 28 }
              }
              className={optionClasses}
              onClick={() => setSelectedOption(option.value)}
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
    </>
  );

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <div className="container mx-auto max-w-3xl flex-1 px-5 py-4 sm:px-6 md:py-14">
        <div className="mb-5 space-y-2 md:mb-10">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 md:text-sm">
            <span>
              Step {currentStep + 1} of {visibleQuestions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-slate-200/90 shadow-inner dark:bg-slate-800/90 md:h-2.5"
          />
        </div>

        <div className="flex h-[calc(100dvh-12.25rem)] flex-col overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/82 px-4 py-3.5 shadow-[0_34px_80px_-52px_rgba(15,23,42,0.45)] backdrop-blur-none dark:border-white/10 dark:bg-slate-900/78 dark:shadow-[0_28px_80px_-40px_rgba(2,6,23,0.95)] md:h-auto md:min-h-0 md:p-12 md:backdrop-blur-sm">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQuestion.id}
              initial={isMobile ? { opacity: 0, x: 16 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={isMobile ? { opacity: 0, x: -16 } : { opacity: 0, x: -20 }}
              transition={isMobile ? MOBILE_PAGE_TRANSITION : { duration: 0.3 }}
              className={`min-w-0 min-h-0 flex-1 ${
                isMobile
                  ? 'overflow-y-auto overscroll-contain pr-1 transform-gpu will-change-transform'
                  : 'md:flex-none'
              }`}
              style={undefined}
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
              disabled={!selectedOption || isEvaluating}
              className="rounded-md bg-[#1e3a5f] px-8 text-white transition-all hover:bg-[#f97316] dark:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.95)] disabled:opacity-50 md:text-base"
            >
              {isLastStep ? (isEvaluating ? 'Checking...' : 'See Results') : 'Next'}
              {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-x-0 top-0 -z-10 hidden md:block"
      >
        <div className="container mx-auto max-w-3xl px-6 py-14">
          {visibleQuestions.map((question) => (
            <div
              key={question.id}
              className="rounded-xl border border-transparent bg-white p-12 shadow-sm"
            >
              <div
                ref={(element) => {
                  measurementRefs.current[question.id] = element;
                }}
                className="min-w-0"
              >
                <span className="mb-4 inline-block rounded bg-gray-100 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-gray-500">
                  {question.category}
                </span>

                <h2 className="mb-10 max-w-2xl text-[2.15rem] font-bold leading-[1.08]">
                  {question.text}
                </h2>
                {Array.isArray(question.description) && (
                  <ul className="mb-4 list-disc pl-5 text-sm text-gray-600">
                    {question.description.map((school) => (
                      <li key={school}>{school}</li>
                    ))}
                  </ul>
                )}

                <div className="space-y-4">
                  {question.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-start space-x-3 rounded-lg border border-transparent p-4"
                    >
                      <div className="mt-1 h-4 w-4 rounded-full border border-slate-300" />
                      <div className="flex-1 text-lg font-medium leading-relaxed">
                        {option.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
