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
                signUpImage: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340',
            
            },
        ];

        global.partnerLogos = mockDefaultPartnerLogos;
        systemUser.findOne.mockResolvedValue(mockResult);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId ,
                "brandingStatus": true},
            attributes: ['assets', 'branding'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: 'mockLogoUrl',
            baseUrl: 'mockBaseUrl',
            branding: 'mockBranding',
            signUpImage: 'mockSignUpLogoUrl',
        });
    });

    it('should return default partner logos when the user is not found', async () => {
        const mockCredentialId = 1;
        const mockDefaultPartnerLogos = [
            {
                logo: 'defaultLogoUrl',
                baseUrl: 'defaultBaseUrl',
                branding: 'defaultBranding',
                signUpImage: 'defaultSignUpImageUrl',
            },
        ];

        global.partnerLogos = mockDefaultPartnerLogos;
        systemUser.findOne.mockResolvedValue(null);

        const result = await fetchPartnerDetails(mockCredentialId);

        expect(systemUser.findOne).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId ,
                "brandingStatus": true,},
            attributes: ['assets', 'branding'],
            nest: true,
            raw: true,
        });

        expect(result).toEqual({
            logo: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09',
            baseUrl: 'https://uatae.pekoapp.com',
            branding: 'Peko',
            signUpImage: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340',
        
        });
    });

    it('should fall back to default branding when the database query fails', async () => {
        const mockCredentialId = 1;
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
            where: { credentialId: mockCredentialId ,"brandingStatus": true,},
            attributes: ['assets', 'branding'],
            nest: true,
            raw: true,
        });
    });
});
