const { getExpiredOwnerDocs } = require("../../cloud_taskToDo");
const cloud_owners = require("../../../../entities/pekoCloud/cloud_owners");

jest.mock("../../../../entities/pekoCloud/cloud_owners", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../../../../utils/dateUtils", () => ({
  humanReadableDate: jest
    .fn()
    .mockImplementation((date) => new Date(date).toLocaleDateString()),
}));

// Mock utility functions
const formatText = jest.fn();
const humanReadableDate = jest.fn();

describe("getExpiredOwnerDocs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formatText.mockImplementation((text) => text);
    humanReadableDate.mockImplementation((date) =>
      new Date(date).toLocaleDateString()
    );
  });

  it("should return a list of expired documents for the given credentialId", async () => {
    const credentialId = 1;
    const today = new Date();
    const expiredDate = new Date(today);
    expiredDate.setDate(today.getDate() - 1); // Yesterday
  
    const owners = [
      {
        dataValues: {
          ownerName: "John Doe",
          passport: { expireDate: expiredDate.toISOString() },
          visa: { expireDate: null },
          insurance: { expireDate: expiredDate.toISOString() },
          ejari: { expireDate: expiredDate.toISOString() },
          emiratesId: { expireDate: null },
        },
      },
      {
        dataValues: {
          ownerName: "Jane Smith",
          passport: { expireDate: expiredDate.toISOString() },
          visa: { expireDate: expiredDate.toISOString() },
          insurance: { expireDate: null },
          ejari: { expireDate: expiredDate.toISOString() },
          emiratesId: { expireDate: expiredDate.toISOString() },
        },
      },
    ];
  
    cloud_owners.findAll.mockResolvedValue(owners);
  
    const result = await getExpiredOwnerDocs(credentialId);
  
    expect(cloud_owners.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        ownerName: "John Doe",
        documentType: "Passport",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[0].dataValues),
      },
      {
        ownerName: "John Doe",
        documentType: "Insurance",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[0].dataValues),
      },
      {
        ownerName: "John Doe",
        documentType: "Ejari",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[0].dataValues),
      },
      {
        ownerName: "Jane Smith",
        documentType: "Passport",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[1].dataValues),
      },
      {
        ownerName: "Jane Smith",
        documentType: "Visa",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[1].dataValues),
      },
      {
        ownerName: "Jane Smith",
        documentType: "Ejari",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[1].dataValues),
      },
      {
        ownerName: "Jane Smith",
        documentType: "Emirates ID",
        expireDate: expiredDate.toLocaleDateString(),
        details: JSON.stringify(owners[1].dataValues),
      },
    ]);
  });
  

  it("should return an empty array if no documents have expired", async () => {
    const credentialId = 1;
    const today = new Date();

    const owners = [
      {
        dataValues: {
          ownerName: "John Doe",
          passport: { expireDate: today.toISOString() },
          visa: { expireDate: today.toISOString() },
          insurance: { expireDate: today.toISOString() },
          ejari: { expireDate: today.toISOString() },
          emiratesId: { expireDate: today.toISOString() },
        },
      },
    ];

    cloud_owners.findAll.mockResolvedValue(owners);

    const result = await getExpiredOwnerDocs(credentialId);

    expect(cloud_owners.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle documents with no expiry date", async () => {
    const credentialId = 1;
   
    const owners = [
      {
        dataValues: {
          ownerName: "John Doe",
          passport: { expireDate: null },
          visa: { expireDate: null },
          insurance: { expireDate: null },
          ejari: { expireDate: null },
          emiratesId: { expireDate: null },
        },
      },
    ];

    cloud_owners.findAll.mockResolvedValue(owners);

    const result = await getExpiredOwnerDocs(credentialId);

    expect(cloud_owners.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should not consider documents with today's expiry date as expired", async () => {
    const credentialId = 1;
    const today = new Date();

    const owners = [
      {
        dataValues: {
          ownerName: "John Doe",
          passport: { expireDate: today.toISOString() },
          visa: { expireDate: today.toISOString() },
          insurance: { expireDate: today.toISOString() },
          ejari: { expireDate: today.toISOString() },
          emiratesId: { expireDate: today.toISOString() },
        },
      },
    ];

    cloud_owners.findAll.mockResolvedValue(owners);

    const result = await getExpiredOwnerDocs(credentialId);

    expect(cloud_owners.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should return an empty array if there are no owners", async () => {
    const credentialId = 1;

    cloud_owners.findAll.mockResolvedValue([]);

    const result = await getExpiredOwnerDocs(credentialId);

    expect(cloud_owners.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle errors during findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_owners.findAll.mockRejectedValue(dbError);

    const result = await getExpiredOwnerDocs(credentialId);

    expect(result).toEqual(dbError);
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_owners.findAll.mockRejectedValue(unexpectedError);

    const result = await getExpiredOwnerDocs(credentialId);

    expect(result).toEqual(unexpectedError);
  });
});
