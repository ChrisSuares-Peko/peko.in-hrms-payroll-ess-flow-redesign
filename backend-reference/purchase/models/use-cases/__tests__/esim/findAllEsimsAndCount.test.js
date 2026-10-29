const { findAllEsimsAndCount } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllEsimsAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated list of eSIMs', async () => {
        const mockParams = { sortField: 'name', sort: 'ASC', itemsPerPage: 10, page: 1, searchText: 'Test', isActive: true };
        const mockResult = {
            count: 2,
            rows: [
                { id: 1, name: 'Test eSIM 1', status: true },
                { id: 2, name: 'Test eSIM 2', status: true },
            ],
        };

        esim.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllEsimsAndCount(mockParams);

        expect(esim.findAndCountAll).toHaveBeenCalledWith({
            where: expect.any(Object),
            order: [['name', 'ASC']],
            offset: 0,
            limit: 10,
        });
        expect(result).toEqual({
            success: true,
            message: "Esim Plans fetched successfully",
            data: mockResult,
        });
    });

    it('should return an empty result if no eSIMs match the search', async () => {
        const mockParams = { itemsPerPage: 10, page: 1, searchText: 'Invalid' };
        esim.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllEsimsAndCount(mockParams);

        expect(result).toEqual({
            success: true,
            message: "Esim Plans fetched successfully",
            data: { count: 0, rows: [] },
        });
    });

    it('should throw an error if database query fails', async () => {
        const mockParams = { itemsPerPage: 10, page: 1 };
        const mockError = new Error('Database error');

        esim.findAndCountAll.mockRejectedValue(mockError);

        const result = await findAllEsimsAndCount(mockParams);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while fetching Esim Plans",
        });
    });
});
