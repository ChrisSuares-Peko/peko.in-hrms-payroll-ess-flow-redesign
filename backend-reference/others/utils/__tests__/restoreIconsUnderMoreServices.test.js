const { restoreIconsUnderMoreServices } = require('../partnerPermissionIcons');
const { clonePermissionTree } = require('../partnerPermissionClone');

const SOURCE_SVG = '<svg id="source"><path d="M1 1h1z"/></svg>';
const TARGET_SVG = '<svg id="target"><path d="M2 2h2z"/></svg>';

const sourceTree = () => [
    {
        label: 'Travel',
        accessKey: 'travel',
        hasAccess: true,
        enableMoreService: true,
        icon: SOURCE_SVG,
        subServices: [
            { label: 'Hotels', accessKey: 'hotels', hasAccess: true, icon: SOURCE_SVG },
            { label: 'Flights', accessKey: 'flights', hasAccess: false, icon: SOURCE_SVG },
        ],
    },
    { label: 'Payouts', accessKey: 'payouts', hasAccess: false, icon: SOURCE_SVG, subServices: [] },
];

const existingTarget = () => [
    {
        label: 'Travel',
        accessKey: 'travel',
        hasAccess: false,
        enableMoreService: true,
        icon: TARGET_SVG,
        subServices: [
            { label: 'Hotels', accessKey: 'hotels', hasAccess: false, icon: TARGET_SVG },
            { label: 'Flights', accessKey: 'flights', hasAccess: false },
        ],
    },
];

const cloneThenRestore = (source, target) =>
    restoreIconsUnderMoreServices(clonePermissionTree(source), target);

describe('restoreIconsUnderMoreServices', () => {
    it("keeps the target's own icon on a More Services entry", () => {
        const { permissions } = cloneThenRestore(sourceTree(), existingTarget());

        expect(permissions[0].icon).toBe(TARGET_SVG);
    });

    it("keeps the target's own icon on a sub-service", () => {
        const { permissions } = cloneThenRestore(sourceTree(), existingTarget());

        expect(permissions[0].subServices[0].icon).toBe(TARGET_SVG);
    });

    it('leaves a sub-service blank when the target has no icon for it', () => {
        const { permissions } = cloneThenRestore(sourceTree(), existingTarget());

        expect(permissions[0].subServices[1].icon).toBeUndefined();
    });

    it("never takes the source's icon under More Services", () => {
        const { permissions } = cloneThenRestore(sourceTree(), existingTarget());

        expect(JSON.stringify(permissions[0])).not.toContain('source');
    });

    it('leaves entries outside More Services untouched', () => {
        const { permissions } = cloneThenRestore(sourceTree(), existingTarget());

        expect(permissions[1].icon).toBe(SOURCE_SVG);
    });

    it('reports how many icons it preserved', () => {
        const { preserved } = cloneThenRestore(sourceTree(), existingTarget());

        expect(preserved).toBe(2);
    });

    it('carries over the cloned access flags, not the target ones', () => {
        const { permissions } = cloneThenRestore(sourceTree(), existingTarget());

        expect(permissions[0].hasAccess).toBe(true);
        expect(permissions[0].subServices[0].hasAccess).toBe(true);
    });

    it('matches nodes by accessKey even when the label differs', () => {
        const renamed = existingTarget();
        renamed[0].label = 'Corporate Travel';

        const { permissions } = cloneThenRestore(sourceTree(), renamed);

        expect(permissions[0].icon).toBe(TARGET_SVG);
    });

    it('changes nothing when there is no existing target tree', () => {
        const cloned = clonePermissionTree(sourceTree());

        const { permissions, preserved } = restoreIconsUnderMoreServices(cloned, null);

        expect(preserved).toBe(0);
        expect(permissions[0].icon).toBeUndefined();
    });

    it('tolerates a malformed cloned tree', () => {
        expect(restoreIconsUnderMoreServices(null, existingTarget())).toEqual({
            permissions: null,
            preserved: 0,
        });
    });
});
