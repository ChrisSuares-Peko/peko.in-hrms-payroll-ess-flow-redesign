const { findApplicationsByCredential } = require('../../../use-cases/businessRegistration');
const businessRegistration = require('../../../entities/businessRegistration');

jest.mock('../../../entities/businessRegistration', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findApplicationsByCredential', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('applies default paging/order and excludes the heavy JSON columns', async () => {
        const page = { count: 0, rows: [] };
        businessRegistration.findAndCountAll.mockResolvedValue(page);

        const result = await findApplicationsByCredential(7, 9);

        expect(businessRegistration.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { credentialId: 7, corporateId: 9 },
                offset: 0,
                limit: 10,
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['documents', 'vendorPeople', 'vendorShareholdings', 'vendorStages', 'vendorError'],
                },
            })
        );
        expect(result).toEqual(page);
    });

    it('adds the status filter and honours custom paging/order', async () => {
        businessRegistration.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findApplicationsByCredential(7, 9, {
            status: 'SUBMITTED',
            offset: 20,
            limit: 5,
            orderBy: 'updatedAt',
        });

        expect(businessRegistration.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { credentialId: 7, corporateId: 9, status: 'SUBMITTED' },
                offset: 20,
                limit: 5,
                order: [['updatedAt', 'DESC']],
            })
        );
    });
});
