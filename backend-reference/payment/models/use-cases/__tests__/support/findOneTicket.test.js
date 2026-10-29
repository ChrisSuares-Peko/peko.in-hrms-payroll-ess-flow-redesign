const messages = require("../../../entities/support");
const { findOneTicket } = require("../../support");

jest.mock("../../../entities/support", () => ({
  findOne: jest.fn()
}));

describe("findOneTicket Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return ticket when found", async () => {
    const mockTicket = { id: 10, issueType: "Payment Error" };

    messages.findOne.mockResolvedValue(mockTicket);

    const result = await findOneTicket({ id: 10 });

    expect(messages.findOne).toHaveBeenCalledWith({
      where: { id: 10 }
    });

    expect(result).toEqual(mockTicket);
  });

  test("should return null when ticket does not exist", async () => {
    messages.findOne.mockResolvedValue(null);

    const result = await findOneTicket({ id: 999 });

    expect(messages.findOne).toHaveBeenCalledWith({
      where: { id: 999 }
    });

    expect(result).toBeNull();
  });

  test("should throw error on DB failure", async () => {
    messages.findOne.mockRejectedValue(new Error("DB ERROR"));

    await expect(findOneTicket({ id: 1 }))
      .rejects
      .toThrow("DB ERROR");

    expect(messages.findOne).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

});
