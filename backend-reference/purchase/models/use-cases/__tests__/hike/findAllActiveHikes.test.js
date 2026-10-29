const { findAllActiveHikes } = require("../../hike");
const hike = require("../../../entities/hike");

jest.mock("../../../entities/hike");

jest.mock("../../../entities/subCorporateUsers", () => ({
  hasOne: jest.fn(), // Mock `hasOne` method
  belongsTo: jest.fn(),
}));
describe("findAllActiveHikes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch active hikes successfully", async () => {
    const commission = {
      commissionMode: "AGENT_MARKUP",
      commissionType: "FLAT",
      commission: 10,
      fixedCommissionPerTransaction: 0,
      isCommissionInclGST: true,
      isCommissionConfigured: true,
    };
    hike.findAll.mockResolvedValue([
      { id: 1, name: "Active Hike 1", status: true, amount: "100.00", ...commission },
      { id: 2, name: "Active Hike 2", status: true, amount: "200.00", ...commission, commissionMode: "MARGIN" },
    ]);

    const result = await findAllActiveHikes();

    expect(hike.findAll).toHaveBeenCalledWith({
      where: { status: true },
      order: [["createdAt", "DESC"]],
    });
    expect(result).toEqual({
      success: true,
      message: "Active hikes fetched successfully",
      data: [
        { id: 1, name: "Active Hike 1", status: true, amount: "110.00", ...commission },
        { id: 2, name: "Active Hike 2", status: true, amount: "200.00", ...commission, commissionMode: "MARGIN" },
      ],
    });
  });

  it("should handle errors and return appropriate response", async () => {
    const mockError = new Error("Database error");
    hike.findAll.mockRejectedValue(mockError);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const result = await findAllActiveHikes();

    expect(hike.findAll).toHaveBeenCalledWith({
      where: { status: true },
      order: [["createdAt", "DESC"]],
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error finding active hikes:", mockError);
    expect(result).toEqual({
      success: false,
      message: "An error occurred while fetching active hikes",
    });

    consoleErrorSpy.mockRestore();
  });

  it("should return failure response when findAll returns null", async () => {
    hike.findAll.mockResolvedValue(null);

    const result = await findAllActiveHikes();

    expect(hike.findAll).toHaveBeenCalledWith({
      where: { status: true },
      order: [["createdAt", "DESC"]],
    });
    expect(result).toEqual({
      success: false,
      message: "No active hikes found",
    });
  });
});
