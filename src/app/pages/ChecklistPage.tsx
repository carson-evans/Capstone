import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Download, ExternalLink } from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { PageBackdrop } from '../components/layout/PageBackdrop';
import { PageHeroCard } from '../components/layout/PageHeroCard';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { InlineTooltipText } from '../components/ui/inline-tooltip-text';
import { useBenefits } from '../context/BenefitsContext';
import {
  getBenefitRichTextSegments,
  getDisplayActionStatus,
  isBenefitApplicationCompleted,
  isPositiveActionStatus,
  MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM,
} from '../data/benefitsData';
import { useIsMobile } from '../components/ui/use-mobile';
import { generatePacketRequest } from '../../lib/api';
import { SiteFooter } from '../components/layout/SiteFooter';

const desktopChecklistItemTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
  mass: 0.45,
};

const mobileChecklistItemTransition = {
  type: 'tween' as const,
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';

function openGeneratedPdf(
  url: string,
  {
    isMobile,
    pendingWindow,
  }: {
    isMobile: boolean;
    pendingWindow: Window | null;
  }
) {
  if (isMobile) {
    window.location.assign(url);
    return;
  }

  if (pendingWindow && !pendingWindow.closed) {
    try {
      pendingWindow.location.replace(url);
      pendingWindow.focus();
      return;
    } catch (error) {
      console.warn('Unable to reuse pending PDF window:', error);
    }
  }

  const fallbackWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!fallbackWindow) {
    // Popup blocker fallback: leave the direct link on the page and redirect as a last resort.
    window.location.assign(url);
  }
}

function createPdfObjectUrl(pdfBase64: string) {
  const binaryString = window.atob(pdfBase64);
  const pdfBytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    pdfBytes[index] = binaryString.charCodeAt(index);
  }

  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  return window.URL.createObjectURL(pdfBlob);
}

export default function ChecklistPage() {
  const { matchedBenefits, answers, checklistProgress, setChecklistItemChecked } =
    useBenefits();
  const isMobile = useIsMobile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [readyDownloadUrl, setReadyDownloadUrl] = useState<string | null>(null);
  const readyDownloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (readyDownloadUrl && !isMobile) {
      readyDownloadLinkRef.current?.focus();
    }
  }, [readyDownloadUrl, isMobile]);

  useEffect(() => {
    return () => {
      if (readyDownloadUrl?.startsWith('blob:')) {
        window.URL.revokeObjectURL(readyDownloadUrl);
      }
    };
  }, [readyDownloadUrl]);

  const checklistItemTransition = isMobile
    ? mobileChecklistItemTransition
    : desktopChecklistItemTransition;

  const checklistItemLayout = isMobile ? ('position' as const) : true;
  const checklistListStyle = isMobile
    ? ({ overflowAnchor: 'none' } as const)
    : undefined;

  const checklistBenefits = matchedBenefits;

  const totalChecklistItems = checklistBenefits.reduce(
    (count, benefit) => count + benefit.checklist.length,
    0
  );

  const completedChecklistItems = checklistBenefits.reduce(
    (count, benefit) =>
      count + (checklistProgress[benefit.id]?.filter((checked) => checked).length ?? 0),
    0
  );

  const getOrderedChecklistItems = (benefitId: string, items: string[]) =>
    items
      .map((item, originalIndex) => ({
        item,
        originalIndex,
        checked: checklistProgress[benefitId]?.[originalIndex] ?? false,
      }))
      .sort(
        (a, b) => Number(a.checked) - Number(b.checked) || a.originalIndex - b.originalIndex
      );

  const getMassGrantPlusSchoolNote = () => {
    const selectedSchoolName = answers['school_name']?.trim();

    return selectedSchoolName
      ? `You selected ${selectedSchoolName}, which is a participating MASSGrant Plus school.`
      : 'You selected a participating MASSGrant Plus school.';
  };

  const renderChecklistItemText = (
    item: string,
    options?: { massGrantPlusSchoolNote?: string }
  ) => {
    const richTextSegments = getBenefitRichTextSegments(item, options);
    return richTextSegments ? <InlineTooltipText segments={richTextSegments} /> : item;
  };

  const renderPositiveStatusText = (status: string, benefitId: string) => {
    const displayStatus = getDisplayActionStatus(status, benefitId, answers);
    const richTextSegments = getBenefitRichTextSegments(displayStatus);
    return richTextSegments ? <InlineTooltipText segments={richTextSegments} /> : displayStatus;
  };

  const getPositiveCompletionStatuses = (benefit: (typeof checklistBenefits)[number]) => {
    const statuses =
      benefit.actionStatuses ?? (benefit.actionStatus ? [benefit.actionStatus] : []);

    if (!isBenefitApplicationCompleted(benefit.id, answers)) {
      return [];
    }

    return statuses.filter((status) => isPositiveActionStatus(status));
  };

  const getOfficialButtonLabel = (benefitId: string, fallbackLabel?: string) => {
    if (
      answers['fafsa_completed'] === 'not_enrolled_next_year' &&
      (benefitId === 'pell-grant' ||
        benefitId === 'massgrant' ||
        benefitId === 'massgrant-plus')
    ) {
      return 'View Official Site';
    }

    return fallbackLabel ?? 'Visit Official Site';
  };

  const handleDownload = async () => {
    if (checklistBenefits.length === 0 || isGenerating) {
      return;
    }

    let pendingWindow: Window | null = null;
    let objectUrlToRevokeOnError: string | null = null;

    if (!isMobile) {
      pendingWindow = window.open('', '_blank');

      if (pendingWindow) {
        try {
          pendingWindow.opener = null;
          pendingWindow.document.title = 'Preparing your PDF packet...';
          pendingWindow.document.body.innerHTML = `
            <main style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
              <h1 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Preparing your PDF packet...</h1>
              <p>You can return to CommonMASS while the packet finishes loading.</p>
            </main>
          `;
        } catch (error) {
          console.warn('Unable to write placeholder content to pending PDF window:', error);
        }
      }
    }

    setGenerationError(null);
    setReadyDownloadUrl(null);
    setGenerationStatus('Preparing your PDF packet...');
    setIsGenerating(true);

    try {
      const packetResult = await generatePacketRequest({
        profile: answers,
        selectedBenefits: checklistBenefits.map((benefit) => benefit.id),
        checklistProgress,
        matchedBenefits: [],
      });

      let resolvedUrl: string | null = null;

      if (packetResult.url) {
        resolvedUrl = packetResult.url;
      } else if (packetResult.pdfBase64) {
        objectUrlToRevokeOnError = createPdfObjectUrl(packetResult.pdfBase64);
        resolvedUrl = objectUrlToRevokeOnError;
      }

      if (!resolvedUrl) {
        throw new Error('No PDF data returned from API.');
      }

      setReadyDownloadUrl(resolvedUrl);
      setGenerationStatus(
        isMobile
          ? 'Opening your PDF packet...'
          : 'Your PDF packet is ready. If it did not open automatically, use the direct link below.'
      );

      openGeneratedPdf(resolvedUrl, {
        isMobile,
        pendingWindow,
      });
    } catch (error) {
      if (pendingWindow && !pendingWindow.closed) {
        pendingWindow.close();
      }

      if (objectUrlToRevokeOnError) {
        window.URL.revokeObjectURL(objectUrlToRevokeOnError);
      }

      console.error('Packet generation error:', error);
      setGenerationStatus('');
      setReadyDownloadUrl(null);
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while generating the PDF packet.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-black print:bg-white dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <div className="print:hidden">
        <Navbar />
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="container mx-auto max-w-3xl px-6 py-12 print:max-w-none print:py-0"
      >
        <div className="relative mb-12 print:mb-8">
          <PageHeroCard className="print:border-none print:bg-transparent print:p-0 print:pb-0 print:shadow-none">
              <Button
                asChild
                variant="ghost"
                className="mb-4 px-0 text-gray-500 hover:bg-transparent hover:text-black print:hidden dark:text-slate-400 dark:hover:text-slate-100"
              >
                <Link to="/results">Back to Results</Link>
              </Button>

              <h1 className="mb-2 text-[2.15rem] font-bold leading-[1.02] tracking-[-0.035em] md:text-[2.85rem] md:tracking-tight">
                Your Personalized Application Checklist
              </h1>

              <p className="max-w-2xl text-gray-600 print:text-black dark:text-slate-300">
                Use this checklist to keep track of the next steps for your matched
                benefits. You can check off anything you have already finished, and your
                downloaded PDF will show those items as completed.
              </p>

              {checklistBenefits.length > 0 && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  {completedChecklistItems} of {totalChecklistItems} checklist items
                  completed.
                </p>
              )}

              {generationStatus && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  {generationStatus}
                </p>
              )}

              {generationError && (
                <p
                  role="alert"
                  className="mt-4 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  {generationError}
                </p>
              )}

              {readyDownloadUrl && (
                <div className="mt-4 rounded-2xl border border-[#1e3a5f]/15 bg-white/90 p-4 shadow-sm dark:border-sky-200/20 dark:bg-slate-900/85">
                  <p
                    id="pdf-direct-link-help"
                    className="text-sm text-slate-700 dark:text-slate-300"
                  >
                    If your PDF did not open automatically, use this direct link.
                  </p>

                  <a
                    ref={readyDownloadLinkRef}
                    href={readyDownloadUrl}
                    target={isMobile ? '_self' : '_blank'}
                    rel={isMobile ? undefined : 'noopener noreferrer'}
                    className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16304f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/25 dark:bg-sky-300 dark:text-slate-950 dark:hover:bg-sky-200"
                  >
                    {isMobile ? 'Open PDF packet' : 'Open PDF packet in a new tab'}
                  </a>
                </div>
              )}

              {checklistBenefits.length > 0 && (
                <div className="mt-6 flex flex-col items-center gap-2 text-center print:hidden">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleDownload}
                    disabled={isGenerating}
                    aria-busy={isGenerating}
                    className="cursor-pointer bg-[#1e3a5f] text-white hover:bg-[#152a45] dark:bg-sky-300 dark:text-slate-950 dark:hover:bg-sky-200 dark:shadow-[0_18px_36px_-24px_rgba(125,211,252,0.55)]"
                  >
                    <Download className="h-5 w-5" aria-hidden="true" />
                    {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                  <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    PDF link expires 5 minutes after you click Download. Please save it to your device.
                  </p>
                </div>
              )}
          </PageHeroCard>
        </div>

        {checklistBenefits.length > 0 ? (
          <div className="space-y-12 print:space-y-8">
            {checklistBenefits.map((benefit, index) => {
              const completedSteps =
                checklistProgress[benefit.id]?.filter((checked) => checked).length ?? 0;
              const positiveCompletionStatuses = getPositiveCompletionStatuses(benefit);

              return (
                <motion.section
                  key={benefit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="rounded-[1.75rem] border border-white/75 bg-white/72 p-8 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.18)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_18px_38px_-24px_rgba(2,6,23,0.68)] md:shadow-[0_20px_55px_-38px_rgba(15,23,42,0.28)] md:dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.95)] print:border-none print:bg-white print:p-0 print:shadow-none"
                >
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white print:hidden">
                        {index + 1}
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {benefit.title}
                        </h2>
                        {positiveCompletionStatuses.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {positiveCompletionStatuses.map((status) => (
                              <div
                                key={`${benefit.id}-${status}`}
                                className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-emerald-400/18 dark:text-emerald-200 dark:ring-1 dark:ring-inset dark:ring-emerald-300/30"
                              >
                                {renderPositiveStatusText(status, benefit.id)}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {completedSteps} of {benefit.checklist.length} steps completed
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="group w-full border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.4)] md:w-auto print:hidden dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                    >
                      <a
                        href={benefit.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${
                          benefit.officialButtonLabel ?? 'Visit official site'
                        } for ${benefit.title} (opens in a new tab)`}
                      >
                        <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        {getOfficialButtonLabel(benefit.id, benefit.officialButtonLabel)}
                      </a>
                    </Button>
                  </div>

                  <div
                    className="space-y-3 pl-0 md:pl-11 print:pl-0"
                    style={checklistListStyle}
                  >
                    {getOrderedChecklistItems(benefit.id, benefit.checklist).map(
                      ({ item, originalIndex, checked }) => (
                        <motion.div
                          key={originalIndex}
                          layout={checklistItemLayout}
                          transition={checklistItemTransition}
                          style={isMobile ? { willChange: 'transform' } : undefined}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors duration-200 md:transition-all md:duration-300 print:border-none print:bg-white print:px-0 print:py-1 print:shadow-none ${
                            checked
                              ? 'border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/70'
                              : 'border-white/90 bg-white shadow-[0_14px_36px_-28px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:border-[#355b8a]/20 hover:shadow-[0_20px_38px_-28px_rgba(30,58,95,0.45)] dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-[0_20px_44px_-30px_rgba(2,6,23,0.95)] dark:hover:border-slate-700 dark:hover:shadow-[0_24px_50px_-30px_rgba(2,6,23,1)]'
                          }`}
                        >
                          <Checkbox
                            id={`${benefit.id}-${originalIndex}`}
                            checked={checked}
                            onCheckedChange={(nextChecked) =>
                              setChecklistItemChecked(
                                benefit.id,
                                originalIndex,
                                nextChecked === true
                              )
                            }
                            className="mt-0.5 border-gray-400 bg-white data-[state=checked]:bg-[#1e3a5f] data-[state=checked]:text-white dark:border-slate-500 dark:bg-slate-950 dark:data-[state=checked]:border-[#355b8a] dark:data-[state=checked]:bg-[#1e3a5f] dark:data-[state=checked]:text-white dark:data-[state=checked]:shadow-[0_0_18px_rgba(53,91,138,0.22)]"
                          />

                          <label
                            htmlFor={`${benefit.id}-${originalIndex}`}
                            className="flex-1 cursor-pointer transition-colors"
                          >
                            <div
                              className={`text-base font-medium leading-relaxed transition-colors ${
                                checked
                                  ? 'text-slate-600 line-through decoration-2 decoration-slate-500 dark:text-slate-300 dark:decoration-slate-400'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {renderChecklistItemText(
                                item,
                                benefit.id === 'massgrant-plus' &&
                                  item === MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM &&
                                  checked
                                  ? { massGrantPlusSchoolNote: getMassGrantPlusSchoolNote() }
                                  : undefined
                              )}
                            </div>
                            {benefit.id === 'massgrant-plus' &&
                            item === MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM &&
                            checked ? (
                              <p className="mt-1 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                                {getMassGrantPlusSchoolNote()}
                              </p>
                            ) : null}
                          </label>
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.section>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/72 py-20 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="mb-4 text-gray-500 dark:text-slate-300">
              Complete the screener first to generate a personalized checklist.
            </p>

            <Button asChild variant="outline">
              <Link to="/screener">Go to Screener</Link>
            </Button>
          </div>
        )}

        <div className="mt-10 flex justify-center print:hidden">
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
              <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Take Our Feedback Survey
            </a>
          </Button>
        </div>
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

