const messages = require("../../../entities/support");
const { create } = require("../../support");

jest.mock("../../../entities/support", () => ({
  create: jest.fn()
}));

describe("messages.create Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create a message successfully", async () => {
    const mockPayload = { text: "Hi", userId: 1 };
    const mockResponse = { id: 101, ...mockPayload };

    messages.create.mockResolvedValue(mockResponse);

    const result = await create(mockPayload);

    expect(messages.create).toHaveBeenCalledWith(mockPayload);

    expect(result).toEqual(mockResponse);
  });

  test("should throw error when create fails", async () => {
    messages.create.mockRejectedValue(new Error("DB ERROR"));

    await expect(create({ text: "Test" }))
      .rejects
      .toThrow("DB ERROR");

    expect(messages.create).toHaveBeenCalledWith({ text: "Test" });
  });

});
