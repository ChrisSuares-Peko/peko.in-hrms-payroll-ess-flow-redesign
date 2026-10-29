const { updateVendorStages } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    findOne: jest.fn(),
}));

describe('updateVendorStages', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the vendorStages field on the matched application', async () => {
        const stages = [{ title: 'Submitted', description: 'Done' }];
        const updated = { id: 1, vendorStages: stages };
        const mockApp = { id: 1, update: jest.fn().mockResolvedValue(updated) };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await updateVendorStages('INC/2026/00001', stages);

        expect(companyIncorporation.findOne).toHaveBeenCalledWith({ where: { applicationId: 'INC/2026/00001' } });
        expect(mockApp.update).toHaveBeenCalledWith({ vendorStages: stages });
        expect(result).toEqual(updated);
    });

    it('should throw "Application not found" when no application matches', async () => {
        companyIncorporation.findOne.mockResolvedValue(null);

        await expect(updateVendorStages('INC/2026/99999', []))
            .rejects.toThrow('Application not found');
    });
});
