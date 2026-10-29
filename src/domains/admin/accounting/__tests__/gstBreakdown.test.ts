import { describe, expect, it } from 'vitest';

import { gstBreakdown } from '../components/ledgers/VendorEntryDrawers';

describe('the split shown while an entry is being typed', () => {
    it('carves GST out of an inclusive figure', () => {
        expect(gstBreakdown(236, 'INCLUSIVE', 18)).toEqual({ taxable: 200, gst: 36, total: 236 });
        expect(gstBreakdown(1500, 'INCLUSIVE', 18)).toEqual({
            taxable: 1271.19,
            gst: 228.81,
            total: 1500,
        });
    });

    it('adds GST on top of an exclusive figure', () => {
        expect(gstBreakdown(200, 'EXCLUSIVE', 18)).toEqual({ taxable: 200, gst: 36, total: 236 });
        expect(gstBreakdown(99.99, 'EXCLUSIVE', 5)).toEqual({
            taxable: 99.99,
            gst: 5,
            total: 104.99,
        });
    });
});
