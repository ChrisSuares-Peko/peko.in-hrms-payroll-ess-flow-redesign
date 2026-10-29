const { createOrUpdateWhatsAppNumberSetting } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting'); 

jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));

describe('createOrUpdateWhatsAppNumberSetting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new WhatsApp number setting if one does not exist', async () => {
        const mockInput = { name: 'whatsappNumber', whatsappNumber: '1234567890', username: 'testuser' };
        const mockNewSetting = { id: 1, name: 'whatsappNumber', details: [{ whatsappNumber: '1234567890', status: true, name: 'testuser' }] };

        Setting.findOne.mockResolvedValue(null);
        Setting.create.mockResolvedValue(mockNewSetting);

        const result = await createOrUpdateWhatsAppNumberSetting(mockInput);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: mockInput.name } });
        expect(Setting.create).toHaveBeenCalledWith({ name: mockInput.name, details: [{ whatsappNumber: '1234567890', status: true, name: 'testuser' }] });
        expect(result).toEqual({ updated: false, setting: mockNewSetting });
    });

    it('should update an existing WhatsApp number setting if one exists', async () => {
        const mockInput = { name: 'whatsappNumber', whatsappNumber: '9876543210', username: 'anotheruser' };
        const mockExistingSetting = {
            id: 1,
            name: 'whatsappNumber',
            details: [{ whatsappNumber: '1234567890', status: true, name: 'testuser' }],
            save: jest.fn().mockResolvedValue(), // Mock the save method
        };

        Setting.findOne.mockResolvedValue(mockExistingSetting);

        await createOrUpdateWhatsAppNumberSetting(mockInput);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: mockInput.name } });
        expect(Setting.create).not.toHaveBeenCalled();
        expect(mockExistingSetting.save).toHaveBeenCalled();
       
    });

    it('should handle errors during database operations (findOne)', async () => {
        const mockInput = { name: 'whatsappNumber', whatsappNumber: '1234567890', username: 'testuser' };
        const mockError = new Error('Database error');

        Setting.findOne.mockRejectedValue(mockError);

        await expect(createOrUpdateWhatsAppNumberSetting(mockInput)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: mockInput.name } });
    });

    it('should handle errors during database operations (create)', async () => {
        const mockInput = { name: 'whatsappNumber', whatsappNumber: '1234567890', username: 'testuser' };
        const mockError = new Error('Database error');

        Setting.findOne.mockResolvedValue(null);
        Setting.create.mockRejectedValue(mockError);


        await expect(createOrUpdateWhatsAppNumberSetting(mockInput)).rejects.toThrow(mockError);

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: mockInput.name } });
        expect(Setting.create).toHaveBeenCalledWith({ name: mockInput.name, details: [{ whatsappNumber: '1234567890', status: true, name: 'testuser' }] });
    });

    it('should handle errors during database operations (save)', async () => {
        const mockInput = { name: 'whatsappNumber', whatsappNumber: '9876543210', username: 'anotheruser' };
        const mockExistingSetting = {
            id: 1,
            name: 'whatsappNumber',
            details: [{ whatsappNumber: '1234567890', status: true, name: 'testuser' }],
            save: jest.fn().mockRejectedValue(new Error('Save Error')), // Mock a rejection
        };

        Setting.findOne.mockResolvedValue(mockExistingSetting);

        await expect(createOrUpdateWhatsAppNumberSetting(mockInput)).rejects.toThrow('Save Error');

        expect(Setting.findOne).toHaveBeenCalledWith({ where: { name: mockInput.name } });
        expect(mockExistingSetting.save).toHaveBeenCalled();
    });
});