const { fetchPartnerDetails } = require('../../../use-cases/systemUser');
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

// Mock partnerLogos array
const partnerLogos = [
    { logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09', baseUrl: 'https://in.peko.one', branding: 'Peko' },
];

describe('fetchPartnerDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return partner details when a matching credentialId is found', async () => {
        const mockCredentialId = 123;
        const mockUserDetails = {
            assets: {
                logo: 'https://example.com/logo.png',
                baseUrl: 'https://example.com',
            },
            branding: 'custom-branding',
        };

        systemUser.findOne.mockResolvedValue(mockUserDetails);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: 'https://example.com/logo.png',
            baseUrl: 'https://example.com',
            branding: 'custom-branding',
        });
    });

    it('should return default values when no matching credentialId is found', async () => {
        const mockCredentialId = 999;

        systemUser.findOne.mockResolvedValue(null);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: partnerLogos[0].logo,
            baseUrl: partnerLogos[0].baseUrl,
            branding: partnerLogos[0].branding,
        });
    });

    it('should return default values when assets or branding are missing', async () => {
        const mockCredentialId = 123;
        const mockUserDetails = {
            assets: {}, // Missing logo and baseUrl
            branding: null, // Missing branding
        };

        systemUser.findOne.mockResolvedValue(mockUserDetails);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: partnerLogos[0].logo,
            baseUrl: partnerLogos[0].baseUrl,
            branding: partnerLogos[0].branding,
        });
    });

    it('should fall back to default branding when the database query fails', async () => {
        const mockCredentialId = 123;
        const mockError = new Error('Database error');

        systemUser.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        await expect(fetchPartnerDetails(mockCredentialId)).resolves.toEqual(
            expect.objectContaining({
                logo: expect.anything(),
                baseUrl: expect.anything(),
                branding: expect.anything(),
            })
        );
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
