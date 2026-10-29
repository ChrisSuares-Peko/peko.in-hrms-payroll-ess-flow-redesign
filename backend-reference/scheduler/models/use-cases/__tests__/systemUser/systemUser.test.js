jest.mock('../../../../public/partnerLogos', () => [{
    logo: 'https://test.com/logo.png',
    branding: 'Peko',
    signUpImage: 'https://test.com/signup.png',
    baseUrl: 'https://uae.peko.one'
}]);

const { fetchPartnerDetails } = require('../../systemUser');
const systemUser = require('../../../entities/systemUser');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('fetchPartnerDetails', () => {
    it('should return partner details when found', async () => {
        const mockResult = {
            assets: {
                logo: 'https://partner.com/logo.png',
                baseUrl: 'https://partner.peko.one',
                signUpLogo: 'https://partner.com/signup.png'
            },
            branding: 'Partner Brand'
        };
        systemUser.findOne.mockResolvedValue(mockResult);

        const result = await fetchPartnerDetails(1);
        expect(result).toEqual({
            logo: 'https://partner.com/logo.png',
            baseUrl: 'https://partner.peko.one',
            branding: 'Partner Brand',
            signUpImage: 'https://partner.com/signup.png'
        });
    });

    it('should return default partner logos when result is null', async () => {
        systemUser.findOne.mockResolvedValue(null);

        const result = await fetchPartnerDetails(999);
        expect(result).toEqual({
            logo: 'https://test.com/logo.png',
            baseUrl: 'https://uae.peko.one',
            branding: 'Peko',
            signUpImage: 'https://test.com/signup.png'
        });
    });

    it('should use default logos when assets fields are missing', async () => {
        systemUser.findOne.mockResolvedValue({ assets: {}, branding: null });

        const result = await fetchPartnerDetails(1);
        expect(result.logo).toBe('https://test.com/logo.png');
        expect(result.branding).toBe('Peko');
    });
});
