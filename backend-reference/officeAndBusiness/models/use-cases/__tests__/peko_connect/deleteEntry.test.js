const { deleteEntry } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');

jest.mock('../../../entities/peko_connect', () => ({
    destroy: jest.fn(),
}));

describe('deleteEntry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a peko_connect record and return the number of affected rows', async () => {
        const mockParams = { id: 1 };
        const mockResponse = 1; // 1 row affected

        peko_connect.destroy.mockResolvedValue(mockResponse);

        const result = await deleteEntry(mockParams);

        expect(peko_connect.destroy).toHaveBeenCalledWith({ where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return 0 when no records are deleted', async () => {
        const mockParams = { id: 2 };
        peko_connect.destroy.mockResolvedValue(0);

        const result = await deleteEntry(mockParams);

        expect(result).toEqual(0);
    });

    it('should throw an error when destroy fails', async () => {
        const mockParams = { id: 3 };
        const mockError = new Error('Database error');

        peko_connect.destroy.mockRejectedValue(mockError);

        await expect(deleteEntry(mockParams)).rejects.toThrow('Database error');
    });
});
