import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';
import { Navbar } from '@/app/components/layout/Navbar';
import { Chatbot } from '@/app/components/Chatbot';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';

const faqData = [
  {
    id: '1',
    question: 'What is the Federal Pell Grant?',
    answer: 'The Federal Pell Grant is a need-based grant for undergraduate students who have not earned a bachelor\'s, graduate, or professional degree. Unlike loans, Pell Grants do not need to be repaid except under certain circumstances. The maximum Pell Grant award for 2025-2026 is $7,395. The amount you receive depends on your financial need, cost of attendance, enrollment status (full-time or part-time), and plans to attend school for a full academic year.'
  },
  {
    id: '2',
    question: 'What is MASSGrant and how do I qualify?',
    answer: 'MASSGrant is a state-funded grant program for Massachusetts residents with financial need who are attending college in Massachusetts. Award amounts range from $300 to $1,900 per year. To qualify, you must complete the FAFSA, be a Massachusetts resident for at least one year, be enrolled in an eligible Massachusetts institution, demonstrate financial need, and maintain satisfactory academic progress. Awards are made by your school\'s financial aid office.'
  },
  {
    id: '3',
    question: 'What is MASSGrant Plus?',
    answer: 'MASSGrant Plus is an enhanced state grant for Massachusetts students with exceptional financial need (Expected Family Contribution of $0). This program can cover up to the full cost of tuition and mandatory fees at Massachusetts public colleges and universities. You must complete the FAFSA, be enrolled full-time, maintain good academic standing, and attend a participating public institution in Massachusetts. This grant significantly reduces or eliminates tuition costs for eligible students.'
  },
  {
    id: '4',
    question: 'How do I apply for MassHealth?',
    answer: 'MassHealth is Massachusetts\' Medicaid and Children\'s Health Insurance Program (CHIP). To apply, visit MAhealthconnector.org or call the MassHealth Customer Service Center. You\'ll need proof of Massachusetts residency, identity, citizenship or immigration status, and income documentation. Students may qualify based on income, age, disability, or other factors. MassHealth provides comprehensive health coverage including doctor visits, hospital care, prescription drugs, and preventive services.'
  },
  {
    id: '5',
    question: 'What MBTA discounts are available for students?',
    answer: 'Full-time students can purchase discounted MBTA passes. The Student LinkPass offers unlimited travel on subway, bus, and local bus routes at a reduced rate compared to regular monthly passes. To get this discount, you must verify your full-time enrollment status through your school\'s transportation office or the MBTA website. Some schools participate in semester pass programs that offer even greater savings. You must carry your student ID when using the discounted pass.'
  },
  {
    id: '6',
    question: 'How do I apply for federal student aid?',
    answer: 'To apply for federal student aid, you must complete the Free Application for Federal Student Aid (FAFSA). You can file the FAFSA online at fafsa.gov starting October 1st each year. You will need your FSA ID, Social Security number, federal income tax returns, W-2s, and records of untaxed income. It\'s recommended to submit your FAFSA as early as possible because some aid is awarded on a first-come, first-served basis.'
  },
  {
    id: '7',
    question: 'What types of federal student loans are available?',
    answer: 'There are several types of federal student loans: Direct Subsidized Loans (for undergraduate students with financial need; the government pays interest while you\'re in school), Direct Unsubsidized Loans (available to undergraduate and graduate students; you are responsible for all interest), Direct PLUS Loans (for graduate students and parents of dependent undergraduate students), and Direct Consolidation Loans (to combine multiple federal student loans into one loan).'
  },
  {
    id: '8',
    question: 'What is Federal Work-Study?',
    answer: 'Federal Work-Study provides part-time employment opportunities for students with financial need, allowing them to earn money to help pay education expenses. The program encourages community service work and work related to the student\'s course of study. You can work on-campus or off-campus with approved employers. Not all schools participate in this program, so check with your school\'s financial aid office.'
  },
  {
    id: '9',
    question: 'Can college students in Massachusetts qualify for SNAP?',
    answer: 'Yes, college students in Massachusetts can qualify for SNAP (Supplemental Nutrition Assistance Program) benefits if they meet certain criteria. Students enrolled at least half-time may be eligible if they: work at least 20 hours per week, participate in a state or federally financed work-study program, care for a dependent household member, receive TANF benefits, or are enrolled in certain career and technical education programs. Apply through the Massachusetts Department of Transitional Assistance (DTA).'
  },
  {
    id: '10',
    question: 'What is the difference between grants and scholarships?',
    answer: 'Both grants and scholarships are forms of gift aid that do not need to be repaid. Grants are typically need-based and awarded by the federal government, state governments, or colleges based on your financial situation. Scholarships are typically merit-based and awarded based on academic achievement, athletic ability, artistic talent, or other criteria. Scholarships can come from schools, private organizations, employers, or community groups.'
  },
  {
    id: '11',
    question: 'Who is eligible for federal student aid?',
    answer: 'To be eligible for federal student aid, you must: be a U.S. citizen or eligible noncitizen; have a valid Social Security number; be enrolled or accepted for enrollment in an eligible degree or certificate program; maintain satisfactory academic progress; not be in default on a federal student loan or owe money on a federal grant; register with Selective Service if you are male between 18-25; and not have a conviction for the possession or sale of illegal drugs for an offense that occurred while receiving federal student aid.'
  },
  {
    id: '12',
    question: 'When are FAFSA deadlines?',
    answer: 'The federal deadline to submit the FAFSA is June 30 of the award year (for example, June 30, 2026, for the 2025-2026 award year). However, many states and colleges have earlier deadlines. Some state deadlines can be as early as January or February. It\'s important to check your state\'s deadline and your school\'s priority deadline to ensure you don\'t miss out on any aid opportunities.'
  },
  {
    id: '13',
    question: 'Are there other Massachusetts-specific benefits for students?',
    answer: 'Yes! Massachusetts offers several programs including: the Massachusetts Gilbert Grant for students at private institutions, Tuition Waiver programs for certain categories like National Guard members and foster care youth, the Adams Scholarship for high MCAS scorers, and various institutional grants at state colleges and universities. Contact your school\'s financial aid office to learn about all available Massachusetts programs.'
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      
      {/* Hero Section */}
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

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
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
          </motion.div>
        </div>
      </section>

      {/* AI Chatbot Section */}
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

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2026 CommonMASS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}