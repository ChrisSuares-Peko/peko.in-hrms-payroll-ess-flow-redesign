const transaction = require("../../../entities/transaction");
const { Op } = require("sequelize");
const {findAllFaildBulkTransactions} = require("../../transaction");
jest.mock("../../../entities/transaction");
jest.mock("../../../entities/serviceOperator");
jest.mock("../../../entities/credential");
jest.mock("../../../entities/order");

describe("findAllFaildBulkTransactions", () => {
  let mockParams;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks
    mockParams = {
      serviceAccessKey: "REDACTED",
      corporateId: "mockCorporateId",
      from: "2021-01-01",
      end: "2021-12-31",
      searchText: "mockSearchText",
      partnerId: "mockPartnerId",
    };
  });

  it("should return failed transactions with valid parameters", async () => {
    // Arrange: Mock the return value of `transaction.findAndCountAll`
    const mockFindAndCountAllResponse = {
      count: 1,
      rows: [{ id: 1, status: "FAILURE", batchId: "12345" }],
    };
    transaction.findAndCountAll.mockResolvedValue(mockFindAndCountAllResponse);

    // Act: Call the function
    const result = await findAllFaildBulkTransactions(mockParams);

    // Assert: Verify if the function returns the expected data
    expect(transaction.findAndCountAll).toHaveBeenCalledWith({
      include: expect.any(Array), // Check if the `include` option is passed correctly
      where: expect.objectContaining({
        transactionDate: {
          [Op.between]: [mockParams.from, mockParams.end],
        },
        batchId: { [Op.ne]: null },
        status: {
          [Op.or]: ["FAILURE", "PENDING", "REFUNDED"],
        },
        [Op.or]: [
          { batchId: { [Op.like]: "%" + mockParams.searchText + "%" } },
          { corporateTxnId: { [Op.like]: "%" + mockParams.searchText + "%" } },
        ],
        credentialId: mockParams.corporateId,
      }),
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockFindAndCountAllResponse);
  });

  it("should handle when no parameters are passed", async () => {
    mockParams = {
      serviceAccessKey: "",
      corporateId: "",
      from: "",
      end: "",
      searchText: "",
      partnerId: "",
    };
    
    const mockFindAndCountAllResponse = {
      count: 0,
      rows: [],
    };
    transaction.findAndCountAll.mockResolvedValue(mockFindAndCountAllResponse);

    const result = await findAllFaildBulkTransactions(mockParams);

    expect(result).toEqual(mockFindAndCountAllResponse);
  });

  it("should handle error when `findAndCountAll` throws an exception", async () => {
    const mockError = new Error("Database error");
    transaction.findAndCountAll.mockRejectedValue(mockError);

    await expect(findAllFaildBulkTransactions(mockParams)).rejects.toThrow("Database error");
  });
});
