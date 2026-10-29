const { create } = require('../../../use-cases/cashback');
const cashback = require('../../../entities/cashback');

jest.mock('../../../entities/cashback', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a cashback entry successfully', async () => {
        const mockParams = { userId: 1, amount: 100, status: 'pending' };
        const mockCashback = { id: 1, ...mockParams };

        cashback.create.mockResolvedValue(mockCashback);

        const result = await create(mockParams);

        expect(cashback.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockCashback);
    });

    it('should throw an error if cashback creation fails', async () => {
        const mockParams = { userId: 1, amount: 100, status: 'pending' };
        const mockError = new Error('Database error');

        cashback.create.mockRejectedValue(mockError);

        await expect(create(mockParams)).rejects.toThrow('Database error');
    });
});
