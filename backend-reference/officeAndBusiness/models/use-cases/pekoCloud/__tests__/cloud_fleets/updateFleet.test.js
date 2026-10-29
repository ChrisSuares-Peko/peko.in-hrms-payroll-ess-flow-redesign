const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const { updateFleet } = require("../../cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_fleets", () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({
  findOne: jest.fn(),
}));

describe("updateFleet Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update an existing fleet", async () => {
    const id = 1;
    const newData = { vehicleName: "Updated Vehicle", cloudEmployeeId: 2 };

    const existingFleet = { id: 1, vehicleName: "Old Vehicle" };
    const existingEmployee = { id: 2, employeeName: "John Doe" };

    cloud_fleets.findOne.mockResolvedValue(existingFleet);
    cloud_employees.findOne.mockResolvedValue(existingEmployee);
    cloud_fleets.update.mockResolvedValue([1]);

    const result = await updateFleet(id, newData);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudEmployeeId } });
    expect(cloud_fleets.update).toHaveBeenCalledWith(newData, { where: { id } });
    expect(result).toEqual({ success: true, data: {} });
  });

  it("should return an error if the fleet does not exist", async () => {
    const id = 1;
    const newData = { vehicleName: "Updated Vehicle", cloudEmployeeId: 2 };

    cloud_fleets.findOne.mockResolvedValue(null);

    const result = await updateFleet(id, newData);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(result).toEqual({
      success: false,
      error: "fleet is not existing with the given details",
    });
  });

  it("should return an error if the employee does not exist", async () => {
    const id = 1;
    const newData = { vehicleName: "Updated Vehicle", cloudEmployeeId: 2 };

    const existingFleet = { id: 1, vehicleName: "Old Vehicle" };

    cloud_fleets.findOne.mockResolvedValue(existingFleet);
    cloud_employees.findOne.mockResolvedValue(null);

    const result = await updateFleet(id, newData);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudEmployeeId } });
    expect(result).toEqual({
      success: false,
      error: "employee is not existing with the given details",
    });
  });

  it("should return an error if update operation fails", async () => {
    const id = 1;
    const newData = { vehicleName: "Updated Vehicle", cloudEmployeeId: 2 };

    const existingFleet = { id: 1, vehicleName: "Old Vehicle" };
    const existingEmployee = { id: 2, employeeName: "John Doe" };

    cloud_fleets.findOne.mockResolvedValue(existingFleet);
    cloud_employees.findOne.mockResolvedValue(existingEmployee);
    cloud_fleets.update.mockResolvedValue([0]);

    const result = await updateFleet(id, newData);

    expect(cloud_fleets.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(cloud_employees.findOne).toHaveBeenCalledWith({ where: { id: newData.cloudEmployeeId } });
    expect(cloud_fleets.update).toHaveBeenCalledWith(newData, { where: { id } });
    expect(result).toEqual({
      success: false,
      error: "something went wrong while updating the fleet",
    });
  });

  it("should return an error when an exception occurs", async () => {
    const id = 1;
    const newData = { vehicleName: "Updated Vehicle", cloudEmployeeId: 2 };

    const error = new Error("Database error");
    cloud_fleets.findOne.mockRejectedValue(error);

    const result = await updateFleet(id, newData);

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });
});
