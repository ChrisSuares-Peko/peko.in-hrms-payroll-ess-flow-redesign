const garage_assignment = require("../../../../entities/garage/garage_assignment");
const { deleteAssignment } = require("../../garage_assignment");

jest.mock("../../../../entities/garage/garage_assignment", () => ({
    findByPk: jest.fn(),
}));

describe("deleteAssignment Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should delete assignment successfully when assignment exists", async () => {
    const mockAssignment = {
      id: 1,
      destroy: jest.fn().mockResolvedValue(true)
    };

    garage_assignment.findByPk.mockResolvedValue(mockAssignment);

    const result = await deleteAssignment(1);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(mockAssignment.destroy).toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      message: "Assignment permanently deleted"
    });
  });

  test("should return not found when assignment does not exist", async () => {
    garage_assignment.findByPk.mockResolvedValue(null);

    const result = await deleteAssignment(999);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(999);
    expect(result).toEqual({
      success: false,
      message: "Assignment not found"
    });
  });

  test("should return error when database lookup fails", async () => {
    garage_assignment.findByPk.mockRejectedValue(new Error("DB lookup error"));

    const result = await deleteAssignment(1);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to delete assignment");
    expect(result.error).toBeInstanceOf(Error);
  });

  test("should return error when destroy operation fails", async () => {
    const mockAssignment = {
      id: 1,
      destroy: jest.fn().mockRejectedValue(new Error("DB delete error"))
    };

    garage_assignment.findByPk.mockResolvedValue(mockAssignment);

    const result = await deleteAssignment(1);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(mockAssignment.destroy).toHaveBeenCalled();

    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to delete assignment");
    expect(result.error).toBeInstanceOf(Error);
  });

});
