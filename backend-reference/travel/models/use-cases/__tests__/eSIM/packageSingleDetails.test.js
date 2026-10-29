const { packageSingleDetails } = require('../../../use-cases/eSIM');
const eSIM = require('../../../entities/eSIM');
const credential = require('../../../entities/credential');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/eSIM', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('packageSingleDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the package details when a matching record is found', async () => {
        const mockParams = { id: 1, credentialId: 10 };
        const mockRecord = {
            id: 1,
            credential: {
                id: 10,
                name: 'Corporate A',
            },
            transaction: {
                corporateTxnId: 'TXN789',
                status: 'Completed',
            },
        };

        eSIM.findOne.mockResolvedValue(mockRecord);

        const result = await packageSingleDetails(mockParams);

        expect(eSIM.findOne).toHaveBeenCalledWith({
            include: expect.arrayContaining([
                expect.objectContaining({ model: credential, attributes: ['id', 'name'] }),
                expect.objectContaining({ model: transaction, attributes: ['corporateTxnId', 'status'] }),
            ]),
            where: { id: mockParams.id, credentialId: mockParams.credentialId },
        });

        expect(result).toEqual(mockRecord);
    });

    it('should return null when no matching record is found', async () => {
        const mockParams = { id: 999, credentialId: 10 };

        eSIM.findOne.mockResolvedValue(null);

        const result = await packageSingleDetails(mockParams);

        expect(eSIM.findOne).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toBeNull();
    });

    it('should throw an error if findOne fails', async () => {
        const mockParams = { id: 1, credentialId: 10 };
        const mockError = new Error('Database error');

        eSIM.findOne.mockRejectedValue(mockError);

        await expect(packageSingleDetails(mockParams)).rejects.toThrow('Database error');
    });

    it('should return null without querying when credentialId is missing', async () => {
        const result = await packageSingleDetails({ id: 1 });

        expect(eSIM.findOne).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });
});
