const { updateCorporateTaxRegistration } = require('../../corporateTaxRegistration');
const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');

jest.mock('../../../entities/corporateTaxRegistration');

describe('updateCorporateTaxRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true when update is successful', async () => {
        corporateTaxRegistration.update.mockResolvedValue([1]);

        const result = await updateCorporateTaxRegistration(1, { companyName: 'Test' });

        expect(corporateTaxRegistration.update).toHaveBeenCalledWith(
            { companyName: 'Test', status: 'PENDING' },
            { where: { id: 1 } }
        );
        expect(result).toBe(true);
    });

    it('should return false when no record updated', async () => {
        corporateTaxRegistration.update.mockResolvedValue([0]);

        const result = await updateCorporateTaxRegistration(999, { companyName: 'Test' });
        expect(result).toBe(false);
    });

    it('should return false on error', async () => {
        corporateTaxRegistration.update.mockRejectedValue(new Error('DB error'));

        const result = await updateCorporateTaxRegistration(1, {});
        expect(result).toBe(false);
    });
});
