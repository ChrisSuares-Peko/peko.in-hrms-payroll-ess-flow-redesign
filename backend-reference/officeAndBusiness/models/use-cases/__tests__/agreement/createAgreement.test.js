const { createAgreement } = require('../../agreement');
const agreement = require('../../../entities/agreement');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));

describe('createAgreement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create and return a new agreement', async () => {
        const params = { corporateUserId: 1, customerId: 2, status: 'DRAFT' };
        const mockDoc = { id: 10, ...params };
        agreement.create.mockResolvedValue(mockDoc);

        const result = await createAgreement(params);

        expect(agreement.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockDoc);
    });

    it('should throw an error if creation fails', async () => {
        const params = { corporateUserId: 1, customerId: 2 };
        agreement.create.mockRejectedValue(new Error('Database error'));

        await expect(createAgreement(params)).rejects.toThrow('Database error');
        expect(agreement.create).toHaveBeenCalledWith(params);
    });
});
