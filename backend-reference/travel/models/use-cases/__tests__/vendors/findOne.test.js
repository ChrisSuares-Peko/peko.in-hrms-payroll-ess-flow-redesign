const { findOne } = require('../../../use-cases/vendors');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a vendor when a matching record is found', async () => {
        const mockParams = { id: 1 };
        const mockVendor = {
            id: 1,
            name: 'Vendor A',
            serviceType: 'MOBILE',
        };

        vendor.findOne.mockResolvedValue(mockVendor);

        const result = await findOne(mockParams);

        expect(vendor.findOne).toHaveBeenCalledWith({ where: mockParams });
        expect(result).toEqual(mockVendor);
    });

    it('should return null when no matching vendor is found', async () => {
        const mockParams = { id: 999 };

        vendor.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(vendor.findOne).toHaveBeenCalledWith({ where: mockParams });
        expect(result).toBeNull();
    });

    it('should return null if vendor not found', async () => {
        const mockParams = { id: 999 };
    
        vendor.findOne.mockResolvedValue(null);
    
        const result = await findOne(mockParams);
    
        expect(result).toBeNull();
        expect(vendor.findOne).toHaveBeenCalledWith({ where: mockParams });
    });
    
});
