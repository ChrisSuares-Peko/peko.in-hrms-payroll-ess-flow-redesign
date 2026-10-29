const { signUpCountOfSubCorporate } = require('../../subCorporateUser');
const SubCorporateUsers = require('../../../entities/subCorporateUsers');

jest.mock('../../../entities/subCorporateUsers', () => ({
    count: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
  }));

describe('SubCorporateUser Use-Cases - signUpCountOfSubCorporate', () => {

    beforeEach(() => {
        jest.clearAllMocks(); // Clear all mocks before each test
    });

    it('should return the correct count of sub-corporate users', async () => {
        SubCorporateUsers.count.mockResolvedValue(5);
        const result = await signUpCountOfSubCorporate();
        expect(result).toBe(5);
    });

    it('should return 0 when there are no sub-corporate users', async () => {
        SubCorporateUsers.count.mockResolvedValue(0);
        const result = await signUpCountOfSubCorporate();
        expect(result).toBe(0);
    });

    it('should throw an error if the database operation fails', async () => {
        SubCorporateUsers.count.mockRejectedValue(new Error('DatabaseError'));
        await expect(signUpCountOfSubCorporate()).rejects.toThrow('Failed to get sign-up count');
    });

    it('should handle unexpected errors and throw an appropriate message', async () => {
        SubCorporateUsers.count.mockImplementation(() => {
            throw new Error('Unexpected Error');
        });
        await expect(signUpCountOfSubCorporate()).rejects.toThrow('Failed to get sign-up count');
    });

    afterAll(() => {
        jest.resetAllMocks();
    });
});

