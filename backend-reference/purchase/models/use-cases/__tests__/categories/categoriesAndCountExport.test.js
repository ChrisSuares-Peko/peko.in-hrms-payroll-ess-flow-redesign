const { categoriesAndCountExport } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const vendors = require('../../../entities/vendor'); 
const { handleSortFields } = require('../../../../utils/sortHandle'); 
const { formattedDateTime } = require('../../../../utils/formatter'); 
const { Op } = require('sequelize');

jest.mock('../../../entities/categories', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));
jest.mock('../../../entities/vendor', () => ({})); 
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));
jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
}));

describe('categoriesAndCountExport function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted category data with pagination, search, and sorting applied', async () => {
        const params = {
            searchText: 'Electronics',
            sort: 'ASC',
            sortField: 'categoryName'
        };
        const type = 'Retail';
        const mockCategories = {
            count: 2,
            rows: [
                {
                    createdAt: new Date('2024-08-12T00:00:00Z'),
                    categoryName: 'Electronics',
                    vendor: { vendorName: 'Vendor A' },
                    categoryStatus: true
                },
                {
                    createdAt: new Date('2024-08-12T00:00:00Z'),
                    categoryName: 'Home Appliances',
                    vendor: { vendorName: 'Vendor B' },
                    categoryStatus: false
                }
            ]
        };
        const formattedDate = '12-Aug-2024'; 
        const finalData = [
            {
                Date: formattedDate,
                'Category Name': 'Electronics',
                'Vendor Name': 'Vendor A',
                Status: 'Active'
            },
            {
                Date: formattedDate,
                'Category Name': 'Home Appliances',
                'Vendor Name': 'Vendor B',
                Status: 'In Active'
            }
        ];

        
        handleSortFields.mockReturnValue(['categoryName', 'ASC']);
        formattedDateTime.mockReturnValue(formattedDate);
        categories.findAndCountAll.mockResolvedValue(mockCategories);

        const result = await categoriesAndCountExport(params, type);

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
              '$vendor.type$': type
            },
            order: ['categoryName', 'ASC'],
            raw: true,
            nest: true
          });
          
        expect(result).toEqual(finalData);
    });

    it('should handle errors and throw a custom error message', async () => {
        const params = {
            searchText: 'Electronics',
            sort: 'ASC',
            sortField: 'categoryName'
        };
        const type = 'Retail';
        const errorMessage = 'Database query failed';

        // Mock implementation
        categories.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(categoriesAndCountExport(params, type)).rejects.toEqual({ message: 'Something went wrong' });
    });
});
