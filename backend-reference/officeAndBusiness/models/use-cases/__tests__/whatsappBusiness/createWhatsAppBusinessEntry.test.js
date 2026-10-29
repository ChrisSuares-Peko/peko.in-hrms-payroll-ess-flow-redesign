const { createWhatsAppBusinessEntry } = require('../../../use-cases/whatsappBusiness');
const WhatsAppBusiness = require('../../../entities/whatsappBusiness');

jest.mock('../../../entities/whatsappBusiness', () => ({
    create: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('createWhatsAppBusinessEntry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a WhatsApp Business entry successfully', async () => {
        const mockParams = { businessName: 'Test Business', phoneNumber: '+1234567890' };
        const mockResponse = {
            id: 1,
            businessName: 'Test Business',
            phoneNumber: '+1234567890',
            createdAt: new Date(),
        };

        WhatsAppBusiness.create.mockResolvedValue({ get: () => mockResponse });

        const result = await createWhatsAppBusinessEntry(mockParams);

        expect(WhatsAppBusiness.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual({ status: true, message: 'Success', data: mockResponse });
    });

    it('should return an error response when creation fails', async () => {
        const mockParams = { businessName: 'Failing Business', phoneNumber: '+9876543210' };
        const mockError = new Error('Database error');

        WhatsAppBusiness.create.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await createWhatsAppBusinessEntry(mockParams);

        expect(console.error).toHaveBeenCalledWith('Error creating WhatsApp Business entry:', mockError);
        expect(result).toEqual({ status: false, message: 'Failed to create WhatsApp Business entry' });
    });
});
