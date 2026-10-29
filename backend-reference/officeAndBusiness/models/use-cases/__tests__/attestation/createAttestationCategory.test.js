const attestationCategory = require('../../../entities/attestationCategory');
const { createAttestationCategory } = require('../../../use-cases/attestation');

jest.mock('../../../entities/attestationCategory', () => ({
    create: jest.fn(),
}));

describe('createAttestationCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the created attestation category when successful', async () => {
        const mockParams = { name: 'Test Category' };
        const mockResponse = { id: '123', name: 'Test Category' };

        attestationCategory.create.mockResolvedValue(mockResponse);

        const result = await createAttestationCategory(mockParams);

        expect(result).toEqual(mockResponse);
        expect(attestationCategory.create).toHaveBeenCalledWith(mockParams);
    });

    it('should return false if attestation category creation fails', async () => {
        attestationCategory.create.mockResolvedValue(null);

        const result = await createAttestationCategory({ name: 'Test Category' });

        expect(result).toBe(false);
        expect(attestationCategory.create).toHaveBeenCalledWith({ name: 'Test Category' });
    });

    it('should throw an error if create throws an error', async () => {
        const expectedError = new Error('Database error');
        attestationCategory.create.mockRejectedValue(expectedError);

        await expect(createAttestationCategory({ name: 'Test Category' })).rejects.toThrow('Database error');
        expect(attestationCategory.create).toHaveBeenCalledWith({ name: 'Test Category' });
    });
});
