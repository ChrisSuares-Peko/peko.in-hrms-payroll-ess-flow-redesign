// findAllPaymentLinks.test.js
const { Op } = require("sequelize");
const quickLinks = require("../../../entities/quickLinks");
const { findAllPaymentLinks } = require("../../quickLinks");

jest.mock("../../../entities/quickLinks", () => ({
  findAndCountAll: jest.fn(),
}));

describe("findAllPaymentLinks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch payment links with all filters including corporateId", async () => {
    const params = {
      corporateId: 11,
      from: "2024-01-01",
      to: "2024-01-31",
      start: 0,
      length: 10,
      order: "ASC",
      column: "createdAt",
    };

    const mockResponse = { rows: [], count: 0 };
    quickLinks.findAndCountAll.mockResolvedValue(mockResponse);

    const result = await findAllPaymentLinks(params);

    expect(quickLinks.findAndCountAll).toHaveBeenCalledWith({
      where: {
        createdAt: { [Op.between]: ["2024-01-01", "2024-01-31"] },
        credentialId: 11,
      },
      order: [["createdAt", "ASC"]],
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponse);
  });

  it("should NOT include credentialId if corporateId is not provided", async () => {
    const params = {
      from: "2024-02-01",
      to: "2024-02-10",
      start: 5,
      length: 20,
      order: "DESC",
      column: "amount",
    };

    const mockResponse = { rows: [{ id: 1 }], count: 1 };
    quickLinks.findAndCountAll.mockResolvedValue(mockResponse);

    await findAllPaymentLinks(params);

    expect(quickLinks.findAndCountAll).toHaveBeenCalledWith({
      where: {
        createdAt: { [Op.between]: ["2024-02-01", "2024-02-10"] },
      },
      order: [["amount", "DESC"]],
      limit: 20,
      offset: 5,
      raw: true,
      nest: true,
    });
  });

  it("should pass correct pagination values (limit & offset)", async () => {
    const params = {
      corporateId: 44,
      from: "2024-01-01",
      to: "2024-12-31",
      start: 50,
      length: 100,
      column: "amount",
      order: "ASC",
    };

    quickLinks.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllPaymentLinks(params);

    expect(quickLinks.findAndCountAll.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        limit: 100,
        offset: 50,
      })
    );
  });

  it("should use provided sorting column and direction", async () => {
    const params = {
      from: "2024-03-01",
      to: "2024-03-31",
      start: 0,
      length: 15,
      column: "status",
      order: "DESC",
    };

    quickLinks.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllPaymentLinks(params);

    expect(quickLinks.findAndCountAll.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        order: [["status", "DESC"]],
      })
    );
  });

  it("should throw when quickLinks.findAndCountAll fails", async () => {
    quickLinks.findAndCountAll.mockRejectedValue(new Error("DB Error"));

    await expect(
      findAllPaymentLinks({
        from: "2024-01-01",
        to: "2024-01-03",
        start: 0,
        length: 10,
        column: "createdAt",
        order: "ASC",
      })
    ).rejects.toThrow("DB Error");
  });
});
