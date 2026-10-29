const crypto = require('crypto');
const { createOtp } = require('../../../use-cases/otp');
const OTP = require('../../../entities/commonOTP');

jest.mock('../../../entities/commonOTP', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    hashOtp: jest.fn(),
    generateOtp: jest.fn(), 
}));

describe('createOtp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(crypto, 'randomInt').mockReturnValue(211110);
    });

    it('should return false if contact is not provided', async () => {
        const mockReq = { contact: undefined };
        console.error = jest.fn();
        
        const result = await createOtp(mockReq);
        expect(result).toBe(false);
    });

   it('should create a new OTP if none exists', async () => {
        const mockReq = { contact: '1234567890' };
        const mockOtp = '211110';  // Expected OTP value
        const mockOtpHash = 'hashedOtp';  // Mocked hashed OTP

        OTP.findOne.mockResolvedValue(null);
        OTP.hashOtp.mockReturnValue(mockOtpHash);  // Mock hashOtp to return a consistent hash
        OTP.create.mockResolvedValue(mockOtp);

        const result = await createOtp(mockReq);
        
        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(OTP.hashOtp).toHaveBeenCalledWith(mockOtp);  // Ensure hashOtp was called with the generated OTP
        expect(OTP.create).toHaveBeenCalledWith({
            contact: mockReq.contact,
            otp: mockOtpHash,
            expiresAt: expect.any(Date),
        });
        expect(result).toEqual(mockOtp);
    });


    it('should update an existing OTP if one exists', async () => {
        const mockReq = { contact: '1234567890' };
        const mockOtp = '211110';  // Expected OTP value
        const mockOtpHash = 'hashedOtp';
        const mockExistingOtp = {
            otp: 'oldOtp',  // Existing OTP
            expiresAt: new Date(),  // Set expiration to current date for the test
            used: true,
            save: jest.fn().mockResolvedValue({}),
        };

        OTP.findOne.mockResolvedValue(mockExistingOtp);
        OTP.hashOtp.mockReturnValue(mockOtpHash);  // Ensure hashOtp is mocked consistently

        const result = await createOtp(mockReq);

        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(OTP.hashOtp).toHaveBeenCalledWith(mockOtp);  // Ensure hashOtp was called with the expected OTP
        expect(mockExistingOtp.otp).toEqual(mockOtpHash);  // Check if the OTP was updated correctly
        expect(mockExistingOtp.expiresAt).toBeInstanceOf(Date);
        expect(mockExistingOtp.used).toBe(false);  // Verify the OTP is marked as unused
        expect(mockExistingOtp.save).toHaveBeenCalled();
        expect(result).toEqual(mockOtp);
    });

    it('should return false and log an error if an error occurs', async () => {
        const mockReq = { contact: '1234567890' };
        const mockError = new Error('Database error');

        OTP.findOne.mockRejectedValue(mockError);

        console.error = jest.fn();

        const result = await createOtp(mockReq);

        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: mockReq.contact } });
        expect(console.error).toHaveBeenCalledWith("Error while creating/updating OTP:", mockError);
        expect(result).toBe(false);
    });
});
