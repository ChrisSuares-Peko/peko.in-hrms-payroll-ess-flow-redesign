const { findAll } = require('../../legalDocument');
const legalDocument = require('../../../entities/legalDocument');
const { Op } = require('sequelize');

jest.mock('../../../entities/legalDocument', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('legalDocument - findAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return documents filtered by corporateUserId', async () => {
        const mockData = {
            rows: [
                {
                    id: 1,
                    title: 'NDA Agreement',
                    status: 'DRAFT',
                    corporateUserId: 10,
                },
            ],
            count: 1,
        };

        legalDocument.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAll({ corporateUserId: 10 });

        const calledWith = legalDocument.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.corporateUserId).toBe(10);
        expect(calledWith.order).toEqual([['createdAt', 'DESC']]);
        expect(calledWith.raw).toBe(true);
        expect(calledWith.nest).toBe(true);
        expect(result).toEqual(mockData);
    });

    it('should apply subCorporateUserId filter when provided', async () => {
        legalDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10, subCorporateUserId: 5 });

        const calledWith = legalDocument.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.subCorporateUserId).toBe(5);
    });

    it('should apply searchText filter as LIKE query on title', async () => {
        legalDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10, searchText: 'NDA' });

        const calledWith = legalDocument.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.title).toEqual({ [Op.like]: '%NDA%' });
    });

    it('should apply status filter when provided', async () => {
        legalDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10, status: 'SENT' });

        const calledWith = legalDocument.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.status).toBe('SENT');
    });

    it('should apply limit when provided', async () => {
        legalDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10, limit: 5 });

        const calledWith = legalDocument.findAndCountAll.mock.calls[0][0];
        expect(calledWith.limit).toBe(5);
    });

    it('should not apply limit when not provided', async () => {
        legalDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10 });

        const calledWith = legalDocument.findAndCountAll.mock.calls[0][0];
        expect(calledWith.limit).toBeUndefined();
    });

    it('should return empty rows and count 0 when no documents exist', async () => {
        legalDocument.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        const result = await findAll({ corporateUserId: 10, searchText: 'NonExistent' });

        expect(result).toEqual({ rows: [], count: 0 });
    });

    it('should throw { message: "Something went wrong" } on database error', async () => {
        legalDocument.findAndCountAll.mockRejectedValue(new Error('DB connection failed'));

        await expect(findAll({ corporateUserId: 10 })).rejects.toEqual({
            message: 'Something went wrong',
        });
    });
});
