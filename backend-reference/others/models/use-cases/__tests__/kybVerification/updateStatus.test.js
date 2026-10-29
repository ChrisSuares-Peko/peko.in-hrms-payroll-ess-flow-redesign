const { updateStatus } = require('../../kybVerification');
const corporateUser = require('../../../entities/corporateUser'); 

jest.mock('../../../entities/corporateUser'); 

describe('updateStatus', () => {
  beforeEach(() => {
    corporateUser.findOne.mockClear();
  });

  it('should successfully update verification status', async () => {
    // Mock user data
    const mockUser = {
      id: 1,
      gstVerified: false,
      panVerified: false,
      save: jest.fn().mockResolvedValue(true), // Mock save function
    };

    corporateUser.findOne.mockResolvedValue(mockUser); // Mock finding a user

    const params = {
      corporateUserId: 1,
      gstVerified: true,
      panVerified: true,
    };

    const result = await updateStatus(params);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Verification status updated successfully");
    expect(result.data.gstVerified).toBe(true);
    expect(result.data.panVerified).toBe(true);
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { id: params.corporateUserId },
    });
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should return error when corporate user is not found', async () => {
    corporateUser.findOne.mockResolvedValue(null); // Simulate not finding a user

    const params = {
      corporateUserId: 999, // Invalid user ID
    };

    const result = await updateStatus(params);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Corporate user not found");
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { id: params.corporateUserId },
    });
  });

  it('should handle errors gracefully', async () => {
    corporateUser.findOne.mockRejectedValue(new Error("Database error")); // Simulate database error

    const params = {
      corporateUserId: 1,
    };

    await expect(updateStatus(params)).rejects.toThrow("Internal Server Error");
  });

  it('should update only provided values', async () => {
    const mockUser = {
      id: 1,
      gstVerified: false,
      panVerified: false,
      save: jest.fn().mockResolvedValue(true),
    };

    corporateUser.findOne.mockResolvedValue(mockUser);

    const params = {
      corporateUserId: 1,
      gstVerified: true, // Only gstVerified is provided
    };

    const result = await updateStatus(params);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Verification status updated successfully");
    expect(result.data.gstVerified).toBe(true); // gstVerified should be updated
    expect(result.data.panVerified).toBe(false); // panVerified should not be updated
    expect(corporateUser.findOne).toHaveBeenCalledWith({
      where: { id: params.corporateUserId },
    });
    expect(mockUser.save).toHaveBeenCalled();
  });
});
