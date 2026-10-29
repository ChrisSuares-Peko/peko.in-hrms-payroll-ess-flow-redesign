const { create } = require('../../../use-cases/peko_connect');
const peko_connect = require('../../../entities/peko_connect');
const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../entities/peko_connect', () => ({
    create: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }),
    define: jest.fn()
}));

jest.mock('../../../../utils/s3', () => ({
    uploadFileToS3: jest.fn(),
    
}));
jest.mock('../../../../models/entities/credential', () => {
    const credentialMock = {
        prototype: {
            getResetPasswordToken: jest.fn(),
        },
    };
    return credentialMock;
});

jest.mock('../../../entities/connections', () => ({
    update: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/works', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/categories', () => ({
    update: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
    
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new peko_connect record successfully without logo', async () => {
        const mockParams = { name: 'Test Peko Connect' };
        const mockResponse = { id: 1, ...mockParams };

        peko_connect.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(peko_connect.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResponse);
    });

  

    it('should upload logo using standard upload method when CLOUD_STORAGE is not S3', async () => {
        process.env.CLOUD_STORAGE = 'LOCAL';
        const mockParams = { logo: 'file_data', format: 'jpg' };
        const mockPublicUrl = 'https://localstorage.com/logo.jpg';
        const mockResponse = { id: 3, ...mockParams, logo: mockPublicUrl };

        uploadFile.mockResolvedValue(mockPublicUrl);
        peko_connect.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(uploadFile).toHaveBeenCalledWith("file_data", 'peko-connect/logo', mockParams.format);
        expect(peko_connect.create).toHaveBeenCalledWith(expect.objectContaining({ logo: mockPublicUrl }));
        expect(result).toEqual(mockResponse);
    });

    it('should return false when create fails', async () => {
        const mockParams = { name: 'Test Peko Connect' };

        peko_connect.create.mockResolvedValue(null);

        const result = await create(mockParams);

        expect(peko_connect.create).toHaveBeenCalledWith(mockParams);
        expect(result).toBe(false);
    });
    
});
