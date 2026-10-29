const { getAllInvoiceCustomersByUserId } = require("../../invoiceCustomer");
const InvoiceCustomer = require("../../../entities/invoiceCustomer");

jest.mock('../../../entities/invoiceCustomer', () => ({
  findOne: jest.fn(),
  hasOne: jest.fn(),
}));

describe('getAllInvoiceCustomersByUserId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return invoice customers with credentials for a valid user ID', async () => {
        const mockInvoiceCustomer = {
            id: 1,
            name: 'Test Customer',
            credentials: {
                name: 'Credential Name',
                username: 'Credential Username',
            },
        };

        // Mock the response from InvoiceCustomer.findOne
        InvoiceCustomer.findOne.mockResolvedValue(mockInvoiceCustomer);

        const params = { id: 1 };

        const result = await getAllInvoiceCustomersByUserId(params);

        // Check if InvoiceCustomer.findOne was called with the correct arguments
        expect(InvoiceCustomer.findOne).toHaveBeenCalledWith({
            where: { id: params.id },
            include: [
                {
                    model: expect.anything(),
                    attributes: ['name', 'username'],
                },
            ],
        });

        // Validate the returned result
        expect(result).toEqual(mockInvoiceCustomer);
    });

    it('should return an empty array if no invoice customer is found', async () => {
        // Mock the response to return null
        InvoiceCustomer.findOne.mockResolvedValue(null);

        const params = { id: 2 };

        const result = await getAllInvoiceCustomersByUserId(params);

        // Check if InvoiceCustomer.findOne was called with the correct arguments
        expect(InvoiceCustomer.findOne).toHaveBeenCalledWith({
            where: { id: params.id },
            include: [
                {
                    model: expect.anything(),
                    attributes: ['name', 'username'],
                },
            ],
        });

        // Validate the returned result
        expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('Database error');
        InvoiceCustomer.findOne.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const params = { id: 3 };

        await expect(getAllInvoiceCustomersByUserId(params)).rejects.toThrow(error);

        consoleSpy.mockRestore();
    });
});
