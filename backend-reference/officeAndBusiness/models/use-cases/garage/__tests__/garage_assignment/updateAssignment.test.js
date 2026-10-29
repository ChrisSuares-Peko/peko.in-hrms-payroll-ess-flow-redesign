const garage_assignment = require("../../../../entities/garage/garage_assignment");
const { updateAssignment } = require("../../garage_assignment");

jest.mock("../../../../entities/garage/garage_assignment", () => ({
    findByPk: jest.fn(),
}));

describe("updateAssignment Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should update assignment successfully when assignment exists", async () => {
    const mockAssignment = {
      id: 1,
      update: jest.fn().mockResolvedValue(true)
    };

    garage_assignment.findByPk.mockResolvedValue(mockAssignment);

    const updatedData = { name: "Updated Name" };
    const result = await updateAssignment(1, updatedData);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(mockAssignment.update).toHaveBeenCalledWith(updatedData);

    expect(result).toEqual({
      success: true,
      message: "Assignment updated",
      data: mockAssignment
    });
  });

  test("should return not found when assignment does not exist", async () => {
    garage_assignment.findByPk.mockResolvedValue(null);

    const result = await updateAssignment(999, { name: "Nothing" });

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(999);
    expect(result).toEqual({
      success: false,
      message: "Assignment not found"
    });
  });

  test("should return error when database lookup fails", async () => {
    garage_assignment.findByPk.mockRejectedValue(new Error("DB lookup error"));

    const result = await updateAssignment(1, {});

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to update assignment");
    expect(result.error).toBeInstanceOf(Error);
  });

  test("should return error when update operation fails", async () => {
    const mockAssignment = {
      id: 1,
      update: jest.fn().mockRejectedValue(new Error("DB update error"))
    };

    garage_assignment.findByPk.mockResolvedValue(mockAssignment);

    const result = await updateAssignment(1, { name: "Fail Update" });

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(mockAssignment.update).toHaveBeenCalled();

    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to update assignment");
    expect(result.error).toBeInstanceOf(Error);
  });
});
