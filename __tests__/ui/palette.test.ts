import { PALETTES, dark, light, type ColorTokens } from '@/ui/palette';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [rl, gl, bl] = [r, g, b].map(channel) as [number, number, number];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio between two opaque hex colours, 1 (none) to 21 (max). */
function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(hexToRgb(a)) + 0.05;
  const l2 = relativeLuminance(hexToRgb(b)) + 0.05;
  return Math.max(l1, l2) / Math.min(l1, l2);
}

const OPAQUE_HEX = /^#[0-9a-fA-F]{6}$/;

// WCAG AA for normal-weight text under 18pt (our smallest caption is 12px).
const AA_NORMAL_TEXT = 4.5;

const SURFACES: (keyof ColorTokens)[] = ['bg', 'surface', 'surfaceAlt', 'primarySoft', 'accentSoft'];
const TEXT_TOKENS: (keyof ColorTokens)[] = ['text', 'textMuted', 'primary', 'accent', 'danger'];

describe('contrast (WCAG AA, 4.5:1 for normal text)', () => {
  for (const [name, palette] of Object.entries(PALETTES)) {
    describe(`${name} palette`, () => {
      for (const surfaceKey of SURFACES) {
        for (const textKey of TEXT_TOKENS) {
          test(`${textKey} on ${surfaceKey}`, () => {
            const ratio = contrastRatio(palette[textKey], palette[surfaceKey]);
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
          });
        }
      }

      test('onPrimary on primary (button label)', () => {
        expect(contrastRatio(palette.onPrimary, palette.primary)).toBeGreaterThanOrEqual(
          AA_NORMAL_TEXT,
        );
      });

      test('text on gridFilled / gridEmpty (Lo Shu cells)', () => {
        expect(contrastRatio(palette.primary, palette.gridFilled)).toBeGreaterThanOrEqual(
          AA_NORMAL_TEXT,
        );
        expect(contrastRatio(palette.textMuted, palette.gridEmpty)).toBeGreaterThanOrEqual(3);
      });
    });
  }
});

describe('palette shape', () => {
  test('every colour token is an opaque 6-digit hex, except the translucent overlay', () => {
    for (const palette of Object.values(PALETTES)) {
      for (const [key, value] of Object.entries(palette)) {
        if (key === 'overlay') {
          expect(value).toMatch(/^rgba\(/);
        } else {
          expect(value).toMatch(OPAQUE_HEX);
        }
      }
    }
  });

  test('light and dark are distinct palettes', () => {
    expect(light).not.toEqual(dark);
    expect(light.bg).not.toBe(dark.bg);
  });
});
