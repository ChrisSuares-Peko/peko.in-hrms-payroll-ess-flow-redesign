const { updateCorporateUserEmail } = require('../../../use-cases/corporateUser');
const CorporateUser = require('../../../entities/corporateUser');
const mongoose = require('mongoose');

jest.mock('../../../entities/corporateUser');

describe('updateCorporateUserEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update corporate user email successfully', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const email = 'newemail@example.com';

        const mockUpdatedUser = {
            _id: userId,
            email,
            // other fields if needed
        };

        CorporateUser.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

        const result = await updateCorporateUserEmail(userId, email);

        expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(
            userId,
            { email },
            { new: true }
        );

        expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle errors gracefully', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const email = 'newemail@example.com';
        const mockError = new Error('Database error');

        CorporateUser.findByIdAndUpdate.mockRejectedValue(mockError);

        const result = await updateCorporateUserEmail(userId, email);

        expect(CorporateUser.findByIdAndUpdate).toHaveBeenCalledWith(
            userId,
            { email },
            { new: true }
        );

        expect(result).toBe(mockError);
    });
});
