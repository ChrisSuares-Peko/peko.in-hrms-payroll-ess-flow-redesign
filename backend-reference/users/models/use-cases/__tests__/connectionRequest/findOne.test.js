const { findOne } = require('../../../use-cases/connectionRequest');
const ConnectionRequest = require('../../../entities/connectionRequest');

jest.mock('../../../entities/connectionRequest', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a connection request when a matching record is found', async () => {
        const mockParams = { id: 1 };
        const mockConnectionRequest = {
            id: 1,
            status: 'PENDING',
            createdAt: '2024-02-05T12:00:00Z',
        };

        ConnectionRequest.findOne.mockResolvedValue(mockConnectionRequest);

        const result = await findOne(mockParams);

        expect(ConnectionRequest.findOne).toHaveBeenCalledWith({
            where: mockParams,
        });

        expect(result).toEqual(mockConnectionRequest);
    });

    it('should return null when no matching connection request is found', async () => {
        const mockParams = { id: 999 };

        ConnectionRequest.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(ConnectionRequest.findOne).toHaveBeenCalledWith({
            where: mockParams,
        });

        expect(result).toBeNull();
    });

    it('should log an error and return false when database operation fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');

        ConnectionRequest.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findOne(mockParams);

        expect(console.error).toHaveBeenCalledWith("Error finding connection request row:", mockError);
        expect(result).toBe(false);
    });
});
