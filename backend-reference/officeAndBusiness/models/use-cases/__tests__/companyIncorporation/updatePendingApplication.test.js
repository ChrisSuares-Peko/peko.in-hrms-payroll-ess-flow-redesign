const { updatePendingApplication } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

const mockT = { LOCK: { UPDATE: 'LOCK.UPDATE' } };

jest.mock('../../../entities/companyIncorporation', () => ({
    findOne: jest.fn(),
    sequelize: {
        transaction: jest.fn(),
    },
}));

describe('updatePendingApplication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Run the transaction callback synchronously with our fake transaction object.
        companyIncorporation.sequelize.transaction.mockImplementation((cb) => cb(mockT));
    });

    it('should lock the row, update the PENDING application and return it', async () => {
        const fields = { totalAmount: 15000, selectedServices: ['gst_registration'] };
        const mockApp = { id: 1, status: 'PENDING', update: jest.fn().mockResolvedValue(true) };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await updatePendingApplication('INC/2026/00001', fields);

        expect(companyIncorporation.findOne).toHaveBeenCalledWith({
            where: { applicationId: 'INC/2026/00001' },
            lock: mockT.LOCK.UPDATE,
            transaction: mockT,
        });
        expect(mockApp.update).toHaveBeenCalledWith(fields, { transaction: mockT });
        expect(result).toBe(mockApp);
    });

    it('should throw "Application not found" when no row matches', async () => {
        companyIncorporation.findOne.mockResolvedValue(null);

        await expect(updatePendingApplication('INC/2026/99999', {}))
            .rejects.toThrow('Application not found');
    });

    it('should refuse to update an application that is not PENDING', async () => {
        const mockApp = { id: 1, status: 'SUBMITTED', update: jest.fn() };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        await expect(updatePendingApplication('INC/2026/00001', { totalAmount: 1 }))
            .rejects.toThrow('Only PENDING applications can be updated via submit');
        expect(mockApp.update).not.toHaveBeenCalled();
    });
});
