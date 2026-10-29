const { findAllCategories } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const vendors = require('../../../entities/vendor'); 
const { handleSortFields } = require('../../../../utils/sortHandle'); 
const { Op } = require('sequelize');

jest.mock('../../../entities/categories', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () =>({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/vendor', () => ({})); 
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));
jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
}));

describe('findAllCategories function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return categories with pagination, search, and sorting applied', async () => {
        const params = {
            limit: 10,
            offset: 0,
            searchText: 'Electronics',
            sort: 'ASC',
            sortField: 'categoryName'
        };
        const type = 'Retail';
        const mockCategories = {
            count: 2,
            rows: [
                { id: 1, categoryName: 'Electronics', vendorName: 'Vendor A', vendorType: 'Retail' },
                { id: 2, categoryName: 'Home Appliances', vendorName: 'Vendor B', vendorType: 'Retail' }
            ]
        };

        // Mock implementations
        handleSortFields.mockReturnValue(['categoryName', 'ASC']);
        categories.findAndCountAll.mockResolvedValue(mockCategories);

        const result = await findAllCategories(params, type);

        expect(handleSortFields).toHaveBeenCalledWith(params.sortField, params.sort);
        expect(categories.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName', 'type']
            }],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%' + params.searchText + '%' } },
                    { categoryName: { [Op.like]: '%' + params.searchText + '%' } },
                    { '$vendor.vendorName$': { [Op.like]: '%' + params.searchText + '%' } }
                ],
                [Op.or]: [
                    { id: { [Op.like]: '%' + params.searchText + '%' } },
                    { categoryName: { [Op.like]: '%' + params.searchText + '%' } },
                    { '$vendor.vendorName$': { [Op.like]: '%' + params.searchText + '%' } }
                ],
                '$vendor.type$': type
            },
            order: ['categoryName', 'ASC'],
            limit: params.limit,
            offset: params.offset,
            raw: true,
            nest: true
        });
        expect(result).toEqual(mockCategories);
    });

    it('should handle errors and throw a custom error message', async () => {
        const params = {
          limit: 10,
          offset: 0,
          searchText: 'Electronics',
          sort: 'ASC',
          sortField: 'categoryName',
        };
        const type = 'Retail';
        const errorMessage = 'Database query failed';
      
        // Force the findAndCountAll call to return a rejected promise.
        categories.findAndCountAll.mockRejectedValue(new Error(errorMessage));
      
        await expect(findAllCategories(params, type)).rejects.toEqual({ message: 'Something went wrong' });
      });
      
    
});
