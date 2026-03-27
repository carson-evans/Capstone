import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { LegalPageShell } from '@/app/components/layout/LegalPageShell';

const FEEDBACK_SURVEY_URL = 'https://forms.gle/x6J4fDrvWmUz6vFu9';
const ACCESSIBILITY_EMAIL = 'accessibility@commonmass.org';

function AccessibilitySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h2
        id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="text-2xl font-bold text-[#1e3a5f] dark:text-sky-200"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

function AccessibilityCallout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {children}
      </p>
    </div>
  );
}

export default function AccessibilityStatementPage() {
  return (
    <LegalPageShell
      eyebrow="Accessibility"
      title="Accessibility Statement"
      summary="CommonMASS is designed to make benefit screening and next-step guidance easier to use for as many people as possible, including people who use assistive technology, keyboard navigation, zoom, or reduced-motion settings."
      updatedOn="Last updated: March 2026"
    >
      <AccessibilitySection title="Our commitment">
        <p>
          CommonMASS aims to provide a public-facing website that supports semantic
          structure, keyboard access, visible focus indicators, readable contrast,
          reduced-motion support, clear form labeling, and understandable status
          messaging.
        </p>
        <p>
          We actively work toward WCAG 2.1 Level A and AA alignment across the
          site experience and continue improving issues as they are identified
          through testing, review, and user feedback.
        </p>
      </AccessibilitySection>

      <AccessibilitySection title="What we do today">
        <div className="grid gap-4 md:grid-cols-3">
          <AccessibilityCallout title="Keyboard access">
            CommonMASS includes keyboard-reachable navigation, a skip link to main
            content, visible focus styles, and keyboard-usable forms, accordions,
            and interactive controls.
          </AccessibilityCallout>

          <AccessibilityCallout title="Readable presentation">
            CommonMASS supports zoom, responsive layouts, reduced motion,
            descriptive headings, and labels that are intended to remain
            understandable across screen sizes.
          </AccessibilityCallout>

          <AccessibilityCallout title="Assistive technology support">
            CommonMASS uses semantic HTML, landmarks, button labels, form
            instructions, and status messaging that are intended to work well with
            screen readers and other assistive technologies.
          </AccessibilityCallout>
        </div>
      </AccessibilitySection>

      <AccessibilitySection title="Known limitations">
        <p>
          We are still improving parts of the experience. Some third-party
          destinations linked from CommonMASS, including official application sites
          and external forms, are outside our direct control and may have their own
          accessibility patterns.
        </p>
        <p>
          Generated PDF packets are still being improved. The website should remain
          the primary accessible source for reviewing matches and checklist steps.
        </p>
      </AccessibilitySection>

      <AccessibilitySection title="Compatibility">
        <p>
          CommonMASS is intended to work with current versions of modern browsers
          and common assistive technologies. The site is also designed to respect
          user settings such as dark mode and reduced motion where supported.
        </p>
      </AccessibilitySection>

      <AccessibilitySection title="Feedback and help">
        <p>
          If you find an accessibility problem, need information in another format,
          or have trouble using any part of CommonMASS, let us know.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <AccessibilityCallout title="Email">
            Contact us at{' '}
            <a
              href={`mailto:${ACCESSIBILITY_EMAIL}`}
              className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
            >
              {ACCESSIBILITY_EMAIL}
            </a>
            .
          </AccessibilityCallout>

          <AccessibilityCallout title="Feedback form">
            You can also use the{' '}
            <a
              href={FEEDBACK_SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
            >
              CommonMASS feedback survey
            </a>
            .
          </AccessibilityCallout>
        </div>
      </AccessibilitySection>

      <AccessibilitySection title="Related pages">
        <p>
          You can also review our{' '}
          <Link
            to="/privacy"
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            Privacy Policy
          </Link>
          ,{' '}
          <Link
            to="/cookies"
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            Cookie Policy
          </Link>
          , and{' '}
          <Link
            to="/terms"
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            Terms of Use
          </Link>
          .
        </p>
      </AccessibilitySection>
    </LegalPageShell>
  );
}