const invoiceSupplier = require("../../../entities/invoiceSuppliers");
const { updateKyb } = require("../../paymentLink");

jest.mock("../../../entities/paymentLink", () => ({
  update: jest.fn(),
}));

describe("updateKyb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update KYB with correct params and return the result", async () => {
    invoiceSupplier.update.mockResolvedValue([1]);

    const result = await updateKyb(101, "COMPANY");

    expect(invoiceSupplier.update).toHaveBeenCalledWith(
      {
        kybStatus: "IN PROGRESS",
        businessType: "COMPANY",
      },
      {
        where: { corporateUserId: 101 },
      }
    );

    expect(result).toEqual([1]);
  });

  it("should return [0] when no record is updated", async () => {
    invoiceSupplier.update.mockResolvedValue([0]);

    const result = await updateKyb(202, "Sole Proprietorship");

    expect(result).toEqual([0]);
  });

  it("should throw error when invoiceSupplier.update fails", async () => {
    invoiceSupplier.update.mockRejectedValue(new Error("DB exploded"));

    await expect(updateKyb(500, "LLP")).rejects.toThrow(
      "Failed to update KYB status"
    );
  });

  it("should call update with correct structure", async () => {
    invoiceSupplier.update.mockResolvedValue([1]);

    await updateKyb(999, "OPC");

    expect(invoiceSupplier.update).toHaveBeenCalledTimes(1);
    expect(invoiceSupplier.update.mock.calls[0][0]).toEqual({
      kybStatus: "IN PROGRESS",
      businessType: "OPC",
    });
    expect(invoiceSupplier.update.mock.calls[0][1]).toEqual({
      where: { corporateUserId: 999 },
    });
  });
});
