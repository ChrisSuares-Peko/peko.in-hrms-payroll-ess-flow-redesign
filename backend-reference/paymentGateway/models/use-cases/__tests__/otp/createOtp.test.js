const { createOtp } = require('../../otp');
const OTP = require('../../../entities/commonOTP');

jest.mock('../../../entities/commonOTP', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  hashOtp: jest.fn().mockReturnValue('hashed_otp'),
}));

describe('otp - createOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should create new OTP when no existing record', async () => {
    OTP.findOne.mockResolvedValue(null);
    OTP.create.mockResolvedValue({ id: 1 });

    const result = await createOtp({ contact: '9876543210' });

    expect(OTP.hashOtp).toHaveBeenCalled();
    expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact: '9876543210' } });
    expect(OTP.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contact: '9876543210',
        otp: 'hashed_otp',
      })
    );
    expect(result).toBeDefined();
    expect(result).toHaveLength(6); // 6-digit OTP
  });

  it('should update existing OTP when record exists', async () => {
    const mockExisting = {
      otp: 'old_hash',
      expiresAt: new Date(),
      used: true,
      save: jest.fn().mockResolvedValue(true),
    };
    OTP.findOne.mockResolvedValue(mockExisting);

    const result = await createOtp({ contact: '9876543210' });

    expect(mockExisting.save).toHaveBeenCalled();
    expect(mockExisting.otp).toBe('hashed_otp');
    expect(mockExisting.used).toBe(false);
    expect(result).toBeDefined();
  });

  it('should return false when contact is not provided', async () => {
    const result = await createOtp({ contact: '' });

    expect(result).toBe(false);
  });

  it('should return false on error', async () => {
    OTP.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await createOtp({ contact: '9876543210' });

    expect(result).toBe(false);
  });
});
