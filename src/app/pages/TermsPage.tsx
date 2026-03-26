import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { LegalPageShell } from '@/app/components/layout/LegalPageShell';

const CONTACT_EMAIL = 'terms@commonmass.org';

function PolicySection({
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

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Use"
      summary="These Terms of Use explain the rules for using CommonMASS, the limits of the service, and your responsibilities when relying on screener results and generated checklist materials."
    >
      <PolicySection title="Informational use only">
        <p>
          CommonMASS is an informational screening and guidance tool. It is designed to help users understand possible public benefit pathways, but it does not make benefit decisions and does not guarantee eligibility, approval, award amounts, or continued coverage.
        </p>
        <p>
          Official eligibility determinations are made only by the relevant agency, school, or program administrator.
        </p>
      </PolicySection>

      <PolicySection title="No legal, financial, medical, or government advice">
        <p>
          The service is not legal advice, financial advice, medical advice, or an official government determination. You should review the official application instructions, deadlines, and program rules before acting on any result.
        </p>
      </PolicySection>

      <PolicySection title="Accuracy and availability">
        <p>
          We try to keep CommonMASS accurate, secure, and available, but we cannot promise that all content will always be complete, current, error-free, or uninterrupted.
        </p>
        <p>
          Program rules, school participation, eligibility thresholds, agency forms, and deadlines may change without notice.
        </p>
      </PolicySection>

      <PolicySection title="Acceptable use">
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the service only for lawful purposes.</li>
          <li>Do not attempt to disrupt, overload, scrape, reverse engineer, or abuse the site or its supporting infrastructure.</li>
          <li>Do not submit malicious code, automated attacks, or misleading information intended to interfere with the service.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Third-party links and services">
        <p>
          CommonMASS may link to official agency sites, school resources, and external forms. Those services are controlled by their own operators and may have separate terms, privacy notices, and accessibility statements.
        </p>
      </PolicySection>

      <PolicySection title="Generated packets and downloads">
        <p>
          Downloaded packets are provided as a convenience and may include information based on your screener responses and checklist selections. You are responsible for reviewing the contents before relying on or sharing them.
        </p>
      </PolicySection>

      <PolicySection title="Privacy">
        <p>
          Your use of CommonMASS is also subject to our{' '}
          <Link
            to="/privacy"
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            Privacy Policy
          </Link>
          {' '}and{' '}
          <Link
            to="/cookies"
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            Cookie Policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="Changes to these terms">
        <p>
          We may update these Terms of Use as CommonMASS changes. When we do, we will update the effective date on this page.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          For questions about these terms, email {' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </PolicySection>
    </LegalPageShell>
  );
}
