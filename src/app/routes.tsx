import { useEffect } from 'react';
import { createBrowserRouter, Outlet, useLocation } from 'react-router';

import LandingPage from './pages/LandingPage';
import QuestionnairePage from './pages/QuestionnairePage';
import ResultsPage from './pages/ResultsPage';
import ChecklistPage from './pages/ChecklistPage';
import FAQPage from './pages/FAQPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import { BenefitsProvider } from './context/BenefitsContext';

const SITE_URL = 'https://commonmass.org';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

type SeoConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
};

const SEO_BY_PATH: Record<string, SeoConfig> = {
  '/': {
    title: 'CommonMASS | Massachusetts Benefits Finder for Students and Residents',
    description:
      'CommonMASS helps Massachusetts residents quickly find public benefits they may qualify for, including FAFSA, MASSGrant, MassHealth, SNAP, and MBTA student discounts.',
    canonicalPath: '/',
    robots: 'index, follow',
  },
  '/screener': {
    title: 'Eligibility Screener | CommonMASS',
    description:
      'Answer a short questionnaire to find Massachusetts public benefits, student aid, food assistance, health coverage, and transportation support you may qualify for.',
    canonicalPath: '/screener',
    robots: 'index, follow',
  },
  '/results': {
    title: 'Your Benefit Matches | CommonMASS',
    description:
      'View your CommonMASS benefit matches based on your questionnaire answers.',
    canonicalPath: '/results',
    robots: 'noindex, nofollow',
  },
  '/checklist': {
    title: 'Application Checklist | CommonMASS',
    description:
      'Review your next steps and personalized checklist for Massachusetts benefit applications.',
    canonicalPath: '/checklist',
    robots: 'noindex, nofollow',
  },
  '/faq': {
    title: 'FAQ | CommonMASS',
    description:
      'Read frequently asked questions about CommonMASS, Massachusetts public benefits, eligibility screening, and how to use the platform.',
    canonicalPath: '/faq',
    robots: 'index, follow',
  },
  '/privacy': {
    title: 'Privacy Policy | CommonMASS',
    description:
      'Read the CommonMASS Privacy Policy, including what we collect, how data is used, and how generated checklist packets are handled.',
    canonicalPath: '/privacy',
    robots: 'index, follow',
  },
  '/terms': {
    title: 'Terms of Use | CommonMASS',
    description:
      'Read the Terms of Use for CommonMASS, including informational-use limitations, acceptable use, and service disclaimers.',
    canonicalPath: '/terms',
    robots: 'index, follow',
  },
  '/cookies': {
    title: 'Cookie Policy | CommonMASS',
    description:
      'Read the CommonMASS Cookie Policy to understand how cookies and similar technologies may be used on the site.',
    canonicalPath: '/cookies',
    robots: 'index, follow',
  },
};

function setMetaContent(id: string, content: string) {
  const el = document.getElementById(id) as HTMLMetaElement | null;
  if (el) {
    el.setAttribute('content', content);
  }
}

function setCanonical(href: string) {
  const el = document.getElementById('canonical-link') as HTMLLinkElement | null;
  if (el) {
    el.setAttribute('href', href);
  }
}

function RouteMeta() {
  const location = useLocation();

  useEffect(() => {
    const seo =
      SEO_BY_PATH[location.pathname] ??
      ({
        title: 'Page Not Found | CommonMASS',
        description:
          'CommonMASS helps Massachusetts residents identify public benefits they may qualify for.',
        canonicalPath: location.pathname,
        robots: 'noindex, nofollow',
      } satisfies SeoConfig);

    const canonicalUrl = `${SITE_URL}${seo.canonicalPath}`;

    document.title = seo.title;

    setMetaContent('meta-description', seo.description);
    setMetaContent('meta-robots', seo.robots ?? 'index, follow');

    setMetaContent('og-title', seo.title);
    setMetaContent('og-description', seo.description);
    setMetaContent('og-url', canonicalUrl);
    setMetaContent('og-image', DEFAULT_OG_IMAGE);

    setMetaContent('twitter-title', seo.title);
    setMetaContent('twitter-description', seo.description);
    setMetaContent('twitter-image', DEFAULT_OG_IMAGE);

    setCanonical(canonicalUrl);
  }, [location.pathname]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function RootLayout() {
  return (
    <BenefitsProvider>
      <ScrollToTop />
      <RouteMeta />
      <Outlet />
    </BenefitsProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-white p-20 text-center text-black dark:bg-slate-950 dark:text-slate-100">
      404 Not Found
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: 'screener',
        Component: QuestionnairePage,
      },
      {
        path: 'results',
        Component: ResultsPage,
      },
      {
        path: 'checklist',
        Component: ChecklistPage,
      },
      {
        path: 'faq',
        Component: FAQPage,
      },
      {
        path: 'privacy',
        Component: PrivacyPolicyPage,
      },
      {
        path: 'terms',
        Component: TermsPage,
      },
      {
        path: 'cookies',
        Component: CookiePolicyPage,
      },
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
]);