import React from 'react';
import { motion } from 'motion/react';
import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Navbar } from '@/app/components/layout/Navbar';
import { useBenefits } from '@/app/context/BenefitsContext';
import { toast } from 'sonner';

export default function ChecklistPage() {
  const { matchedBenefits, answers, checklistProgress, setChecklistItemChecked } = useBenefits();
  const actionableBenefits = matchedBenefits.filter(
    (benefit) => !benefit.actionStatus?.includes('No action needed')
  );
  const checklistItemTransition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.45 };
  const getOrderedChecklistItems = (benefitId: string, items: string[]) =>
    items
      .map((item, originalIndex) => ({
        item,
        originalIndex,
        checked: checklistProgress[benefitId]?.[originalIndex] ?? false,
      }))
      .sort((a, b) => Number(a.checked) - Number(b.checked) || a.originalIndex - b.originalIndex);

  const handleDownload = async () => {
    const apiUrl =
      ((import.meta as any)?.env?.VITE_PACKET_API_URL as string | undefined) || '/api/packet';

    const newTab = window.open('', '_blank');

    try {
      toast.loading('Generating PDF...', { id: 'pdf' });

      const payload = {
        selectedBenefits: actionableBenefits.map((b) => b.id),
        profile: answers,
        checklistProgress: Object.fromEntries(
          actionableBenefits.map((benefit) => [
            benefit.id,
            benefit.checklist.map((_, idx) => checklistProgress[benefit.id]?.[idx] ?? false),
          ])
        ),
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Packet generator failed (${res.status}). ${text}`);
      }

      const data = await res.json();
      const parsed = typeof data.body === 'string' ? JSON.parse(data.body) : data;

      const url = parsed.download_url || parsed.url || parsed.presigned_url || parsed.location;

      if (!url) throw new Error('No presigned URL returned from API');

      toast.success('PDF ready - opening...', { id: 'pdf' });

      if (newTab) {
        newTab.location.href = url;
        newTab.focus();
      } else {
        window.location.href = url;
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate PDF', { id: 'pdf' });
      if (newTab) newTab.close();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container max-w-3xl mx-auto px-6 py-12 print:py-0 print:max-w-none">
        {/* Header */}
        <div className="mb-12 print:mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-gray-500 hover:text-black hover:bg-transparent px-0 mb-4 print:hidden"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Your Personalized Application Checklist
          </h1>
          <p className="text-gray-600 print:text-black">
            Complete these steps to apply for your identified benefits.
          </p>
        </div>

        {/* Checklist Groups */}
        <div className="space-y-12 print:space-y-8">
          {actionableBenefits.length > 0 ? (
            actionableBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-xl border border-gray-100 print:border-none print:p-0 print:bg-white"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white text-sm font-bold print:hidden">
                    {index + 1}
                  </div>
                  <h2 className="text-2xl font-bold">{benefit.title}</h2>
                </div>

                <div className="space-y-3 pl-0 md:pl-11 print:pl-0">
                  {getOrderedChecklistItems(benefit.id, benefit.checklist).map(
                    ({ item, originalIndex, checked }) => (
                      <motion.div
                        key={originalIndex}
                        layout
                        transition={checklistItemTransition}
                        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 print:border-none print:bg-white print:px-0 print:py-1 print:shadow-none ${
                          checked
                            ? 'border-slate-200 bg-slate-100/80 opacity-70'
                            : 'border-white/90 bg-white shadow-[0_14px_36px_-28px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:border-[#355b8a]/20 hover:shadow-[0_20px_38px_-28px_rgba(30,58,95,0.45)]'
                        }`}
                      >
                        <Checkbox
                          id={`${benefit.id}-${originalIndex}`}
                          checked={checked}
                          onCheckedChange={(nextChecked) =>
                            setChecklistItemChecked(benefit.id, originalIndex, nextChecked === true)
                          }
                          className="mt-0.5 border-gray-400 bg-white data-[state=checked]:bg-[#1e3a5f] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor={`${benefit.id}-${originalIndex}`}
                          className={`flex-1 cursor-pointer text-base font-medium leading-relaxed transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            checked ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          {item}
                        </label>
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">
                {matchedBenefits.length > 0
                  ? 'You do not have any checklist steps left for your current matches.'
                  : 'No benefits selected. Go back to screening.'}
              </p>
            </div>
          )}
        </div>
        {actionableBenefits.length > 0 && (
          <div className="mt-12 flex justify-center print:hidden">
            <Button
              size="lg"
              onClick={handleDownload}
              className="bg-[#1e3a5f] text-white hover:bg-[#152a45]"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
