const { findAllInvoiceSuppliers } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');
const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['supplierEmail', 'ASC']])
}));


describe('findAllInvoiceSuppliers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated invoice suppliers when called with valid parameters', async () => {
        const mockParams = {
            page: 1,
            itemsPerPage: 10,
            searchText: 'test',
            sort: 'ASC',
            sortField: 'supplierEmail',
        };
        const mockData = { count: 2, rows: [{ id: 1, supplierEmail: 'test@supplier.com', kybStatus: 'Verified' }] };

        handleSortFields.mockReturnValue([['supplierEmail', 'ASC']]);
        invoiceSuppliers.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAllInvoiceSuppliers(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(invoiceSuppliers.findAndCountAll).toHaveBeenCalledWith({
            include: [{
                model: corporateUser,
                attributes: ['id', 'name', 'mobileNo', 'credentialId'],
                include: [{
                    model: credential,
                    attributes: ['id', 'username'],
                }],
            }],
            where: expect.objectContaining({
                [Op.or]: expect.any(Array),
            }),
            order: [['supplierEmail', 'ASC']],
            limit: mockParams.itemsPerPage,
            offset: (mockParams.page - 1) * mockParams.itemsPerPage,
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no matching invoice suppliers are found', async () => {
        const mockParams = { page: 1, itemsPerPage: 10, searchText: 'nonexistent', sort: 'DESC', sortField: 'kybStatus' };
        invoiceSuppliers.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllInvoiceSuppliers(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { page: 1, itemsPerPage: 10, searchText: 'error', sort: 'ASC', sortField: 'eSignStatus' };
        const mockError = new Error('Database error');

        invoiceSuppliers.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await findAllInvoiceSuppliers(mockParams);

        expect(console.log).toHaveBeenCalledWith({ error: mockError });
        expect(result).toBe(false);
    });
});
