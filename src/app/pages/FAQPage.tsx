import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Bot, HelpCircle, Search } from 'lucide-react';
import { Navbar } from '@/app/components/layout/Navbar';
import { PageBackdrop } from '@/app/components/layout/PageBackdrop';
import { Chatbot } from '@/app/components/Chatbot';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Input } from '@/app/components/ui/input';
import { renderLinkedText } from '@/app/components/ui/render-linked-text';
import { faqData } from '@/app/data/faqData';

const FAQ_CATEGORY_FILTERS = [
  {
    id: 'all',
    label: 'All',
    benefitIds: [],
  },
  {
    id: 'snap',
    label: 'SNAP',
    benefitIds: ['snap'],
  },
  {
    id: 'pell-grant',
    label: 'Pell Grant',
    benefitIds: ['pell-grant'],
  },
  {
    id: 'massgrant-family',
    label: 'MASSGrant / MASSGrant Plus',
    benefitIds: ['massgrant', 'massgrant-plus'],
  },
  {
    id: 'masshealth',
    label: 'MassHealth',
    benefitIds: ['masshealth'],
  },
  {
    id: 'mbta-pass',
    label: 'MBTA Student Pass',
    benefitIds: ['mbta-pass'],
  },
] as const;

type FAQCategoryFilterId = (typeof FAQ_CATEGORY_FILTERS)[number]['id'];

export default function FAQPage() {
  const [query, setQuery] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<FAQCategoryFilterId>('all');
  const chatbotSectionRef = useRef<HTMLElement | null>(null);

  const activeFilter = FAQ_CATEGORY_FILTERS.find((filter) => filter.id === activeFilterId) ?? FAQ_CATEGORY_FILTERS[0];

  const filteredFaqs = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return faqData.filter((faq) => {
      const matchesFilter =
        !activeFilter.benefitIds.length ||
        activeFilter.benefitIds.some((benefitId) => faq.relatedBenefitIds?.includes(benefitId));

      const searchableText = [faq.question, faq.answer, ...faq.keywords].join(' ').toLowerCase();
      const matchesQuery = !tokens.length || tokens.every((token) => searchableText.includes(token));

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const scrollToChatbot = () => {
    chatbotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <section className="border-b border-white/50 bg-white/62 px-4 py-16 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/38">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-[#1e3a5f] rounded-full flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Frequently Asked Questions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto dark:text-slate-300"
          >
            Find answers to common questions about student benefits, financial aid, and assistance programs.
          </motion.p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 rounded-2xl border border-white/70 bg-white/74 p-4 shadow-[0_30px_70px_-56px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/72 md:p-5"
          >
            <div className="mb-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                Browse by benefit
              </p>

              <div className="flex flex-wrap gap-3">
                {FAQ_CATEGORY_FILTERS.map((filter) => {
                  const isActive = activeFilterId === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilterId(filter.id)}
                      aria-pressed={isActive}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-200/40 dark:focus-visible:ring-offset-slate-900 ${
                        isActive
                          ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-sm dark:border-sky-200 dark:bg-sky-200 dark:text-slate-950'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#1e3a5f] hover:text-[#1e3a5f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-200 dark:hover:text-sky-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search FAQ"
                  className="h-12 rounded-xl border-gray-200 bg-white pl-11 text-base shadow-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={scrollToChatbot}
                className="group inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#1e3a5f]/12 bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#1e3a5f] transition-all hover:-translate-y-0.5 hover:border-[#1e3a5f]/25 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35 focus-visible:ring-offset-2 dark:border-sky-200/20 dark:bg-slate-950 dark:text-sky-200 dark:hover:border-sky-200/35 dark:hover:bg-slate-900 dark:focus-visible:ring-sky-200/35 dark:focus-visible:ring-offset-slate-900"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {filteredFaqs.length ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.06 * index }}
                  >
                    <AccordionItem
                      value={faq.id}
                      className="rounded-lg border border-white/75 bg-white/88 px-6 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:hover:shadow-[0_18px_36px_-26px_rgba(2,6,23,0.95)]"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-medium text-black pr-4 dark:text-slate-100">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-5">
                        <div className="space-y-3 text-gray-700 leading-relaxed dark:text-slate-300">
                          {renderLinkedText(faq.answer, {
                            paragraphClassName: 'text-gray-700 leading-relaxed dark:text-slate-300',
                            linkClassName:
                              'font-medium text-[#1e3a5f] underline underline-offset-4 hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200',
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white/74 px-6 py-10 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
                <h2 className="text-xl font-semibold text-black dark:text-slate-100">No matching questions found</h2>
                <p className="mt-2 text-gray-600 dark:text-slate-300">
                  Try another benefit category or a broader keyword like FAFSA, SNAP, MassHealth, MBTA, loans, or deadlines.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section
        ref={chatbotSectionRef}
        className="border-t border-white/50 bg-white/45 px-4 py-16 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/38"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-3">Need More Help?</h2>
            <p className="text-gray-600 text-lg dark:text-slate-300">
              Chat with our AI assistant for personalized answers to your questions.
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

      <footer className="border-t border-white/50 bg-white/78 py-12 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/92">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm dark:text-slate-400">
          <p>Copyright 2026 CommonMASS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}










