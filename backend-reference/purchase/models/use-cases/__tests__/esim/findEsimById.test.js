const { findEsimById } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findOne: jest.fn(),
}));

describe('findEsimById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an eSIM plan if found by ID', async () => {
        const mockId = 1;
        const mockEsim = {
            id: mockId,
            name: 'Premium Plan',
            price: 50,
            validity: '90 days',
        };

        esim.findOne.mockResolvedValue(mockEsim);

        const result = await findEsimById(mockId);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(result).toEqual({
            success: true,
            message: "Esim Plans fetched successfully",
            data: mockEsim,
        });
    });

    it('should return a message if no eSIM plan is found', async () => {
        const mockId = 999;
        esim.findOne.mockResolvedValue(null);

        const result = await findEsimById(mockId);

        expect(result).toEqual({
            success: false,
            message: "Esim Plans not found",
        });
    });

    it('should return an error message if the database query fails', async () => {
        const mockId = 2;
        const mockError = new Error('Database error');

        esim.findOne.mockRejectedValue(mockError);

        const result = await findEsimById(mockId);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while fetching the Esim Plans",
        });
    });
});
