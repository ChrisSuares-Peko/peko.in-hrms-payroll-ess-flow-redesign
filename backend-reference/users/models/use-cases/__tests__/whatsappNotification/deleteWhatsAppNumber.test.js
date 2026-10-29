const { deleteWhatsAppNumber } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting'); 

jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('deleteWhatsAppNumber', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete the WhatsApp number if found', async () => {
        const mockNumberToDelete = '1234567890';
        const mockSetting = {
            details: [
                { whatsappNumber: mockNumberToDelete, name: 'Test Name' },
                { whatsappNumber: '1122334455', name: 'Another Name' },
            ],
            update: jest.fn().mockResolvedValue(), // Mock the update method
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await deleteWhatsAppNumber(mockNumberToDelete);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).toHaveBeenCalledWith({
            details: [{ whatsappNumber: '1122334455', name: 'Another Name' }],
        });
        expect(result).toEqual([{ whatsappNumber: '1122334455', name: 'Another Name' }]);
    });

    it('should throw an error if the number to delete is not found', async () => {
        const mockNumberToDelete = '9999999999'; // Number not in the details
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', name: 'Test Name' },
                { whatsappNumber: '1122334455', name: 'Another Name' },
            ],
            update: jest.fn(),
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        await expect(deleteWhatsAppNumber(mockNumberToDelete)).rejects.toThrow('WhatsApp number not found');

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).not.toHaveBeenCalled();
    });

    it('should return null if no setting is found', async () => {
        const mockNumberToDelete = '1234567890';

        Setting.findOne.mockResolvedValue(null);

        const result = await deleteWhatsAppNumber(mockNumberToDelete);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations (findOne)', async () => {
        const mockNumberToDelete = '1234567890';
        const mockError = new Error('Database error');

        Setting.findOne.mockRejectedValue(mockError);

        await expect(deleteWhatsAppNumber(mockNumberToDelete)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
    });

    it('should handle errors during database operations (update)', async () => {
        const mockNumberToDelete = '1234567890';
        const mockSetting = {
            details: [
                { whatsappNumber: mockNumberToDelete, name: 'Test Name' },
            ],
            update: jest.fn().mockRejectedValue(new Error('Update Error')), // Mock a rejection
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        await expect(deleteWhatsAppNumber(mockNumberToDelete)).rejects.toThrow('Update Error');

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).toHaveBeenCalledWith({
            details: [], // The details array after the filter
        });
    });
});