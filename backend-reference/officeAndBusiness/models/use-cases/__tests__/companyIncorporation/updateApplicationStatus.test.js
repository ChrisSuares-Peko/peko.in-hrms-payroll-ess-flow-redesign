const { updateApplicationStatus } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    findOne: jest.fn(),
}));

describe('updateApplicationStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find the application and update it with the provided status data', async () => {
        const statusData = { status: 'APPROVED', approvedAt: new Date('2026-01-01') };
        const updated = { id: 1, ...statusData };
        const mockApp = { id: 1, update: jest.fn().mockResolvedValue(updated) };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await updateApplicationStatus('INC/2026/00001', statusData);

        expect(companyIncorporation.findOne).toHaveBeenCalledWith({ where: { applicationId: 'INC/2026/00001' } });
        expect(mockApp.update).toHaveBeenCalledWith(statusData);
        expect(result).toEqual(updated);
    });

    it('should throw "Application not found" when no application matches', async () => {
        companyIncorporation.findOne.mockResolvedValue(null);

        await expect(updateApplicationStatus('INC/2026/99999', { status: 'APPROVED' }))
            .rejects.toThrow('Application not found');
    });
});
