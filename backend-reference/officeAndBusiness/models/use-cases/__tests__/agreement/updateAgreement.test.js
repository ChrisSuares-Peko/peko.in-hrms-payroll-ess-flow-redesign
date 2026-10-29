const { updateAgreement } = require('../../agreement');
const agreement = require('../../../entities/agreement');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));

describe('updateAgreement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update and return the updated agreement', async () => {
        const updatedDoc = { id: 1, status: 'SENT' };
        const mockDoc = { id: 1, update: jest.fn().mockResolvedValue(updatedDoc) };
        agreement.findOne.mockResolvedValue(mockDoc);

        const result = await updateAgreement({ id: 1 }, { status: 'SENT' });

        expect(agreement.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(mockDoc.update).toHaveBeenCalledWith({ status: 'SENT' });
        expect(result).toEqual(updatedDoc);
    });

    it('should return null when agreement is not found', async () => {
        agreement.findOne.mockResolvedValue(null);

        const result = await updateAgreement({ id: 999 }, { status: 'SENT' });

        expect(result).toBeNull();
    });

    it('should throw an error if database call fails', async () => {
        agreement.findOne.mockRejectedValue(new Error('Database error'));

        await expect(updateAgreement({ id: 1 }, { status: 'SENT' })).rejects.toThrow('Database error');
    });
});
