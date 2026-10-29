'use strict';
const { deletePlan } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');

jest.mock('../../../entities/domainHostingPlans', () => ({
    destroy: jest.fn(),
}));

describe('deletePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a plan by id', async () => {
        DomainHostingPlans.destroy.mockResolvedValue(1);

        const result = await deletePlan(1);

        expect(DomainHostingPlans.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(result).toBe(1);
    });

    it('should return 0 when no record matches the given id', async () => {
        DomainHostingPlans.destroy.mockResolvedValue(0);

        const result = await deletePlan(999);

        expect(DomainHostingPlans.destroy).toHaveBeenCalledWith({ where: { id: 999 } });
        expect(result).toBe(0);
    });

    it('should throw an error when destroy fails', async () => {
        DomainHostingPlans.destroy.mockRejectedValue(new Error('Database error'));

        await expect(deletePlan(1)).rejects.toThrow('Database error');
    });
});
