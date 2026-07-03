/**
 * Given a hex color (#rgb or #rrggbb), returns '#000000' or '#ffffff' —
 * whichever gives better contrast against that background — using the
 * standard relative-luminance formula (WCAG-ish approximation).
 *
 * Falls back to null for invalid/empty input so callers can skip setting
 * an explicit text color and let the theme's default apply.
 */
export function getContrastTextColor(hex: string | null | undefined): string | null {
  if (!hex) {
    return null;
  }

  let normalized = hex.trim().replace('#', '');

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);

  // Perceptual luminance weighting.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '#000000' : '#ffffff';
}
