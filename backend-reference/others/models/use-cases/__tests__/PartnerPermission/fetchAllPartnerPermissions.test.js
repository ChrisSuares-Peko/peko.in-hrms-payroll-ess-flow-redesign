const { fetchAllPartnerPermissions } = require("../../../use-cases/partnerPermission");
const partnerPermission = require("../../../entities/partnerPermission");
const credential = require("../../../entities/credential");
const {handleSortFields} = require("../../../../utils/sortHandle");
const { Op } = require("sequelize");

jest.mock("../../../entities/partnerPermission", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
    handleSortFields: jest.fn(),
  }));

describe("fetchAllPartnerPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return fetched partner permissions with partner names", async () => {
    const mockParams = {
      from: "2024-02-01",
      to: "2024-02-10",
      searchText: "admin",
      sort: "asc",
      limit: 10,
      offset: 0,
      sortField: "createdAt",
    };

    const mockData = {
      count: 2,
      rows: [
        { id: 1, registeredBy: 101, createdAt: "2024-02-05T12:00:00Z" },
        { id: 2, registeredBy: null, createdAt: "2024-02-07T12:00:00Z" },
      ],
    };

    const mockCredentials = [{ id: 101, name: "John Doe" }];

     handleSortFields.mockReturnValue([["createdAt", "ASC"]]);
    partnerPermission.findAndCountAll.mockResolvedValue(mockData);
    credential.findAll.mockResolvedValue(mockCredentials);

    const result = await fetchAllPartnerPermissions(mockParams);


    expect(handleSortFields).toHaveBeenCalledWith("createdAt", "asc");

    expect(partnerPermission.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.any(Array),
          createdAt: expect.objectContaining({ [Op.between]: expect.any(Array) }),
        }),
        order: [["createdAt", "ASC"]],
        limit: 10,
        offset: 0,
        raw: true,
        nest: true,
      })
    );

    expect(credential.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { [Op.in]: [101] } },
      })
    );

    expect(result.rows[0].partnerName).toBe("John Doe");
    expect(result.rows[1]).not.toHaveProperty("partnerName");
  });

  it("should return an error when the function throws an exception", async () => {
    partnerPermission.findAndCountAll.mockRejectedValue(new Error("Database error"));

    await expect(fetchAllPartnerPermissions({})).rejects.toEqual({
      message: "Something went wrong",
    });
  });
});
