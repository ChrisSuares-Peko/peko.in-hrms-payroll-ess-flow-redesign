const { Op } = require('sequelize');
const { findAllApplications } = require('../../companyIncorporation');
const companyIncorporation = require('../../../entities/companyIncorporation');

jest.mock('../../../entities/companyIncorporation', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllApplications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        companyIncorporation.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    });

    it('should use default pagination, ordering and credential/corporate joins', async () => {
        await findAllApplications();

        const args = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(args.where).toEqual({});
        expect(args.offset).toBe(0);
        expect(args.limit).toBe(20);
        expect(args.order).toEqual([['createdAt', 'DESC']]);
        expect(args.subQuery).toBe(false);
        expect(args.include).toEqual(expect.arrayContaining([
            expect.objectContaining({ as: 'credential', required: false }),
            expect.objectContaining({ as: 'corporateUser', required: false }),
        ]));
    });

    it('should apply status, entityType and corporateId filters', async () => {
        await findAllApplications({ status: 'APPROVED', entityType: 'llp', corporateId: 22 });

        const args = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(args.where).toMatchObject({ status: 'APPROVED', entityType: 'llp', corporateId: 22 });
    });

    it('should apply a date range filter when both from and to are provided', async () => {
        await findAllApplications({ from: '2026-01-01', to: '2026-01-31' });

        const args = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(args.where.createdAt).toEqual({
            [Op.between]: [new Date('2026-01-01'), new Date('2026-01-31T23:59:59')],
        });
    });

    it('should build an OR search across applicationId, username and corporate name', async () => {
        await findAllApplications({ searchText: 'INC/2026' });

        const args = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(args.where[Op.or]).toEqual([
            { applicationId: { [Op.like]: '%INC/2026%' } },
            { '$credential.username$': { [Op.like]: '%INC/2026%' } },
            { '$corporateUser.name$': { [Op.like]: '%INC/2026%' } },
        ]);
    });

    it('should fall back to createdAt for an invalid sortField and honour ASC sort', async () => {
        await findAllApplications({ sortField: 'maliciousField', sort: 'ASC' });

        const args = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(args.order).toEqual([['createdAt', 'ASC']]);
    });

    it('should honour a valid sortField', async () => {
        await findAllApplications({ sortField: 'totalAmount', sort: 'DESC' });

        const args = companyIncorporation.findAndCountAll.mock.calls[0][0];
        expect(args.order).toEqual([['totalAmount', 'DESC']]);
    });
});
