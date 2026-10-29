'use strict';
const { getActivePlans } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');

jest.mock('../../../entities/domainHostingPlans', () => ({
    findAll: jest.fn(),
}));

describe('getActivePlans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active plans when no planType is provided', async () => {
        const mockPlans = [{ id: 1, status: true }, { id: 2, status: true }];
        DomainHostingPlans.findAll.mockResolvedValue(mockPlans);

        const result = await getActivePlans();

        expect(DomainHostingPlans.findAll).toHaveBeenCalledWith({
            where: { status: true },
            raw: true,
        });
        expect(result).toEqual(mockPlans);
    });

    it('should filter active plans by planType when provided', async () => {
        const mockPlans = [{ id: 1, status: true, planType: 'hosting' }];
        DomainHostingPlans.findAll.mockResolvedValue(mockPlans);

        const result = await getActivePlans('hosting');

        expect(DomainHostingPlans.findAll).toHaveBeenCalledWith({
            where: { status: true, planType: 'hosting' },
            raw: true,
        });
        expect(result).toEqual(mockPlans);
    });

    it('should return an empty array when no active plans exist', async () => {
        DomainHostingPlans.findAll.mockResolvedValue([]);

        const result = await getActivePlans();

        expect(result).toEqual([]);
    });

    it('should return null on error instead of throwing', async () => {
        DomainHostingPlans.findAll.mockRejectedValue(new Error('Database error'));

        const result = await getActivePlans();

        expect(result).toBeNull();
    });

    it('should return null on error even when planType is provided', async () => {
        DomainHostingPlans.findAll.mockRejectedValue(new Error('Database error'));

        const result = await getActivePlans('domain');

        expect(result).toBeNull();
    });
});
