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
      summary="This Cookie Policy explains which browser storage and monitoring preferences CommonMASS uses, when they are used, and how you can control them."
    >
      <CookieSection title="What cookies and similar technologies are">
        <p>
          Cookies are small data files stored on your device. Similar technologies can also include
          local storage, session storage, and performance monitoring identifiers used to keep a site
          working or understand reliability problems.
        </p>
      </CookieSection>

      <CookieSection title="What CommonMASS uses today">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Essential browser storage</strong> may be used for core interface behavior such as
            theme preference.
          </li>
          <li>
            <strong>Optional performance monitoring preference storage</strong> is used only to remember
            whether you allowed or declined performance monitoring.
          </li>
          <li>
            <strong>Performance monitoring</strong> stays off unless you choose to allow it.
          </li>
        </ul>
      </CookieSection>

      <CookieSection title="Performance monitoring and consent">
        <p>
          CommonMASS uses privacy-conscious application performance monitoring only after a user opts in.
          When enabled, the monitoring is intended to help detect errors, degraded performance, and
          reliability issues.
        </p>
        <p>
          If you do not allow monitoring, CommonMASS keeps it off and stores only that preference so the
          site can remember your choice.
        </p>
      </CookieSection>

      <CookieSection title="Types of technologies that may be used">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Essential</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Needed for routing, accessibility preferences, and secure delivery.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Preference</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Used to remember choices such as visual theme and whether performance monitoring is allowed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Monitoring</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Used only after opt-in to understand performance, request failures, and operational issues.
            </p>
          </div>
        </div>
      </CookieSection>

      <CookieSection title="Third-party services">
        <p>
          CommonMASS may rely on third-party hosting, infrastructure, form, storage, or monitoring
          providers to operate the service. Those services may process technical data needed to deliver,
          secure, or monitor the site.
        </p>
      </CookieSection>

      <CookieSection title="How to manage these technologies">
        <p>
          You can manage cookies through your browser settings. You can also use the CommonMASS monitoring
          preference control when it is shown on the site. Blocking some essential technologies may affect
          site behavior.
        </p>
      </CookieSection>

      <CookieSection title="Changes to this policy">
        <p>
          We may update this Cookie Policy if CommonMASS changes how it stores preferences or uses
          monitoring technologies. When that happens, we will update the effective date on this page.
        </p>
      </CookieSection>
    </LegalPageShell>
  );
}
