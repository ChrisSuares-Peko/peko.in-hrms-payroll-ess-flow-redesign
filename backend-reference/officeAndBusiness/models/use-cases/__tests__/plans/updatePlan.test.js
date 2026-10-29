const { updatePlan } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/plans', () => ({
    update: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('updatePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a plan successfully without changing the logo', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Plan' };
        const mockResponse = [1]; // 1 row affected

        plans.update.mockResolvedValue(mockResponse);

        const result = await updatePlan(mockParams, mockData);

        expect(plans.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should upload logo and update a plan when logo is provided', async () => {
        const mockParams = { id: 2 };
        const mockData = { logo: 'file_data', logoFormat: 'png' };
        const mockPublicUrl = 'https://storage.com/planLogo.png';
        const mockResponse = [1];

        uploadFile.mockResolvedValue(mockPublicUrl);
        plans.update.mockResolvedValue(mockResponse);

        const result = await updatePlan(mockParams, mockData);

        expect(uploadFile).toHaveBeenCalledWith('file_data', 'planLogo', mockData.logoFormat);
        expect(plans.update).toHaveBeenCalledWith(expect.objectContaining({ logo: mockPublicUrl }), { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return [0] when no records are updated', async () => {
        const mockParams = { id: 3 };
        const mockData = { name: 'No Change Plan' };
        plans.update.mockResolvedValue([0]);

        const result = await updatePlan(mockParams, mockData);

        expect(result).toEqual([0]);
    });

    it('should throw an error when update fails', async () => {
        const mockParams = { id: 4 };
        const mockData = { name: 'Error Plan' };
        const mockError = new Error('Database error');

        plans.update.mockRejectedValue(mockError);

        await expect(updatePlan(mockParams, mockData)).rejects.toThrow('Database error');
    });
});
