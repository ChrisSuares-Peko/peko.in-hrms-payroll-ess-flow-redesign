const { collectorKybExport } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');

const {handleSortFields} = require('../../../../utils/sortHandle');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(() => [['supplierCode', 'ASC']]),
}));

jest.mock('../../../../utils/formatter', () => jest.fn((date) => date.toISOString()));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('collectorKybExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted invoice supplier data when called with valid parameters', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'supplierCode',
        };
        const mockData = {
            count: 2,
            rows: [
                {
                    createdAt: new Date('2024-01-01T12:00:00Z'),
                    supplierCode: 'SUP123',
                    supplierEmail: 'supplier@test.com',
                    kybStatus: 'Verified',
                    corporateUser: {
                        name: 'Test Corp',
                        mobileNo: '1234567890',
                        credential: {
                            username: 'corp_user',
                        },
                    },
                },
            ],
        };

        handleSortFields.mockReturnValue([['supplierCode', 'ASC']]);
        invoiceSuppliers.findAndCountAll.mockResolvedValue(mockData);

        const result = await collectorKybExport(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(invoiceSuppliers.findAndCountAll).toHaveBeenCalledWith({
            include: expect.any(Array),
            where: expect.any(Object),
            order: [['supplierCode', 'ASC']],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(false);
    });

    it('should return an empty array when no matching suppliers are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'kybStatus' };
        invoiceSuppliers.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await collectorKybExport(mockParams);

        expect(result).toEqual([]);
    });

    it('should return false when an error occurs', async () => {
        const mockParams = { searchText: 'error', sort: 'ASC', sortField: 'supplierCode' };
        const mockError = new Error('Database error');

        invoiceSuppliers.findAndCountAll.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await collectorKybExport(mockParams);

        expect(console.log).toHaveBeenCalledWith({ error: mockError });
        expect(result).toBe(false);
    });
});
