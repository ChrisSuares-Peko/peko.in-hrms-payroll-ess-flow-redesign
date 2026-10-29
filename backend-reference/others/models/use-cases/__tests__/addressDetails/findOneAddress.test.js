const { findOneAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');

jest.mock('../../../entities/addressDetails', () => ({
    findOne: jest.fn(),
}));

describe('findOneAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the address details for valid parameters', async () => {
        const mockParams = {
            addressId: 'addressId123',
            credentialId: 'credentialId123',
        };

        const mockAddress = {
            id: 'addressId123',
            credentialId: 'credentialId123',
            address: '123 Test Ave',
        };

        addressDetails.findOne.mockResolvedValue(mockAddress);

        const result = await findOneAddress(mockParams);

        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: {
                id: mockParams.addressId,
                credentialId: mockParams.credentialId,
            },
        });
        expect(result).toEqual(mockAddress);
    });

    it('should return null if no address is found', async () => {
        const mockParams = {
            addressId: 'addressId123',
            credentialId: 'credentialId123',
        };

        addressDetails.findOne.mockResolvedValue(null);

        const result = await findOneAddress(mockParams);

        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: {
                id: mockParams.addressId,
                credentialId: mockParams.credentialId,
            },
        });
        expect(result).toBeNull();
    });

    it('should handle errors during address retrieval', async () => {
        const mockParams = {
            addressId: 'addressId123',
            credentialId: 'credentialId123',
        };
        const mockError = new Error('Database error');

        addressDetails.findOne.mockRejectedValue(mockError);

        await expect(findOneAddress(mockParams)).rejects.toThrow('Database error');
    });
});
