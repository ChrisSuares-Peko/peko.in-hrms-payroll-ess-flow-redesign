const { deleteOwner } = require("../../cloud_owners");
const cloud_owners = require("../../../../entities/pekoCloud/cloud_owners");
const ErrorResponse = require("../../../../../utils/error-response");
const { deleteFile } = require("../../../../../utils/commonUploadFile");
const { deleteEncryptedFromS3 } = require("../../../../../utils/s3");

jest.mock("../../../../entities/pekoCloud/cloud_owners", () => ({
  findOne: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock("../../../../../utils/commonUploadFile", () => ({
  deleteFile: jest.fn(),
}));

jest.mock("../../../../../utils/s3", () => ({
  deleteEncryptedFromS3: jest.fn(),
}));

describe("deleteOwner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully delete an owner with documents and profile picture", async () => {
    const id = 1;
    const mockOwner = {
      id,
      passport: { document: "https://s3.example.com/passport.pdf" },
      profilePicture: "https://s3.example.com/profile.png",
    };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    deleteEncryptedFromS3.mockResolvedValue();
    deleteFile.mockResolvedValue();
    cloud_owners.destroy.mockResolvedValue(1);

    const result = await deleteOwner(id);

    expect(cloud_owners.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(deleteEncryptedFromS3).toHaveBeenCalledWith("https://s3.example.com/passport.pdf");
    expect(deleteFile).toHaveBeenCalledWith("https://s3.example.com/profile.png");
    expect(cloud_owners.destroy).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual({ success: true, data: {} });
  });

  it("should handle owner not existing", async () => {
    const id = 1;

    cloud_owners.findOne.mockResolvedValue(null);

    const result = await deleteOwner(id);

    expect(cloud_owners.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual({
      success: false,
      error: "owner is not existing with the given details",
    });
  });

  it("should handle failure during document deletion", async () => {
    const id = 1;
    const mockOwner = {
      id,
      passport: { document: "https://s3.example.com/passport.pdf" },
    };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    deleteEncryptedFromS3.mockRejectedValue(new Error("Delete failed"));
    cloud_owners.destroy.mockResolvedValue(1);

    const result = await deleteOwner(id);

    expect(deleteEncryptedFromS3).toHaveBeenCalledWith("https://s3.example.com/passport.pdf");
    expect(cloud_owners.destroy).not.toHaveBeenCalled();
    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle failure during profile picture deletion", async () => {
    const id = 1;
    const mockOwner = {
      id,
      profilePicture: "https://s3.example.com/profile.png",
    };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    deleteFile.mockRejectedValue(new Error("Delete failed"));
    cloud_owners.destroy.mockResolvedValue(1);

    const result = await deleteOwner(id);

    expect(deleteFile).toHaveBeenCalledWith("https://s3.example.com/profile.png");
    expect(cloud_owners.destroy).not.toHaveBeenCalled();
    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle failure during owner deletion", async () => {
    const id = 1;
    const mockOwner = { id };

    cloud_owners.findOne.mockResolvedValue(mockOwner);
    deleteEncryptedFromS3.mockResolvedValue();
    deleteFile.mockResolvedValue();
    cloud_owners.destroy.mockResolvedValue(0);

    const result = await deleteOwner(id);

    expect(cloud_owners.destroy).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual({
      success: false,
      error: "something went wrong while deleting the owner",
    });
  });

  it("should handle unexpected errors", async () => {
    const id = 1;

    cloud_owners.findOne.mockRejectedValue(new Error("Unexpected error"));

    const result = await deleteOwner(id);

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });
});
