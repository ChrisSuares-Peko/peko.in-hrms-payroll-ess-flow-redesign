
const { fetchCounts } = require('../../products'); 
const product = require('../../../entities/products'); 
const category = require('../../../entities/categories'); 
const { Op } = require('sequelize');

// Mock the product model
jest.mock('../../../entities/products', () => ({
    findAndCountAll: jest.fn(),
}));

describe('fetchCounts function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return counts of products excluding those in the "Subscriptions" category', async () => {
        // Mock values
        const mockCountsData = {
            count: 10,
            rows: [
                { id: 1, categoryName: 'Electronics' },
                { id: 2, categoryName: 'Furniture' }
            ]
        };

        // Mock implementation
        product.findAndCountAll.mockResolvedValue(mockCountsData);

        const result = await fetchCounts();

        expect(product.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: category,
                as: '',
                attributes: ['categoryName']
            }],
            where: {
                [Op.and]: {
                    '$category.categoryName$': {
                        [Op.not]: 'Subscriptions'
                    }
                }
            },
            raw: true,
            nest: true,
            distinct: true,
            count: {
                col: 'id'
            }
        });
        expect(result).toEqual(mockCountsData);
    });

    it('should handle cases where no products are found', async () => {
        // Mock values
        const mockCountsData = {
            count: 0,
            rows: []
        };

        // Mock implementation
        product.findAndCountAll.mockResolvedValue(mockCountsData);

        const result = await fetchCounts();

        expect(product.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: category,
                as: '',
                attributes: ['categoryName']
            }],
            where: {
                [Op.and]: {
                    '$category.categoryName$': {
                        [Op.not]: 'Subscriptions'
                    }
                }
            },
            raw: true,
            nest: true,
            distinct: true,
            count: {
                col: 'id'
            }
        });
        expect(result).toEqual(mockCountsData);
    });

    it('should handle errors thrown by the product model', async () => {
        // Mock values
        const errorMessage = 'Database error';

        // Mock implementation
        product.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(fetchCounts()).rejects.toThrow(errorMessage);

        expect(product.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: category,
                as: '',
                attributes: ['categoryName']
            }],
            where: {
                [Op.and]: {
                    '$category.categoryName$': {
                        [Op.not]: 'Subscriptions'
                    }
                }
            },
            raw: true,
            nest: true,
            distinct: true,
            count: {
                col: 'id'
            }
        });
    });
});
