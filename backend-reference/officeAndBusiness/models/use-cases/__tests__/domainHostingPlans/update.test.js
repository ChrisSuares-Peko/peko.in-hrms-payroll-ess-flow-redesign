'use strict';
const { update } = require('../../domainHostingPlans');
const DomainHostingPlans = require('../../../entities/domainHostingPlans');

jest.mock('../../../entities/domainHostingPlans', () => ({
    update: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a plan by id with given data', async () => {
        DomainHostingPlans.update.mockResolvedValue([1]);

        const result = await update(1, { planName: 'Updated Plan', status: false });

        expect(DomainHostingPlans.update).toHaveBeenCalledWith(
            { planName: 'Updated Plan', status: false },
            { where: { id: 1 } }
        );
        expect(result).toEqual([1]);
    });

    it('should return [0] when no record matches the given id', async () => {
        DomainHostingPlans.update.mockResolvedValue([0]);

        const result = await update(999, { planName: 'Non-existent Plan' });

        expect(DomainHostingPlans.update).toHaveBeenCalledWith(
            { planName: 'Non-existent Plan' },
            { where: { id: 999 } }
        );
        expect(result).toEqual([0]);
    });

    it('should throw an error when update fails', async () => {
        DomainHostingPlans.update.mockRejectedValue(new Error('Database error'));

        await expect(update(1, { planName: 'Updated Plan' })).rejects.toThrow('Database error');
    });
});
