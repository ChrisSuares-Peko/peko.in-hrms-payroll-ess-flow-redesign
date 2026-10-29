'use strict';
const { create } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');

jest.mock('../../../entities/domainHostingPlans', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a domain hosting plan with given params', async () => {
        const params = { planType: 'hosting', planName: 'Basic Hosting', productId: 'linux-hosting' };
        const mockPlan = { id: 1, ...params };
        DomainHostingPlans.create.mockResolvedValue(mockPlan);

        const result = await create(params);

        expect(DomainHostingPlans.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockPlan);
    });

    it('should return null when create returns null', async () => {
        DomainHostingPlans.create.mockResolvedValue(null);

        const result = await create({ planType: 'hosting' });

        expect(result).toBeNull();
    });

    it('should throw an error when create fails', async () => {
        DomainHostingPlans.create.mockRejectedValue(new Error('Database error'));

        await expect(create({ planType: 'hosting' })).rejects.toThrow('Database error');
    });
});
