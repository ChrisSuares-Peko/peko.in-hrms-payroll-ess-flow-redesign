const { getRenewalAssets } = require("../../cloud_taskToDo");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");

jest.mock("../../../../entities/pekoCloud/cloud_assets", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({}));
jest.mock("../../../../../utils/dateUtils", () => ({
  humanReadableDate: jest
    .fn()
    .mockImplementation((date) => new Date(date).toLocaleDateString()),
}));

describe("getRenewalAssets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of assets due for renewal", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastMonhlyDate = new Date(today);
    const pastYearlyDate = new Date(today);
    pastMonhlyDate.setDate(today.getDate() - 60); // 60 days ago
    pastYearlyDate.setDate(today.getDate() - 365); // 60 days ago

    const formattedDate = today.toLocaleDateString();

    const assets = [
      {
        assetName: "Laptop",
        purchasedDate: pastMonhlyDate.toISOString(),
        amountRecurring: "MONTHLY",
        cloud_employee: { employeeName: "Alice" },
      },
      {
        assetName: "Printer",
        purchasedDate: pastYearlyDate.toISOString(),
        amountRecurring: "YEARLY",
        cloud_employee: { employeeName: "Bob" },
      },
      {
        assetName: "Desk",
        purchasedDate: pastYearlyDate.toISOString(),
        amountRecurring: "YEARLY",
        cloud_employee: { employeeName: "Charlie" },
      },
    ];

    cloud_assets.findAll.mockResolvedValue(assets);

    const result = await getRenewalAssets(credentialId);

    console.log("Expected:", [
      {
        assetName: "Laptop",
        usedBy: "Alice",
        renewalDate: formattedDate,
        details: JSON.stringify(assets[0]),
      },
      {
        assetName: "Printer",
        usedBy: "Bob",
        renewalDate: formattedDate,
        details: JSON.stringify(assets[1]),
      },
      {
        assetName: "Desk",
        usedBy: "Charlie",
        renewalDate: formattedDate,
        details: JSON.stringify(assets[2]),
      },
    ]);

    console.log("Received:", result);

    expect(cloud_assets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        assetName: "Laptop",
        usedBy: "Alice",
        renewalDate: formattedDate,
        details: JSON.stringify(assets[0]),
      },
      {
        assetName: "Printer",
        usedBy: "Bob",
        renewalDate: formattedDate,
        details: JSON.stringify(assets[1]),
      },
      {
        assetName: "Desk",
        usedBy: "Charlie",
        renewalDate: formattedDate,
        details: JSON.stringify(assets[2]),
      },
    ]);
  });

  it("should return an empty array if no assets are due for renewal", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 10); // 10 days ago

    const assets = [
      {
        assetName: "Laptop",
        purchasedDate: pastDate.toISOString(),
        amountRecurring: "MONTHLY",
        cloud_employee: { employeeName: "Alice" },
      },
      {
        assetName: "Printer",
        purchasedDate: pastDate.toISOString(),
        amountRecurring: "YEARLY",
        cloud_employee: { employeeName: "Bob" },
      },
    ];

    cloud_assets.findAll.mockResolvedValue(assets);

    const result = await getRenewalAssets(credentialId);

    expect(cloud_assets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle assets with no purchase date", async () => {
    const credentialId = 1;
   
    const assets = [
      {
        assetName: "Laptop",
        purchasedDate: null,
        amountRecurring: "MONTHLY",
        cloud_employee: { employeeName: "Alice" },
      },
      {
        assetName: "Printer",
        purchasedDate: null,
        amountRecurring: "YEARLY",
        cloud_employee: { employeeName: "Bob" },
      },
    ];

    cloud_assets.findAll.mockResolvedValue(assets);

    const result = await getRenewalAssets(credentialId);

    expect(cloud_assets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should return an empty array if there are no assets for the given credentialId", async () => {
    const credentialId = 1;

    cloud_assets.findAll.mockResolvedValue([]);

    const result = await getRenewalAssets(credentialId);

    expect(cloud_assets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle errors during the findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_assets.findAll.mockRejectedValue(dbError);

    const result = await getRenewalAssets(credentialId);

    expect(result).toEqual(dbError);
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_assets.findAll.mockRejectedValue(unexpectedError);

    const result = await getRenewalAssets(credentialId);

    expect(result).toEqual(unexpectedError);
  });
});
