const { findHikeByName } = require("../../hike");
const hike = require("../../../entities/hike");

jest.mock("../../../entities/hike");

// Properly mock `subCorporateUsers`
jest.mock("../../../entities/subCorporateUsers", () => ({
  hasOne: jest.fn(), // Mock `hasOne` method
  belongsTo: jest.fn(),
}));

describe("findHikeByName", () => {
  const mockHikeName = "Test Hike";
  const mockHikeData = {
    id: 1,
    name: mockHikeName,
    salaryAmount: 5000,
    status: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should find a hike successfully", async () => {
    hike.findOne.mockResolvedValue(mockHikeData);

    const result = await findHikeByName(mockHikeName);

    expect(hike.findOne).toHaveBeenCalledWith({
      where: { name: mockHikeName },
    });
    expect(result).toEqual({
      success: true,
      message: "Hike fetched successfully",
      data: mockHikeData,
    });
  });

  it("should return failure when hike is not found", async () => {
    hike.findOne.mockResolvedValue(null);

    const result = await findHikeByName(mockHikeName);

    expect(hike.findOne).toHaveBeenCalledWith({
      where: { name: mockHikeName },
    });
    expect(result).toEqual({
      success: false,
      message: "Hike not found",
    });
  });

  it("should handle errors and return appropriate response", async () => {
    const mockError = new Error("Database error");
    hike.findOne.mockRejectedValue(mockError);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const result = await findHikeByName(mockHikeName);

    expect(hike.findOne).toHaveBeenCalledWith({
      where: { name: mockHikeName },
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error finding hike by name:", mockError);
    expect(result).toEqual({
      success: false,
      message: "An error occurred while fetching the hike",
    });

    consoleErrorSpy.mockRestore();
  });
});
