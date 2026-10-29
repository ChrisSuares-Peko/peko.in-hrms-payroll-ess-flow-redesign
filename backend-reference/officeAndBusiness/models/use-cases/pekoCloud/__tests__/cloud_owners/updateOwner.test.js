const { updateOwner } = require("../../cloud_owners");
const cloud_owners = require("../../../../entities/pekoCloud/cloud_owners");
const ErrorResponse = require("../../../../../utils/error-response");
const { uploadFile, deleteFile } = require("../../../../../utils/commonUploadFile");
const { uploadFileEncryptedToS3, deleteEncryptedFromS3 } = require("../../../../../utils/s3");
const { findMaximumUsageLimit } = require("../../../subscription");

jest.mock("../../../../entities/pekoCloud/cloud_owners", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
  sum: jest.fn(),
}));

jest.mock("../../../../../utils/commonUploadFile", () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
}));

jest.mock("../../../../../utils/s3", () => ({
  uploadFileEncryptedToS3: jest.fn(),
  deleteEncryptedFromS3: jest.fn(),
}));

jest.mock("../../../subscription", () => ({
  findMaximumUsageLimit: jest.fn(),
}));

describe("updateOwner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update an owner with profile picture and documents", async () => {
    const id = 1;
    const newData = {
      profileImageBase: "base64image",
      profileImageFormat: "png",
      passport: { documentBase: "passportBase64", documentFormat: "pdf" },
    };
    const user = {
      role: "CORPORATE_SUB_USER",
      username: "user",
      subCorporateUsername: "subUser",
      subCorporateId: 2,
      corporateId: 1,
    };

    const mockOwner = {
      id,
      profilePicture: "https://s3.example.com/oldProfile.png",
      passport: { document: "https://s3.example.com/oldPassport.pdf" },
    };

    const maximumStorageAccess = 1000;

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    cloud_owners.sum.mockResolvedValue(0);
    findMaximumUsageLimit.mockResolvedValue(maximumStorageAccess);
    uploadFileEncryptedToS3.mockResolvedValue("https://s3.example.com/newPassport.pdf");
    uploadFile.mockResolvedValue("https://s3.example.com/newProfile.png");
    deleteEncryptedFromS3.mockResolvedValue();
    deleteFile.mockResolvedValue();
    cloud_owners.update.mockResolvedValue([1]);

    const result = await updateOwner(id, newData, user);

    expect(cloud_owners.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(deleteEncryptedFromS3).toHaveBeenCalledWith("https://s3.example.com/oldPassport.pdf");
    expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
      "passportBase64",
      `corporate/${user.username}/peko-cloud/sub-user/${user.subCorporateUsername}`,
      "pdf",
      maximumStorageAccess
    );
    expect(uploadFile).toHaveBeenCalledWith(
      newData.profileImageBase,
      `corporate/${user.username}/peko-cloud/sub-user/${user.subCorporateUsername}`,
      newData.profileImageFormat,
      maximumStorageAccess
    );
    expect(cloud_owners.update).toHaveBeenCalledWith(
      { ...newData, profilePicture: "https://s3.example.com/newProfile.png" },
      { where: { id } }
    );
    expect(result).toEqual({ success: true, data: {} });
  });

  it("should handle missing owner", async () => {
    const id = 1;
    const newData = { profileImageBase: "base64image", profileImageFormat: "png" };
    const user = { role: "USER" };

    cloud_owners.findOne.mockResolvedValue(null);

    const result = await updateOwner(id, newData, user);

    expect(cloud_owners.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual({
      success: false,
      error: "owner is not existing with the given details",
    });
  });

  it("should handle failure during document upload", async () => {
    const id = 1;
    const newData = {
      passport: { documentBase: "passportBase64", documentFormat: "pdf" },
    };
    const user = { role: "USER", corporateId: 1 };

    const mockOwner = { id, passport: { document: "https://s3.example.com/oldPassport.pdf" } };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    findMaximumUsageLimit.mockResolvedValue(1000);
    uploadFileEncryptedToS3.mockRejectedValue(new Error("Upload failed"));

    const result = await updateOwner(id, newData, user);

    expect(uploadFileEncryptedToS3).toHaveBeenCalledWith(
      newData.passport.documentBase,
      `user/unknown-user/peko-cloud`,
      newData.passport.documentFormat,
      1000
    );
    expect(cloud_owners.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });

  it("should handle failure during profile image upload", async () => {
    const id = 1;
    const newData = {
      profileImageBase: "base64image",
      profileImageFormat: "png",
    };
    const user = { role: "USER", corporateId: 1 };

    const mockOwner = { id, profilePicture: "https://s3.example.com/oldProfile.png" };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    cloud_owners.sum.mockResolvedValue(0);
    findMaximumUsageLimit.mockResolvedValue(1000);
    deleteFile.mockResolvedValue();
    uploadFile.mockRejectedValue(new Error("Upload failed"));

    const result = await updateOwner(id, newData, user);

    expect(uploadFile).toHaveBeenCalledWith(
      newData.profileImageBase,
      `user/unknown-user/peko-cloud`,
      newData.profileImageFormat,
      1000
    );
    expect(cloud_owners.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });

  it("should handle failure during owner update", async () => {
    const id = 1;
    const newData = { profileImageBase: "base64image", profileImageFormat: "png" };
    const user = { role: "USER", corporateId: 1 };

    const mockOwner = { id, profilePicture: "https://s3.example.com/oldProfile.png" };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    cloud_owners.sum.mockResolvedValue(0);
    findMaximumUsageLimit.mockResolvedValue(1000);
    deleteFile.mockResolvedValue();
    uploadFile.mockResolvedValue("https://s3.example.com/newProfile.png");
    cloud_owners.update.mockResolvedValue([0]);

    const result = await updateOwner(id, newData, user);

    expect(cloud_owners.update).toHaveBeenCalledWith(
      expect.objectContaining({ profilePicture: "https://s3.example.com/newProfile.png" }),
      { where: { id } }
    );
    expect(result).toEqual({
      success: false,
      error: "something went wrong while updating the owner",
    });
  });

  it("should handle unexpected errors", async () => {
    const id = 1;
    const newData = { profileImageBase: "base64image", profileImageFormat: "png" };
    const user = { role: "USER" };

    cloud_owners.findOne.mockRejectedValue(new Error("Unexpected error"));

    const result = await updateOwner(id, newData, user);

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });
});
