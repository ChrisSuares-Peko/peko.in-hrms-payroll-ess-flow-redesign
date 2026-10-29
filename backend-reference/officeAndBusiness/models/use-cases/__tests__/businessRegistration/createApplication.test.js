const { createApplication } = require('../../../use-cases/businessRegistration');
const businessRegistration = require('../../../entities/businessRegistration');

jest.mock('../../../entities/businessRegistration', () => ({
    create: jest.fn(),
}));

describe('createApplication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a row merging credentialId + corporateId with the application data', async () => {
        const created = { id: 1, applicationId: 'BR/2026/00001' };
        businessRegistration.create.mockResolvedValue(created);

        const result = await createApplication(7, 9, {
            entityType: 'proprietorship',
            businessName: 'Acme Traders',
        });

        expect(businessRegistration.create).toHaveBeenCalledWith({
            credentialId: 7,
            corporateId: 9,
            entityType: 'proprietorship',
            businessName: 'Acme Traders',
        });
        expect(result).toEqual(created);
    });

    it('propagates a DB error', async () => {
        businessRegistration.create.mockRejectedValue(new Error('Database error'));
        await expect(createApplication(1, 2, {})).rejects.toThrow('Database error');
    });
});
