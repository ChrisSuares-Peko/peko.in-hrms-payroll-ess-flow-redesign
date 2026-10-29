const { appendDocumentToApplication } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

const mockT = { LOCK: { UPDATE: 'LOCK.UPDATE' } };

jest.mock('../../../entities/companyIncorporation', () => ({
    findOne: jest.fn(),
    sequelize: {
        transaction: jest.fn(),
    },
}));

describe('appendDocumentToApplication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        companyIncorporation.sequelize.transaction.mockImplementation((cb) => cb(mockT));
    });

    it('should append a new document when the docType is not already present', async () => {
        const existingDoc = { docType: 'utility_bill', fileName: 'bill.pdf' };
        const newDoc = { docType: 'noc_from_owner', fileName: 'noc.pdf' };
        const mockApp = { documents: [existingDoc], update: jest.fn().mockResolvedValue(true) };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await appendDocumentToApplication('INC/2026/00001', 11, 22, newDoc);

        expect(companyIncorporation.findOne).toHaveBeenCalledWith({
            where: { applicationId: 'INC/2026/00001', credentialId: 11, corporateId: 22 },
            lock: mockT.LOCK.UPDATE,
            transaction: mockT,
        });
        expect(mockApp.update).toHaveBeenCalledWith(
            { documents: [existingDoc, newDoc] },
            { transaction: mockT },
        );
        expect(result).toEqual(newDoc);
    });

    it('should replace an existing document with the same docType', async () => {
        const oldDoc = { docType: 'utility_bill', fileName: 'old.pdf' };
        const replacement = { docType: 'utility_bill', fileName: 'new.pdf' };
        const mockApp = { documents: [oldDoc], update: jest.fn().mockResolvedValue(true) };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        const result = await appendDocumentToApplication('INC/2026/00001', 11, 22, replacement);

        expect(mockApp.update).toHaveBeenCalledWith(
            { documents: [replacement] },
            { transaction: mockT },
        );
        expect(result).toEqual(replacement);
    });

    it('should start a fresh documents array when the field is not an array', async () => {
        const newDoc = { docType: 'utility_bill', fileName: 'bill.pdf' };
        const mockApp = { documents: null, update: jest.fn().mockResolvedValue(true) };
        companyIncorporation.findOne.mockResolvedValue(mockApp);

        await appendDocumentToApplication('INC/2026/00001', 11, 22, newDoc);

        expect(mockApp.update).toHaveBeenCalledWith(
            { documents: [newDoc] },
            { transaction: mockT },
        );
    });

    it('should throw "Application not found" when no row matches the scope', async () => {
        companyIncorporation.findOne.mockResolvedValue(null);

        await expect(appendDocumentToApplication('INC/2026/99999', 11, 22, { docType: 'utility_bill' }))
            .rejects.toThrow('Application not found');
    });
});
