import React, { useState, useEffect } from 'react';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  // Sync local state with context when step changes
  useEffect(() => {
    if (currentQuestion) {
        setSelectedOption(answers[currentQuestion.id] || '');
    }
  }, [currentStep, currentQuestion, answers]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-black">
      <Navbar />

      <div className="flex-1 container max-w-2xl mx-auto px-6 py-12 flex flex-col">
        
        {/* Progress Bar */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-xs font-semibold tracking-wider text-gray-500 uppercase">
            <span>Step {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1 bg-gray-200" />
        </div>

        {/* Question Card */}
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                {currentQuestion.category}
              </span>
              
              <h2 className="text-2xl font-bold mb-8 leading-tight">
                {currentQuestion.text}
              </h2>

              <RadioGroup 
                value={selectedOption} 
                onValueChange={setSelectedOption}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer" onClick={() => setSelectedOption(option.value)}>
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={option.value}
                      className="text-base font-medium cursor-pointer leading-relaxed flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-gray-500 hover:text-black hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!selectedOption}
              className="bg-[#1e3a5f] text-white px-8 rounded-md hover:bg-[#f97316] disabled:opacity-50 transition-all"
            >
              {isLastStep ? 'See Results' : 'Next'}
              {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


