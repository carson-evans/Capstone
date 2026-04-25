export type DesktopLayoutMode = 'single' | 'double';

const DESKTOP_LAYOUT_STORAGE_KEY = 'commonmass-desktop-layout-mode';

export function readDesktopLayoutMode(): DesktopLayoutMode {
  if (typeof window === 'undefined') {
    return 'single';
  }

  const storedValue = window.localStorage.getItem(DESKTOP_LAYOUT_STORAGE_KEY);
  return storedValue === 'double' ? 'double' : 'single';
}

export function writeDesktopLayoutMode(mode: DesktopLayoutMode) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DESKTOP_LAYOUT_STORAGE_KEY, mode);
}
