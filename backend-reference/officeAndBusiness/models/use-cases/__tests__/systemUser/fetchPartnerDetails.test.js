const { fetchPartnerDetails } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');
jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

describe('fetchPartnerDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return partner details when systemUser record is found', async () => {
        const mockCredentialId = 1;
        const mockResponse = {
            assets: { logo: 'partner-logo.png', baseUrl: 'https://partner.com' },
            branding: 'partner-branding',
        };

        systemUser.findOne.mockResolvedValue(mockResponse);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });
        expect(result).toEqual({
            logo: 'partner-logo.png',
            baseUrl: 'https://partner.com',
            branding: 'partner-branding',
        });
    });

    it('should return default partner details when no systemUser record is found', async () => {
        const mockCredentialId = 2;
        systemUser.findOne.mockResolvedValue(null);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(result).toEqual({
            logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09',
            baseUrl: 'https://uae.peko.one',
            branding: 'Peko',
        });
    });

    it('should return default values when assets are partially missing', async () => {
        const mockCredentialId = 3;
        const mockResponse = {
            assets: { logo: 'partner-logo.png' }, // Missing baseUrl
            branding: 'partner-branding',
        };

        systemUser.findOne.mockResolvedValue(mockResponse);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(result).toEqual({
            logo: 'partner-logo.png',
            baseUrl: 'https://uae.peko.one',
            branding: 'partner-branding',
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
