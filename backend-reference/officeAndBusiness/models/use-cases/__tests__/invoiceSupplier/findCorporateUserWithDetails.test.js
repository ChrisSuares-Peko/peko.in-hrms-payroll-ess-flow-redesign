const { findCorporateUserWithDetails } = require('../../../use-cases/invoiceSupplier');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/corporateUser', () => ({
    findOne: jest.fn(),
}));

describe('findCorporateUserWithDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return corporate user data when found', async () => {
        const mockParams = { corporateUserId: 123 };
        const mockCorporateUserData = {
            id: 123,
            name: 'Test User',
            email: 'user@test.com',
            mobileNo: '1234567890',
            credential: {},
        };

        corporateUser.findOne.mockResolvedValue(mockCorporateUserData);

        const result = await findCorporateUserWithDetails(mockParams);

        expect(corporateUser.findOne).toHaveBeenCalledWith({
            include: [{
                model: credential,
            }],
            where: {
                id: mockParams.corporateUserId,
            },
            attributes: ['id', 'name', 'email', 'mobileNo'],
            nest: true,
        });
        expect(result).toEqual(mockCorporateUserData);
    });


    it('should return false when an error occurs', async () => {
        const mockParams = { corporateUserId: 789 };
        const mockError = new Error('Database error');

        corporateUser.findOne.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findCorporateUserWithDetails(mockParams);

        expect(console.error).toHaveBeenCalledWith('Error fetching corporate user with details:', mockError.message);
        expect(result).toBe(false);
    });
});
