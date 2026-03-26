import type { ReactNode } from 'react';

import { Navbar } from './Navbar';
import { PageBackdrop } from './PageBackdrop';
import { SiteFooter } from './SiteFooter';

type LegalPageShellProps = {
  title: string;
  summary: string;
  updatedOn?: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  summary,
  updatedOn = 'Last updated: March 2026',
  children,
}: LegalPageShellProps) {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc] text-black dark:bg-slate-950 dark:text-slate-100">
      <PageBackdrop />
      <Navbar />

      <main id="main-content" tabIndex={-1} className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/75 bg-white/82 shadow-[0_34px_80px_-52px_rgba(15,23,42,0.45)] backdrop-blur-none dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_28px_80px_-40px_rgba(2,6,23,0.95)] md:backdrop-blur-sm">
            <div className="border-b border-slate-200/70 px-6 py-8 dark:border-white/10 md:px-10 md:py-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#355b8a] dark:text-sky-200">
                Legal
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
                {summary}
              </p>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{updatedOn}</p>
            </div>

            <div className="space-y-10 px-6 py-8 md:px-10 md:py-10">{children}</div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
