const { fetchAllPartners } = require('../../../use-cases/access_codes');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential', () => ({
    findAll: jest.fn(),
}));

describe('access_codes - fetchAllPartners', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch partners matching query', async () => {
        const mockPartners = [
            { id: 1, name: 'Partner One' },
            { id: 2, name: 'Partner Two' },
        ];
        credential.findAll.mockResolvedValue(mockPartners);

        const result = await fetchAllPartners('Partner');

        expect(credential.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockPartners);
    });

    it('should return empty array when no partners match', async () => {
        credential.findAll.mockResolvedValue([]);

        const result = await fetchAllPartners('nonexistent');

        expect(result).toEqual([]);
    });
});
