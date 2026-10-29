const { updateEmployee } = require("../../cloud_employees");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");
const { deleteFile, uploadFile } = require("../../../../../utils/commonUploadFile");
const { findMaximumUsageLimit } = require("../../../subscription.js");

jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../../../utils/commonUploadFile", () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
}));

jest.mock("../../../subscription.js", () => ({
  findMaximumUsageLimit: jest.fn(),
}));

describe("updateEmployee Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update an existing employee with unique new data and handle file upload", async () => {
    const id = 1;
    const newData = {
      employeeName: "Jane Doe",
      employeeEmail: "jane.doe@example.com",
      employeeID: "E123",
      credentialId: 2,
      profileImageBase: "base64image",
      profileImageFormat: "jpeg",
    };
    const user = {
      role: "CORPORATE_SUB_USER",
      subCorporateId: 123,
      username: "corporateUser",
      subCorporateUsername: "subUser",
      corporateId: 456,
    };

    cloud_employees.findOne
      .mockResolvedValueOnce({ id: 1, profilePicture: "old-profile-url" }) // Employee exists
      .mockResolvedValueOnce(null); // No other employee with the same email or ID

    deleteFile.mockResolvedValue(true); // Successfully delete old profile picture
    findMaximumUsageLimit.mockResolvedValue(1000); // Max storage limit
    uploadFile.mockResolvedValue("new-profile-url"); // Successfully upload new profile picture

    cloud_employees.update.mockResolvedValue([1]); // Indicating one row updated

    const result = await updateEmployee(id, newData, user);

    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            employeeEmail: newData.employeeEmail,
            credentialId: newData.credentialId,
          },
          {
            employeeID: newData.employeeID,
            credentialId: newData.credentialId,
          },
        ],
        id: { [Op.ne]: id }
      },
    });

    expect(findMaximumUsageLimit).toHaveBeenCalledWith({ corporateId: user.corporateId, accessKey: "pekoCloud" });
    expect(uploadFile).toHaveBeenCalledWith(
      newData.profileImageBase,
      `corporate/corporateUser/peko-cloud/sub-user/subUser`,
      newData.profileImageFormat,
      1000
    );

    expect(cloud_employees.update).toHaveBeenCalledWith(
      expect.objectContaining({
        profilePicture: "new-profile-url",
        subCorporateUserId: user.subCorporateId,
      }),
      { where: { id } }
    );

    expect(result).toEqual({ success: true, data: {} });
  });

  it("should return an error if the employee does not exist", async () => {
    const id = 1;
    const newData = {
      employeeName: "Jane Doe",
      employeeEmail: "jane.doe@example.com",
      employeeID: "E123",
      credentialId: 2,
    };
    const user = { role: "CORPORATE", username: "User" };

    cloud_employees.findOne.mockResolvedValueOnce(null); // No employee found

    const result = await updateEmployee(id, newData, user);

    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });

    expect(result).toEqual({
      success: false,
      error: "employee is not existing with the given details",
    });
  });

  it("should return an error if the new data matches an existing employee record", async () => {
    const id = 1;
    const newData = {
      employeeName: "Jane Doe",
      employeeEmail: "jane.doe@example.com",
      employeeID: "E123",
      credentialId: 2,
    };
    const user = { role: "CORPORATE", username: "User" };

    cloud_employees.findOne
      .mockResolvedValueOnce({ id: 1 }) // Employee exists
      .mockResolvedValueOnce({ id: 2 }); // Another employee with the same email or ID exists

    const result = await updateEmployee(id, newData, user);

    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            employeeEmail: newData.employeeEmail,
            credentialId: newData.credentialId,
          },
          {
            employeeID: newData.employeeID,
            credentialId: newData.credentialId,
          },
        ],
        id: { [Op.ne]: id }
      },
    });

    expect(result).toEqual({
      success: false,
      error: "Employee with this email id or employee id already exists",
    });
  });

  it("should return an error if the update operation fails", async () => {
    const id = 1;
    const newData = {
      employeeName: "Jane Doe",
      employeeEmail: "jane.doe@example.com",
      employeeID: "E123",
      credentialId: 2,
    };
    const user = { role: "CORPORATE", username: "User" };

    cloud_employees.findOne
      .mockResolvedValueOnce({ id: 1 }) // Employee exists
      .mockResolvedValueOnce(null); // No other employee with the same email or ID

    cloud_employees.update.mockResolvedValue([0]); // No rows updated

    const result = await updateEmployee(id, newData, user);

    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            employeeEmail: newData.employeeEmail,
            credentialId: newData.credentialId,
          },
          {
            employeeID: newData.employeeID,
            credentialId: newData.credentialId,
          },
        ],
        id: { [Op.ne]: id }
      },
    });
    expect(cloud_employees.update).toHaveBeenCalledWith(newData, {
      where: { id },
    });

    expect(result).toEqual({
      success: false,
      error: "something went wrong while updating the employee",
    });
  });

  it("should handle unexpected errors", async () => {
    const id = 1;
    const newData = {
      employeeName: "Jane Doe",
      employeeEmail: "jane.doe@example.com",
      employeeID: "E123",
      credentialId: 2,
    };
    const user = { role: "CORPORATE", username: "User" };

    cloud_employees.findOne.mockRejectedValue(new Error("Database error"));

    const result = await updateEmployee(id, newData, user);

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });
});
