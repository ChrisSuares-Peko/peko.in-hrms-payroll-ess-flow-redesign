const { findOneWithId } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');

jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findOneWithId', () => {
    it('should find a corporate user by id', async () => {
        const mockResult = { id: 5, name: 'Test Corp' };
        corporateUser.findOne.mockResolvedValue(mockResult);

        const result = await findOneWithId(5);
        expect(result).toEqual(mockResult);
        expect(corporateUser.findOne).toHaveBeenCalledWith({
            where: { id: 5 }
        });
    });

    it('should return null when corporate user not found', async () => {
        corporateUser.findOne.mockResolvedValue(null);

        const result = await findOneWithId(999);
        expect(result).toBeNull();
    });
});
