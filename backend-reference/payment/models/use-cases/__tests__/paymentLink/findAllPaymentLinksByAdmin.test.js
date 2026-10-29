const { findAllPaymentLinksByAdmin } = require('../../../use-cases/paymentLink'); // Adjust path
const paymentLinks = require('../../../entities/paymentLink'); 
const { Op } = require('sequelize'); // Make sure you import Op

jest.mock('../../../entities/paymentLink', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllPaymentLinksByAdmin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all admin payment links with pagination and search', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            sort: 'ASC',
            sortField: 'id',
            searchText: '123',
        };
        const mockPaymentLinks = {
            count: 2,
            rows: [
                { id: '12345', status: 'ACTIVE', invoiceId: 'INV-123', credentialId: 1, type: 'ADMIN' },
                { id: '67890', status: 'PENDING', invoiceId: 'INV-456', credentialId: 2, type: 'ADMIN' },
            ],
        };

        paymentLinks.findAndCountAll.mockResolvedValue(mockPaymentLinks);

        const result = await findAllPaymentLinksByAdmin(mockParams);

        const call = paymentLinks.findAndCountAll.mock.calls[0][0];
        expect(call.order).toEqual([['id', 'ASC']]);
        expect(call.limit).toBe(10);
        expect(call.offset).toBe(0);
        expect(call.raw).toBe(true);
        expect(call.nest).toBe(true);
        expect(call.attributes).toBeUndefined();

        // Check the where clause structure
        const andClause = call.where[Op.and];
        expect(andClause).toHaveLength(2);

        // Check search fields in Op.or
        const orClause = andClause[0][Op.or];
        expect(orClause[0]).toEqual({ id: { [Op.like]: '%123%' } });
        expect(orClause[1]).toEqual({ status: { [Op.like]: '%123%' } });
        expect(orClause[2]).toEqual({ paymentLink: { [Op.like]: '%123%' } });
        expect(orClause[3]).toEqual({ amount: { [Op.like]: '%123%' } });
        expect(orClause[4]).toEqual({ invoiceId: { [Op.like]: '%123%' } });
        expect(orClause[5]).toEqual({ credentialId: { [Op.like]: '%123%' } });
        // Last item is a Sequelize.where for sentPayload.full_name
        expect(orClause[6]).toBeDefined();

        // Check type filter
        expect(andClause[1]).toEqual({ type: 'ADMIN' });

        expect(result).toEqual(mockPaymentLinks);
    });

    it('should return all admin payment links without search', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            sort: 'ASC',
            sortField: 'id',
            searchText: '', // No search text
        };
        const mockPaymentLinks = {
            count: 2,
            rows: [
                { id: '12345', status: 'ACTIVE', invoiceId: 'INV-123', credentialId: 1, type: 'ADMIN' },
                { id: '67890', status: 'PENDING', invoiceId: 'INV-456', credentialId: 2, type: 'ADMIN' },
            ],
        };

        paymentLinks.findAndCountAll.mockResolvedValue(mockPaymentLinks);

        const result = await findAllPaymentLinksByAdmin(mockParams);

        expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith({
            where: {
                [Op.and]: [{ type: 'ADMIN' }],
            },
            order: [['id', 'ASC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockPaymentLinks);
    });

    it('should handle cases where no payment links are found', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            sort: 'ASC',
            sortField: 'id',
            searchText: 'nonexistent',
        };
        const mockPaymentLinks = {
            count: 0,
            rows: [],
        };

        paymentLinks.findAndCountAll.mockResolvedValue(mockPaymentLinks);

        const result = await findAllPaymentLinksByAdmin(mockParams);

        expect(paymentLinks.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockPaymentLinks);
    });

    it('should handle errors during database operations', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            sort: 'ASC',
            sortField: 'id',
            searchText: '123',
        };
        const mockError = new Error('Database error');

        paymentLinks.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllPaymentLinksByAdmin(mockParams)).rejects.toThrow(mockError);

        expect(paymentLinks.findAndCountAll).toHaveBeenCalled();
    });

    it('should use default values if params are not provided', async () => {
      const mockPaymentLinks = {
        count: 2,
        rows: [
            { id: '12345', status: 'ACTIVE', invoiceId: 'INV-123', credentialId: 1, type: 'ADMIN' },
            { id: '67890', status: 'PENDING', invoiceId: 'INV-456', credentialId: 2, type: 'ADMIN' },
        ],
    };

    paymentLinks.findAndCountAll.mockResolvedValue(mockPaymentLinks);

      const result = await findAllPaymentLinksByAdmin({}); // No params provided

      
      expect(result).toEqual(mockPaymentLinks);
  });
});