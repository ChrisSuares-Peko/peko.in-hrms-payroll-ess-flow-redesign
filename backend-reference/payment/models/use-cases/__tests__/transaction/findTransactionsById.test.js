
const credential = require("../../../entities/credential");
const orders = require("../../../entities/order");
const serviceOperators = require("../../../entities/serviceOperator");
const transaction = require("../../../entities/transaction");
const { findTransactionsById } = require("../../transaction");

jest.mock("../../../entities/transaction", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/order", () => ({}));
jest.mock("../../../entities/serviceOperator", () => ({}));
jest.mock("../../../entities/credential", () => ({}));

describe("findTransactionsById Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return transaction details when found", async () => {
    const mockTransaction = {
      corporateTxnId: "TXN123",
      amount: 100,
      orders: { id: 1 },
      serviceOperator: { id: 2 },
      credential: { id: 3, username: "john" }
    };

    transaction.findOne.mockResolvedValue(mockTransaction);

    const result = await findTransactionsById("TXN123");

    expect(transaction.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: "TXN123" },
      include: [
        { model: orders },
        { model: serviceOperators },
        {
          model: credential,
          attributes: ["id", "role", "username", "name", "email"],
          required: true
        }
      ],
      raw: true,
      nest: true
    });

    expect(result).toEqual(mockTransaction);
  });

  test("should return null when transaction record is not found", async () => {
    transaction.findOne.mockResolvedValue(null);

    const result = await findTransactionsById("NOPE");

    expect(transaction.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: "NOPE" },
      include: [
        { model: orders },
        { model: serviceOperators },
        {
          model: credential,
          attributes: ["id", "role", "username", "name", "email"],
          required: true
        }
      ],
      raw: true,
      nest: true
    });

    expect(result).toBeNull();
  });

  test("should throw error when DB query fails", async () => {
    transaction.findOne.mockRejectedValue(new Error("DB ERROR"));

    await expect(findTransactionsById("ERR123")).rejects.toThrow("DB ERROR");
  });
});
