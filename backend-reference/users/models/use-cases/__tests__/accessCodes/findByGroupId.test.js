const { findByGroupId } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findOne: jest.fn(),
}));

describe('access_codes - findByGroupId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find an assigned access code by groupId', async () => {
        const mockCode = { id: 1, groupId: 5, isAssigned: true };
        access_codes.findOne.mockResolvedValue(mockCode);

        const result = await findByGroupId(5);

        expect(access_codes.findOne).toHaveBeenCalledWith({
            where: { groupId: 5, isAssigned: true },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockCode);
    });

    it('should return null when no code found for groupId', async () => {
        access_codes.findOne.mockResolvedValue(null);

        const result = await findByGroupId(999);

        expect(result).toBeNull();
    });
});
