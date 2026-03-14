import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ExternalLink, CheckSquare } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/app/components/ui/card';
import { Navbar } from '@/app/components/layout/Navbar';
import { useBenefits } from '@/app/context/BenefitsContext';

const FAFSA_MANAGED_BENEFIT_IDS = new Set(['pell-grant', 'massgrant', 'massgrant-plus']);
const FAFSA_STATUS_URL =
  'https://studentaid.gov/fsa-id/sign-in/landing?redirectTo=%2Fmy-activity';

export default function ResultsPage() {
  const { matchedBenefits } = useBenefits();
  const hasMatches = matchedBenefits.length > 0;

  const getBenefitAction = (benefit: (typeof matchedBenefits)[number]) => {
    const hasNoActionNeeded = benefit.actionStatus?.includes('No action needed');

    if (hasNoActionNeeded && FAFSA_MANAGED_BENEFIT_IDS.has(benefit.id)) {
      return {
        href: FAFSA_STATUS_URL,
        label: 'Check Application Status',
      };
    }

    return {
      href: benefit.officialUrl,
      label: benefit.officialButtonLabel ?? 'Start Official Application',
    };
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navbar />

      <div className="container max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="mb-4 text-[2.6rem] font-bold tracking-tight md:text-[2.85rem]">Your Results</h1>
          <p className="max-w-2xl text-lg text-gray-600">
            Based on your answers, you may qualify for the following {matchedBenefits.length}{' '}
            benefits.
          </p>

          {hasMatches && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 flex justify-center"
            >
              <Link to="/checklist">
                <Button
                  size="lg"
                  className="bg-[#f97316] text-white hover:bg-[#ea580c] text-lg px-8 py-6 rounded-full group transition-all duration-200 shadow-[0_4px_14px_0_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_25px_-5px_rgba(249,115,22,0.4)] cursor-pointer"
                >
                  <CheckSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Get Personalized Checklist
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {hasMatches ? (
          <div className="space-y-6">
            {matchedBenefits.map((benefit, index) => {
              const action = getBenefitAction(benefit);
              const showActionStatus = benefit.id !== 'snap' && Boolean(benefit.actionStatus);

              return (
                <motion.div
                  key={benefit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.08 }}
                >
                  <Card className="border border-gray-200 shadow-sm transition-all duration-125 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-200/70">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-xs font-bold text-gray-500 rounded mb-2 uppercase tracking-wide">
                            {benefit.category}
                          </span>

                          <CardTitle className="text-2xl font-bold">{benefit.title}</CardTitle>

                          {showActionStatus && (
                            <div
                              className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                benefit.actionStatus?.includes('No action needed')
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {benefit.actionStatus}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:flex border-black text-black hover:bg-[#1e3a5f] hover:text-white"
                        >
                          Details
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <CardDescription className="text-base text-gray-600 leading-relaxed">
                        {benefit.description}
                      </CardDescription>
                    </CardContent>

                    <CardFooter className="bg-gray-50/50 p-6 flex justify-end gap-3 border-t border-gray-100">
                      <Button
                        asChild
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:text-white"
                      >
                        <a href={action.href} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {action.label}
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">
              We couldn't find any specific benefits matching your profile at this time.
            </p>
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              Start Over
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


