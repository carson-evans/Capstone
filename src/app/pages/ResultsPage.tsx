import React from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ExternalLink, CheckSquare } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Navbar } from '@/app/components/layout/Navbar';
import { useBenefits } from '@/app/context/BenefitsContext';

export default function ResultsPage() {
  const { matchedBenefits, answers } = useBenefits();
  
  // If no matches, maybe show a message
  const hasMatches = matchedBenefits.length > 0;

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navbar />

      <div className="container max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-4">Your Results</h1>
          <p className="text-lg text-gray-600">
            Based on your answers, you may qualify for the following {matchedBenefits.length} benefits.
          </p>
        </motion.div>

        {hasMatches ? (
          <div className="space-y-6">
            {matchedBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-xs font-bold text-gray-500 rounded mb-2 uppercase tracking-wide">
                          {benefit.category}
                        </span>
                        <CardTitle className="text-2xl font-bold">{benefit.title}</CardTitle>
                        {benefit.actionStatus && (
                          <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            benefit.actionStatus.includes('No action needed') 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {benefit.actionStatus}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="hidden sm:flex border-black text-black hover:bg-gray-50">
                        Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-gray-600 leading-relaxed">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="bg-gray-50/50 p-6 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:text-black">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Official Site
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">We couldn't find any specific benefits matching your profile at this time.</p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Start Over</Button>
          </div>
        )}

        {hasMatches && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center"
          >
            <Link to="/checklist">
              <Button size="lg" className="bg-[#f97316] text-white hover:bg-[#ea580c] text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                <CheckSquare className="mr-2 h-5 w-5" />
                Get Personalized Checklist
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}