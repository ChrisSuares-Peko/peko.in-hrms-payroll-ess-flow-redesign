const wallet = require("../../../entities/wallet");
const { findOneWallet } = require("../../wallets");

jest.mock("../../../entities/wallet", () => ({
  findOne: jest.fn()
}));

describe("findOneWallet Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return wallet balance when found", async () => {
    const mockWallet = { balance: 500 };

    wallet.findOne.mockResolvedValue(mockWallet);

    const result = await findOneWallet("CRED123");

    expect(wallet.findOne).toHaveBeenCalledWith({
      where: { credentialId: "CRED123" },
      raw: true,
      attributes: ["balance"]
    });

    expect(result).toEqual(mockWallet);
  });

  test("should return null when no wallet record is found", async () => {
    wallet.findOne.mockResolvedValue(null);

    const result = await findOneWallet("CRED999");

    expect(wallet.findOne).toHaveBeenCalledWith({
      where: { credentialId: "CRED999" },
      raw: true,
      attributes: ["balance"]
    });

    expect(result).toBeNull();
  });

  test("should return false when DB error occurs", async () => {
    wallet.findOne.mockRejectedValue(new Error("DB ERROR"));

    const result = await findOneWallet("CRED_ERR");

    expect(result).toBe(false);
  });

});
