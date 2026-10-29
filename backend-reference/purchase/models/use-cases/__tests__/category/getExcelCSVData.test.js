const category = require('../../../entities/category');
const { getExcelCSVData } = require('../../category');

jest.mock('../../../entities/category', () => ({
    findAll: jest.fn(),
}));

describe('getExcelCSVData', () => {
    it('should return formatted category data successfully', async () => {
        // Mock response from database
        const mockData = [
            { id: 1, categoryName: 'Electronics', categoryImage: 'image1.jpg', categoryStatus: 'Active' },
            { id: 2, categoryName: null, categoryImage: null, categoryStatus: null }
        ];

        // Expected formatted data
        const expectedData = [
            { 'ID': 1, 'Category Name': 'Electronics', 'Category Status': 'Active', 'Category Image': 'image1.jpg' },
            { 'ID': 2, 'Category Name': 'Not Available', 'Category Status': 'Not AVailable', 'Category Image': 'Not Available' }
        ];

        // Mock implementation
        category.findAll.mockResolvedValue(mockData);

        // Call function
        const result = await getExcelCSVData();

        // Expectations
        expect(category.findAll).toHaveBeenCalledTimes(1);
        expect(category.findAll).toHaveBeenCalledWith({
            attributes: ['id', 'categoryName', 'categoryImage', 'categoryStatus'],
            order: [['createdAt', 'DESC']],
            raw: true
        });
        expect(result).toEqual(expectedData);
    });

    it('should handle errors properly', async () => {
        // Mock rejection
        const mockError = new Error('Database error');
        category.findAll.mockRejectedValue(mockError);

        // Expect function to throw an error
        await expect(getExcelCSVData()).rejects.toThrow('Database error');
    });
});
