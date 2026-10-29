const { changePassword } = require('../../credential');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/credential');

describe('changePassword', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it("should return 404 if the user doesn't exist", async () => {
        credential.findOne.mockResolvedValue(null);

        const result = await changePassword({ oldPassword: 'REDACTED', newPassword: 'REDACTED' }, 1);

        expect(result).toEqual({
            status: false,
            statusCode: 404,
            responseCode: '900',
            responseMessage: "Sorry, the user doesn't exist"
        });
    });

    it('should return 401 if the current password is incorrect', async () => {
        credential.findOne.mockResolvedValue({
            validatePassword: jest.fn().mockReturnValue(false)
        });

        const result = await changePassword({ oldPassword: 'REDACTED', newPassword: 'REDACTED' }, 1);

        expect(result).toEqual({
            status: false,
            statusCode: 401,
            responseCode: '902',
            responseMessage: 'Current password is incorrect'
        });
    });

    it('should return 500 if an internal server error occurs', async () => {
        credential.findOne.mockRejectedValue(new Error('Database error'));

        const result = await changePassword({ oldPassword: 'REDACTED', newPassword: 'REDACTED' }, 1);

        expect(result).toEqual({
            status: false,
            statusCode: 500,
            responseCode: '999',
            responseMessage: 'Internal server error'
        });
    });
});
