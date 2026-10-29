const { findAllVendors } = require("../../vendors");
const vendor = require("../../../entities/vendor");
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock("../../../entities/vendor", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

describe("findAllVendors Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch vendors with correct filtering and pagination", async () => {
    const params = {
      limit: 10,
      offset: 0,
      searchText: "Test",
      sort: "ASC",
      sortField: "vendorName",
    };
    const type = "retail";
    const expectedOrder = [["vendorName", "ASC"]];
    const expectedWhereCondition = {
      [Op.or]: [
        { id: { [Op.like]: "%Test%" } },
        { vendorName: { [Op.like]: "%Test%" } },
        { apiUrl: { [Op.like]: "%Test%" } },
        { type: { [Op.like]: "%Test%" } },
      ],
      type: "retail",
    };

    const mockResult = { count: 2, rows: [{ id: 1, vendorName: "Test Vendor" }] };

    handleSortFields.mockReturnValue(expectedOrder);
    vendor.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllVendors(params, type);

    expect(handleSortFields).toHaveBeenCalledWith("vendorName", "ASC");
    expect(vendor.findAndCountAll).toHaveBeenCalledWith({
      where: expectedWhereCondition,
      order: expectedOrder,
      limit: 10,
      offset: 0,
    });
    expect(result).toEqual(mockResult);
  });

  it("should fetch vendors without type filtering if type is not provided", async () => {
    const params = {
      limit: 5,
      offset: 5,
      searchText: "Test",
      sort: "DESC",
      sortField: "id",
    };
    const expectedOrder = [["id", "DESC"]];
    const expectedWhereCondition = {
      [Op.or]: [
        { id: { [Op.like]: "%Test%" } },
        { vendorName: { [Op.like]: "%Test%" } },
        { apiUrl: { [Op.like]: "%Test%" } },
        { type: { [Op.like]: "%Test%" } },
      ],
    };

    const mockResult = { count: 1, rows: [{ id: 2, vendorName: "Test Vendor 2" }] };

    handleSortFields.mockReturnValue(expectedOrder);
    vendor.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllVendors(params, null);

    expect(handleSortFields).toHaveBeenCalledWith("id", "DESC");
    expect(vendor.findAndCountAll).toHaveBeenCalledWith({
      where: expectedWhereCondition,
      order: expectedOrder,
      limit: 5,
      offset: 5,
    });
    expect(result).toEqual(mockResult);
  });

  it("should handle errors and throw an exception", async () => {
    const params = { searchText: "ErrorTest" };
    const expectedError = new Error("Database failure");

    vendor.findAndCountAll.mockRejectedValue(expectedError);

    await expect(findAllVendors(params, "retail")).rejects.toEqual({ message: "Something went wrong" });

    expect(vendor.findAndCountAll).toHaveBeenCalled();
  });
});
