const { createOtp, verifyOtp } = require('../../otp');
const OTP = require('../../../entities/commonOTP');

beforeEach(() => {
    jest.clearAllMocks();
    // hashOtp is set as a real function on the entity, so we need to re-mock it each time
    OTP.hashOtp = jest.fn().mockReturnValue('hashedOtp');
});

describe('createOtp', () => {
    it('should create a new OTP when no existing OTP record exists', async () => {
        OTP.findOne.mockResolvedValue(null);
        OTP.create.mockResolvedValue({ id: 1, contact: '1234567890' });

        const result = await createOtp({ contact: '1234567890', expiresInMinutes: 5 });
        expect(result).toBeDefined();
        expect(result).not.toBe(false);
        expect(OTP.create).toHaveBeenCalled();
    });

    it('should update existing OTP when record already exists', async () => {
        const mockExisting = {
            otp: 'old',
            expiresAt: new Date(),
            used: false,
            save: jest.fn().mockResolvedValue(true)
        };
        OTP.findOne.mockResolvedValue(mockExisting);

        const result = await createOtp({ contact: '1234567890', expiresInMinutes: 5 });
        expect(result).toBeDefined();
        expect(result).not.toBe(false);
        expect(mockExisting.save).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
        OTP.findOne.mockRejectedValue(new Error('DB Error'));

        const result = await createOtp({ contact: '1234567890', expiresInMinutes: 5 });
        expect(result).toBe(false);
    });

    it('should return false when contact is missing', async () => {
        const result = await createOtp({});
        expect(result).toBe(false);
    });
});

describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
        const mockRecord = {
            validateOtp: jest.fn().mockResolvedValue(true)
        };
        OTP.findOne.mockResolvedValue(mockRecord);

        const result = await verifyOtp({ contact: '1234567890', otp: '123456' });
        expect(result).toEqual({ isVerified: true, message: 'verified' });
    });

    it('should return not found when OTP record does not exist', async () => {
        OTP.findOne.mockResolvedValue(null);

        const result = await verifyOtp({ contact: '1234567890', otp: '123456' });
        expect(result).toEqual({ isVerified: false, message: 'OTP is not found!' });
    });

    it('should return invalid OTP when validation fails', async () => {
        const mockRecord = {
            validateOtp: jest.fn().mockResolvedValue(false)
        };
        OTP.findOne.mockResolvedValue(mockRecord);

        const result = await verifyOtp({ contact: '1234567890', otp: 'wrong', context: 'login' });
        expect(result).toEqual({
            isVerified: false,
            message: 'Invalid login OTP. Please make sure you have entered the correct OTP.'
        });
    });

    it('should handle errors and return error message', async () => {
        OTP.findOne.mockRejectedValue(new Error('DB Error'));

        const result = await verifyOtp({ contact: '1234567890', otp: '123456' });
        expect(result).toEqual({ isVerified: false, message: 'DB Error' });
    });
});
