const { deleteAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');
const { Op } = require('sequelize');

jest.mock('../../../entities/addressDetails', () => ({
    findOne: jest.fn(),
    destroy: jest.fn(),
}));

describe('deleteAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete the address and set a new default if the deleted address was default', async () => {
        const mockParams = { id: 'addressId123' };

        const mockAddress = {
            id: 'addressId123',
            credentialId: 'credentialId123',
            default: true,
        };

        const mockNewDefault = {
            id: 'newDefaultId',
            credentialId: 'credentialId123',
            update: jest.fn().mockResolvedValue({}), // Mock update method
        };

        addressDetails.findOne.mockImplementation((query) => {
            if (query.where.id === mockParams.id) {
                return Promise.resolve(mockAddress);
            }
            if (query.where.credentialId === mockAddress.credentialId && query.where.id[Op.ne] === mockAddress.id) {
                return Promise.resolve(mockNewDefault);
            }
            return Promise.resolve(null);
        });

        addressDetails.destroy.mockResolvedValue(1); // Simulate successful deletion

        await deleteAddress(mockParams);

        // Assertions
        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });

        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: mockAddress.credentialId,
                id: { [Op.ne]: mockAddress.id },
            },
        });

        // Check if update was called on the new default address
        expect(mockNewDefault.update).toHaveBeenCalledWith({ default: true });

        // Check if the address was deleted
        expect(addressDetails.destroy).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });
    });

    it('should delete the address without setting a new default if the deleted address was not default', async () => {
        const mockParams = { id: 'addressId123' };

        const mockAddress = {
            id: 'addressId123',
            credentialId: 'credentialId123',
            default: false,
        };

        addressDetails.findOne.mockResolvedValue(mockAddress);
        addressDetails.destroy.mockResolvedValue(1); // Simulate successful deletion

        await deleteAddress(mockParams);

        // Assertions
        expect(addressDetails.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });

        // Ensure no additional findOne was called
        expect(addressDetails.findOne).not.toHaveBeenCalledWith(expect.objectContaining({
            where: {
                credentialId: mockAddress.credentialId,
                id: { [Op.ne]: mockAddress.id },
            },
        }));

        expect(addressDetails.destroy).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });
    });

    it('should handle errors gracefully', async () => {
        const mockParams = { id: 'addressId123' };
        const mockError = new Error('Database error');

        addressDetails.findOne.mockRejectedValue(mockError);

        await expect(deleteAddress(mockParams)).rejects.toThrow('Database error');
    });
});
