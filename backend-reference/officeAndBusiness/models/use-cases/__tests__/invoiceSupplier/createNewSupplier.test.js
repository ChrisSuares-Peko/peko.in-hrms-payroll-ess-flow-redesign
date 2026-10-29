const { createNewSupplier } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    create: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('createNewSupplier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new supplier and return the created object', async () => {
        const mockParams = { name: 'Test Supplier', email: 'test@supplier.com' };
        const mockResponse = { id: 1, ...mockParams };

        invoiceSuppliers.create.mockResolvedValue(mockResponse);

        const result = await createNewSupplier(mockParams);

        expect(invoiceSuppliers.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResponse);
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { name: 'Error Supplier' };
        const mockError = new Error('Database error');

        invoiceSuppliers.create.mockRejectedValue(mockError);

        const result = await createNewSupplier(mockParams);

        expect(result).toBe(false);
    });
});
