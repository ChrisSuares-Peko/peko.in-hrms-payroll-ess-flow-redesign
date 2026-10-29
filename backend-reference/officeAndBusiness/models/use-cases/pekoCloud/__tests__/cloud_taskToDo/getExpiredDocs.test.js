const { getExpiredDocs } = require("../../cloud_taskToDo");
const cloud_documents = require("../../../../entities/pekoCloud/cloud_documents");
const cloud_assets = require("../../../../entities/pekoCloud/cloud_assets");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");

jest.mock("../../../../entities/pekoCloud/cloud_documents", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_assets", () => ({}));
jest.mock("../../../../entities/pekoCloud/cloud_fleets", () => ({}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({}));
jest.mock("../../../../../utils/dateUtils", () => ({
  humanReadableDate: jest
    .fn()
    .mockImplementation((date) => new Date(date).toLocaleDateString()),
}));

describe("getExpiredDocs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of expired documents with asset category and assigned employee", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastExpireDate = new Date(today);
    pastExpireDate.setDate(today.getDate() - 10); // 10 days ago

    const formattedIssueDate = today.toLocaleDateString();
    const formattedExpireDate = pastExpireDate.toLocaleDateString();

    const documents = [
      {
        documentName: "Asset Document",
        documentNumber: "123456",
        documentType: "Type A",
        documentCategory: "ASSET",
        issueDate: today.toISOString(),
        expireDate: pastExpireDate.toISOString(),
        cloud_asset: {
          assetName: "Office Laptop",
          cloud_employee: { employeeName: "John Doe" }
        },
      },
    ];

    cloud_documents.findAll.mockResolvedValue(documents);

    const result = await getExpiredDocs(credentialId);

    expect(cloud_documents.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName", "vehicleNumber"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
      ],
      where: { credentialId },
    });

    expect(result).toEqual([
      {
        documentName: "Asset Document",
        documentNumber: "123456",
        documentType: "Type A",
        documentCategory: "ASSET",
        issueDate: formattedIssueDate,
        expireDate: formattedExpireDate,
        assetName: "Office Laptop",
        assignedTo: "John Doe",
        details: JSON.stringify(documents[0]),
      },
    ]);
  });

  it("should return a list of expired documents with fleet category and assigned employee", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastExpireDate = new Date(today);
    pastExpireDate.setDate(today.getDate() - 10); // 10 days ago

    const formattedIssueDate = today.toLocaleDateString();
    const formattedExpireDate = pastExpireDate.toLocaleDateString();

    const documents = [
      {
        documentName: "Fleet Document",
        documentNumber: "654321",
        documentType: "Type B",
        documentCategory: "FLEET",
        issueDate: today.toISOString(),
        expireDate: pastExpireDate.toISOString(),
        cloud_fleet: {
          vehicleName: "Company Car",
          vehicleNumber: "1234",
          cloud_employee: { employeeName: "Jane Smith" }
        },
      },
    ];

    cloud_documents.findAll.mockResolvedValue(documents);

    const result = await getExpiredDocs(credentialId);

    expect(cloud_documents.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName", "vehicleNumber"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
      ],
      where: { credentialId },
    });

    expect(result).toEqual([
      {
        documentName: "Fleet Document",
        documentNumber: "654321",
        documentType: "Type B",
        documentCategory: "FLEET",
        issueDate: formattedIssueDate,
        expireDate: formattedExpireDate,
        vehicleName: "Company Car 1234",
        assignedTo: "Jane Smith",
        details: JSON.stringify(documents[0]),
      },
    ]);
  });

  it("should exclude documents that are not expired", async () => {
    const credentialId = 1;
    const today = new Date();
    const futureExpireDate = new Date(today);
    futureExpireDate.setDate(today.getDate() + 10); // 10 days in the future

    const documents = [
      {
        documentName: "Future Document",
        documentNumber: "789012",
        documentType: "Type C",
        documentCategory: "ASSET",
        issueDate: today.toISOString(),
        expireDate: futureExpireDate.toISOString(),
        cloud_asset: { assetName: "Office Chair" },
      },
    ];

    cloud_documents.findAll.mockResolvedValue(documents);

    const result = await getExpiredDocs(credentialId);

    expect(cloud_documents.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName", "vehicleNumber"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
      ],
      where: { credentialId },
    });

    expect(result).toEqual([]);
  });

  it("should handle documents with no expiration date", async () => {
    const credentialId = 1;
    const today = new Date();

    const documents = [
      {
        documentName: "No Expiration Document",
        documentNumber: "345678",
        documentType: "Type D",
        documentCategory: "FLEET",
        issueDate: today.toISOString(),
        expireDate: null,
        cloud_fleet: { vehicleName: "Company Truck" },
      },
    ];

    cloud_documents.findAll.mockResolvedValue(documents);

    const result = await getExpiredDocs(credentialId);

    expect(cloud_documents.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName", "vehicleNumber"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
      ],
      where: { credentialId },
    });

    expect(result).toEqual([]);
  });

  it("should return an empty array if there are no documents for the given credentialId", async () => {
    const credentialId = 1;

    cloud_documents.findAll.mockResolvedValue([]);

    const result = await getExpiredDocs(credentialId);

    expect(cloud_documents.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_assets,
          attributes: ["id", "assetName"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
        {
          model: cloud_fleets,
          attributes: ["id", "vehicleName", "vehicleNumber"],
          include: [{ model: cloud_employees, attributes: ["id", "employeeName"] }]
        },
      ],
      where: { credentialId },
    });

    expect(result).toEqual([]);
  });

  it("should handle errors during the findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_documents.findAll.mockRejectedValue(dbError);

    const result = await getExpiredDocs(credentialId);

    expect(result).toEqual(dbError);
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_documents.findAll.mockRejectedValue(unexpectedError);

    const result = await getExpiredDocs(credentialId);

    expect(result).toEqual(unexpectedError);
  });
});
