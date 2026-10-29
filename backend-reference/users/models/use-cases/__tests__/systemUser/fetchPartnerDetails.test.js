const { fetchPartnerDetails } = require('../../../use-cases/systemUser'); // Adjust path
const systemUser = require('../../../entities/systemUser');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
}));

// Mock the partnerLogos config.  This is *very* important!
jest.mock('../../../../public/partnerLogos', () => [
    { logo: 'default_logo.png', baseUrl: 'https://default.com', branding: 'default', signUpImage: 'default_signup.png' },
]);

describe('fetchPartnerDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return partner details from systemUser when found', async () => {
        const mockCredentialId = 123;
        const mockPartnerDetails = {
            assets: { logo: 'partner_logo.png', baseUrl: 'https://partner.com', signUpLogo: 'partner_signup.png' },
            branding: 'partner_branding',
        };

        systemUser.findOne.mockResolvedValue(mockPartnerDetails);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding'],
            nest: true,
            raw: true,
        });
        expect(result).toEqual({
            logo: 'partner_logo.png',
            baseUrl: 'https://partner.com',
            branding: 'partner_branding',
            signUpImage: 'partner_signup.png'
        });
    });

    it('should return default partner details when systemUser data is missing', async () => {
        const mockCredentialId = 123;
        systemUser.findOne.mockResolvedValue(null); // No user found

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding'],
            nest: true,
            raw: true,
        });
        expect(result).toEqual({
            logo: 'default_logo.png', // From mocked partnerLogos
            baseUrl: 'https://default.com',
            branding: 'default',
            signUpImage: 'default_signup.png'
        });
    });

    it('should handle missing assets or branding gracefully', async () => {
        const mockCredentialId = 123;
        const mockPartnerDetails = {
            // assets: { logo: 'partner_logo.png' }, // Missing baseUrl and signUpLogo
            branding: 'partner_branding',
        };

        systemUser.findOne.mockResolvedValue(mockPartnerDetails);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(result).toEqual({
            logo: 'default_logo.png', // Default logo
            baseUrl: 'https://default.com', // Default baseUrl
            branding: 'partner_branding',
            signUpImage: 'default_signup.png' // Default signUpImage
        });

        const mockPartnerDetails2 = {
            assets: { logo: 'partner_logo.png', baseUrl: 'https://partner.com' }, // Missing branding and signUpLogo
            // branding: 'partner_branding',
        };

        systemUser.findOne.mockResolvedValue(mockPartnerDetails2);
        const result2 = await fetchPartnerDetails(mockCredentialId);

        expect(result2).toEqual({
            logo: 'partner_logo.png',
            baseUrl: 'https://partner.com',
            branding: 'default', // Default branding
            signUpImage: 'default_signup.png' // Default signUpImage
        });
    });

    it('should fall back to default branding when the database query fails', async () => {
        const mockCredentialId = 123;
        const mockError = new Error('Database error');

        systemUser.findOne.mockRejectedValue(mockError);

        await expect(fetchPartnerDetails(mockCredentialId)).resolves.toEqual(
            expect.objectContaining({
                logo: expect.anything(),
                baseUrl: expect.anything(),
                branding: expect.anything(),
            })
        );

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
            attributes: ['assets', 'branding'],
            nest: true,
            raw: true,
        });
    });
});