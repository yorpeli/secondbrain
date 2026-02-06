/**
 * Formatting Utilities
 *
 * Display helpers extracted from Looker2 scripts.
 */

/**
 * Format a decimal as percentage string.
 * @example formatPct(0.352) → "35.2%"
 * @example formatPct(0.02, 1, true) → "+2.0%"
 */
export function formatPct(
  value: number | null | undefined,
  decimals = 1,
  includeSign = false,
): string {
  if (value === null || value === undefined) return '-';
  const pct = (value * 100).toFixed(decimals) + '%';
  if (includeSign && value > 0) return '+' + pct;
  return pct;
}

/**
 * Format a number with locale-aware thousands separators.
 * @example formatNum(1234) → "1,234"
 */
export function formatNum(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString();
}

/**
 * Create a sparkline string from numeric values.
 * @example sparkline([10, 50, 80, 30]) → "▁▅█▃"
 */
export function sparkline(values: number[]): string {
  if (values.length === 0) return '';
  const chars = '▁▂▃▄▅▆▇█';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map(v => {
      const idx = Math.floor(((v - min) / range) * (chars.length - 1));
      return chars[idx];
    })
    .join('');
}

/**
 * Get an icon for opportunity status.
 */
export function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    STRONG_OPPORTUNITY: '[STRONG]',
    WEAK_OPPORTUNITY: '[WEAK]',
    NOT_READY: '[NOT_READY]',
    NO_OPPORTUNITY: '[NO_OPP]',
    MISSING_DATA: '[MISSING]',
  };
  return icons[status] || '?';
}

/**
 * Get an icon for severity level.
 */
export function getSeverityIcon(severity: 'RED' | 'YELLOW'): string {
  return severity === 'RED' ? '[RED]' : '[YLW]';
}

/**
 * Get verdict display text.
 */
export function getVerdictDisplay(verdict: string): { icon: string; text: string } {
  const displays: Record<string, { icon: string; text: string }> = {
    RECOMMEND: { icon: '[OK]', text: 'RECOMMEND ROLLOUT INCREASE' },
    RECOMMEND_WITH_CAUTION: { icon: '[!]', text: 'RECOMMEND WITH CAUTION' },
    MONITOR: { icon: '[~]', text: 'MONITOR - NOT YET READY' },
    NOT_READY: { icon: '[X]', text: 'NOT READY - CLM UNDERPERFORMING' },
    NO_OPPORTUNITY: { icon: '[X]', text: 'NO OPPORTUNITY - SIGNIFICANT GAP' },
    INSUFFICIENT_DATA: { icon: '[?]', text: 'INSUFFICIENT DATA' },
  };
  return displays[verdict] || { icon: '?', text: verdict };
}

/**
 * Calculate how many weeks ago a date string (YYYY-MM-DD) represents.
 */
export function getWeeksAgo(weekStr: string): number {
  const weekDate = new Date(weekStr);
  const now = new Date();
  return Math.floor((now.getTime() - weekDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
}
