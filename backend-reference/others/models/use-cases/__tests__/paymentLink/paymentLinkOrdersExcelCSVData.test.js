const { paymentLinkOrdersExcelCSVData } = require("../../../use-cases/paymentLink");
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

jest.mock("../../../../utils/formatter", () => ({
  formattedDateTime: jest.fn((date) => `Formatted-${date}`),
}));

describe("paymentLinkOrdersExcelCSVData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return formatted payment link data with default params", async () => {
    const mockData = {
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

    paymentLinks.findAndCountAll.mockResolvedValue(mockData);
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const params = {};
    const result = await paymentLinkOrdersExcelCSVData(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          attributes: ["name", "email", "username"],
        },
      ],
      where: {},
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      {
        "Date": "2024-02-10 17:30:00",
        "Corporate Name": "Test Corp",
        "Corporate ID": "testuser",
        Amount: "₹ 100.00",
        Status: "completed",
        "Link": "Not Available",
        "Type": "invoice",
      },
    ]);
  });

  test("should apply search filters correctly", async () => {
    const mockData = { count: 0, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockData);
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const params = { searchText: "test" };
    await paymentLinkOrdersExcelCSVData(params);

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
    const mockData = { count: 1, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockData);

    const params = { corporateId: 123 };
    await paymentLinkOrdersExcelCSVData(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ credentialId: 123 }),
      })
    );
  });

  test("should apply status filter", async () => {
    const mockData = { count: 1, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockData);

    const params = { status: "completed" };
    await paymentLinkOrdersExcelCSVData(params);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "completed" }),
      })
    );
  });

  test("should apply sorting", async () => {
    const mockData = { count: 1, rows: [] };
    paymentLinks.findAndCountAll.mockResolvedValue(mockData);
    handleSortFields.mockReturnValue([["amount", "ASC"]]);

    const params = { sortField: "amount", sort: "ASC" };
    await paymentLinkOrdersExcelCSVData(params);

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
    const result = await paymentLinkOrdersExcelCSVData(params);

    expect(result).toEqual([]);
  });

  test("should handle database errors", async () => {
    paymentLinks.findAndCountAll.mockRejectedValue(new Error("Database error"));

    const params = {};
    await expect(paymentLinkOrdersExcelCSVData(params)).rejects.toThrow("Database error");
  });
});
