const attestationCategory = require('../../../entities/attestationCategory');
const { updateAttestationCategory } = require('../../../use-cases/attestation');

jest.mock('../../../entities/attestationCategory', () => ({
    findOne: jest.fn(),
}));

describe('updateAttestationCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the updated attestation category when successful', async () => {
        const mockId = 'categoryId';
        const mockParams = { name: 'Updated Category' };
        const mockAttestation = {
            id: mockId,
            update: jest.fn().mockResolvedValue({ id: mockId, ...mockParams }),
        };

        attestationCategory.findOne.mockResolvedValue(mockAttestation);

        const result = await updateAttestationCategory(mockId, mockParams);

        expect(result).toEqual({ id: mockId, ...mockParams });
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(mockAttestation.update).toHaveBeenCalledWith(mockParams);
    });

    it('should return false if attestation category is not found', async () => {
        attestationCategory.findOne.mockResolvedValue(null);

        const result = await updateAttestationCategory('categoryId', { name: 'Updated Category' });

        expect(result).toBe(false);
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: 'categoryId' } });
    });

    it('should throw an error if findOne throws an error', async () => {
        const expectedError = new Error('Database error');
        attestationCategory.findOne.mockRejectedValue(expectedError);

        await expect(updateAttestationCategory('categoryId', { name: 'Updated Category' })).rejects.toThrow('Database error');
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: 'categoryId' } });
    });

    it('should throw an error if update throws an error', async () => {
        const expectedError = new Error('Update failed');
        const mockAttestation = {
            id: 'categoryId',
            update: jest.fn().mockRejectedValue(expectedError),
        };

        attestationCategory.findOne.mockResolvedValue(mockAttestation);

        await expect(updateAttestationCategory('categoryId', { name: 'Updated Category' })).rejects.toThrow('Update failed');
        expect(attestationCategory.findOne).toHaveBeenCalledWith({ where: { id: 'categoryId' } });
        expect(mockAttestation.update).toHaveBeenCalledWith({ name: 'Updated Category' });
    });
});
