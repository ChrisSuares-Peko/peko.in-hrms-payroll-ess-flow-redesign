const { findAttestationCategory } = require('../../attestation');
const attestationCategory = require('../../../entities/attestationCategory');

jest.mock('../../../entities/attestationCategory');

describe('findAttestationCategory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all matching attestation categories', async () => {
        const mockResult = [
            { id: 1, name: 'Cat A', country: 'UAE' },
            { id: 2, name: 'Cat B', country: 'UAE' },
        ];
        attestationCategory.findAll.mockResolvedValue(mockResult);

        const query = { country: 'UAE' };
        const result = await findAttestationCategory(query);

        expect(attestationCategory.findAll).toHaveBeenCalledWith({
            where: query,
            nest: true,
            raw: true,
        });
        expect(result).toEqual(mockResult);
    });

    it('should return empty array when no categories match', async () => {
        attestationCategory.findAll.mockResolvedValue([]);

        const result = await findAttestationCategory({ country: 'XX' });

        expect(result).toEqual([]);
    });
});
