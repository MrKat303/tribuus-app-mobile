import { darkColors, lightColors } from './tokens';

function luminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  if (!channels) throw new Error(`Color hexadecimal inválido: ${hex}`);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('semantic theme tokens', () => {
  test('light and dark themes expose the same semantic roles', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  test.each([
    ['light', lightColors],
    ['dark', darkColors],
  ] as const)('%s theme keeps readable primary text and controls', (_name, colors) => {
    expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.text, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.textOnPrimary, colors.primaryDark)).toBeGreaterThanOrEqual(4.5);
  });

  test('theme surfaces actually change instead of aliasing the light palette', () => {
    expect(darkColors.background).not.toBe(lightColors.background);
    expect(darkColors.surface).not.toBe(lightColors.surface);
    expect(darkColors.input).not.toBe(lightColors.input);
  });
});
