const { findVendorById } = require('../../../use-cases/giftCards');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('findVendorById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a vendor if found by ID', async () => {
        const mockVendorId = 1;
        const mockVendor = { id: mockVendorId, name: 'Test Vendor' };

        vendor.findOne.mockResolvedValue(mockVendor);

        const result = await findVendorById(mockVendorId);

        expect(vendor.findOne).toHaveBeenCalledWith({
            where: { id: mockVendorId },
        });
        expect(result).toEqual(mockVendor);
    });

    it('should return null if no vendor is found', async () => {
        const mockVendorId = 999;
        vendor.findOne.mockResolvedValue(null);

        const result = await findVendorById(mockVendorId);

        expect(result).toBeNull();
    });

    it('should handle errors if database query fails', async () => {
        const mockVendorId = 1;
        const mockError = new Error('Database error');

        vendor.findOne.mockRejectedValue(mockError);

        await expect(findVendorById(mockVendorId)).rejects.toThrow('Database error');
    });
});
