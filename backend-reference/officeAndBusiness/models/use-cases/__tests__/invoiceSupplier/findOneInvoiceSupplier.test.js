const { findOneInvoiceSupplier } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findOneInvoiceSupplier', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an invoice supplier when found', async () => {
        const mockParams = { corporateUserId: 123 };
        const mockInvoiceSupplier = {
            id: 1,
            supplierEmail: 'supplier@test.com',
            kybStatus: 'Verified',
            rejectReason: null,
            agreementDetails: 'Agreement Info',
            corporateUser: {
                id: 123,
                credentialId: 456,
                name: 'Test User',
                email: 'user@test.com',
                mobileNo: '1234567890',
                credential: {},
            },
        };

        invoiceSuppliers.findOne.mockResolvedValue(mockInvoiceSupplier);

        const result = await findOneInvoiceSupplier(mockParams);

        expect(invoiceSuppliers.findOne).toHaveBeenCalledWith({
            include: [{
                model: corporateUser,
                attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                include: [{
                    model: credential,
                }],
            }],
            where: {
                corporateUserId: mockParams.corporateUserId,
            },
            attributes: ['id', 'supplierEmail', 'kybStatus', 'rejectReason', 'agreementDetails', 'businessType'],
            nest: true,
        });
        expect(result).toEqual(mockInvoiceSupplier);
    });

    it('should return false if no invoice supplier is found', async () => {
        const mockParams = { corporateUserId: 999 };
        invoiceSuppliers.findOne.mockResolvedValue(null);

        const result = await findOneInvoiceSupplier(mockParams);

        expect(result).toBe(null);
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { corporateUserId: 789 };
        const mockError = new Error('Database error');

        invoiceSuppliers.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await findOneInvoiceSupplier(mockParams);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(result).toBe(false);
    });
});
