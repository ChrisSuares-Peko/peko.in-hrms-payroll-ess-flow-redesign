const { findOneKYBDetails } = require('../../../use-cases/vendorPayout/kybDetails'); 
const kybDetails = require('../../../entities/vendorPayout/kybDetails'); 

jest.mock('../../../entities/vendorPayout/kybDetails', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findOneKYBDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return KYB details when credentialId is provided', async () => {
        const mockCredentialId = 123;
        const mockKYBDetails = {
            count: 1,
            rows: [{ id: 1, companyName: 'Test Company' }], // Example data
        };

        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);

        const result = await findOneKYBDetails(mockCredentialId);

        expect(kybDetails.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
        });
        expect(result).toEqual({ success: true, data: mockKYBDetails });
    });

    it('should return all KYB details when credentialId is not provided', async () => {
        const mockKYBDetails = {
            count: 2,
            rows: [
                { id: 1, companyName: 'Test Company 1' },
                { id: 2, companyName: 'Test Company 2' },
            ],
        };

        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);

        const result = await findOneKYBDetails(); // No credentialId provided

        expect(kybDetails.findAndCountAll).toHaveBeenCalledWith({ where: {} }); // Empty where clause
        expect(result).toEqual({ success: true, data: mockKYBDetails });
    });

    it('should handle cases where no KYB details are found', async () => {
        const mockCredentialId = 123;
        const mockKYBDetails = { count: 0, rows: [] };

        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);

        const result = await findOneKYBDetails(mockCredentialId);

        expect(kybDetails.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
        });
        expect(result).toEqual({ success: true, data: mockKYBDetails });
    });

     it('should handle cases where no KYB details are found without credentialId', async () => {
        const mockKYBDetails = { count: 0, rows: [] };

        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);

        const result = await findOneKYBDetails();

        expect(kybDetails.findAndCountAll).toHaveBeenCalledWith({ where: {} });
        expect(result).toEqual({ success: true, data: mockKYBDetails });
    });


    it('should handle errors during database operations', async () => {
        const mockCredentialId = 123;
        const mockError = new Error('Database error');

        kybDetails.findAndCountAll.mockRejectedValue(mockError);

        const result = await findOneKYBDetails(mockCredentialId);

        expect(kybDetails.findAndCountAll).toHaveBeenCalledWith({
            where: { credentialId: mockCredentialId },
        });
        expect(result).toEqual({ success: false, message: mockError.message });
    });
});