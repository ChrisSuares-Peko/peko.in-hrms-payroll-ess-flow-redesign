const { update } = require('../../../use-cases/invoiceGuideline');
const invoiceGuideline = require('../../../entities/invoiceGuideline');

jest.mock('../../../entities/invoiceGuideline', () => ({
    update: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update an invoice guideline and return response data', async () => {
        const mockData = { name: 'Updated Name' };
        const mockParams = { id: 123 };
        const mockResponse = [1];

        invoiceGuideline.update.mockResolvedValue(mockResponse);

        const result = await update(mockData, mockParams);

        expect(invoiceGuideline.update).toHaveBeenCalledWith(mockData, {
            where: { id: mockParams.id },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return false if update fails or returns an empty response', async () => {
        const mockData = { name: 'New Name' };
        const mockParams = { id: 456 };
        invoiceGuideline.update.mockResolvedValue(null);

        const result = await update(mockData, mockParams);

        expect(result).toBe(false);
    });

    it('should throw an error if update operation fails', async () => {
        const mockData = { name: 'Error Name' };
        const mockParams = { id: 789 };
        const mockError = new Error('Database error');

        invoiceGuideline.update.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(update(mockData, mockParams)).rejects.toThrow('Database error');
    });
});
