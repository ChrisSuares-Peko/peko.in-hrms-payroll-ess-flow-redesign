const { getExcelCSVData } = require('../../categories'); 
const categories = require('../../../entities/categories'); 
const vendors = require('../../../entities/vendor'); 

jest.mock('../../../entities/categories', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));

    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

jest.mock('../../../entities/vendor', () => ({
    // Mock any required methods from vendors if needed
}));

describe('getExcelCSVData function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch data and format it for CSV/Excel', async () => {
        const mockData = [
            {
                id: 1,
                categoryName: 'Electronics',
                categoryStatus: true,
                categoryImage: 'https://example.com/image.jpg',
                vendor: {
                    vendorName: 'Vendor A',
                },
            },
            {
                id: 2,
                categoryName: 'Books',
                categoryStatus: false,
                categoryImage: null,
                vendor: {
                    vendorName: null,
                },
            },
        ];

        const formattedData = [
            {
                ID: 1,
                'Category Name': 'Electronics',
                Status: 'Active',
                'Category Image': 'https://example.com/image.jpg',
                'Vendor Name': 'Vendor A',
            },
            {
                ID: 2,
                'Category Name': 'Books',
                Status: 'Inactive',
                'Category Image': 'Not Available',
                'Vendor Name': 'Not Available',
            },
        ];

        // Mock implementation
        categories.findAll.mockResolvedValue(mockData);

        const result = await getExcelCSVData();

        expect(categories.findAll).toHaveBeenCalledWith({
            include: expect.arrayContaining([
                expect.objectContaining({
                    model: vendors,
                    attributes: ['vendorName'],
                }),
            ]),
            attributes: ['id', 'categoryName', 'categoryStatus', 'categoryImage'],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(formattedData);
    });


    it('should handle empty data', async () => {
        const mockData = [];
        const formattedData = [];

        // Mock implementation
        categories.findAll.mockResolvedValue(mockData);

        const result = await getExcelCSVData();

        expect(categories.findAll).toHaveBeenCalledWith({
            include: expect.arrayContaining([
                expect.objectContaining({
                    model: vendors,
                    attributes: ['vendorName'],
                }),
            ]),
            attributes: ['id', 'categoryName', 'categoryStatus', 'categoryImage'],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(formattedData);
    });

    it('should handle errors from the database query', async () => {
        const errorMessage = 'Database query failed';

        // Mock implementation
        categories.findAll.mockRejectedValue(new Error(errorMessage));

        await expect(getExcelCSVData()).rejects.toThrow(errorMessage);
    });
});
