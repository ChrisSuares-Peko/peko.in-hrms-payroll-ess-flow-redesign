const { createAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');

jest.mock('../../../entities/addressDetails', () => ({
    create: jest.fn(),
    update: jest.fn(),
}));

describe('createAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new address successfully', async () => {
        const mockData = { credentialId: 1, default: false, address: '123 Main St' };
        const mockCreatedAddress = { id: 1, ...mockData };

        addressDetails.create.mockResolvedValue(mockCreatedAddress);

        const result = await createAddress(mockData);

        expect(addressDetails.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual(mockCreatedAddress);
    });

    it('should update existing default address and create a new default address', async () => {
        const mockData = { credentialId: 1, default: true, address: '123 Main St' };
        const mockCreatedAddress = { id: 1, ...mockData };

        addressDetails.update.mockResolvedValue([1]);
        addressDetails.create.mockResolvedValue(mockCreatedAddress);

        const result = await createAddress(mockData);

        expect(addressDetails.update).toHaveBeenCalledWith(
            { default: false },
            { where: { credentialId: mockData.credentialId } }
        );
        expect(addressDetails.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual(mockCreatedAddress);
    });

    it('should handle errors if address creation fails', async () => {
        const mockData = { credentialId: 1, default: false, address: '123 Main St' };
        const mockError = new Error('Database error');

        addressDetails.create.mockRejectedValue(mockError);

        await expect(createAddress(mockData)).rejects.toThrow('Database error');
    });
});
