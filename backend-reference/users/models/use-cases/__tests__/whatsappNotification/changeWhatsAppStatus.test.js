const { changeWhatsAppStatus } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting'); 

jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('changeWhatsAppStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the WhatsApp number status if found', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockStatus = false; // Example status change
        const mockSetting = {
            details: [
                { whatsappNumber: mockWhatsappNumber, status: true, name: 'Test Name' }, // Initial status is true
                { whatsappNumber: '1122334455', status: true, name: 'Another Name' },
            ],
            update: jest.fn().mockResolvedValue(), // Mock the update method
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await changeWhatsAppStatus(mockWhatsappNumber, mockStatus);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).toHaveBeenCalledWith({
            details: [
                { whatsappNumber: mockWhatsappNumber, status: mockStatus, name: 'Test Name' }, // Status updated
                { whatsappNumber: '1122334455', status: true, name: 'Another Name' },
            ],
        });
        expect(result).toEqual([
            { whatsappNumber: mockWhatsappNumber, status: mockStatus, name: 'Test Name' }, // Status updated
            { whatsappNumber: '1122334455', status: true, name: 'Another Name' },
        ]);
    });

    it('should return null if no matching number is found', async () => {
        const mockWhatsappNumber = '9999999999'; // Number not in the details
        const mockStatus = false;
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', status: true, name: 'Test Name' },
                { whatsappNumber: '1122334455', status: true, name: 'Another Name' },
            ],
            update: jest.fn(),
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        await changeWhatsAppStatus(mockWhatsappNumber, mockStatus);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
       
    });

    it('should return null if no setting is found', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockStatus = false;

        Setting.findOne.mockResolvedValue(null);

        const result = await changeWhatsAppStatus(mockWhatsappNumber, mockStatus);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations (findOne)', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockStatus = false;
        const mockError = new Error('Database error');

        Setting.findOne.mockRejectedValue(mockError);

        await expect(changeWhatsAppStatus(mockWhatsappNumber, mockStatus)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
    });

    it('should handle errors during database operations (update)', async () => {
        const mockWhatsappNumber = '1234567890';
        const mockStatus = false;
        const mockSetting = {
            details: [
                { whatsappNumber: mockWhatsappNumber, status: true, name: 'Test Name' },
            ],
            update: jest.fn().mockRejectedValue(new Error('Update Error')), // Mock a rejection
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        await expect(changeWhatsAppStatus(mockWhatsappNumber, mockStatus)).rejects.toThrow('Update Error');

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: 'whatsAppNotifications' } });
        expect(mockSetting.update).toHaveBeenCalledWith({
            details: [
                { whatsappNumber: mockWhatsappNumber, status: mockStatus, name: 'Test Name' }, // Status updated
            ],
        });
    });
});