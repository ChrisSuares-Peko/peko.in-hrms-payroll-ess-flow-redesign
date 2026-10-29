const { findAllTickets } = require("../../support");
const messages = require("../../../entities/support");
const { Op } = require("sequelize");

jest.mock("../../../entities/support", () => ({
  findAndCountAll: jest.fn()
}));

describe("findAllTickets Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should build query correctly and return results", async () => {
    const mockResult = { rows: [], count: 0 };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const params = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-02"),
      searchText: "network",
      limit: 10,
      offset: 0,
      corporateId: 99,
      excludeAttribute: ["secretField"],
    };

    const result = await findAllTickets(params);

    // Validate tomorrow date logic:
    const tomorrow = new Date("2024-01-03");
    tomorrow.setHours(0, 0, 0, 0);

    // Validate query call:
    expect(messages.findAndCountAll).toHaveBeenCalledWith({
      where: {
        createdAt: {
          [Op.between]: [params.from, tomorrow],
        },
        [Op.or]: [
          { id: { [Op.like]: "%network%" } },
          { issueType: { [Op.like]: "%network%" } },
          { description: { [Op.like]: "%network%" } },
        ],
        module: "Utility Payments", // ALWAYS TRUE due to Node's 'module'
        corporateUserId: 99
      },
      limit: 10,
      order: [["createdAt", "DESC"]],
      offset: 0,
      attributes: {
        exclude: ["secretField"]
      }
    });

    expect(result).toEqual(mockResult);
  });

  test("should not include corporateUserId when not provided", async () => {
    messages.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const params = {
      from: new Date("2024-05-01"),
      to: new Date("2024-05-05"),
      searchText: "",
      limit: 5,
      offset: 2,
      corporateId: null,
      excludeAttribute: [],
    };

    await findAllTickets(params);

    const [[query]] = messages.findAndCountAll.mock.calls;

    expect(query.where.corporateUserId).toBeUndefined();
  });

  test("should throw when DB fails", async () => {
    messages.findAndCountAll.mockRejectedValue(new Error("DB ERROR"));

    const params = {
      from: new Date(),
      to: new Date(),
      searchText: "x",
      limit: 10,
      offset: 0,
      corporateId: null,
      excludeAttribute: [],
    };

    await expect(findAllTickets(params)).rejects.toThrow("DB ERROR");
  });

});
