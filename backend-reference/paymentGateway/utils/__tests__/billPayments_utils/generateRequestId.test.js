const { generateRequestId } = require('../../billPayments_utils');

describe('generateRequestId', () => {
    it('should return a string of exactly 36 characters', () => {
        const id = generateRequestId();
        expect(typeof id).toBe('string');
        expect(id).toHaveLength(35);
    });

    it('should start with 27 alphanumeric characters', () => {
        expect(generateRequestId().slice(0, 27)).toMatch(/^[a-z0-9]{27}$/);
    });

    it('should contain the last digit of the current year at position 27', () => {
        const id = generateRequestId();
        expect(id[27]).toBe(String(new Date().getFullYear()).slice(-1));
    });

    it('should contain a 3-digit day-of-year at positions 28-30', () => {
        expect(generateRequestId().slice(28, 31)).toMatch(/^\d{3}$/);
    });

    it('should contain a 4-digit HHMM time at positions 31-34', () => {
        expect(generateRequestId().slice(31, 36)).toMatch(/^\d{4}$/);
    });

    it('should produce unique ids on consecutive calls', () => {
        const ids = new Set(Array.from({ length: 50 }, () => generateRequestId()));
        expect(ids.size).toBeGreaterThan(40);
    });
});
