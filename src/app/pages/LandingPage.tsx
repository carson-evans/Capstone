import React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight, CheckSquare, ListChecks, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Navbar } from '@/app/components/layout/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navbar />

      <section className="flex flex-col items-center justify-center px-6 py-24 text-center md:py-36 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 md:space-y-10"
        >
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-[#1e3a5f] md:text-7xl md:leading-[0.95] lg:text-[5.15rem]">
            Discover{' '}
            <span className="bg-gradient-to-r from-[#1e3a5f] to-[#f97316] bg-clip-text text-transparent">
              Benefits
            </span>{' '}
            You May Qualify For
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-2xl"
          >
            A simple, secure way to check your eligibility for student aid, food assistance, MBTA
            discounts and more. Get matched in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/screener">
              <Button
                size="lg"
                className="group cursor-pointer rounded-full bg-[#f97316] px-8 py-6 text-lg text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.3)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#ea580c] hover:shadow-[0_20px_25px_-5px_rgba(249,115,22,0.4)] md:px-10 md:py-7 md:text-xl"
              >
                Start Screening
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="border-t border-gray-100 bg-gray-50 px-6 py-20 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 text-center md:grid-cols-3 md:gap-12 lg:gap-14">
            <motion.div
              whileHover={{ y: -8 }}
              className="group flex cursor-default flex-col items-center space-y-5 rounded-2xl p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 md:p-10"
            >
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                <FileText className="h-8 w-8 text-white md:h-9 md:w-9" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3a5f] md:text-2xl">Answer Questions</h3>
              <p className="max-w-sm text-gray-600 md:text-lg">
                Complete a brief questionnaire about your student status and needs.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="group flex cursor-default flex-col items-center space-y-5 rounded-2xl p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 md:p-10"
            >
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#f97316] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                <ListChecks className="h-8 w-8 text-white md:h-9 md:w-9" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3a5f] md:text-2xl">See Matches</h3>
              <p className="max-w-sm text-gray-600 md:text-lg">
                Instantly view benefits programs you may be eligible for.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="group flex cursor-default flex-col items-center space-y-5 rounded-2xl p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 md:p-10"
            >
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                <CheckSquare className="h-8 w-8 text-white md:h-9 md:w-9" />
              </div>
              <h3 className="text-xl font-bold text-[#1e3a5f] md:text-2xl">Get Checklist</h3>
              <p className="max-w-sm text-gray-600 md:text-lg">
                Download a personalized checklist to help you apply.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="border-t border-gray-200 bg-white py-12"
      >
        <div className="container mx-auto px-6 text-center text-sm text-gray-500 md:text-base">
          <p>Copyright 2026 CommonMASS. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}

