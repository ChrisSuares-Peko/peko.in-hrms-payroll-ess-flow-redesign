const { fetchWhatsAppBusinessByEmail } = require('../../../use-cases/whatsappBusiness');
const WhatsAppBusiness = require('../../../entities/whatsappBusiness');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/whatsappBusiness', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('fetchWhatsAppBusinessByEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return email and name when WhatsApp Business is found', async () => {
        const mockBusinessId = '12345';
        const mockResponse = {
            credential: {
                email: 'test@example.com',
                name: 'Test User',
            },
        };

        WhatsAppBusiness.findOne.mockResolvedValue(mockResponse);

        const result = await fetchWhatsAppBusinessByEmail(mockBusinessId);

        expect(WhatsAppBusiness.findOne).toHaveBeenCalledWith({
            where: { businessId: mockBusinessId },
            include: {
                model: credential,
                attributes: ['email', 'name'],
            },
        });
        expect(result).toEqual(mockResponse.credential);
    });

    it('should throw an error when WhatsApp Business is not found', async () => {
        const mockBusinessId = '67890';
        WhatsAppBusiness.findOne.mockResolvedValue(null);

        await expect(fetchWhatsAppBusinessByEmail(mockBusinessId)).rejects.toThrow(
            'WhatsApp Business not found with the provided businessId'
        );
    });

    it('should throw an error when a database error occurs', async () => {
        const mockBusinessId = '54321';
        const mockError = new Error('Database error');

        WhatsAppBusiness.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        await expect(fetchWhatsAppBusinessByEmail(mockBusinessId)).rejects.toThrow(mockError);
        expect(console.error).toHaveBeenCalledWith(mockError);
    });
});
