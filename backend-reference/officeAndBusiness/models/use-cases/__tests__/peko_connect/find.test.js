const { find } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');

jest.mock('../../../entities/peko_connect', () => ({
    findOne: jest.fn(),
}));

describe('find', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a peko_connect record when found', async () => {
        const mockParams = { id: 1 };
        const mockResponse = { id: 1, name: 'Test Peko Connect' };

        peko_connect.findOne.mockResolvedValue(mockResponse);

        const result = await find(mockParams);

        expect(peko_connect.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: { exclude: undefined },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return a peko_connect record excluding specific fields', async () => {
        const mockParams = { id: 2 };
        const mockExclude = ['sensitiveField'];
        const mockResponse = { id: 2, name: 'Test Peko Connect Without Sensitive Data' };

        peko_connect.findOne.mockResolvedValue(mockResponse);

        const result = await find(mockParams, mockExclude);

        expect(peko_connect.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            attributes: { exclude: mockExclude },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no record is found', async () => {
        const mockParams = { id: 999 };
        peko_connect.findOne.mockResolvedValue(null);

        const result = await find(mockParams);

        expect(result).toBeNull();
    });

    it('should throw an error when findOne fails', async () => {
        const mockParams = { id: 3 };
        const mockError = new Error('Database error');

        peko_connect.findOne.mockRejectedValue(mockError);

        await expect(find(mockParams)).rejects.toThrow('Database error');
    });
});
