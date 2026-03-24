import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Download, ExternalLink } from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { PageBackdrop } from '../components/layout/PageBackdrop';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useBenefits } from '../context/BenefitsContext';
import { useIsMobile } from '../components/ui/use-mobile';

const desktopChecklistItemTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.45,
};

const mobileChecklistItemTransition = {
  type: 'tween',
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function ChecklistPage() {
  const { matchedBenefits, answers, checklistProgress, setChecklistItemChecked } = useBenefits();
  const isMobile = useIsMobile();
  const [isGenerating, setIsGenerating] = useState(false);

  const checklistItemTransition = (
    isMobile ? mobileChecklistItemTransition : desktopChecklistItemTransition
  ) as any;

  const checklistItemLayout = isMobile ? ('position' as const) : true;
  const checklistListStyle = isMobile ? ({ overflowAnchor: 'none' } as const) : undefined;

  const actionableBenefits = useMemo(
    () =>
      matchedBenefits.filter(
        (benefit) => !benefit.actionStatus?.includes('No action needed')
      ),
    [matchedBenefits]
  );

  const totalChecklistItems = actionableBenefits.reduce(
    (count, benefit) => count + benefit.checklist.length,
    0
  );

  const completedChecklistItems = actionableBenefits.reduce(
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
      .sort((a, b) => Number(a.checked) - Number(b.checked) || a.originalIndex - b.originalIndex);

  const handleDownload = async () => {
    if (actionableBenefits.length === 0) return;

    const apiUrl = import.meta.env.VITE_PACKET_API_URL || '/api/packet';

    const pendingTab = window.open('about:blank', '_blank');

    if (pendingTab) {
      pendingTab.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Preparing packet</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">Preparing your PDF packet...</h2>
            <p style="margin: 0; color: #444;">
              Your personalized CommonMASS packet is being generated.
            </p>
          </body>
        </html>
      `);
      pendingTab.document.close();
    }

    setIsGenerating(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: answers,
          selectedBenefits: actionableBenefits.map((benefit) => benefit.id),
          checklistProgress,
        }),
      });

      const rawText = await response.text();

      let raw: any = {};
      try {
        raw = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error('Packet API returned a non-JSON response.');
      }

      let data = raw;
      if (typeof raw?.body === 'string') {
        try {
          data = JSON.parse(raw.body);
        } catch {
          data = raw;
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate PDF packet.');
      }

      const url = data?.download_url || data?.url || data?.presigned_url || data?.location;

      if (!url || typeof url !== 'string') {
        throw new Error('No download URL returned from API.');
      }

      if (pendingTab && !pendingTab.closed) {
        pendingTab.location.replace(url);
        pendingTab.focus();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Packet generation error:', error);

      if (pendingTab && !pendingTab.closed) {
        pendingTab.document.write(`
          <!doctype html>
          <html>
            <head>
              <title>Packet generation failed</title>
            </head>
            <body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
              <h2 style="margin: 0 0 12px; color: #b91c1c;">Failed to generate packet</h2>
              <p style="margin: 0; color: #444;">
                Please return to the checklist and try again.
              </p>
            </body>
          </html>
        `);
        pendingTab.document.close();

        setTimeout(() => {
          if (!pendingTab.closed) {
            pendingTab.close();
          }
        }, 1800);
      }

      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong while generating the PDF packet.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] text-black font-sans print:bg-white dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container mx-auto max-w-3xl px-6 py-12 print:max-w-none print:py-0">
        <div className="relative mb-12 print:mb-8">
          <div
            className="relative overflow-hidden rounded-t-[2rem] border-x border-t border-white/70 bg-white/72 p-8 pb-20 shadow-[0_34px_80px_-60px_rgba(15,23,42,0.42)] backdrop-blur-sm print:border-none print:bg-transparent print:p-0 print:pb-0 print:shadow-none dark:border-white/10 dark:bg-slate-900/58"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%)',
            }}
          >
            <div className="relative z-10">
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
                Use this checklist to keep track of the next steps for your matched benefits. You can
                check off anything you have already finished, and your downloaded PDF will show those
                items as completed.
              </p>

              {actionableBenefits.length > 0 && (
                <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {completedChecklistItems} of {totalChecklistItems} checklist items completed.
                </p>
              )}

              {actionableBenefits.length > 0 && (
                <div className="mt-6 flex justify-center print:hidden">
                  <Button
                    size="lg"
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="cursor-pointer bg-[#1e3a5f] text-white hover:bg-[#152a45] dark:bg-sky-300 dark:text-slate-950 dark:hover:bg-sky-200 dark:shadow-[0_18px_36px_-24px_rgba(125,211,252,0.55)]"
                  >
                    <Download className="h-5 w-5" />
                    {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {actionableBenefits.length > 0 ? (
          <div className="space-y-12 print:space-y-8">
            {actionableBenefits.map((benefit, index) => {
              const completedSteps =
                checklistProgress[benefit.id]?.filter((checked) => checked).length ?? 0;

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
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {completedSteps} of {benefit.checklist.length} steps completed
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="group w-full border-[#355b8a] bg-white text-[#355b8a] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.4)] md:w-auto print:hidden dark:border-sky-200 dark:bg-transparent dark:text-sky-200 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:hover:shadow-[0_0_24px_rgba(249,115,22,0.28)]"
                    >
                      <a href={benefit.officialUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        {benefit.officialButtonLabel ?? 'Visit Official Site'}
                      </a>
                    </Button>
                  </div>

                  <div className="space-y-3 pl-0 md:pl-11 print:pl-0" style={checklistListStyle}>
                    {getOrderedChecklistItems(benefit.id, benefit.checklist).map(
                      ({ item, originalIndex, checked }) => (
                        <motion.div
                          key={originalIndex}
                          layout={checklistItemLayout}
                          transition={checklistItemTransition}
                          style={isMobile ? { willChange: 'transform' } : undefined}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors duration-200 md:transition-all md:duration-300 print:border-none print:bg-white print:px-0 print:py-1 print:shadow-none ${
                            checked
                              ? 'border-slate-200 bg-slate-100/80 opacity-70 dark:border-slate-800 dark:bg-slate-800/70'
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
                            className={`flex-1 cursor-pointer text-base font-medium leading-relaxed transition-colors ${
                              checked
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {item}
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
            <p className="mb-4 text-gray-500 dark:text-slate-400">
              {matchedBenefits.length > 0
                ? 'Your current matches do not need any checklist steps right now.'
                : 'Complete the screener first to generate a personalized checklist.'}
            </p>

            <Button asChild variant="outline">
              <Link to={matchedBenefits.length > 0 ? '/results' : '/screener'}>
                {matchedBenefits.length > 0 ? 'Back to Results' : 'Go to Screener'}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}