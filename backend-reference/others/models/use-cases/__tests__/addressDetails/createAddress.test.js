const { createAddress } = require('../../../use-cases/addressDetails');
const addressDetails = require('../../../entities/addressDetails');

jest.mock('../../../entities/addressDetails', () => ({
    update: jest.fn(),
    create: jest.fn(),
}));

describe('createAddress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update existing addresses to default: false and create a new address if default is true', async () => {
        const mockData = {
            credentialId: 'credentialId123',
            default: true,
            address: '123 Test St',
        };

        addressDetails.update.mockResolvedValue({});
        addressDetails.create.mockResolvedValue({});

        const result = await createAddress(mockData);

        expect(addressDetails.update).toHaveBeenCalledWith(
            { default: false },
            {
                where: {
                    credentialId: mockData.credentialId,
                },
            }
        );
        expect(addressDetails.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual({});
    });

    it('should only create a new address if default is not true', async () => {
        const mockData = {
            credentialId: 'credentialId123',
            default: false,
            address: '123 Test St',
        };

        addressDetails.update.mockResolvedValue({});
        addressDetails.create.mockResolvedValue({});

        const result = await createAddress(mockData);

        expect(addressDetails.update).not.toHaveBeenCalled();
        expect(addressDetails.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual({});
    });

    it('should handle errors properly during address creation', async () => {
        const mockData = {
            credentialId: 'credentialId123',
            default: false,
            address: '123 Test St',
        };
        const mockError = new Error('Database error');

        addressDetails.create.mockRejectedValue(mockError);

        await expect(createAddress(mockData)).rejects.toThrow('Database error');
    });
});
