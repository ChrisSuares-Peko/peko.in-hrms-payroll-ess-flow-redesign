const { deleteWorkspace } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');

jest.mock('../../../entities/workspaces', () => ({
    destroy: jest.fn(),
}));

describe('deleteWorkspace', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a workspace with the given ID', async () => {
        const mockParams = { id: 1 };
        const mockResponse = 1; // Sequelize destroy returns number of affected rows

        workspaces.destroy.mockResolvedValue(mockResponse);

        const result = await deleteWorkspace(mockParams);

        expect(workspaces.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return 0 if no workspace was deleted', async () => {
        const mockParams = { id: 999 };
        const mockResponse = 0;

        workspaces.destroy.mockResolvedValue(mockResponse);

        const result = await deleteWorkspace(mockParams);

        expect(workspaces.destroy).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(mockResponse);
    });

   
});
