const Setting = require('../../../entities/setting');
const { upsertSetting } = require('../../setting');

jest.mock('../../../entities/setting', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('upsertSetting', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should update an existing setting and return updated details', async () => {
    const mockSetting = {
      details: "old-value",
      save: jest.fn().mockResolvedValue(),
    };

    Setting.findOne.mockResolvedValue(mockSetting);

    const result = await upsertSetting("theme", "dark-mode");

    expect(Setting.findOne).toHaveBeenCalledWith({
      where: { name: "theme" }
    });

    expect(mockSetting.details).toBe("dark-mode");
    expect(mockSetting.save).toHaveBeenCalled();
    expect(result).toBe("dark-mode");
  });

  it('should create a new setting when setting does not exist', async () => {
    Setting.findOne.mockResolvedValue(null);

    const mockCreated = { details: { enabled: true } };
    Setting.create.mockResolvedValue(mockCreated);

    const details = { enabled: true };

    const result = await upsertSetting("notifications", details);

    expect(Setting.create).toHaveBeenCalledWith({
      name: "notifications",
      details
    });

    expect(result).toEqual(details);
  });

  it('should return false when database throws error (findOne)', async () => {
    Setting.findOne.mockRejectedValue(new Error("DB crash"));

    const result = await upsertSetting("errorCase", {});

    expect(result).toBe(false);
  });

  it('should return false when save() fails', async () => {
    const mockSetting = {
      details: "abc",
      save: jest.fn().mockRejectedValue(new Error("save failed")),
    };

    Setting.findOne.mockResolvedValue(mockSetting);

    const result = await upsertSetting("failSave", "xyz");

    expect(result).toBe(false);
  });

  it('should return false when create() fails', async () => {
    Setting.findOne.mockResolvedValue(null);

    Setting.create.mockRejectedValue(new Error("create failed"));

    const result = await upsertSetting("failCreate", { a: 1 });

    expect(result).toBe(false);
  });

  it('should allow any type for details (string/number/object/array)', async () => {
    Setting.findOne.mockResolvedValue(null);

    const details = { a: 1, list: [1, 2] };
    Setting.create.mockResolvedValue({ details });

    const result = await upsertSetting("multiType", details);

    expect(result).toEqual(details);
  });
});
