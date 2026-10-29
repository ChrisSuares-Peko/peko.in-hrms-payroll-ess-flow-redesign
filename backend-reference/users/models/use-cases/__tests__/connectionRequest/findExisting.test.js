const { findExisting } = require('../../../use-cases/connectionRequest');
const ConnectionRequest = require('../../../entities/connectionRequest');
const { Op } = require('sequelize');

jest.mock('../../../entities/connectionRequest', () => ({
    findOne: jest.fn(),
}));

describe('findExisting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an existing connection request when a match is found', async () => {
        const mockParams = { senderId: 1, receiverId: 2 };
        const mockRequest = {
            id: 100,
            senderId: 1,
            receiverId: 2,
            status: 'PENDING',
        };

        ConnectionRequest.findOne.mockResolvedValue(mockRequest);

        const result = await findExisting(mockParams);

        expect(ConnectionRequest.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { senderId: mockParams.senderId, receiverId: mockParams.receiverId },
                            { senderId: mockParams.receiverId, receiverId: mockParams.senderId },
                        ],
                    },
                    {
                        status: { [Op.ne]: 'REJECTED' },
                    },
                ],
            },
        });

        expect(result).toEqual(mockRequest);
    });

    it('should return null when no matching connection request is found', async () => {
        const mockParams = { senderId: 1, receiverId: 999 };

        ConnectionRequest.findOne.mockResolvedValue(null);

        const result = await findExisting(mockParams);

        expect(ConnectionRequest.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { senderId: mockParams.senderId, receiverId: mockParams.receiverId },
                            { senderId: mockParams.receiverId, receiverId: mockParams.senderId },
                        ],
                    },
                    {
                        status: { [Op.ne]: 'REJECTED' },
                    },
                ],
            },
        });

        expect(result).toBeNull();
    });

    it('should log an error and return false when database operation fails', async () => {
        const mockParams = { senderId: 1, receiverId: 2 };
        const mockError = new Error('Database error');

        ConnectionRequest.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findExisting(mockParams);

        expect(console.error).toHaveBeenCalledWith("Error finding connection request row:", mockError);
        expect(result).toBe(false);
    });
});
