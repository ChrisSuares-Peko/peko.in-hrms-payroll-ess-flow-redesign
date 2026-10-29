const { create } = require('../../../use-cases/eSIM');
const eSIM = require('../../../entities/eSIM');

jest.mock('../../../entities/eSIM', () => ({
    create: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a new record', async () => {
        const mockParams = { userId: 123, plan: 'premium', status: 'active' };
        const mockRecord = { id: 1, ...mockParams };

        eSIM.create.mockResolvedValue(mockRecord);

        const result = await create(mockParams);

        expect(eSIM.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockRecord);
    });

    it('should throw an error if create fails', async () => {
        const mockParams = { userId: 456, plan: 'basic', status: 'inactive' };
        const mockError = new Error('Database error');

        eSIM.create.mockRejectedValue(mockError);

        await expect(create(mockParams)).rejects.toThrow('Database error');
    });
});
