const { getActiveWhatsAppNumbers } = require('../../../use-cases/whatsappNotification'); // Adjust path
const Setting = require('../../../entities/setting'); 

jest.mock('../../../entities/setting', () => ({
    findAll: jest.fn(),
}));

describe('getActiveWhatsAppNumbers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an array of active WhatsApp numbers', async () => {
        const mockSettings = [
            {
                details: [
                    { whatsappNumber: '1234567890', status: true },
                    { whatsappNumber: '1122334455', status: false }, // Inactive
                    { whatsappNumber: '9876543210', status: true },
                ],
            },
            {
                details: [
                  { whatsappNumber: '5566778899', status: true },
                ],
            }
        ];

        Setting.findAll.mockResolvedValue(mockSettings);

        const result = await getActiveWhatsAppNumbers();

        expect(Setting.findAll).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
            raw: true,
        });
        expect(result).toEqual(['1234567890', '9876543210', '5566778899']);
    });

    it('should return an empty array if no active WhatsApp numbers are found', async () => {
        const mockSettings = [
            {
                details: [
                    { whatsappNumber: '1122334455', status: false }, // Inactive
                ],
            },
        ];

        Setting.findAll.mockResolvedValue(mockSettings);

        const result = await getActiveWhatsAppNumbers();

        expect(Setting.findAll).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
            raw: true,
        });
        expect(result).toEqual([]);
    });

    it('should return an empty array if no settings are found', async () => {
        Setting.findAll.mockResolvedValue([]);

        const result = await getActiveWhatsAppNumbers();

        expect(Setting.findAll).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
            raw: true,
        });
        expect(result).toEqual([]);
    });


    it('should handle errors during database operations', async () => {
        const mockError = new Error('Database error');

        Setting.findAll.mockRejectedValue(mockError);

        const consoleLogSpy = jest.spyOn(console, 'log');

        const result = await getActiveWhatsAppNumbers();

        expect(Setting.findAll).toHaveBeenCalledWith({
            where: { name: 'whatsAppNotifications' },
            attributes: ['details'],
            raw: true,
        });
        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(consoleLogSpy).toHaveBeenCalledWith("FETCH ALL ACTIVE WHATSAPP NUMBER CALLED");
        expect(result).toBeUndefined();// Or perhaps null, or throw the error;

        consoleLogSpy.mockRestore();
    });
});