const { findAllRecordsOrderListAndCountForAdmin } = require("../../verificationSuite");

const transaction = require("../../../entities/transaction");

const Sequelize = require("sequelize");
const { Op, where } = Sequelize;

jest.mock("../../../entities/transaction", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/order", () => ({
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/credential", () => ({
  belongsTo: jest.fn(),
}));

jest.mock("sequelize", () => {
  const actual = jest.requireActual("sequelize");

  return {
    ...actual,
    literal: jest.fn((v) => v),
    where: jest.fn((a, b) => ({ a, b })),
  };
});

describe("findAllRecordsOrderListAndCountForAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call DB with required default where clause", async () => {
    const params = {
      from: null,
      to: null,
      searchText: "",
      limit: 10,
      offset: 0,
      sort: "DESC",
      column: "createdAt",
    };

    const mockOutput = { rows: [], count: 0 };
    transaction.findAndCountAll.mockResolvedValue(mockOutput);

    const result = await findAllRecordsOrderListAndCountForAdmin(params);

    expect(transaction.findAndCountAll).toHaveBeenCalled();
    expect(result).toEqual(mockOutput);
  });

  it("should apply date filter when from/to is passed", async () => {
    const params = {
      from: "2024-01-01",
      to: "2024-01-31",
      searchText: "",
      limit: 15,
      offset: 5,
      sort: "ASC",
      column: "id",
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const tomorrow = new Date(params.to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];

    expect(callArgs.where.createdAt).toEqual({
      [Op.between]: [params.from, tomorrow],
    });
  });

  it("should add corporateId filter", async () => {
    const params = {
      searchText: "",
      corporateId: 999,
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];

    expect(callArgs.where.credentialId).toBe(999);
  });

  it("should add subCorporateUserId filter", async () => {
    const params = {
      searchText: "",
      subCorporateUserId: 55,
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];

    expect(callArgs.where.subCorporateUserId).toBe(55);
  });

  it("should add registeredBy filter", async () => {
    const params = {
      searchText: "",
      registeredBy: 777,
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];

    expect(callArgs.where.registeredBy).toBe(777);
  });

  it("should apply VALID or INVALID status filter", async () => {
    const params = {
      searchText: "",
      status: "VALID",
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];

    expect(callArgs.where[Op.and]).toBeDefined();
    expect(where).toHaveBeenCalled();
  });

  it("should apply search filters using Op.or", async () => {
    const params = {
      searchText: "hello",
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];

    expect(callArgs.where[Op.or]).toBeInstanceOf(Array);
    expect(callArgs.where[Op.or].length).toBeGreaterThan(2);
  });

  it("should include the required models", async () => {
    const params = {
      searchText: "",
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    await findAllRecordsOrderListAndCountForAdmin(params);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];
    expect(callArgs.include.length).toBe(2);
  });

  it("should return DB results", async () => {
    const mockData = { rows: [{ id: 1 }], count: 1 };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllRecordsOrderListAndCountForAdmin({
      searchText: "",
    });

    expect(result).toEqual(mockData);
  });

  it("should throw when DB fails", async () => {
    transaction.findAndCountAll.mockRejectedValue(new Error("DB failed"));

    await expect(
      findAllRecordsOrderListAndCountForAdmin({ searchText: "" })
    ).rejects.toThrow("DB failed");
  });

});
