// src/app/components/layout/Navbar.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ExternalLink, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { useTheme } from '@/app/context/ThemeContext';
import { useBenefits } from '@/app/context/BenefitsContext';
import { Button } from '@/app/components/ui/button';
import darkLogo from '@/assets/CommonDark.png';
import lightLogo from '@/assets/Common.png';

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { reset } = useBenefits();
  const { pathname } = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const lastScrollYRef = useRef(0);
  const isMobileMenuOpenRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    isMobileMenuOpenRef.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const revealThreshold = 112;
    const directionThreshold = 6;

    const updateNavbarState = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      const isNearTop = currentScrollY < revealThreshold;

      setIsFloating(!isNearTop);

      if (isNearTop) {
        setIsHidden(false);
      } else if (scrollDelta > directionThreshold && !isMobileMenuOpenRef.current) {
        setIsHidden(true);
      } else if (scrollDelta < -directionThreshold) {
        setIsHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
      frameRef.current = null;
    };

    const handleScroll = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(updateNavbarState);
    };

    lastScrollYRef.current = Math.max(window.scrollY, 0);
    updateNavbarState();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const directionThreshold = 6;
    let lastScrollY = Math.max(window.scrollY, 0);
    let frameId: number | null = null;

    const updateMenuState = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollY;

      if (scrollDelta > directionThreshold) {
        setIsMobileMenuOpen(false);
      }

      lastScrollY = currentScrollY;
      frameId = null;
    };

    const handleScroll = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateMenuState);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-[#1e3a5f] px-4 py-2 font-medium text-white shadow-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 dark:bg-sky-200 dark:text-slate-950"
      >
        Skip to main content
      </a>

      <div aria-hidden="true" className="h-[4.75rem] md:h-24" />

      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 top-0 z-50 transform-gpu border-b bg-white/90 backdrop-blur-sm will-change-transform ${
          shouldReduceMotion
            ? 'transition-none'
            : 'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
        } ${
          isHidden && !isMobileMenuOpen ? '-translate-y-full' : 'translate-y-0'
        } ${
          isFloating
            ? 'border-gray-200/80 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.62)] dark:border-white/10 dark:bg-slate-950/92 dark:shadow-[0_20px_54px_-34px_rgba(2,6,23,0.96)]'
            : 'border-gray-200 shadow-none dark:border-white/10 dark:bg-slate-950/85'
        }`}
      >
        <div className="container mx-auto flex h-[4.75rem] items-center justify-between px-2.5 sm:px-3 md:h-24 md:pl-2 md:pr-8">
          <Link
            to="/"
            onClick={reset}
            aria-label="CommonMASS home"
            className="ml-2 flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-[#1e3a5f] md:ml-0 dark:text-slate-100"
          >
            <span className="inline-grid place-items-center">
              <img
                src={lightLogo}
                alt=""
                aria-hidden="true"
                className="col-start-1 row-start-1 h-11 w-auto max-w-[8.25rem] opacity-100 transition-opacity duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:opacity-0 sm:h-12 sm:max-w-none md:h-20"
              />
              <img
                src={darkLogo}
                alt=""
                aria-hidden="true"
                className="col-start-1 row-start-1 h-11 w-auto max-w-[8.25rem] opacity-0 transition-opacity duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:opacity-100 sm:h-12 sm:max-w-none md:h-20"
              />
            </span>
          </Link>

          <div className="hidden shrink-0 items-center gap-1 sm:gap-2 md:flex md:gap-3">
            <Link to="/faq" aria-current={pathname === '/faq' ? 'page' : undefined}>
              <Button className="min-h-9 cursor-pointer rounded-md bg-[#1e3a5f] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#f97316] sm:min-h-10 sm:px-3 sm:text-sm md:px-6 md:text-base">
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
              className="h-9 w-9 cursor-pointer rounded-full border-gray-300 bg-white text-[#1e3a5f] transition-colors hover:border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white sm:h-10 sm:w-10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#f97316] dark:hover:bg-[#f97316] dark:hover:text-white"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 stroke-[1.85]" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 stroke-[1.85]" aria-hidden="true" />
              )}
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            className="min-h-10 cursor-pointer items-center gap-2 border-transparent bg-transparent px-2 text-sm font-semibold text-[#1e3a5f] shadow-none transition-colors duration-300 hover:bg-transparent hover:text-[#f97316] md:hidden dark:text-sky-100 dark:hover:bg-transparent dark:hover:text-orange-200"
          >
            <span>Menu</span>
            <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
              <motion.span
                className="absolute left-0 top-1/2 h-[1.75px] w-4 rounded-full bg-current"
                animate={
                  isMobileMenuOpen
                    ? { rotate: 45, y: 0 }
                    : { rotate: 0, y: -3.2 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                }
              />
              <motion.span
                className="absolute left-0 top-1/2 h-[1.75px] w-4 rounded-full bg-current"
                animate={
                  isMobileMenuOpen
                    ? { rotate: -45, y: 0 }
                    : { rotate: 0, y: 3.2 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </span>
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {isMobileMenuOpen ? (
            <motion.div
              id="mobile-nav-menu"
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0, y: -10 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
              }
              className="overflow-hidden border-t border-gray-200/80 md:hidden dark:border-white/10"
            >
              <div className="container mx-auto px-2.5 pb-4 pt-3 sm:px-3">
                <div className="flex flex-col items-center gap-3 py-1">
                  <Link
                    to="/faq"
                    aria-current={pathname === '/faq' ? 'page' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 px-2 py-1 text-sm font-semibold text-[#1e3a5f] transition-colors hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-sky-100 dark:hover:text-orange-200"
                  >
                    <span>Go to FAQ</span>
                  </Link>

                  <a
                    href={FEEDBACK_SURVEY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Open the CommonMASS feedback survey in a new tab"
                    className="group inline-flex min-h-10 items-center justify-center gap-1.5 px-2 py-1 text-sm font-semibold text-[#1e3a5f] transition-colors hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-sky-100 dark:hover:text-orange-200"
                  >
                    <span>Take Feedback Survey</span>
                    <ExternalLink
                      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 px-2 py-1 text-sm font-semibold text-[#1e3a5f] transition-colors hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-sky-100 dark:hover:text-orange-200"
                  >
                    <span>{isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}</span>
                    {isDarkMode ? (
                      <Sun className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Moon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </>
  );
}