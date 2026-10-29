const { updateAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');

jest.mock('../../../entities/addressDetails', () => ({
    update: jest.fn(),
}));

describe('updateAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update existing addresses to default: false and update the address if default is true', async () => {
        const mockData = {
            id: 'addressId123',
            credentialId: 'credentialId123',
            default: true,
            address: '456 Test Ave',
        };

        addressDetails.update.mockResolvedValue({});

        const result = await updateAddress(mockData);

        // Ensure the update to set existing addresses to default: false is called
        expect(addressDetails.update).toHaveBeenCalledWith(
            { default: false },
            {
                where: {
                    credentialId: mockData.credentialId,
                },
            }
        );
        // Ensure the update to the specific address is called
        expect(addressDetails.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockData.id,
            },
        });
        expect(result).toEqual({});
    });

    it('should only update the address if default is not true', async () => {
        const mockData = {
            id: 'addressId123',
            credentialId: 'credentialId123',
            default: false,
            address: '456 Test Ave',
        };

        addressDetails.update.mockResolvedValue({});

        const result = await updateAddress(mockData);

        // Ensure the update to set existing addresses to default: false is not called
        expect(addressDetails.update).not.toHaveBeenCalledWith(
            { default: false },
            {
                where: {
                    credentialId: mockData.credentialId,
                },
            }
        );
        // Ensure the update to the specific address is called
        expect(addressDetails.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockData.id,
            },
        });
        expect(result).toEqual({});
    });

    it('should handle errors properly during address update', async () => {
        const mockData = {
            id: 'addressId123',
            credentialId: 'credentialId123',
            default: false,
            address: '456 Test Ave',
        };
        const mockError = new Error('Database error');

        addressDetails.update.mockRejectedValue(mockError);

        await expect(updateAddress(mockData)).rejects.toThrow('Database error');
    });
});
