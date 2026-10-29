const { findSupplierByCorporateUserId } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findSupplierByCorporateUserId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the supplier when found', async () => {
        const mockCorporateUserId = 123;
        const mockSupplier = { id: 1, corporateUserId: 123, name: 'Test Supplier' };

        invoiceSuppliers.findOne.mockResolvedValue(mockSupplier);

        const result = await findSupplierByCorporateUserId(mockCorporateUserId);

        expect(invoiceSuppliers.findOne).toHaveBeenCalledWith({ where: { corporateUserId: mockCorporateUserId } });
        expect(result).toEqual(mockSupplier);
    });

    it('should return null when no supplier is found', async () => {
        const mockCorporateUserId = 456;
        invoiceSuppliers.findOne.mockResolvedValue(null);

        const result = await findSupplierByCorporateUserId(mockCorporateUserId);

        expect(result).toBeNull();
    });

    it('should return null and log an error when an exception occurs', async () => {
        const mockCorporateUserId = 789;
        const mockError = new Error('Database error');

        invoiceSuppliers.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findSupplierByCorporateUserId(mockCorporateUserId);

        expect(console.error).toHaveBeenCalledWith('Error finding supplier by corporateUserId:', mockError);
        expect(result).toBeNull();
    });
});
