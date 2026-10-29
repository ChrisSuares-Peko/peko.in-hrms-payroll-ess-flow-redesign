const { findOneDefaultAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');

jest.mock('../../../entities/addressDetails', () => ({
    findOne: jest.fn(),
}));

describe('findOneDefaultAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the default address when found', async () => {
        const mockParams = { credentialId: 'cred123' };
        const mockAddress = {
            id: 1,
            credentialId: 'cred123',
            default: true,
            address: '123 Test Street',
        };

        addressDetails.findOne.mockResolvedValue(mockAddress);

        const result = await findOneDefaultAddress(mockParams);

        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                default: undefined,
            },
        });
        expect(result).toEqual(mockAddress);
    });

    it('should return null if no default address is found', async () => {
        const mockParams = { credentialId: 'cred123' };

        addressDetails.findOne.mockResolvedValue(null);

        const result = await findOneDefaultAddress(mockParams);

        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockParams.credentialId,
                default: undefined,
            },
        });
        expect(result).toBeNull();
    });

    it('should throw an error if findOne fails', async () => {
        const mockParams = { credentialId: 'cred123' };
        const mockError = new Error('Database error');

        addressDetails.findOne.mockRejectedValue(mockError);

        await expect(findOneDefaultAddress(mockParams)).rejects.toThrow('Database error');
    });
});
