import { argbFromHex, themeFromSourceColor, applyTheme, type Theme } from '@material/material-color-utilities';

export type ColorSchemePreference = 'light' | 'dark' | 'system';

const colorSchemeStorageKey = 'crd-color-scheme';
const darkModeQuery = '(prefers-color-scheme: dark)';

let activeTheme: Theme | null = null;
let activePreference: ColorSchemePreference = 'system';
let hasAttachedSchemeListener = false;

export function getSystemAccentColor(): string | null {
  try {
    const el = document.createElement('div');
    el.style.color = 'AccentColor';
    el.style.display = 'none';
    document.body.appendChild(el);

    const computedColor = getComputedStyle(el).color;
    document.body.removeChild(el);

    const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);

      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
    }
  } catch (error) {
    console.error('Failed to get system accent color', error);
  }

  return null;
}

export function getColorSchemePreference(): ColorSchemePreference {
  try {
    const stored = window.localStorage.getItem(colorSchemeStorageKey);
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read color scheme preference', error);
  }

  return 'system';
}

function isDarkMode(preference: ColorSchemePreference = activePreference) {
  if (preference === 'dark') {
    return true;
  }

  if (preference === 'light') {
    return false;
  }

  return window.matchMedia(darkModeQuery).matches;
}

function notifyColorSchemeChange() {
  const dark = isDarkMode();
  document.documentElement.dataset.colorScheme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.body.style.colorScheme = dark ? 'dark' : 'light';

  window.dispatchEvent(new CustomEvent('crd-color-scheme-changed', {
    detail: {
      preference: activePreference,
      dark,
    },
  }));
}

function applyActiveTheme() {
  if (!activeTheme) {
    return;
  }

  applyTheme(activeTheme, {
    target: document.documentElement,
    dark: isDarkMode(),
  });

  notifyColorSchemeChange();
}

export function getEffectiveColorScheme() {
  return isDarkMode(getColorSchemePreference()) ? 'dark' : 'light';
}

export function setColorSchemePreference(preference: ColorSchemePreference) {
  activePreference = preference;

  try {
    if (preference === 'system') {
      window.localStorage.removeItem(colorSchemeStorageKey);
    } else {
      window.localStorage.setItem(colorSchemeStorageKey, preference);
    }
  } catch (error) {
    console.warn('Failed to persist color scheme preference', error);
  }

  applyActiveTheme();
}

export function toggleColorScheme() {
  setColorSchemePreference(isDarkMode() ? 'light' : 'dark');
}

export function setupDynamicColor(hexColor?: string) {
  let finalColor = hexColor;

  if (!finalColor) {
    const systemColor = getSystemAccentColor();
    finalColor = systemColor && systemColor !== '#000000' && systemColor !== '#FFFFFF'
      ? systemColor
      : '#0061A4';
  }

  activeTheme = themeFromSourceColor(argbFromHex(finalColor));
  activePreference = getColorSchemePreference();
  applyActiveTheme();

  if (!hasAttachedSchemeListener) {
    window.matchMedia(darkModeQuery).addEventListener('change', () => {
      if (activePreference === 'system') {
        applyActiveTheme();
      }
    });
    hasAttachedSchemeListener = true;
  }
}
