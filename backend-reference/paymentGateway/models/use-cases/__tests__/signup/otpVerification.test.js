const { otpVerification } = require('../../signUp');
const Otp = require('../../../entities/otp');

jest.mock('../../../entities/otp', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
}));

describe('otpVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return false when no OTP record found', async () => {
    Otp.findOne.mockResolvedValue(null);

    const result = await otpVerification('123456', 'email123', '9876543210');

    expect(result).toBe(false);
  });

  it('should return false when pin validation fails', async () => {
    const mockOtpDetail = {
      createdAt: new Date(),
      validatePin: jest.fn().mockResolvedValue(false),
      validateEmail: jest.fn().mockResolvedValue(true),
    };
    Otp.findOne.mockResolvedValue(mockOtpDetail);

    const result = await otpVerification('wrong', 'email123', '9876543210');

    expect(result).toBe(false);
  });

  it('should return false when email validation fails', async () => {
    const mockOtpDetail = {
      createdAt: new Date(),
      validatePin: jest.fn().mockResolvedValue(true),
      validateEmail: jest.fn().mockResolvedValue(false),
    };
    Otp.findOne.mockResolvedValue(mockOtpDetail);

    const result = await otpVerification('123456', 'wrong', '9876543210');

    expect(result).toBe(false);
  });

  it('should return true when OTP verified and updated', async () => {
    const mockOtpDetail = {
      createdAt: new Date(),
      validatePin: jest.fn().mockResolvedValue(true),
      validateEmail: jest.fn().mockResolvedValue(true),
    };
    Otp.findOne.mockResolvedValue(mockOtpDetail);
    Otp.update.mockResolvedValue([1]);

    const result = await otpVerification('123456', 'email123', '9876543210');

    expect(result).toBe(true);
    expect(Otp.update).toHaveBeenCalled();
  });

  it('should return false when update returns 0 rows', async () => {
    const mockOtpDetail = {
      createdAt: new Date(),
      validatePin: jest.fn().mockResolvedValue(true),
      validateEmail: jest.fn().mockResolvedValue(true),
    };
    Otp.findOne.mockResolvedValue(mockOtpDetail);
    Otp.update.mockResolvedValue([0]);

    const result = await otpVerification('123456', 'email123', '9876543210');

    expect(result).toBe(false);
  });
});
