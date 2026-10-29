const { countPendingRequests } = require('../../../use-cases/connectionRequest');
const ConnectionRequest = require('../../../entities/connectionRequest');

jest.mock('../../../entities/connectionRequest', () => ({
    count: jest.fn(),
}));

describe('countPendingRequests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the count of pending connection requests for a given receiver', async () => {
        const mockParams = { receiverId: 2 };
        const mockCount = 5;

        ConnectionRequest.count.mockResolvedValue(mockCount);

        const result = await countPendingRequests(mockParams);

        expect(ConnectionRequest.count).toHaveBeenCalledWith({
            where: {
                receiverId: mockParams.receiverId,
                status: 'PENDING',
            },
        });

        expect(result).toBe(mockCount);
    });

    it('should return 0 when no pending requests are found', async () => {
        const mockParams = { receiverId: 999 };

        ConnectionRequest.count.mockResolvedValue(0);

        const result = await countPendingRequests(mockParams);

        expect(ConnectionRequest.count).toHaveBeenCalledWith({
            where: {
                receiverId: mockParams.receiverId,
                status: 'PENDING',
            },
        });

        expect(result).toBe(0);
    });

    it('should log an error and return 0 when database operation fails', async () => {
        const mockParams = { receiverId: 2 };
        const mockError = new Error('Database error');

        ConnectionRequest.count.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await countPendingRequests(mockParams);

        expect(console.error).toHaveBeenCalledWith("Error counting pending connection requests:", mockError);
        expect(result).toBe(0);
    });
});
