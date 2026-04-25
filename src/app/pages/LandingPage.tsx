import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowUp,
  ArrowRight,
  Banknote,
  Bus,
  X,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HeartPulse,
  ListChecks,
  Pause,
  Pin,
  PiggyBank,
  Play,
  Plus,
  Utensils,
} from 'lucide-react';

import bostonDayImage from '@/assets/Images/Boston Day.jpg';
import bostonSkylineEveningImage from '@/assets/Images/Boston Skyline Evening.jpg';
import bostonSkylineNightImage from '@/assets/Images/Boston Skyline Night.jpg';
import bostonSkylineImage from '@/assets/Images/Boston Skyline.jpg';
import studentsImage from '@/assets/Images/Students.jpg';
import studentsThreeImage from '@/assets/Images/Students3.jpg';
import studentsTwoImage from '@/assets/Images/Students2.jpg';
import { Navbar } from '@/app/components/layout/Navbar';
import { SiteFooter } from '@/app/components/layout/SiteFooter';
import { Button } from '@/app/components/ui/button';
import { useBenefits } from '@/app/context/BenefitsContext';
import type { Benefit } from '@/app/data/benefitsData';
import { useTheme } from '@/app/context/ThemeContext';
import { useIsMobile } from '@/app/components/ui/use-mobile';

const HERO_SLIDES = [
  {
    src: studentsImage,
    alt: 'Students working together at a computer.',
    eyebrow: 'Guided Screening',
    caption:
      'Answer a short set of questions and surface the benefits that fit your situation.',
    objectPosition: 'center 42%',
  },
  {
    src: studentsTwoImage,
    alt: 'College students talking around a table with laptops.',
    eyebrow: 'Clear Next Steps',
    caption:
      'Turn confusing programs into a shortlist you can actually act on.',
    objectPosition: 'center 38%',
  },
  {
    src: studentsThreeImage,
    alt: 'Students studying together outdoors.',
    eyebrow: 'Built For Students',
    caption:
      'Compare help like Pell, SNAP, MassHealth, and transit discounts in one place.',
    objectPosition: 'center 35%',
  },
] as const;

type BenefitSpotlight = (typeof BENEFIT_SPOTLIGHTS)[number];

type WorkflowStepId = 'questions' | 'matches' | 'checklist';

type WorkflowStep = {
  id: WorkflowStepId;
  title: string;
  description: string;
  icon: typeof FileText;
  iconClassName: string;
};

type HeroBenefitFilterOption = {
  id: Benefit['id'] | 'all';
  label: string;
  mobileLabel?: string;
};

const HERO_BENEFIT_FILTERS: HeroBenefitFilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'pell-grant', label: 'Pell Grant' },
  { id: 'massgrant', label: 'MASSGrant' },
  { id: 'snap', label: 'SNAP' },
  { id: 'massgrant-plus', label: 'MASSGrant Plus' },
  { id: 'masshealth', label: 'MassHealth' },
  { id: 'mbta-pass', label: 'MBTA Student Pass', mobileLabel: 'MBTA Pass' },
];

const INDIVIDUAL_HERO_BENEFIT_FILTER_IDS = HERO_BENEFIT_FILTERS.flatMap(
  (filterOption) => (filterOption.id === 'all' ? [] : [filterOption.id])
);

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'questions',
    title: 'Answer Questions',
    description: 'Complete a brief questionnaire about your student status and needs.',
    icon: FileText,
    iconClassName: 'bg-[#1e3a5f]',
  },
  {
    id: 'matches',
    title: 'See Matches',
    description: 'Instantly view benefits programs you may be eligible for.',
    icon: ListChecks,
    iconClassName: 'bg-[#f97316]',
  },
  {
    id: 'checklist',
    title: 'Get Checklist',
    description: 'Get a personalized downloadable checklist to help you apply.',
    icon: CheckSquare,
    iconClassName: 'bg-[#1e3a5f]',
  },
];

const BENEFIT_SPOTLIGHTS = [
  {
    title: 'Pell Grant',
    faqFilterId: 'pell-grant',
    description:
      'Federal Pell Grants may help eligible undergraduate students pay for tuition, fees, books, and other school costs.',
    icon: PiggyBank,
    cardClassName:
      'border-[#d9f99d] bg-[linear-gradient(145deg,rgba(254,252,232,0.98),rgba(255,255,255,0.98)_48%,rgba(236,252,203,0.88))] shadow-[0_18px_44px_-34px_rgba(101,163,13,0.26)] dark:border-lime-300/18 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_54%,rgba(101,163,13,0.2))]',
    iconClassName:
      'bg-[#4d7c0f] text-white dark:bg-lime-300 dark:text-slate-950',
    accentClassName: 'from-[#a3e635]/42 via-[#d9f99d]/20 to-transparent',
  },
  {
    title: 'MASSGrant',
    faqFilterId: 'massgrant-family',
    description:
      'MASSGrant is a Massachusetts state financial aid program that may help students at eligible colleges cover education expenses.',
    icon: Banknote,
    cardClassName:
      'border-[#fed7aa] bg-[linear-gradient(145deg,rgba(255,247,237,0.98),rgba(255,255,255,0.98)_50%,rgba(255,237,213,0.86))] shadow-[0_18px_44px_-34px_rgba(249,115,22,0.3)] dark:border-orange-300/18 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_54%,rgba(194,65,12,0.22))]',
    iconClassName:
      'bg-[#f97316] text-white dark:bg-orange-300 dark:text-slate-950',
    accentClassName: 'from-[#fb923c]/52 via-[#fdba74]/18 to-transparent',
  },
  {
    title: 'MASSGrant Plus',
    faqFilterId: 'massgrant-family',
    description:
      'MASSGrant Plus may provide additional state financial aid support for eligible Massachusetts students, depending on school type and enrollment.',
    icon: Plus,
    cardClassName:
      'border-[#c7d2fe] bg-[linear-gradient(145deg,rgba(238,242,255,0.98),rgba(255,255,255,0.98)_52%,rgba(224,231,255,0.86))] shadow-[0_18px_44px_-34px_rgba(79,70,229,0.28)] dark:border-indigo-300/18 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_54%,rgba(67,56,202,0.24))]',
    iconClassName:
      'bg-[#4f46e5] text-white dark:bg-indigo-300 dark:text-slate-950',
    accentClassName: 'from-[#818cf8]/52 via-[#a5b4fc]/20 to-transparent',
  },
  {
    title: 'MBTA Student Pass',
    faqFilterId: 'mbta-pass',
    description:
      'MBTA student discount programs may help some students lower transportation costs for commuting to class, work, and campus activities.',
    icon: Bus,
    cardClassName:
      'border-[#bfdbfe] bg-[linear-gradient(145deg,rgba(239,246,255,0.98),rgba(255,255,255,0.98)_52%,rgba(219,234,254,0.84))] shadow-[0_18px_44px_-34px_rgba(37,99,235,0.28)] dark:border-sky-300/18 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_54%,rgba(14,116,144,0.22))]',
    iconClassName:
      'bg-[#2563eb] text-white dark:bg-sky-300 dark:text-slate-950',
    accentClassName: 'from-[#60a5fa]/50 via-[#93c5fd]/20 to-transparent',
  },
  {
    title: 'SNAP',
    faqFilterId: 'snap',
    description:
      'SNAP may help qualifying households and some students buy groceries and reduce food insecurity during the school year.',
    icon: Utensils,
    cardClassName:
      'border-[#86efac] bg-[linear-gradient(145deg,rgba(220,252,231,0.98),rgba(240,253,244,0.98)_48%,rgba(187,247,208,0.92))] shadow-[0_18px_44px_-34px_rgba(21,128,61,0.34)] dark:border-emerald-300/22 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_52%,rgba(6,95,70,0.3))]',
    iconClassName:
      'bg-[#166534] text-white dark:bg-emerald-300 dark:text-slate-950',
    accentClassName: 'from-[#22c55e]/50 via-[#4ade80]/24 to-transparent',
  },
  {
    title: 'MassHealth',
    faqFilterId: 'masshealth',
    description:
      'MassHealth may help eligible Massachusetts residents access health coverage for doctor visits, prescriptions, and other care.',
    icon: HeartPulse,
    cardClassName:
      'border-[#fecdd3] bg-[linear-gradient(145deg,rgba(255,241,242,0.98),rgba(255,255,255,0.98)_52%,rgba(254,226,226,0.9))] shadow-[0_18px_44px_-34px_rgba(225,29,72,0.28)] dark:border-rose-300/20 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_54%,rgba(190,24,93,0.22))]',
    iconClassName:
      'bg-[#dc2626] text-white dark:bg-rose-300 dark:text-slate-950',
    accentClassName: 'from-[#fb7185]/48 via-[#fda4af]/22 to-transparent',
  },
] as const;

export default function LandingPage() {
  const { theme } = useTheme();
  const { screeningBenefitFilters, setScreeningBenefitFilters } = useBenefits();
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isHeroAutoplayEnabled, setIsHeroAutoplayEnabled] = useState(true);
  const [hoveredSideCard, setHoveredSideCard] = useState<'left' | 'right' | null>(null);
  const [promotedSideCard, setPromotedSideCard] = useState<'left' | 'right' | null>(null);
  const [previewWorkflowStep, setPreviewWorkflowStep] =
    useState<WorkflowStepId | null>(null);
  const [pinnedWorkflowStep, setPinnedWorkflowStep] =
    useState<WorkflowStepId | null>(null);
  const activeWorkflowStep = previewWorkflowStep ?? pinnedWorkflowStep;

  const sideCardLayerTimeoutRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const heroCarouselRegionId = useId();
  const heroCarouselStatusId = useId();
  const heroCarouselInstructionsId = useId();

  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);

  const smoothHoverX = useSpring(hoverX, {
    stiffness: 180,
    damping: 24,
    mass: 0.45,
  });
  const smoothHoverY = useSpring(hoverY, {
    stiffness: 180,
    damping: 24,
    mass: 0.45,
  });

  const leftCardX = useTransform(smoothHoverX, [-0.55, 0.55], [-18, 10]);
  const leftCardY = useTransform(smoothHoverY, [-0.55, 0.55], [-12, 12]);
  const leftCardRotate = useTransform(smoothHoverX, [-0.55, 0.55], [-2.4, 1.6]);
  const leftCardScale = useTransform(smoothHoverX, [-0.55, 0.55], [1.045, 1.015]);

  const rightCardX = useTransform(smoothHoverX, [-0.55, 0.55], [-6, 22]);
  const rightCardY = useTransform(smoothHoverY, [-0.55, 0.55], [10, -12]);
  const rightCardRotate = useTransform(smoothHoverX, [-0.55, 0.55], [-1.2, 2.6]);
  const rightCardScale = useTransform(smoothHoverX, [-0.55, 0.55], [1.01, 1.06]);

  const imageX = useTransform(smoothHoverX, [-0.55, 0.55], [-10, 10]);
  const imageY = useTransform(smoothHoverY, [-0.55, 0.55], [-8, 8]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsHeroAutoplayEnabled(false);
    }
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || HERO_SLIDES.length <= 1 || !isHeroAutoplayEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      showNextSlide();
    }, 9200);

    return () => window.clearInterval(intervalId);
  }, [isHeroAutoplayEnabled, shouldReduceMotion]);

  useEffect(() => {
    return () => {
      if (sideCardLayerTimeoutRef.current !== null) {
        window.clearTimeout(sideCardLayerTimeoutRef.current);
      }
    };
  }, []);

  const activeSlide = HERO_SLIDES[activeSlideIndex];

  const leftBackdropImage =
    theme === 'dark' ? bostonSkylineEveningImage : bostonDayImage;
  const rightBackdropImage =
    theme === 'dark' ? bostonSkylineNightImage : bostonSkylineImage;

  const leftBackdropAlt =
    theme === 'dark'
      ? 'Boston skyline in the evening.'
      : 'Boston skyline during the day.';
  const rightBackdropAlt =
    theme === 'dark'
      ? 'Boston skyline at night.'
      : 'Boston skyline in daylight.';

  const carouselAnnouncement = `Showing slide ${activeSlideIndex + 1} of ${
    HERO_SLIDES.length
  }: ${activeSlide.eyebrow}.`;

  const getLandingRevealProps = (delay = 0, amount = 0.22, distance = 24) =>
    shouldReduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: distance },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount } as const,
          transition: {
            duration: 0.58,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  const getTightMobileRevealProps = (
    delay = 0,
    margin = '0px 0px 18% 0px',
    distance = 22
  ) =>
    shouldReduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: distance },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.01, margin } as const,
          transition: {
            duration: 0.58,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  const isAllBenefitFilterSelected = screeningBenefitFilters.length === 0;

  const handleBenefitFilterToggle = (filterId: HeroBenefitFilterOption['id']) => {
    if (filterId === 'all') {
      setScreeningBenefitFilters([]);
      return;
    }

    if (isAllBenefitFilterSelected) {
      setScreeningBenefitFilters([filterId]);
      return;
    }

    const nextFilters = screeningBenefitFilters.includes(filterId)
      ? screeningBenefitFilters.filter((benefitId) => benefitId !== filterId)
      : [...screeningBenefitFilters, filterId];

    const uniqueNextFilters = Array.from(new Set(nextFilters));
    const hasEveryIndividualFilterSelected =
      uniqueNextFilters.length === INDIVIDUAL_HERO_BENEFIT_FILTER_IDS.length &&
      INDIVIDUAL_HERO_BENEFIT_FILTER_IDS.every((benefitId) =>
        uniqueNextFilters.includes(benefitId)
      );

    setScreeningBenefitFilters(
      hasEveryIndividualFilterSelected ? [] : uniqueNextFilters
    );
  };

  const handleBenefitsAnchorClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const benefitsHeading = document.getElementById('benefits-heading');

    if (!benefitsHeading) {
      return;
    }

    event.preventDefault();
    benefitsHeading.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleBackToTopClick = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  const scrollToWorkflowStep = (stepId: WorkflowStepId) => {
    const target = document.getElementById(`workflow-step-${stepId}`);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const scrollWorkflowPreviewIntoView = (stepId: WorkflowStepId) => {
    window.setTimeout(() => {
      const stepCard = document.getElementById(`workflow-step-${stepId}`);

      if (!stepCard) {
        return;
      }

      if (isMobile) {
        if (stepId !== 'questions') {
          return;
        }

        const stepCardRect = stepCard.getBoundingClientRect();
        const mobileStepTargetTop = Math.max(0, window.scrollY + stepCardRect.top - 16);

        if (stepCardRect.top < 0 || stepCardRect.top > 20) {
          window.scrollTo({
            top: mobileStepTargetTop,
            behavior: shouldReduceMotion ? 'auto' : 'smooth',
          });
        }

        return;
      }

      const desktopPreview = document.getElementById('workflow-preview-desktop');

      if (!desktopPreview) {
        return;
      }

      const stepCardRect = stepCard.getBoundingClientRect();
      const desktopPreviewRect = desktopPreview.getBoundingClientRect();
      const combinedTop = Math.min(stepCardRect.top, desktopPreviewRect.top);
      const combinedBottom = Math.max(stepCardRect.bottom, desktopPreviewRect.bottom);
      const combinedHeight = combinedBottom - combinedTop;
      const desiredTopOffset = Math.max(72, (window.innerHeight - combinedHeight) / 2);
      const desktopPreviewTargetTop = Math.max(
        0,
        window.scrollY + combinedTop - desiredTopOffset
      );

      if (
        combinedTop < 72 ||
        combinedBottom > window.innerHeight - 48
      ) {
        window.scrollTo({
          top: desktopPreviewTargetTop,
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
        });
      }
    }, 80);
  };

  const getNextWorkflowStep = (stepId: WorkflowStepId): WorkflowStepId | null => {
    if (stepId === 'questions') {
      return 'matches';
    }

    if (stepId === 'matches') {
      return 'checklist';
    }

    return null;
  };

  const getBenefitFilterChipClassName = (isActive: boolean) =>
    `relative inline-flex min-h-10 cursor-pointer touch-manipulation transform-gpu items-center justify-center overflow-hidden whitespace-nowrap rounded-full border px-5 py-1.5 text-[0.72rem] font-semibold backdrop-blur transition-[transform,background-color,border-color,box-shadow,color] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc] sm:px-7 sm:py-2 sm:text-sm sm:duration-250 dark:focus-visible:ring-sky-200/40 dark:focus-visible:ring-offset-slate-950 ${
      isActive
        ? 'border-[#1e3a5f] bg-[linear-gradient(90deg,#1e3a5f_0%,#244a78_100%)] text-white shadow-[0_20px_38px_-18px_rgba(30,58,95,0.56)] hover:-translate-y-0.5 hover:scale-[1.04] hover:border-[#16304f] hover:bg-[linear-gradient(90deg,#16304f_0%,#2f5f92_100%)] hover:shadow-[0_26px_46px_-18px_rgba(30,58,95,0.62)] dark:border-sky-200 dark:bg-[linear-gradient(90deg,#bae6fd_0%,#7dd3fc_100%)] dark:text-slate-950 dark:shadow-[0_22px_42px_-20px_rgba(125,211,252,0.62)] dark:hover:bg-[linear-gradient(90deg,#e0f2fe_0%,#7dd3fc_100%)] dark:hover:shadow-[0_28px_50px_-20px_rgba(125,211,252,0.72)]'
        : 'border-[#1e3a5f]/20 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_100%)] text-[#1e3a5f] shadow-[0_16px_34px_-22px_rgba(30,58,95,0.38)] ring-1 ring-[#1e3a5f]/6 hover:-translate-y-0.5 hover:scale-[1.035] hover:border-[#1e3a5f]/38 hover:bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(219,234,254,0.92)_100%)] hover:shadow-[0_24px_44px_-22px_rgba(30,58,95,0.46)] hover:ring-[#1e3a5f]/12 dark:border-sky-200/42 dark:bg-[linear-gradient(90deg,rgba(15,23,42,0.94)_0%,rgba(12,74,110,0.42)_100%)] dark:text-sky-100 dark:shadow-[0_22px_44px_-24px_rgba(2,6,23,0.98),0_0_0_1px_rgba(125,211,252,0.2)] dark:ring-1 dark:ring-sky-200/10 dark:hover:border-sky-200/70 dark:hover:bg-[linear-gradient(90deg,rgba(15,23,42,0.98)_0%,rgba(14,116,144,0.46)_100%)] dark:hover:shadow-[0_28px_54px_-24px_rgba(2,6,23,1),0_0_0_1px_rgba(125,211,252,0.32)] dark:hover:ring-sky-200/22'
    }`;

  const renderWorkflowPreview = (stepId: WorkflowStepId) => {
    if (stepId === 'matches') {
      return (
        <div className="flex h-full flex-col gap-2 text-left">
          <div className="space-y-1">
            <p className="text-[0.95rem] font-bold tracking-tight text-[#111827] dark:text-slate-100">
              Matches
            </p>
          </div>

          <div className="shrink-0 overflow-hidden rounded-[1rem] border border-emerald-100/90 ring-1 ring-emerald-200/70 bg-white/86 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.18),0_0_26px_-28px_rgba(34,197,94,0.24)] dark:border-emerald-300/18 dark:ring-emerald-300/24 dark:bg-slate-900/80 dark:shadow-[0_18px_36px_-28px_rgba(2,6,23,0.78),0_0_30px_-28px_rgba(52,211,153,0.18)]">
            <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2.5">
                <div className="min-w-0">
                  <span className="mb-1 inline-block rounded bg-gray-100 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                    Food
                  </span>
                  <p className="text-[1rem] font-bold text-[#111827] dark:text-slate-100 sm:text-[1.05rem]">
                    SNAP (Food Stamps)
                  </p>
                </div>

                <button
                  type="button"
                  tabIndex={-1}
                  className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-[#355b8a] bg-white px-2.5 py-1.5 text-[0.66rem] font-semibold text-[#355b8a] shadow-sm sm:w-auto sm:shrink-0 dark:border-sky-200/55 dark:bg-slate-950 dark:text-sky-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Start Official Application
                </button>
              </div>
            </div>

            <div className="px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
              <p className="text-[0.78rem] leading-relaxed text-gray-600 dark:text-slate-300">
                Provides food purchasing assistance for low- and no-income people.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-[0.95rem] font-bold tracking-tight text-[#111827] dark:text-slate-100">
                Not Matched
              </p>
            </div>

            <div className="shrink-0 overflow-hidden rounded-[1rem] border border-rose-100/95 ring-1 ring-rose-200/80 bg-white/86 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.18),0_0_26px_-28px_rgba(248,113,113,0.28)] dark:border-rose-300/18 dark:ring-rose-300/24 dark:bg-slate-900/80 dark:shadow-[0_18px_36px_-28px_rgba(2,6,23,0.78),0_0_30px_-28px_rgba(251,113,133,0.18)]">
              <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2.5">
                  <div className="min-w-0">
                    <span className="mb-1 inline-block rounded bg-gray-100 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                      Transport
                    </span>
                    <p className="text-[1rem] font-bold text-[#111827] dark:text-slate-100 sm:text-[1.05rem]">
                      MBTA Student Pass
                    </p>
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-[#355b8a] bg-white px-2.5 py-1.5 text-[0.66rem] font-semibold text-[#355b8a] shadow-sm sm:w-auto sm:shrink-0 dark:border-sky-200/55 dark:bg-slate-950 dark:text-sky-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    View Official Requirements
                  </button>
                </div>
              </div>

              <div className="px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
                <div className="space-y-1">
                  <ul className="space-y-1">
                    <li className="flex gap-2.5 text-[0.74rem] leading-relaxed text-gray-700 dark:text-slate-300">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-400 dark:bg-rose-300"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="font-semibold text-rose-700 dark:text-rose-200">
                          Why:
                        </span>{' '}
                        Based on your selections in the screener, you were not matched for
                        this benefit.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'checklist') {
      const snapChecklistPreviewItems = [
        { item: 'Gather proof of income', checked: false },
        { item: 'Submit application through state portal', checked: false },
        { item: 'Check student eligibility requirements', checked: true },
        { item: 'Gather proof of enrollment', checked: true },
      ];

      return (
        <div className="space-y-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex min-h-10 cursor-default items-center justify-center gap-2 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white shadow-sm dark:bg-sky-300 dark:text-slate-950 dark:shadow-[0_18px_36px_-24px_rgba(125,211,252,0.55)]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </button>
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex min-h-10 cursor-default items-center justify-center gap-2 rounded-md border border-[#355b8a] bg-white px-4 py-2 text-sm font-semibold text-[#355b8a] shadow-sm dark:border-sky-200/55 dark:bg-slate-950 dark:text-sky-100"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="mb-1.5 inline-block rounded bg-gray-100 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                  Food
                </span>
                <p className="text-base font-bold text-[#111827] dark:text-slate-100">
                  SNAP (Food Stamps)
                </p>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#355b8a] bg-white px-3 py-1.5 text-xs font-semibold text-[#355b8a] shadow-sm dark:border-sky-200/55 dark:bg-slate-950 dark:text-sky-100"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Start Official Application
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {snapChecklistPreviewItems.map(({ item, checked }) => (
                <div
                  key={item}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    checked
                      ? 'border-slate-200 bg-slate-100/80 text-slate-600 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300'
                      : 'border-transparent bg-gray-100/55 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white dark:border-sky-300 dark:bg-sky-300 dark:text-slate-950'
                        : 'border-gray-400 bg-gray-100 dark:border-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    {checked ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                  </span>
                  <span
                    className={
                      checked
                        ? 'line-through decoration-2 decoration-slate-500 dark:decoration-slate-400'
                        : undefined
                    }
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3">
          <span className="inline-block rounded bg-gray-100 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-300">
            General
          </span>
        </div>
        <p className="text-lg font-bold leading-snug text-[#1e3a5f] dark:text-slate-100">
          Are you currently enrolled in a college or university?
        </p>
        <div className="space-y-2">
          {['Yes, full-time', 'Yes, part-time', 'No'].map((option, index) => (
            <div
              key={option}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold ${
                index === 0
                  ? 'border-[#355b8a] bg-[#eff6ff] text-[#1e3a5f] dark:border-sky-300/40 dark:bg-slate-800 dark:text-slate-100'
                  : 'border-transparent bg-gray-100/55 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300'
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full border border-slate-400 bg-gray-100">
                {index === 0 ? (
                  <span className="m-[3px] block h-1.5 w-1.5 rounded-full bg-[#1e3a5f]" />
                ) : null}
              </span>
              {option}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWorkflowPreviewPanel = (
    stepId: WorkflowStepId,
    containerClassName: string
  ) => {
    const nextStep = getNextWorkflowStep(stepId);
    const showNextStep = Boolean(nextStep);
    const showCloseButton = stepId === 'checklist';

    const handleNextStepClick = () => {
      if (!nextStep) {
        return;
      }

      setPreviewWorkflowStep(null);
      setPinnedWorkflowStep(nextStep);

      if (isMobile) {
        window.setTimeout(() => {
          scrollToWorkflowStep(nextStep);
        }, 80);
      }
    };

    const handleClosePreview = () => {
      setPreviewWorkflowStep(null);
      setPinnedWorkflowStep(null);
    };

    if (isMobile) {
      return (
        <motion.div
          key={`workflow-preview-${stepId}`}
          id={`workflow-preview-${stepId}`}
          layout
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={containerClassName}
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#355b8a] dark:text-sky-100/80">
                Preview
              </p>
              {showNextStep ? (
                <button
                  type="button"
                  onClick={handleNextStepClick}
                  className="group inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-slate-600 underline underline-offset-4 transition-colors hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-slate-300 dark:hover:text-sky-100"
                >
                  <span>Next Step</span>
                  <motion.span
                    initial={shouldReduceMotion ? false : { x: 0 }}
                    animate={shouldReduceMotion ? { x: 0 } : { x: [0, 0, 4, 0] }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.8, delay: 1.5, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="-ml-1 inline-flex"
                    aria-hidden="true"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </button>
              ) : showCloseButton ? (
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="group inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-slate-300 dark:hover:text-sky-100"
                >
                  <span>Close</span>
                  <X
                    className="-ml-0.5 h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>

            <div>{renderWorkflowPreview(stepId)}</div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`workflow-preview-${stepId}`}
        id="workflow-preview-desktop"
        initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={containerClassName}
      >
        <div className="flex h-[23rem] flex-col space-y-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#355b8a] dark:text-sky-100/80">
              Preview
            </p>
            {showNextStep ? (
              <button
                type="button"
                onClick={handleNextStepClick}
                className="group inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-slate-600 underline underline-offset-4 transition-colors hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-slate-300 dark:hover:text-sky-100"
              >
                <span>Next Step</span>
                <ArrowRight
                  className="-ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            ) : showCloseButton ? (
              <button
                type="button"
                onClick={handleClosePreview}
                className="group inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/25 dark:text-slate-300 dark:hover:text-sky-100"
              >
                <span>Close</span>
                <X
                  className="-ml-0.5 h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1">{renderWorkflowPreview(stepId)}</div>
        </div>
      </motion.div>
    );
  };

  const renderBenefitCard = (benefit: BenefitSpotlight) => {
    const BenefitIcon = benefit.icon;

    return (
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-7 text-left transition-transform duration-300 hover:-translate-y-1 ${benefit.cardClassName}`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${benefit.accentClassName}`}
        />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${benefit.iconClassName}`}
            >
              <BenefitIcon className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-2xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100">
              {benefit.title}
            </h3>
            <p className="text-[0.98rem] leading-7 text-slate-700 dark:text-slate-300">
              {benefit.description}
            </p>
          </div>

          <div className="mt-auto pt-6">
            <Link
              to={`/faq?benefit=${benefit.faqFilterId}`}
              className="group/link inline-flex items-center gap-1 text-sm font-semibold text-[#1e3a5f] underline underline-offset-4 transition-colors hover:text-[#f97316] dark:text-sky-200 dark:hover:text-orange-200"
            >
              Learn more about {benefit.title}
              <ArrowRight
                className="-ml-0.5 h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </article>
    );
  };

  const handleHeroVisualMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const nextY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    hoverX.set(Math.max(-0.55, Math.min(0.55, nextX * 0.55)));
    hoverY.set(Math.max(-0.55, Math.min(0.55, nextY * 0.55)));
  };

  const resetHeroVisualHover = () => {
    hoverX.set(0);
    hoverY.set(0);
  };

  const showNextSlide = () => {
    setActiveSlideIndex((currentIndex) => (currentIndex + 1) % HERO_SLIDES.length);
  };

  const showPreviousSlide = () => {
    setActiveSlideIndex(
      (currentIndex) => (currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  };

  const queueSideCardLayerChange = (
    nextSide: 'left' | 'right' | null,
    delayMs: number
  ) => {
    if (sideCardLayerTimeoutRef.current !== null) {
      window.clearTimeout(sideCardLayerTimeoutRef.current);
    }

    sideCardLayerTimeoutRef.current = window.setTimeout(() => {
      setPromotedSideCard(nextSide);
      sideCardLayerTimeoutRef.current = null;
    }, delayMs);
  };

  const handleSideCardEnter = (side: 'left' | 'right') => {
    if (shouldReduceMotion) {
      setHoveredSideCard(side);
      setPromotedSideCard(side);
      return;
    }

    setHoveredSideCard(side);
    queueSideCardLayerChange(side, 150);
  };

  const handleSideCardLeave = () => {
    setHoveredSideCard(null);

    if (shouldReduceMotion) {
      setPromotedSideCard(null);
      return;
    }

    queueSideCardLayerChange(null, 110);
  };

  const handleHeroTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      return;
    }

    touchStartXRef.current = event.touches[0].clientX;
    touchStartYRef.current = event.touches[0].clientY;
  };

  const handleHeroTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = event.changedTouches[0].clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      return;
    }

    if (deltaX < 0) {
      showNextSlide();
      return;
    }

    showPreviousSlide();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f8fafc] font-sans text-black dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden pb-1 pt-6 sm:pt-8 md:pb-6 md:pt-14 lg:pb-8 lg:pt-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_32%,_rgba(191,219,254,0.7),_transparent_34%),radial-gradient(circle_at_88%_18%,_rgba(254,215,170,0.56),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,0.98)_66%,_rgba(248,250,252,0.94)_100%)] dark:bg-[radial-gradient(circle_at_14%_32%,_rgba(56,189,248,0.16),_transparent_32%),radial-gradient(circle_at_88%_18%,_rgba(251,146,60,0.16),_transparent_22%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.98)_66%,_rgba(15,23,42,0.95)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#f8fafc]/82 to-[#f8fafc] dark:via-slate-900/80 dark:to-slate-900/72" />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-[2%] top-20 hidden h-56 w-56 rounded-full bg-[#dbeafe] blur-3xl lg:block dark:bg-sky-400/18"
            animate={shouldReduceMotion ? undefined : { x: [0, 14, 0], y: [0, -10, 0] }}
            transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
          />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] top-12 hidden h-64 w-64 rounded-full bg-[#fed7aa] blur-3xl lg:block dark:bg-orange-300/12"
            animate={shouldReduceMotion ? undefined : { x: [0, -12, 0], y: [0, 10, 0] }}
            transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity }}
          />

          <div className="relative mx-auto max-w-7xl px-3 sm:px-6">
            <div className="grid items-center gap-4 sm:gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-x-10 lg:gap-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="order-1 relative z-10 text-center lg:col-start-1 lg:row-start-1 lg:text-left"
              >
                <div className="mb-4 inline-flex whitespace-nowrap rounded-full border border-[#fb923c]/55 bg-[linear-gradient(135deg,rgba(219,234,254,0.72),rgba(255,255,255,0.95)_38%,rgba(255,237,213,0.96))] px-2.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#355b8a] shadow-[0_12px_28px_-22px_rgba(194,65,12,0.28)] ring-1 ring-white/70 backdrop-blur sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.18em] dark:border-orange-300/28 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.92),rgba(15,23,42,0.84)_40%,rgba(194,65,12,0.34))] dark:text-sky-100 dark:ring-white/5">
                  Massachusetts Benefits Screener, for Students
                </div>

                <h1
                  id="landing-hero-heading"
                  className="max-w-4xl text-[2.7rem] font-bold leading-[0.97] tracking-tight text-[#1e3a5f] dark:text-slate-100 sm:text-4xl md:text-6xl md:leading-[0.95] lg:text-[5.15rem]"
                >
                  Discover{' '}
                  <span className="bg-gradient-to-r from-[#1e3a5f] to-[#f97316] bg-clip-text text-transparent dark:from-sky-200 dark:to-orange-300">
                    Benefits
                  </span>{' '}
                  You May Qualify For
                </h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 }}
                  className="mx-auto mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-[#1e3a5f]/88 dark:text-sky-100/86 sm:mt-5 sm:text-lg md:text-2xl lg:mx-0 lg:max-w-[32rem] xl:max-w-3xl"
                >
                  A simple, secure way to check your eligibility for student aid,
                  food assistance, MBTA discounts and more. Find programs to explore
                  and next steps to take in minutes.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.2 }}
                  className="mt-5 sm:mt-7 md:mt-10"
                >
                  <Link to="/screener">
                    <Button
                      size="lg"
                      className="group min-h-12 cursor-pointer rounded-full bg-[#f97316] px-9 py-5.5 text-[1.12rem] text-white shadow-[0_10px_26px_-10px_rgba(249,115,22,0.52)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#ea580c] hover:shadow-[0_24px_36px_-12px_rgba(249,115,22,0.58)] sm:px-10 sm:py-7 sm:text-xl dark:shadow-[0_14px_34px_-14px_rgba(251,146,60,0.6)] dark:hover:shadow-[0_24px_40px_-16px_rgba(251,146,60,0.76)] md:px-12 md:py-8 md:text-[1.35rem]"
                    >
                      Start Screening
                      <ArrowRight
                        className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
                        aria-hidden="true"
                      />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <div
                aria-labelledby="landing-hero-heading"
                aria-describedby={`${heroCarouselInstructionsId} ${heroCarouselStatusId}`}
                aria-roledescription="carousel"
                className="order-3 relative mx-auto w-full max-w-[34rem] sm:max-w-[58rem] lg:col-start-2 lg:row-span-2 lg:max-w-[58rem]"
                onMouseMove={handleHeroVisualMove}
                onMouseLeave={resetHeroVisualHover}
                onTouchStart={handleHeroTouchStart}
                onTouchEnd={handleHeroTouchEnd}
                style={{ touchAction: 'pan-y pinch-zoom' }}
              >
                <p id={heroCarouselInstructionsId} className="sr-only">
                  This is a rotating hero carousel. Use the previous and next slide
                  buttons, slide indicators, or swipe on touch devices.
                </p>
                <p
                  id={heroCarouselStatusId}
                  className="sr-only"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {carouselAnnouncement}
                </p>

                <motion.div
                  className="absolute -left-2 top-10 hidden w-72 transform-gpu overflow-hidden rounded-[2rem] border border-white/85 bg-white/92 p-2.5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900/84 dark:shadow-[0_34px_96px_-44px_rgba(2,6,23,0.92)] md:block lg:-left-10 xl:-left-24"
                  style={{
                    x: shouldReduceMotion ? 0 : leftCardX,
                    y: shouldReduceMotion ? 0 : leftCardY,
                    rotate: shouldReduceMotion ? 0 : leftCardRotate,
                    scale: shouldReduceMotion ? 1 : leftCardScale,
                    zIndex: promotedSideCard === 'left' ? 30 : 0,
                  }}
                  onHoverStart={() => handleSideCardEnter('left')}
                  onHoverEnd={handleSideCardLeave}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          x: -18,
                          y: -4,
                          scale: 1.1,
                          boxShadow: '0 42px 110px -42px rgba(15,23,42,0.58)',
                        }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 24,
                    mass: 0.78,
                  }}
                >
                  <div
                    role="img"
                    aria-label={leftBackdropAlt}
                    className="aspect-[16/10] w-full rounded-[1.5rem] bg-cover bg-center saturate-[0.9] contrast-[0.92] brightness-[0.98] blur-[0.35px]"
                    style={{ backgroundImage: `url(${leftBackdropImage})` }}
                  />
                </motion.div>

                <motion.div
                  className="absolute -right-1 bottom-10 hidden w-80 transform-gpu overflow-hidden rounded-[2rem] border border-white/85 bg-white/92 p-2.5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900/84 dark:shadow-[0_34px_96px_-44px_rgba(2,6,23,0.92)] sm:block lg:-right-10 xl:-right-24"
                  style={{
                    x: shouldReduceMotion ? 0 : rightCardX,
                    y: shouldReduceMotion ? 0 : rightCardY,
                    rotate: shouldReduceMotion ? 0 : rightCardRotate,
                    scale: shouldReduceMotion ? 1 : rightCardScale,
                    zIndex: promotedSideCard === 'right' ? 30 : 0,
                  }}
                  onHoverStart={() => handleSideCardEnter('right')}
                  onHoverEnd={handleSideCardLeave}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          x: 18,
                          y: 4,
                          scale: 1.1,
                          boxShadow: '0 42px 110px -42px rgba(15,23,42,0.58)',
                        }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 24,
                    mass: 0.78,
                  }}
                >
                  <div
                    role="img"
                    aria-label={rightBackdropAlt}
                    className="aspect-[16/10] w-full rounded-[1.5rem] bg-cover bg-center saturate-[0.9] contrast-[0.92] brightness-[0.98] blur-[0.35px]"
                    style={{ backgroundImage: `url(${rightBackdropImage})` }}
                  />
                </motion.div>

                <motion.div
                  className="relative z-10 overflow-hidden rounded-[2rem] border border-white/78 bg-white/90 p-2 shadow-[0_40px_120px_-58px_rgba(15,23,42,0.46)] backdrop-blur dark:border-white/10 dark:bg-slate-900/78 dark:shadow-[0_40px_120px_-58px_rgba(2,6,23,0.9)] md:rounded-[2.35rem] md:p-3"
                  animate={
                    shouldReduceMotion
                      ? { x: 0 }
                      : hoveredSideCard === 'left'
                      ? { x: 12 }
                      : hoveredSideCard === 'right'
                      ? { x: -12 }
                      : { x: 0 }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 24,
                    mass: 0.8,
                  }}
                >
                  <div
                    id={heroCarouselRegionId}
                    className="relative aspect-[16/11] overflow-hidden rounded-[1.45rem] bg-slate-200 dark:bg-slate-800 sm:aspect-[16/10] md:rounded-[1.85rem]"
                  >
                    {HERO_SLIDES.map((slide, index) => {
                      const isActive = activeSlideIndex === index;

                      return (
                        <motion.div
                          key={slide.alt}
                          className={`absolute inset-0 ${isActive ? 'z-10' : 'z-0'}`}
                          initial={false}
                          animate={{ opacity: isActive ? 1 : 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0.2 : 0.45,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                          aria-hidden={!isActive}
                        >
                          <motion.div
                            className="absolute inset-0 will-change-transform"
                            style={{
                              x: shouldReduceMotion ? 0 : imageX,
                              y: shouldReduceMotion ? 0 : imageY,
                            }}
                          >
                            <motion.div
                              role="img"
                              aria-label={slide.alt}
                              className="absolute inset-0 h-full w-full bg-cover will-change-transform saturate-[0.92] contrast-[0.93] brightness-[0.985] blur-[0.4px]"
                              style={{
                                backgroundImage: `url(${slide.src})`,
                                backgroundPosition: slide.objectPosition,
                              }}
                              initial={false}
                              animate={
                                shouldReduceMotion || !isActive
                                  ? { scale: 1.02 }
                                  : { scale: [1.035, 1.055, 1.04, 1.06, 1.035] }
                              }
                              transition={
                                shouldReduceMotion || !isActive
                                  ? { duration: 0 }
                                  : {
                                      duration: 13.5,
                                      ease: 'easeInOut',
                                      repeat: Infinity,
                                    }
                              }
                            />
                          </motion.div>

                          <div className="absolute inset-0 bg-white/[0.04] dark:bg-slate-950/[0.04]" />
                          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#08131f] via-[#08131f]/42 to-transparent sm:h-44" />
                        </motion.div>
                      );
                    })}

                    <div className="absolute inset-y-0 left-0 z-20 flex items-center pl-2 sm:pl-3">
                      <button
                        type="button"
                        onClick={showPreviousSlide}
                        aria-label="Show previous slide"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="absolute inset-y-0 right-0 z-20 flex items-center pr-2 sm:pr-3">
                      <button
                        type="button"
                        onClick={showNextSlide}
                        aria-label="Show next slide"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2.5 sm:p-5 md:p-6">
                      <div className="grid max-w-[12.5rem] grid-cols-1 gap-2.5 rounded-[0.95rem] border border-white/10 bg-[#08131f]/72 p-2.5 text-left text-white shadow-[0_18px_50px_-32px_rgba(8,19,31,0.92)] sm:max-w-none sm:min-h-[7.5rem] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4 sm:rounded-[1.35rem] sm:p-4">
                        <div className="max-w-[10.5rem] min-h-0 sm:max-w-md sm:min-h-[4.75rem]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-200 sm:text-xs sm:tracking-[0.22em]">
                            {activeSlide.eyebrow}
                          </p>
                          <p className="mt-1 text-[11px] leading-[1.45] text-white/88 sm:mt-2 sm:text-sm md:text-base">
                            {activeSlide.caption}
                          </p>
                        </div>

                        <div className="justify-self-start rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-medium text-white/85 sm:justify-self-end sm:px-3 sm:py-1.5 sm:text-xs">
                          Student-first support
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 px-1.5 pb-1 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:pt-4">
                    <div className="flex items-center gap-2" role="group" aria-label="Hero slide controls">
                      {HERO_SLIDES.map((slide, index) => {
                        const isActive = activeSlideIndex === index;

                        return (
                          <button
                            key={slide.alt}
                            type="button"
                            aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                            aria-current={isActive ? 'true' : undefined}
                            aria-pressed={isActive}
                            aria-controls={heroCarouselRegionId}
                            onClick={() => setActiveSlideIndex(index)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/25 dark:focus-visible:ring-sky-200/30"
                          >
                            <span
                              aria-hidden="true"
                              className={`block rounded-full transition-all ${
                                isActive
                                  ? 'h-2.5 w-8 bg-[#1e3a5f] dark:bg-sky-200'
                                  : 'h-2.5 w-2.5 bg-gray-300 dark:bg-slate-700'
                              }`}
                            />
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setIsHeroAutoplayEnabled((current) => !current)}
                        aria-label={isHeroAutoplayEnabled ? 'Pause slideshow' : 'Play slideshow'}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-[#1e3a5f] transition-colors hover:border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/35 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-950 dark:text-sky-100 dark:hover:border-sky-200 dark:hover:bg-slate-900"
                      >
                        {isHeroAutoplayEnabled ? (
                          <Pause className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Play className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                      Massachusetts students, clearer paths to benefits
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3 }}
                className="order-2 mt-1 flex flex-col items-center gap-1.5 sm:mt-3 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:items-start"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#355b8a] dark:text-sky-100/90 sm:text-sm">
                    Select Benefits to Screen For
                  </p>
                </div>

                <div
                  className="-mx-3 flex flex-wrap justify-center gap-0.5 sm:mx-0 sm:gap-2 lg:justify-start"
                  role="group"
                  aria-label="Select benefits to screen for"
                >
                  {HERO_BENEFIT_FILTERS.map((filterOption) => {
                    const isActive =
                      isAllBenefitFilterSelected ||
                      screeningBenefitFilters.includes(filterOption.id);

                    return (
                      <button
                        key={filterOption.id}
                        type="button"
                        aria-pressed={isActive}
                        aria-label={filterOption.label}
                        onClick={() => handleBenefitFilterToggle(filterOption.id)}
                        className={getBenefitFilterChipClassName(isActive)}
                      >
                        <span
                          className={`absolute left-3 flex h-4 w-4 shrink-0 items-center justify-center transition-[opacity,transform] duration-200 ease-out sm:left-4 ${
                            isActive
                              ? 'scale-100 text-white/90 opacity-100 dark:text-slate-950/82'
                              : 'scale-75 opacity-0'
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                        <span
                          className={`transition-transform duration-200 ease-out ${
                            isActive ? 'translate-x-2' : 'translate-x-0'
                          }`}
                        >
                          {filterOption.mobileLabel ? (
                            <>
                              <span className="sm:hidden">{filterOption.mobileLabel}</span>
                              <span className="hidden sm:inline">{filterOption.label}</span>
                            </>
                          ) : (
                            filterOption.label
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="px-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:px-0">
                  Not sure? Select All to screen for every program, or{' '}
                  <a
                    href="#benefits-heading"
                    onClick={handleBenefitsAnchorClick}
                    className="font-semibold text-[#1e3a5f] underline underline-offset-4 transition-colors hover:text-[#f97316] dark:text-sky-200 dark:hover:text-orange-200"
                  >
                    learn what each benefit means
                  </a>
                  .
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative -mt-3 border-t border-gray-100 bg-gradient-to-b from-[#f8fafc] via-gray-50 to-gray-50 px-6 pb-16 pt-6 dark:border-white/10 dark:from-slate-900/72 dark:via-slate-900/62 dark:to-slate-900/60 md:pb-20 md:pt-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Click to see a preview of each step
              </p>
            </div>
            <div className="grid items-start gap-6 text-center md:grid-cols-3 md:gap-8 lg:gap-10">
              {WORKFLOW_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = activeWorkflowStep === step.id;
                const isPinned = pinnedWorkflowStep === step.id;

                return (
                  <motion.div
                    key={step.id}
                    id={`workflow-step-${step.id}`}
                    className={isMobile ? 'self-start' : undefined}
                    {...(isMobile
                      ? getTightMobileRevealProps(
                          0.01 + index * 0.03,
                          '0px 0px 10% 0px',
                          20
                        )
                      : getLandingRevealProps(0.02 + index * 0.06, 0.26, 24))}
                  >
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const nextPinnedWorkflowStep =
                          pinnedWorkflowStep === step.id ? null : step.id;

                        setPinnedWorkflowStep(nextPinnedWorkflowStep);

                        if (isMobile) {
                          setPreviewWorkflowStep(null);
                        }

                        if (nextPinnedWorkflowStep) {
                          scrollWorkflowPreviewIntoView(nextPinnedWorkflowStep);
                        }
                      }}
                      onFocus={() => {
                        if (!isMobile) {
                          setPreviewWorkflowStep(step.id);
                        }
                      }}
                      onBlur={() => {
                        if (!isMobile) {
                          setPreviewWorkflowStep(null);
                        }
                      }}
                      onMouseEnter={() => setPreviewWorkflowStep(step.id)}
                      onMouseLeave={() => {
                        if (!isMobile) {
                          setPreviewWorkflowStep(null);
                        }
                      }}
                      className={`group relative flex w-full cursor-pointer flex-col items-center space-y-5 rounded-2xl border p-8 pt-10 text-center transition-[border-color,background-color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc] dark:focus-visible:ring-sky-200/25 dark:focus-visible:ring-offset-slate-950 ${
                        isMobile ? 'min-h-[14rem]' : 'h-full md:p-10 md:pt-12'
                      } ${
                        isActive
                          ? 'border-[#1e3a5f]/18 bg-white dark:border-sky-200/18 dark:bg-slate-900'
                          : 'border-transparent hover:border-[#1e3a5f]/10 hover:bg-white dark:hover:border-sky-200/12 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span
                        className={`absolute left-5 top-5 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-bold transition-colors duration-300 ${
                          isActive
                            ? 'border-[#1e3a5f]/18 bg-[#eff6ff] text-[#1e3a5f] dark:border-sky-200/18 dark:bg-sky-200/12 dark:text-sky-100'
                            : 'border-[#1e3a5f]/10 bg-white/80 text-[#355b8a] dark:border-sky-200/12 dark:bg-slate-950/60 dark:text-sky-200'
                        }`}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div
                        className={`mb-2 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-[1.04] md:h-20 md:w-20 ${step.iconClassName}`}
                      >
                        <StepIcon className="h-8 w-8 text-white md:h-9 md:w-9" aria-hidden="true" />
                      </div>
                      {isPinned && !isMobile ? (
                        <Pin className="absolute right-5 top-5 h-5 w-5 text-[#1e3a5f] dark:text-sky-100" aria-hidden="true" />
                      ) : null}
                      <span className="text-xl font-bold text-[#1e3a5f] dark:text-slate-100 md:text-2xl">
                        {step.title}
                      </span>
                      <p className="max-w-sm text-gray-700 dark:text-slate-300 md:text-lg">
                        {step.description}
                      </p>
                    </button>
                    {isMobile && activeWorkflowStep === step.id
                      ? renderWorkflowPreviewPanel(step.id, 'mt-5')
                      : null}
                  </motion.div>
                );
              })}
            </div>

            {!isMobile ? (
              <div className="mx-auto mt-8 max-w-3xl md:mt-10">
                <AnimatePresence mode="wait" initial={false}>
                  {activeWorkflowStep
                    ? renderWorkflowPreviewPanel(activeWorkflowStep, '')
                    : null}
                </AnimatePresence>
              </div>
            ) : null}

            <motion.div
              {...getLandingRevealProps(0.18, 0.22, 18)}
              className="mx-auto mt-8 max-w-5xl md:mt-10"
            >
              <div className="flex flex-col gap-4 rounded-2xl border border-[#1e3a5f]/10 bg-white/82 px-5 py-4 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.2)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-sky-200/12 dark:bg-slate-900/78 dark:shadow-[0_24px_60px_-40px_rgba(2,6,23,0.92)]">
                <p className="max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-slate-300 sm:text-[0.95rem]">
                  <span className="font-semibold text-[#1e3a5f] dark:text-slate-100">
                    We respect your privacy.
                  </span>{' '}
                  We only collect what the screener and checklist need to work.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/privacy"
                    className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-[#1e3a5f] underline-offset-4 transition-colors hover:text-[#16304f] hover:underline dark:text-sky-200 dark:hover:text-sky-100"
                  >
                    Learn more
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>

                  <Link
                    to="/accessibility"
                    className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-[#1e3a5f] underline-offset-4 transition-colors hover:text-[#16304f] hover:underline dark:text-sky-200 dark:hover:text-sky-100"
                  >
                    Accessibility statement
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          aria-labelledby="benefits-heading"
          className="relative overflow-hidden border-t border-gray-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_28%,#ffffff_100%)] px-6 py-16 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.96)_30%,rgba(2,6,23,0.98)_100%)] md:py-20"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(191,219,254,0.32),transparent_30%),radial-gradient(circle_at_84%_22%,rgba(254,215,170,0.3),transparent_26%),radial-gradient(circle_at_50%_88%,rgba(224,231,255,0.26),transparent_34%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.1),transparent_28%),radial-gradient(circle_at_84%_22%,rgba(251,146,60,0.1),transparent_24%),radial-gradient(circle_at_50%_88%,rgba(99,102,241,0.12),transparent_32%)]" />
          <div className="relative mx-auto max-w-7xl">
            {isMobile ? (
              <>
                <motion.div
                  {...getLandingRevealProps(0.04, 0.24, 26)}
                  className="mx-auto max-w-3xl text-center"
                >
                  <h2
                    id="benefits-heading"
                    className="text-3xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100 md:text-4xl"
                  >
                    Popular Massachusetts benefits students often ask about
                  </h2>
                  <p className="mt-4 text-lg text-gray-700 dark:text-slate-300">
                    CommonMASS helps organize information about major programs in one
                    place, so students can compare options without bouncing between
                    multiple websites.
                  </p>
                </motion.div>

                <div className="mx-auto mt-8 grid max-w-[72rem] gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {BENEFIT_SPOTLIGHTS.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      {...getTightMobileRevealProps(
                        0.03 + Math.min(index * 0.025, 0.12),
                        '0px 0px 12% 0px'
                      )}
                      className="h-full"
                    >
                      {renderBenefitCard(benefit)}
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <motion.div
                  {...getLandingRevealProps(0.04, 0.24, 26)}
                  className="mx-auto max-w-3xl text-center"
                >
                  <h2
                    id="benefits-heading"
                    className="text-3xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100 md:text-4xl"
                  >
                    Popular Massachusetts benefits students often ask about
                  </h2>
                  <p className="mt-4 text-lg text-gray-700 dark:text-slate-300">
                    CommonMASS helps organize information about major programs in one
                    place, so students can compare options without bouncing between
                    multiple websites.
                  </p>
                </motion.div>

                <div className="mx-auto mt-12 grid max-w-[72rem] gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {BENEFIT_SPOTLIGHTS.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      {...getLandingRevealProps(Math.min(index * 0.05, 0.2), 0.22, 24)}
                      className="h-full"
                    >
                      {renderBenefitCard(benefit)}
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            <motion.div
              {...getLandingRevealProps(0.08, 0.22, 24)}
              className="mt-12"
            >
              <div className="rounded-3xl border border-[#1e3a5f]/10 bg-gradient-to-r from-[#eff6ff] to-[#fff7ed] p-8 dark:border-sky-200/10 dark:from-slate-900 dark:to-slate-900">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-slate-100">
                      Start with a quick screening
                    </h2>
                    <p className="mt-3 max-w-3xl text-gray-700 dark:text-slate-300">
                      CommonMASS does not replace official benefit agencies or schools.
                      It helps students understand what programs may be worth
                      exploring first, then points them toward the next steps.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link to="/screener">
                      <Button className="min-h-11 rounded-full bg-[#1e3a5f] px-6 py-5 text-white hover:bg-[#16304f] dark:bg-sky-200 dark:text-slate-950 dark:hover:bg-sky-100">
                        Go to Screener
                      </Button>
                    </Link>

                    <Link
                      to="/faq"
                      className="inline-flex min-h-11 items-center rounded-full border border-[#1e3a5f]/15 bg-white px-6 py-3 text-sm font-semibold text-[#1e3a5f] shadow-sm transition-all hover:bg-[#f8fafc] dark:border-sky-200/20 dark:bg-slate-950 dark:text-sky-200 dark:hover:bg-slate-900"
                    >
                      Read FAQs
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <div className="bg-white px-6 pb-10 pt-2 text-center dark:bg-slate-950">
        <button
          type="button"
          onClick={handleBackToTopClick}
          className="group inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1e3a5f] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1e3a5f]/20 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:text-sky-200 dark:focus-visible:ring-sky-200/25 dark:focus-visible:ring-offset-slate-950"
        >
          <ArrowUp
            className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-1"
            aria-hidden="true"
          />
          Back to top
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}
