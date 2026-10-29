const { create } = require('../../../use-cases/disableService');
const disableService = require('../../../entities/disabledService');

jest.mock('../../../entities/disabledService', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new record with the provided params', async () => {
        const mockParams = { name: 'Test Service', status: 'active' };
        const mockResult = { id: 1, ...mockParams }; // Simulated result of the create operation

        disableService.create.mockResolvedValue(mockResult);

        const result = await create(mockParams);

        expect(disableService.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResult);
    });

    it('should throw an error if creation fails', async () => {
        const mockParams = { name: 'Test Service', status: 'active' };
        const mockError = new Error('Database error');

        disableService.create.mockRejectedValue(mockError);

        await expect(create(mockParams)).rejects.toThrow('Database error');
        expect(disableService.create).toHaveBeenCalledWith(mockParams);
    });
});
