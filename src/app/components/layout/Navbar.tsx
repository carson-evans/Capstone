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
    <>
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-[#1e3a5f] px-4 py-2 font-medium text-white shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-4 focus:ring-[#1e3a5f]/25 dark:bg-sky-200 dark:text-slate-950 dark:focus:ring-sky-200/35"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Primary"
        className="border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/85"
      >
        <div className="container mx-auto flex h-[4.5rem] items-center justify-between px-3 md:h-24 md:pl-2 md:pr-8">
          <Link
            to="/"
            aria-label="CommonMASS home"
            className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100"
          >
            <img
              src={isDarkMode ? darkLogo : lightLogo}
              alt="CommonMASS logo"
              className="h-14 w-auto transition-[filter] duration-300 md:h-20"
            />
          </Link>

          <div className="flex items-center gap-1.5 md:gap-3">
            <Link to="/faq">
              <Button className="cursor-pointer rounded-md bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#f97316] focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/20 md:px-6 md:py-2 md:text-base dark:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.95)] dark:focus-visible:ring-sky-200/25">
                FAQ
              </Button>
            </Link>

            <Button
              asChild
              variant="outline"
              className="group inline-flex border-[#355b8a] bg-white/92 px-2 py-1.5 text-[11px] font-medium text-[#1e3a5f] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-[0_14px_32px_-20px_rgba(249,115,22,0.44)] focus-within:ring-4 focus-within:ring-[#1e3a5f]/15 md:px-3 md:py-2 md:text-sm dark:border-sky-200/55 dark:bg-slate-900/85 dark:text-sky-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:focus-within:ring-sky-200/20"
            >
              <a
                href={FEEDBACK_SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the CommonMASS feedback survey in a new tab"
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 md:mr-2 md:h-4 md:w-4" />
                <span className="md:hidden">Feedback</span>
                <span className="hidden md:inline">Feedback Survey</span>
              </a>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDarkMode}
              className="size-7.5 cursor-pointer rounded-full border-gray-300 bg-white text-[#1e3a5f] transition-colors hover:border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/20 md:size-9 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white dark:focus-visible:ring-sky-200/25"
            >
              {isDarkMode ? (
                <Sun className="h-3.5 w-3.5 stroke-[1.85] md:h-4 md:w-4" />
              ) : (
                <Moon className="h-3.5 w-3.5 stroke-[1.85] md:h-4 md:w-4" />
              )}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
