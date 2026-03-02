import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, CheckSquare, ListChecks, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Navbar } from '@/app/components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 space-y-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl"
        >
          Find Benefits You May Qualify For
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-gray-600 max-w-2xl"
        >
          A simple, secure way to check your eligibility for student aid, food assistance, and more. 
          Get matched in minutes.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link to="/screener">
            <Button size="lg" className="bg-[#f97316] text-white hover:bg-[#ea580c] text-lg px-8 py-6 rounded-full group">
              Start Screening
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-16 h-16 bg-[#1e3a5f] border-2 border-[#1e3a5f] rounded-full flex items-center justify-center mb-2">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Answer Questions</h3>
              <p className="text-gray-600 max-w-xs">
                Complete a brief questionnaire about your student status and needs.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-16 h-16 bg-[#f97316] border-2 border-[#f97316] rounded-full flex items-center justify-center mb-2">
                <ListChecks className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">See Matches</h3>
              <p className="text-gray-600 max-w-xs">
                Instantly view benefits programs you may be eligible for.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-16 h-16 bg-[#1e3a5f] border-2 border-[#1e3a5f] rounded-full flex items-center justify-center mb-2">
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">Get Checklist</h3>
              <p className="text-gray-600 max-w-xs">
                Download a personalized checklist to help you apply.
              </p>
            </motion.div>

          </div>
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