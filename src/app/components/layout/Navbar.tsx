import React from 'react';
import { Link } from 'react-router';
import { ExternalLink, Moon, Sun } from 'lucide-react';

import { useTheme } from '@/app/context/ThemeContext';
import { Button } from '@/app/components/ui/button';
import darkLogo from '../../../assets/CommonDark.png';
import lightLogo from '../../../assets/Common.png';

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/85">
      <div className="container mx-auto flex h-[4.5rem] items-center justify-between px-4 md:h-24 md:pl-2 md:pr-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100">
          <img
            src={isDarkMode ? darkLogo : lightLogo}
            alt="CommonMASS Logo"
            className="h-14 w-auto transition-[filter] duration-300 md:h-20"
          />
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/faq">
            <Button className="cursor-pointer rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#f97316] md:px-6 md:text-base dark:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.95)]">
              FAQ
            </Button>
          </Link>

          <Button
            asChild
            variant="outline"
            className="group hidden border-[#355b8a] bg-white/92 px-3 py-2 text-sm font-medium text-[#1e3a5f] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_14px_32px_-20px_rgba(249,115,22,0.44)] md:inline-flex dark:border-sky-200/55 dark:bg-slate-900/85 dark:text-sky-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
          >
            <a href={FEEDBACK_SURVEY_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Feedback Survey
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDarkMode}
            className="size-8 cursor-pointer rounded-full border-gray-300 bg-white text-[#1e3a5f] transition-colors hover:border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white md:size-9 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
          >
            {isDarkMode ? <Sun className="h-4 w-4 stroke-[1.85]" /> : <Moon className="h-4 w-4 stroke-[1.85]" />}
          </Button>
        </div>
      </div>
    </nav>
  );
}
