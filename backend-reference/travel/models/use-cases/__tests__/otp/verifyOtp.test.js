const { verifyOtp } = require('../../../use-cases/otp');
const OTP = require('../../../entities/commonOTP');

jest.mock('../../../entities/commonOTP', () => ({
    findOne: jest.fn(),
}));

describe('verifyOtp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should verify OTP successfully', async () => {
        const mockReq = { contact: '1234567890', otp: '123456' };
        const mockOtpRecord = {
            validateOtp: jest.fn().mockResolvedValue(true),
        };

        OTP.findOne.mockResolvedValue(mockOtpRecord);

        const result = await verifyOtp(mockReq);

        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(mockOtpRecord.validateOtp).toHaveBeenCalledWith(mockReq.otp);
        expect(result).toEqual({ isVerified: true, message: 'verified' });
    });

    it('should return an error if OTP record is not found', async () => {
        const mockReq = { contact: '1234567890', otp: '123456' };

        OTP.findOne.mockResolvedValue(null);

        const result = await verifyOtp(mockReq);

        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(result).toEqual({ isVerified: false, message: 'OTP is not found!' });
    });

    it('should return an error if OTP is invalid', async () => {
        const mockReq = { contact: '1234567890', otp: '123456' };
        const mockOtpRecord = {
            validateOtp: jest.fn().mockResolvedValue(false),
        };

        OTP.findOne.mockResolvedValue(mockOtpRecord);

        const result = await verifyOtp(mockReq);

        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(mockOtpRecord.validateOtp).toHaveBeenCalledWith(mockReq.otp);
        expect(result).toEqual({ isVerified: false, message: 'Invalid  OTP. Please make sure you have entered the correct OTP.' });
    });

    it('should handle and return errors properly', async () => {
        const mockReq = { contact: '1234567890', otp: '123456' };
        const mockError = new Error('Database error');

        OTP.findOne.mockRejectedValue(mockError);

        console.error = jest.fn(); // Mock console.error to suppress error logs
        console.log = jest.fn();   // Mock console.log to suppress logs

        const result = await verifyOtp(mockReq);

        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(console.error).toHaveBeenCalledWith("Error while verifying OTP:", mockError);
        expect(console.log).toHaveBeenCalledWith(mockError.message);
        expect(result).toEqual({ isVerified: false, message: mockError.message });
    });
});
