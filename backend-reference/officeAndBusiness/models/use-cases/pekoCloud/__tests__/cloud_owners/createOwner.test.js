const { createOwner } = require("../../cloud_owners");
const cloud_owners = require("../../../../entities/pekoCloud/cloud_owners");
const ErrorResponse = require("../../../../../utils/error-response");
const { uploadFile } = require("../../../../../utils/commonUploadFile");
const { findMaximumUsageLimit } = require("../../../subscription");
const { Op } = require("sequelize");

jest.mock("../../../../entities/pekoCloud/cloud_owners", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  sum: jest.fn(),
}));

jest.mock("../../../../../utils/commonUploadFile", () => ({
  uploadFile: jest.fn(),
}));

jest.mock("../../../subscription", () => ({
  findMaximumUsageLimit: jest.fn(),
}));

describe("createOwner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully create an owner", async () => {
    const data = {
      ownerName: "John Doe",
      credentialId: 1,
      profileImageBase: "base64image",
      profileImageFormat: "png",
    };
    const user = {
      role: "CORPORATE_SUB_USER",
      subCorporateId: 2,
      username: "user",
      subCorporateUsername: "subUser",
    };

    cloud_owners.findOne.mockResolvedValue(null);
    cloud_owners.sum.mockResolvedValue(0);
    findMaximumUsageLimit.mockResolvedValue(1000);
    uploadFile.mockResolvedValue("https://s3.example.com/image.png");
    cloud_owners.create.mockResolvedValue({
      id: 1,
      profilePicture: "https://s3.example.com/image.png",
      subCorporateUserId: 2,
      ...data,
    });

    const result = await createOwner(data, user);

    expect(cloud_owners.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { ownerName: data.ownerName, credentialId: data.credentialId },
        ],
      },
    });
    expect(uploadFile).toHaveBeenCalledWith(
      data.profileImageBase,
      `corporate/${user.username}/peko-cloud/sub-user/${user.subCorporateUsername}`,
      data.profileImageFormat,
      1000
    );
    expect(cloud_owners.create).toHaveBeenCalledWith(expect.objectContaining({...data, profilePicture: "https://s3.example.com/image.png"}));
    expect(result).toEqual({
      success: true,
      data: {
        id: 1,
        profilePicture: "https://s3.example.com/image.png",
        subCorporateUserId: 2,
        ...data,
      },
    });
  });

  it("should return an error if owner already exists", async () => {
    const data = { ownerName: "John Doe", credentialId: 1 };
    const user = { role: "USER" };

    cloud_owners.findOne.mockResolvedValue({ id: 1, ...data });

    const result = await createOwner(data, user);

    expect(cloud_owners.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { ownerName: data.ownerName, credentialId: data.credentialId },
        ],
      },
    });
    expect(result).toEqual({
      success: false,
      error: "Owner with this name already exists.",
    });
  });

  it("should handle missing profile image data", async () => {
    const data = { ownerName: "John Doe", credentialId: 1 };
    const user = { role: "USER" };

    cloud_owners.findOne.mockResolvedValue(null);
    cloud_owners.sum.mockResolvedValue(0);
    cloud_owners.create.mockResolvedValue({ id: 1, ...data });

    const result = await createOwner(data, user);

    expect(uploadFile).not.toHaveBeenCalled();
    expect(cloud_owners.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ success: true, data: { id: 1, ...data } });
  });

  it("should handle profile image upload failure", async () => {
    const data = {
      ownerName: "John Doe",
      credentialId: 1,
      profileImageBase: "base64image",
      profileImageFormat: "png",
    };
    const user = { role: "USER" };

    cloud_owners.findOne.mockResolvedValue(null);
    cloud_owners.sum.mockResolvedValue(0);
    findMaximumUsageLimit.mockResolvedValue(1000);
    uploadFile.mockRejectedValue(new Error("Upload failed"));

    const result = await createOwner(data, user);

    expect(uploadFile).toHaveBeenCalledWith(
      data.profileImageBase,
      `user/unknown-user/peko-cloud`,
      data.profileImageFormat,
      1000
    );
    expect(cloud_owners.create).not.toHaveBeenCalled();
    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });

  it("should handle owner creation failure", async () => {
    const data = {
      ownerName: "John Doe",
      credentialId: 1,
      profileImageBase: "base64image",
      profileImageFormat: "png",
    };
    const user = { role: "USER" };

    cloud_owners.findOne.mockResolvedValue(null);
    cloud_owners.sum.mockResolvedValue(0);
    findMaximumUsageLimit.mockResolvedValue(1000);
    uploadFile.mockResolvedValue("https://s3.example.com/image.png");
    cloud_owners.create.mockRejectedValue(new Error("Creation failed"));

    const result = await createOwner(data, user);

    expect(uploadFile).toHaveBeenCalledWith(
      data.profileImageBase,
      `user/unknown-user/peko-cloud`,
      data.profileImageFormat,
      1000
    );
    expect(cloud_owners.create).toHaveBeenCalledWith(expect.objectContaining({ ...data, profilePicture: "https://s3.example.com/image.png" }));
    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });

  it("should handle unexpected errors", async () => {
    const data = { ownerName: "John Doe", credentialId: 1 };
    const user = { role: "USER" };

    jest.spyOn(console, "log").mockImplementation(() => {});

    const result = await createOwner(data, user);

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );

    console.log.mockRestore();
  });
});
