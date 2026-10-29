const { findESignDocById } = require('../../eSign'); 
const eSign = require('../../../entities/eSign');

jest.mock('../../../entities/eSign', () => ({
    findOne: jest.fn(),
}));

describe('findESignDocById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the eSign document if found', async () => {
        const mockId = 1;
        const mockDoc = { id: mockId, documentName: 'Test Doc' };

        eSign.findOne.mockResolvedValue(mockDoc);

        const result = await findESignDocById(mockId);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            raw: true,
            nest: true
        });
        expect(result).toEqual({ status: true, data: mockDoc });
    });

    it('should return a not found message if the eSign document is not found', async () => {
        const mockId = 2;

        eSign.findOne.mockResolvedValue(null);

        const result = await findESignDocById(mockId);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            raw: true,
            nest: true
        });
        expect(result).toEqual({ status: false, message: 'eSign document not found' });
    });

    it('should pass specific attributes to findOne when provided', async () => {
        const mockId = 4;
        const mockAttributes = ['id', 'signers_info', 'status'];
        const mockDoc = { id: mockId, signers_info: [], status: 'PENDING' };

        eSign.findOne.mockResolvedValue(mockDoc);

        const result = await findESignDocById(mockId, mockAttributes);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            attributes: mockAttributes,
            raw: true,
            nest: true
        });
        expect(result).toEqual({ status: true, data: mockDoc });
    });

    it('should handle errors and return an appropriate error message', async () => {
        const mockId = 3;
        const mockError = new Error('Database error');

        console.log = jest.fn();
        eSign.findOne.mockRejectedValue(mockError);

        const result = await findESignDocById(mockId);

        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            raw: true,
            nest: true
        });
        expect(result).toEqual({ status: false, message: 'Something went wrong while fetching the document' });
    });
    it('should scope the lookup by credentialId when provided (owner check)', async () => {
        eSign.findOne.mockResolvedValue({ id: 1 });
        await findESignDocById(1, ['id'], 100);
        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { id: 1, credentialId: 100 },
            attributes: ['id'],
            raw: true,
            nest: true
        });
    });

    it('should NOT scope by owner when no credentialId is passed (server/webhook path)', async () => {
        eSign.findOne.mockResolvedValue({ id: 1 });
        await findESignDocById(1);
        expect(eSign.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            raw: true,
            nest: true
        });
    });
});
