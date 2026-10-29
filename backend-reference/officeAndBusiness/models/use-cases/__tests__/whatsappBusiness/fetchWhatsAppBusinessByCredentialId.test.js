const { fetchWhatsAppBusinessByCredentialId } = require('../../../use-cases/whatsappBusiness');
const WhatsAppBusiness = require('../../../entities/whatsappBusiness');

jest.mock('../../../entities/whatsappBusiness', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('fetchWhatsAppBusinessByCredentialId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return WhatsApp Business details when found', async () => {
        const mockCredentialId = 1;
        const mockResponse = {
            businessId: '123456',
            projectId: '7890',
        };

        WhatsAppBusiness.findOne.mockResolvedValue(mockResponse);

        const result = await fetchWhatsAppBusinessByCredentialId(mockCredentialId);

        expect(WhatsAppBusiness.findOne).toHaveBeenCalledWith({ where: { credentialId: mockCredentialId } });
        expect(result).toEqual({
            status: true,
            message: 'Success',
            businessId: mockResponse.businessId,
            projectId: mockResponse.projectId,
        });
    });

    it('should return not found response when no record is found', async () => {
        const mockCredentialId = 2;
        WhatsAppBusiness.findOne.mockResolvedValue(null);

        const result = await fetchWhatsAppBusinessByCredentialId(mockCredentialId);

        expect(result).toEqual({ status: false, message: 'Not found' });
    });

    it('should return an error response when an exception occurs', async () => {
        const mockCredentialId = 3;
        const mockError = new Error('Database error');

        WhatsAppBusiness.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await fetchWhatsAppBusinessByCredentialId(mockCredentialId);

        expect(result).toEqual({ status: false, message: 'Something went wrong' });
    });
});
