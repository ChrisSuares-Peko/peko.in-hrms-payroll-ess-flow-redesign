const { findAllOwners } = require("../../cloud_owners");
const cloud_owners = require("../../../../entities/pekoCloud/cloud_owners");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_owners", () => ({
  findAndCountAll: jest.fn(),
}));

describe("findAllOwners", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully retrieve owners with filters", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "ownerName";
    const sort = "ASC";
    const searchText = "John";
    const credentialId = 1;
    const subCorporateUserId = null;

    const mockOwnersData = {
      count: 1,
      rows: [{ id: 1, ownerName: "John Doe" }],
    };

    cloud_owners.findAndCountAll.mockResolvedValue(mockOwnersData);

    const result = await findAllOwners(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_owners.findAndCountAll).toHaveBeenCalledWith({
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: { credentialId: credentialId },
    });
    expect(result).toEqual({ success: true, data: mockOwnersData });
  });

  it("should successfully retrieve owners without filters", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "ownerName";
    const sort = "ASC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;

    const mockOwnersData = {
      count: 5,
      rows: [
        { id: 1, ownerName: "John Doe" },
        { id: 2, ownerName: "Jane Doe" },
      ],
    };

    cloud_owners.findAndCountAll.mockResolvedValue(mockOwnersData);

    const result = await findAllOwners(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_owners.findAndCountAll).toHaveBeenCalledWith({
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {},
    });
    expect(result).toEqual({ success: true, data: mockOwnersData });
  });

  it("should successfully retrieve owners with pagination and sorting", async () => {
    const page = 2;
    const itemsPerPage = 5;
    const sortField = "ownerName";
    const sort = "DESC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;

    const mockOwnersData = {
      count: 15,
      rows: [
        { id: 6, ownerName: "Jane Doe" },
        { id: 7, ownerName: "John Smith" },
      ],
    };

    cloud_owners.findAndCountAll.mockResolvedValue(mockOwnersData);

    const result = await findAllOwners(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_owners.findAndCountAll).toHaveBeenCalledWith({
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {},
    });
    expect(result).toEqual({ success: true, data: mockOwnersData });
  });

  it("should handle errors during retrieval", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "ownerName";
    const sort = "ASC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;

    cloud_owners.findAndCountAll.mockRejectedValue(new Error("Database error"));

    const result = await findAllOwners(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
