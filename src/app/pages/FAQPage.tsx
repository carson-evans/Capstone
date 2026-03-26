import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router";
import { ArrowDown, Bot, CircleHelp, Info, Search } from "lucide-react";
import { Navbar } from "@/app/components/layout/Navbar";
import { PageBackdrop } from "@/app/components/layout/PageBackdrop";
import { Chatbot } from "@/app/components/Chatbot";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/components/ui/hover-card";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { renderLinkedText } from "@/app/components/ui/render-linked-text";
import { useIsMobile } from "@/app/components/ui/use-mobile";
import { faqData } from "@/app/data/faqData";
import { SiteFooter } from "@/app/components/layout/SiteFooter";


type FAQCategoryFilter = {
  id: string;
  label: string;
  benefitIds: readonly string[];
  helpTitle?: string;
  helpDescription?: string;
};

const FAQ_CATEGORY_FILTERS = [
  {
    id: "all",
    label: "All",
    benefitIds: [],
  },
  {
    id: "snap",
    label: "SNAP",
    benefitIds: ["snap"],
    helpTitle: "SNAP",
    helpDescription:
      "Questions here cover student eligibility rules, exemptions, applying through DTA Connect, required documents, decision timelines, and benefit amounts.",
  },
  {
    id: "pell-grant",
    label: "Pell Grant",
    benefitIds: ["pell-grant"],
    helpTitle: "Pell Grant",
    helpDescription:
      "Questions here cover FAFSA, federal aid eligibility, award amounts, deadlines, yearly renewal, FAFSA corrections, and related financial aid steps.",
  },
  {
    id: "massgrant-family",
    label: "MASSGrant / MASSGrant Plus",
    benefitIds: ["massgrant", "massgrant-plus"],
    helpTitle: "MASSGrant / MASSGrant Plus",
    helpDescription:
      "Questions here cover Massachusetts residency, school type, enrollment requirements, FAFSA or MASFA, award amounts, deadlines, and other state aid details.",
  },
  {
    id: "masshealth",
    label: "MassHealth",
    benefitIds: ["masshealth"],
    helpTitle: "MassHealth",
    helpDescription:
      "Questions here cover how to apply, what documents you may need, reporting changes, and how coverage can continue if your situation changes.",
  },
  {
    id: "mbta-pass",
    label: "MBTA Student Pass",
    benefitIds: ["mbta-pass"],
    helpTitle: "MBTA Student Pass",
    helpDescription:
      "Questions here cover available student discounts, whether your school participates, and when a pass can be used during the semester or school term.",
  },
] as const satisfies readonly FAQCategoryFilter[];

type FAQCategoryFilterItem = (typeof FAQ_CATEGORY_FILTERS)[number];
type FAQCategoryFilterId = FAQCategoryFilterItem["id"];

function BenefitFilterHelp({
  filter,
  isActive,
  isMobile,
}: {
  filter: FAQCategoryFilterItem;
  isActive: boolean;
  isMobile: boolean;
}) {
  if (!filter.helpTitle || !filter.helpDescription) {
    return null;
  }

  const content = (
    <div>
      <p className="text-sm font-semibold text-[#1e3a5f] dark:text-sky-200">
        {filter.helpTitle}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
        {filter.helpDescription}
      </p>
    </div>
  );

  const trigger = (
    <button
      type="button"
      aria-label={`Learn what ${filter.label} questions are covered here`}
      className={`flex items-center border-l px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40 focus-visible:ring-inset dark:focus-visible:ring-sky-200/40 ${
        isActive
          ? "border-white/20 text-white/80 hover:text-white dark:border-sky-400/50 dark:text-slate-950/70 dark:hover:text-slate-950"
          : "border-gray-200 text-gray-500 hover:text-[#1e3a5f] dark:border-slate-700 dark:text-slate-400 dark:hover:text-sky-200"
      }`}
    >
      <Info className="h-4 w-4" />
    </button>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={10}
          className="w-[18rem] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900/95"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={100} closeDelay={80}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="bottom"
        sideOffset={10}
        className="w-[18rem] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-900/95"
      >
        {content}
      </HoverCardContent>
    </HoverCard>
  );
}

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [activeFilterId, setActiveFilterId] =
    useState<FAQCategoryFilterId>("all");
  const chatbotSectionRef = useRef<HTMLElement | null>(null);
  const browseByBenefitRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  const requestedFilterId = useMemo<FAQCategoryFilterId | null>(() => {
    const benefitParam = new URLSearchParams(location.search).get("benefit");
    if (!benefitParam) {
      return null;
    }

    const matchedFilter = FAQ_CATEGORY_FILTERS.find(
      (filter) => filter.id === benefitParam,
    );
    return matchedFilter?.id ?? null;
  }, [location.search]);

  const activeFilter =
    FAQ_CATEGORY_FILTERS.find((filter) => filter.id === activeFilterId) ??
    FAQ_CATEGORY_FILTERS[0];

  const filteredFaqs = useMemo(() => {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return faqData.filter((faq) => {
      const matchesFilter =
        !activeFilter.benefitIds.length ||
        activeFilter.benefitIds.some((benefitId) =>
          faq.relatedBenefitIds?.includes(benefitId),
        );

      const searchableText = [faq.question, faq.answer, ...faq.keywords]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        !tokens.length ||
        tokens.every((token) => searchableText.includes(token));

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  useEffect(() => {
    const existingScript = document.getElementById("faq-schema");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";

    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqData.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    setActiveFilterId(requestedFilterId ?? "all");
    setQuery("");
  }, [requestedFilterId]);

  useEffect(() => {
    const scrollToRequestedEntryPoint = () => {
      if (requestedFilterId && isMobile && browseByBenefitRef.current) {
        browseByBenefitRef.current.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "auto",
        });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const timeoutIds: number[] = [];
    let nestedFrameId = 0;
    const frameId = window.requestAnimationFrame(() => {
      scrollToRequestedEntryPoint();
      nestedFrameId = window.requestAnimationFrame(() => {
        scrollToRequestedEntryPoint();
        timeoutIds.push(window.setTimeout(scrollToRequestedEntryPoint, 120));
        timeoutIds.push(window.setTimeout(scrollToRequestedEntryPoint, 260));
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (nestedFrameId) {
        window.cancelAnimationFrame(nestedFrameId);
      }
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [isMobile, location.pathname, location.search, requestedFilterId]);

  const scrollToChatbot = () => {
    chatbotSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden border-b border-white/50 bg-white/42 px-4 pb-20 pt-16 backdrop-blur-none dark:border-white/10 dark:bg-slate-900/30 md:pb-24 md:backdrop-blur-sm">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,_rgba(191,219,254,0.42),_transparent_24%),radial-gradient(circle_at_82%_30%,_rgba(254,215,170,0.3),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.58)_0%,_rgba(248,250,252,0.22)_42%,_rgba(255,255,255,0.1)_100%)] dark:bg-[radial-gradient(circle_at_18%_22%,_rgba(125,211,252,0.08),_transparent_26%),radial-gradient(circle_at_82%_30%,_rgba(251,146,60,0.08),_transparent_22%),linear-gradient(180deg,_rgba(15,23,42,0.46)_0%,_rgba(15,23,42,0.22)_42%,_rgba(15,23,42,0.08)_100%)]"
          />

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-14 text-center md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 flex justify-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] shadow-[0_18px_36px_-20px_rgba(30,58,95,0.5)]">
                  <CircleHelp className="h-8 w-8 text-white" />
                </div>
              </motion.div>

              <motion.h1 id="faq-heading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-4 text-4xl font-bold md:text-5xl"
              >
                Frequently Asked Questions
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-300"
              >
                Designed to make CommonMASS easier to understand, this page
                answers common questions about student benefits in
                Massachusetts, including Pell Grant, MASSGrant, MASSGrant Plus,
                SNAP, MassHealth, and MBTA student discounts.
              </motion.p>
            </div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.16 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              ref={browseByBenefitRef}
              className="mb-8 rounded-2xl border border-white/70 bg-white/74 p-4 shadow-[0_30px_70px_-56px_rgba(15,23,42,0.4)] backdrop-blur-none dark:border-white/10 dark:bg-slate-900/72 md:p-5 md:backdrop-blur-sm"
            >
              <div className="mb-4">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                  Browse by benefit
                </p>

                <div className="flex flex-wrap gap-3" role="group" aria-label="Browse FAQ categories by benefit">
                  {FAQ_CATEGORY_FILTERS.map((filter) => {
                    const isActive = activeFilterId === filter.id;
                    const groupClassName = `group inline-flex items-center overflow-hidden rounded-full border transition-all ${
                      isActive
                        ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-sm dark:border-sky-200 dark:bg-sky-200 dark:text-slate-950"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#1e3a5f] hover:text-[#1e3a5f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-200 dark:hover:text-sky-200"
                    }`;
                    const filterButtonClassName = `px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40 focus-visible:ring-inset dark:focus-visible:ring-sky-200/40 ${
                      filter.helpDescription ? "pr-2" : ""
                    }`;

                    return (
                      <div key={filter.id} className={groupClassName}>
                        <button
                          type="button"
                          onClick={() => setActiveFilterId(filter.id)}
                          aria-pressed={isActive}
                          className={filterButtonClassName}
                        >
                          {filter.label}
                        </button>
                        <BenefitFilterHelp
                          filter={filter}
                          isActive={isActive}
                          isMobile={isMobile}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <p id="faq-search-status" role="status" aria-live="polite" className="sr-only">
                {filteredFaqs.length} matching frequently asked questions shown.
              </p>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <Input
                    id="faq-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search FAQ"
                    aria-describedby="faq-search-status"
                    className="h-12 rounded-xl border-gray-200 bg-white pl-11 text-base shadow-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={scrollToChatbot}
                  className="group inline-flex self-start items-center justify-center gap-2 rounded-full border border-[#1e3a5f]/12 bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#1e3a5f] transition-all hover:-translate-y-0.5 hover:border-[#1e3a5f]/25 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35 focus-visible:ring-offset-2 dark:border-sky-200/20 dark:bg-slate-950 dark:text-sky-200 dark:hover:border-sky-200/35 dark:hover:bg-slate-900 dark:focus-visible:ring-sky-200/35 dark:focus-visible:ring-offset-slate-900"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-white dark:bg-sky-200 dark:text-slate-950">
                    <Bot className="h-4 w-4" />
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    Need More Help
                    <ArrowDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                  </span>
                </button>
              </div>
            </motion.div>

            <div>
              {filteredFaqs.length ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 18 }
                      }
                      whileInView={
                        shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                      }
                      viewport={{ once: true, amount: 0.08 }}
                      transition={{
                        duration: 0.42,
                        delay: shouldReduceMotion
                          ? 0
                          : Math.min(index * 0.03, 0.18),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <AccordionItem
                        value={faq.id}
                        className="rounded-lg border border-white/75 bg-white/88 px-6 backdrop-blur-none transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:hover:shadow-[0_18px_36px_-26px_rgba(2,6,23,0.95)] md:backdrop-blur-sm"
                      >
                        <AccordionTrigger className="py-5 text-left hover:no-underline">
                          <span className="pr-4 font-medium text-black dark:text-slate-100">
                            {faq.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5">
                          <div className="space-y-3 text-gray-700 leading-relaxed dark:text-slate-300">
                            {renderLinkedText(faq.answer, {
                              paragraphClassName:
                                "text-gray-700 leading-relaxed dark:text-slate-300",
                              linkClassName:
                                "font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200",
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              ) : (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={
                    shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                  }
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-dashed border-gray-300 bg-white/74 px-6 py-10 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-none dark:border-slate-700 dark:bg-slate-900/80 md:backdrop-blur-sm"
                >
                  <h2 className="text-xl font-semibold text-black dark:text-slate-100">
                    No matching questions found
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-slate-300">
                    Try another benefit category or a broader keyword like
                    FAFSA, SNAP, MassHealth, MBTA, loans, or deadlines.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        <section
          ref={chatbotSectionRef}
          className="border-t border-white/50 bg-white/45 px-4 py-16 backdrop-blur-none dark:border-white/10 dark:bg-slate-900/38 md:backdrop-blur-sm"
        >
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8 text-center"
            >
              <h2 className="mb-3 text-3xl font-bold">Need More Help?</h2>
              <p className="text-lg text-gray-600 dark:text-slate-300">
                Chat with our AI assistant for personalized answers to your
                questions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Chatbot />
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
