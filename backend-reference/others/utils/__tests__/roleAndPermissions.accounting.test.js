const MOCK_CATEGORIZED_SERVICE = require('../roleAndPermissions');

const EXPECTED = {
    Operations: [
        'Order Journals',
        'Wallet Journals',
        'Service without plans',
        'Service with plans',
        'Peko Subscriptions',
        'Whitelabel Partners',
        'Chart of Accounts',
        'Internal Purchase Accounts',
        'Third Party Configuration',
    ],
    Ledgers: ['Vendors', 'Subscribers', 'Partners', 'Payment Gateways'],
    Others: ['Approvals', 'Manual Operations', 'Audit Trail', 'FAQ'],
};

const VIEW_ONLY = ['FAQ', 'Audit Trail'];

const findCategory = name => MOCK_CATEGORIZED_SERVICE.find(c => c.serviceCategory === name);

describe('Accounting permission catalogue', () => {
    const accounting = findCategory('Accounting');

    it('exists with the expected groups and leaves', () => {
        expect(accounting).toBeDefined();
        expect(accounting.hasAccess).toBe(false);

        const actual = Object.fromEntries(
            accounting.services.map(group => [group.category, group.services.map(s => s.service)])
        );
        expect(actual).toEqual(EXPECTED);
    });

    it('is placed after Manage so existing screens resolve their own leaf first', () => {
        const names = MOCK_CATEGORIZED_SERVICE.map(c => c.serviceCategory);
        expect(names.indexOf('Accounting')).toBeGreaterThan(names.indexOf('Manage'));
        expect(names.indexOf('Accounting')).toBeGreaterThan(names.indexOf('Settings'));
        expect(names.indexOf('Accounting')).toBeGreaterThan(names.indexOf('Reports'));
    });

    it('uses only letters, digits and spaces in leaf names so URL slugs round-trip', () => {
        const leaves = accounting.services.flatMap(group => group.services);

        leaves.forEach(leaf => {
            expect(leaf.service).toMatch(/^[A-Za-z0-9 ]+$/);
        });
        leaves
            .filter(leaf => !VIEW_ONLY.includes(leaf.service))
            .forEach(leaf => {
                expect(leaf).toEqual(
                    expect.objectContaining({
                        view: false,
                        write: false,
                        update: false,
                        hasAccess: false,
                    })
                );
            });
    });

    it('carries the FAQ as read-only documentation, with a view flag alone', () => {
        const faq = accounting.services
            .flatMap(group => group.services)
            .find(leaf => leaf.service === 'FAQ');

        expect(faq).toEqual({ view: false, service: 'FAQ', hasAccess: false });
    });

    it('carries the Audit Trail as a read-only list, with a view flag alone', () => {
        const auditTrail = accounting.services
            .flatMap(group => group.services)
            .find(leaf => leaf.service === 'Audit Trail');

        expect(auditTrail).toEqual({ view: false, service: 'Audit Trail', hasAccess: false });
    });
});
