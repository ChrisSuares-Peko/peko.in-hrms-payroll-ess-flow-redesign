const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const { assignFleet } = require("../../cloud_fleets");
const sequelize = require("../../../../../configs/database/index");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_documents.js", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_maintenances.js", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_fleets", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({
  findOne: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_usageHistories", () => ({
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../../../configs/database/index", () => ({
  define: jest.fn(),
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
}));

describe("assignFleet Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully assign the fleet and update existing usage history", async () => {
    const newData = {
      newEmployeeId: 2,
      fleetId: 1,
      newAssignDate: new Date(),
      existUsageId: 3,
      existReturnDate: new Date(),
      existReturnStatus: "Returned",
      existRemarks: "Returned in good condition",
    };
    const credentialId = "123";

    cloud_fleets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
    cloud_employees.findOne.mockResolvedValue({ id: 2 });
    cloud_usageHistories.update.mockResolvedValue([1]); // Indicates that one row was updated
    cloud_usageHistories.create.mockResolvedValue({ id: 4 });
    cloud_fleets.update.mockResolvedValue([1]); // Indicates that one row was updated

    const result = await assignFleet(newData, credentialId);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.fleetId },
    });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.newEmployeeId },
    });
    expect(cloud_usageHistories.update).toHaveBeenCalledWith(
      {
        returnDate: newData.existReturnDate,
        returnStatus: newData.existReturnStatus,
        remarks: newData.existRemarks,
      },
      {
        where: { id: newData.existUsageId },
        transaction: expect.any(Object),
      }
    );
    expect(cloud_usageHistories.create).toHaveBeenCalledWith(
      {
        cloudEmployeeId: newData.newEmployeeId,
        usageCategory: expect.any(String), // Update as needed based on the actual category
        cloudFleetId: newData.fleetId,
        assignDate: newData.newAssignDate,
        credentialId: credentialId,
      },
      {
        transaction: expect.any(Object),
      }
    );
    expect(cloud_fleets.update).toHaveBeenCalledWith(
      { cloudEmployeeId: newData.newEmployeeId },
      {
        where: { id: newData.fleetId },
        transaction: expect.any(Object),
      }
    );
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({ success: true, data: {} });
  });

  it("should return error if fleet does not exist", async () => {
    const newData = {
      newEmployeeId: 2,
      fleetId: 1,
    };
    const credentialId = "123";

    cloud_fleets.findOne.mockResolvedValue(null); // Fleet does not exist

    const result = await assignFleet(newData, credentialId);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.fleetId },
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "fleet is not existing with the given details",
    });
  });

  it("should return error if employee does not exist", async () => {
    const newData = {
      newEmployeeId: 2,
      fleetId: 1,
    };
    const credentialId = "123";

    cloud_fleets.findOne.mockResolvedValue({ id: 1 });
    cloud_employees.findOne.mockResolvedValue(null); // Employee does not exist

    const result = await assignFleet(newData, credentialId);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.fleetId },
    });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.newEmployeeId },
    });
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "employee is not existing with the given details",
    });
  });

  it("should handle failure in updating existing usage history", async () => {
    const newData = {
      newEmployeeId: 2,
      fleetId: 1,
      existUsageId: 3,
      existReturnDate: new Date(),
      existReturnStatus: "Returned",
      existRemarks: "Returned in good condition",
    };
    const credentialId = "123";

    cloud_fleets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
    cloud_employees.findOne.mockResolvedValue({ id: 2 });
    cloud_usageHistories.update.mockRejectedValue(
      new Error("Failed to update usage history")
    );

    const result = await assignFleet(newData, credentialId);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.fleetId },
    });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.newEmployeeId },
    });
    expect(cloud_usageHistories.update).toHaveBeenCalledWith(
      {
        returnDate: newData.existReturnDate,
        returnStatus: newData.existReturnStatus,
        remarks: newData.existRemarks,
      },
      {
        where: { id: newData.existUsageId },
        transaction: expect.any(Object),
      }
    );
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });

  it("should handle failure in creating new usage history", async () => {
    const newData = {
      newEmployeeId: 2,
      fleetId: 1,
      newAssignDate: new Date(),
    };
    const credentialId = "123";

    cloud_fleets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
    cloud_employees.findOne.mockResolvedValue({ id: 2 });
    cloud_usageHistories.update.mockResolvedValue([1]);
    cloud_usageHistories.create.mockRejectedValue(
      new Error("Failed to create usage history")
    );

    const result = await assignFleet(newData, credentialId);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.fleetId },
    });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.newEmployeeId },
    });
    expect(cloud_usageHistories.update).toHaveBeenCalledWith(
      {
        returnDate: newData.existReturnDate,
        returnStatus: newData.existReturnStatus,
        remarks: newData.existRemarks,
      },
      {
        where: { id: newData.existUsageId },
        transaction: expect.any(Object),
      }
    );
    expect(cloud_usageHistories.create).toHaveBeenCalledWith(
      {
        cloudEmployeeId: newData.newEmployeeId,
        usageCategory: expect.any(String), // Update as needed based on the actual category
        cloudFleetId: newData.fleetId,
        assignDate: newData.newAssignDate,
        credentialId: credentialId,
      },
      {
        transaction: expect.any(Object),
      }
    );
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });

  it("should handle failure in updating the fleet", async () => {
    const newData = {
      newEmployeeId: 2,
      fleetId: 1,
      newAssignDate: new Date(),
    };
    const credentialId = "123";

    cloud_fleets.findOne.mockResolvedValue({ id: 1, cloudEmployeeId: 2 });
    cloud_employees.findOne.mockResolvedValue({ id: 2 });
    cloud_usageHistories.update.mockResolvedValue([1]);
    cloud_usageHistories.create.mockResolvedValue({ id: 4 });
    cloud_fleets.update.mockResolvedValue([0]); // Indicates that no rows were updated

    const result = await assignFleet(newData, credentialId);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({
      where: { id: newData.fleetId },
    });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: { id: newData.newEmployeeId },
    });
    expect(cloud_usageHistories.update).toHaveBeenCalledWith(
      {
        returnDate: newData.existReturnDate,
        returnStatus: newData.existReturnStatus,
        remarks: newData.existRemarks,
      },
      {
        where: { id: newData.existUsageId },
        transaction: expect.any(Object),
      }
    );
    expect(cloud_usageHistories.create).toHaveBeenCalledWith(
      {
        cloudEmployeeId: newData.newEmployeeId,
        usageCategory: expect.any(String), // Update as needed based on the actual category
        cloudFleetId: newData.fleetId,
        assignDate: newData.newAssignDate,
        credentialId: credentialId,
      },
      {
        transaction: expect.any(Object),
      }
    );
    expect(cloud_fleets.update).toHaveBeenCalledWith(
      { cloudEmployeeId: newData.newEmployeeId },
      {
        where: { id: newData.fleetId },
        transaction: expect.any(Object),
      }
    );
    expect(sequelize.transaction).toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: "something went wrong while updating the fleet",
    });
  });
});
