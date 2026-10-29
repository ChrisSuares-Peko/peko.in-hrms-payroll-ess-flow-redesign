const { create } = require('../../../use-cases/connectionRequest');
const ConnectionRequest = require('../../../entities/connectionRequest');

jest.mock('../../../entities/connectionRequest', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a new connection request', async () => {
        const mockSenderId = 1;
        const mockReceiverId = 2;
        const mockMessage = "Hello, I'd like to connect.";
        const mockCreatedRequest = {
            id: 100,
            senderId: mockSenderId,
            receiverId: mockReceiverId,
            message: mockMessage,
            createdAt: '2024-02-05T12:00:00Z',
        };

        ConnectionRequest.create.mockResolvedValue(mockCreatedRequest);

        const result = await create(mockSenderId, mockReceiverId, mockMessage);

        expect(ConnectionRequest.create).toHaveBeenCalledWith({
            senderId: mockSenderId,
            receiverId: mockReceiverId,
            message: mockMessage,
        });

        expect(result).toEqual(mockCreatedRequest);
    });

    it('should return false when creation fails', async () => {
        const mockSenderId = 1;
        const mockReceiverId = 2;
        const mockMessage = "Hello, I'd like to connect.";

        ConnectionRequest.create.mockResolvedValue(null);

        const result = await create(mockSenderId, mockReceiverId, mockMessage);

        expect(ConnectionRequest.create).toHaveBeenCalledWith({
            senderId: mockSenderId,
            receiverId: mockReceiverId,
            message: mockMessage,
        });

        expect(result).toBe(null);
    });

    it('should log an error and return false when database operation fails', async () => {
        const mockSenderId = 1;
        const mockReceiverId = 2;
        const mockMessage = "Hello, I'd like to connect.";
        const mockError = new Error('Database error');

        ConnectionRequest.create.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await create(mockSenderId, mockReceiverId, mockMessage);

        expect(console.error).toHaveBeenCalledWith("Error creating new connection request:", mockError);
        expect(result).toBe(false);
    });
});
