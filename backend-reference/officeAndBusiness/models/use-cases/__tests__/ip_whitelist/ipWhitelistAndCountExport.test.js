const { ipWhitelistAndCountExport } = require("../../ip_whitelist");
const ip_whitelist = require("../../../entities/ip_whitelist");
const credential = require("../../../entities/credential");
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../../utils/sortHandle");
const { formattedDateTime } = require("../../../../utils/formatter");

jest.mock("../../../entities/ip_whitelist");
jest.mock("../../../entities/credential");
jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn(),
}));

describe("ipWhitelistAndCountExport", () => {
  const params = {
    page: 1,
    itemsPerPage: 10,
    searchText: "search",
    sort: "DESC",
    sortField: "createdAt",
  };

  const mockData = {
    count: 1,
    rows: [
      {
        ip: "127.0.0.1",
        id: 1,
        status: true,
        createdAt: new Date(),
        partnerId: 1,
      },
    ],
  };

  const mockCredentialResponse = [{ id: 1, name: "Peko" }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should find ip_whitelist, format and return", async () => {
    ip_whitelist.findAndCountAll.mockResolvedValue(mockData);
    credential.findAll.mockResolvedValue(mockCredentialResponse);

    const result = await ipWhitelistAndCountExport(params);

    expect(ip_whitelist.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { ip: { [Op.like]: `%${params.searchText}%` } },
          { partnerId: { [Op.like]: `%${params.searchText}%` } },
        ],
      },
      order: handleSortFields(params.sortField, params.sort),
      limit: params.itemsPerPage,
      offset: (params.page - 1) * params.itemsPerPage,
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      {
        Date: formattedDateTime(new Date()),
        IP: "127.0.0.1",
        "Partner Id": 1,
        "Partner Name": "Peko",
        Status: "Active",
      },
    ]);
  });

  it("should be graceful if fields are missing", async () => {
    ip_whitelist.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{}], // Missing fields
    });
    credential.findAll.mockResolvedValue([]);

    const result = await ipWhitelistAndCountExport(params);

    expect(ip_whitelist.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { ip: { [Op.like]: `%${params.searchText}%` } },
          { partnerId: { [Op.like]: `%${params.searchText}%` } },
        ],
      },
      order: handleSortFields(params.sortField, params.sort),
      limit: params.itemsPerPage,
      offset: (params.page - 1) * params.itemsPerPage,
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      {
        Date: "Not Available",
        IP: "Not Available",
        "Partner Id": "Not Available",
        "Partner Name": "Not Available",
        Status: "In Active",
      },
    ]);
  });

  it("should handle errors gracefully and return undefined", async () => {
    const mockError = new Error("Database Error");
    ip_whitelist.findAndCountAll.mockRejectedValue(mockError);
  
    const customLogMock = require("../../../../utils/loggerHelper").customLog;
    customLogMock.mockImplementation(() => {}); // Mock the logging function
  
    const result = await ipWhitelistAndCountExport(params);
  
    expect(result).toBeUndefined(); // ✅ Expecting the function to return undefined
    expect(customLogMock).toHaveBeenCalledWith(null, "error", { error: mockError.message }); // ✅ Check if error was logged
  });
  
});
