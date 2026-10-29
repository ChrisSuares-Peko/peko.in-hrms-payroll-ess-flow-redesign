const orders = require("../../../entities/order");
const transaction = require("../../../entities/transaction");
const { getIccidCodes } = require("../../notification");

jest.mock("../../../entities/transaction", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../../entities/order", () => ({
  findAll: jest.fn(),
}));

describe("getIccidCodes Service", () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  test("should return esim codes for valid batchId", async () => {
    transaction.findAll.mockResolvedValue([
      { dataValues: { orderId: 10 } },
      { dataValues: { orderId: 20 } }
    ]);

    orders.findAll.mockResolvedValue([
      { dataValues: { id: 10, orderResponse: JSON.stringify({ esim: "ICCID123" }) } },
      { dataValues: { id: 20, orderResponse: JSON.stringify({ esim: "ICCID999" }) } }
    ]);

    const result = await getIccidCodes("BATCH-1");

    // Validate ORM calls
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: { batchId: "BATCH-1" },
      attributes: ["orderId"]
    });

    expect(orders.findAll).toHaveBeenCalledWith({
      where: { id: [10, 20] },
      attributes: ["id", "orderResponse"]
    });

    expect(result).toEqual(["ICCID123", "ICCID999"]);
    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
  });

  test("should ignore orders where esim is missing", async () => {
    transaction.findAll.mockResolvedValue([
      { dataValues: { orderId: 1 } },
      { dataValues: { orderId: 2 } }
    ]);

    orders.findAll.mockResolvedValue([
      { dataValues: { id: 1, orderResponse: JSON.stringify({ esim: "ESIM-1" }) } },
      { dataValues: { id: 2, orderResponse: JSON.stringify({ someField: "X" }) } }
    ]);

    const result = await getIccidCodes("BATCH-2");

    expect(result).toEqual(["ESIM-1"]);
    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
  });

test("should return empty array when no transactions exist", async () => {
  // No transactions
  transaction.findAll.mockResolvedValue([]);

  // Must mock this! Otherwise Jest will reuse previous mock
  orders.findAll.mockResolvedValue([]);

  const result = await getIccidCodes("EMPTY-BATCH");

  expect(orders.findAll).toHaveBeenCalledWith({
    where: { id: [] },
    attributes: ["id", "orderResponse"]
  });

  expect(result).toEqual([]);
  expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
});


  test("should return empty array when no esim values exist", async () => {
    transaction.findAll.mockResolvedValue([
      { dataValues: { orderId: 100 } }
    ]);

    orders.findAll.mockResolvedValue([
      { dataValues: { id: 100, orderResponse: JSON.stringify({}) } }
    ]);

    const result = await getIccidCodes("NO-ESIM");

    expect(result).toEqual([]);
  });

  test("should gracefully handle invalid JSON and return undefined", async () => {
    transaction.findAll.mockResolvedValue([
      { dataValues: { orderId: 1 } }
    ]);

    orders.findAll.mockResolvedValue([
      { dataValues: { id: 1, orderResponse: "{INVALID_JSON" } }
    ]);

    const result = await getIccidCodes("BADJSON");

    // Function logs error and returns undefined due to swallowed exception
    expect(result).toBeUndefined();

    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
  });


  test("should catch error when database fails", async () => {
    transaction.findAll.mockRejectedValue(new Error("DB ERROR"));

    const result = await getIccidCodes("ERR");

    expect(result).toBeUndefined(); // function doesn't rethrow
    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
  });
});
