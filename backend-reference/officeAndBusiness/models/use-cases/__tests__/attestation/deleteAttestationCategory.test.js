const attestationCategory = require('../../../entities/attestationCategory');
const { deleteAttestationCategory } = require('../../../use-cases/attestation');

jest.mock('../../../entities/attestationCategory', () => ({
    findOne: jest.fn(),
}));

describe('deleteAttestationCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true if attestation category is found and deleted', async () => {
        const mockAttestation = {
            id: 'categoryId',
            destroy: jest.fn(),
        };

        attestationCategory.findOne.mockResolvedValue(mockAttestation);

        const result = await deleteAttestationCategory('categoryId');

        expect(result).toBe(true);
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: 'categoryId' } });
        expect(mockAttestation.destroy).toHaveBeenCalled();
    });

    it('should return false if attestation category is not found', async () => {
        attestationCategory.findOne.mockResolvedValue(null);

        const result = await deleteAttestationCategory('categoryId');

        expect(result).toBe(false);
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: 'categoryId' } });
    });

    it('should throw an error if findOne throws an error', async () => {
        const expectedError = new Error('Database error');
        attestationCategory.findOne.mockRejectedValue(expectedError);

        await expect(deleteAttestationCategory('categoryId')).rejects.toThrow('Database error');
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: 'categoryId' } });
    });
});
