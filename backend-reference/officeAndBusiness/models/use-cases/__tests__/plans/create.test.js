const { create } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');
const { uploadFile } = require("../../../../utils/commonUploadFile");

jest.mock('../../../entities/plans', () => ({
    create: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
    transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }),
    define: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));
jest.mock('../../../entities/categories', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../models/entities/credential', () => {
    const credentialMock = {
        prototype: {
            getResetPasswordToken: jest.fn(),
        },
    };
    return credentialMock;
});

jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/pekoCloud/cloud_employees', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/works', () => ({
    belongsTo: jest.fn(),
}));
describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new plan successfully without logo', async () => {
        const mockParams = { name: 'Basic Plan', price: 100 };
        const mockResponse = { id: 1, ...mockParams };

        plans.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(plans.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResponse);
    });

    it('should upload logo and create a new plan when logo is provided', async () => {
        const mockParams = { name: 'Premium Plan', price: 200, logo: 'file_data', logoFormat: 'png' };
        const mockPublicUrl = 'https://storage.com/planLogo.png';
        const mockResponse = { id: 2, ...mockParams, logo: mockPublicUrl };

        uploadFile.mockResolvedValue(mockPublicUrl);
        plans.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(uploadFile).toHaveBeenCalledWith('file_data', 'planLogo', mockParams.logoFormat);
        expect(plans.create).toHaveBeenCalledWith(expect.objectContaining({ logo: mockPublicUrl }));
        expect(result).toEqual(mockResponse);
    });

   
});
