const OTP = require("../../../entities/commonOTP");
const { createOtp } = require("../../otp");

jest.mock("../../../entities/commonOTP", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  hashOtp: jest.fn().mockReturnValue("hashed-otp"),
}));

describe("createOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2024-01-01T10:00:00Z").getTime());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should create a new OTP when none exists", async () => {
    OTP.findOne.mockResolvedValue(null);
    OTP.create.mockResolvedValue(true);

    const result = await createOtp({ contact: "9876543210" });

    expect(typeof result).toBe("string");
    expect(result.length).toBe(6);

    expect(OTP.hashOtp).toHaveBeenCalledWith(result);

    expect(OTP.create).toHaveBeenCalledWith({
      contact: "9876543210",
      otp: "hashed-otp",
      expiresAt: expect.any(Date),
    });
  });

  it("should update existing OTP when one already exists", async () => {
    const mockExisting = {
      otp: null,
      expiresAt: null,
      used: true,
      save: jest.fn(),
    };

    OTP.findOne.mockResolvedValue(mockExisting);

    const result = await createOtp({ contact: "9999999999" });

    expect(typeof result).toBe("string");
    expect(result.length).toBe(6);

    expect(OTP.hashOtp).toHaveBeenCalledWith(result);

    expect(mockExisting.otp).toBe("hashed-otp");
    expect(mockExisting.used).toBe(false);
    // Default expiresInMinutes is 2, so 10:00 + 2 = 10:02
    expect(mockExisting.expiresAt).toEqual(new Date("2024-01-01T10:02:00Z"));

    expect(mockExisting.save).toHaveBeenCalled();
  });

  it("should return false if OTP DB operations fail", async () => {
    OTP.findOne.mockRejectedValue(new Error("DB error"));

    const result = await createOtp({ contact: "8888888888" });

    expect(result).toBe(false);
  });

  it("should return a different OTP every time", async () => {
    OTP.findOne.mockResolvedValue(null);

    const otp1 = await createOtp({ contact: "9000000000" });
    const otp2 = await createOtp({ contact: "9000000000" });

    expect(otp1).not.toBe(otp2);
  });

  it("should return false if contact is missing", async () => {
    // Source code throws 'A valid contact is required' when !contact,
    // which is caught and returns false
    const result = await createOtp({});

    expect(result).toBe(false);
    // findOne should NOT have been called since the error is thrown before it
    expect(OTP.findOne).not.toHaveBeenCalled();
  });

  it("should correctly set expiresAt to +2 minutes (default)", async () => {
    OTP.findOne.mockResolvedValue(null);
    OTP.create.mockResolvedValue(true);

    await createOtp({ contact: "1234567890" });

    const expiresArg = OTP.create.mock.calls[0][0].expiresAt;

    // Default expiresInMinutes is 2
    expect(expiresArg.toISOString()).toBe("2024-01-01T10:02:00.000Z");
  });
});
