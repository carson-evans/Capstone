import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, CheckSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/app/components/ui/card';
import { Navbar } from '@/app/components/layout/Navbar';
import { PageBackdrop } from '@/app/components/layout/PageBackdrop';
import { renderLinkedText } from '@/app/components/ui/render-linked-text';
import { useBenefits } from '@/app/context/BenefitsContext';

const FAFSA_MANAGED_BENEFIT_IDS = new Set(['pell-grant', 'massgrant', 'massgrant-plus']);
const FAFSA_STATUS_URL =
  'https://studentaid.gov/fsa-id/sign-in/landing?redirectTo=%2Fmy-activity';

export default function ResultsPage() {
  const { matchedBenefits } = useBenefits();
  const hasMatches = matchedBenefits.length > 0;
  const [expandedBenefitIds, setExpandedBenefitIds] = useState<string[]>([]);

  const toggleBenefitDetails = (benefitId: string) => {
    setExpandedBenefitIds((previousIds) =>
      previousIds.includes(benefitId)
        ? previousIds.filter((id) => id !== benefitId)
        : [...previousIds, benefitId]
    );
  };

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
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] text-black font-sans dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <div className="container max-w-4xl mx-auto px-6 py-12">
        <div className="relative mb-14">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-t-[2rem] border-x border-t border-white/70 bg-white/72 p-8 pb-20 shadow-[0_34px_80px_-60px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/58 md:p-10 md:pb-24"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
          }}
        >
          <div className="relative z-10">
            <h1 className="mb-4 text-[2.6rem] font-bold tracking-tight md:text-[2.85rem]">Your Results</h1>
            <p className="max-w-2xl text-lg text-gray-600 dark:text-slate-300">
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
                    className="bg-[#f97316] text-white hover:bg-[#ea580c] text-lg px-8 py-6 rounded-full group transition-all duration-200 shadow-[0_4px_14px_0_rgba(249,115,22,0.3)] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_25px_-5px_rgba(249,115,22,0.4)] dark:shadow-[0_10px_28px_-14px_rgba(251,146,60,0.56)] dark:hover:shadow-[0_20px_40px_-16px_rgba(251,146,60,0.76)] cursor-pointer"
                  >
                    <CheckSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    Get Personalized Checklist
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
        </div>

        {hasMatches ? (
          <div className="space-y-6">
            {matchedBenefits.map((benefit, index) => {
              const action = getBenefitAction(benefit);
              const showActionStatus = benefit.id !== 'snap' && Boolean(benefit.actionStatus);
              const isDetailsOpen = expandedBenefitIds.includes(benefit.id);

              return (
                <motion.div
                  key={benefit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.08 }}
                >
                  <Card className="overflow-hidden border border-white/75 bg-white/86 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm transition-all duration-125 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-200/70 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.95)] dark:hover:shadow-[0_30px_70px_-38px_rgba(2,6,23,1)]">
                    <CardHeader className="gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <span className="inline-block px-2 py-1 bg-gray-100 text-xs font-bold text-gray-500 rounded mb-2 uppercase tracking-wide dark:bg-slate-800 dark:text-slate-300">
                            {benefit.category}
                          </span>

                          <CardTitle className="text-2xl font-bold">{benefit.title}</CardTitle>

                          {showActionStatus && (
                            <div
                              className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                benefit.actionStatus?.includes('No action needed')
                                  ? 'bg-green-100 text-green-800 dark:bg-emerald-400/18 dark:text-emerald-200 dark:ring-1 dark:ring-inset dark:ring-emerald-300/30'
                                  : 'bg-red-100 text-red-700 dark:bg-[#ff0000]/22 dark:text-[#fff3f3] dark:ring-1 dark:ring-inset dark:ring-[#ff4d4d]/55'
                              }`}
                            >
                              {benefit.actionStatus}
                            </div>
                          )}
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto sm:shrink-0 border-gray-300 text-gray-700 hover:bg-[#1e3a5f] hover:text-white whitespace-nowrap dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                        >
                          <a href={action.href} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {action.label}
                          </a>
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-6">
                      <CardDescription className="text-base text-gray-600 leading-relaxed dark:text-slate-300">
                        {benefit.description}
                      </CardDescription>
                    </CardContent>

                    <div className="border-t border-gray-100 bg-gray-50/60 dark:border-white/10 dark:bg-slate-950/60">
                      <button
                        type="button"
                        onClick={() => toggleBenefitDetails(benefit.id)}
                        aria-expanded={isDetailsOpen}
                        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left text-sm font-semibold text-[#1e3a5f] transition-colors hover:text-[#16304f] dark:text-slate-200 dark:hover:text-sky-200"
                      >
                        <span>More Details</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isDetailsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isDetailsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="overflow-hidden border-t border-gray-100 dark:border-white/10"
                          >
                            <div className="px-6 py-5">
                              <div className="space-y-3 text-sm text-gray-700 leading-relaxed dark:text-slate-200">
                                {renderLinkedText(benefit.details, {
                                  paragraphClassName: 'text-sm text-gray-700 leading-relaxed dark:text-slate-200',
                                  linkClassName:
                                    'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/72 py-20 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-gray-500 mb-4 dark:text-slate-400">
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









