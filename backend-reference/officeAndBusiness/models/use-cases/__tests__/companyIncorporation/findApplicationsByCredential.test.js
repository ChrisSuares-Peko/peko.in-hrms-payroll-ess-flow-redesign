const { findApplicationsByCredential } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findApplicationsByCredential', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use default pagination and ordering when no options are passed', async () => {
        const mockResult = { rows: [{ id: 1 }], count: 1 };
        companyIncorporation.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findApplicationsByCredential(11, 22);

        expect(companyIncorporation.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: 11, corporateId: 22 },
            offset: 0,
            limit: 10,
            order: [['createdAt', 'DESC']],
        });
        expect(result).toEqual(mockResult);
    });

    it('should apply the status filter and custom pagination when provided', async () => {
        companyIncorporation.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findApplicationsByCredential(11, 22, { offset: 20, limit: 5, status: 'APPROVED', orderBy: 'updatedAt' });

        expect(companyIncorporation.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: 11, corporateId: 22, status: 'APPROVED' },
            offset: 20,
            limit: 5,
            order: [['updatedAt', 'DESC']],
        });
    });

    it('should not add a status filter when status is falsy', async () => {
        companyIncorporation.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findApplicationsByCredential(11, 22, { status: undefined });

        const calledWith = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where).not.toHaveProperty('status');
    });
});
