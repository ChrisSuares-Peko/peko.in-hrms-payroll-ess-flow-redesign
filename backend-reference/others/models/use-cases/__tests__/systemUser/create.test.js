const credential = require("../../../entities/credential");
// const systemUser = require("../../../entities/systemUser");
// const wallet = require("../../../entities/wallet");
// const emailer = require("../../../../utils/emailer");
const sequelize = require("../../../../configs/database/index");
const { create } = require("../../../use-cases/systemUser");

jest.mock("../../../entities/credential", () => ({
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../entities/systemUser", () => ({
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../entities/wallet", () => ({
  create: jest.fn(),
}));

jest.mock("../../../../utils/emailer", () => ({
  email: jest.fn(),
}));


describe("create", () => {
  let transaction;
  beforeEach(() => {
    jest.clearAllMocks();
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.transaction.mockResolvedValue(transaction);
  });

  it("should rollback the transaction and return an error on failure", async () => {
    const mockParams = { email: "test@example.com", passwordProtection: true };
    
    // Simulating a rejection in `credential.create` to trigger the error
    credential.create.mockRejectedValue(new Error("DB Error"));
  
    // Expecting the error response to be thrown and caught
    await expect(create(mockParams, null)).rejects.toThrow("Something went wrong, please try again later.");
  
    // Verifying that the transaction rollback is called
    expect(transaction.rollback).toHaveBeenCalled();
  });
  
});
