const invoice = require('../../../entities/invoices');
const { findAllInvoiceAndCount } = require('../../../use-cases/invoices');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoices', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllInvoiceAndCount service', () => {
    it('should return invoice data when findAndCountAll is successful', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31'),
            sort: 'ASC',
            searchText: 'test',
            column: 'createdAt',
        };

        const mockData = {
            rows: [
                {
                    id: 1,
                    recipientDetails: 'John Doe',
                    invoiceDetails: 'Invoice #001',
                    createdAt: new Date('2024-01-15'),
                },
                {
                    id: 2,
                    recipientDetails: 'Jane Doe',
                    invoiceDetails: 'Invoice #002',
                    createdAt: new Date('2024-01-20'),
                },
            ],
            count: 2,
        };

        invoice.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAllInvoiceAndCount(mockParams);

        // Validate function call
        const tomorrow = new Date(mockParams.to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        expect(invoice.findAndCountAll).toHaveBeenCalledWith({
            where: {
                createdAt: { [Op.between]: [mockParams.from, tomorrow] },
                [Op.or]: [
                    { id: { [Op.like]: `%${mockParams.searchText}%` } },
                    { recipientDetails: { [Op.like]: `%${mockParams.searchText}%` } },
                    { invoiceDetails: { [Op.like]: `%${mockParams.searchText}%` } },
                    { productDetails: { [Op.like]: `%${mockParams.searchText}%` } },
                    { paymentDetails: { [Op.like]: `%${mockParams.searchText}%` } },
                    { comments: { [Op.like]: `%${mockParams.searchText}%` } },
                    { termsConditions: { [Op.like]: `%${mockParams.searchText}%` } },
                    { paymentMode: { [Op.like]: `%${mockParams.searchText}%` } },
                ],
            },
            order: [[mockParams.column, mockParams.sort]],
            limit: mockParams.limit,
            offset: mockParams.offset,
            raw: true,
            nest: true,
        });

        // Validate response
        expect(result).toEqual(mockData);
    });

    it('should throw an error when findAndCountAll fails', async () => {
        const mockParams = {
            limit: 10,
            offset: 0,
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31'),
            sort: 'ASC',
            searchText: 'error',
            column: 'createdAt',
        };

        invoice.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await expect(findAllInvoiceAndCount(mockParams)).rejects.toThrow('Database error');
    });
});
