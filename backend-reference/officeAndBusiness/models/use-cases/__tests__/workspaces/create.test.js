const { create } = require('../../../use-cases/workspaces');
const workspaces = require('../../../entities/workspaces');

const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../entities/workspaces', () => ({
    create: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a workspace entry successfully with logo upload', async () => {
        const mockParams = { name: 'Test Workspace', logo: 'base64data', logoFormat: 'png' };
        const mockPublicUrl = 'https://mockstorage.com/image.png';
        const mockWorkspace = { id: 1, name: 'Test Workspace', logo: mockPublicUrl };

        uploadFile.mockResolvedValue(mockPublicUrl);
        workspaces.create.mockResolvedValue(mockWorkspace);

        const result = await create(mockParams);

        expect(uploadFile).toHaveBeenCalledWith('base64data', 'workspaceImage', 'png');
        expect(workspaces.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Workspace',
            logo: mockPublicUrl,
            logoFormat: 'png'
        }));
        expect(result).toEqual(mockWorkspace);
    });

    it('should create a workspace entry successfully without a logo', async () => {
        const mockParams = { name: 'Test Workspace' };
        const mockWorkspace = { id: 2, name: 'Test Workspace' };

        workspaces.create.mockResolvedValue(mockWorkspace);

        const result = await create(mockParams);

        expect(workspaces.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockWorkspace);
    });
});
