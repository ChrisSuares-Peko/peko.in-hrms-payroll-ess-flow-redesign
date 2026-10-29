const { findAllSelectedWorkspaces } = require("../../workspaces");

const orders = require("../../../entities/order");
const { Op } = require("sequelize");

jest.mock("../../../entities/order", () => ({
  findAndCountAll: jest.fn(),
}));
jest.mock("../../../entities/workspaces", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/plans", () => ({
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/corporateUser", () => ({
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/serviceOperator", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/categories", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/subCorporateUsers", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/transaction", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/works", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/pekoCloud/cloud_employees", () => ({
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
  hasOne: jest.fn(),
  prototype: {}, // IMPORTANT FIX
}));

jest.mock("../../../../configs/database/index", () => {
  const { Op } = jest.requireActual("sequelize");   // ✅ NOW IN-SCOPE

  return {
    Sequelize: {
      Op,
      literal: jest.fn(v => v),
    },
    define: jest.fn(),
  };
});


describe("findAllSelectedWorkspaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return filtered workspace results with correct where clause", async () => {
    const params = {
      userId: 10,
      from: "2024-01-01",
      to: "2024-02-01",
      searchText: "",
      sort: "DESC",
      limit: 10,
      offset: 0,
    };

    const mockOutput = { rows: [], count: 0 };
    orders.findAndCountAll.mockResolvedValue(mockOutput);

    const result = await findAllSelectedWorkspaces(params);

    // Tomorrow calculation (from "to" + 1 day)
    const expectedTomorrow = new Date("2024-02-02");
    expectedTomorrow.setHours(0, 0, 0, 0);

    expect(orders.findAndCountAll).toHaveBeenCalledWith({
      where: {
        credentialId: params.userId,
        serviceOperatorId: 24,
        status: {
          [Op.notIn]: ["PENDING", "FAILURE"],
        },
        transactionDate: {
          [Op.between]: ["2024-01-01", expectedTomorrow],
        },
      },
      order: [["createdAt", params.sort]],
      limit: params.limit,
      offset: params.offset,
      raw: true,
      nest: true,
    });


    expect(result).toEqual(mockOutput);
  });

  it("should include subCorporateUserId when provided", async () => {
    const params = {
      userId: 5,
      subCorporateUserId: 99,
      sort: "ASC",
    };

    const mockOutput = { rows: [], count: 0 };
    orders.findAndCountAll.mockResolvedValue(mockOutput);

    await findAllSelectedWorkspaces(params);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subCorporateUserId: 99,
        }),
      })
    );
  });

  it("should add search filters when searchText is provided", async () => {
    const params = {
      userId: 1,
      searchText: "test",
      sort: "DESC",
    };

    orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllSelectedWorkspaces(params);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.any(Array),
        }),
      })
    );
  });

  it("should handle missing from/to by ignoring date filter", async () => {
    const params = {
      userId: 10,
      sort: "ASC",
    };

    orders.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllSelectedWorkspaces(params);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          transactionDate: expect.anything(),
        }),
      })
    );
  });

  it("should return results from DB", async () => {
    const mockData = { rows: [{ id: 1 }], count: 1 };
    orders.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllSelectedWorkspaces({
      userId: 1,
      sort: "DESC",
    });

    expect(result).toEqual(mockData);
  });

  it("should throw when params is missing", async () => {
    await expect(findAllSelectedWorkspaces()).rejects.toThrow();
  });

  it("should return results even if params.userId is missing", async () => {
    orders.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });

    const result = await findAllSelectedWorkspaces({});

    expect(result).toEqual({ count: 1, rows: [{ id: 1 }] });
  });

});
