// src/app/components/layout/SiteFooter.tsx
import { Link } from 'react-router';

import commonMassCircleLogo from '@/assets/CommonMassCircle.png';

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative overflow-hidden border-t border-[#16304f]/80 bg-[#1e3a5f] py-10 text-white dark:border-white/10 dark:bg-[#0b1120]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(30,58,95,0)_34%,rgba(30,58,95,0)_100%),radial-gradient(circle_at_14%_18%,rgba(125,211,252,0.14),transparent_30%),radial-gradient(circle_at_86%_14%,rgba(251,146,60,0.14),transparent_26%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(11,17,32,0)_34%,rgba(11,17,32,0)_100%),radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(249,115,22,0.08),transparent_24%)]"
      />

      <div className="relative container mx-auto grid gap-7 px-6 md:grid-cols-[11rem_minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-start md:gap-8 lg:grid-cols-[13rem_minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        <div className="flex justify-center md:justify-start">
          <img
            src={commonMassCircleLogo}
            alt=""
            aria-hidden="true"
            className="h-28 w-28 shrink-0 rounded-full object-contain shadow-[0_20px_40px_-24px_rgba(255,255,255,0.38)] md:h-36 md:w-36 lg:h-44 lg:w-44"
          />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-100/85">
            CommonMASS
          </p>
          <h2 className="mt-2 text-xl font-bold md:text-2xl">
            Massachusetts benefits screening and application guidance.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
            CommonMASS helps residents understand possible benefit pathways, next steps, and official application destinations.
          </p>
          <p className="mt-3 text-sm text-white/72">
            Built with accessibility, privacy, and clear navigation in mind.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <nav aria-label="Footer navigation">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100/85">
              Navigate
            </p>
            <ul className="mt-3 space-y-2 text-sm md:text-base">
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/">Home</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/screener">Screener</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/faq">FAQ</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal and accessibility links">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100/85">
              Policies and support
            </p>
            <ul className="mt-3 space-y-2 text-sm md:text-base">
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/accessibility">Accessibility Statement</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/privacy">Privacy Policy</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/terms">Terms of Use</Link></li>
              <li><Link className="underline-offset-4 transition-colors hover:text-orange-300" to="/cookies">Cookie Policy</Link></li>
              <li>
                <a
                  className="underline-offset-4 transition-colors hover:text-orange-300"
                  href={FEEDBACK_SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Feedback Survey <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="relative container mx-auto mt-8 border-t border-white/12 px-6 pt-5 text-sm text-white/70">
        <p>&copy; {currentYear} CommonMASS. All rights reserved.</p>
      </div>
    </footer>
  );
}
