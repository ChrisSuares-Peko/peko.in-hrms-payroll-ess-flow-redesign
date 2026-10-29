const { Delete } = require('../../../use-cases/works');
const works = require('../../../entities/works');

jest.mock('../../../entities/works', () => ({
    destroy: jest.fn(),
}));

describe('Delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a work entry when called with a valid ID', async () => {
        const mockParams = { id: 1 };
        works.destroy.mockResolvedValue(1);

        const result = await Delete(mockParams);

        expect(works.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(1);
    });

    it('should return 0 when no matching work entry is found', async () => {
        const mockParams = { id: 999 };
        works.destroy.mockResolvedValue(0);

        const result = await Delete(mockParams);

        expect(result).toEqual(0);
    });
});
