const { getRenewalFleets } = require("../../cloud_taskToDo");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");

jest.mock("../../../../entities/pekoCloud/cloud_fleets", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({}));
jest.mock("../../../../../utils/dateUtils", () => ({
  humanReadableDate: jest
    .fn()
    .mockImplementation((date) => new Date(date).toLocaleDateString()),
}));

describe("getRenewalFleets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of fleets due for renewal", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastRenewalDate = new Date(today);
    pastRenewalDate.setDate(today.getDate() - 10); // 10 days ago

    const formattedDate = pastRenewalDate.toLocaleDateString();

    const fleets = [
      {
        vehicleName: "Truck A",
        vehicleNumber: "ABC123",
        dateOfRenewal: pastRenewalDate.toISOString(),
        cloud_employee: { employeeName: "Alice" },
      },
      {
        vehicleName: "Van B",
        vehicleNumber: "XYZ789",
        dateOfRenewal: pastRenewalDate.toISOString(),
        cloud_employee: { employeeName: "Bob" },
      },
    ];

    cloud_fleets.findAll.mockResolvedValue(fleets);

    const result = await getRenewalFleets(credentialId);

    expect(cloud_fleets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        fleetName: "Truck A",
        fleetNumber: "ABC123",
        usedBy: "Alice",
        renewalDate: formattedDate,
        details: JSON.stringify(fleets[0]),
      },
      {
        fleetName: "Van B",
        fleetNumber: "XYZ789",
        usedBy: "Bob",
        renewalDate: formattedDate,
        details: JSON.stringify(fleets[1]),
      },
    ]);
  });

  it("should return an empty array if no fleets are due for renewal", async () => {
    const credentialId = 1;
    const today = new Date();
    const futureRenewalDate = new Date(today);
    futureRenewalDate.setDate(today.getDate() + 10); // 10 days in the future

    const fleets = [
      {
        vehicleName: "Truck A",
        vehicleNumber: "ABC123",
        dateOfRenewal: futureRenewalDate.toISOString(),
        cloud_employee: { employeeName: "Alice" },
      },
    ];

    cloud_fleets.findAll.mockResolvedValue(fleets);

    const result = await getRenewalFleets(credentialId);

    expect(cloud_fleets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle fleets with no renewal date", async () => {
    const credentialId = 1;
    
    const fleets = [
      {
        vehicleName: "Truck A",
        vehicleNumber: "ABC123",
        dateOfRenewal: null,
        cloud_employee: { employeeName: "Alice" },
      },
      {
        vehicleName: "Van B",
        vehicleNumber: "XYZ789",
        dateOfRenewal: null,
        cloud_employee: { employeeName: "Bob" },
      },
    ];

    cloud_fleets.findAll.mockResolvedValue(fleets);

    const result = await getRenewalFleets(credentialId);

    expect(cloud_fleets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle fleets with missing employee information", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastRenewalDate = new Date(today);
    pastRenewalDate.setDate(today.getDate() - 10); // 10 days ago

    const formattedDate = pastRenewalDate.toLocaleDateString();

    const fleets = [
      {
        vehicleName: "Truck A",
        vehicleNumber: "ABC123",
        dateOfRenewal: pastRenewalDate.toISOString(),
        cloud_employee: null,
      },
      {
        vehicleName: "Van B",
        vehicleNumber: "XYZ789",
        dateOfRenewal: pastRenewalDate.toISOString(),
        cloud_employee: { employeeName: "Bob" },
      },
    ];

    cloud_fleets.findAll.mockResolvedValue(fleets);

    const result = await getRenewalFleets(credentialId);

    expect(cloud_fleets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        fleetName: "Truck A",
        fleetNumber: "ABC123",
        usedBy: "",
        renewalDate: formattedDate,
        details: JSON.stringify(fleets[0]),
      },
      {
        fleetName: "Van B",
        fleetNumber: "XYZ789",
        usedBy: "Bob",
        renewalDate: formattedDate,
        details: JSON.stringify(fleets[1]),
      },
    ]);
  });

  it("should return an empty array if there are no fleets for the given credentialId", async () => {
    const credentialId = 1;

    cloud_fleets.findAll.mockResolvedValue([]);

    const result = await getRenewalFleets(credentialId);

    expect(cloud_fleets.findAll).toHaveBeenCalledWith({
      include: [{ model: cloud_employees, attributes: ["id", "employeeName", "employeeEmail", "department"] }],
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle errors during the findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_fleets.findAll.mockRejectedValue(dbError);

    const result = await getRenewalFleets(credentialId);

    expect(result).toEqual(dbError);
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_fleets.findAll.mockRejectedValue(unexpectedError);

    const result = await getRenewalFleets(credentialId);

    expect(result).toEqual(unexpectedError);
  });
});
