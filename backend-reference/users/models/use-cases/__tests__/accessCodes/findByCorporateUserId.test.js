const { findByCorporateUserId } = require('../../../use-cases/access_codes');
const access_codes = require('../../../entities/access_codes');

jest.mock('../../../entities/access_codes', () => ({
    findOne: jest.fn(),
}));

describe('findByCorporateUserId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an access code when a matching corporateUserId is found', async () => {
        const mockId = 123;
        const mockAccessCode = {
            id: 1,
            corporateUserId: 123,
            code: 'ACCESS123',
        };

        access_codes.findOne.mockResolvedValue(mockAccessCode);

        const result = await findByCorporateUserId(mockId);

        expect(access_codes.findOne).toHaveBeenCalledWith({
            where: { corporateUserId: mockId },
        });

        expect(result).toEqual(mockAccessCode);
    });

    it('should return null when no matching access code is found', async () => {
        const mockId = 999;

        access_codes.findOne.mockResolvedValue(null);

        const result = await findByCorporateUserId(mockId);

        expect(access_codes.findOne).toHaveBeenCalledWith({
            where: { corporateUserId: mockId },
        });

        expect(result).toBeNull();
    });

    it('should log an error and throw when database operation fails', async () => {
        const mockId = 123;
        const mockError = new Error('Database error');

        access_codes.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        await expect(findByCorporateUserId(mockId)).rejects.toThrow('Database error');

    });
});
