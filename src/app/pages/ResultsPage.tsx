import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronDown, ExternalLink, CheckSquare } from 'lucide-react';

import { Button } from '../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../components/ui/card';
import { Navbar } from '../components/layout/Navbar';
import { PageBackdrop } from '../components/layout/PageBackdrop';
import { renderLinkedText } from '../components/ui/render-linked-text';
import { InlineTooltipText } from '../components/ui/inline-tooltip-text';
import { useBenefits } from '../context/BenefitsContext';
import {
  DHE_AFFIDAVIT_ACTION_STATUS,
  benefits,
  getBenefitRichTextSegments,
  isPositiveActionStatus,
} from '../data/benefitsData';
import { useIsMobile } from '../components/ui/use-mobile';
import { SiteFooter } from '../components/layout/SiteFooter';

const MOBILE_ROUTE_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
};

const MOBILE_DETAILS_REVEAL = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as const,
};

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';
const DHE_AFFIDAVIT_FORM_URL =
  'https://www.mass.edu/tuitionequity/documents/2025-09-10%20Tuition%20Equity%20Form%20and%20Affidavit_Fillable.pdf';

function getSingleBenefitPhrase(benefitId: string, fallbackTitle: string | null): string | null {
  switch (benefitId) {
    case 'mbta-pass':
      return 'the MBTA Student Pass';
    case 'pell-grant':
      return 'the Pell Grant';
    case 'snap':
      return 'SNAP';
    case 'masshealth':
      return 'MassHealth';
    case 'massgrant':
      return 'MASSGrant';
    case 'massgrant-plus':
      return 'MASSGrant Plus';
    default:
      return fallbackTitle;
  }
}

export default function ResultsPage() {
  const { matchedBenefits, screeningBenefitFilters, answers } = useBenefits();
  const hasMatches = matchedBenefits.length > 0;
  const singleScreenedBenefitId = screeningBenefitFilters.length === 1 ? screeningBenefitFilters[0] : null;
  const singleScreenedBenefitTitle =
    singleScreenedBenefitId
      ? benefits.find((benefit) => benefit.id === singleScreenedBenefitId)?.title ?? null
      : null;
  const singleScreenedBenefitPhrase = singleScreenedBenefitId
    ? getSingleBenefitPhrase(singleScreenedBenefitId, singleScreenedBenefitTitle)
    : null;
  const heroDescription = singleScreenedBenefitPhrase
    ? hasMatches
      ? `Based on your answers, you may qualify for ${singleScreenedBenefitPhrase}.`
      : `Based on your answers, we couldn't find a current match for ${singleScreenedBenefitPhrase}.`
    : hasMatches
      ? `Based on your answers, you may qualify for the following ${matchedBenefits.length} benefit${matchedBenefits.length === 1 ? '' : 's'}.`
      : "Based on your answers, we couldn't find any specific benefits matching your profile at this time.";
  const isMobile = useIsMobile();
  const [mobileOpenDetails, setMobileOpenDetails] = useState<Record<string, boolean>>({});

  const isNotEnrollingNextAcademicYear =
    answers['fafsa_completed'] === 'not_enrolled_next_year' ||
    answers['masfa_completed'] === 'not_enrolled_next_year';

  const getOfficialButtonLabel = (benefitId: string, fallbackLabel?: string) => {
    if (
      answers['fafsa_completed'] === 'not_enrolled_next_year' &&
      (benefitId === 'pell-grant' || benefitId === 'massgrant' || benefitId === 'massgrant-plus')
    ) {
      return 'View Official Site';
    }

    return fallbackLabel ?? 'Visit Official Site';
  };

  const getVisibleStatuses = (benefitId: string, benefit: { actionStatuses?: string[]; actionStatus?: string }) => {
    const statuses = benefit.actionStatuses ?? (benefit.actionStatus ? [benefit.actionStatus] : []);

    if (
      isNotEnrollingNextAcademicYear &&
      (benefitId === 'pell-grant' || benefitId === 'massgrant' || benefitId === 'massgrant-plus')
    ) {
      return [];
    }

    return statuses;
  };

  const heroEnterInitial = { opacity: 0, y: isMobile ? 12 : 20 };

  const heroEnterTransition = (delay = 0) =>
    isMobile
      ? { ...MOBILE_ROUTE_TRANSITION, delay: Math.min(delay, 0.08) }
      : { duration: 0.5, delay };

  const benefitCardTransition = (index: number) =>
    isMobile
      ? { ...MOBILE_ROUTE_TRANSITION, duration: 0.18, delay: Math.min(index, 2) * 0.035 }
      : { duration: 0.22, delay: index * 0.08 };

  const toggleMobileDetails = (benefitId: string) => {
    setMobileOpenDetails((current) => ({
      ...current,
      [benefitId]: !current[benefitId],
    }));
  };

  const renderStatusText = (status: string) => {
    if (status === DHE_AFFIDAVIT_ACTION_STATUS) {
      return (
        <>
          <span>Action Needed, Complete the </span>
          <a
            href={DHE_AFFIDAVIT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
          >
            <span>DHE Affidavit</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </>
      );
    }

    const richTextSegments = getBenefitRichTextSegments(status);
    return richTextSegments ? <InlineTooltipText segments={richTextSegments} /> : status;
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl px-6 py-12">
        <div className="relative mb-14">
          <motion.div
            initial={heroEnterInitial}
            animate={{ opacity: 1, y: 0 }}
            transition={heroEnterTransition()}
            className="relative"
          >
            <div
              className="relative overflow-hidden rounded-t-[2rem] border-x border-t border-white/70 bg-white/72 p-8 pb-20 shadow-[0_34px_80px_-60px_rgba(15,23,42,0.42)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/58 md:p-10 md:pb-24"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
              }}
            >
              <div className="relative z-10">
                <h1 id="results-heading" className="mb-4 text-[2.6rem] font-bold tracking-tight md:text-[2.85rem]">
                  Your Results
                </h1>

                <p className="max-w-2xl text-lg text-gray-600 dark:text-slate-300">
                  {heroDescription}
                </p>

                {hasMatches && (
                  <motion.div
                    initial={heroEnterInitial}
                    animate={{ opacity: 1, y: 0 }}
                    transition={heroEnterTransition(0.1)}
                    className="mt-6 flex justify-center"
                  >
                    <Link to="/checklist">
                      <Button
                        size="lg"
                        className="group cursor-pointer rounded-full bg-[#f97316] px-8 py-6 text-lg text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.3)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#ea580c] hover:shadow-[0_20px_25px_-5px_rgba(249,115,22,0.4)] dark:shadow-[0_10px_28px_-14px_rgba(251,146,60,0.56)] dark:hover:shadow-[0_20px_40px_-16px_rgba(251,146,60,0.76)]"
                      >
                        <CheckSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        Get Personalized Checklist
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {hasMatches ? (
          isMobile ? (
            <section aria-labelledby="results-heading" className="space-y-6">
              {matchedBenefits.map((benefit) => {
                const statuses = getVisibleStatuses(benefit.id, benefit);
                const isDetailsOpen = Boolean(mobileOpenDetails[benefit.id]);

                const actionButton = (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="group w-full whitespace-nowrap border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.4)] sm:w-auto sm:shrink-0 dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                  >
                    <a href={benefit.officialUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      {getOfficialButtonLabel(benefit.id, benefit.officialButtonLabel)}
                    </a>
                  </Button>
                );

                const detailsContent = (
                  <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                    {renderLinkedText(benefit.details, {
                      paragraphClassName:
                        'text-sm text-gray-700 leading-relaxed dark:text-slate-200',
                      linkClassName:
                        'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
                    })}
                  </div>
                );

                return (
                  <div
                    key={benefit.id}
                    className="rounded-[1.5rem] border border-white/75 bg-white/86 shadow-[0_24px_52px_-24px_rgba(15,23,42,0.24)] backdrop-blur-none dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_24px_52px_-24px_rgba(2,6,23,0.78)]"
                  >
                    <div className="px-5 pt-5">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                            {benefit.category}
                          </span>

                          <h2 className="text-xl font-bold">{benefit.title}</h2>

                          {statuses.length > 0 && (
                            <div className="mt-2 flex flex-col items-start gap-2">
                              {statuses.map((status) => (
                                <div
                                  key={`${benefit.id}-${status}`}
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                    isPositiveActionStatus(status)
                                      ? 'bg-green-100 text-green-800 dark:bg-emerald-400/18 dark:text-emerald-200 dark:ring-1 dark:ring-inset dark:ring-emerald-300/30'
                                      : 'bg-red-100 text-red-700 dark:bg-[#ff0000]/22 dark:text-[#fff3f3] dark:ring-1 dark:ring-inset dark:ring-[#ff4d4d]/55'
                                  }`}
                                >
                                  {renderStatusText(status)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {actionButton}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                        {benefit.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isDetailsOpen}
                      aria-controls={`${benefit.id}-details`}
                      onClick={() => toggleMobileDetails(benefit.id)}
                      className="flex w-full items-start justify-between gap-4 border-t border-gray-100 px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors dark:border-white/10 dark:text-sky-200"
                    >
                      <span>More Details</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#355b8a] transition-transform duration-200 dark:text-sky-200 ${
                          isDetailsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isDetailsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={MOBILE_DETAILS_REVEAL}
                        id={`${benefit.id}-details`}
                        role="region"
                        aria-label={`${benefit.title} details`}
                        className="px-5 pb-5 pt-1"
                        style={{ contain: 'paint' }}
                      >
                        {detailsContent}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </section>
          ) : (
            <section aria-labelledby="results-heading">
              <Accordion type="multiple" className="space-y-6">
                {matchedBenefits.map((benefit, index) => {
                  const statuses = getVisibleStatuses(benefit.id, benefit);

                  const actionButton = (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="group w-full whitespace-nowrap border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.4)] sm:w-auto sm:shrink-0 dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                    >
                      <a href={benefit.officialUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        {getOfficialButtonLabel(benefit.id, benefit.officialButtonLabel)}
                      </a>
                    </Button>
                  );

                  const detailsContent = (
                    <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                      {renderLinkedText(benefit.details, {
                        paragraphClassName:
                          'text-sm text-gray-700 leading-relaxed dark:text-slate-200',
                        linkClassName:
                          'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
                      })}
                    </div>
                  );

                  return (
                    <motion.div
                      key={benefit.id}
                      initial={heroEnterInitial}
                      animate={{ opacity: 1, y: 0 }}
                      transition={benefitCardTransition(index)}
                    >
                      <AccordionItem value={benefit.id} className="rounded-[1.5rem] border-none">
                        <Card className="gap-5 overflow-hidden border border-white/75 bg-white/86 shadow-[0_24px_52px_-24px_rgba(15,23,42,0.24)] backdrop-blur-none transition-all duration-125 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-200/70 sm:gap-6 md:shadow-[0_20px_55px_-38px_rgba(15,23,42,0.3)] sm:backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_24px_52px_-24px_rgba(2,6,23,0.78)] md:dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.95)] dark:hover:shadow-[0_30px_70px_-38px_rgba(2,6,23,1)]">
                          <CardHeader className="gap-3 px-5 pt-5 sm:gap-4 sm:px-6 sm:pt-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="min-w-0">
                                <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 sm:mb-2 dark:bg-slate-800 dark:text-slate-300">
                                  {benefit.category}
                                </span>

                                <CardTitle className="text-xl font-bold sm:text-2xl">
                                  {benefit.title}
                                </CardTitle>

                                {statuses.length > 0 && (
                                  <div className="mt-2 flex flex-col items-start gap-2">
                                    {statuses.map((status) => (
                                      <div
                                        key={`${benefit.id}-${status}`}
                                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                          isPositiveActionStatus(status)
                                            ? 'bg-green-100 text-green-800 dark:bg-emerald-400/18 dark:text-emerald-200 dark:ring-1 dark:ring-inset dark:ring-emerald-300/30'
                                            : 'bg-red-100 text-red-700 dark:bg-[#ff0000]/22 dark:text-[#fff3f3] dark:ring-1 dark:ring-inset dark:ring-[#ff4d4d]/55'
                                        }`}
                                      >
                                        {renderStatusText(status)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {actionButton}
                            </div>
                          </CardHeader>

                          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                            <CardDescription className="text-sm leading-relaxed text-gray-600 dark:text-slate-300 sm:text-base">
                              {benefit.description}
                            </CardDescription>
                          </CardContent>

                          <div className="border-t border-gray-100 bg-gray-50/60 dark:border-white/10 dark:bg-slate-950/60">
                            <AccordionTrigger className="px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors hover:no-underline sm:px-6 sm:py-4 dark:text-sky-200 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#355b8a] dark:[&>svg]:text-sky-200">
                              <span>More Details</span>
                            </AccordionTrigger>
                            <AccordionContent className="border-t border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6 sm:py-5">
                              {detailsContent}
                            </AccordionContent>
                          </div>
                        </Card>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </Accordion>
            </section>
          )
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/72 py-20 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-none dark:border-slate-700 dark:bg-slate-900/70 md:backdrop-blur-sm">
            <p className="mb-4 text-gray-500 dark:text-slate-400">
              We couldn&apos;t find any specific benefits matching your profile at this time.
            </p>
            <Button asChild variant="outline">
              <Link to="/">
                Start Over
              </Link>
            </Button>
          </div>
        )}

        <motion.div
          initial={heroEnterInitial}
          animate={{ opacity: 1, y: 0 }}
          transition={heroEnterTransition(hasMatches ? 0.16 : 0.08)}
          className="mt-10 flex justify-center"
        >
          <Button
            asChild
            variant="outline"
            className="group border-[#355b8a] bg-white/92 px-6 py-5 text-[#1e3a5f] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_14px_32px_-20px_rgba(249,115,22,0.44)] dark:border-sky-200/55 dark:bg-slate-900/82 dark:text-sky-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
          >
            <a href={FEEDBACK_SURVEY_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Take Our Feedback Survey
            </a>
          </Button>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}