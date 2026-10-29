const { findAllPaymentLinkOrders } = require("../../../use-cases/paymentLink");
const paymentLinks = require("../../../entities/paymentLink");
const credential = require("../../../entities/credential");
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock("../../../entities/paymentLink", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

describe("findAllPaymentLinkOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return payment links with default pagination", async () => {
    const mockResult = {
      count: 1,
      rows: [
        {
          createdAt: "2024-02-10T12:00:00Z",
          amount: 100,
          status: "completed",
          client_url: "https://test.com",
          type: "invoice",
          credential: {
            name: "Test Corp",
            email: "test@example.com",
            username: "testuser",
          },
        },
      ],
    };

    paymentLinks.findAndCountAll.mockResolvedValue(mockResult);
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const params = {};
    const result = await findAllPaymentLinkOrders(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith({
      attributes: ["createdAt", "amount", "status", "paymentLink", "type"],
      include: [
        {
          model: credential,
          attributes: ["name", "email", "username"],
        },
      ],
      where: {},
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  test("should apply search filters correctly", async () => {
    const mockResult = { count: 0, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockResult);
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const params = { searchText: "test" };
    await findAllPaymentLinkOrders(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            expect.objectContaining({ id: { [Op.like]: "%test%" } }),
            expect.objectContaining({ client_url: { [Op.like]: "%test%" } }),
            expect.objectContaining({ status: { [Op.like]: "%test%" } }),
            expect.objectContaining({ invoiceId: { [Op.like]: "%test%" } }),
            expect.objectContaining({ credentialId: { [Op.like]: "%test%" } }),
            expect.objectContaining({ type: { [Op.like]: "%test%" } }),
            expect.objectContaining({ "$credential.name$": { [Op.like]: "%test%" } }),
            expect.objectContaining({ "$credential.username$": { [Op.like]: "%test%" } }),
          ]),
        }),
      })
    );
  });

  test("should apply corporate ID filter", async () => {
    const mockResult = { count: 1, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockResult);
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const params = { corporateId: 123 };
    await findAllPaymentLinkOrders(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ credentialId: 123 }),
      })
    );
  });

  test("should apply status filter", async () => {
    const mockResult = { count: 1, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockResult);
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const params = { status: "completed" };
    await findAllPaymentLinkOrders(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "completed" }),
      })
    );
  });

  test("should apply sorting", async () => {
    const mockResult = { count: 1, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockResult);
    handleSortFields.mockReturnValue([["amount", "ASC"]]);

    const params = { sortField: "amount", sort: "ASC" };
    await findAllPaymentLinkOrders(params);

    expect(handleSortFields).toHaveBeenCalledWith("amount", "ASC");
    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [["amount", "ASC"]],
      })
    );
  });

  test("should return an empty result if no matching payment links exist", async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const params = { searchText: "nonexistent" };
    const result = await findAllPaymentLinkOrders(params);

    expect(result).toEqual({ count: 0, rows: [] });
  });

  test("should handle database errors", async () => {
    paymentLinks.findAndCountAll.mockRejectedValue(new Error("Database error"));

    const params = {};
    await expect(findAllPaymentLinkOrders(params)).rejects.toThrow("Database error");
  });
});
