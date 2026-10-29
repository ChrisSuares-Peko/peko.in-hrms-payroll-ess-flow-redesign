const { clonePermissionTree, summarisePermissionTree } = require('../partnerPermissionClone');

const SVG = '<svg viewBox="0 0 24 24"><path d="M1 1h22v22H1z"/></svg>';

const tree = () => [
    {
        label: 'Travel',
        hasAccess: true,
        accessKey: 'travel',
        icon: SVG,
        enableMoreService: true,
        subServices: [
            { label: 'Hotels', hasAccess: true, accessKey: 'hotels' },
            { label: 'Flights', hasAccess: false, accessKey: 'flights', icon: SVG },
        ],
    },
    { label: 'Payouts', hasAccess: false, accessKey: 'payouts', subServices: [] },
];

describe('clonePermissionTree', () => {
    it('reproduces every field except the icons under a More Services entry', () => {
        const expected = tree();
        delete expected[0].icon;
        delete expected[0].subServices[1].icon;

        expect(clonePermissionTree(tree())).toEqual(expected);
    });

    it('preserves service and sub-service order', () => {
        const cloned = clonePermissionTree(tree());

        expect(cloned.map(s => s.label)).toEqual(['Travel', 'Payouts']);
        expect(cloned[0].subServices.map(s => s.label)).toEqual(['Hotels', 'Flights']);
    });

    it('preserves hasAccess on both levels', () => {
        const cloned = clonePermissionTree(tree());

        expect(cloned[0].hasAccess).toBe(true);
        expect(cloned[1].hasAccess).toBe(false);
        expect(cloned[0].subServices[0].hasAccess).toBe(true);
        expect(cloned[0].subServices[1].hasAccess).toBe(false);
    });

    it('drops inline svg icons on a More Services entry and everything under it', () => {
        const cloned = clonePermissionTree(tree());

        expect(cloned[0].enableMoreService).toBe(true);
        expect(cloned[0].icon).toBeUndefined();
        expect(cloned[0].subServices[1].icon).toBeUndefined();
    });

    it('carries inline svg icons across for services outside More Services', () => {
        const cloned = clonePermissionTree([
            {
                label: 'Payouts',
                accessKey: 'payouts',
                icon: SVG,
                subServices: [{ label: 'Bulk', accessKey: 'bulk', icon: SVG }],
            },
        ]);

        expect(cloned[0].icon).toBe(SVG);
        expect(cloned[0].subServices[0].icon).toBe(SVG);
    });

    it('detaches the copy so mutating it cannot affect the source', () => {
        const source = tree();
        const cloned = clonePermissionTree(source);

        cloned[0].label = 'Changed';
        cloned[0].subServices[0].hasAccess = false;

        expect(source[0].label).toBe('Travel');
        expect(source[0].subServices[0].hasAccess).toBe(true);
    });

    it('keeps an empty subServices array rather than dropping it', () => {
        const cloned = clonePermissionTree(tree());

        expect(cloned[1].subServices).toEqual([]);
    });

    it('passes through malformed nodes untouched', () => {
        const cloned = clonePermissionTree([null, 'nonsense', 7, { label: 'Ok' }]);

        expect(cloned).toEqual([null, 'nonsense', 7, { label: 'Ok' }]);
    });

    it('returns a non-array input unchanged', () => {
        expect(clonePermissionTree(null)).toBeNull();
        expect(clonePermissionTree(undefined)).toBeUndefined();
    });
});

describe('summarisePermissionTree', () => {
    it('counts services, sub-services and icons', () => {
        const summary = summarisePermissionTree(tree());

        expect(summary.services).toBe(2);
        expect(summary.subServices).toBe(2);
        expect(summary.icons).toBe(2);
    });

    it('reports the byte cost of the inline icons', () => {
        const summary = summarisePermissionTree(tree());

        expect(summary.iconBytes).toBe(Buffer.byteLength(SVG, 'utf8') * 2);
    });

    it('ignores blank icons', () => {
        const summary = summarisePermissionTree([{ label: 'A', icon: '  ' }]);

        expect(summary.icons).toBe(0);
        expect(summary.iconBytes).toBe(0);
    });

    it('returns zeroes for a non-array input', () => {
        expect(summarisePermissionTree(null)).toEqual({
            services: 0, subServices: 0, icons: 0, iconBytes: 0,
        });
    });

    it('skips malformed nodes without throwing', () => {
        const summary = summarisePermissionTree([null, 'nonsense', { label: 'A', subServices: [null, { label: 'B' }] }]);

        expect(summary.services).toBe(1);
        expect(summary.subServices).toBe(1);
    });
});
