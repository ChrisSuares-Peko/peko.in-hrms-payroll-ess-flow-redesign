const { createApplication } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('createApplication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an application merging credentialId and corporateId into the data', async () => {
        const credentialId = 11;
        const corporateId = 22;
        const applicationData = {
            applicationId: 'INC/2026/00001',
            entityType: 'private_limited',
            status: 'PENDING',
        };
        const mockDoc = { id: 1, credentialId, corporateId, ...applicationData };
        companyIncorporation.create.mockResolvedValue(mockDoc);

        const result = await createApplication(credentialId, corporateId, applicationData);

        expect(companyIncorporation.create).toHaveBeenCalledWith({
            credentialId,
            corporateId,
            ...applicationData,
        });
        expect(result).toEqual(mockDoc);
    });

    it('should propagate an error if creation fails', async () => {
        companyIncorporation.create.mockRejectedValue(new Error('Database error'));

        await expect(createApplication(1, 2, { applicationId: 'INC/2026/00002' }))
            .rejects.toThrow('Database error');
    });
});
