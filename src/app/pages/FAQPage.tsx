import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Search } from 'lucide-react';
import { Navbar } from '@/app/components/layout/Navbar';
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

export default function FAQPage() {
  const [query, setQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!tokens.length) {
      return faqData;
    }

    return faqData.filter((faq) => {
      const searchableText = [faq.question, faq.answer, ...faq.keywords].join(' ').toLowerCase();
      return tokens.every((token) => searchableText.includes(token));
    });
  }, [query]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <section className="bg-gray-50 border-b border-gray-200 py-16 px-4 dark:border-white/10 dark:bg-slate-900/60">
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
            className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-slate-900/80 md:p-5"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search FAQ"
                className="h-12 rounded-xl border-gray-200 bg-white pl-11 text-base shadow-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
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
                      className="border border-gray-200 rounded-lg px-6 bg-white hover:shadow-sm transition-shadow dark:border-white/10 dark:bg-slate-900/80 dark:hover:shadow-[0_18px_36px_-26px_rgba(2,6,23,0.95)]"
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
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/80">
                <h2 className="text-xl font-semibold text-black dark:text-slate-100">No matching questions found</h2>
                <p className="mt-2 text-gray-600 dark:text-slate-300">
                  Try a broader keyword like FAFSA, SNAP, MassHealth, MBTA, loans, or deadlines.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200 dark:border-white/10 dark:bg-slate-900/55">
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

      <footer className="bg-white py-12 border-t border-gray-200 dark:border-white/10 dark:bg-slate-950">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm dark:text-slate-400">
          <p>Copyright 2026 CommonMASS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
