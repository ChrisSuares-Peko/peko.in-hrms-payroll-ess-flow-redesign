const garage_assignment = require("../../../../entities/garage/garage_assignment");
const { getAssignmentById } = require("../../garage_assignment");

jest.mock("../../../../entities/garage/garage_assignment", () => ({
  findByPk: jest.fn(),
}));

describe("getAssignmentById Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return success and assignment data when valid ID is provided", async () => {
    const mockAssignment = { id: 1, name: "Test Assignment" };

    garage_assignment.findByPk.mockResolvedValue(mockAssignment);

    const result = await getAssignmentById(1);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      success: true,
      data: mockAssignment
    });
  });

  test("should return not found when assignment does not exist", async () => {
    garage_assignment.findByPk.mockResolvedValue(null);

    const result = await getAssignmentById(999);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(999);
    expect(result).toEqual({
      success: false,
      message: "Assignment not found"
    });
  });

  test("should return failure when database throws an error", async () => {
    garage_assignment.findByPk.mockRejectedValue(new Error("DB error"));

    const result = await getAssignmentById(1);

    expect(garage_assignment.findByPk).toHaveBeenCalledWith(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to fetch assignment");
    expect(result.error).toBeInstanceOf(Error);
  });

});
