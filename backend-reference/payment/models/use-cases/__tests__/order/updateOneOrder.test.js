const { customLog } = require("../../../../utils/loggerHelper");
const order = require("../../../entities/order");
const { updateOneOrder } = require("../../order");

jest.mock("../../../entities/order", () => ({
  update: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock("../../../../utils/loggerHelper", () => ({
  customLog: jest.fn()
}));

describe("updateOneOrder Service", () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  test("should update order and return updated record", async () => {
    order.update.mockResolvedValue([1]); // 1 row updated
    const mockOrder = { id: 10, corporateTxnId: "TXN1" };
    order.findByPk.mockResolvedValue(mockOrder);

    const result = await updateOneOrder("TXN1", { status: "completed" });

    expect(order.update).toHaveBeenCalledWith(
      { status: "completed" },
      { where: { corporateTxnId: "TXN1" } }
    );

    expect(order.findByPk).toHaveBeenCalledWith("TXN1");

    expect(result).toEqual(mockOrder);

    expect(customLog).toHaveBeenCalledWith(
      null,
      "info",
      { message: "ORDER UPDATE ONE ROUTE CALLED" }
    );
  });

  test("should return undefined when no rows are updated", async () => {
    order.update.mockResolvedValue([0]); // no updated rows

    const result = await updateOneOrder("TXN2", { status: "failed" });

    expect(order.update).toHaveBeenCalledWith(
      { status: "failed" },
      { where: { corporateTxnId: "TXN2" } }
    );

    expect(order.findByPk).not.toHaveBeenCalled();

    expect(result).toBeUndefined();

    expect(customLog).toHaveBeenCalledWith(
      null,
      "info",
      { message: "ORDER UPDATE ONE ROUTE CALLED" }
    );
  });

  test("should catch error and return false", async () => {
    order.update.mockRejectedValue(new Error("DB error"));

    const result = await updateOneOrder("TXN3", { status: "pending" });

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result).toBe(false);

    expect(customLog).toHaveBeenCalledWith(
      null,
      "info",
      { message: "ORDER UPDATE ONE ROUTE CALLED" }
    );
  });

  test("should always call customLog (finally)", async () => {
    order.update.mockResolvedValue([1]);
    order.findByPk.mockResolvedValue({});

    await updateOneOrder("TXN4", {});

    expect(customLog).toHaveBeenCalledWith(
      null,
      "info",
      { message: "ORDER UPDATE ONE ROUTE CALLED" }
    );
  });

});
