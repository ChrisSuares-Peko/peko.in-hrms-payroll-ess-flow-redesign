const { findApplicationById } = require('../../../use-cases/businessRegistration');
const businessRegistration = require('../../../entities/businessRegistration');

jest.mock('../../../entities/businessRegistration', () => ({
    findOne: jest.fn(),
}));

describe('findApplicationById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('queries by applicationId + credentialId + corporateId', async () => {
        const row = { id: 1, applicationId: 'BR/2026/1' };
        businessRegistration.findOne.mockResolvedValue(row);

        const result = await findApplicationById('BR/2026/1', 7, 9);

        expect(businessRegistration.findOne).toHaveBeenCalledWith({
            where: { applicationId: 'BR/2026/1', credentialId: 7, corporateId: 9 },
        });
        expect(result).toEqual(row);
    });

    it('returns null when the application is not found', async () => {
        businessRegistration.findOne.mockResolvedValue(null);
        expect(await findApplicationById('missing', 1, 1)).toBeNull();
    });
});
