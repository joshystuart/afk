import { describe, expect, it } from 'vitest';

import {
  buildCronExpression,
  describeCronExpression,
  isSimpleCron,
  parseCronExpression,
  type SimpleCronConfig,
} from './cron-helpers';

describe('buildCronExpression', () => {
  it('should build a daily expression', () => {
    expect(
      buildCronExpression({
        frequency: 'daily',
        time: { hour: 9, minute: 30 },
      }),
    ).toBe('30 9 * * *');
  });

  it('should build a daily expression at midnight', () => {
    expect(
      buildCronExpression({
        frequency: 'daily',
        time: { hour: 0, minute: 0 },
      }),
    ).toBe('0 0 * * *');
  });

  it('should build a weekly expression with specific days', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 14, minute: 15 },
        days: [1, 3, 5],
      }),
    ).toBe('15 14 * * 1,3,5');
  });

  it('should compress consecutive weekday ranges', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [1, 2, 3, 4, 5],
      }),
    ).toBe('0 9 * * 1-5');
  });

  it('should fall back to daily when weekly has no days', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [],
      }),
    ).toBe('0 9 * * *');
  });

  it('should build a monthly expression with specific days', () => {
    expect(
      buildCronExpression({
        frequency: 'monthly',
        time: { hour: 8, minute: 0 },
        days: [1, 15],
      }),
    ).toBe('0 8 1,15 * *');
  });

  it('should compress consecutive monthly day ranges', () => {
    expect(
      buildCronExpression({
        frequency: 'monthly',
        time: { hour: 12, minute: 0 },
        days: [1, 2, 3, 4, 5],
      }),
    ).toBe('0 12 1-5 * *');
  });

  it('should fall back to 1st when monthly has no days', () => {
    expect(
      buildCronExpression({
        frequency: 'monthly',
        time: { hour: 9, minute: 0 },
        days: [],
      }),
    ).toBe('0 9 1 * *');
  });

  it('should handle mixed ranges and single values', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [0, 1, 2, 5, 6],
      }),
    ).toBe('0 9 * * 0-2,5,6');
  });

  it('should handle a pair of consecutive days (range of 2)', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [1, 2],
      }),
    ).toBe('0 9 * * 1,2');
  });

  it('should handle unsorted input days', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [5, 1, 3],
      }),
    ).toBe('0 9 * * 1,3,5');
  });

  it('should handle a single day selection', () => {
    expect(
      buildCronExpression({
        frequency: 'weekly',
        time: { hour: 10, minute: 0 },
        days: [3],
      }),
    ).toBe('0 10 * * 3');
  });
});

describe('parseCronExpression', () => {
  it('should parse a daily expression', () => {
    expect(parseCronExpression('30 9 * * *')).toEqual({
      frequency: 'daily',
      time: { hour: 9, minute: 30 },
    });
  });

  it('should parse a weekly expression', () => {
    expect(parseCronExpression('0 9 * * 1-5')).toEqual({
      frequency: 'weekly',
      time: { hour: 9, minute: 0 },
      days: [1, 2, 3, 4, 5],
    });
  });

  it('should parse a weekly expression with comma-separated days', () => {
    expect(parseCronExpression('0 14 * * 1,3,5')).toEqual({
      frequency: 'weekly',
      time: { hour: 14, minute: 0 },
      days: [1, 3, 5],
    });
  });

  it('should parse a monthly expression', () => {
    expect(parseCronExpression('0 8 1,15 * *')).toEqual({
      frequency: 'monthly',
      time: { hour: 8, minute: 0 },
      days: [1, 15],
    });
  });

  it('should parse a monthly expression with range', () => {
    expect(parseCronExpression('0 12 1-5 * *')).toEqual({
      frequency: 'monthly',
      time: { hour: 12, minute: 0 },
      days: [1, 2, 3, 4, 5],
    });
  });

  it('should return null for invalid input', () => {
    expect(parseCronExpression('')).toBeNull();
    expect(parseCronExpression('not a cron')).toBeNull();
    expect(parseCronExpression('* * * *')).toBeNull(); // Only 4 fields
  });

  it('should return null for out-of-range minutes', () => {
    expect(parseCronExpression('60 9 * * *')).toBeNull();
    expect(parseCronExpression('-1 9 * * *')).toBeNull();
  });

  it('should return null for out-of-range hours', () => {
    expect(parseCronExpression('0 24 * * *')).toBeNull();
  });

  it('should return null for non-wildcard month', () => {
    expect(parseCronExpression('0 9 * 1 *')).toBeNull();
  });

  it('should return null for mixed dom and dow', () => {
    expect(parseCronExpression('0 9 1 * 1')).toBeNull();
  });

  it('should return null for step expressions', () => {
    expect(parseCronExpression('*/5 * * * *')).toBeNull();
    expect(parseCronExpression('0 9 * * */2')).toBeNull();
  });

  it('should return null for special characters (L, W, #)', () => {
    expect(parseCronExpression('0 9 L * *')).toBeNull();
    expect(parseCronExpression('0 9 15W * *')).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(parseCronExpression(null as unknown as string)).toBeNull();
    expect(parseCronExpression(undefined as unknown as string)).toBeNull();
  });

  it('should return null for invalid dow range', () => {
    expect(parseCronExpression('0 9 * * 7')).toBeNull();
  });

  it('should return null for invalid dom range', () => {
    expect(parseCronExpression('0 9 0 * *')).toBeNull();
    expect(parseCronExpression('0 9 32 * *')).toBeNull();
  });

  it('should return null for reversed ranges', () => {
    expect(parseCronExpression('0 9 * * 5-1')).toBeNull();
  });

  it('should parse combined ranges and single values', () => {
    expect(parseCronExpression('0 9 * * 0-2,5,6')).toEqual({
      frequency: 'weekly',
      time: { hour: 9, minute: 0 },
      days: [0, 1, 2, 5, 6],
    });
  });
});

describe('buildCronExpression and parseCronExpression roundtrip', () => {
  const configs: SimpleCronConfig[] = [
    { frequency: 'daily', time: { hour: 9, minute: 30 } },
    { frequency: 'weekly', time: { hour: 14, minute: 0 }, days: [1, 3, 5] },
    {
      frequency: 'weekly',
      time: { hour: 9, minute: 0 },
      days: [1, 2, 3, 4, 5],
    },
    { frequency: 'monthly', time: { hour: 8, minute: 0 }, days: [1, 15] },
    {
      frequency: 'monthly',
      time: { hour: 0, minute: 0 },
      days: [1, 2, 3, 10, 20, 21, 22],
    },
  ];

  for (const config of configs) {
    it(`should roundtrip ${config.frequency} config`, () => {
      const cron = buildCronExpression(config);
      const parsed = parseCronExpression(cron);
      expect(parsed).not.toBeNull();
      expect(parsed!.frequency).toBe(config.frequency);
      expect(parsed!.time).toEqual(config.time);
      if (config.days && config.days.length > 0) {
        expect(parsed!.days).toEqual([...config.days].sort((a, b) => a - b));
      }
    });
  }
});

describe('isSimpleCron', () => {
  it('should return true for simple expressions', () => {
    expect(isSimpleCron('0 9 * * *')).toBe(true);
    expect(isSimpleCron('0 9 * * 1-5')).toBe(true);
    expect(isSimpleCron('0 9 1 * *')).toBe(true);
  });

  it('should return false for complex expressions', () => {
    expect(isSimpleCron('*/5 * * * *')).toBe(false);
    expect(isSimpleCron('0 9 1 * 1')).toBe(false);
    expect(isSimpleCron('')).toBe(false);
  });
});

describe('describeCronExpression', () => {
  it('should describe a daily schedule', () => {
    expect(
      describeCronExpression({
        frequency: 'daily',
        time: { hour: 9, minute: 0 },
      }),
    ).toBe('Every day at 9:00 AM');
  });

  it('should describe a daily schedule at midnight', () => {
    expect(
      describeCronExpression({
        frequency: 'daily',
        time: { hour: 0, minute: 0 },
      }),
    ).toBe('Every day at 12:00 AM');
  });

  it('should describe a PM time', () => {
    expect(
      describeCronExpression({
        frequency: 'daily',
        time: { hour: 14, minute: 30 },
      }),
    ).toBe('Every day at 2:30 PM');
  });

  it('should describe weekday schedule', () => {
    expect(
      describeCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [1, 2, 3, 4, 5],
      }),
    ).toBe('Every weekday at 9:00 AM');
  });

  it('should describe weekend schedule', () => {
    expect(
      describeCronExpression({
        frequency: 'weekly',
        time: { hour: 10, minute: 0 },
        days: [0, 6],
      }),
    ).toBe('Every weekend at 10:00 AM');
  });

  it('should describe all days of the week as daily', () => {
    expect(
      describeCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [0, 1, 2, 3, 4, 5, 6],
      }),
    ).toBe('Every day at 9:00 AM');
  });

  it('should describe a single weekday', () => {
    expect(
      describeCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [1],
      }),
    ).toBe('Every Mon at 9:00 AM');
  });

  it('should describe multiple specific weekdays', () => {
    expect(
      describeCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [1, 3, 5],
      }),
    ).toBe('Every Mon, Wed, Fri at 9:00 AM');
  });

  it('should describe weekly with no days as daily', () => {
    expect(
      describeCronExpression({
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        days: [],
      }),
    ).toBe('Every day at 9:00 AM');
  });

  it('should describe a single monthly day', () => {
    expect(
      describeCronExpression({
        frequency: 'monthly',
        time: { hour: 9, minute: 0 },
        days: [1],
      }),
    ).toBe('On the 1st of every month at 9:00 AM');
  });

  it('should describe multiple monthly days', () => {
    expect(
      describeCronExpression({
        frequency: 'monthly',
        time: { hour: 9, minute: 0 },
        days: [1, 15],
      }),
    ).toBe('On the 1st, 15th of every month at 9:00 AM');
  });

  it('should describe monthly with no days as 1st', () => {
    expect(
      describeCronExpression({
        frequency: 'monthly',
        time: { hour: 9, minute: 0 },
        days: [],
      }),
    ).toBe('On the 1st of every month at 9:00 AM');
  });

  it('should handle ordinals correctly (2nd, 3rd, 11th, 21st)', () => {
    const describe = (day: number) =>
      describeCronExpression({
        frequency: 'monthly',
        time: { hour: 9, minute: 0 },
        days: [day],
      });

    expect(describe(2)).toContain('2nd');
    expect(describe(3)).toContain('3rd');
    expect(describe(11)).toContain('11th');
    expect(describe(12)).toContain('12th');
    expect(describe(13)).toContain('13th');
    expect(describe(21)).toContain('21st');
    expect(describe(22)).toContain('22nd');
    expect(describe(23)).toContain('23rd');
  });

  it('should handle noon correctly', () => {
    expect(
      describeCronExpression({
        frequency: 'daily',
        time: { hour: 12, minute: 0 },
      }),
    ).toBe('Every day at 12:00 PM');
  });
});
