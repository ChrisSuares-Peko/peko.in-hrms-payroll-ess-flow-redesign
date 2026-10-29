const category = require('../../../entities/category');
const vendors = require('../../../entities/vendor'); // Adjust path if necessary
const { Op } = require('sequelize');
const { findAllCategoryCount } = require('../../category');

jest.mock('../../../entities/category', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllCategoryCount', () => {
    it('should return category count and data successfully', async () => {
        // Mock input params
        const params = {
            start: 0,
            length: 10,
            searchText: 'Electronics',
            order: 'ASC',
            column: 'categoryName'
        };

        // Mock response
        const mockResponse = {
            count: 2,
            rows: [
                { id: 1, categoryName: 'Electronics', vendorName: 'Vendor A' },
                { id: 2, categoryName: 'Electronics', vendorName: 'Vendor B' }
            ]
        };

        // Mock implementation
        category.findAndCountAll.mockResolvedValue(mockResponse);

        // Call function
        const result = await findAllCategoryCount(params);

        // Expectations
        expect(category.findAndCountAll).toHaveBeenCalledTimes(1);
        expect(category.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: vendors,
                as: '',
                attributes: ['vendorName']
            }],
            where: {
                [Op.or]: [
                    { id: { [Op.like]: '%Electronics%' } },
                    { categoryName: { [Op.like]: '%Electronics%' } }
                ]
            },
            order: [['categoryName', 'ASC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true
        });
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors properly', async () => {
        // Mock input params
        const params = {
            start: 0,
            length: 10,
            searchText: 'Electronics',
            order: 'ASC',
            column: 'categoryName'
        };

        // Mock rejection
        category.findAndCountAll.mockRejectedValue(new Error('Database error'));

        // Expect function to throw an error
        await expect(findAllCategoryCount(params)).rejects.toThrow('Database error');

    });
});
