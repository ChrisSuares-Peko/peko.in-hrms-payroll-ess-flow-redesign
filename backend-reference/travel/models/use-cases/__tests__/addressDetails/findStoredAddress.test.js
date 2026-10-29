const { findStoredAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');

jest.mock('../../../entities/addressDetails', () => ({
    findOne: jest.fn(),
}));

describe('findStoredAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and return a stored address', async () => {
        const mockParams = { credentialId: 1 };
        const mockAddress = { id: 1, credentialId: 1, address: '123 Main St' };

        addressDetails.findOne.mockResolvedValue(mockAddress);

        const result = await findStoredAddress(mockParams);

        expect(addressDetails.findOne).toHaveBeenCalledWith({ where: mockParams });
        expect(result).toEqual(mockAddress);
    });

    it('should return null if no address is found', async () => {
        const mockParams = { credentialId: 999 };
        addressDetails.findOne.mockResolvedValue(null);

        const result = await findStoredAddress(mockParams);

        expect(result).toBeNull();
    });

    it('should handle errors if database query fails', async () => {
        const mockParams = { credentialId: 1 };
        const mockError = new Error('Database error');

        addressDetails.findOne.mockRejectedValue(mockError);

        await expect(findStoredAddress(mockParams)).rejects.toThrow('Database error');
    });
});
