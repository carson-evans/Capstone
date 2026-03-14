import { useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Download } from "lucide-react";

import { Navbar } from "@/app/components/layout/Navbar";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useBenefits } from "@/app/context/BenefitsContext";

const checklistItemTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.45,
};

export default function ChecklistPage() {
  const { matchedBenefits, answers, checklistProgress, setChecklistItemChecked } = useBenefits();
  const [isGenerating, setIsGenerating] = useState(false);

  const actionableBenefits = useMemo(
    () =>
      matchedBenefits.filter((benefit) => !benefit.actionStatus?.includes("No action needed")),
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
    if (actionableBenefits.length === 0) {
      return;
    }

    const apiUrl = import.meta.env.VITE_PACKET_API_URL || "/api/packet";
    const pendingTab = window.open("", "_blank", "noopener,noreferrer");

    if (pendingTab) {
      pendingTab.document.title = "Preparing packet";
      pendingTab.document.body.innerHTML =
        "<p style='font-family: sans-serif; padding: 24px;'>Preparing your PDF packet...</p>";
    }

    setIsGenerating(true);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: answers,
          selectedBenefits: actionableBenefits.map((benefit) => benefit.id),
          checklistProgress,
        }),
      });

      const raw = await response.json();
      const data = typeof raw?.body === "string" ? JSON.parse(raw.body) : raw;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate PDF packet.");
      }

      const url = data?.download_url || data?.url || data?.presigned_url || data?.location;

      if (!url) {
        throw new Error("No download URL returned from API.");
      }

      if (pendingTab) {
        pendingTab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (pendingTab) {
        pendingTab.close();
      }

      console.error("Packet generation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the PDF packet."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container mx-auto max-w-3xl px-6 py-12 print:max-w-none print:py-0">
        <div className="mb-12 print:mb-8">
          <Button
            asChild
            variant="ghost"
            className="mb-4 px-0 text-gray-500 hover:bg-transparent hover:text-black print:hidden"
          >
            <Link to="/results">Back to Results</Link>
          </Button>

          <h1 className="mb-2 text-[2.5rem] font-bold tracking-tight md:text-[2.85rem]">
            Your Personalized Application Checklist
          </h1>

          <p className="max-w-2xl text-gray-600 print:text-black">
            Complete these steps to apply for your identified benefits. You can check off any
            steps you have already finished, and your downloaded PDF will show those items
            as completed.
          </p>

          {actionableBenefits.length > 0 && (
            <p className="mt-4 text-sm font-medium text-slate-600">
              {completedChecklistItems} of {totalChecklistItems} checklist items completed.
            </p>
          )}

          {actionableBenefits.length > 0 && (
            <div className="mt-6 flex justify-center print:hidden">
              <Button
                size="lg"
                onClick={handleDownload}
                disabled={isGenerating}
                className="cursor-pointer bg-[#1e3a5f] text-white hover:bg-[#152a45]"
              >
                <Download className="h-5 w-5" />
                {isGenerating ? "Generating PDF..." : "Download PDF"}
              </Button>
            </div>
          )}
        </div>

        {actionableBenefits.length > 0 ? (
          <>
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
                    className="rounded-xl border border-gray-100 bg-gray-50 p-8 print:border-none print:bg-white print:p-0"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white print:hidden">
                        {index + 1}
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{benefit.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {completedSteps} of {benefit.checklist.length} steps completed
                        </p>
                      </div>
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
                                ? "border-slate-200 bg-slate-100/80 opacity-70"
                                : "border-white/90 bg-white shadow-[0_14px_36px_-28px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:border-[#355b8a]/20 hover:shadow-[0_20px_38px_-28px_rgba(30,58,95,0.45)]"
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
                              className={`flex-1 cursor-pointer text-base font-medium leading-relaxed transition-colors ${
                                checked ? "text-slate-400 line-through" : "text-slate-900"
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
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
            <p className="mb-4 text-gray-500">
              {matchedBenefits.length > 0
                ? "Your current matches do not need any checklist steps right now."
                : "Complete the screener first to generate a personalized checklist."}
            </p>

            <Button asChild variant="outline">
              <Link to={matchedBenefits.length > 0 ? "/results" : "/screener"}>
                {matchedBenefits.length > 0 ? "Back to Results" : "Go to Screener"}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}






