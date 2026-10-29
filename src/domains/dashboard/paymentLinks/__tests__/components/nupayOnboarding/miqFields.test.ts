import { describe, it, expect } from 'vitest';

import { MIQ_SECTIONS } from '../../../components/nupayOnboarding/miqFields';

const allFields = MIQ_SECTIONS.flatMap(s => s.fields);
const field = (name: string) => allFields.find(f => f.name === name)!;

describe('MIQ_SECTIONS field config', () => {
    it('auto-uppercases and PAN-validates both PAN fields', () => {
        ['business_pan', 'authorised_signatory_pan_number'].forEach(name => {
            const f = field(name);
            expect(f.uppercase).toBe(true);
            expect(f.pattern!.test('ABCDE1234F')).toBe(true);
            expect(f.pattern!.test('ABC')).toBe(false);
        });
    });

    it('auto-uppercases and validates GSTIN', () => {
        const f = field('gstin');
        expect(f.uppercase).toBe(true);
        expect(f.pattern!.test('27ABCDE1234F1Z5')).toBe(true);
        expect(f.pattern!.test('27ABCDE1234F')).toBe(false);
    });

    it('renders the establishment date as a calendar field', () => {
        expect(field('establishment_date').type).toBe('date');
    });

    it('flags the transactions report field as an email input', () => {
        expect(field('transactions_report_email').email).toBe(true);
    });

    it('accepts scheme-less and full URLs on policy links, rejects non-URLs', () => {
        const f = field('about_us_link');
        expect(f.pattern!.test('example.com')).toBe(true);
        expect(f.pattern!.test('https://example.com/terms')).toBe(true);
        expect(f.pattern!.test('not a url')).toBe(false);
    });

    it('has unique field names across all sections', () => {
        const names = allFields.map(f => f.name);
        expect(new Set(names).size).toBe(names.length);
    });
});
