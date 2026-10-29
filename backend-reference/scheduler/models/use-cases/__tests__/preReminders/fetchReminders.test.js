const { fetchReminders } = require("../../preReminders");
const Setting = require("../../../entities/setting");

jest.mock("../../../entities/setting", () => ({
  findOne: jest.fn(),
}));

describe("fetchReminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return reminders when setting exists", async () => {
    // Mock data
    const mockSettings = {
      details: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 2, scheduledTime: "10:00 AM" },
        { day: 3, scheduledTime: "12:00 PM" },
      ],
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    // Call the function
    const result = await fetchReminders("", 1, 2);

    // Expect results to be paginated
    expect(result).toEqual({
      dates: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 2, scheduledTime: "10:00 AM" },
      ],
      totalCount: 3,
    });

    expect(Setting.findOne).toHaveBeenCalledWith({
      where: { name: "preRemaindersForSubscription" },
      attributes: ["details"],
    });
  });

  test("should return filtered reminders based on searchText", async () => {
    const mockSettings = {
      details: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 2, scheduledTime: "10:00 AM" },
        { day: 3, scheduledTime: "12:00 PM" },
      ],
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    // Call the function with searchText = '10'
    const result = await fetchReminders("10", 1, 5);

    expect(result).toEqual({
      dates: [{ day: 2, scheduledTime: "10:00 AM" }],
      totalCount: 1,
    });
  });

  test("should return empty array if setting is missing", async () => {
    Setting.findOne.mockResolvedValue(null);

    const result = await fetchReminders("", 1, 5);

    expect(result).toEqual({ dates: [], totalCount: 0 });
  });

  test("should return empty array if searchText does not match", async () => {
    const mockSettings = {
      details: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 2, scheduledTime: "10:00 AM" },
      ],
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    const result = await fetchReminders("99", 1, 5);

    expect(result).toEqual({ dates: [], totalCount: 0 });
  });

  test("should return correct pagination", async () => {
    const mockSettings = {
      details: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 2, scheduledTime: "10:00 AM" },
        { day: 3, scheduledTime: "12:00 PM" },
        { day: 4, scheduledTime: "02:00 PM" },
      ],
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    const result = await fetchReminders("", 2, 2); // Page 2, 2 items per page

    expect(result).toEqual({
      dates: [
        { day: 3, scheduledTime: "12:00 PM" },
        { day: 4, scheduledTime: "02:00 PM" },
      ],
      totalCount: 4,
    });
  });
});
