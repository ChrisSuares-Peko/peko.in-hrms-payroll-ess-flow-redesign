const { findAllAvailableWorks } = require('../../../use-cases/works');
const works = require('../../../entities/works');
const { Op } = require('sequelize');

jest.mock('../../../entities/works', () => ({
    findAll: jest.fn(),
}));

describe('findAllAvailableWorks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return available works when called with a valid query', async () => {
        const mockQuery = 'test';
        const mockData = [
            { id: 1, name: 'Test Work 1' },
            { id: 2, name: 'Test Work 2' },
        ];

        works.findAll.mockResolvedValue(mockData);

        const result = await findAllAvailableWorks(mockQuery);

        expect(works.findAll).toHaveBeenCalledWith({
            where: {
                name: {
                    [Op.like]: `%${mockQuery}%`,
                },
                status: true,
            },
            attributes: ['id', 'name'],
        });
        expect(result).toEqual(mockData);
    });

    it('should return an empty array when no works match the query', async () => {
        const mockQuery = 'nonexistent';
        works.findAll.mockResolvedValue([]);

        const result = await findAllAvailableWorks(mockQuery);

        expect(result).toEqual([]);
    });
});
