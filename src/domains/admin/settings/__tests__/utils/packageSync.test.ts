import { describe, expect, it } from 'vitest';

import { SyncApplyResult, SyncOp, SyncOpKind, SyncPreview } from '../../types/packageSync';
import {
    buildApplyPartners,
    countSelected,
    defaultSelection,
    formatChangeValue,
    groupOps,
    hasPendingChanges,
    summarizeApply,
    SYNC_KIND_META,
    SYNC_KINDS,
    toggleOps,
} from '../../utils/packageSync';

const op = (id: string, kind: SyncOpKind, selectable = true): SyncOp => ({
    id,
    key: id.split('#')[0],
    fingerprint: '00000000',
    kind,
    externalId: null,
    packageName: id,
    selectable,
});

const provider = { accessKey: 'peko_pos', label: 'Peko POS', packageAccessCode: 'peko_pos', syncedFields: ['packageName'] };

const preview: SyncPreview = {
    provider,
    type: '2',
    vendor: { count: 3, fetchedAt: '2026-10-15T10:00:00Z' },
    partners: [
        {
            partnerId: 'default',
            localCount: 3,
            summary: { add: 1, update: 1, deactivate: 0, unchanged: 0, unmapped: 1, conflict: 1 },
            ops: [op('add:a#1', 'add'), op('update:u#1', 'update'), op('unmapped:pkg1#1', 'unmapped', false), op('conflict:c#1', 'conflict', false)],
        },
        {
            partnerId: '12',
            localCount: 1,
            summary: { add: 1, update: 0, deactivate: 1, unchanged: 0, unmapped: 0, conflict: 0 },
            ops: [op('add:a#1', 'add'), op('deactivate:d#1', 'deactivate', false)],
        },
    ],
};

describe('defaultSelection', () => {
    it('selects every selectable add/update/deactivate op, keyed by partner', () => {
        const sel = defaultSelection(preview);
        expect([...sel.default]).toEqual(['add:a#1', 'update:u#1']);
        expect([...sel['12']]).toEqual(['add:a#1']);
    });
});

describe('toggleOps / countSelected', () => {
    it('removes and re-adds without mutating the previous selection', () => {
        const initial = defaultSelection(preview);
        const next = toggleOps(initial, 'default', ['add:a#1', 'update:u#1'], false);
        expect(countSelected(next)).toBe(1);
        expect(countSelected(initial)).toBe(3);
        expect(countSelected(toggleOps(next, 'default', ['update:u#1'], true))).toBe(2);
    });
});

describe('buildApplyPartners', () => {
    it('mirrors the preview partnerId and drops partners with nothing selected', () => {
        const sel = toggleOps(defaultSelection(preview), '12', ['add:a#1'], false);
        expect(buildApplyPartners(preview, sel)).toEqual([{ partnerId: 'default', opIds: ['add:a#1', 'update:u#1'] }]);
    });
});

describe('groupOps / hasPendingChanges', () => {
    it('returns an array for every kind, even empty ones', () => {
        const grouped = groupOps(preview.partners[1].ops);
        SYNC_KINDS.forEach(kind => expect(Array.isArray(grouped[kind])).toBe(true));
        expect(grouped.deactivate.map(o => o.id)).toEqual(['deactivate:d#1']);
    });

    it('reports pending changes from the summaries', () => {
        expect(hasPendingChanges(preview)).toBe(true);
        const quiet = { ...preview, partners: preview.partners.map(p => ({ ...p, summary: { ...p.summary, add: 0, update: 0, deactivate: 0 } })) };
        expect(hasPendingChanges(quiet)).toBe(false);
    });
});

describe('summarizeApply / formatChangeValue', () => {
    it('totals counts across partners and mentions skips and rollbacks', () => {
        const result: SyncApplyResult = {
            provider,
            type: '2',
            partners: [
                { partnerId: 'default', counts: { added: 1, updated: 2, deactivated: 0 }, applied: [], skipped: [{ opId: 'x', reason: 'stale' }] },
                { partnerId: '12', counts: { added: 0, updated: 0, deactivated: 0 }, applied: [], skipped: [], error: 'changed underneath' },
            ],
        };
        expect(summarizeApply(result)).toBe('Added 1, updated 2, deactivated 0 (1 skipped, 1 partner(s) rolled back)');
    });

    it('renders empty, boolean and plain values', () => {
        expect(formatChangeValue(null)).toBe('—');
        expect(formatChangeValue('')).toBe('—');
        expect(formatChangeValue(true)).toBe('Active');
        expect(formatChangeValue('Base')).toBe('Base');
    });
});

describe('SYNC_KIND_META', () => {
    it('has a label and color for every kind, and only add/update/deactivate are selectable', () => {
        SYNC_KINDS.forEach(kind => {
            expect(SYNC_KIND_META[kind]).toEqual(expect.objectContaining({ label: expect.any(String), color: expect.any(String) }));
        });
        expect(SYNC_KINDS.filter(k => SYNC_KIND_META[k].selectable)).toEqual(['add', 'update', 'deactivate']);
    });
});
