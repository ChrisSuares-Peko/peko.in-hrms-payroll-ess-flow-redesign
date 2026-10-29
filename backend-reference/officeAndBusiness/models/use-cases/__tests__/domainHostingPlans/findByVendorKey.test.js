'use strict';
const { findByVendorKey } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');
const { Op } = require('sequelize');

jest.mock('../../../entities/domainHostingPlans', () => ({
    findOne: jest.fn(),
}));

describe('findByVendorKey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a plan by productId only', async () => {
        const mockPlan = { id: 1, productId: 'linux-hosting' };
        DomainHostingPlans.findOne.mockResolvedValue(mockPlan);

        const result = await findByVendorKey({ productId: 'linux-hosting' });

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({
            where: { productId: 'linux-hosting' },
            raw: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should include planId in where clause when planId is provided', async () => {
        const mockPlan = { id: 1, productId: 'linux-hosting', planId: 'plan-1' };
        DomainHostingPlans.findOne.mockResolvedValue(mockPlan);

        const result = await findByVendorKey({ productId: 'linux-hosting', planId: 'plan-1' });

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({
            where: { productId: 'linux-hosting', planId: 'plan-1' },
            raw: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should set planId to null when planId is falsy but defined', async () => {
        DomainHostingPlans.findOne.mockResolvedValue(null);

        await findByVendorKey({ productId: 'linux-hosting', planId: '' });

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({
            where: { productId: 'linux-hosting', planId: null },
            raw: true,
        });
    });

    it('should include billingCycle in where clause when provided', async () => {
        const mockPlan = { id: 1, productId: 'linux-hosting', billingCycle: 12 };
        DomainHostingPlans.findOne.mockResolvedValue(mockPlan);

        const result = await findByVendorKey({ productId: 'linux-hosting', billingCycle: 12 });

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({
            where: { productId: 'linux-hosting', billingCycle: 12 },
            raw: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should set billingCycle to null when billingCycle is falsy but defined', async () => {
        DomainHostingPlans.findOne.mockResolvedValue(null);

        await findByVendorKey({ productId: 'linux-hosting', billingCycle: 0 });

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({
            where: { productId: 'linux-hosting', billingCycle: null },
            raw: true,
        });
    });

    it('should exclude a plan by id when excludeId is provided', async () => {
        DomainHostingPlans.findOne.mockResolvedValue(null);

        await findByVendorKey({ productId: 'linux-hosting' }, 5);

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({
            where: { productId: 'linux-hosting', id: { [Op.ne]: 5 } },
            raw: true,
        });
    });

    it('should not add id exclusion when excludeId is not provided', async () => {
        DomainHostingPlans.findOne.mockResolvedValue(null);

        await findByVendorKey({ productId: 'linux-hosting' });

        const calledWith = DomainHostingPlans.findOne.mock.calls[0][0];
        expect(calledWith.where.id).toBeUndefined();
    });

    it('should return null when no matching plan is found', async () => {
        DomainHostingPlans.findOne.mockResolvedValue(null);

        const result = await findByVendorKey({ productId: 'nonexistent' });

        expect(result).toBeNull();
    });

    it('should throw an error when findOne fails', async () => {
        DomainHostingPlans.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findByVendorKey({ productId: 'linux-hosting' })).rejects.toThrow('Database error');
    });
});
