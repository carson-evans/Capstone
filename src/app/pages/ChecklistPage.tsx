import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { benefits, type Benefit } from "../data/benefitsData";

type MatchedBenefit = {
  id: string;
  actionStatus?: string;
};

type LocationStateShape = {
  profile?: Record<string, unknown>;
  selectedBenefits?: string[];
  matchedBenefits?: MatchedBenefit[];
};

type ChecklistState = Record<string, Record<string, boolean>>;

const CHECKLIST_STORAGE_KEY = "commonmass_checklist_state";
const PROFILE_STORAGE_KEY = "commonmass_profile";
const MATCHES_STORAGE_KEY = "commonmass_matched_benefits";

export default function ChecklistPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationStateShape;

  const profile =
    state.profile ||
    (() => {
      try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })();

  const matchedBenefits: MatchedBenefit[] =
    state.matchedBenefits ||
    (() => {
      try {
        const raw = localStorage.getItem(MATCHES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

  const matchedBenefitIds = useMemo(() => {
    if (Array.isArray(state.selectedBenefits) && state.selectedBenefits.length > 0) {
      return state.selectedBenefits;
    }

    if (Array.isArray(matchedBenefits) && matchedBenefits.length > 0) {
      return matchedBenefits.map((b) => b.id);
    }

    return [];
  }, [state.selectedBenefits, matchedBenefits]);

  const visibleBenefits: Benefit[] = useMemo(() => {
    const idSet = new Set(matchedBenefitIds);
    return benefits.filter((benefit) => idSet.has(benefit.id));
  }, [matchedBenefitIds]);

  const [checklistState, setChecklistState] = useState<ChecklistState>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};

      const nextState: ChecklistState = {};

      for (const benefit of visibleBenefits) {
        const existing = saved?.[benefit.id] || {};
        nextState[benefit.id] = {};

        for (const step of benefit.checklist) {
          nextState[benefit.id][step] = Boolean(existing[step]);
        }
      }

      setChecklistState(nextState);
    } catch {
      const nextState: ChecklistState = {};

      for (const benefit of visibleBenefits) {
        nextState[benefit.id] = {};
        for (const step of benefit.checklist) {
          nextState[benefit.id][step] = false;
        }
      }

      setChecklistState(nextState);
    }
  }, [visibleBenefits]);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState));
  }, [checklistState]);

  const toggleStep = (benefitId: string, step: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [benefitId]: {
        ...(prev[benefitId] || {}),
        [step]: !prev?.[benefitId]?.[step],
      },
    }));
  };

  const openPdfPacket = async () => {
    try {
      setIsGenerating(true);

      const payload = {
        profile,
        selectedBenefits: matchedBenefitIds,
        checklistState,
      };

      const response = await fetch("/api/packet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Packet generation failed:", data);
        alert(data?.error || "Failed to generate PDF packet.");
        return;
      }

      if (data?.download_url) {
        window.open(data.download_url, "_blank", "noopener,noreferrer");
      } else {
        alert("PDF generated, but no download URL was returned.");
      }
    } catch (error) {
      console.error("Packet generation error:", error);
      alert("Something went wrong while generating the PDF packet.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!visibleBenefits.length) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold text-slate-900">No checklist available</h1>
          <p className="mt-3 text-slate-600">
            We could not find any matched benefits to build a checklist from.
          </p>
          <button
            onClick={() => navigate("/results")}
            className="mt-6 rounded-md bg-slate-800 px-4 py-2 text-white"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/results" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to Results
        </Link>

        <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900">
          Your Personalized Application Checklist
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Complete these steps to apply for your identified benefits.
        </p>

        <div className="mt-8">
          <button
            onClick={openPdfPacket}
            disabled={isGenerating}
            className="rounded-md bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isGenerating ? "Generating PDF..." : "Open PDF Packet"}
          </button>
        </div>

        <div className="mt-10 space-y-10">
          {visibleBenefits.map((benefit, index) => (
            <section
              key={benefit.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{benefit.title}</h2>
              </div>

              <div className="mt-6 space-y-3">
                {benefit.checklist.map((step) => {
                  const checked = Boolean(checklistState?.[benefit.id]?.[step]);

                  return (
                    <label
                      key={step}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStep(benefit.id, step)}
                        className="h-5 w-5"
                      />
                      <span className={checked ? "line-through opacity-60" : ""}>{step}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}