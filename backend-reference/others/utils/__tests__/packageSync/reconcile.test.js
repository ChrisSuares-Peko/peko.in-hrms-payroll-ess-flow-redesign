const { buildDiff, splitOpId } = require('../../packageSync/reconcile');

const vendor = (externalId, packageName, extra = {}) => ({ externalId, fields: { packageName, ...extra }, raw: {} });
const local = overrides => ({ id: 1, externalId: 'x', packageName: 'Name', status: 1, ...overrides });
const kinds = ops => ops.map(op => op.kind);

describe('buildDiff', () => {
    const syncedFields = ['packageName'];

    it('adds a vendor plan with no local match, created from the synced fields only', () => {
        const { ops, summary } = buildDiff({
            vendorPlans: [vendor('6ab95a6901e6e53430693269', 'Base')],
            localPackages: [],
            syncedFields,
        });

        expect(kinds(ops)).toEqual(['add']);
        expect(ops[0].id).toMatch(/^add:6ab95a6901e6e53430693269#[0-9a-f]{8}$/);
        expect(ops[0].changes).toEqual({ packageName: { from: null, to: 'Base' } });
        expect(ops[0].selectable).toBe(true);
        expect(summary).toEqual({ add: 1, update: 0, deactivate: 0, conflict: 0, unmapped: 0, unchanged: 0 });
    });

    it('updates a matched row whose synced field differs, and never touches status', () => {
        const { ops } = buildDiff({
            vendorPlans: [vendor('x', 'New')],
            localPackages: [local({ id: 7, packageName: 'Old' })],
            syncedFields,
        });

        expect(kinds(ops)).toEqual(['update']);
        expect(ops[0].packageId).toBe(7);
        expect(ops[0].changes).toEqual({ packageName: { from: 'Old', to: 'New' } });
        expect(ops[0].changes.status).toBeUndefined();
    });

    it('compares after trimming only, not case-insensitively', () => {
        const trimmed = buildDiff({ vendorPlans: [vendor('x', 'New')], localPackages: [local({ packageName: ' New ' })], syncedFields });
        expect(kinds(trimmed.ops)).toEqual(['unchanged']);

        const cased = buildDiff({ vendorPlans: [vendor('x', 'New')], localPackages: [local({ packageName: 'new' })], syncedFields });
        expect(kinds(cased.ops)).toEqual(['update']);
    });

    it('deactivates an active row the vendor no longer returns, and leaves an inactive one unchanged', () => {
        const active = buildDiff({ vendorPlans: [vendor('other', 'Other')], localPackages: [local({ id: 3 })], syncedFields });
        const deactivate = active.ops.find(op => op.kind === 'deactivate');
        expect(deactivate).toMatchObject({ packageId: 3, changes: { status: { from: true, to: false } }, selectable: true });

        const inactive = buildDiff({ vendorPlans: [vendor('other', 'Other')], localPackages: [local({ id: 3, status: 0 })], syncedFields });
        const unchanged = inactive.ops.find(op => op.packageId === 3);
        expect(unchanged).toMatchObject({ kind: 'unchanged', reason: 'already-inactive', selectable: false });
    });

    it('lists rows with an empty or whitespace externalId as unmapped, with a hint when a vendor add has the same name', () => {
        const { ops } = buildDiff({
            vendorPlans: [vendor('v1', 'Base')],
            localPackages: [local({ id: 9, externalId: null, packageName: 'base' }), local({ id: 10, externalId: '   ', packageName: 'Other' })],
            syncedFields,
        });

        const add = ops.find(op => op.kind === 'add');
        const hinted = ops.find(op => op.packageId === 9);
        const plain = ops.find(op => op.packageId === 10);
        expect(hinted).toMatchObject({ kind: 'unmapped', selectable: false, hint: { externalId: 'v1', packageName: 'Base', opId: add.id } });
        expect(plain).toMatchObject({ kind: 'unmapped', selectable: false });
        expect(plain.hint).toBeUndefined();
    });

    it('gives no hint when the same-named vendor plan is already mapped', () => {
        const { ops } = buildDiff({
            vendorPlans: [vendor('v1', 'Base')],
            localPackages: [local({ id: 1, externalId: 'v1', packageName: 'Base' }), local({ id: 2, externalId: null, packageName: 'Base' })],
            syncedFields,
        });
        expect(ops.find(op => op.packageId === 2).hint).toBeUndefined();
    });

    it('reports duplicate local externalIds as a conflict and does not add or update them', () => {
        const { ops } = buildDiff({
            vendorPlans: [vendor('x', 'New')],
            localPackages: [local({ id: 1 }), local({ id: 2 })],
            syncedFields,
        });
        expect(kinds(ops)).toEqual(['conflict']);
        expect(ops[0]).toMatchObject({ externalId: 'x', packageIds: [1, 2], reason: 'duplicate-local-externalId', selectable: false });
    });

    it('reports duplicate local externalIds as a conflict even when the vendor no longer returns the plan', () => {
        const { ops } = buildDiff({ vendorPlans: [vendor('other', 'Other')], localPackages: [local({ id: 1 }), local({ id: 2 })], syncedFields });
        expect(ops.filter(op => op.externalId === 'x').map(op => op.kind)).toEqual(['conflict']);
    });

    it('reports duplicate vendor plan ids as a conflict', () => {
        const { ops } = buildDiff({ vendorPlans: [vendor('x', 'A'), vendor('x', 'B')], localPackages: [], syncedFields });
        expect(ops).toHaveLength(1);
        expect(ops[0]).toMatchObject({ kind: 'conflict', reason: 'duplicate-vendor-plan' });
    });

    it('still produces deactivates for an empty vendor list (the guard lives in loadVendorPlans, not here)', () => {
        const { ops } = buildDiff({ vendorPlans: [], localPackages: [local({ id: 5 })], syncedFields });
        expect(kinds(ops)).toEqual(['deactivate']);
    });

    it('is deterministic, and a content change alters the fingerprint but not the key', () => {
        const input = { vendorPlans: [vendor('x', 'New')], localPackages: [local({ packageName: 'Old' })], syncedFields };
        expect(buildDiff(input)).toEqual(buildDiff(input));

        const changed = buildDiff({ ...input, vendorPlans: [vendor('x', 'Newer')] });
        expect(changed.ops[0].key).toBe(buildDiff(input).ops[0].key);
        expect(changed.ops[0].fingerprint).not.toBe(buildDiff(input).ops[0].fingerprint);
        expect(splitOpId(changed.ops[0].id)).toBe(changed.ops[0].key);
    });

    it('treats a null local description and an empty vendor description as unchanged', () => {
        const { ops } = buildDiff({
            vendorPlans: [vendor('x', 'Name', { description: '' })],
            localPackages: [local({ description: null })],
            syncedFields: ['packageName', 'description'],
        });
        expect(kinds(ops)).toEqual(['unchanged']);
    });

    it('sorts ops by kind order then key so previews are stable', () => {
        const { ops } = buildDiff({
            vendorPlans: [vendor('b', 'B'), vendor('a', 'A'), vendor('x', 'Changed')],
            localPackages: [local({ id: 1, externalId: 'x', packageName: 'Old' }), local({ id: 2, externalId: 'gone' }), local({ id: 3, externalId: null })],
            syncedFields,
        });
        expect(ops.map(op => op.key)).toEqual(['add:a', 'add:b', 'update:x', 'deactivate:gone', 'unmapped:pkg3']);
    });
});
