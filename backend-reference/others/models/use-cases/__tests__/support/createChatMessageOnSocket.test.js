const { createChatMessageOnSocket } = require('../../support');
const messages = require('../../../entities/support');

jest.mock('../../../entities/support');

describe('createChatMessageOnSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a chat message on socket and save', async () => {
        const mockSupport = {
            getDataValue: jest.fn().mockReturnValue([]),
            setDataValue: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
        };
        messages.findOne.mockResolvedValue(mockSupport);

        const params = {
            supportId: 1,
            message: 'Hello',
            admin: true,
            date: '2023-10-01',
            name: 'Admin',
        };

        const result = await createChatMessageOnSocket(params);

        expect(messages.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(mockSupport.getDataValue).toHaveBeenCalledWith('chats');
        expect(mockSupport.setDataValue).toHaveBeenCalledWith('chats', [
            { message: 'Hello', name: 'Admin', admin: true, date: '2023-10-01' },
        ]);
        expect(mockSupport.save).toHaveBeenCalled();
        expect(result).toEqual(mockSupport);
    });

    it('should append to existing chats', async () => {
        const existingChats = [{ message: 'Hi', name: 'User', admin: false, date: '2023-09-30' }];
        const mockSupport = {
            getDataValue: jest.fn().mockReturnValue(existingChats),
            setDataValue: jest.fn(),
            save: jest.fn().mockResolvedValue(true),
        };
        messages.findOne.mockResolvedValue(mockSupport);

        await createChatMessageOnSocket({
            supportId: 1,
            message: 'Reply',
            admin: true,
            date: '2023-10-01',
            name: 'Admin',
        });

        expect(mockSupport.setDataValue).toHaveBeenCalledWith('chats', [
            { message: 'Hi', name: 'User', admin: false, date: '2023-09-30' },
            { message: 'Reply', name: 'Admin', admin: true, date: '2023-10-01' },
        ]);
    });

    it('should return error if support not found', async () => {
        messages.findOne.mockResolvedValue(null);

        const result = await createChatMessageOnSocket({ supportId: 999, message: 'test', admin: true, date: '2023-10-01', name: 'A' });
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Support not found');
    });

    it('should return error on DB failure', async () => {
        const dbError = new Error('DB error');
        messages.findOne.mockRejectedValue(dbError);

        const result = await createChatMessageOnSocket({ supportId: 1, message: 'test', admin: true, date: '2023-10-01', name: 'A' });
        expect(result).toEqual(dbError);
    });
});
