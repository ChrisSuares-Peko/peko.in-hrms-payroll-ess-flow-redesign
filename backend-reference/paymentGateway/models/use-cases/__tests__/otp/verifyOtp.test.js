const { verifyOtp } = require('../../otp');
const OTP = require('../../../entities/commonOTP');

jest.mock('../../../entities/commonOTP', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  hashOtp: jest.fn(),
}));

describe('otp - verifyOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return not found when no OTP record exists', async () => {
    OTP.findOne.mockResolvedValue(null);

    const result = await verifyOtp({ contact: '9876543210', otp: '123456' });

    expect(result).toEqual({
      isVerified: false,
      message: 'OTP is not found!',
    });
  });

  it('should return invalid when OTP does not match', async () => {
    const mockRecord = {
      validateOtp: jest.fn().mockResolvedValue(false),
    };
    OTP.findOne.mockResolvedValue(mockRecord);

    const result = await verifyOtp({ contact: '9876543210', otp: 'wrong' });

    expect(result).toEqual({
      isVerified: false,
      message: expect.stringContaining('Invalid'),
    });
  });

  it('should return verified when OTP matches', async () => {
    const mockRecord = {
      validateOtp: jest.fn().mockResolvedValue(true),
    };
    OTP.findOne.mockResolvedValue(mockRecord);

    const result = await verifyOtp({ contact: '9876543210', otp: '123456' });

    expect(result).toEqual({
      isVerified: true,
      message: 'verified',
    });
  });

  it('should include context in error message when provided', async () => {
    const mockRecord = {
      validateOtp: jest.fn().mockResolvedValue(false),
    };
    OTP.findOne.mockResolvedValue(mockRecord);

    const result = await verifyOtp({ contact: '9876543210', otp: 'wrong', context: 'email' });

    expect(result.message).toContain('email');
  });

  it('should handle errors and return error response', async () => {
    OTP.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await verifyOtp({ contact: '9876543210', otp: '123456' });

    expect(result).toEqual({
      isVerified: false,
      message: 'DB Error',
    });
  });
});
