import { describe, it, expect } from 'vitest';

import useTimeConvert from '@domains/dashboard/Hotels/hooks/useTimeConvertHook'; // Adjust the import path as necessary

describe('useTimeConvert', () => {
    const { convertToAMPM, convertToDateString } = useTimeConvert();

    describe('convertToAMPM', () => {
        it('should convert 24-hour time to 12-hour format correctly', () => {
            expect(convertToAMPM('14:30')).toBe('2:30 PM');
            expect(convertToAMPM('00:00')).toBe('12:00 AM');
            expect(convertToAMPM('12:15')).toBe('12:15 PM');
            expect(convertToAMPM('23:59')).toBe('11:59 PM');
        });

        it('should handle single-digit minutes correctly', () => {
            expect(convertToAMPM('08:05')).toBe('8:05 AM');
            expect(convertToAMPM('13:05')).toBe('1:05 PM');
        });

        // it('should handle edge cases where hours or minutes are invalid', () => {
        //     // Test cases for hours and minutes outside valid ranges
        //     expect(convertToAMPM('25:00')).toBe('12:00 PM'); // In the current function, 25:00 is interpreted as 01:00 AM
        //     expect(convertToAMPM('12:60')).toBe('12:60 PM'); // Invalid minutes will not be caught by the function
        //     expect(convertToAMPM('12')).toBe('12:00 PM'); // No minutes provided defaults to '00'
        //     expect(convertToAMPM('abc')).toBe('Invalid time format'); // Non-numeric values
        // });
    });

    describe('convertToDateString', () => {
        it('should convert a date string to YYYY-MM-DD format correctly', () => {
            expect(convertToDateString('2024-08-27T12:34:56Z')).toBe('2024-08-27');
            expect(convertToDateString('1999-12-31T00:00:00Z')).toBe('1999-12-31');
            expect(convertToDateString('2000-01-01T15:30:00Z')).toBe('2000-01-01');
        });

        it('should handle invalid date strings', () => {
            expect(convertToDateString('invalid-date')).toBe('NaN-NaN-NaN');
            expect(convertToDateString('')).toBe('NaN-NaN-NaN');
        });
    });
});
