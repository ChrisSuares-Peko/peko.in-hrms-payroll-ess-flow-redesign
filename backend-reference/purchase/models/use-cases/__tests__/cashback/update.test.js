const { update } = require('../../../use-cases/cashback');
const cashback = require('../../../entities/cashback');

jest.mock('../../../entities/cashback', () => ({
    update: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a cashback entry successfully', async () => {
        const mockParams = { id: 1 };
        const mockData = { amount: 150, status: 'approved' };
        const mockResponse = [1]; // Sequelize returns an array with affected rows count

        cashback.update.mockResolvedValue(mockResponse);

        const result = await update(mockParams, mockData);

        expect(cashback.update).toHaveBeenCalledWith(mockData, {
            where: { id: mockParams.id },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return 0 if no cashback entry is updated', async () => {
        const mockParams = { id: 2 };
        const mockData = { amount: 200, status: 'declined' };
        cashback.update.mockResolvedValue([0]);

        const result = await update(mockParams, mockData);

        expect(result).toEqual([0]);
    });

    it('should throw an error if cashback update fails', async () => {
        const mockParams = { id: 3 };
        const mockData = { amount: 300, status: 'pending' };
        const mockError = new Error('Database error');

        cashback.update.mockRejectedValue(mockError);

        await expect(update(mockParams, mockData)).rejects.toThrow('Database error');
    });
});
