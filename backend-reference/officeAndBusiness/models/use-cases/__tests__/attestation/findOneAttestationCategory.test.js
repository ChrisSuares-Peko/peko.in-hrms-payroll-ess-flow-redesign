const { findOneAttestationCategory } = require('../../attestation');
const attestationCategory = require('../../../entities/attestationCategory');

jest.mock('../../../entities/attestationCategory');

describe('findOneAttestationCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a single attestation category', async () => {
        const mockResult = { id: 1, name: 'Cat A', country: 'UAE' };
        attestationCategory.findOne.mockResolvedValue(mockResult);

        const query = { id: 1 };
        const result = await findOneAttestationCategory(query);

        expect(attestationCategory.findOne).toHaveBeenCalledWith({
            where: query,
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return null when no category found', async () => {
        attestationCategory.findOne.mockResolvedValue(null);

        const result = await findOneAttestationCategory({ id: 999 });

        expect(result).toBeNull();
    });
});
