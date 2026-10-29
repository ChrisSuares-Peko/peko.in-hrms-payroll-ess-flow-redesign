import { describe, expect, it } from 'vitest';

import { formatHours } from '../../utils/attendanceMappers';

describe('formatHours', () => {
    it('returns null when totalHours is undefined', () => {
        expect(formatHours(undefined)).toBeNull();
    });

    it('returns null when totalHours is 0', () => {
        expect(formatHours(0)).toBeNull();
    });

    it('returns null when totalHours is negative', () => {
        expect(formatHours(-2)).toBeNull();
    });

    it('formats a value with a fractional hour component', () => {
        expect(formatHours(1.5)).toBe('1h 30m');
    });

    it('formats a whole number of hours with zero-padded minutes', () => {
        expect(formatHours(8)).toBe('8h 00m');
    });

    it('formats a value with a small minutes remainder, zero-padded', () => {
        expect(formatHours(8.75)).toBe('8h 45m');
    });

    it('zero-pads single-digit minutes', () => {
        expect(formatHours(0.05)).toBe('0h 03m');
    });

    it('rounds minutes derived from the fractional remainder', () => {
        // Note: due to Math.round on the minutes remainder, this produces a
        // "60m" value instead of rolling over into the next hour. This is the
        // actual behavior of the source implementation.
        expect(formatHours(1.999)).toBe('1h 60m');
    });

    it('rounds a very small fractional remainder down to 00m', () => {
        expect(formatHours(0.008333333)).toBe('0h 00m');
    });
});
