const { updateSupplierStatus } = require('../../invoiceSupplier');
const CorporateUser = require('../../../entities/corporateUser');
const Credential = require('../../../entities/credential');
const InvoiceSuppliers = require('../../../entities/invoiceSuppliers');
jest.mock('../../../entities/invoiceSuppliers');

describe('updateSupplierStatus', () => {
    const params = {
        corporateId: 123,
        kybStatus: 'approved',
        rejectReason: 'All good',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the supplier status and return updated data', async () => {
        const mockUpdatedRow = {
            id: 1,
            corporateUser: {
                id: 123,
                credentialId: 456,
                name: 'Test Corp',
                email: 'test@example.com',
                mobileNo: '1234567890',
                credential: {
                    id: 456,
                    username: 'testuser',
                },
            },
        };

        InvoiceSuppliers.update.mockResolvedValue([1]);
        InvoiceSuppliers.findOne.mockResolvedValue(mockUpdatedRow);

        const result = await updateSupplierStatus(params);

        expect(InvoiceSuppliers.update).toHaveBeenCalledWith(
            {
                kybStatus: 'approved',
                rejectReason: 'All good',
            },
            {
                where: { corporateUserId: 123 },
            }
        );

        expect(InvoiceSuppliers.findOne).toHaveBeenCalledWith({
            include: [
                {
                    model: CorporateUser,
                    attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                    include: [
                        {
                            model: Credential,
                        },
                    ],
                },
            ],
            where: { corporateUserId: 123 },
            nest: true,
        });

        expect(result).toEqual({
            isUpdated: true,
            supplierData: mockUpdatedRow,
        });
    });

    it('should return isUpdated as false if no rows are affected', async () => {
        InvoiceSuppliers.update.mockResolvedValue([0]);
        InvoiceSuppliers.findOne.mockResolvedValue(null);

        const result = await updateSupplierStatus(params);

        expect(result).toEqual({
            isUpdated: false,
            supplierData: null,
        });
    });

    it('should return false if an error occurs', async () => {
        const mockError = new Error('Database error');
        InvoiceSuppliers.update.mockRejectedValue(mockError);

        const result = await updateSupplierStatus(params);

        expect(result).toBe(false);
    });
});
