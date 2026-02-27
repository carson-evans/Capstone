import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const mockResponses = [
  {
    keywords: ['pell', 'grant', 'federal'],
    response: 'The Federal Pell Grant is a need-based grant for undergraduate students. The maximum Pell Grant award for the 2025-2026 award year is $7,395. You must complete the FAFSA to be considered for this grant. Eligibility is based on your Expected Family Contribution (EFC), cost of attendance, and enrollment status.'
  },
  {
    keywords: ['massgrant', 'mass grant', 'massachusetts grant'],
    response: 'MASSGrant is a state-funded grant program for Massachusetts residents attending college in-state. Award amounts range from $300 to $1,900 per year. You must complete the FAFSA, be a Massachusetts resident for at least one year, and maintain satisfactory academic progress. MASSGrant Plus provides enhanced funding for students with exceptional financial need (EFC of $0) and can cover up to full tuition at Massachusetts public colleges.'
  },
  {
    keywords: ['masshealth', 'mass health', 'medicaid massachusetts'],
    response: 'MassHealth is Massachusetts\' Medicaid and CHIP program providing comprehensive health coverage. You can apply at MAhealthconnector.org. You\'ll need proof of Massachusetts residency, identity, citizenship or immigration status, and income documentation. MassHealth covers doctor visits, hospital care, prescription drugs, and preventive services. Students may qualify based on income, age, disability, or other factors.'
  },
  {
    keywords: ['mbta', 'transit', 'subway', 'bus', 'transportation massachusetts'],
    response: 'Full-time students can purchase discounted MBTA passes through the Student LinkPass program. This offers unlimited travel on subway, bus, and local routes at a reduced rate. You must verify your full-time enrollment status through your school\'s transportation office or the MBTA website. Some schools offer semester pass programs with additional savings. Always carry your student ID when using the discounted pass.'
  },
  {
    keywords: ['fafsa', 'apply', 'application'],
    response: 'To apply for federal student aid, you need to complete the Free Application for Federal Student Aid (FAFSA). You can file the FAFSA online at fafsa.gov. You\'ll need your FSA ID, Social Security number, federal tax information, and records of untaxed income. The FAFSA opens on October 1st each year.'
  },
  {
    keywords: ['work study', 'work-study', 'job'],
    response: 'Federal Work-Study provides part-time jobs for undergraduate and graduate students with financial need. The program encourages community service work and work related to your course of study. You can work on-campus or off-campus with approved employers. Check with your school\'s financial aid office to apply.'
  },
  {
    keywords: ['loan', 'borrow', 'student loan'],
    response: 'Federal student loans include Direct Subsidized Loans (for undergraduate students with financial need), Direct Unsubsidized Loans (available to all students), and Direct PLUS Loans (for graduate students and parents). Interest rates and loan limits vary by loan type and dependency status. Always borrow only what you need.'
  },
  {
    keywords: ['eligibility', 'qualify', 'eligible'],
    response: 'To be eligible for federal student aid, you must: be a U.S. citizen or eligible noncitizen, have a valid Social Security number, be enrolled in an eligible program, maintain satisfactory academic progress, and not be in default on federal student loans. You must also complete the FAFSA each year.'
  },
  {
    keywords: ['deadline', 'when', 'date'],
    response: 'FAFSA deadlines vary by state and school. The federal deadline is June 30th of the award year. However, many states and schools have earlier deadlines. It\'s recommended to submit your FAFSA as soon as possible after October 1st to maximize your aid opportunities.'
  },
  {
    keywords: ['snap', 'food', 'assistance'],
    response: 'Students may qualify for SNAP (Supplemental Nutrition Assistance Program) if they meet certain criteria, such as working at least 20 hours per week, participating in work-study, caring for a dependent, or receiving TANF benefits. In Massachusetts, apply through the Department of Transitional Assistance (DTA). Contact your local SNAP office to verify your eligibility.'
  },
  {
    keywords: ['scholarship', 'scholarships'],
    response: 'Scholarships are free money for college that you don\'t have to repay. Look for scholarships through your school\'s financial aid office, community organizations, employers, and online scholarship databases. Massachusetts also offers the Adams Scholarship for high MCAS scorers. Be sure to watch for application deadlines and never pay to apply for scholarships.'
  }
];

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m here to help answer your questions about student benefits. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Find matching response based on keywords
    for (const responseData of mockResponses) {
      if (responseData.keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        return responseData.response;
      }
    }
    
    // Default response if no match found
    return 'I understand you\'re asking about student benefits. For specific questions about Pell Grants, FAFSA applications, work-study programs, student loans, SNAP benefits, or scholarships, please try rephrasing your question with those terms. You can also check our FAQ section above for more information.';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto border border-gray-300 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-black">Benefits Assistant</h3>
            <p className="text-sm text-gray-600">Ask me anything about student benefits</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(!isMinimized)}
          className="hover:bg-gray-200"
        >
          {isMinimized ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Messages */}
            <div 
              ref={scrollRef}
              className="h-96 overflow-y-auto p-4 space-y-4 bg-white"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-gray-700" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-black border border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-300 bg-gray-50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 bg-white border-gray-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-[#f97316] text-white hover:bg-[#ea580c]"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}