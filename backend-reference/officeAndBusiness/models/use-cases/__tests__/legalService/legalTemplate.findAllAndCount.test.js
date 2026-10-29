const { findAllAndCount } = require('../../legalTemplate');
const legalTemplate = require('../../../entities/legalTemplate');
const { Op } = require('sequelize');

jest.mock('../../../entities/legalTemplate');
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn((field, sort) => [[field || 'id', sort || 'DESC']]),
}));

describe('legalTemplate - findAllAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated templates with search applied', async () => {
        const mockData = {
            rows: [
                {
                    id: 1,
                    title: 'NDA Template',
                    category: 'Legal',
                    description: 'Non-disclosure agreement',
                    isActive: true,
                },
            ],
            count: 1,
        };

        legalTemplate.findAndCountAll.mockResolvedValue(mockData);

        const params = {
            page: 1,
            itemsPerPage: 10,
            searchText: 'NDA',
            sort: 'ASC',
            sortField: 'title',
            onlyActive: false,
        };

        const result = await findAllAndCount(params);

        expect(legalTemplate.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                limit: 10,
                offset: 0,
                raw: true,
                nest: true,
            })
        );

        const calledWith = legalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where[Op.or]).toBeDefined();
        expect(result).toEqual(mockData);
    });

    it('should apply isActive filter when onlyActive is true', async () => {
        legalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAllAndCount({
            page: 1,
            itemsPerPage: 10,
            searchText: '',
            sort: 'DESC',
            sortField: 'id',
            onlyActive: true,
        });

        const calledWith = legalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.isActive).toBe(true);
    });

    it('should not apply isActive filter when onlyActive is false', async () => {
        legalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAllAndCount({
            page: 1,
            itemsPerPage: 10,
            searchText: '',
            sort: 'DESC',
            sortField: 'id',
            onlyActive: false,
        });

        const calledWith = legalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.where.isActive).toBeUndefined();
    });

    it('should calculate correct offset for page 2', async () => {
        legalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await findAllAndCount({
            page: 2,
            itemsPerPage: 10,
            searchText: '',
            sort: 'DESC',
            sortField: 'id',
            onlyActive: false,
        });

        const calledWith = legalTemplate.findAndCountAll.mock.calls[0][0];
        expect(calledWith.offset).toBe(10);
    });

    it('should return empty rows and count 0 when no templates match', async () => {
        legalTemplate.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        const result = await findAllAndCount({
            page: 1,
            itemsPerPage: 10,
            searchText: 'NonExistentTemplate',
            sort: 'DESC',
            sortField: 'id',
            onlyActive: false,
        });

        expect(result).toEqual({ rows: [], count: 0 });
    });

    it('should throw { message: "Something went wrong" } on database error', async () => {
        legalTemplate.findAndCountAll.mockRejectedValue(new Error('DB error'));

        await expect(
            findAllAndCount({ page: 1, itemsPerPage: 10, searchText: '', sort: 'DESC', sortField: 'id', onlyActive: false })
        ).rejects.toEqual({ message: 'Something went wrong' });
    });
});
