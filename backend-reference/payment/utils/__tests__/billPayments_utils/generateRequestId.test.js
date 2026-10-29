const { generateRequestId } = require('../../billPayments_utils');

describe('generateRequestId', () => {
    it('should return a string of exactly 36 characters', () => {
        const id = generateRequestId();
        expect(typeof id).toBe('string');
        expect(id).toHaveLength(35);
    });

    it('should start with 27 alphanumeric characters', () => {
        const id = generateRequestId();
        const prefix = id.slice(0, 27);
        expect(prefix).toMatch(/^[a-z0-9]{27}$/);
    });

    it('should contain the last digit of the current year at position 27', () => {
        const id = generateRequestId();
        const yearLastDigit = String(new Date().getFullYear()).slice(-1);
        expect(id[27]).toBe(yearLastDigit);
    });

    it('should contain a zero-padded 3-digit day-of-year at positions 28-30', () => {
        const id = generateRequestId();
        const dayPart = id.slice(28, 31);
        expect(dayPart).toMatch(/^\d{3}$/);
        const now = new Date();
        const dayOfYear = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
        expect(parseInt(dayPart)).toBe(dayOfYear);
    });

    it('should contain a 4-digit HHMM time at positions 31-34', () => {
        const id = generateRequestId();
        const timePart = id.slice(31, 36);
        expect(timePart).toMatch(/^\d{4}$/);
    });

    it('should generate unique ids on consecutive calls', () => {
        const ids = new Set(Array.from({ length: 50 }, () => generateRequestId()));
        expect(ids.size).toBeGreaterThan(40);
    });
});
