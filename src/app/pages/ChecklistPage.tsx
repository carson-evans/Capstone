import React from 'react';
import { motion } from 'motion/react';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Separator } from '@/app/components/ui/separator';
import { Navbar } from '@/app/components/layout/Navbar';
import { useBenefits } from '@/app/context/BenefitsContext';
import { toast } from 'sonner';

export default function ChecklistPage() {
  // CHANGE: pull answers too, not just matchedBenefits
  const { matchedBenefits, answers } = useBenefits();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const apiUrl =
      ((import.meta as any)?.env?.VITE_PACKET_API_URL as string | undefined) || '/api/packet';

    const newTab = window.open('', '_blank');

    try {
      toast.loading('Generating PDF…', { id: 'pdf' });

      // CHANGE: send profile answers to backend for server-side matching + PDF generation
      const payload = {
        selectedBenefits: matchedBenefits.map((b) => b.id), // optional but fine to keep
        profile: answers, // <-- REQUIRED
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

      toast.success('PDF ready — opening…', { id: 'pdf' });

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
          {matchedBenefits.length > 0 ? (
            matchedBenefits.map((benefit, index) => (
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

                <div className="space-y-4 pl-0 md:pl-11 print:pl-0">
                  {benefit.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <Checkbox
                        id={`${benefit.id}-${idx}`}
                        className="mt-1 border-gray-400 data-[state=checked]:bg-[#1e3a5f] data-[state=checked]:text-white"
                      />
                      <label
                        htmlFor={`${benefit.id}-${idx}`}
                        className="text-base font-medium leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No benefits selected. Go back to screening.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-12 flex gap-4 print:hidden">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownload}
            className="flex-1 border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
          <Button
            size="lg"
            onClick={handlePrint}
            className="flex-1 bg-[#1e3a5f] text-white hover:bg-[#152a45]"
          >
            <Printer className="mr-2 h-5 w-5" />
            Print Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}