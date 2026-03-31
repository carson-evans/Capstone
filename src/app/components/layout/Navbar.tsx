// src/app/components/layout/Navbar.tsx
import { Link, useLocation } from 'react-router';
import { ExternalLink, Moon, Sun } from 'lucide-react';

import { useTheme } from '@/app/context/ThemeContext';
import { Button } from '@/app/components/ui/button';
import darkLogo from '@/assets/CommonDark.png';
import lightLogo from '@/assets/Common.png';

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isDarkMode = theme === 'dark';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-[#1e3a5f] px-4 py-2 font-medium text-white shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 dark:bg-sky-200 dark:text-slate-950"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Primary"
        className="border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/85"
      >
        <div className="container mx-auto flex h-[4.75rem] items-center justify-between px-2.5 sm:px-3 md:h-24 md:pl-2 md:pr-8">
          <Link
            to="/"
            aria-label="CommonMASS home"
            className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100"
          >
            <img
              src={isDarkMode ? darkLogo : lightLogo}
              alt="CommonMASS"
              className="h-11 w-auto max-w-[8.25rem] transition-[filter] duration-300 sm:h-12 sm:max-w-none md:h-20"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
            <Link to="/faq" aria-current={pathname === '/faq' ? 'page' : undefined}>
              <Button className="min-h-9 rounded-md bg-[#1e3a5f] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#f97316] sm:min-h-10 sm:px-3 sm:text-sm md:px-6 md:text-base">
                FAQ
              </Button>
            </Link>

            <Button
              asChild
              variant="outline"
              className="group min-h-9 border-[#355b8a] bg-white/92 px-2 py-2 text-xs font-medium text-[#1e3a5f] shadow-sm transition-all duration-300 hover:border-[#f97316] hover:bg-[#f97316] hover:text-white sm:min-h-10 sm:px-3 sm:text-sm dark:border-sky-200/55 dark:bg-slate-900/85 dark:text-sky-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
            >
              <a
                href={FEEDBACK_SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the CommonMASS feedback survey in a new tab"
              >
                <ExternalLink className="mr-1 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:mr-2" />
                <span className="sm:hidden">Feedback</span>
                <span className="hidden sm:inline">Feedback Survey</span>
              </a>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-9 w-9 rounded-full border-gray-300 bg-white text-[#1e3a5f] transition-colors hover:border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white sm:h-10 sm:w-10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 stroke-[1.85]" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 stroke-[1.85]" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
