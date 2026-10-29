const OTP = require("../../../entities/commonOTP");
const { verifyOtp } = require("../../otp");

jest.mock("../../../entities/commonOTP", () => ({
    findOne: jest.fn(),
    validateOtp: jest.fn(),
}));

describe('verifyOtp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.error = jest.fn(); // Mock console.error
        console.log = jest.fn(); // Mock console.log
    });

    test('should verify OTP successfully when valid', async () => {
        const contact = 'test@example.com';
        const otp = '123456';
        const otpRecord = {
            validateOtp: jest.fn().mockResolvedValue(true), // Mock successful OTP validation
        };

        OTP.findOne.mockResolvedValue(otpRecord);

        const result = await verifyOtp({ contact, otp });

        expect(result).toEqual({
            isVerified: true,
            message: 'verified'
        });
        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact } });
        expect(otpRecord.validateOtp).toHaveBeenCalledWith(otp);
    });

    test('should return not found if OTP record is not found', async () => {
        const contact = 'test@example.com';
        const otp = '123456';

        OTP.findOne.mockResolvedValue(null); // Simulate no OTP record

        const result = await verifyOtp({ contact, otp });

        expect(result).toEqual({
            isVerified: false,
            message: 'OTP is not found!'
        });
        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact } });
    });

    test('should return invalid if OTP is incorrect', async () => {
        const contact = 'test@example.com';
        const otp = '123456';
        const otpRecord = {
            validateOtp: jest.fn().mockResolvedValue(false), // Mock failed OTP validation
        };

        OTP.findOne.mockResolvedValue(otpRecord);

        const result = await verifyOtp({ contact, otp });

        expect(result).toEqual({
            isVerified: false,
            message: 'Invalid  OTP. Please make sure you have entered the correct OTP.'
        });
        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact } });
        expect(otpRecord.validateOtp).toHaveBeenCalledWith(otp);
    });

    test('should handle errors gracefully', async () => {
        const contact = 'test@example.com';
        const otp = '123456';
        const errorMessage = 'Database error';

        OTP.findOne.mockRejectedValue(new Error(errorMessage)); // Simulate an error

        const result = await verifyOtp({ contact, otp });

        expect(result).toEqual({
            isVerified: false,
            message: errorMessage
        });
        expect(console.error).toHaveBeenCalledWith('Error while verifying OTP:', expect.any(Error));
    });
});
