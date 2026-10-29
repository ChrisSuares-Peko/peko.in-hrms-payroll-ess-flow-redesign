const { findAllRequestAndCount } = require('../../paytmBpos');
const PaytmBpos = require('../../../entities/paytmBpos');
const { Op } = require('sequelize');

jest.mock('../../../entities/paytmBpos');

describe('findAllRequestAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch requests with correct query options and return the data', async () => {
        const mockData = { count: 2, rows: [{ id: 1, storeName: 'Store A' }, { id: 2, storeName: 'Store B' }] };
        PaytmBpos.findAndCountAll.mockResolvedValue(mockData);

        const params = {
            limit: 10,
            offset: 0,
            from: '2024-02-01',
            to: '2024-02-10',
            sort: 'ASC',
            column: 'storeName',
            searchText: 'Store',
        };

        const result = await findAllRequestAndCount(params);

        expect(PaytmBpos.findAndCountAll).toHaveBeenCalledWith({
            where: expect.objectContaining({
                createdAt: {
                    [Op.between]: [params.from, expect.any(Date)],
                },
                [Op.or]: expect.any(Array),
            }),
            order: [['storeName', 'ASC']],
            limit: params.limit,
            offset: params.offset,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no records match the criteria', async () => {
        PaytmBpos.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const params = {
            limit: 10,
            offset: 0,
            from: '2024-02-01',
            to: '2024-02-10',
            sort: 'ASC',
            column: 'storeName',
            searchText: 'NonExistingStore',
        };

        const result = await findAllRequestAndCount(params);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should apply sorting based on the provided column and sort order', async () => {
        PaytmBpos.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1, storeName: 'Store A' }] });

        const params = {
            limit: 5,
            offset: 0,
            from: '2024-02-01',
            to: '2024-02-10',
            sort: 'DESC',
            column: 'contactPerson',
            searchText: '',
        };

        await findAllRequestAndCount(params);

        expect(PaytmBpos.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            order: [['contactPerson', 'DESC']],
        }));
    });

    it('should handle search filtering correctly', async () => {
        PaytmBpos.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1, storeName: 'Test Store' }] });

        const params = {
            limit: 10,
            offset: 0,
            from: '2024-02-01',
            to: '2024-02-10',
            sort: 'ASC',
            column: 'storeName',
            searchText: 'Test',
        };

        await findAllRequestAndCount(params);

        expect(PaytmBpos.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                [Op.or]: expect.arrayContaining([
                    { id: { [Op.like]: '%Test%' } },
                    { storeName: { [Op.like]: '%Test%' } },
                    { contactPerson: { [Op.like]: '%Test%' } },
                    { mobileNumber: { [Op.like]: '%Test%' } },
                    { email: { [Op.like]: '%Test%' } },
                    { preferredLanguage: { [Op.like]: '%Test%' } },
                ]),
            }),
        }));
    });

    it('should handle errors and throw a custom error message', async () => {
        PaytmBpos.findAndCountAll.mockRejectedValue(new Error('Database error'));

        const params = {
            limit: 10,
            offset: 0,
            from: '2024-02-01',
            to: '2024-02-10',
            sort: 'ASC',
            column: 'storeName',
            searchText: 'Test',
        };

        await expect(findAllRequestAndCount(params))
            .rejects.toThrow('Database error');
    });
});
