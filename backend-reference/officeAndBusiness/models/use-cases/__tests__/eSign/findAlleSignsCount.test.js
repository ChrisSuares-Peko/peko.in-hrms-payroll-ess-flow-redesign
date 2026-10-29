const { findAlleSignsCount } = require('../../../use-cases/eSign');
const eSign = require('../../../entities/eSign');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/eSign', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['docket_title', 'ASC']]), // Ensure it returns a function
}));


describe('findAlleSignsCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return eSign data when called with valid parameters', async () => {
        const mockParams = {
            page: 1,
            itemsPerPage: 10,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'docket_title',
            corporateId: 123,
        };
        const mockAttributes = ['id', 'docket_title', 'status'];
        const mockData = { count: 2, rows: [{ id: 1, docket_title: 'Test Docket', status: 'Pending' }] };

        handleSortFields.mockReturnValue([['docket_title', 'ASC']]);
        eSign.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAlleSignsCount(mockParams, mockAttributes);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(eSign.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: credential,
                attributes: ['name', 'username'],
            }],
            attributes: mockAttributes,
            where: expect.objectContaining({
                [Op.or]: expect.any(Array),
                credentialId: mockParams.corporateId,
            }),
            order: [['docket_title', 'ASC']],
            limit: mockParams.itemsPerPage,
            offset: (mockParams.page - 1) * mockParams.itemsPerPage,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no matching eSign records are found', async () => {
        const mockParams = { page: 1, itemsPerPage: 10, searchText: 'nonexistent', sort: 'DESC', sortField: 'status', corporateId: 456 };
        eSign.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAlleSignsCount(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error when findAndCountAll fails', async () => {
        const mockParams = { page: 1, itemsPerPage: 10, searchText: 'error', sort: 'ASC', sortField: 'status' };
        const mockError = new Error('Database error');

        eSign.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findAlleSignsCount(mockParams)).rejects.toEqual({ message: 'Something went wrong' });
        expect(console.log).toHaveBeenCalledWith(mockError);
    });
});
