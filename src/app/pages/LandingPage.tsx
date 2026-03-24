import { type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Banknote,
  Bus,
  CheckSquare,
  FileText,
  HeartPulse,
  ListChecks,
  PiggyBank,
  Plus,
  Utensils,
} from 'lucide-react';
import bostonDayImage from '@/assets/Images/Boston Day.jpg';
import bostonSkylineEveningImage from '@/assets/Images/Boston Skyline Evening.jpg';
import bostonSkylineNightImage from '@/assets/Images/Boston Skyline Night.jpg';
import bostonSkylineImage from '@/assets/Images/Boston Skyline.jpg';
import studentsImage from '@/assets/Images/Students.jpg';
import studentsTwoImage from '@/assets/Images/Students2.jpg';
import studentsThreeImage from '@/assets/Images/Students3.jpg';
import { Navbar } from '@/app/components/layout/Navbar';
import { Button } from '@/app/components/ui/button';
import { useIsMobile } from '@/app/components/ui/use-mobile';
import { useTheme } from '@/app/context/ThemeContext';

const HERO_SLIDES = [
  {
    src: studentsImage,
    alt: 'Students working together at a computer.',
    eyebrow: 'Guided Screening',
    caption: 'Answer a short set of questions and surface the benefits that fit your situation.',
    objectPosition: 'center 42%',
  },
  {
    src: studentsTwoImage,
    alt: 'College students talking around a table with laptops.',
    eyebrow: 'Clear Next Steps',
    caption: 'Turn confusing programs into a shortlist you can actually act on.',
    objectPosition: 'center 38%',
  },
  {
    src: studentsThreeImage,
    alt: 'Students studying together outdoors.',
    eyebrow: 'Built For Students',
    caption: 'Compare help like Pell, SNAP, MassHealth, and transit discounts in one place.',
    objectPosition: 'center 35%',
  },
] as const;

type BenefitSpotlight = (typeof BENEFIT_SPOTLIGHTS)[number];

const HERO_BADGES = [
  'Pell Grant',
  'MASSGrant',
  'MASSGrant Plus',
  'SNAP',
  'MassHealth',
  'MBTA Student Pass',
] as const;

const BENEFIT_SPOTLIGHTS = [
  {
    title: 'Pell Grant',
    faqFilterId: 'pell-grant',
    description:
      'Federal Pell Grants may help eligible undergraduate students pay for tuition, fees, books, and other school costs.',
    icon: PiggyBank,
    cardClassName:
      'border-[#d9f99d] bg-[linear-gradient(145deg,rgba(254,252,232,0.98),rgba(255,255,255,0.98)_48%,rgba(236,252,203,0.88))] shadow-[0_18px_44px_-34px_rgba(101,163,13,0.26)] dark:border-lime-300/18 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.98)_54%,rgba(101,163,13,0.2))]',
    iconClassName: 'bg-[#4d7c0f] text-white dark:bg-lime-300 dark:text-slate-950',
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
    iconClassName: 'bg-[#f97316] text-white dark:bg-orange-300 dark:text-slate-950',
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
    iconClassName: 'bg-[#4f46e5] text-white dark:bg-indigo-300 dark:text-slate-950',
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
    iconClassName: 'bg-[#2563eb] text-white dark:bg-sky-300 dark:text-slate-950',
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
    iconClassName: 'bg-[#166534] text-white dark:bg-emerald-300 dark:text-slate-950',
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
    iconClassName: 'bg-[#dc2626] text-white dark:bg-rose-300 dark:text-slate-950',
    accentClassName: 'from-[#fb7185]/48 via-[#fda4af]/22 to-transparent',
  },
] as const;

export default function LandingPage() {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hoveredSideCard, setHoveredSideCard] = useState<'left' | 'right' | null>(null);
  const [promotedSideCard, setPromotedSideCard] = useState<'left' | 'right' | null>(null);
  const sideCardLayerTimeoutRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);
  const smoothHoverX = useSpring(hoverX, { stiffness: 180, damping: 24, mass: 0.45 });
  const smoothHoverY = useSpring(hoverY, { stiffness: 180, damping: 24, mass: 0.45 });
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
    if (shouldReduceMotion || HERO_SLIDES.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      showNextSlide();
    }, 9200);

    return () => window.clearInterval(intervalId);
  }, [shouldReduceMotion]);

  useEffect(() => {
    return () => {
      if (sideCardLayerTimeoutRef.current !== null) {
        window.clearTimeout(sideCardLayerTimeoutRef.current);
      }
    };
  }, []);

  const activeSlide = HERO_SLIDES[activeSlideIndex];
  const leftBackdropImage = theme === 'dark' ? bostonSkylineEveningImage : bostonDayImage;
  const rightBackdropImage = theme === 'dark' ? bostonSkylineNightImage : bostonSkylineImage;
  const leftBackdropAlt = theme === 'dark' ? 'Boston skyline in the evening.' : 'Boston skyline during the day.';
  const rightBackdropAlt = theme === 'dark' ? 'Boston skyline at night.' : 'Boston skyline in daylight.';
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

  const getTightMobileRevealProps = (delay = 0, margin = '0px 0px 18% 0px', distance = 22) =>
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

  const renderBenefitCard = (benefit: BenefitSpotlight) => {
    const Icon = benefit.icon;

    return (
      <article className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_58px_-34px_rgba(15,23,42,0.34)] dark:hover:shadow-[0_28px_70px_-36px_rgba(2,6,23,0.9)] ${benefit.cardClassName}`}>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-6 top-0 h-28 rounded-b-[2rem] bg-gradient-to-b opacity-80 blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${benefit.accentClassName}`}
        />

        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_18px_36px_-22px_rgba(15,23,42,0.65)] transition-transform duration-300 group-hover:scale-110 ${benefit.iconClassName}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="relative mt-5 text-2xl font-bold text-[#1e3a5f] dark:text-slate-100">
          {benefit.title}
        </h3>

        <p className="relative mt-3 leading-relaxed text-gray-600 dark:text-slate-300">
          {benefit.description}
        </p>

        <div className="relative mt-auto pt-5">
          <Link
            to={`/faq?benefit=${benefit.faqFilterId}`}
            className="inline-flex items-center text-sm font-semibold text-[#1e3a5f] underline underline-offset-4 transition-colors hover:text-[#16304f] dark:text-sky-200 dark:hover:text-orange-200"
          >
            Learn more in the FAQ
          </Link>
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
    setActiveSlideIndex((currentIndex) => (currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const queueSideCardLayerChange = (nextSide: 'left' | 'right' | null, delayMs: number) => {
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

      <main>
        <section className="relative overflow-hidden pb-4 pt-10 md:pb-6 md:pt-14 lg:pb-8 lg:pt-16">
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

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-x-10 lg:gap-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="relative z-10 text-center lg:col-start-1 lg:row-start-1 lg:text-left"
            >
              <div className="mb-5 inline-flex rounded-full border border-[#fb923c]/55 bg-[linear-gradient(135deg,rgba(219,234,254,0.72),rgba(255,255,255,0.95)_38%,rgba(255,237,213,0.96))] px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#355b8a] shadow-[0_12px_28px_-22px_rgba(194,65,12,0.28)] ring-1 ring-white/70 backdrop-blur dark:border-orange-300/28 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.92),rgba(15,23,42,0.84)_40%,rgba(194,65,12,0.34))] dark:text-sky-100 dark:ring-white/5">
                Massachusetts Benefits Screener, for Students
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-[#1e3a5f] dark:text-slate-100 md:text-6xl md:leading-[0.95] lg:text-[5.15rem]">
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
                className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-slate-300 md:text-2xl lg:mx-0"
              >
                A simple, secure way to check your eligibility for student aid, food assistance, MBTA
                discounts and more. Get matched in minutes.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-10"
              >
                <Link to="/screener">
                  <Button
                    size="lg"
                    className="group cursor-pointer rounded-full bg-[#f97316] px-10 py-7 text-xl text-white shadow-[0_10px_26px_-10px_rgba(249,115,22,0.52)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#ea580c] hover:shadow-[0_24px_36px_-12px_rgba(249,115,22,0.58)] dark:shadow-[0_14px_34px_-14px_rgba(251,146,60,0.6)] dark:hover:shadow-[0_24px_40px_-16px_rgba(251,146,60,0.76)] md:px-12 md:py-8 md:text-[1.35rem]"
                  >
                    Start Screening
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Button>
                </Link>
              </motion.div>

            </motion.div>

            <div className="relative mx-auto w-full max-w-[58rem] lg:col-start-2 lg:row-span-2" onMouseMove={handleHeroVisualMove} onMouseLeave={resetHeroVisualHover} onTouchStart={handleHeroTouchStart} onTouchEnd={handleHeroTouchEnd} style={{ touchAction: 'pan-y pinch-zoom' }}>
              <motion.div
                className="absolute -left-2 top-10 hidden w-72 transform-gpu overflow-hidden rounded-[2rem] border border-white/85 bg-white/92 p-2.5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900/84 dark:shadow-[0_34px_96px_-44px_rgba(2,6,23,0.92)] md:block lg:-left-24"
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
                transition={{ type: 'spring', stiffness: 200, damping: 24, mass: 0.78 }}
              >
                <div
                  role="img"
                  aria-label={leftBackdropAlt}
                  className="aspect-[16/10] w-full rounded-[1.5rem] bg-cover bg-center saturate-[0.9] contrast-[0.92] brightness-[0.98] blur-[0.35px]"
                  style={{ backgroundImage: `url(${leftBackdropImage})` }}
                />
              </motion.div>

              <motion.div
                className="absolute -right-1 bottom-10 hidden w-80 transform-gpu overflow-hidden rounded-[2rem] border border-white/85 bg-white/92 p-2.5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900/84 dark:shadow-[0_34px_96px_-44px_rgba(2,6,23,0.92)] sm:block lg:-right-24"
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
                transition={{ type: 'spring', stiffness: 200, damping: 24, mass: 0.78 }}
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
                transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.8 }}
              >
                <div className="relative aspect-[5/6] overflow-hidden rounded-[1.6rem] bg-slate-200 dark:bg-slate-800 sm:aspect-[16/10] md:rounded-[1.85rem]">
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
                                : { duration: 13.5, ease: 'easeInOut', repeat: Infinity }
                            }
                          />
                        </motion.div>

                        <div className="absolute inset-0 bg-white/[0.04] dark:bg-slate-950/[0.04]" />
                        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#08131f] via-[#08131f]/42 to-transparent sm:h-44" />
                      </motion.div>
                    );
                  })}

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

                <div className="flex flex-col gap-3 px-1.5 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:pt-4">
                  <div className="flex items-center gap-2">
                    {HERO_SLIDES.map((slide, index) => {
                      const isActive = activeSlideIndex === index;

                      return (
                        <button
                          key={slide.alt}
                          type="button"
                          aria-label={`Show slide ${index + 1}`}
                          aria-pressed={isActive}
                          onClick={() => setActiveSlideIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            isActive
                              ? 'w-8 bg-[#1e3a5f] dark:bg-sky-200'
                              : 'w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-500'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Massachusetts students, clearer paths to benefits
                  </p>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="mt-1 flex flex-wrap justify-center gap-3 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:justify-start"
            >
              {HERO_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-gray-200 bg-white/92 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative -mt-3 border-t border-gray-100 bg-gradient-to-b from-[#f8fafc] via-gray-50 to-gray-50 px-6 pb-16 pt-6 dark:border-white/10 dark:from-slate-900/72 dark:via-slate-900/62 dark:to-slate-900/60 md:pb-20 md:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 text-center md:grid-cols-3 md:gap-12 lg:gap-14">
            <motion.div {...(isMobile ? getTightMobileRevealProps(0.01, '0px 0px 10% 0px', 20) : getLandingRevealProps(0.02, 0.26, 24))}>
              <div className="group flex cursor-default flex-col items-center space-y-5 rounded-2xl p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:bg-slate-900 dark:hover:shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)] md:p-10 md:hover:-translate-y-2">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                  <FileText className="h-8 w-8 text-white md:h-9 md:w-9" />
                </div>
                <h3 className="text-xl font-bold text-[#1e3a5f] dark:text-slate-100 md:text-2xl">Answer Questions</h3>
                <p className="max-w-sm text-gray-600 dark:text-slate-300 md:text-lg">
                  Complete a brief questionnaire about your student status and needs.
                </p>
              </div>
            </motion.div>

            <motion.div {...(isMobile ? getTightMobileRevealProps(0.04, '0px 0px 10% 0px', 20) : getLandingRevealProps(0.08, 0.26, 24))}>
              <div className="group flex cursor-default flex-col items-center space-y-5 rounded-2xl p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:bg-slate-900 dark:hover:shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)] md:p-10 md:hover:-translate-y-2">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#f97316] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                  <ListChecks className="h-8 w-8 text-white md:h-9 md:w-9" />
                </div>
                <h3 className="text-xl font-bold text-[#1e3a5f] dark:text-slate-100 md:text-2xl">See Matches</h3>
                <p className="max-w-sm text-gray-600 dark:text-slate-300 md:text-lg">
                  Instantly view benefits programs you may be eligible for.
                </p>
              </div>
            </motion.div>

            <motion.div {...(isMobile ? getTightMobileRevealProps(0.07, '0px 0px 10% 0px', 20) : getLandingRevealProps(0.14, 0.26, 24))}>
              <div className="group flex cursor-default flex-col items-center space-y-5 rounded-2xl p-8 transition-all hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:bg-slate-900 dark:hover:shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)] md:p-10 md:hover:-translate-y-2">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                  <CheckSquare className="h-8 w-8 text-white md:h-9 md:w-9" />
                </div>
                <h3 className="text-xl font-bold text-[#1e3a5f] dark:text-slate-100 md:text-2xl">Get Checklist</h3>
                <p className="max-w-sm text-gray-600 dark:text-slate-300 md:text-lg">
                  Download a personalized checklist to help you apply.
                </p>
              </div>
            </motion.div>
          </div>
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
                <p className="mt-4 text-lg text-gray-600 dark:text-slate-300">
                  CommonMASS helps organize information about major programs in one place, so students can
                  compare options without bouncing between multiple websites.
                </p>
              </motion.div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {BENEFIT_SPOTLIGHTS.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    {...getTightMobileRevealProps(0.03 + Math.min(index * 0.025, 0.12), '0px 0px 12% 0px')}
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
                <p className="mt-4 text-lg text-gray-600 dark:text-slate-300">
                  CommonMASS helps organize information about major programs in one place, so students can
                  compare options without bouncing between multiple websites.
                </p>
              </motion.div>

              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

          <motion.div {...getLandingRevealProps(0.08, 0.22, 24)} className="mt-12">
            <div className="rounded-3xl border border-[#1e3a5f]/10 bg-gradient-to-r from-[#eff6ff] to-[#fff7ed] p-8 dark:border-sky-200/10 dark:from-slate-900 dark:to-slate-900">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3a5f] dark:text-slate-100">
                    Start with a quick screening
                  </h3>
                  <p className="mt-3 max-w-3xl text-gray-600 dark:text-slate-300">
                    CommonMASS does not replace official benefit agencies or schools. It helps students
                    understand what programs may be worth exploring first, then points them toward the
                    next steps.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link to="/screener">
                    <Button className="rounded-full bg-[#1e3a5f] px-6 py-5 text-white hover:bg-[#16304f] dark:bg-sky-200 dark:text-slate-950 dark:hover:bg-sky-100">
                      Go to Screener
                    </Button>
                  </Link>

                  <Link
                    to="/faq"
                    className="inline-flex items-center rounded-full border border-[#1e3a5f]/15 bg-white px-6 py-3 text-sm font-semibold text-[#1e3a5f] shadow-sm transition-all hover:bg-[#f8fafc] dark:border-sky-200/20 dark:bg-slate-950 dark:text-sky-200 dark:hover:bg-slate-900"
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

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="border-t border-gray-200 bg-white py-12 dark:border-white/10 dark:bg-slate-950"
      >
        <div className="container mx-auto px-6 text-center text-sm text-gray-500 dark:text-slate-400 md:text-base">
          <p>Copyright 2026 CommonMASS. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}





















































