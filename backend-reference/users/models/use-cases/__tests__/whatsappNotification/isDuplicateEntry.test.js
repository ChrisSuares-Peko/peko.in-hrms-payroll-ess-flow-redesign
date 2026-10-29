const { isDuplicateEntry } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting'); 

jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('isDuplicateEntry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return message if a different WhatsApp number already exists', async () => {
        const mockCurrentNumber = '1111111111'; // Different from the one in details
        const mockInput = { whatsappNumber: '1234567890', name: 'testuser' };
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', name: 'testuser' },
                { whatsappNumber: '9876543210', name: 'anotheruser' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await isDuplicateEntry(mockCurrentNumber, mockInput);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toEqual({ message: "WhatsApp number already exists" });
    });

    it('should return message if a different username already exists', async () => {
        const mockCurrentNumber = '1111111111';
        const mockInput = { whatsappNumber: '1234567890', name: 'testuser' };
        const mockSetting = {
            details: [
                { whatsappNumber: '9876543210', name: 'testuser' },
                { whatsappNumber: '1122334455', name: 'anotheruser' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await isDuplicateEntry(mockCurrentNumber, mockInput);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toEqual({ message: 'Name already exists' });
    });

    it('should return false if neither a different WhatsApp number nor username exists', async () => {
        const mockCurrentNumber = '1111111111';
        const mockInput = { whatsappNumber: '1234567890', name: 'testuser' };
        const mockSetting = {
            details: [
                { whatsappNumber: '9876543210', name: 'anotheruser' },
                { whatsappNumber: '1122334455', name: 'yetanotheruser' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await isDuplicateEntry(mockCurrentNumber, mockInput);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toBe(false);
    });

    it('should return false if the same number or name is being edited', async () => {
      const mockCurrentNumber = '1234567890';
      const mockInput = { whatsappNumber: '1234567890', name: 'testuser' };
      const mockSetting = {
          details: [
              { whatsappNumber: '1234567890', name: 'testuser' },
              { whatsappNumber: '9876543210', name: 'anotheruser' },
          ],
      };

      Setting.findOne.mockResolvedValue(mockSetting);

      const result = await isDuplicateEntry(mockCurrentNumber, mockInput);

      expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
      expect(result).toBe(false);
  });


    it('should handle errors during database operations', async () => {
        const mockCurrentNumber = '1111111111';
        const mockInput = { whatsappNumber: '1234567890', name: 'testuser' };
        const mockError = new Error('Database error');

        Setting.findOne.mockRejectedValue(mockError);

        await expect(isDuplicateEntry(mockCurrentNumber, mockInput)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
    });
});