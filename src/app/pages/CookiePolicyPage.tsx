import type { ReactNode } from 'react';

import { LegalPageShell } from '@/app/components/layout/LegalPageShell';

function CookieSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-sky-200">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      summary="This Cookie Policy explains how CommonMASS may use cookies and similar technologies."
    >
      <CookieSection title="What cookies are">
        <p>
          Cookies are small data files stored on your device. Similar technologies may also be used for
          analytics, preferences, security, or performance monitoring.
        </p>
      </CookieSection>

      <CookieSection title="How CommonMASS may use them">
        <ul className="list-disc space-y-2 pl-6">
          <li>to support core site functionality</li>
          <li>to remember interface or preference choices</li>
          <li>to understand errors, performance, and service reliability</li>
          <li>to help protect the site from abuse or malicious traffic</li>
        </ul>
      </CookieSection>

      <CookieSection title="Types of cookies or technologies we may use">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Essential</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Needed for core app behavior, routing, and secure delivery.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Preference</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              May be used to remember visual or usability preferences.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Analytics / monitoring</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              May be used to understand performance, request behavior, and operational issues.
            </p>
          </div>
        </div>
      </CookieSection>

      <CookieSection title="Third-party technologies">
        <p>
          Some cookies or similar technologies may come from third-party infrastructure, analytics,
          monitoring, hosting, or linked services that support CommonMASS.
        </p>
      </CookieSection>

      <CookieSection title="How to manage cookies">
        <p>
          You can control cookies through your browser settings. Blocking some cookies may affect how certain
          parts of the site work.
        </p>
      </CookieSection>

      <CookieSection title="Changes to this policy">
        <p>
          We may update this Cookie Policy as the project and its tooling change. When that happens, we will
          update the effective date on this page.
        </p>
      </CookieSection>
    </LegalPageShell>
  );
}