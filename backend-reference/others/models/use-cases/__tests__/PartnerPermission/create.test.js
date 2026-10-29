const { create } = require('../../partnerPermission');
const partnerPermission = require('../../../entities/partnerPermission');
const ErrorResponse = require('../../../../utils/error-response');

jest.mock('../../../entities/partnerPermission', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a new partner permission entry', async () => {
        const mockParams = { name: 'Test Permission', value: 'test_value' };
        const mockResult = { id: 1, ...mockParams };

        partnerPermission.create.mockResolvedValue(mockResult);

        const result = await create(mockParams);

        expect(partnerPermission.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResult);
    });

    it('should return false if the creation returns no result', async () => {
        const mockParams = { name: 'Test Permission', value: 'test_value' };

        partnerPermission.create.mockResolvedValue(null);

        const result = await create(mockParams);

        expect(partnerPermission.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(false);
    });

    it('should handle errors and return an ErrorResponse', async () => {
        const mockParams = { name: 'Test Permission', value: 'test_value' };
        const mockError = new Error('Database error');

        partnerPermission.create.mockRejectedValue(mockError);

        const result = await create(mockParams);

        expect(partnerPermission.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(
            new ErrorResponse("Something went wrong, please try again later.", 500)
        );
    });
});
