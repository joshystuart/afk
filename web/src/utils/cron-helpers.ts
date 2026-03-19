/**
 * Cron Schedule Helper Utilities
 *
 * Provides functions to parse, build, and describe 5-field cron expressions
 * for a simplified schedule builder UI.
 */

export interface SimpleCronConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: { hour: number; minute: number };
  days?: number[]; // For weekly: 0-6 (0=Sun), for monthly: 1-31
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Builds a 5-field cron expression from a SimpleCronConfig
 */
export function buildCronExpression(config: SimpleCronConfig): string {
  const { frequency, time, days } = config;
  const minute = String(time.minute);
  const hour = String(time.hour);

  switch (frequency) {
    case 'daily':
      return `${minute} ${hour} * * *`;

    case 'weekly': {
      if (!days || days.length === 0) {
        return `${minute} ${hour} * * *`; // Default to daily if no days selected
      }
      const dowField = compressRange(days.sort((a, b) => a - b));
      return `${minute} ${hour} * * ${dowField}`;
    }

    case 'monthly': {
      if (!days || days.length === 0) {
        return `${minute} ${hour} 1 * *`; // Default to 1st of month if no days selected
      }
      const domField = compressRange(days.sort((a, b) => a - b));
      return `${minute} ${hour} ${domField} * *`;
    }
  }
}

/**
 * Compresses an array of numbers into a cron field string.
 * Consecutive numbers become ranges: [1,2,3,4,5] -> "1-5"
 * Non-consecutive stay as comma-separated: [1,3,5] -> "1,3,5"
 */
function compressRange(numbers: number[]): string {
  if (numbers.length === 0) return '*';
  if (numbers.length === 1) return String(numbers[0]);

  const ranges: string[] = [];
  let rangeStart = numbers[0];
  let rangeEnd = numbers[0];

  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === rangeEnd + 1) {
      rangeEnd = numbers[i];
    } else {
      if (rangeEnd - rangeStart >= 2) {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      } else if (rangeEnd === rangeStart) {
        ranges.push(String(rangeStart));
      } else {
        ranges.push(String(rangeStart), String(rangeEnd));
      }
      rangeStart = numbers[i];
      rangeEnd = numbers[i];
    }
  }

  // Handle the last range
  if (rangeEnd - rangeStart >= 2) {
    ranges.push(`${rangeStart}-${rangeEnd}`);
  } else if (rangeEnd === rangeStart) {
    ranges.push(String(rangeStart));
  } else {
    ranges.push(String(rangeStart), String(rangeEnd));
  }

  return ranges.join(',');
}

/**
 * Parses a 5-field cron expression into a SimpleCronConfig.
 * Returns null if the expression cannot be represented in simple mode.
 */
export function parseCronExpression(expr: string): SimpleCronConfig | null {
  if (!expr || typeof expr !== 'string') return null;

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse minute (must be single integer 0-59)
  if (!/^\d{1,2}$/.test(minStr)) return null;
  const minute = parseInt(minStr, 10);
  if (minute < 0 || minute > 59) return null;

  // Parse hour (must be single integer 0-23)
  if (!/^\d{1,2}$/.test(hourStr)) return null;
  const hour = parseInt(hourStr, 10);
  if (hour < 0 || hour > 23) return null;

  // Month must be * (we don't support month-specific schedules)
  if (monthStr !== '*') return null;

  const time = { hour, minute };

  // Case 1: Daily - dom=* dow=*
  if (domStr === '*' && dowStr === '*') {
    return { frequency: 'daily', time };
  }

  // Case 2: Weekly - dom=* dow=<days>
  if (domStr === '*' && dowStr !== '*') {
    const days = parseDowField(dowStr);
    if (!days) return null;
    return { frequency: 'weekly', time, days };
  }

  // Case 3: Monthly - dom=<days> dow=*
  if (domStr !== '*' && dowStr === '*') {
    const days = parseDomField(domStr);
    if (!days) return null;
    return { frequency: 'monthly', time, days };
  }

  // Mixed dom and dow is not supported in simple mode
  return null;
}

/**
 * Parses a day-of-week field (0-6, ranges, lists)
 */
function parseDowField(field: string): number[] | null {
  return parseNumericField(field, 0, 6);
}

/**
 * Parses a day-of-month field (1-31, ranges, lists)
 */
function parseDomField(field: string): number[] | null {
  return parseNumericField(field, 1, 31);
}

/**
 * Generic numeric field parser that handles:
 * - Single numbers: "5"
 * - Ranges: "1-5"
 * - Lists: "1,3,5"
 * - Combined: "1-3,5,7-9"
 * Does NOT handle step expressions (star/n, 1-5/2) or special chars (L, W, #)
 */
function parseNumericField(field: string, min: number, max: number): number[] | null {
  if (field === '*') return null; // Wildcard not allowed here
  if (/[*/LW#]/.test(field)) return null; // Step or special expressions not supported

  const parts = field.split(',');
  const numbers = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      // Range: "1-5"
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) return null;
      if (start < min || start > max || end < min || end > max) return null;
      if (start > end) return null;

      for (let i = start; i <= end; i++) {
        numbers.add(i);
      }
    } else {
      // Single number
      const num = parseInt(part, 10);
      if (isNaN(num)) return null;
      if (num < min || num > max) return null;
      numbers.add(num);
    }
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Checks if a cron expression can be represented in simple mode
 */
export function isSimpleCron(expr: string): boolean {
  return parseCronExpression(expr) !== null;
}

/**
 * Generates a human-readable description of a SimpleCronConfig
 */
export function describeCronExpression(config: SimpleCronConfig): string {
  const timeStr = formatTime(config.time);

  switch (config.frequency) {
    case 'daily':
      return `Every day at ${timeStr}`;

    case 'weekly': {
      if (!config.days || config.days.length === 0) {
        return `Every day at ${timeStr}`;
      }
      const sorted = [...config.days].sort((a, b) => a - b);

      // Check for common patterns
      if (arraysEqual(sorted, [1, 2, 3, 4, 5])) {
        return `Every weekday at ${timeStr}`;
      }
      if (arraysEqual(sorted, [0, 6])) {
        return `Every weekend at ${timeStr}`;
      }
      if (sorted.length === 7) {
        return `Every day at ${timeStr}`;
      }

      const dayNames = sorted.map((d) => DAY_NAMES[d]);
      if (dayNames.length === 1) {
        return `Every ${dayNames[0]} at ${timeStr}`;
      }
      return `Every ${dayNames.join(', ')} at ${timeStr}`;
    }

    case 'monthly': {
      if (!config.days || config.days.length === 0) {
        return `On the 1st of every month at ${timeStr}`;
      }
      const sorted = [...config.days].sort((a, b) => a - b);
      const dayStrs = sorted.map((d) => ordinal(d));

      if (dayStrs.length === 1) {
        return `On the ${dayStrs[0]} of every month at ${timeStr}`;
      }
      return `On the ${dayStrs.join(', ')} of every month at ${timeStr}`;
    }
  }
}

/**
 * Formats time in 12-hour format with AM/PM
 */
function formatTime(time: { hour: number; minute: number }): string {
  const hour12 = time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour;
  const ampm = time.hour >= 12 ? 'PM' : 'AM';
  const minuteStr = String(time.minute).padStart(2, '0');
  return `${hour12}:${minuteStr} ${ampm}`;
}

/**
 * Converts a number to ordinal string (1 -> "1st", 2 -> "2nd", etc.)
 */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Checks if two arrays contain the same elements
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
