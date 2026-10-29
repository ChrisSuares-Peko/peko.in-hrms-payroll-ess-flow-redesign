const { isNameOrNumberExists } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting'); 

jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('isNameOrNumberExists', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return message if WhatsApp number already exists', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockUsername = 'testuser';
        const mockSetting = {
            details: [
                { whatsappNumber: mockWhatsappNumber, name: 'testuser' },
                { whatsappNumber: '9876543210', name: 'anotheruser' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await isNameOrNumberExists(mockWhatsappNumber, mockUsername);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toEqual({ message: "WhatsApp number already exists" });
    });

    it('should return message if username already exists', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockUsername = 'testuser';
        const mockSetting = {
            details: [
                { whatsappNumber: '9876543210', name: mockUsername },
                { whatsappNumber: '1122334455', name: 'anotheruser' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await isNameOrNumberExists(mockWhatsappNumber, mockUsername);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toEqual({ message: 'Name already exists' });
    });

    it('should return false if neither WhatsApp number nor username exists', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockUsername = 'testuser';
        const mockSetting = {
            details: [
                { whatsappNumber: '9876543210', name: 'anotheruser' },
                { whatsappNumber: '1122334455', name: 'yetanotheruser' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await isNameOrNumberExists(mockWhatsappNumber, mockUsername);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toBe(false);
    });


    it('should return false if no setting is found', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockUsername = 'testuser';

        Setting.findOne.mockResolvedValue(null);

        const result = await isNameOrNumberExists(mockWhatsappNumber, mockUsername);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toBe(false);
    });

    it('should handle errors during database operations', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockUsername = 'testuser';
        const mockError = new Error('Database error');

        Setting.findOne.mockRejectedValue(mockError);

        await expect(isNameOrNumberExists(mockWhatsappNumber, mockUsername)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
    });
});