const { copyIconsBetweenTrees, collectIcons } = require('../partnerPermissionIcons');

const SVG_A = '<svg viewBox="0 0 24 24"><path d="M1 1h22v22H1z"/></svg>';
const SVG_B = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>';

describe('copyIconsBetweenTrees', () => {
    it('copies a top-level icon onto the matching target service', () => {
        const source = [{ label: 'Payouts', hasAccess: true, icon: SVG_A }];
        const target = [{ label: 'Payouts', hasAccess: false }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0].icon).toBe(SVG_A);
        expect(result.copied).toBe(1);
        expect(result.sourceIconCount).toBe(1);
    });

    it('never alters hasAccess or any other field on the target', () => {
        const source = [{ label: 'Payouts', hasAccess: true, icon: SVG_A, accessKey: 'payouts' }];
        const target = [{ label: 'Payouts', hasAccess: false, accessKey: 'payouts', enableMoreService: true }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0]).toEqual({
            label: 'Payouts',
            hasAccess: false,
            accessKey: 'payouts',
            enableMoreService: true,
            icon: SVG_A,
        });
    });

    it('matches on accessKey even when the labels differ', () => {
        const source = [{ label: 'Payouts', accessKey: 'payouts', icon: SVG_A }];
        const target = [{ label: 'Vendor Payouts', accessKey: 'payouts' }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0].icon).toBe(SVG_A);
        expect(result.copied).toBe(1);
    });

    it('matches on a case- and whitespace-insensitive label when there is no accessKey', () => {
        const source = [{ label: '  Payouts ', icon: SVG_A }];
        const target = [{ label: 'payouts' }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0].icon).toBe(SVG_A);
    });

    it('copies sub-service icons only within their matched parent', () => {
        const source = [
            { label: 'Travel', icon: SVG_A, subServices: [{ label: 'Hotels', icon: SVG_B }] },
            { label: 'Finance', subServices: [{ label: 'Hotels' }] },
        ];
        const target = [
            { label: 'Travel', subServices: [{ label: 'Hotels' }] },
            { label: 'Finance', subServices: [{ label: 'Hotels' }] },
        ];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0].subServices[0].icon).toBe(SVG_B);
        expect(result.permissions[1].subServices[0].icon).toBeUndefined();
    });

    it('leaves a target icon untouched when the source node has none', () => {
        const source = [{ label: 'Payouts' }];
        const target = [{ label: 'Payouts', icon: SVG_B }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0].icon).toBe(SVG_B);
        expect(result.copied).toBe(0);
    });

    it('overwrites a target icon that differs from the source', () => {
        const source = [{ label: 'Payouts', icon: SVG_A }];
        const target = [{ label: 'Payouts', icon: SVG_B }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0].icon).toBe(SVG_A);
        expect(result.copied).toBe(1);
    });

    it('counts an identical icon as unchanged rather than copied', () => {
        const source = [{ label: 'Payouts', icon: SVG_A }];
        const target = [{ label: 'Payouts', icon: SVG_A }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.copied).toBe(0);
        expect(result.unchanged).toBe(1);
    });

    it('reports zero icons when the source tree carries none', () => {
        const source = [{ label: 'Payouts', subServices: [{ label: 'Hotels' }] }];
        const target = [{ label: 'Payouts', subServices: [{ label: 'Hotels' }] }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.sourceIconCount).toBe(0);
        expect(result.sourceIconBytes).toBe(0);
        expect(result.copied).toBe(0);
    });

    it('reports the byte cost of the icons it found', () => {
        const source = [{ label: 'Payouts', icon: SVG_A }];

        const result = copyIconsBetweenTrees(source, [{ label: 'Payouts' }]);

        expect(result.sourceIconBytes).toBe(Buffer.byteLength(SVG_A, 'utf8'));
    });

    it('counts target services the source does not have as unmatched', () => {
        const source = [{ label: 'Payouts', icon: SVG_A }];
        const target = [{ label: 'Payouts' }, { label: 'Gift Cards' }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.copied).toBe(1);
        expect(result.unmatched).toBe(1);
    });

    it('ignores empty-string icons on the source', () => {
        const source = [{ label: 'Payouts', icon: '   ' }];
        const target = [{ label: 'Payouts' }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.sourceIconCount).toBe(0);
        expect(result.permissions[0].icon).toBeUndefined();
    });

    it('survives malformed nodes without throwing', () => {
        const source = [null, 'nonsense', { icon: SVG_A }, { label: 'Payouts', icon: SVG_A }];
        const target = [null, 'nonsense', { label: 'Payouts' }];

        const result = copyIconsBetweenTrees(source, target);

        expect(result.permissions[0]).toBeNull();
        expect(result.permissions[1]).toBe('nonsense');
        expect(result.permissions[2].icon).toBe(SVG_A);
    });

    it('returns the target unchanged when it is not an array', () => {
        const result = copyIconsBetweenTrees([{ label: 'Payouts', icon: SVG_A }], null);

        expect(result.permissions).toBeNull();
        expect(result.copied).toBe(0);
    });

    it('does not mutate the source or target trees', () => {
        const source = [{ label: 'Payouts', icon: SVG_A }];
        const target = [{ label: 'Payouts' }];

        copyIconsBetweenTrees(source, target);

        expect(target[0].icon).toBeUndefined();
        expect(source[0].icon).toBe(SVG_A);
    });
});

describe('collectIcons', () => {
    it('keeps the first icon when a label is duplicated in the source', () => {
        const icons = collectIcons([
            { label: 'Payouts', icon: SVG_A },
            { label: 'Payouts', icon: SVG_B },
        ]);

        expect(icons.get('label:payouts').icon).toBe(SVG_A);
    });

    it('fills an icon from a later duplicate when the first has none', () => {
        const icons = collectIcons([
            { label: 'Payouts' },
            { label: 'Payouts', icon: SVG_B },
        ]);

        expect(icons.get('label:payouts').icon).toBe(SVG_B);
    });
});
