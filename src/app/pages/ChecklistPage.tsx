import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, ExternalLink, AlertTriangle, Copy, Check, ArrowUp } from 'lucide-react';

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
  mergeBenefitWithCatalog,
} from '../data/benefitsData';
import { useIsMobile } from '../components/ui/use-mobile';
import { generatePacketRequest } from '../../lib/api';
import { SiteFooter } from '../components/layout/SiteFooter';
import {
  readDesktopLayoutMode,
  writeDesktopLayoutMode,
  type DesktopLayoutMode,
} from '../lib/desktopLayoutPreference';

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
const CHECKLIST_MOBILE_HERO_FADE_MASK_STYLE = {
  WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 92%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, #000 0%, #000 92%, transparent 100%)',
} as const;

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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function ChecklistPage() {
  const { matchedBenefits, answers, checklistProgress, setChecklistItemChecked } =
    useBenefits();
  const isMobile = useIsMobile();
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  );
  const [desktopLayoutMode, setDesktopLayoutMode] = useState<DesktopLayoutMode>(
    readDesktopLayoutMode
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [copyAnnouncement, setCopyAnnouncement] = useState<string>('');
  const [hasCopiedChecklist, setHasCopiedChecklist] = useState(false);
  const [readyDownloadUrl, setReadyDownloadUrl] = useState<string | null>(null);
  const readyDownloadLinkRef = useRef<HTMLAnchorElement | null>(null);
  const copyStatusTimeoutRef = useRef<number | null>(null);

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

      if (copyStatusTimeoutRef.current) {
        window.clearTimeout(copyStatusTimeoutRef.current);
      }
    };
  }, [readyDownloadUrl]);

  useEffect(() => {
    writeDesktopLayoutMode(desktopLayoutMode);
  }, [desktopLayoutMode]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checklistItemTransition = isMobile
    ? mobileChecklistItemTransition
    : desktopChecklistItemTransition;

  const checklistItemLayout = isMobile ? ('position' as const) : true;
  const checklistListStyle = isMobile
    ? ({ overflowAnchor: 'none' } as const)
    : undefined;

  const checklistBenefits = useMemo(
    () => matchedBenefits.map((benefit) => mergeBenefitWithCatalog(benefit)),
    [matchedBenefits]
  );
  const canShowLayoutControl = viewportWidth >= 860;
  const shouldShowBackToTop = isMobile || checklistBenefits.length >= 3;
  const canUseMultiColumnLayout = canShowLayoutControl && checklistBenefits.length >= 2;
  const shouldShowLayoutControl = canUseMultiColumnLayout;
  const isDesktopDoubleLayout = canUseMultiColumnLayout && desktopLayoutMode === 'double';
  const checklistListClassName =
    isDesktopDoubleLayout
      ? 'space-y-6 min-[860px]:grid min-[860px]:grid-cols-2 min-[860px]:items-start min-[860px]:gap-8 min-[860px]:space-y-0 min-[860px]:[grid-auto-rows:1fr] xl:gap-10 print:space-y-8'
      : 'space-y-6 sm:space-y-12 print:space-y-8';

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

  const handleChecklistJump = () => {
    const checklistStart = document.getElementById('checklist-start');

    if (!checklistStart) {
      return;
    }

    checklistStart.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleBackToTopClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleCopyChecklist = async () => {
    if (checklistBenefits.length === 0) {
      return;
    }

    const checklistSections = checklistBenefits.map((benefit) => ({
      title: benefit.title,
      items: getOrderedChecklistItems(benefit.id, benefit.checklist).map(
        ({ item, checked, originalIndex }) => ({
          checked,
          text:
            benefit.id === 'massgrant-plus' &&
            item === MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM &&
            checked
              ? getMassGrantPlusSchoolNote()
              : benefit.id === 'massgrant-plus' &&
                  item === MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM
                ? item
                : benefit.id === 'massgrant-plus' &&
                    item !== MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM
                  ? benefit.checklist[originalIndex]
                  : item,
        })
      ),
    }));

    const checklistText = [
      'CommonMASS Preparation Checklist',
      '',
      ...checklistSections.flatMap((section, sectionIndex) => [
        section.title,
        ...section.items.map(({ checked, text }) => `${checked ? '☑' : '☐'} ${text}`),
        ...(sectionIndex < checklistSections.length - 1 ? [''] : []),
      ]),
    ].join('\n');

    const checklistHtml = `
      <div>
        <p><strong>${escapeHtml('CommonMASS Preparation Checklist')}</strong></p>
        ${checklistSections
          .map(
            (section) => `
              <div style="margin-top: 18px;">
                <p><strong>${escapeHtml(section.title)}</strong></p>
                <div style="margin-top: 8px;">
                  ${section.items
                    .map(
                      ({ checked, text }) => `
                        <p style="margin: 2px 0;">${checked ? '☑' : '☐'} ${escapeHtml(text)}</p>
                      `
                    )
                    .join('')}
                </div>
                <p style="margin: 12px 0 0 0;">&nbsp;</p>
              </div>
            `
          )
          .join('')}
      </div>
    `;

    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([checklistText], { type: 'text/plain' }),
            'text/html': new Blob([checklistHtml], { type: 'text/html' }),
          }),
        ]);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(checklistText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = checklistText;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setHasCopiedChecklist(true);
      setCopyAnnouncement('Checklist copied as text.');
    } catch (error) {
      console.error('Checklist copy error:', error);
      setHasCopiedChecklist(false);
      setCopyAnnouncement('Could not copy checklist text.');
    }

    if (copyStatusTimeoutRef.current) {
      window.clearTimeout(copyStatusTimeoutRef.current);
    }

    copyStatusTimeoutRef.current = window.setTimeout(() => {
      setHasCopiedChecklist(false);
      setCopyAnnouncement('');
      copyStatusTimeoutRef.current = null;
    }, 2400);
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
        className={`container mx-auto px-6 py-6 sm:py-12 print:max-w-none print:py-0 ${
          isDesktopDoubleLayout ? 'max-w-[86rem]' : 'max-w-3xl'
        }`}
      >
        <div className="relative mx-auto mb-6 max-w-[45rem] sm:mb-12 print:mb-8">
          <PageHeroCard
            className="p-6 pb-8 sm:p-8 sm:pb-20 print:border-none print:bg-transparent print:p-0 print:pb-0 print:shadow-none"
            maskStyle={isMobile ? CHECKLIST_MOBILE_HERO_FADE_MASK_STYLE : undefined}
          >
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
                Use the{' '}
                <button
                  type="button"
                  onClick={handleChecklistJump}
                  className="font-semibold text-[#1e3a5f] underline underline-offset-4 transition-colors hover:text-[#16304f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 sm:font-inherit sm:text-inherit sm:no-underline dark:text-sky-200 dark:hover:text-sky-100 dark:focus-visible:ring-sky-200/25 sm:dark:text-slate-300"
                >
                  checklist below
                </button>{' '}
                to keep track of the next steps for your matched benefits. You can check
                off anything you have already finished, and your downloaded PDF or copied
                text will show those items as completed.
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                      className="inline-flex min-h-11 items-center rounded-full bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16304f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/25 dark:bg-sky-300 dark:text-slate-950 dark:hover:bg-sky-200"
                    >
                      {isMobile ? 'Open PDF' : 'Open PDF in a new tab'}
                    </a>
                  </div>
                  {isMobile ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      On mobile, use your browser's Share button to export the PDF to
                      Files, Notes, Mail, Messages, or another app.
                    </p>
                  ) : null}
                </div>
              )}

              {checklistBenefits.length > 0 && (
                <div className="mt-6 print:hidden">
                  <div className="mx-auto max-w-[32rem]">
                    <div className="flex items-start justify-center gap-3 sm:gap-4">
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
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={handleCopyChecklist}
                        className="min-w-[8.5rem] cursor-pointer justify-center gap-1.5 border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={hasCopiedChecklist ? 'check' : 'copy'}
                            initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.7, rotate: 12 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex"
                            aria-hidden="true"
                          >
                            {hasCopiedChecklist ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Copy className="h-5 w-5" />
                            )}
                          </motion.span>
                        </AnimatePresence>
                        {hasCopiedChecklist ? 'Copied' : 'Copy'}
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-start gap-4 sm:gap-5">
                      <div className="text-center sm:pr-2 sm:text-right">
                        <p className="inline-flex items-start gap-1.5 text-sm font-semibold text-[#1e3a5f] dark:text-sky-200">
                          <AlertTriangle
                            className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                            aria-hidden="true"
                          />
                          <span>
                            PDF link expires 5 minutes after you click Download. Please save it to
                            your device.
                          </span>
                        </p>
                      </div>

                      <div
                        className="h-full min-h-[4.5rem] bg-[#1e3a5f]/10 dark:bg-sky-200/12"
                        aria-hidden="true"
                      />

                      <div className="text-center sm:pl-2 sm:text-left">
                        <p className="text-sm font-semibold text-[#1e3a5f] dark:text-sky-200">
                          Copies your matched benefits and checklist steps so you can paste it
                          wherever you'd like.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p role="status" aria-live="polite" className="sr-only">
                    {copyAnnouncement}
                  </p>
                </div>
              )}
          </PageHeroCard>
        </div>

        {shouldShowLayoutControl ? (
          <div className="mb-6 flex justify-center print:hidden">
            <div className="inline-flex min-w-[15.5rem] items-center justify-center gap-3 rounded-full border border-[#1e3a5f]/12 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.95)_45%,rgba(255,247,237,0.96)_100%)] px-4 py-2 text-[#1e3a5f] shadow-[0_16px_34px_-22px_rgba(15,23,42,0.22)] backdrop-blur-sm dark:border-sky-200/12 dark:bg-[linear-gradient(90deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.88)_50%,rgba(30,41,59,0.9)_100%)] dark:text-sky-100 dark:shadow-[0_18px_40px_-24px_rgba(2,6,23,0.88)]">
              <span className="text-sm font-semibold text-[#1e3a5f] dark:text-sky-100">
                Change Layout
              </span>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDesktopLayoutMode('single')}
                  aria-pressed={desktopLayoutMode === 'single'}
                  aria-label="Use one-column layout"
                  className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/20 dark:focus-visible:ring-sky-200/25 ${
                    desktopLayoutMode === 'single'
                      ? 'text-[#1e3a5f] dark:text-sky-100'
                      : 'text-[#355b8a]/55 hover:text-[#1e3a5f] dark:text-sky-100/45 dark:hover:text-sky-100'
                  }`}
                >
                  <span
                    className="flex h-[16px] w-[18px] items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="box-border h-[14px] w-[12px] rounded-[4px] border-[1.5px] border-current" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopLayoutMode('double')}
                  aria-pressed={desktopLayoutMode === 'double'}
                  aria-label="Use two-column layout"
                  className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/20 dark:focus-visible:ring-sky-200/25 ${
                    desktopLayoutMode === 'double'
                      ? 'text-[#1e3a5f] dark:text-sky-100'
                      : 'text-[#355b8a]/55 hover:text-[#1e3a5f] dark:text-sky-100/45 dark:hover:text-sky-100'
                  }`}
                >
                  <span
                    className="flex h-[16px] w-[18px] items-center justify-between"
                    aria-hidden="true"
                  >
                    <span className="box-border h-[14px] w-[7px] rounded-[4px] border-[1.5px] border-current" />
                    <span className="box-border h-[14px] w-[7px] rounded-[4px] border-[1.5px] border-current" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {checklistBenefits.length > 0 ? (
          <div id="checklist-start" className={checklistListClassName}>
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
                  className={`rounded-[1.75rem] border border-white/75 bg-white/72 p-5 sm:p-8 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.18)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_18px_38px_-24px_rgba(2,6,23,0.68)] md:shadow-[0_20px_55px_-38px_rgba(15,23,42,0.28)] md:dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.95)] print:border-none print:bg-white print:p-0 print:shadow-none ${
                    isDesktopDoubleLayout
                      ? 'min-[860px]:flex min-[860px]:h-full min-[860px]:self-start min-[860px]:flex-col'
                      : ''
                  }`}
                >
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white print:hidden">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <h2 className="whitespace-nowrap text-[1.85rem] font-bold text-slate-900 dark:text-slate-100">
                          {benefit.title}
                        </h2>
                        {positiveCompletionStatuses.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {positiveCompletionStatuses.map((status) => (
                              <div
                                key={`${benefit.id}-${status}`}
                                className="inline-flex whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-[0.7rem] font-semibold text-green-800 dark:bg-emerald-400/18 dark:text-emerald-200 dark:ring-1 dark:ring-inset dark:ring-emerald-300/30 sm:text-xs"
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
                      className="group w-full whitespace-nowrap border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.4)] md:w-auto md:shrink-0 md:self-start print:hidden dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
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
                    className={`space-y-3 pl-0 print:pl-0 ${
                      isDesktopDoubleLayout
                        ? 'min-[860px]:flex-1 min-[860px]:pl-0'
                        : 'md:pl-11'
                    }`}
                    style={checklistListStyle}
                  >
                    {getOrderedChecklistItems(benefit.id, benefit.checklist).map(
                      ({ item, originalIndex, checked }) => (
                        <motion.label
                          key={originalIndex}
                          htmlFor={`${benefit.id}-${originalIndex}`}
                          layout={checklistItemLayout}
                          transition={checklistItemTransition}
                          style={isMobile ? { willChange: 'transform' } : undefined}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-200 md:transition-all md:duration-300 print:border-none print:bg-white print:px-0 print:py-1 print:shadow-none ${
                            checked
                              ? 'border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/70'
                              : 'border-transparent bg-gray-100/55 hover:-translate-y-0.5 hover:border-gray-200 hover:bg-gray-100/80 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70'
                          } cursor-pointer`}
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
                            className="border-gray-400 bg-white data-[state=checked]:bg-[#1e3a5f] data-[state=checked]:text-white dark:border-slate-500 dark:bg-slate-950 dark:data-[state=checked]:border-[#355b8a] dark:data-[state=checked]:bg-[#1e3a5f] dark:data-[state=checked]:text-white dark:data-[state=checked]:shadow-[0_0_18px_rgba(53,91,138,0.22)]"
                          />

                          <div
                            className={`flex-1 text-base font-medium leading-relaxed transition-colors ${
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

                            {benefit.id === 'massgrant-plus' &&
                            item === MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM &&
                            checked ? (
                              <p className="mt-1 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                                {getMassGrantPlusSchoolNote()}
                              </p>
                            ) : null}
                          </div>
                        </motion.label>
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

      {shouldShowBackToTop ? (
        <div className="bg-white px-6 pb-10 pt-2 text-center dark:bg-slate-950 print:hidden">
          <button
            type="button"
            onClick={handleBackToTopClick}
            className="group inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1e3a5f] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/20 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-sky-200 dark:focus-visible:ring-sky-200/25 dark:focus-visible:ring-offset-slate-950"
          >
            <ArrowUp
              className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-1"
              aria-hidden="true"
            />
            Back to top
          </button>
        </div>
      ) : null}

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

