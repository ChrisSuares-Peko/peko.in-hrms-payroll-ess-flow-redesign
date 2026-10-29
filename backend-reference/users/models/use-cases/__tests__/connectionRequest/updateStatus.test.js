const { udpateStatus } = require('../../../use-cases/connectionRequest');
const connectionRequest = require('../../../entities/connectionRequest');

jest.mock('../../../entities/connectionRequest', () => ({
    update: jest.fn(),
}));

describe('updateStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update the status of a connection request', async () => {
        const mockRequestId = 1;
        const mockReceiverId = 2;
        const mockStatus = 'ACCEPTED';

        connectionRequest.update.mockResolvedValue([1]); // 1 row affected

        const result = await udpateStatus(mockRequestId, mockReceiverId, mockStatus);

        expect(connectionRequest.update).toHaveBeenCalledWith(
            { status: mockStatus },
            {
                where: {
                    id: mockRequestId,
                    receiverId: mockReceiverId,
                },
            }
        );

        expect(result).toEqual([1]);
    });

    it('should return [0] when no matching request is found', async () => {
        const mockRequestId = 999;
        const mockReceiverId = 2;
        const mockStatus = 'ACCEPTED';

        connectionRequest.update.mockResolvedValue([0]); // 0 rows affected

        const result = await udpateStatus(mockRequestId, mockReceiverId, mockStatus);

        expect(connectionRequest.update).toHaveBeenCalledWith(
            { status: mockStatus },
            {
                where: {
                    id: mockRequestId,
                    receiverId: mockReceiverId,
                },
            }
        );

        expect(result).toEqual([0]);
    });

    it('should log an error and return false when database operation fails', async () => {
        const mockRequestId = 1;
        const mockReceiverId = 2;
        const mockStatus = 'ACCEPTED';
        const mockError = new Error('Database error');

        connectionRequest.update.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await udpateStatus(mockRequestId, mockReceiverId, mockStatus);

        expect(console.error).toHaveBeenCalledWith("Error creating new connection request:", mockError);
        expect(result).toBe(false);
    });
});
