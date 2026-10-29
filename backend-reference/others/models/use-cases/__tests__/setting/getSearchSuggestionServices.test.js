const Setting = require('../../../entities/setting');
const { getSearchSuggestionServices } = require('../../setting');
const defaultSearchServices = require("../../../../utils/defaultSearchServices.json");

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));


describe("getSearchSuggestionServices", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return existing search service details when record exists", async () => {
    const mockSetting = { details: ["recharge", "flight"] };

    Setting.findOne.mockResolvedValue(mockSetting);

    const result = await getSearchSuggestionServices();

    expect(Setting.findOne).toHaveBeenCalledWith({
      where: { name: "searchServices" },
    });

    expect(result).toEqual(["recharge", "flight"]);
  });


  it("should create new setting when not found, then fetch and return details", async () => {
    // first call → not found
    Setting.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ details: defaultSearchServices });

    Setting.create.mockResolvedValue({ 
      name: "searchServices",
      details: defaultSearchServices
    });

    const result = await getSearchSuggestionServices();

    expect(Setting.create).toHaveBeenCalledWith({
      name: "searchServices",
      details: defaultSearchServices,
    });

    expect(result).toEqual(defaultSearchServices);
  });

  it("should return empty array if details is null or undefined", async () => {
    Setting.findOne.mockResolvedValue({ details: null });

    const result = await getSearchSuggestionServices();

    expect(result).toEqual([]);
  });

  it("should throw error when DB fails (asyncHandler rethrows)", async () => {
    Setting.findOne.mockRejectedValue(new Error("DB failed"));

    await expect(getSearchSuggestionServices()).rejects.toThrow("DB failed");
  });
});
