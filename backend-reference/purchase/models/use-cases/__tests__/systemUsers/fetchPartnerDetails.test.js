const { fetchPartnerDetails } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

describe('fetchPartnerDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return partner details when the user is found', async () => {
        const mockCredentialId = 1;
        const mockResult = {
            assets: {
                logo: 'mockLogoUrl',
                baseUrl: 'mockBaseUrl',
                signUpLogo: 'mockSignUpLogoUrl',
            },
            branding: 'mockBranding',
        };
        const mockDefaultPartnerLogos = [
            {
                logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09',
                baseUrl: 'https://uatae.pekoapp.com',
                branding: 'Peko',
               
            },
        ];

        global.partnerLogos = mockDefaultPartnerLogos;
        systemUser.findOne.mockResolvedValue(mockResult);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: 'mockLogoUrl',
            baseUrl: 'mockBaseUrl',
            branding: 'mockBranding',
            
        });
    });

    it('should return default partner logos when the user is not found', async () => {
        const mockCredentialId = 1;
        const mockDefaultPartnerLogos = [
            {
                logo: 'defaultLogoUrl',
                baseUrl: 'https://uae.peko.one',
                branding: 'defaultBranding',
                signUpImage: 'defaultSignUpImageUrl',
            },
        ];

        global.partnerLogos = mockDefaultPartnerLogos;
        systemUser.findOne.mockResolvedValue(null);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09',
            baseUrl: 'https://uae.peko.one',
            branding: 'Peko',
           
        });
    });

    it('should handle errors gracefully', async () => {
        const mockCredentialId = 1;
        const mockError = new Error('Database error');

        systemUser.findOne.mockRejectedValue(mockError);

        await expect(fetchPartnerDetails(mockCredentialId)).rejects.toThrow('Database error');

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });
    });
});

describe("the partner's gateway charge terms", () => {
    it("carries the terms beside the share and the state", async () => {
        systemUser.findOne.mockResolvedValue({
            assets: {},
            branding: null,
            sharePercentage: "10.0000",
            state: "Kerala",
            gatewayCharge: { percentage: 1.95, fixed: 3 },
        });

        const result = await fetchPartnerDetails(7);

        expect(systemUser.findOne.mock.calls[0][0].attributes).toContain("gatewayCharge");
        expect(result).toMatchObject({
            sharePercentage: "10.0000",
            state: "Kerala",
            gatewayCharge: { percentage: 1.95, fixed: 3 },
        });
    });

    it("carries no terms when the partner has none", async () => {
        systemUser.findOne.mockResolvedValue({
            assets: {},
            branding: null,
            sharePercentage: "10.0000",
            state: "Kerala",
            gatewayCharge: null,
        });

        expect((await fetchPartnerDetails(7)).gatewayCharge).toBeNull();
    });
});
