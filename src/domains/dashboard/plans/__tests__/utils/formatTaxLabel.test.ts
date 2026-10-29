import { describe, expect, it } from 'vitest';

import { formatTaxLabel } from '../../utils';

describe('formatTaxLabel', () => {
    it('renders the server-provided percent rate', () => {
        expect(formatTaxLabel(18)).toBe('GST (18%)');
        expect(formatTaxLabel(12.5)).toBe('GST (12.5%)');
    });

    it('falls back to a plain label when the rate is absent or non-positive', () => {
        expect(formatTaxLabel(undefined)).toBe('GST');
        expect(formatTaxLabel(0)).toBe('GST');
        expect(formatTaxLabel(Number.NaN)).toBe('GST');
    });
});
