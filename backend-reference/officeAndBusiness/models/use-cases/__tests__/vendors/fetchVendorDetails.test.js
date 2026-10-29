const { fetchVendorDetails } = require('../../../use-cases/vendors');
const vendor = require('../../../entities/vendor');
const { Op } = require('sequelize');

jest.mock('../../../entities/vendor', () => ({
    findAll: jest.fn(),
}));

describe('fetchVendorDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return vendor details matching the query', async () => {
        const mockQuery = 'test';
        const mockType = 'supplier';
        const mockVendors = [1, 2, 3];
        const mockResponse = [
            { id: 1, vendorName: 'Test Vendor' },
            { id: 2, vendorName: 'Another Vendor' },
        ];

        vendor.findAll.mockResolvedValue(mockResponse);

        const result = await fetchVendorDetails(mockQuery, mockType, mockVendors);

        expect(vendor.findAll).toHaveBeenCalledWith({
            where: expect.objectContaining({
                vendorName: { [Op.like]: `%${mockQuery}%` },
                type: mockType,
                id: { [Op.in]: mockVendors },
            }),
            attributes: ['id', 'vendorName'],
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return vendor details without type filter if type is not provided', async () => {
        const mockQuery = 'vendor';
        const mockVendors = [4, 5];
        const mockResponse = [{ id: 4, vendorName: 'Some Vendor' }];

        vendor.findAll.mockResolvedValue(mockResponse);

        const result = await fetchVendorDetails(mockQuery, null, mockVendors);

        expect(vendor.findAll).toHaveBeenCalledWith({
            where: expect.objectContaining({
                vendorName: { [Op.like]: `%${mockQuery}%` },
                id: { [Op.in]: mockVendors },
            }),
            attributes: ['id', 'vendorName'],
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return vendor details without vendor filter if vendors array is empty', async () => {
        const mockQuery = 'some vendor';
        const mockType = 'distributor';
        const mockResponse = [{ id: 6, vendorName: 'Distributor Vendor' }];

        vendor.findAll.mockResolvedValue(mockResponse);

        const result = await fetchVendorDetails(mockQuery, mockType, []);

        expect(vendor.findAll).toHaveBeenCalledWith({
            where: expect.objectContaining({
                vendorName: { [Op.like]: `%${mockQuery}%` },
                type: mockType,
            }),
            attributes: ['id', 'vendorName'],
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no vendors are found', async () => {
        const mockQuery = 'nonexistent';
        vendor.findAll.mockResolvedValue([]);

        const result = await fetchVendorDetails(mockQuery, null, []);

        expect(result).toEqual([]);
    });

});
