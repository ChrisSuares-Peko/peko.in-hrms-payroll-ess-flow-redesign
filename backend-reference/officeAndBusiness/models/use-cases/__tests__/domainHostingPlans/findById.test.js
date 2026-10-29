'use strict';
const { findById } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');

jest.mock('../../../entities/domainHostingPlans', () => ({
    findOne: jest.fn(),
}));

describe('findById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a plan by id', async () => {
        const mockPlan = { id: 1, planType: 'hosting', planName: 'Basic Hosting' };
        DomainHostingPlans.findOne.mockResolvedValue(mockPlan);

        const result = await findById(1);

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({ where: { id: 1 }, raw: true });
        expect(result).toEqual(mockPlan);
    });

    it('should return null when plan is not found', async () => {
        DomainHostingPlans.findOne.mockResolvedValue(null);

        const result = await findById(999);

        expect(DomainHostingPlans.findOne).toHaveBeenCalledWith({ where: { id: 999 }, raw: true });
        expect(result).toBeNull();
    });

    it('should throw an error when findOne fails', async () => {
        DomainHostingPlans.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findById(1)).rejects.toThrow('Database error');
    });
});
