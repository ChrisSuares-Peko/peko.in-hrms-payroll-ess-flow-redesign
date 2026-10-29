const { createOtp } = require('../../otp'); // Update with the correct path to your service
const OTP = require('../../../entities/commonOTP');

jest.mock('../../../entities/commonOTP', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    hashOtp: jest.fn(),
  }));
  
  describe('createOtp', () => {
    const mockOtp = '289999'; // Use a fixed OTP value for testing
    const mockOtpHash = 'hashedOtp';
  
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(Math, 'random').mockReturnValue(0.21111); // Mock Math.random to return a predictable value
      OTP.hashOtp.mockReturnValue(mockOtpHash);
    });
  
    it('should create a new OTP if none exists for the contact', async () => {
      const contact = '1234567890';
      
      OTP.findOne.mockResolvedValue(null);
      OTP.create.mockResolvedValue();
  
      const result = await createOtp({ contact });
  
      expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact } });
      expect(OTP.create).toHaveBeenCalledWith({
        contact,
        otp: mockOtpHash,
        expiresAt: expect.any(Date),
      });
      expect(result).toBe(mockOtp);
    });
  
  
    it('should update the existing OTP if one exists for the contact', async () => {
        const contact = '1234567890';
        const existingOtp = {
          otp: 'oldHash',
          expiresAt: new Date(),
          used: false,
          save: jest.fn(),
        };
    
        OTP.findOne.mockResolvedValue(existingOtp);
    
        const result = await createOtp({ contact });
    
        expect(OTP.findOne).toHaveBeenCalledWith({ where: { contact } });
        expect(existingOtp.otp).toBe(mockOtpHash);
        expect(existingOtp.expiresAt).toBeInstanceOf(Date);
        expect(existingOtp.used).toBe(false);
        expect(existingOtp.save).toHaveBeenCalled();
        expect(result).toBe(mockOtp);
      });
      it('should handle errors gracefully', async () => {
        const contact = '1234567890';
        const error = new Error('Database error');
    
        OTP.findOne.mockRejectedValue(error);
    
        const result = await createOtp({ contact });
    
        expect(result).toBe(false);
      });
    
      it('should return false if no contact is provided', async () => {
        const result = await createOtp({ contact: '' });
    
        expect(result).toBe(false);
      });
    });