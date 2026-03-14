import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Navbar } from '@/app/components/layout/Navbar';
import { useBenefits } from '@/app/context/BenefitsContext';
import { questions } from '@/app/data/benefitsData';

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { setAnswer, answers } = useBenefits();
  const measurementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [desktopContentHeight, setDesktopContentHeight] = useState<number | null>(null);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(answers[currentQuestion.id] || '');
    }
  }, [currentStep, currentQuestion, answers]);

  useLayoutEffect(() => {
    let frameId = 0;

    const measureDesktopContentHeight = () => {
      if (window.innerWidth < 768) {
        setDesktopContentHeight(null);
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        const tallestHeight = questions.reduce((maxHeight, question) => {
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
  }, []);

  const handleNext = () => {
    if (!selectedOption) return;

    setAnswer(currentQuestion.id, selectedOption);

    if (isLastStep) {
      navigate('/results');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/');
    }
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black">
      <Navbar />

      <div className="container mx-auto max-w-3xl flex-1 px-6 py-10 md:py-14">
        <div className="mb-8 space-y-3 md:mb-10">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 md:text-sm">
            <span>
              Step {currentStep + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-200/90 shadow-inner md:h-2.5" />
        </div>

        <div className="flex min-h-[calc(100dvh-19rem)] flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:min-h-0 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-w-0 flex-1 md:flex-none"
              style={desktopContentHeight ? { height: desktopContentHeight } : undefined}
            >
              <span className="mb-4 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-500 md:px-3 md:py-1.5 md:text-sm">
                {currentQuestion.category}
              </span>

              <h2 className="mb-8 max-w-2xl text-[1.9rem] font-bold leading-tight md:mb-10 md:text-[2.15rem] md:leading-[1.08]">
                {currentQuestion.text}
              </h2>

              <RadioGroup
                value={selectedOption}
                onValueChange={setSelectedOption}
                className="space-y-3 md:space-y-4"
              >
                {currentQuestion.options.map((option) => {
                  const optionId = `${currentQuestion.id}-${option.value}`;

                  return (
                    <motion.div
                      key={option.value}
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      className="flex cursor-pointer items-start space-x-3 rounded-lg border border-transparent p-3 transition-colors hover:border-gray-200 hover:bg-gray-50 md:p-4"
                      onClick={() => setSelectedOption(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={optionId} className="mt-1" />
                      <Label
                        htmlFor={optionId}
                        className="flex-1 cursor-pointer text-base font-medium leading-relaxed md:text-lg"
                      >
                        {option.label}
                      </Label>
                    </motion.div>
                  );
                })}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6 md:mt-12 md:pt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-500 hover:bg-gray-100 hover:text-black md:text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              className="rounded-md bg-[#1e3a5f] px-8 text-white transition-all hover:bg-[#f97316] disabled:opacity-50 md:text-base"
            >
              {isLastStep ? 'See Results' : 'Next'}
              {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none invisible fixed inset-x-0 top-0 -z-10 hidden md:block">
        <div className="container mx-auto max-w-3xl px-6 py-14">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-transparent bg-white p-12 shadow-sm">
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

                <div className="space-y-4">
                  {question.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-start space-x-3 rounded-lg border border-transparent p-4"
                    >
                      <div className="mt-1 h-4 w-4 rounded-full border border-slate-300" />
                      <div className="flex-1 text-lg font-medium leading-relaxed">{option.label}</div>
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

