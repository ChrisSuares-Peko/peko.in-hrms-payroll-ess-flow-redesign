const OTP = require("../../../entities/commonOTP");
const { verifyOtp } = require("../../otp");

jest.mock("../../../entities/commonOTP", () => ({
  findOne: jest.fn(),
}));

describe("verifyOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error when no OTP record exists for the contact", async () => {
    OTP.findOne.mockResolvedValue(null);

    const result = await verifyOtp({
      contact: "9999999999",
      otp: "123456",
    });

    expect(OTP.findOne).toHaveBeenCalledWith({
      where: { contact: "9999999999" },
    });

    expect(result).toEqual({
      isVerified: false,
      message: "OTP is not found!",
    });
  });

  it("should return error when OTP is invalid", async () => {
    const mockRecord = {
      validateOtp: jest.fn().mockResolvedValue(false),
    };

    OTP.findOne.mockResolvedValue(mockRecord);

    const result = await verifyOtp({
      contact: "9999999999",
      otp: "111111",
    });

    expect(mockRecord.validateOtp).toHaveBeenCalledWith("111111");

    expect(result).toEqual({
      isVerified: false,
      message: "Incorrect OTP, Please enter correct OTP.",
    });
  });

  it("should verify OTP successfully when valid", async () => {
    const mockRecord = {
      validateOtp: jest.fn().mockResolvedValue(true),
    };

    OTP.findOne.mockResolvedValue(mockRecord);

    const result = await verifyOtp({
      contact: "8888888888",
      otp: "222222",
    });

    expect(result).toEqual({
      isVerified: true,
      message: "verified",
    });
  });

  it("should handle unexpected errors inside validateOtp", async () => {
    const mockRecord = {
      validateOtp: jest.fn().mockRejectedValue(new Error("Hash error")),
    };

    OTP.findOne.mockResolvedValue(mockRecord);

    const result = await verifyOtp({
      contact: "7777777777",
      otp: "333333",
    });

    expect(result).toEqual({
      isVerified: false,
      message: "Hash error",
    });
  });

  it("should handle DB failure", async () => {
    OTP.findOne.mockRejectedValue(new Error("DB failure"));

    const result = await verifyOtp({
      contact: "6666666666",
      otp: "444444",
    });

    expect(result).toEqual({
      isVerified: false,
      message: "DB failure",
    });
  });

  it("should call findOne with correct parameters", async () => {
    OTP.findOne.mockResolvedValue({
      validateOtp: jest.fn().mockResolvedValue(true),
    });

    await verifyOtp({
      contact: "1234567890",
      otp: "555555",
      context: "login",
    });

    expect(OTP.findOne).toHaveBeenCalledWith({
      where: { contact: "1234567890" },
    });
  });
});
