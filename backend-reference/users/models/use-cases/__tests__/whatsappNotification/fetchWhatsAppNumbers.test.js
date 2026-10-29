const { fetchWhatsAppNumbers } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting');
jest.mock('../../../entities/setting', () => ({
    findOne: jest.fn(),
}));

describe('fetchWhatsAppNumbers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return WhatsApp numbers with pagination and search', async () => {
        const mockSearchText = '123';
        const mockPage = 1;
        const mockItemsPerPage = 2;
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', name: 'Test 1' },
                { whatsappNumber: '9876543210', name: 'Another 2' },
                { whatsappNumber: '1122334455', name: 'Test 3' },
                { whatsappNumber: '5566778899', name: 'Test 4' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await fetchWhatsAppNumbers(mockSearchText, mockPage, mockItemsPerPage);

        expect(Setting.findOne).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
        });
        expect(result).toEqual({
            numbers: [
                { whatsappNumber: '1234567890', name: 'Test 1' },
            ],
            totalCount: 1, // Only 2 numbers match the search
        });
    });

    it('should return all WhatsApp numbers when searchText is empty', async () => {
        const mockPage = 1;
        const mockItemsPerPage = 3;
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', name: 'Test 1' },
                { whatsappNumber: '9876543210', name: 'Another 2' },
                { whatsappNumber: '1122334455', name: 'Test 3' },
                { whatsappNumber: '5566778899', name: 'Test 4' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await fetchWhatsAppNumbers('', mockPage, mockItemsPerPage); // Empty search text

        expect(Setting.findOne).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
        });
        expect(result).toEqual({
            numbers: [
                { whatsappNumber: '1234567890', name: 'Test 1' },
                { whatsappNumber: '9876543210', name: 'Another 2' },
                { whatsappNumber: '1122334455', name: 'Test 3' },
            ],
            totalCount: 4, // All numbers are returned
        });
    });


    it('should handle cases where no setting is found', async () => {
        const mockSearchText = '123';
        const mockPage = 1;
        const mockItemsPerPage = 2;

        Setting.findOne.mockResolvedValue(null);

        const result = await fetchWhatsAppNumbers(mockSearchText, mockPage, mockItemsPerPage);

        expect(Setting.findOne).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
        });
        expect(result).toEqual({ numbers: [], totalCount: 0 });
    });

    it('should handle different page and itemsPerPage values', async () => {
        const mockSearchText = '';
        const mockPage = 2; // Second page
        const mockItemsPerPage = 2;
        const mockSetting = {
            details: [
                { whatsappNumber: '1234567890', name: 'Test 1' },
                { whatsappNumber: '9876543210', name: 'Another 2' },
                { whatsappNumber: '1122334455', name: 'Test 3' },
                { whatsappNumber: '5566778899', name: 'Test 4' },
            ],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await fetchWhatsAppNumbers(mockSearchText, mockPage, mockItemsPerPage);

        expect(result).toEqual({
            numbers: [
                { whatsappNumber: '1122334455', name: 'Test 3' },
                { whatsappNumber: '5566778899', name: 'Test 4' },
            ],
            totalCount: 4,
        });
    });

     it('should handle empty details array', async () => {
        const mockSearchText = '';
        const mockPage = 1; // Second page
        const mockItemsPerPage = 2;
        const mockSetting = {
            details: [],
        };

        Setting.findOne.mockResolvedValue(mockSetting);

        const result = await fetchWhatsAppNumbers(mockSearchText, mockPage, mockItemsPerPage);

        expect(result).toEqual({
            numbers: [],
            totalCount: 0,
        });
    });
});