const ip_whitelist = require("../../../entities/ip_whitelist");
const credential = require("../../../entities/credential");
const { findAllIps } = require("../../ip_whitelist");

jest.mock("../../../entities/ip_whitelist", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(() => [["createdAt", "DESC"]]),
}));


describe("findAllIps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return data when valid params are provided", async () => {
    const mockData = {
      count: 2,
      rows: [
        { ip: "192.168.1.1", partnerId: 1 },
        { ip: "192.168.1.2", partnerId: 2 },
      ],
    };

    ip_whitelist.findAndCountAll.mockResolvedValue(mockData);

    credential.findAll.mockResolvedValue([
      { id: 1, name: "Partner 1" },
      { id: 2, name: "Partner 2" },
    ]);

    const result = await findAllIps({
      page: 1,
      itemsPerPage: 10,
      searchText: "",
      sort: "desc",
      sortField: "createdAt",
      from: "",
      to: "",
      partnerId: null,
    });

    expect(result).toEqual(mockData);
    expect(ip_whitelist.findAndCountAll).toHaveBeenCalled();
    expect(credential.findAll).toHaveBeenCalled();
  });

  it("should apply sorting and pagination correctly", async () => {
    const mockData = {
      count: 5,
      rows: [
        { ip: "192.168.1.1", partnerId: 1 },
        { ip: "192.168.1.2", partnerId: 2 },
      ],
    };

    ip_whitelist.findAndCountAll.mockResolvedValue(mockData);

    credential.findAll.mockResolvedValue([
      { id: 1, name: "Partner 1" },
      { id: 2, name: "Partner 2" },
    ]);

    const result = await findAllIps({
      page: 2,
      itemsPerPage: 2,
      searchText: "",
      sort: "desc",
      sortField: "createdAt",
      from: "",
      to: "",
      partnerId: null,
    });

    expect(result).toEqual(mockData);
    expect(ip_whitelist.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 2,
        order: [["createdAt", "DESC"]],
      })
    );
  });

  it("should filter by partnerId when provided", async () => {
    const mockData = {
      count: 1,
      rows: [{ ip: "192.168.1.1", partnerId: 1 }],
    };

    ip_whitelist.findAndCountAll.mockResolvedValue(mockData);

    credential.findAll.mockResolvedValue([{ id: 1, name: "Partner 1" }]);

    const result = await findAllIps({
      page: 1,
      itemsPerPage: 10,
      searchText: "",
      sort: "desc",
      sortField: "createdAt",
      from: "",
      to: "",
      partnerId: 1,
    });

    expect(result).toEqual(mockData);
    expect(ip_whitelist.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          partnerId: 1,
        }),
      })
    );
  });

 

  it("should return empty if no matching records found", async () => {
    const mockData = {
      count: 0,
      rows: [],
    };

    ip_whitelist.findAndCountAll.mockResolvedValue(mockData);

    credential.findAll.mockResolvedValue([]);

    const result = await findAllIps({
      page: 1,
      itemsPerPage: 10,
      searchText: "nonexistent",
      sort: "desc",
      sortField: "createdAt",
      from: "",
      to: "",
      partnerId: null,
    });

    expect(result).toEqual(mockData);
    expect(ip_whitelist.findAndCountAll).toHaveBeenCalled();
  });
  it("should handle errors and throw an exception", async () => {
        ip_whitelist.findAndCountAll.mockRejectedValue(new Error("DB Error"));
    
        await expect(findAllIps({
          page: 1,
          itemsPerPage: 10,
          searchText: "",
          sort: "desc",
          sortField: "createdAt",
          from: "",
          to: "",
          partnerId: null,
        })).rejects.toThrow("DB Error");
    
        expect(ip_whitelist.findAndCountAll).toHaveBeenCalled();
      });
});

