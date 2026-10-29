
const GarageAssignment = require("../../../../entities/garage/garage_assignment");
const GarageDriver = require("../../../../entities/garage/garage_driver");
const GarageFleet = require("../../../../entities/garage/garage_fleet");
const { createLog } = require("../../../garage/garage_logs");

jest.mock("../../../../entities/garage/garage_assignment", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../../../../entities/garage/garage_driver", () => ({
  findByPk: jest.fn(),
}));

jest.mock("../../../../entities/garage/garage_fleet", () => ({
  findByPk: jest.fn(),
}));

jest.mock("../../../garage/garage_logs", () => ({
  createLog: jest.fn(),
}));
jest.mock("../../../../entities/categories", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/subCorporateUsers", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/works", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/serviceOperator", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/credential", () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
  hasOne: jest.fn(),
  prototype: {}, // IMPORTANT FIX
}));
jest.mock("../../../../entities/order", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/transaction", () => ({
  belongsTo: jest.fn(),
}));
const { createAssignment, unassignDriver } = require("../../garage_assignment");
jest.mock("../../../../../configs/database/index", () => ({
  Sequelize: {
    Op: { in: Symbol("in") }
  },
  define: jest.fn()
}));

describe("createAssignment", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------
  // 1. DRIVER ALREADY ASSIGNED
  // --------------------------------------------------------------
  it("should return error if driver is already assigned", async () => {
    GarageAssignment.findOne.mockResolvedValueOnce({
      driverId: 10,
      vehicleId: 99,
    });
    GarageFleet.findByPk.mockResolvedValueOnce({ vehicleNumber: "MH12AB1234" });

    const result = await createAssignment(
      { driverId: 10, vehicleId: 200 },
      1
    );

    expect(GarageAssignment.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          driverId: 10,
          assignmentType: expect.any(Object),
        }),
      })
    );


    expect(result).toEqual({
      success: false,
      message: "This driver is already assigned to the vehicle MH12AB1234.",
    });
  });

  // --------------------------------------------------------------
  // 2. VEHICLE ALREADY ASSIGNED
  // --------------------------------------------------------------
  it("should return error if vehicle is already assigned", async () => {
    // Driver not assigned
    GarageAssignment.findOne
      .mockResolvedValueOnce(null) // driver check
      .mockResolvedValueOnce({
        driverId: 55,
        vehicleId: 200,
      }); // vehicle check

    const result = await createAssignment(
      { driverId: 10, vehicleId: 200 },
      1
    );

    expect(GarageAssignment.findOne).toHaveBeenCalledTimes(2);

    expect(result).toEqual({
      success: false,
      message: "Vehicle ID 200 is already assigned to a driver (ID: 55)",
    });
  });

  // --------------------------------------------------------------
  // 3. SUCCESSFUL ASSIGNMENT + LOG CREATED
  // --------------------------------------------------------------
  it("should create assignment when driver & vehicle are free", async () => {
    GarageAssignment.findOne
      .mockResolvedValueOnce(null) // driver not assigned
      .mockResolvedValueOnce(null); // vehicle not assigned

    GarageAssignment.create.mockResolvedValue({
      id: 123,
      driverId: 10,
      vehicleId: 200,
    });

    GarageDriver.findByPk.mockResolvedValue({ name: "Ramesh Kumar" });
    GarageFleet.findByPk.mockResolvedValue({ vehicleNumber: "MH12AB1234" });

    const result = await createAssignment(
      { driverId: 10, vehicleId: 200 },
      99
    );

    expect(GarageAssignment.create).toHaveBeenCalledWith({
      driverId: 10,
      vehicleId: 200,
    });

    expect(createLog).toHaveBeenCalledWith({
      actionType: "ASSIGN_DRIVER",
      meta: { vehicleNumber: "MH12AB1234" },
      referenceId: "123",
      description: "Driver 'Ramesh Kumar' assigned to vehicle 'MH12AB1234'",
      credentialId: 99,
    });

    expect(result).toEqual({
      success: true,
      data: { id: 123, driverId: 10, vehicleId: 200 },
    });
  });

  // --------------------------------------------------------------
  // 4. DATABASE ERROR
  // --------------------------------------------------------------
  it("should handle unexpected errors", async () => {
    GarageAssignment.findOne.mockRejectedValue(new Error("DB exploded"));

    const result = await createAssignment(
      { driverId: 10, vehicleId: 200 },
      1
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to create assignment");
    expect(result.error).toBeUndefined();
  });

  // --------------------------------------------------------------
  // 5. REASSIGN TO ANOTHER VEHICLE
  // --------------------------------------------------------------
  it("should move the assignment when reassign flag is set", async () => {
    const existingAssignment = {
      id: 7,
      driverId: 10,
      vehicleId: 99,
      update: jest.fn().mockResolvedValue(true),
    };
    GarageAssignment.findOne
      .mockResolvedValueOnce(existingAssignment) // driver check
      .mockResolvedValueOnce(null); // target vehicle free

    GarageDriver.findByPk.mockResolvedValue({ name: "Ramesh Kumar" });
    GarageFleet.findByPk.mockResolvedValue({ vehicleNumber: "MH12AB1234" });

    const result = await createAssignment(
      { driverId: 10, vehicleId: 200, reassign: true },
      1
    );

    expect(existingAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: 200 })
    );
    expect(GarageAssignment.create).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  // --------------------------------------------------------------
  // 6. REASSIGN TO SAME VEHICLE IS A NO-OP
  // --------------------------------------------------------------
  it("should succeed without changes when reassigning to the same vehicle", async () => {
    const existingAssignment = {
      id: 7,
      driverId: 10,
      vehicleId: 200,
      update: jest.fn(),
    };
    GarageAssignment.findOne.mockResolvedValueOnce(existingAssignment);

    const result = await createAssignment(
      { driverId: 10, vehicleId: 200, reassign: true },
      1
    );

    expect(existingAssignment.update).not.toHaveBeenCalled();
    expect(GarageAssignment.create).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: existingAssignment });
  });

  // --------------------------------------------------------------
  // 7. UNASSIGN DRIVER
  // --------------------------------------------------------------
  it("should mark the assignment as Unassigned", async () => {
    const existingAssignment = {
      id: 7,
      driverId: 10,
      vehicleId: 200,
      update: jest.fn().mockResolvedValue(true),
    };
    GarageAssignment.findOne.mockResolvedValueOnce(existingAssignment);
    GarageFleet.findOne = jest.fn().mockResolvedValue({ id: 200, vehicleNumber: "MH12AB1234" });
    GarageDriver.findByPk.mockResolvedValue({ name: "Ramesh Kumar" });

    const result = await unassignDriver(7, 1);

    expect(existingAssignment.update).toHaveBeenCalledWith({ assignmentType: "Unassigned" });
    expect(result.success).toBe(true);
  });

  it("should not unassign when the vehicle belongs to another credential", async () => {
    const existingAssignment = {
      id: 7,
      driverId: 10,
      vehicleId: 200,
      update: jest.fn(),
    };
    GarageAssignment.findOne.mockResolvedValueOnce(existingAssignment);
    GarageFleet.findOne = jest.fn().mockResolvedValue(null);

    const result = await unassignDriver(7, 999);

    expect(existingAssignment.update).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, message: "Assignment not found" });
  });
});
