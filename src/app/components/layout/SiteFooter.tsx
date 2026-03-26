import { Link } from 'react-router';

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t border-[#16304f] bg-[#1e3a5f] py-10 text-white"
    >
      <div className="container mx-auto grid gap-8 px-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start md:gap-10">
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
              <li>
                <Link className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" to="/screener">
                  Screener
                </Link>
              </li>
              <li>
                <Link className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" to="/faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal and support links">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100/85">
              Legal and support
            </p>
            <ul className="mt-3 space-y-2 text-sm md:text-base">
              <li>
                <Link className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" to="/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" to="/terms">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" to="/cookies">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <a
                  className="underline-offset-4 transition-colors hover:text-orange-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  href={FEEDBACK_SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Feedback Survey
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="container mx-auto mt-8 border-t border-white/12 px-6 pt-5 text-sm text-white/70">
        <p>© {currentYear} CommonMASS. All rights reserved.</p>
      </div>
    </footer>
  );
}
