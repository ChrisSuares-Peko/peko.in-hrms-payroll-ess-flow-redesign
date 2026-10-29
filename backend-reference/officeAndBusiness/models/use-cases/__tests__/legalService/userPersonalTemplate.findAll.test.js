const { findAll } = require('../../userPersonalTemplate');
const userPersonalTemplate = require('../../../entities/userPersonalTemplate');

jest.mock('../../../entities/userPersonalTemplate', () => ({
    belongsTo: jest.fn(),
    findAndCountAll: jest.fn(),
}));

describe('userPersonalTemplate - findAll', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return templates filtered by corporateUserId', async () => {
        const mockData = {
            rows: [
                {
                    id: 1,
                    title: 'My Custom NDA',
                    category: 'Legal',
                    iconKey: 'nda',
                    corporateUserId: 10,
                },
            ],
            count: 1,
        };

        userPersonalTemplate.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAll({ corporateUserId: 10 });

        const calledWith = userPersonalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.corporateUserId).toBe(10);
        expect(calledWith.order).toEqual([['createdAt', 'DESC']]);
        expect(calledWith.raw).toBe(true);
        expect(calledWith.nest).toBe(true);
        expect(result).toEqual(mockData);
    });

    it('should apply subCorporateUserId filter when provided', async () => {
        userPersonalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10, subCorporateUserId: 3 });

        const calledWith = userPersonalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.subCorporateUserId).toBe(3);
    });

    it('should apply limit when provided', async () => {
        userPersonalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10, limit: 5 });

        const calledWith = userPersonalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.limit).toBe(5);
    });

    it('should not apply limit when not provided', async () => {
        userPersonalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAll({ corporateUserId: 10 });

        const calledWith = userPersonalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.limit).toBeUndefined();
    });

    it('should return empty rows and count 0 when no templates exist', async () => {
        userPersonalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        const result = await findAll({ corporateUserId: 10 });

        expect(result).toEqual({ rows: [], count: 0 });
    });

    it('should throw { message: "Something went wrong" } on database error', async () => {
        userPersonalTemplate.findAndCountAll.mockRejectedValue(new Error('DB connection failed'));

        await expect(findAll({ corporateUserId: 10 })).rejects.toEqual({
            message: 'Something went wrong',
        });
    });
});
