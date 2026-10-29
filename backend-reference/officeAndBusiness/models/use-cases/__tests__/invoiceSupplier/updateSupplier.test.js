const { updateSupplier } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    update: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('updateSupplier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a supplier and return true when records are affected', async () => {
        const mockData = { name: 'Updated Supplier' };
        const mockSupplierCode = 'SUP123';
        const mockResponse = [1]; // 1 row affected

        invoiceSuppliers.update.mockResolvedValue(mockResponse);

        const result = await updateSupplier(mockData, mockSupplierCode);

        expect(invoiceSuppliers.update).toHaveBeenCalledWith(mockData, {
            where: { supplierCode: mockSupplierCode },
        });
        expect(result).toBe(true);
    });

    it('should return false when no records are affected', async () => {
        const mockData = { name: 'Unchanged Supplier' };
        const mockSupplierCode = 'SUP999';
        const mockResponse = [0]; // 0 rows affected

        invoiceSuppliers.update.mockResolvedValue(mockResponse);

        const result = await updateSupplier(mockData, mockSupplierCode);

        expect(result).toBe(false);
    });

    it('should return false when an error occurs', async () => {
        const mockData = { name: 'Error Supplier' };
        const mockSupplierCode = 'SUPERROR';
        const mockError = new Error('Database error');

        invoiceSuppliers.update.mockRejectedValue(mockError);

        const result = await updateSupplier(mockData, mockSupplierCode);

        expect(result).toBe(false);
    });
});
