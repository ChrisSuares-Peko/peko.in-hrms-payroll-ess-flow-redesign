const { createKYBDetails } = require('../../../use-cases/vendorPayout/kybDetails'); // Adjust path
const kybDetails = require('../../../entities/vendorPayout/kybDetails'); 

jest.mock('../../../entities/vendorPayout/kybDetails', () => ({
    create: jest.fn(),
}));

describe('createKYBDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create KYB details successfully', async () => {
        const mockKYBData = {
            companyName: 'Test Company',
            registrationNumber: '12345',
            // ... other KYB details
        };
        const mockCreatedKYBDetails = { id: 1, ...mockKYBData }; // Add ID as it will be generated

        kybDetails.create.mockResolvedValue(mockCreatedKYBDetails);

        const result = await createKYBDetails(mockKYBData);

        expect(kybDetails.create).toHaveBeenCalledWith(mockKYBData);
        expect(result).toEqual({ success: true, data: mockCreatedKYBDetails });
    });

    it('should return an error if KYB details creation fails', async () => {
        const mockKYBData = {
            companyName: 'Test Company',
            registrationNumber: '12345',
            // ... other KYB details
        };

        kybDetails.create.mockResolvedValue(null); // Simulate creation failure

        const result = await createKYBDetails(mockKYBData);

        expect(kybDetails.create).toHaveBeenCalledWith(mockKYBData);
        expect(result).toEqual({ success: false, message: "Failed to create kyb details." });
    });

    it('should handle errors during database operations', async () => {
        const mockKYBData = { /* ... */ };
        const mockError = new Error('Database error');

        kybDetails.create.mockRejectedValue(mockError);

        await expect(createKYBDetails(mockKYBData)).rejects.toThrow(mockError); // Or handle it differently

        expect(kybDetails.create).toHaveBeenCalledWith(mockKYBData);
    });

   
});