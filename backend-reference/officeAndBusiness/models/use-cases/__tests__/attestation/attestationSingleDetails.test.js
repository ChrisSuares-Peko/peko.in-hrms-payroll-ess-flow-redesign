const attestation = require("../../../entities/attestation");

const { attestationSingleDetails } = require("../../attestation");

jest.mock("../../../entities/attestation", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../../entities/corporateUser", () => ({
  hasMany: jest.fn(),
}));

jest.mock("../../../entities/transaction", () => ({
  belongsTo: jest.fn(),
}));

describe("attestationSingleDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return attestation details with nested credential and transaction", async () => {
    const params = { id: 100 };

    const mockResult = {
      id: 100,
      credential: { id: 1, name: "John Corp" },
      transaction: { corporateTxnId: "TXN123", status: "SUCCESS" },
    };

    attestation.findOne.mockResolvedValue(mockResult);

    const result = await attestationSingleDetails(params);

    expect(attestation.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            attributes: ["id", "name"]
          }),
          expect.objectContaining({
            attributes: ["corporateTxnId", "status"]
          })
        ]),
        where: { id: params.id },
        raw: true,
        nest: true
      })
    );


    expect(result).toEqual(mockResult);
  });

  it("should return null when no attestation found", async () => {
    attestation.findOne.mockResolvedValue(null);

    const result = await attestationSingleDetails({ id: 999 });

    expect(result).toBeNull();
  });

  it("should throw an error when findOne fails", async () => {
    attestation.findOne.mockRejectedValue(new Error("DB error"));

    await expect(attestationSingleDetails({ id: 50 })).rejects.toThrow("DB error");
  });

  it("should call findOne with correct where clause", async () => {
    attestation.findOne.mockResolvedValue({});

    await attestationSingleDetails({ id: 7 });

    expect(attestation.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
      })
    );
  });

  it("should pass raw:true and nest:true", async () => {
    attestation.findOne.mockResolvedValue({});

    await attestationSingleDetails({ id: 5 });

    expect(attestation.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        raw: true,
        nest: true,
      })
    );
  });

  it("should handle when params object is missing id", async () => {
    attestation.findOne.mockResolvedValue(null);

    const result = await attestationSingleDetails({});

    expect(attestation.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: undefined },
      })
    );

    expect(result).toBeNull();
  });

  it("should throw if params is undefined", async () => {
    await expect(attestationSingleDetails()).rejects.toThrow();
  });
});
