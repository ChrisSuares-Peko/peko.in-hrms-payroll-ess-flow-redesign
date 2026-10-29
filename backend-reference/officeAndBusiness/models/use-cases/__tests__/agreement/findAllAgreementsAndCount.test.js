const { findAllAgreementsAndCount } = require('../../agreement');
const agreement = require('../../../entities/agreement');
const { Op } = require('sequelize');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/invoiceCustomerV2');
jest.mock('../../../entities/invoicingV2');
jest.mock('../../../entities/subCorporateUsers');

describe('findAllAgreementsAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockRows = [{ id: 1, agreementNumber: 'AGR-001', status: 'DRAFT' }];

    const baseParams = {
        from: '2024-01-01',
        to: '2024-12-31',
        limit: 10,
        offset: 0,
        searchText: null,
        sort: 'DESC',
        sortField: 'id',
        userId: 1,
        subCorporateUserId: null,
        status: null,
        customerId: null,
    };

    it('should return rows and statusCounts with correct structure', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: mockRows, count: 1 });
        agreement.count.mockResolvedValue(5);

        const result = await findAllAgreementsAndCount(baseParams);

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ corporateUserId: 1 }),
                limit: 10,
                offset: 0,
                raw: true,
                nest: true,
            })
        );
        expect(result).toEqual({
            rows: mockRows,
            recordsTotal: 1,
            statusCounts: { total: 5, draft: 5, sent: 5, signed: 5, active: 5, expiringSoon: 5 },
        });
    });

    it('should apply Op.in when status is an array', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        agreement.count.mockResolvedValue(0);

        await findAllAgreementsAndCount({ ...baseParams, status: ['DRAFT', 'SENT'] });

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: { [Op.in]: ['DRAFT', 'SENT'] },
                }),
            })
        );
    });

    it('should apply status directly when status is a string', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        agreement.count.mockResolvedValue(0);

        await findAllAgreementsAndCount({ ...baseParams, status: 'ACTIVE' });

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: 'ACTIVE' }),
            })
        );
    });

    it('should apply searchText Op.or filter', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        agreement.count.mockResolvedValue(0);

        await findAllAgreementsAndCount({ ...baseParams, searchText: 'AGR' });

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    [Op.or]: expect.arrayContaining([
                        { agreementNumber: { [Op.like]: '%AGR%' } },
                        { status: { [Op.like]: '%AGR%' } },
                        { contractValue: { [Op.like]: '%AGR%' } },
                    ]),
                }),
            })
        );
    });

    it('should apply customerId filter', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        agreement.count.mockResolvedValue(0);

        await findAllAgreementsAndCount({ ...baseParams, customerId: 5 });

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ customerId: 5 }),
            })
        );
    });

    it('should apply subCorporateUserId filter', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        agreement.count.mockResolvedValue(0);

        await findAllAgreementsAndCount({ ...baseParams, subCorporateUserId: 3 });

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ subCorporateUserId: 3 }),
            })
        );
    });

    it('should apply date range when from and to are provided', async () => {
        agreement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        agreement.count.mockResolvedValue(0);

        await findAllAgreementsAndCount(baseParams);

        expect(agreement.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: { [Op.between]: ['2024-01-01', expect.any(Date)] },
                }),
            })
        );
    });

    it('should throw an error if query fails', async () => {
        agreement.findAndCountAll.mockRejectedValue(new Error('Database error'));
        agreement.count.mockResolvedValue(0);

        await expect(findAllAgreementsAndCount(baseParams)).rejects.toThrow('Database error');
    });
});
