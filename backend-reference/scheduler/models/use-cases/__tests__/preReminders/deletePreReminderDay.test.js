const { deletePreReminderDay } = require("../../preReminders");
const Setting = require("../../../entities/setting");

jest.mock("../../../entities/setting", () => ({
  findOne: jest.fn(),
}));

describe("deletePreReminderDay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should delete a reminder if it exists", async () => {
    const mockSettings = {
      details: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 2, scheduledTime: "10:00 AM" },
      ],
      update: jest.fn(), // Mock update function
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    const result = await deletePreReminderDay(1, "08:00 AM");

    expect(result).toEqual([{ day: 2, scheduledTime: "10:00 AM" }]);
    expect(mockSettings.update).toHaveBeenCalledWith({
      details: [{ day: 2, scheduledTime: "10:00 AM" }],
    });
  });

  test("should return null if setting is not found", async () => {
    Setting.findOne.mockResolvedValue(null);

    const result = await deletePreReminderDay(1, "08:00 AM");

    expect(result).toBeNull();
  });

  test("should throw an error if reminder is not found", async () => {
    const mockSettings = {
      details: [{ day: 2, scheduledTime: "10:00 AM" }],
      update: jest.fn(),
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    await expect(deletePreReminderDay(1, "08:00 AM")).rejects.toThrow(
      "Pre Reminder not found"
    );

    expect(mockSettings.update).not.toHaveBeenCalled();
  });

  test("should delete only the matching reminder", async () => {
    const mockSettings = {
      details: [
        { day: 1, scheduledTime: "08:00 AM" },
        { day: 1, scheduledTime: "10:00 AM" },
        { day: 2, scheduledTime: "12:00 PM" },
      ],
      update: jest.fn(),
    };

    Setting.findOne.mockResolvedValue(mockSettings);

    const result = await deletePreReminderDay(1, "08:00 AM");

    expect(result).toEqual([
      { day: 1, scheduledTime: "10:00 AM" },
      { day: 2, scheduledTime: "12:00 PM" },
    ]);

    expect(mockSettings.update).toHaveBeenCalledWith({
      details: [
        { day: 1, scheduledTime: "10:00 AM" },
        { day: 2, scheduledTime: "12:00 PM" },
      ],
    });
  });
});
