import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink, CheckSquare } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/app/components/ui/card';
import { Navbar } from '@/app/components/layout/Navbar';
import { PageBackdrop } from '@/app/components/layout/PageBackdrop';
import { PageHeroCard } from '@/app/components/layout/PageHeroCard';
import { SiteFooter } from '@/app/components/layout/SiteFooter';
import { renderLinkedText } from '@/app/components/ui/render-linked-text';
import { InlineTooltipText } from '@/app/components/ui/inline-tooltip-text';
import { useBenefits } from '@/app/context/BenefitsContext';
import {
  DHE_AFFIDAVIT_ACTION_STATUS,
  benefits,
  getBenefitIneligibilityReasons,
  getBenefitRichTextSegments,
  getDisplayActionStatus,
  isPositiveActionStatus,
  type Benefit,
} from '@/app/data/benefitsData';
import { useIsMobile } from '@/app/components/ui/use-mobile';

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

const OFFICIAL_REQUIREMENTS_URLS: Record<Benefit['id'], string> = {
  'pell-grant': 'https://studentaid.gov/articles/dont-miss-out-on-pell-grants/',
  massgrant: 'https://www.mass.edu/osfa/programs/massgrant.asp',
  'massgrant-plus': 'https://www.mass.edu/osfa/programs/massgrantplus.asp',
  masshealth:
    'https://www.mass.gov/info-details/eligibility-for-health-care-benefits-for-masshealth-the-health-safety-net-and-childrens-medical-security-plan',
  'mbta-pass': 'https://www.mbta.com/fares/college-student-semester-passes',
  snap: 'https://www.mass.gov/how-to/apply-for-snap-benefits-food-stamps',
};

const benefitCatalogById = new Map(benefits.map((benefit) => [benefit.id, benefit]));

const MATCHED_MOBILE_CARD_CLASSNAME =
  'rounded-[1.5rem] border border-emerald-100/90 ring-1 ring-emerald-200/70 bg-white/86 shadow-[0_24px_52px_-24px_rgba(15,23,42,0.24),0_0_42px_-30px_rgba(34,197,94,0.36)] dark:border-emerald-300/18 dark:ring-emerald-300/24 dark:bg-slate-900/80 dark:shadow-[0_24px_52px_-24px_rgba(2,6,23,0.78),0_0_42px_-28px_rgba(52,211,153,0.28)]';
const MATCHED_DESKTOP_CARD_CLASSNAME =
  'gap-5 overflow-hidden border border-emerald-100/90 ring-1 ring-emerald-200/70 bg-white/86 shadow-[0_24px_52px_-24px_rgba(15,23,42,0.24),0_0_42px_-30px_rgba(34,197,94,0.36)] backdrop-blur-none transition-all duration-125 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_30px_70px_-38px_rgba(22,163,74,0.28)] sm:gap-6 md:shadow-[0_20px_55px_-38px_rgba(15,23,42,0.3),0_0_44px_-32px_rgba(34,197,94,0.3)] sm:backdrop-blur-sm dark:border-emerald-300/18 dark:ring-emerald-300/24 dark:bg-slate-900/80 dark:shadow-[0_24px_52px_-24px_rgba(2,6,23,0.78),0_0_42px_-28px_rgba(52,211,153,0.24)] md:dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.95),0_0_42px_-28px_rgba(52,211,153,0.22)] dark:hover:shadow-[0_30px_70px_-38px_rgba(16,185,129,0.22)]';
const NOT_MATCHED_MOBILE_CARD_CLASSNAME =
  'rounded-[1.5rem] border border-rose-100/95 ring-1 ring-rose-200/80 bg-white/86 shadow-[0_24px_52px_-24px_rgba(15,23,42,0.24),0_0_42px_-30px_rgba(248,113,113,0.42)] dark:border-rose-300/18 dark:ring-rose-300/24 dark:bg-slate-900/80 dark:shadow-[0_24px_52px_-24px_rgba(2,6,23,0.78),0_0_42px_-28px_rgba(251,113,133,0.3)]';
const NOT_MATCHED_DESKTOP_CARD_CLASSNAME =
  'gap-5 overflow-hidden border border-rose-100/95 ring-1 ring-rose-200/80 bg-white/86 shadow-[0_24px_52px_-24px_rgba(15,23,42,0.24),0_0_42px_-30px_rgba(248,113,113,0.42)] backdrop-blur-none transition-all duration-125 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_30px_70px_-38px_rgba(239,68,68,0.26)] sm:gap-6 md:shadow-[0_20px_55px_-38px_rgba(15,23,42,0.3),0_0_44px_-32px_rgba(248,113,113,0.34)] sm:backdrop-blur-sm dark:border-rose-300/18 dark:ring-rose-300/24 dark:bg-slate-900/80 dark:shadow-[0_24px_52px_-24px_rgba(2,6,23,0.78),0_0_42px_-28px_rgba(251,113,133,0.26)] md:dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.95),0_0_42px_-28px_rgba(251,113,133,0.24)] dark:hover:shadow-[0_30px_70px_-38px_rgba(244,63,94,0.22)]';

type NotMatchedBenefit = Benefit & {
  ineligibilityReasons: string[];
};

function getSingleBenefitPhrase(
  benefitId: string,
  fallbackTitle: string | null
): string | null {
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

function getSingleBenefitNoMatchSummary(benefit: Benefit): string {
  switch (benefit.id) {
    case 'mbta-pass':
      return 'The MBTA Student Pass is generally only available through participating colleges for students who are enrolled now or will enroll within the next year.';
    case 'pell-grant':
      return 'The Pell Grant is generally only available to students who meet federal aid rules, including enrollment and citizenship or eligible non-citizen status.';
    case 'massgrant':
      return 'MASSGrant is generally only available to eligible Massachusetts residents who meet enrollment and FAFSA or MASFA requirements.';
    case 'massgrant-plus':
      return 'MASSGrant Plus is generally only available to eligible Massachusetts residents at participating schools who meet enrollment, income, and FAFSA or MASFA requirements.';
    case 'masshealth':
      return 'MassHealth is generally only available to eligible Massachusetts residents who meet citizenship and household income requirements.';
    case 'snap':
      return 'SNAP is generally only available to eligible Massachusetts residents who meet household income and other program requirements.';
    default:
      return 'This result is based on the answers you gave in the screener.';
  }
}

export default function ResultsPage() {
  const { answers, matchedBenefits, screeningBenefitFilters } = useBenefits();
  const isMobile = useIsMobile();
  const [mobileOpenDetails, setMobileOpenDetails] = useState<Record<string, boolean>>(
    {}
  );

  const hasMatches = matchedBenefits.length > 0;
  const screenedBenefits = useMemo(() => {
    const screenedBenefitIds =
      screeningBenefitFilters.length > 0
        ? screeningBenefitFilters
        : benefits.map((benefit) => benefit.id);

    return screenedBenefitIds
      .map((benefitId) => benefitCatalogById.get(benefitId))
      .filter((benefit): benefit is Benefit => Boolean(benefit));
  }, [screeningBenefitFilters]);

  const notMatchedBenefits = useMemo<NotMatchedBenefit[]>(() => {
    const matchedBenefitIds = new Set(matchedBenefits.map((benefit) => benefit.id));

    return screenedBenefits
      .filter((benefit) => !matchedBenefitIds.has(benefit.id))
      .map((benefit) => ({
        ...benefit,
        ineligibilityReasons: getBenefitIneligibilityReasons(
          benefit.id,
          answers,
          screeningBenefitFilters
        ),
      }));
  }, [answers, matchedBenefits, screenedBenefits]);

  const hasNotMatchedBenefits = notMatchedBenefits.length > 0;
  const singleScreenedBenefitId =
    screeningBenefitFilters.length === 1 ? screeningBenefitFilters[0] : null;
  const singleScreenedBenefitTitle = singleScreenedBenefitId
    ? benefits.find((benefit) => benefit.id === singleScreenedBenefitId)?.title ?? null
    : null;
  const singleScreenedBenefitPhrase = singleScreenedBenefitId
    ? getSingleBenefitPhrase(singleScreenedBenefitId, singleScreenedBenefitTitle)
    : null;
  const singleNotMatchedBenefit =
    !hasMatches && singleScreenedBenefitId && notMatchedBenefits.length === 1
      ? notMatchedBenefits[0]
      : null;
  const isSingleBenefitNoMatch = Boolean(singleNotMatchedBenefit);
  const singleNoMatchHeading = singleNotMatchedBenefit
    ? `Why ${singleNotMatchedBenefit.title} Did Not Match`
    : null;
  const singleNoMatchIntro = singleNotMatchedBenefit
    ? `${getSingleBenefitNoMatchSummary(singleNotMatchedBenefit)} ${
        singleNotMatchedBenefit.ineligibilityReasons.length === 1
          ? 'The main requirement that blocked this match is below.'
          : 'The main requirements that blocked this match are below.'
      }`
    : null;
  const singleNoMatchReasonLeadIn = singleNotMatchedBenefit
    ? singleNotMatchedBenefit.ineligibilityReasons.length === 1
      ? 'The main requirement that blocked this match is:'
      : 'These are the main requirements that blocked this match:'
    : null;
  const singleNoMatchDetailsOpen = singleNotMatchedBenefit
    ? Boolean(mobileOpenDetails[singleNotMatchedBenefit.id])
    : false;
  const singleNoMatchCardTitleId = singleNotMatchedBenefit
    ? `${singleNotMatchedBenefit.id}-single-no-match-title`
    : null;
  const singleNoMatchDetailsRegionId = singleNotMatchedBenefit
    ? `${singleNotMatchedBenefit.id}-single-no-match-details`
    : null;

  const heroDescription = useMemo(() => {
    if (singleScreenedBenefitPhrase) {
      return hasMatches
        ? `Based on your answers, you may qualify for ${singleScreenedBenefitPhrase}.`
        : `Based on your answers, we could not find a current match for ${singleScreenedBenefitPhrase}.`;
    }

    return hasMatches
      ? `Based on your answers, you may qualify for ${matchedBenefits.length} benefit${
          matchedBenefits.length === 1 ? '' : 's'
        }.`
      : 'Based on your answers, we could not find any specific benefits matching your profile at this time.';
  }, [hasMatches, matchedBenefits.length, singleScreenedBenefitPhrase]);

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

  const renderStatusText = (status: string, benefitId: string) => {
    if (status === DHE_AFFIDAVIT_ACTION_STATUS) {
      return (
        <>
          <span>Action needed: complete the </span>
          <a
            href={DHE_AFFIDAVIT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the DHE Affidavit form in a new tab"
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
          >
            <span>DHE Affidavit</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </>
      );
    }

    const displayStatus = getDisplayActionStatus(status, benefitId, answers);
    const richTextSegments = getBenefitRichTextSegments(displayStatus);
    return richTextSegments ? <InlineTooltipText segments={richTextSegments} /> : displayStatus;
  };

  const getOfficialRequirementsUrl = (benefitId: Benefit['id']) =>
    OFFICIAL_REQUIREMENTS_URLS[benefitId] ?? benefitCatalogById.get(benefitId)?.officialUrl ?? '/';

  const renderOfficialLinkButton = (benefitTitle: string, href: string, label?: string) => (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="group w-full whitespace-nowrap border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.4)] sm:w-auto sm:shrink-0 dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label ?? 'Visit official site'} for ${benefitTitle} (opens in a new tab)`}
      >
        <ExternalLink
          className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
        {label ?? 'Visit Official Site'}
      </a>
    </Button>
  );

  const renderDetailsContent = (details: string, description?: string) => (
    <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-slate-200">
      {description && (
        <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-200">
          {description}
        </p>
      )}
      {renderLinkedText(details, {
        paragraphClassName: 'text-sm leading-relaxed text-gray-700 dark:text-slate-200',
        linkClassName:
          'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
      })}
    </div>
  );

  const renderIneligibilityReasons = (
    benefitTitle: string,
    reasons: string[],
    introText?: string
  ) => (
    <div className="space-y-3">
      <p className="inline-flex rounded-full bg-red-100 px-3 py-1 text-[0.60rem] font-semibold uppercase tracking-[0.22em] text-red-800 dark:bg-[#ff0000]/22 dark:text-[#fff3f3] dark:ring-1 dark:ring-inset dark:ring-[#ff4d4d]/55">
        Why It Did Not Match
      </p>
      <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-200">
        {introText ?? `To qualify for ${benefitTitle}, you:`}
      </p>
      <ul className="space-y-2.5">
        {reasons.map((reason) => (
          <li
            key={reason}
            className="flex gap-3 text-sm leading-relaxed text-gray-700 dark:text-slate-300"
          >
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#f87171] dark:bg-rose-300"
              aria-hidden="true"
            />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const shouldShowEmptyState = !hasMatches && !hasNotMatchedBenefits;

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
            <PageHeroCard className="md:p-10 md:pb-24">
              <h1
                id="results-heading"
                className="mb-4 text-[2.6rem] font-bold tracking-tight md:text-[2.85rem]"
              >
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
                      <CheckSquare
                        className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                        aria-hidden="true"
                      />
                      Get Personalized Checklist
                    </Button>
                  </Link>
                </motion.div>
              )}
            </PageHeroCard>
          </motion.div>
        </div>

        {hasMatches ? (
          isMobile ? (
            <section aria-labelledby="results-heading" className="space-y-6">
              {matchedBenefits.map((benefit) => {
                const statuses =
                  benefit.actionStatuses ?? (benefit.actionStatus ? [benefit.actionStatus] : []);
                const isDetailsOpen = Boolean(mobileOpenDetails[benefit.id]);
                const titleId = `${benefit.id}-title`;
                const regionId = `${benefit.id}-details`;

                return (
                  <div key={benefit.id} className={MATCHED_MOBILE_CARD_CLASSNAME}>
                    <div className="px-5 pt-5">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                            {benefit.category}
                          </span>

                          <h2 id={titleId} className="text-xl font-bold">
                            {benefit.title}
                          </h2>

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
                                  {renderStatusText(status, benefit.id)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {renderOfficialLinkButton(
                          benefit.title,
                          benefit.officialUrl,
                          benefit.officialButtonLabel
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-4">
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                        {benefit.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isDetailsOpen ? 'true' : 'false'}
                      aria-controls={regionId}
                      onClick={() => toggleMobileDetails(benefit.id)}
                      className="flex w-full items-start justify-between gap-4 border-t border-gray-100 px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors dark:border-white/10 dark:text-sky-200"
                    >
                      <span>More Details</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#355b8a] transition-transform duration-200 dark:text-sky-200 ${
                          isDetailsOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isDetailsOpen && (
                      <motion.div
                        id={regionId}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={MOBILE_DETAILS_REVEAL}
                        role="region"
                        aria-labelledby={titleId}
                        className="px-5 pb-5 pt-1"
                      >
                        {renderDetailsContent(benefit.details)}
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
                  const statuses =
                    benefit.actionStatuses ?? (benefit.actionStatus ? [benefit.actionStatus] : []);

                  return (
                    <motion.div
                      key={benefit.id}
                      initial={heroEnterInitial}
                      animate={{ opacity: 1, y: 0 }}
                      transition={benefitCardTransition(index)}
                    >
                      <AccordionItem value={benefit.id} className="rounded-[1.5rem] border-none">
                        <Card className={MATCHED_DESKTOP_CARD_CLASSNAME}>
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
                                        {renderStatusText(status, benefit.id)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {renderOfficialLinkButton(
                                benefit.title,
                                benefit.officialUrl,
                                benefit.officialButtonLabel
                              )}
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
                              {renderDetailsContent(benefit.details)}
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
        ) : shouldShowEmptyState ? (
          <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/72 py-20 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-none dark:border-slate-700 dark:bg-slate-900/70 md:backdrop-blur-sm">
            <p className="mb-4 text-gray-500 dark:text-slate-400">
              We could not find any specific benefits matching your profile at this time.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Start Over</Link>
            </Button>
          </div>
        ) : null}

        {isSingleBenefitNoMatch && singleNotMatchedBenefit &&
          (isMobile ? (
            <section aria-labelledby="single-no-match-heading" className="mt-10 space-y-6">
              <div className="space-y-2 px-1">
                <h2 id="single-no-match-heading" className="text-2xl font-bold tracking-tight">
                  {singleNoMatchHeading}
                </h2>
                {singleNoMatchIntro && (
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                    {singleNoMatchIntro}
                  </p>
                )}
              </div>

              <div className={NOT_MATCHED_MOBILE_CARD_CLASSNAME}>
                <div className="px-5 pt-5">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                        {singleNotMatchedBenefit.category}
                      </span>

                      <h3 id={singleNoMatchCardTitleId ?? undefined} className="text-xl font-bold">
                        {singleNotMatchedBenefit.title}
                      </h3>
                    </div>

                    {renderOfficialLinkButton(
                      singleNotMatchedBenefit.title,
                      getOfficialRequirementsUrl(singleNotMatchedBenefit.id),
                      'View Official Requirements'
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-4">
                  {renderIneligibilityReasons(
                    singleNotMatchedBenefit.title,
                    singleNotMatchedBenefit.ineligibilityReasons,
                    singleNoMatchReasonLeadIn ?? undefined
                  )}
                </div>

                <button
                  type="button"
                  aria-expanded={singleNoMatchDetailsOpen ? 'true' : 'false'}
                  aria-controls={singleNoMatchDetailsRegionId ?? undefined}
                  onClick={() => toggleMobileDetails(singleNotMatchedBenefit.id)}
                  className="flex w-full items-start justify-between gap-4 border-t border-gray-100 px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors dark:border-white/10 dark:text-sky-200"
                >
                  <span>More Details</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#355b8a] transition-transform duration-200 dark:text-sky-200 ${
                      singleNoMatchDetailsOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {singleNoMatchDetailsOpen && (
                  <motion.div
                    id={singleNoMatchDetailsRegionId ?? undefined}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={MOBILE_DETAILS_REVEAL}
                    role="region"
                    aria-labelledby={singleNoMatchCardTitleId ?? undefined}
                    className="px-5 pb-5 pt-1"
                  >
                    {renderDetailsContent(
                      singleNotMatchedBenefit.details,
                      singleNotMatchedBenefit.description
                    )}
                  </motion.div>
                )}
              </div>
            </section>
          ) : (
            <section aria-labelledby="single-no-match-heading" className="mt-10">
              <div className="mb-6 space-y-2">
                <h2 id="single-no-match-heading" className="text-3xl font-bold tracking-tight">
                  {singleNoMatchHeading}
                </h2>
                {singleNoMatchIntro && (
                  <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-300">
                    {singleNoMatchIntro}
                  </p>
                )}
              </div>

              <Accordion type="multiple" className="space-y-6">
                <AccordionItem
                  value={`single-no-match-${singleNotMatchedBenefit.id}`}
                  className="rounded-[1.5rem] border-none"
                >
                  <Card className={NOT_MATCHED_DESKTOP_CARD_CLASSNAME}>
                    <CardHeader className="gap-3 px-5 pt-5 sm:gap-4 sm:px-6 sm:pt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 sm:mb-2 dark:bg-slate-800 dark:text-slate-300">
                            {singleNotMatchedBenefit.category}
                          </span>

                          <CardTitle className="text-xl font-bold sm:text-2xl">
                            {singleNotMatchedBenefit.title}
                          </CardTitle>
                        </div>

                        {renderOfficialLinkButton(
                          singleNotMatchedBenefit.title,
                          getOfficialRequirementsUrl(singleNotMatchedBenefit.id),
                          'View Official Requirements'
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                      {renderIneligibilityReasons(
                        singleNotMatchedBenefit.title,
                        singleNotMatchedBenefit.ineligibilityReasons,
                        singleNoMatchReasonLeadIn ?? undefined
                      )}
                    </CardContent>

                    <div className="border-t border-gray-100 bg-gray-50/60 dark:border-white/10 dark:bg-slate-950/60">
                      <AccordionTrigger className="px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors hover:no-underline sm:px-6 sm:py-4 dark:text-sky-200 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#355b8a] dark:[&>svg]:text-sky-200">
                        <span>More Details</span>
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6 sm:py-5">
                        {renderDetailsContent(
                          singleNotMatchedBenefit.details,
                          singleNotMatchedBenefit.description
                        )}
                      </AccordionContent>
                    </div>
                  </Card>
                </AccordionItem>
              </Accordion>
            </section>
          ))}

        {!isSingleBenefitNoMatch && hasNotMatchedBenefits &&
          (isMobile ? (
            <section aria-labelledby="not-matched-heading" className="mt-12 space-y-6">
              <div className="space-y-2 px-1">
                <h2 id="not-matched-heading" className="text-2xl font-bold tracking-tight">
                  Not Matched
                </h2>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                  These are the programs you chose to screen for that did not match based on your current answers. Each card explains which requirement was not met or could not be confirmed.
                </p>
              </div>

              {notMatchedBenefits.map((benefit) => {
                const isDetailsOpen = Boolean(mobileOpenDetails[benefit.id]);
                const titleId = `${benefit.id}-not-matched-title`;
                const regionId = `${benefit.id}-not-matched-details`;

                return (
                  <div key={`${benefit.id}-not-matched`} className={NOT_MATCHED_MOBILE_CARD_CLASSNAME}>
                    <div className="px-5 pt-5">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                            {benefit.category}
                          </span>

                          <h2 id={titleId} className="text-xl font-bold">
                            {benefit.title}
                          </h2>
                        </div>

                        {renderOfficialLinkButton(
                          benefit.title,
                          getOfficialRequirementsUrl(benefit.id),
                          'View Official Requirements'
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-4">
                      {renderIneligibilityReasons(benefit.title, benefit.ineligibilityReasons)}
                    </div>

                    <button
                      type="button"
                      aria-expanded={isDetailsOpen ? 'true' : 'false'}
                      aria-controls={regionId}
                      onClick={() => toggleMobileDetails(benefit.id)}
                      className="flex w-full items-start justify-between gap-4 border-t border-gray-100 px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors dark:border-white/10 dark:text-sky-200"
                    >
                      <span>More Details</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#355b8a] transition-transform duration-200 dark:text-sky-200 ${
                          isDetailsOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isDetailsOpen && (
                      <motion.div
                        id={regionId}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={MOBILE_DETAILS_REVEAL}
                        role="region"
                        aria-labelledby={titleId}
                        className="px-5 pb-5 pt-1"
                      >
                        {renderDetailsContent(benefit.details, benefit.description)}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </section>
          ) : (
            <section aria-labelledby="not-matched-heading" className="mt-14">
              <div className="mb-6 space-y-2">
                <h2 id="not-matched-heading" className="text-3xl font-bold tracking-tight">
                  Not Matched
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-300">
                  These are the programs you chose to screen for that did not match based on your current answers. Each card explains which requirement was not met or could not be confirmed.
                </p>
              </div>

              <Accordion type="multiple" className="space-y-6">
                {notMatchedBenefits.map((benefit, index) => (
                  <motion.div
                    key={`${benefit.id}-not-matched`}
                    initial={heroEnterInitial}
                    animate={{ opacity: 1, y: 0 }}
                    transition={benefitCardTransition(index)}
                  >
                    <AccordionItem
                      value={`not-matched-${benefit.id}`}
                      className="rounded-[1.5rem] border-none"
                    >
                      <Card className={NOT_MATCHED_DESKTOP_CARD_CLASSNAME}>
                        <CardHeader className="gap-3 px-5 pt-5 sm:gap-4 sm:px-6 sm:pt-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-gray-500 sm:mb-2 dark:bg-slate-800 dark:text-slate-300">
                                {benefit.category}
                              </span>

                              <CardTitle className="text-xl font-bold sm:text-2xl">
                                {benefit.title}
                              </CardTitle>
                            </div>

                            {renderOfficialLinkButton(
                              benefit.title,
                              getOfficialRequirementsUrl(benefit.id),
                              'View Official Requirements'
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                          {renderIneligibilityReasons(benefit.title, benefit.ineligibilityReasons)}
                        </CardContent>

                        <div className="border-t border-gray-100 bg-gray-50/60 dark:border-white/10 dark:bg-slate-950/60">
                          <AccordionTrigger className="px-5 py-3.5 text-left text-sm font-semibold text-[#355b8a] transition-colors hover:no-underline sm:px-6 sm:py-4 dark:text-sky-200 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#355b8a] dark:[&>svg]:text-sky-200">
                            <span>More Details</span>
                          </AccordionTrigger>
                          <AccordionContent className="border-t border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6 sm:py-5">
                            {renderDetailsContent(benefit.details, benefit.description)}
                          </AccordionContent>
                        </div>
                      </Card>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </section>
          ))}

        {!hasMatches && hasNotMatchedBenefits && (
          <motion.div
            initial={heroEnterInitial}
            animate={{ opacity: 1, y: 0 }}
            transition={heroEnterTransition(0.06)}
            className="mt-8 flex justify-center"
          >
            <Button
              asChild
              variant="outline"
              className="border-[#355b8a] bg-white/92 px-6 text-[#1e3a5f] shadow-sm transition-all duration-300 hover:border-[#1e3a5f] hover:bg-white dark:border-sky-200/55 dark:bg-slate-900/82 dark:text-sky-100 dark:hover:border-sky-200 dark:hover:bg-slate-900"
            >
              <Link to="/">Start Over</Link>
            </Button>
          </motion.div>
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
            <a
              href={FEEDBACK_SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the CommonMASS feedback survey in a new tab"
            >
              <ExternalLink
                className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
              Take Our Feedback Survey
            </a>
          </Button>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}










