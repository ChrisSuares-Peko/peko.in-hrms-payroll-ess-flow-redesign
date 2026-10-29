const { findAllActiveEsims } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findAll: jest.fn(),
}));

describe('findAllActiveEsims', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of active eSIMs', async () => {
        const mockEsims = [
            { id: 1, name: 'eSIM Plan 1', status: true },
            { id: 2, name: 'eSIM Plan 2', status: true },
        ];

        esim.findAll.mockResolvedValue(mockEsims);

        const result = await findAllActiveEsims();

        expect(esim.findAll).toHaveBeenCalledWith({
            where: { status: true },
            order: [['createdAt', 'DESC']],
        });
        expect(result).toEqual({
            success: true,
            message: "Active Esim Plans fetched successfully",
            data: mockEsims,
        });
    });

    it('should return a message if no active eSIMs are found', async () => {
        esim.findAll.mockResolvedValue([]);

        const result = await findAllActiveEsims();

        expect(result).toEqual({
            success: false,
            message: "No active Esim Plans found",
        });
    });

    it('should return an error message if the database query fails', async () => {
        const mockError = new Error('Database error');

        esim.findAll.mockRejectedValue(mockError);

        const result = await findAllActiveEsims();

        expect(result).toEqual({
            success: false,
            message: "An error occurred while fetching active Esim Plans",
        });
    });
});
