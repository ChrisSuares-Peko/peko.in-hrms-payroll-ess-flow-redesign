const { updateWorkspace } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/workspaces', () => ({
    update: jest.fn(),
    findOne: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('updateWorkspace', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a workspace with provided data', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Workspace' };
        const mockResponse = [1]; // Sequelize update returns an array with number of affected rows

        workspaces.findOne.mockResolvedValue({ id: 1, name: 'Old Workspace' });
        workspaces.update.mockResolvedValue(mockResponse);

        const result = await updateWorkspace(mockParams, mockData);

        expect(workspaces.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should update workspace logo when logo data is provided', async () => {
        const mockParams = { id: 2 };
        const mockData = { logo: 'base64encodedimage', logoFormat: 'png' };
        const mockPublicUrl = 'https://example.com/logo.png';
        const mockResponse = [1];

        uploadFile.mockResolvedValue(mockPublicUrl);
        workspaces.findOne.mockResolvedValue({ id: 2, name: 'Old Workspace' });
        workspaces.update.mockResolvedValue(mockResponse);

        const result = await updateWorkspace(mockParams, mockData);

        expect(uploadFile).toHaveBeenCalledWith('base64encodedimage', 'workspaceImage', 'png');
        expect(result).toEqual(mockResponse);
    });
});
