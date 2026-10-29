const MOCK_CATEGORIZED_SERVICE = require('../roleAndPermissions');

const findGroup = (categoryName, groupName) => {
    const category = MOCK_CATEGORIZED_SERVICE.find(c => c.serviceCategory === categoryName);
    return category && category.services.find(group => group.category === groupName);
};

describe('Settings › Services permission catalogue', () => {
    const services = findGroup('Settings', 'Services');

    it('lists the service admin screens with the read-only accounting approvals view last', () => {
        expect(services).toBeDefined();
        expect(services.services.map(leaf => leaf.service)).toEqual([
            'Service Operators',
            'Packages',
            'Cashback',
            'Disable Services',
            'Service Packages',
            'Business Registration Catalog',
            'Service Classification',
            'Accounting Approvals',
        ]);
    });

    it('carries Accounting Approvals as a view-only leaf, like the accounting FAQ', () => {
        const leaf = services.services.find(item => item.service === 'Accounting Approvals');

        expect(leaf).toEqual({ view: false, service: 'Accounting Approvals', hasAccess: false });
    });

    it('keeps every other leaf with the full set of flags', () => {
        services.services
            .filter(leaf => leaf.service !== 'Accounting Approvals')
            .forEach(leaf => {
                expect(leaf).toEqual(
                    expect.objectContaining({ view: false, write: false, update: false, hasAccess: false })
                );
            });
    });
});
