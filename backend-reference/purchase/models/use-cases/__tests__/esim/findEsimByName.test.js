const { findEsimByName } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findOne: jest.fn(),
}));

describe('findEsimByName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an eSIM plan when found by name', async () => {
        const mockName = 'Basic Plan';
        const mockEsim = { id: 1, name: mockName, price: 10 };

        esim.findOne.mockResolvedValue(mockEsim);

        const result = await findEsimByName(mockName);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: { name: mockName },
        });
        expect(result).toEqual({
            success: true,
            message: "Esim Plans fetched successfully",
            data: mockEsim,
        });
    });

    it('should return a message if no eSIM plan is found', async () => {
        const mockName = 'Nonexistent Plan';
        esim.findOne.mockResolvedValue(null);

        const result = await findEsimByName(mockName);

        expect(result).toEqual({
            success: false,
            message: "Esim Plans not found",
        });
    });

    it('should return an error message if the database query fails', async () => {
        const mockName = 'Error Plan';
        const mockError = new Error('Database error');

        esim.findOne.mockRejectedValue(mockError);

        const result = await findEsimByName(mockName);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while fetching the Esim Plans",
        });
    });
});
