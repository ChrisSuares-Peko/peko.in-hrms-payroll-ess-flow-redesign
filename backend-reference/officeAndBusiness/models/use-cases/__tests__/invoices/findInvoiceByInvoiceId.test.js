const { findInvoiceByInvoiceId } = require('../../invoices');
const invoice = require('../../../entities/invoices');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoices');

describe('findInvoiceByInvoiceId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return invoice by credentialId and invoiceNo', async () => {
        const mockInvoice = { id: 1, credentialId: 100, invoiceDetails: { invoiceNo: 'INV-001' } };
        invoice.findOne.mockResolvedValue(mockInvoice);

        const result = await findInvoiceByInvoiceId(100, 'INV-001');

        expect(invoice.findOne).toHaveBeenCalledWith({
            where: {
                [Op.and]: [
                    { credentialId: 100 },
                    expect.anything(),
                ],
            },
            attributes: undefined,
        });
        expect(result).toEqual(mockInvoice);
    });

    it('should return null when no invoice found', async () => {
        invoice.findOne.mockResolvedValue(null);

        const result = await findInvoiceByInvoiceId(100, 'INV-999');
        expect(result).toBeNull();
    });

    it('should pass attributes when provided', async () => {
        invoice.findOne.mockResolvedValue({ id: 1 });

        await findInvoiceByInvoiceId(100, 'INV-001', ['id', 'invoiceDetails']);

        expect(invoice.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                attributes: ['id', 'invoiceDetails'],
            })
        );
    });
});
