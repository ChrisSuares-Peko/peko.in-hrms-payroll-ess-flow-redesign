const { updateBrandingData } = require('../../systemUser'); // Adjust the path as needed
const systemUser = require('../../../entities/systemUser');
const { uploadFileToS3 } = require('../../../../utils/s3');

jest.mock('../../../entities/systemUser', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => {
    return {
        transaction: jest.fn(async () => ({
            commit: jest.fn(),
            rollback: jest.fn(),
        })),
        define: jest.fn(() => ({})),
    };
});

jest.mock('../../../entities/wallet', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
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

jest.mock('../../../../utils/s3', () => ({
    uploadFileToS3: jest.fn(),
}));

describe('updateBrandingData', () => {
  
    // beforeEach(() => {
    //     transaction = sequelize.transaction.mock.results[0].value;
    //     jest.clearAllMocks();
    // });
    

    it('should update baseUrl without uploading logos if no logos are provided', async () => {
        const mockId = 1;
        const mockUpdatedData = {
            baseUrl: 'https://example.com',
        };
        const mockSystemUserData = {
            assets: {},
            branding: {},
        };
    
        systemUser.findOne.mockResolvedValue(mockSystemUserData);
        systemUser.update.mockResolvedValue([1]);
    
        const result = await updateBrandingData(mockId, mockUpdatedData);
    
        expect(result).toEqual([1]); // Check if the update was successful
        expect(systemUser.update).toHaveBeenCalledWith(
            expect.objectContaining({
                assets: { baseUrl: 'https://example.com' }, // Ensure baseUrl is correctly passed to the update
            }),
            expect.any(Object)
        );
        expect(uploadFileToS3).not.toHaveBeenCalled(); // Ensure no file uploads were triggered
    });
    


});
