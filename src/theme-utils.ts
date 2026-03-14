import { argbFromHex, themeFromSourceColor, applyTheme } from '@material/material-color-utilities';

export function getSystemAccentColor(): string | null {
  try {
    const el = document.createElement('div');
    el.style.color = 'AccentColor';
    el.style.display = 'none';
    document.body.appendChild(el);
    
    const computedColor = getComputedStyle(el).color;
    document.body.removeChild(el);
    
    // computedColor will be in the format "rgb(r, g, b)"
    const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      
      // Convert to hex
      return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
    }
  } catch (e) {
    console.error("Failed to get system accent color", e);
  }
  return null;
}

export function setupDynamicColor(hexColor?: string) {
  let finalColor = hexColor;
  
  if (!finalColor) {
    const systemColor = getSystemAccentColor();
    // Default to the original blue if we can't extract a valid system color
    finalColor = systemColor && systemColor !== '#000000' && systemColor !== '#FFFFFF' ? systemColor : '#0061A4';
  }

  const theme = themeFromSourceColor(argbFromHex(finalColor));
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  applyTheme(theme, { target: document.body, dark: systemDark });
  
  // Also listen for system theme changes to re-apply
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    applyTheme(theme, { target: document.body, dark: e.matches });
  });
}
