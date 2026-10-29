const { findPeko } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');

jest.mock('../../../entities/peko_connect', () => ({
    findAll: jest.fn(),
}));

describe('findPeko', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active peko_connect records', async () => {
        const mockResponse = [
            { id: 1, name: 'Peko 1', status: true },
            { id: 2, name: 'Peko 2', status: true },
        ];

        peko_connect.findAll.mockResolvedValue(mockResponse);

        const result = await findPeko();

        expect(peko_connect.findAll).toHaveBeenCalledWith({
            where: { status: true },
            attributes: undefined,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return all active peko_connect records with specific attributes', async () => {
        const mockAttributes = ['id', 'name'];
        const mockResponse = [
            { id: 1, name: 'Peko 1' },
            { id: 2, name: 'Peko 2' },
        ];

        peko_connect.findAll.mockResolvedValue(mockResponse);

        const result = await findPeko(mockAttributes);

        expect(peko_connect.findAll).toHaveBeenCalledWith({
            where: { status: true },
            attributes: mockAttributes,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no active records are found', async () => {
        peko_connect.findAll.mockResolvedValue([]);

        const result = await findPeko();

        expect(result).toEqual([]);
    });

    it('should throw an error when findAll fails', async () => {
        const mockError = new Error('Database error');

        peko_connect.findAll.mockRejectedValue(mockError);

        await expect(findPeko()).rejects.toThrow('Database error');
    });
});
