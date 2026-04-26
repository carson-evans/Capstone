import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'commonmass-theme';
const THEME_TRANSITION_CLASS = 'theme-transitioning';
const THEME_TRANSITION_MS = 260;
const THEME_TRANSITION_SWAP_DELAY_MS = 110;
const THEME_TRANSITION_OVERLAY_MS = 520;
const THEME_TRANSITION_CLEANUP_MS = 860;
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [transitionOverlayTheme, setTransitionOverlayTheme] = useState<Theme | null>(null);
  const [isTransitionOverlayVisible, setIsTransitionOverlayVisible] = useState(false);
  const themeRef = useRef(theme);
  const pendingThemeRef = useRef<Theme | null>(null);
  const swapTimeoutRef = useRef<number | null>(null);
  const overlayTimeoutRef = useRef<number | null>(null);
  const cleanupTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const clearTransitionTimers = useCallback(() => {
    if (swapTimeoutRef.current !== null) {
      window.clearTimeout(swapTimeoutRef.current);
      swapTimeoutRef.current = null;
    }

    if (overlayTimeoutRef.current !== null) {
      window.clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }

    if (cleanupTimeoutRef.current !== null) {
      window.clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimers();

      const root = window.document.documentElement;
      root.classList.remove(THEME_TRANSITION_CLASS);
      delete root.dataset.themeTransition;
      pendingThemeRef.current = null;
    };
  }, [clearTransitionTimers]);

  const setTheme = useCallback((nextTheme: Theme) => {
    const currentTheme = pendingThemeRef.current ?? themeRef.current;

    if (currentTheme === nextTheme) {
      return;
    }

    const root = window.document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    clearTransitionTimers();
    root.classList.remove(THEME_TRANSITION_CLASS);
    delete root.dataset.themeTransition;

    if (prefersReducedMotion) {
      pendingThemeRef.current = null;
      setTransitionOverlayTheme(null);
      setIsTransitionOverlayVisible(false);
      setThemeState(nextTheme);
      return;
    }

    pendingThemeRef.current = nextTheme;
    setTransitionOverlayTheme(nextTheme);
    setIsTransitionOverlayVisible(true);
    root.dataset.themeTransition = `${currentTheme}-to-${nextTheme}`;
    root.classList.add(THEME_TRANSITION_CLASS);

    swapTimeoutRef.current = window.setTimeout(() => {
      setThemeState(nextTheme);
      swapTimeoutRef.current = null;
    }, THEME_TRANSITION_SWAP_DELAY_MS);

    overlayTimeoutRef.current = window.setTimeout(() => {
      setIsTransitionOverlayVisible(false);
      overlayTimeoutRef.current = null;
    }, THEME_TRANSITION_OVERLAY_MS);

    cleanupTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove(THEME_TRANSITION_CLASS);
      delete root.dataset.themeTransition;
      pendingThemeRef.current = null;
      setTransitionOverlayTheme(null);
      cleanupTimeoutRef.current = null;
    }, THEME_TRANSITION_CLEANUP_MS);
  }, [clearTransitionTimers]);

  const toggleTheme = useCallback(() => {
    const currentTheme = pendingThemeRef.current ?? themeRef.current;
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  const activeOverlayTheme = transitionOverlayTheme ?? theme;
  const overlayIsDark = activeOverlayTheme === 'dark';

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        data-theme-transition-overlay="true"
        className={`pointer-events-none fixed inset-0 z-[160] flex items-center justify-center transition-opacity duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isTransitionOverlayVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`absolute inset-0 ${
            overlayIsDark ? 'bg-slate-950/96' : 'bg-[#f8fafc]/96'
          }`}
        />
        <div
          data-theme-transition-badge="true"
          className={`relative flex h-24 w-24 items-center justify-center rounded-full border ${
            overlayIsDark
              ? 'border-white/14 bg-slate-950/76 text-white shadow-[0_28px_80px_-30px_rgba(2,6,23,0.9)]'
              : 'border-slate-300/70 bg-white/92 text-[#1e3a5f] shadow-[0_28px_80px_-30px_rgba(15,23,42,0.34)]'
          }`}
        >
          {overlayIsDark ? (
            <Moon
              data-theme-transition-icon="true"
              className="h-10 w-10 stroke-[1.65]"
            />
          ) : (
            <Sun
              data-theme-transition-icon="true"
              className="h-10 w-10 stroke-[1.65]"
            />
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};
