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

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is the Federal Pell Grant?',
    answer:
      'The Federal Pell Grant is federal gift aid for undergraduate students with financial need. It usually does not need to be repaid, and award amounts depend on factors such as your financial need, cost of attendance, and whether you attend full time or part time.',
    keywords: ['pell', 'federal grant', 'gift aid', 'tuition', 'full-time', 'part-time', 'sai'],
  },
  {
    id: '2',
    question: 'What is MASSGrant and how do I qualify?',
    answer:
      'MASSGrant is Massachusetts need-based aid for eligible undergraduate students. In general, you must be a Massachusetts resident, file the FAFSA or MASFA each year by the applicable deadline, attend an eligible school, enroll full time in an eligible program, show financial need, and meet satisfactory academic progress requirements.',
    keywords: ['massgrant', 'state grant', 'resident', 'full-time', 'osfa', 'massachusetts aid'],
  },
  {
    id: '3',
    question: 'What is MASSGrant Plus?',
    answer:
      'MASSGrant Plus is Massachusetts aid designed to reduce tuition and fee costs for eligible students at public four-year colleges and universities. Eligibility depends on factors such as Massachusetts residency, financial need, school type, enrollment, and academic progress.',
    keywords: ['massgrant plus', 'public college', 'umass', 'state university', 'tuition and fees'],
  },
  {
    id: '4',
    question: 'How do I apply for MassHealth?',
    answer:
      'Most applicants can apply for or manage coverage online through the Massachusetts Health Connector, and MassHealth can also help by phone. Be ready to provide information about your household, Massachusetts residency, income, and any other health coverage.',
    keywords: ['masshealth', 'medicaid', 'health insurance', 'health connector', 'apply'],
  },
  {
    id: '5',
    question: 'What MBTA discounts are available for students?',
    answer:
      'The MBTA offers institution-based pass programs, including semester and university programs, but availability depends on whether your school participates. Check your campus transportation, commuter, or student affairs office to see which discounted pass options are available to you.',
    keywords: ['mbta', 't pass', 'semester pass', 'charliecard', 'transportation', 'commuter'],
  },
  {
    id: '6',
    question: 'How do I apply for federal student aid?',
    answer:
      'Complete the FAFSA through StudentAid.gov. The FAFSA is the starting point for federal aid and is also used by many states and schools to determine eligibility for grants, loans, and work-study.',
    keywords: ['fafsa', 'student aid', 'financial aid', 'apply', 'studentaid'],
  },
  {
    id: '7',
    question: 'What types of federal student loans are available?',
    answer:
      'Main federal loan types include Direct Subsidized Loans, Direct Unsubsidized Loans, Direct PLUS Loans, and Direct Consolidation Loans. Subsidized loans are based on financial need, while unsubsidized loans are not.',
    keywords: ['loans', 'subsidized', 'unsubsidized', 'plus', 'consolidation', 'borrow'],
  },
  {
    id: '8',
    question: 'What is Federal Work-Study?',
    answer:
      'Federal Work-Study can help students with financial need earn money through part-time jobs. You usually indicate interest on the FAFSA, then check with your school to see whether it participates and how work-study jobs are assigned.',
    keywords: ['work-study', 'job', 'campus job', 'part-time work', 'earn money'],
  },
  {
    id: '9',
    question: 'Can college students in Massachusetts qualify for SNAP?',
    answer:
      'Yes, some college students can qualify for SNAP. Eligibility depends on household circumstances, income, and program rules, and students enrolled at least half time may need to meet an additional student exemption. You can apply through DTA Connect, and DTA will tell you if more information is needed.',
    keywords: ['snap', 'food stamps', 'dta', 'dta connect', 'ebt', 'student exemption', 'half-time'],
  },
  {
    id: '10',
    question: 'What is the difference between grants and scholarships?',
    answer:
      'Both are types of aid that usually do not need to be repaid. Grants are often based on financial need, while scholarships are often based on academics, talent, athletics, service, identity, or other criteria.',
    keywords: ['grant', 'scholarship', 'gift aid', 'merit aid', 'need-based'],
  },
  {
    id: '11',
    question: 'Who is eligible for federal student aid?',
    answer:
      'Federal student aid eligibility depends on factors such as citizenship or eligible noncitizen status, enrollment in an eligible program, satisfactory academic progress, and other federal requirements. Completing the FAFSA is the main way to be considered.',
    keywords: ['eligible', 'citizenship', 'noncitizen', 'sap', 'federal aid'],
  },
  {
    id: '12',
    question: 'When are FAFSA deadlines?',
    answer:
      'The federal FAFSA deadline is later than many school and state priority deadlines, so it is best to file as early as you can. Check both your school financial aid deadlines and current Massachusetts aid deadlines so you do not miss grant consideration.',
    keywords: ['deadline', 'priority deadline', 'late', 'when', 'state deadline', 'school deadline'],
  },
  {
    id: '13',
    question: 'Are there other Massachusetts-specific benefits for students?',
    answer:
      'Yes. Massachusetts has additional grants, tuition waivers, and state aid programs beyond MASSGrant, and many schools also offer institution-specific support. Your financial aid office can help you identify programs that fit your residency, enrollment level, and family circumstances.',
    keywords: ['massachusetts benefits', 'state aid', 'tuition waiver', 'additional aid', 'local programs'],
  },
  {
    id: '14',
    question: 'Do I need to submit the FAFSA every year?',
    answer:
      'Yes. Federal Student Aid says you complete the FAFSA once per academic year, and Massachusetts state programs such as MASSGrant also require students to apply again each year to be considered.',
    keywords: ['renew fafsa', 'each year', 'reapply', 'annual application', 'yearly'],
  },
  {
    id: '15',
    question: 'Can I correct my FAFSA after I submit it?',
    answer:
      'Usually yes. After your FAFSA is processed, you can make certain corrections online, such as fixing typos, updating contact information, or adding schools. Some financial changes must be handled through your school financial aid office instead.',
    keywords: ['edit fafsa', 'change fafsa', 'correction', 'add school', 'fix mistake'],
  },
  {
    id: '16',
    question: 'What if I cannot complete the FAFSA because of my immigration or citizenship status?',
    answer:
      'Massachusetts offers the MASFA for students who are ineligible or unable to complete the FAFSA but may still qualify for in-state tuition rates and state financial aid. Students should complete only one application, FAFSA or MASFA, depending on eligibility.',
    keywords: ['masfa', 'immigration', 'citizenship', 'noncitizen', 'undocumented', 'state financial aid'],
  },
  {
    id: '17',
    question: 'Do parents or other contributors need their own FAFSA accounts?',
    answer:
      'Yes. Federal Student Aid says each contributor on the FAFSA needs their own StudentAid.gov account to access and complete their section. Students should not share accounts with parents or spouses.',
    keywords: ['contributors', 'parents', 'fsa id', 'studentaid account', 'separate account', 'invite'],
  },
  {
    id: '18',
    question: 'Do I need to renew MassHealth or report changes after I enroll?',
    answer:
      'Yes. MassHealth reviews coverage regularly, and members must report changes such as address, phone number, email, or income as soon as possible and no later than 10 days after the change. If you receive a renewal notice, respond by the deadline to avoid losing coverage.',
    keywords: ['renew masshealth', 'report changes', 'income change', 'address change', 'coverage renewal'],
  },
  {
    id: '19',
    question: 'Can I manage my SNAP case online after I apply?',
    answer:
      'Yes. DTA Connect lets many Massachusetts residents check case status, upload documents, read notices, update contact information, request an EBT card, and complete required check-ins online.',
    keywords: ['manage snap', 'dta connect', 'upload documents', 'case status', 'ebt card', 'notices'],
  },
  {
    id: '20',
    question: 'Can I get Massachusetts state aid if I attend college outside Massachusetts?',
    answer:
      'Sometimes. Massachusetts says some state aid programs, including MASSGrant, may transfer to approved schools in states that have reciprocity agreements with Massachusetts. Check with OSFA and your school financial aid office before assuming you qualify.',
    keywords: ['out-of-state', 'reciprocity', 'vermont', 'pennsylvania', 'district of columbia', 'transfer aid'],
  },
  {
    id: '21',
    question: 'What if my financial situation changes after I file the FAFSA?',
    answer:
      'If your family finances change significantly after filing, contact your school financial aid office. Federal Student Aid explains that some changes are not handled directly through the FAFSA correction flow and may need to be reviewed by the school.',
    keywords: ['special circumstances', 'income change', 'job loss', 'appeal', 'professional judgment'],
  },
  {
    id: '22',
    question: 'Can part-time students still get aid?',
    answer:
      'Yes, but eligibility depends on the program. Some aid, such as Pell, can depend on enrollment status, while some Massachusetts programs have full-time requirements and others may not. Review your aid offer and ask your financial aid office which programs match your enrollment level.',
    keywords: ['part-time', 'half-time', 'less than full-time', 'enrollment status', 'reduced course load'],
  },
];

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
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <section className="bg-gray-50 border-b border-gray-200 py-16 px-4">
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
            className="text-lg text-gray-600 max-w-2xl mx-auto"
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
            className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search FAQ"
                className="h-12 rounded-xl border-gray-200 bg-white pl-11 text-base shadow-none"
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
                      className="border border-gray-200 rounded-lg px-6 bg-white hover:shadow-sm transition-shadow"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-medium text-black pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 leading-relaxed pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                <h2 className="text-xl font-semibold text-black">No matching questions found</h2>
                <p className="mt-2 text-gray-600">
                  Try a broader keyword like FAFSA, SNAP, MassHealth, MBTA, loans, or deadlines.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-3">Need More Help?</h2>
            <p className="text-gray-600 text-lg">
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

      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>Copyright 2026 CommonMASS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}



