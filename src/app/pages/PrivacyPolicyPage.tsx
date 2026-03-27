import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { LegalPageShell } from '@/app/components/layout/LegalPageShell';

const CONTACT_EMAIL = 'privacy@commonmass.org';

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

function PolicyCallout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</p>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      summary="CommonMASS is designed to help users screen for benefits and generate next-step guidance while limiting unnecessary data collection and keeping generated packets private."
    >
      <PolicySection title="Privacy at a glance">
        <div className="grid gap-4 md:grid-cols-3">
          <PolicyCallout title="We do not sell your data">
            CommonMASS does not sell, rent, trade, or license questionnaire answers, packet contents,
            or other personal information to advertisers, data brokers, or other third parties for their
            own marketing use.
          </PolicyCallout>

          <PolicyCallout title="We use information only to run the service">
            We use the information you provide to return benefit matches, generate checklist packets,
            support downloads, improve usability, and help keep the site secure and reliable.
          </PolicyCallout>

          <PolicyCallout title="Generated packets are not public">
            Generated packets are stored in private, non-public cloud storage. Temporary protected download
            links are short-lived and expire after about 5 minutes.
          </PolicyCallout>
        </div>
      </PolicySection>

      <PolicySection title="What we collect">
        <div className="grid gap-4 md:grid-cols-2">
          <PolicyCallout title="Questionnaire answers">
            When you use the screener, CommonMASS processes the answers you enter, such as student status,
            residency status, school selection, household size, and related eligibility information.
          </PolicyCallout>

          <PolicyCallout title="Checklist and packet data">
            If you generate a PDF packet, CommonMASS processes the matched benefits, selected benefits,
            and checklist content needed to create that packet.
          </PolicyCallout>

          <PolicyCallout title="Technical and usage data">
            CommonMASS may process limited technical data needed to operate, secure, debug, and monitor
            the site, such as request data, performance data, and error information.
          </PolicyCallout>

          <PolicyCallout title="Voluntary submissions">
            If you use a linked feedback form or contact method, the information you choose to submit may
            also be collected by the provider hosting that form or inbox.
          </PolicyCallout>
        </div>
      </PolicySection>

      <PolicySection title="How we use information">
        <p>
          CommonMASS uses information to run the screener, return benefit matches, generate personalized
          checklists, support packet downloads, improve usability, and help keep the site secure.
        </p>
        <p>
          CommonMASS does not use your information for unrelated advertising. The service is intended to
          help users understand possible benefit pathways and next steps, not to build marketing profiles.
        </p>
      </PolicySection>

      <PolicySection title="Optional performance monitoring">
        <p>
          CommonMASS can use privacy-conscious performance monitoring to understand reliability issues such
          as application errors and degraded response times.
        </p>
        <p>
          This monitoring stays off unless a user chooses to allow it. When enabled, CommonMASS uses the
          resulting telemetry only for service operation, debugging, and security support.
        </p>
      </PolicySection>

      <PolicySection title="Generated packets and downloads">
        <p>
          When you generate a packet, the packet may include a profile summary, matched benefits, and
          application checklist content based on the information you entered.
        </p>
        <p>
          Generated packet files are stored in private, non-public cloud storage. Access is provided
          through a temporary protected download link that expires after about 5 minutes.
        </p>
        <p>
          Generated packet files may be retained for up to 7 days to support download access,
          troubleshooting, and service operations, and are then automatically deleted.
        </p>
      </PolicySection>

      <PolicySection title="Cookies and similar technologies">
        <p>
          CommonMASS uses limited browser storage for core functionality and preferences. Optional
          performance monitoring remains off unless you choose to allow it. More detail is available in our{' '}
          <Link
            to="/cookies"
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            Cookie Policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="How information may be shared">
        <p>
          CommonMASS may share information with infrastructure, hosting, storage, analytics, monitoring,
          and form providers only to the extent needed to operate the site and its features.
        </p>
        <p>
          These providers are not given permission through CommonMASS to use your information for their
          own unrelated marketing purposes.
        </p>
        <p>
          CommonMASS may also disclose information when required by law, to respond to legal process, or
          to protect the rights, safety, and security of the service or its users.
        </p>
      </PolicySection>

      <PolicySection title="Security">
        <p>
          CommonMASS is designed with privacy and security in mind. It uses reasonable administrative,
          technical, and organizational safeguards intended to protect information against unauthorized
          access, disclosure, misuse, or loss.
        </p>
        <p>
          Examples may include private storage for generated packets, temporary protected download links,
          request validation, restrictive browser security settings, logging and monitoring for security and
          reliability, and limiting access to service components that need the data to operate.
        </p>
        <p>
          No internet service can promise absolute security, but CommonMASS is designed to avoid
          unnecessary exposure of the information you provide.
        </p>
      </PolicySection>

      <PolicySection title="Retention">
        <p>
          CommonMASS keeps information only for as long as it is reasonably needed to operate the service,
          support packet generation, maintain security, troubleshoot issues, and meet legal or operational
          requirements.
        </p>
        <p>
          Generated packet files may be retained for up to 7 days and then automatically deleted.
          Technical logs, monitoring data, and related operational records may be retained for a different
          period when needed for security, reliability, fraud prevention, auditing, or legal compliance.
        </p>
      </PolicySection>

      <PolicySection title="Your choices">
        <p>
          You can choose not to submit screener information, not to generate a packet, not to use any
          external feedback form, and not to allow optional monitoring.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          For privacy questions or requests related to your information, please email{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-[#1e3a5f] underline underline-offset-4 dark:text-sky-200"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </PolicySection>
    </LegalPageShell>
  );
}
