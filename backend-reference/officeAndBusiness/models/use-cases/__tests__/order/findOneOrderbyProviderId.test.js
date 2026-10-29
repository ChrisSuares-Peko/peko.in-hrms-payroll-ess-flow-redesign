const order = require("../../../entities/order");
const { findOneOrderbyProviderId } = require("../../order");

jest.mock("../../../entities/order", () => ({
  findOne: jest.fn(),
}));

describe("findOneOrderbyProviderId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the matching order when found", async () => {
    const params = { ref_id: "ABC123" };
    const mockOrder = { id: 1, providerId: "ABC123" };

    order.findOne.mockResolvedValue(mockOrder);

    const result = await findOneOrderbyProviderId(params);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { providerId: "ABC123" },
    });

    expect(result).toEqual(mockOrder);
  });

  it("should return null when no order is found", async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneOrderbyProviderId({ ref_id: "XYZ999" });

    expect(result).toBeNull();
  });

  it("should pass providerId as undefined if params.ref_id is missing", async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneOrderbyProviderId({}); // missing ref_id

    expect(order.findOne).toHaveBeenCalledWith({
      where: { providerId: undefined },
    });

    expect(result).toBeNull();
  });

  it("should handle undefined params gracefully", async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneOrderbyProviderId(undefined);

    // params is undefined → params.ref_id throws normally,
    // but since your function does NOT guard it,
    // result will be undefined and findOne won't be called.

    expect(order.findOne).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should return undefined when DB throws an error", async () => {
    const error = new Error("DB Error");
    order.findOne.mockRejectedValue(error);

    const result = await findOneOrderbyProviderId({ ref_id: "TEST" });

    expect(result).toBeUndefined(); // function catches error and returns nothing
  });
});
