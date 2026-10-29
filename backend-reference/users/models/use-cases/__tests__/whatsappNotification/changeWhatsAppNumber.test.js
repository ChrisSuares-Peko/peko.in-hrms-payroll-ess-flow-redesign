const { changeWhatsAppNumber } = require('../../../use-cases/whatsappNotification'); 
const Setting = require('../../../entities/setting');
jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('changeWhatsAppNumber', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the WhatsApp number if found', async () => {
        const mockCurrentNumber = '1234567890';
        const mockUpdateData = { whatsappNumber: '9876543210', name: 'Updated Name' };
        const mockSetting = {
            details: [
                { whatsappNumber: mockCurrentNumber, name: 'Test Name' },
                { whatsappNumber: '1122334455', name: 'Another Name' },
            ],
            update: jest.fn().mockResolvedValue(), // Mock the update method
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await changeWhatsAppNumber(mockCurrentNumber, mockUpdateData);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).toHaveBeenCalledWith({
            details: [
                { whatsappNumber: '9876543210', name: 'Updated Name' }, // Updated number
                { whatsappNumber: '1122334455', name: 'Another Name' },
            ],
        });
        expect(result).toEqual([
            { whatsappNumber: '9876543210', name: 'Updated Name' }, // Updated number
            { whatsappNumber: '1122334455', name: 'Another Name' },
        ]);
    });

    it('should return null if no matching number is found', async () => {
        const mockCurrentNumber = '9999999999'; // Number not in the details
        const mockUpdateData = { whatsappNumber: '9876543210', name: 'Updated Name' };
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', name: 'Test Name' },
                { whatsappNumber: '1122334455', name: 'Another Name' },
            ],
            update: jest.fn(),
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        await changeWhatsAppNumber(mockCurrentNumber, mockUpdateData);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
      
    });

    it('should return null if no setting is found', async () => {
        const mockCurrentNumber = '1234567890';
        const mockUpdateData = { whatsappNumber: '9876543210', name: 'Updated Name' };

        Setting.findOne.mockResolvedValue(null);

        const result = await changeWhatsAppNumber(mockCurrentNumber, mockUpdateData);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations (findOne)', async () => {
        const mockCurrentNumber = '1234567890';
        const mockUpdateData = { whatsappNumber: '9876543210', name: 'Updated Name' };
        const mockError = new Error('Database error');

        Setting.findOne.mockRejectedValue(mockError);

        await expect(changeWhatsAppNumber(mockCurrentNumber, mockUpdateData)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
    });

    it('should handle errors during database operations (update)', async () => {
        const mockCurrentNumber = '1234567890';
        const mockUpdateData = { whatsappNumber: '9876543210', name: 'Updated Name' };
        const mockSetting = {
            details: [
                { whatsappNumber: mockCurrentNumber, name: 'Test Name' },
            ],
            update: jest.fn().mockRejectedValue(new Error('Update Error')), // Mock a rejection
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        await expect(changeWhatsAppNumber(mockCurrentNumber, mockUpdateData)).rejects.toThrow('Update Error');

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).toHaveBeenCalledWith({
            details: [
                { whatsappNumber: '9876543210', name: 'Updated Name' }, // Updated number
            ],
        });
    });
});