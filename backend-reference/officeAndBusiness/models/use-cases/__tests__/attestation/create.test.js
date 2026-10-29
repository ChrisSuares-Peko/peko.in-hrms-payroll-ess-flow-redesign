const attestation = require("../../../entities/attestation");
const { create } = require("../../attestation");

jest.mock("../../../entities/attestation", () => ({
  create: jest.fn(),
}));

describe("attestation.create", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create attestation with given params", async () => {
    const params = { userId: 10, documentType: "PAN", status: "PENDING" };

    const mockCreatedRecord = { id: 1, ...params };

    attestation.create.mockResolvedValue(mockCreatedRecord);

    const result = await create(params);

    expect(attestation.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockCreatedRecord);
  });

  it("should handle when params is an empty object", async () => {
    attestation.create.mockResolvedValue({ id: 1 });

    const result = await create({});

    expect(attestation.create).toHaveBeenCalledWith({});
    expect(result).toEqual({ id: 1 });
  });

  it("should throw if attestation.create fails", async () => {
    const error = new Error("DB Error");
    attestation.create.mockRejectedValue(error);

    await expect(create({ userId: 99 })).rejects.toThrow("DB Error");
  });

  it("should throw if params is undefined", async () => {
    attestation.create.mockRejectedValue(new Error("Invalid params"));

    await expect(create()).rejects.toThrow();
  });

});
