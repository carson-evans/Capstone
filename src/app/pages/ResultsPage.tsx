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
    <div className="min-h-screen bg-white font-sans text-black">
      <Navbar />

      <div className="container mx-auto max-w-5xl px-6 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 md:mb-14"
        >
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Your Results</h1>
          <p className="max-w-3xl text-lg text-gray-600 md:text-xl">
            Based on your answers, you may qualify for the following {matchedBenefits.length}{' '}
            benefits.
          </p>
        </motion.div>

        {hasMatches ? (
          <div className="space-y-6 md:space-y-8">
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
                    <CardHeader className="md:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 md:text-sm">
                            {benefit.category}
                          </span>

                          <CardTitle className="text-2xl font-bold md:text-3xl">{benefit.title}</CardTitle>

                          {showActionStatus && (
                            <div
                              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold md:text-sm ${
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
                          className="hidden border-black text-black hover:bg-[#1e3a5f] hover:text-white sm:flex"
                        >
                          Details
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="md:px-8 md:pb-8">
                      <CardDescription className="text-base leading-relaxed text-gray-600 md:text-lg">
                        {benefit.description}
                      </CardDescription>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-6 md:p-7">
                      <Button
                        asChild
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:text-white md:text-base"
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
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center md:py-24">
            <p className="mb-4 text-gray-500 md:text-lg">
              We couldn't find any specific benefits matching your profile at this time.
            </p>
            <Button variant="outline" onClick={() => (window.location.href = '/')}>
              Start Over
            </Button>
          </div>
        )}

        {hasMatches && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center md:mt-14"
          >
            <Link to="/checklist">
              <Button
                size="lg"
                className="group cursor-pointer rounded-full bg-[#f97316] px-8 py-6 text-lg text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.3)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#ea580c] hover:shadow-[0_20px_25px_-5px_rgba(249,115,22,0.4)] md:px-10 md:py-7 md:text-xl"
              >
                <CheckSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                Get Personalized Checklist
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
