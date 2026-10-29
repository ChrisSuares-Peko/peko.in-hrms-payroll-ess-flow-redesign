const { findAllWorkspaces } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');


jest.mock('../../../entities/workspaces', () => ({
    findAll: jest.fn(),
}));

describe('findAllWorkspaces', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active workspaces excluding createdAt and updatedAt', async () => {
        const mockWorkspaces = [
            { id: 1, name: 'Workspace A', status: true },
            { id: 2, name: 'Workspace B', status: true },
        ];

        workspaces.findAll.mockResolvedValue(mockWorkspaces);

        const result = await findAllWorkspaces();

        expect(workspaces.findAll).toHaveBeenCalledWith({
            where: {
                status: true,
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        });
        expect(result).toEqual(mockWorkspaces);
    });

    it('should return an empty array when no active workspaces are found', async () => {
        workspaces.findAll.mockResolvedValue([]);

        const result = await findAllWorkspaces();

        expect(result).toEqual([]);
    });
});
