const { updateOneInvoiceSupplier } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    update: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('updateOneInvoiceSupplier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update an invoice supplier and return the updated record', async () => {
        const mockParams = { supplierCode: 'SUP123', rejectReason: 'Invalid documents', status: 'REJECTED' };
        const mockUpdatedSupplier = {
            id: 1,
            supplierCode: 'SUP123',
            kybStatus: 'REJECTED',
            rejectReason: 'Invalid documents',
            corporateUser: {
                id: 10,
                credentialId: 20,
                name: 'Test User',
                email: 'test@user.com',
                mobileNo: '1234567890',
                credential: {},
            },
        };

        invoiceSuppliers.update.mockResolvedValue([1]); // 1 row affected
        invoiceSuppliers.findOne.mockResolvedValue(mockUpdatedSupplier);

        const result = await updateOneInvoiceSupplier(mockParams);

        expect(invoiceSuppliers.update).toHaveBeenCalledWith({
            kybStatus: mockParams.status,
            rejectReason: mockParams.rejectReason,
        }, {
            where: { supplierCode: mockParams.supplierCode },
        });

        expect(invoiceSuppliers.findOne).toHaveBeenCalledWith({
            include: [{
                model: corporateUser,
                attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                include: [{ model: credential }],
            }],
            where: { supplierCode: mockParams.supplierCode },
            nest: true,
        });
        expect(result).toEqual(mockUpdatedSupplier);
    });

    it('should return null if no records are affected', async () => {
        const mockParams = { supplierCode: 'SUP456', rejectReason: 'Invalid details', status: 'REJECTED' };
        invoiceSuppliers.update.mockResolvedValue([0]); // 0 rows affected

        const result = await updateOneInvoiceSupplier(mockParams);

        expect(result).toBeNull();
    });

    it('should throw an error when update operation fails', async () => {
        const mockParams = { supplierCode: 'SUP789', rejectReason: 'Error case', status: 'REJECTED' };
        const mockError = new Error('Database error');

        invoiceSuppliers.update.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(updateOneInvoiceSupplier(mockParams)).rejects.toThrow('Database error');
    });
});
