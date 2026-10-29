const { findOne } = require('../../../use-cases/works');
const works = require('../../../entities/works');

jest.mock('../../../entities/works', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a work when found by id', async () => {
        const mockParams = { id: 1 };
        const mockResponse = { id: 1, name: 'Test Work', status: true };

        works.findOne.mockResolvedValue(mockResponse);

        const result = await findOne(mockParams);

        expect(works.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an object with default values if no work is found', async () => {
        const mockParams = { id: 2 };
        const defaultResponse = { id: null, name: 'Not Found', status: false };
        
        works.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams) || defaultResponse;

        expect(result).toEqual(defaultResponse);
    });

    it('should return an empty object when no work is found instead of null', async () => {
        const mockParams = { id: 4 };
        works.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams) || {};

        expect(result).toEqual({});
    });
});
