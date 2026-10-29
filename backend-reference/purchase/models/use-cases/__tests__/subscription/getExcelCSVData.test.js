const { getExcelCSVData } = require('../../../use-cases/subscriptions');
const product = require('../../../entities/products');

jest.mock('../../../entities/products', () => ({
    findAll: jest.fn(),
}));

describe('getExcelCSVData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted CSV data for subscription products', async () => {
        const mockData = [
            {
                Id: 1,
                name: 'Subscription Plan A',
                description: 'Monthly Plan',
                highlights: 'Includes premium features',
                price: 100,
                quantity: 50,
                status: true,
                category: { categoryName: 'Subscriptions' }
            },
            {
                Id: 2,
                name: 'Subscription Plan B',
                description: 'Yearly Plan',
                highlights: 'Includes exclusive content',
                price: 500,
                quantity: 20,
                status: false,
                category: { categoryName: 'Subscriptions' }
            }
        ];

        const expectedFinalData = [
            {
                'Product Code': 1,
                'Product Name': 'Subscription Plan A',
                'Description': 'Monthly Plan',
                'Includes': 'Includes premium features',
                'Price': '100INR',
                'Quantity': 50,
                'Status': 'Available',
            },
            {
                'Product Code': 2,
                'Product Name': 'Subscription Plan B',
                'Description': 'Yearly Plan',
                'Includes': 'Includes exclusive content',
                'Price': '500INR',
                'Quantity': 20,
                'Status': 'Not Available',
            }
        ];

        product.findAll.mockResolvedValue(mockData);

        const result = await getExcelCSVData();

      
        expect(result).toEqual(expectedFinalData);
    });

    it('should return an empty array if no subscription products exist', async () => {
        product.findAll.mockResolvedValue([]);

        const result = await getExcelCSVData();

        expect(result).toEqual([]);
    });

    it('should handle errors if database query fails', async () => {
        const mockError = new Error('Database error');

        product.findAll.mockRejectedValue(mockError);

        await expect(getExcelCSVData()).rejects.toThrow('Database error');
    });
});