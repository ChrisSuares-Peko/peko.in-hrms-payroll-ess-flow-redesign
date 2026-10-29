const { createRequest } = require('../../../use-cases/peko_connect');
const connections = require('../../../entities/connections');

jest.mock('../../../entities/connections', () => ({
    create: jest.fn(),
}));

describe('createRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new connection request successfully', async () => {
        const mockParams = { userId: 1, serviceType: 'Internet', status: 'Pending' };
        const mockResponse = { id: 1, ...mockParams };

        connections.create.mockResolvedValue(mockResponse);

        const result = await createRequest(mockParams);

        expect(connections.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error when create fails', async () => {
        const mockParams = { userId: 2, serviceType: 'Electricity', status: 'Pending' };
        const mockError = new Error('Database error');

        connections.create.mockRejectedValue(mockError);

        await expect(createRequest(mockParams)).rejects.toThrow('Database error');
    });
});
