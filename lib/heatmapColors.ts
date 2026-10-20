type Palette = {
  background: string;
  border: string;
  badge: string;
  text: string;
};

// Rank is supplied by the API. These are presentation colors, not flag types.
const leadingRanks: Palette[] = [
  { background: '#FEE2E2', border: '#FCA5A5', badge: '#DC2626', text: '#991B1B' },
  { background: '#FFEDD5', border: '#FDBA74', badge: '#EA580C', text: '#9A3412' },
  { background: '#FEF3C7', border: '#FCD34D', badge: '#D97706', text: '#92400E' },
  { background: '#FEF9C3', border: '#FDE047', badge: '#CA8A04', text: '#854D0E' },
];

const lowerRanks: Palette[] = [
  { background: '#FEFCE8', border: '#D9F99D', badge: '#84A30D', text: '#4D7C0F' },
  { background: '#F7FEE7', border: '#BEF264', badge: '#65A30D', text: '#3F6212' },
  { background: '#F0FDF4', border: '#86EFAC', badge: '#16A34A', text: '#166534' },
];

export const ALL_CLEAR_COLORS = lowerRanks[2];
export const HEATMAP_LEGEND_GRADIENT = `linear-gradient(to right, ${[
  ...leadingRanks, ...lowerRanks,
].map(color => color.badge).join(', ')})`;

function channels(hex: string): number[] {
  return [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function mix(from: string, to: string, amount: number): string {
  const end = channels(to);
  return '#' + channels(from).map((start, i) =>
    Math.round(start + (end[i] - start) * amount).toString(16).padStart(2, '0'),
  ).join('').toUpperCase();
}

function interpolate(from: Palette, to: Palette, amount: number): Palette {
  return {
    background: mix(from.background, to.background, amount),
    border: mix(from.border, to.border, amount),
    badge: mix(from.badge, to.badge, amount),
    text: mix(from.text, to.text, amount),
  };
}

function luminance(hex: string): number {
  const rgb = channels(hex).map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function getHeatmapColors(rank: number, totalFlags: number, flaggedClassCount: number) {
  let palette: Palette;
  if (totalFlags <= 0) {
    palette = ALL_CLEAR_COLORS;
  } else if (rank <= 4) {
    palette = leadingRanks[Math.max(1, rank) - 1];
  } else {
    // Use every flagged class in the school, before filtering or pagination.
    // A lone rank #5 stays yellow-green instead of jumping straight to green.
    const progress = Math.max(0, Math.min(1, (rank - 5) / Math.max(1, flaggedClassCount - 5)));
    const position = progress * (lowerRanks.length - 1);
    const index = Math.min(Math.floor(position), lowerRanks.length - 2);
    palette = interpolate(lowerRanks[index], lowerRanks[index + 1], position - index);
  }

  const badgeLuminance = luminance(palette.badge);
  const whiteContrast = 1.05 / (badgeLuminance + 0.05);
  const darkContrast = (badgeLuminance + 0.05) / (luminance('#111827') + 0.05);
  return {
    ...palette,
    badgeText: whiteContrast >= darkContrast ? '#FFFFFF' : '#111827',
    darkBackground: mix('#151722', palette.badge, 0.16),
    darkBorder: mix('#151722', palette.badge, 0.5),
    darkText: mix(palette.badge, '#FFFFFF', 0.65),
  };
}
