const { findAllPaymentLinks } = require('../../../use-cases/paymentLink');
const paymentLinks = require('../../../entities/paymentLink');
const Invoice = require('../../../entities/invoices');


jest.mock('../../../entities/paymentLink', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/invoices', () => ({
    findAll: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllPaymentLinks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated payment links with invoice numbers', async () => {
        const mockPaymentLinksData = {
            count: 2,
            rows: [
                { id: 1, paymentLink: 'link1', amount: 100, status: 'PAID' },
                { id: 2, paymentLink: 'link2', amount: 200, status: 'PENDING' },
            ],
        };
        const mockInvoices = [
            { paymentLink: 'link1', invoiceDetails: JSON.stringify({ invoiceNo: 'INV001' }) },
            { paymentLink: 'link2', invoiceDetails: JSON.stringify({ invoiceNo: 'INV002' }) },
        ];

        paymentLinks.findAndCountAll.mockResolvedValue(mockPaymentLinksData);
        Invoice.findAll.mockResolvedValue(mockInvoices);

        const result = await findAllPaymentLinks({
            limit: 10,
            offset: 0,
            sort: 'ASC',
            sortField: 'amount',
            corporateId: 123,
        });

        expect(result.count).toBe(2);
        expect(result.rows[0].invoiceNo).toBe('INV001');
        expect(result.rows[1].invoiceNo).toBe('INV002');
    });

    it('should return an empty result when no matching payment links are found', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'DESC', sortField: 'status', corporateId: 456 };
        paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
        Invoice.findAll.mockResolvedValue([]);

        const result = await findAllPaymentLinks(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { limit: 10, offset: 0, sort: 'ASC', sortField: 'amount' };
        const mockError = new Error('Database error');

        paymentLinks.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await findAllPaymentLinks(mockParams);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(result).toBe(false);
    });
});
