const { deleteAgreement } = require('../../agreement');
const agreement = require('../../../entities/agreement');
const eSign = require('../../../entities/eSign');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/eSign', () => ({
    update: jest.fn(),
}));

describe('deleteAgreement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete the agreement and return true', async () => {
        const mockDoc = { id: 1, eSignId: null, destroy: jest.fn().mockResolvedValue(true) };
        agreement.findOne.mockResolvedValue(mockDoc);

        const result = await deleteAgreement(1, 10);

        expect(agreement.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
        expect(mockDoc.destroy).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should nullify eSign agreementId before deleting when eSignId exists', async () => {
        const mockDoc = { id: 1, eSignId: 55, destroy: jest.fn().mockResolvedValue(true) };
        agreement.findOne.mockResolvedValue(mockDoc);

        await deleteAgreement(1, 10);

        expect(eSign.update).toHaveBeenCalledWith(
            { agreementId: null },
            { where: { id: 55 } }
        );
        expect(mockDoc.destroy).toHaveBeenCalled();
    });

    it('should not call eSign.update when eSignId is null', async () => {
        const mockDoc = { id: 1, eSignId: null, destroy: jest.fn().mockResolvedValue(true) };
        agreement.findOne.mockResolvedValue(mockDoc);

        await deleteAgreement(1, 10);

        expect(eSign.update).not.toHaveBeenCalled();
    });

    it('should return null when agreement is not found', async () => {
        agreement.findOne.mockResolvedValue(null);

        const result = await deleteAgreement(999, 10);

        expect(result).toBeNull();
        expect(eSign.update).not.toHaveBeenCalled();
    });

    it('should throw an error if database call fails', async () => {
        agreement.findOne.mockRejectedValue(new Error('Database error'));

        await expect(deleteAgreement(1, 10)).rejects.toThrow('Database error');
    });
});
