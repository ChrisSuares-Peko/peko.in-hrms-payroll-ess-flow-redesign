const { createOrUpdateSupplier } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('createOrUpdateSupplier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update an existing supplier and return true', async () => {
        const mockParams = { corporateUserId: 123, agreementDetails: { document: 'doc123' } };
        const mockExistingSupplier = { id: 1, corporateUserId: 123 };

        invoiceSuppliers.findOne.mockResolvedValue(mockExistingSupplier);
        invoiceSuppliers.update.mockResolvedValue([1]); // 1 row affected

        const result = await createOrUpdateSupplier(mockParams);

        expect(invoiceSuppliers.findOne).toHaveBeenCalledWith({ where: { corporateUserId: mockParams.corporateUserId } });
        expect(invoiceSuppliers.update).toHaveBeenCalledWith(
            { agreementDetails: mockParams.agreementDetails },
            { where: { corporateUserId: mockParams.corporateUserId } }
        );
        expect(result).toBe(true);
    });

    it('should create a new supplier when none exists', async () => {
        const mockParams = { corporateUserId: 456, agreementDetails: { document: 'doc456' } };
        const mockNewSupplier = { id: 2, ...mockParams };

        invoiceSuppliers.findOne.mockResolvedValue(null);
        invoiceSuppliers.create.mockResolvedValue(mockNewSupplier);

        const result = await createOrUpdateSupplier(mockParams);

        expect(invoiceSuppliers.findOne).toHaveBeenCalledWith({ where: { corporateUserId: mockParams.corporateUserId } });
        expect(invoiceSuppliers.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockNewSupplier);
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { corporateUserId: 789, agreementDetails: { document: 'errorDoc' } };
        const mockError = new Error('Database error');

        invoiceSuppliers.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await createOrUpdateSupplier(mockParams);

        expect(console.error).toHaveBeenCalledWith('Error creating or updating supplier:', mockError);
        expect(result).toBe(false);
    });
});
