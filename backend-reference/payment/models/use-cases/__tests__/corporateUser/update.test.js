const { uploadFile } = require("../../../../utils/commonUploadFile");
const corporateUser = require("../../../entities/corporateUser");
const { update } = require("../../corporateUser");

jest.mock("../../../entities/corporateUser", () => ({
    update: jest.fn(),
}));

jest.mock("../../../../utils/commonUploadFile",()=>({
  uploadFile:jest.fn()
}));

describe("update corporate user service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should upload profile image and return logo in result", async () => {
    uploadFile.mockResolvedValue("https://cdn.com/logo.png");

    corporateUser.update.mockResolvedValue([1]);

    const params = { corporateId: "CORP123" };
    const data = {
      profileImageBase: "base64-data",
      profileImageFormat: "png",
      sendMfaCodeToAuthApp: true
    };

    const result = await update(params, { ...data });

    expect(uploadFile).toHaveBeenCalledWith("base64-data", "profile", "png");
    expect(corporateUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        logo: "https://cdn.com/logo.png",
        isMFA: true
      }),
      { where: { credentialId: "CORP123" } }
    );

    expect(result).toEqual({
      result: "https://cdn.com/logo.png",
      docs: { logo: "https://cdn.com/logo.png" }
    });
  });

  test("should upload KYC documents and set kycStatus = underReview", async () => {
    uploadFile.mockResolvedValue("https://cdn.com/kyc.png");
    corporateUser.update.mockResolvedValue([1]);

    const params = { corporateId: "CORP123" };
    const data = {
      panDoc: "base64-pan",
      panFormat: "jpg",
      gstDoc: "base64-gst",
      gstFormat: "png"
    };

    const result = await update(params, { ...data });

    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(uploadFile).toHaveBeenCalledWith("base64-pan", "kyc", "jpg");
    expect(uploadFile).toHaveBeenCalledWith("base64-gst", "kyc", "png");

    expect(corporateUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        panDoc: "https://cdn.com/kyc.png",
        gstDoc: "https://cdn.com/kyc.png",
        kycStatus: "underReview"
      }),
      { where: { credentialId: "CORP123" } }
    );

    expect(result).toEqual({
      result: [1],
      docs: {
        panDoc: "https://cdn.com/kyc.png",
        gstDoc: "https://cdn.com/kyc.png"
      }
    });
  });

  test("should handle MFA flags correctly", async () => {
    corporateUser.update.mockResolvedValue([1]);

    const params = { corporateId: "CORP123" };
    const data = {
      sendMfaCodeToAuthApp: false,
      sendMfaCodeToEmail: true,
      sendMfaCodeToPhone: false
    };

    const result = await update(params, { ...data });

    expect(corporateUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ isMFA: true }),
      { where: { credentialId: "CORP123" } }
    );

    expect(result).toEqual({ result: [1], docs: {} });
  });

  test("should return result array when no logo exists", async () => {
    corporateUser.update.mockResolvedValue([1]);

    const params = { corporateId: "CORP123" };
    const data = {};

    const result = await update(params, { ...data });

    expect(result).toEqual({
      result: [1],
      docs: {}
    });
  });

  test("should throw if uploadFile fails", async () => {
    uploadFile.mockRejectedValue(new Error("Upload failed"));

    const params = { corporateId: "CORP123" };
    const data = {
      panDoc: "base64",
      panFormat: "jpg"
    };

    await expect(update(params, { ...data })).rejects.toThrow("Upload failed");
  });

});
