const { findAllInvoiceAndCount } = require('../../../use-cases/invoices');
const invoice = require('../../../entities/invoices');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoices', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllInvoiceAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch invoices and count with the correct filters and sort order', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            from: '2023-01-01',
            to: '2023-01-31',
            sort: 'ASC',
            searchText: 'test',
            column: 'createdAt',
        };

        const tomorrow = new Date('2023-01-31');
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const mockResult = {
            rows: [
                {
                    id: 1,
                    recipientDetails: 'Recipient A',
                    invoiceDetails: 'Invoice A',
                },
                {
                    id: 2,
                    recipientDetails: 'Recipient B',
                    invoiceDetails: 'Invoice B',
                },
            ],
            count: 2,
        };

        invoice.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllInvoiceAndCount(mockParams);

        expect(invoice.findAndCountAll).toHaveBeenCalledWith({
            where: {
                createdAt: {
                    [Op.between]: ['2023-01-01', tomorrow],
                },
                [Op.or]: [
                    { id: { [Op.like]: '%test%' } },
                    { recipientDetails: { [Op.like]: '%test%' } },
                    { invoiceDetails: { [Op.like]: '%test%' } },
                    { productDetails: { [Op.like]: '%test%' } },
                    { paymentDetails: { [Op.like]: '%test%' } },
                    { comments: { [Op.like]: '%test%' } },
                    { termsConditions: { [Op.like]: '%test%' } },
                    { paymentMode: { [Op.like]: '%test%' } },
                ],
            },
            order: [['createdAt', 'ASC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return an empty result if no invoices are found', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            from: '2023-01-01',
            to: '2023-01-31',
            sort: 'ASC',
            searchText: 'nonexistent',
            column: 'createdAt',
        };

        const tomorrow = new Date('2023-01-31');
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const mockResult = { rows: [], count: 0 };

        invoice.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllInvoiceAndCount(mockParams);

        expect(invoice.findAndCountAll).toHaveBeenCalledWith({
            where: {
                createdAt: {
                    [Op.between]: ['2023-01-01', tomorrow],
                },
                [Op.or]: [
                    { id: { [Op.like]: '%nonexistent%' } },
                    { recipientDetails: { [Op.like]: '%nonexistent%' } },
                    { invoiceDetails: { [Op.like]: '%nonexistent%' } },
                    { productDetails: { [Op.like]: '%nonexistent%' } },
                    { paymentDetails: { [Op.like]: '%nonexistent%' } },
                    { comments: { [Op.like]: '%nonexistent%' } },
                    { termsConditions: { [Op.like]: '%nonexistent%' } },
                    { paymentMode: { [Op.like]: '%nonexistent%' } },
                ],
            },
            order: [['createdAt', 'ASC']],
            limit: 10,
            offset: 0,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should throw an error if the database query fails', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            from: '2023-01-01',
            to: '2023-01-31',
            sort: 'ASC',
            searchText: 'test',
            column: 'createdAt',
        };

        const mockError = new Error('Database error');

        invoice.findAndCountAll.mockRejectedValue(mockError);

        await expect(findAllInvoiceAndCount(mockParams)).rejects.toThrow('Database error');

        expect(invoice.findAndCountAll).toHaveBeenCalledTimes(1);
    });
});
