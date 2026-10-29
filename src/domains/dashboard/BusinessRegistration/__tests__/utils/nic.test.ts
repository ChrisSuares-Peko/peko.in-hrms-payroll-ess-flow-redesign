import { describe, it, expect } from 'vitest';

import { NIC_SECTIONS, activityLevels, normalizeNic } from '../../utils/nic';

describe('normalizeNic', () => {
    it('normalizes the vendor code→label map and sorts by code', () => {
        const res = { data: { '01120': 'Growing of rice', '01110': 'Growing of cereals' } };
        expect(normalizeNic(res)).toEqual([
            { code: '01110', label: 'Growing of cereals' },
            { code: '01120', label: 'Growing of rice' },
        ]);
    });

    it('drops entries whose label is not a string', () => {
        const res = { data: { '01110': 'Valid', '01120': 123 } };
        expect(normalizeNic(res)).toEqual([{ code: '01110', label: 'Valid' }]);
    });

    it('returns an empty array for null / non-object input', () => {
        expect(normalizeNic(null)).toEqual([]);
        expect(normalizeNic(42)).toEqual([]);
        expect(normalizeNic(undefined)).toEqual([]);
    });
});

describe('activityLevels', () => {
    it('derives Level 2 (division) and Level 1 (section) from a Level-3 code', () => {
        const rows = activityLevels({ code: '01110', label: 'Growing of cereals' });
        expect(rows).toHaveLength(3);
        expect(rows[0]).toEqual(
            expect.objectContaining({ level: 'Level 3', code: '01110', selected: true })
        );
        // division "01" → section A (Agriculture) per the division ranges
        expect(rows[1].label).toBe('01');
        expect(rows[2].label).toBe(`A — ${NIC_SECTIONS.A}`);
    });

    it('prefers explicit parent codes/labels from the option when supplied', () => {
        const rows = activityLevels({
            code: '45201',
            label: 'Maintenance of motor vehicles',
            level2Code: '45',
            level2Label: 'Trade of motor vehicles',
            level1Code: 'G',
            level1Label: 'Wholesale and Retail Trade',
        });
        expect(rows[1].label).toBe('45 — Trade of motor vehicles');
        expect(rows[2].label).toBe('G — Wholesale and Retail Trade');
    });
});
