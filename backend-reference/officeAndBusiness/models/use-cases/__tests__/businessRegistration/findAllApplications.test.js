const { findAllApplications } = require('../../../use-cases/businessRegistration');
const businessRegistration = require('../../../entities/businessRegistration');

jest.mock('../../../entities/businessRegistration', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllApplications (admin listing)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('applies defaults (limit 20, createdAt DESC, empty where) and includes credential + corporateUser', async () => {
        businessRegistration.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllApplications();

        const arg = businessRegistration.findAndCountAll.mock.calls[0][0];
        expect(arg.offset).toBe(0);
        expect(arg.limit).toBe(20);
        expect(arg.order).toEqual([['createdAt', 'DESC']]);
        expect(arg.where).toEqual({});
        expect(arg.include).toHaveLength(2);
    });

    it('filters by status / entityType / paymentStatus / corporateId', async () => {
        businessRegistration.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        await findAllApplications({
            status: 'SUBMITTED',
            entityType: 'proprietorship',
            paymentStatus: 'COMPLETED',
            corporateId: 9,
        });

        const { where } = businessRegistration.findAndCountAll.mock.calls[0][0];
        expect(where).toEqual(
            expect.objectContaining({
                status: 'SUBMITTED',
                entityType: 'proprietorship',
                paymentStatus: 'COMPLETED',
                corporateId: 9,
            })
        );
    });

    it('falls back to createdAt for an unknown sortField and honours ASC', async () => {
        businessRegistration.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        await findAllApplications({ sortField: 'hacky; DROP', sort: 'ASC' });
        expect(businessRegistration.findAndCountAll.mock.calls[0][0].order).toEqual([['createdAt', 'ASC']]);
    });

    it('whitelists a valid sortField', async () => {
        businessRegistration.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        await findAllApplications({ sortField: 'totalAmount' });
        expect(businessRegistration.findAndCountAll.mock.calls[0][0].order).toEqual([['totalAmount', 'DESC']]);
    });
});
