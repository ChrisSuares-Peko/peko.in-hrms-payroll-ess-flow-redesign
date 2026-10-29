const { findOne } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');

jest.mock('../../../entities/workspaces', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a workspace entry when a valid ID is provided', async () => {
        const mockParams = { id: 1 };
        const mockWorkspace = { id: 1, name: 'Test Workspace' };

        workspaces.findOne.mockResolvedValue(mockWorkspace);

        const result = await findOne(mockParams);

        expect(workspaces.findOne).toHaveBeenCalledWith({
            where: {
                id: mockParams.id,
            },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockWorkspace);
    });

    it('should return null when no workspace entry is found', async () => {
        const mockParams = { id: 999 };
        workspaces.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });
});
