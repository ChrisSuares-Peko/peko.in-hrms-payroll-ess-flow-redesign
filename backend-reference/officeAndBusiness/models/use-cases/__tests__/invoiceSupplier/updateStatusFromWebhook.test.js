const invoiceSuppliers = require("../../../entities/invoiceSuppliers");
const { updateStatusFromWebhook } = require("../../invoiceSupplier");

jest.mock("../../../entities/invoiceSuppliers", () => ({
  update: jest.fn(),
}));

describe("updateStatusFromWebhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when update affects at least one row", async () => {
    invoiceSuppliers.update.mockResolvedValue([1]); // 1 row updated

    const result = await updateStatusFromWebhook(10, "SUCCESS");

    expect(invoiceSuppliers.update).toHaveBeenCalledWith(
      { kybStatus: "SUCCESS" },
      { where: { corporateUserId: 10 } }
    );

    expect(result).toBe(true);
  });

  it("should return false when update affects zero rows", async () => {
    invoiceSuppliers.update.mockResolvedValue([0]); // no row updated

    const result = await updateStatusFromWebhook(33, "FAILED");

    expect(result).toBe(false);
  });

  it("should throw an error when invoiceSuppliers.update throws", async () => {
    invoiceSuppliers.update.mockRejectedValue(new Error("DB crash"));

    await expect(updateStatusFromWebhook(5, "FAILED")).rejects.toThrow(
      "DB crash"
    );
  });

  it("should throw a generic error if error has no message", async () => {
    invoiceSuppliers.update.mockRejectedValue({}); // no message

    await expect(updateStatusFromWebhook(7, "PENDING")).rejects.toThrow(
      "Failed to update status"
    );
  });

  it("should work with any statusType string", async () => {
    invoiceSuppliers.update.mockResolvedValue([1]);

    await updateStatusFromWebhook(88, "IN_REVIEW");

    expect(invoiceSuppliers.update).toHaveBeenCalledWith(
      { kybStatus: "IN_REVIEW" },
      { where: { corporateUserId: 88 } }
    );
  });

  it("should handle corporateUserId being zero or falsy", async () => {
    invoiceSuppliers.update.mockResolvedValue([1]);

    const result = await updateStatusFromWebhook(0, "DONE");

    expect(result).toBe(true);
    expect(invoiceSuppliers.update).toHaveBeenCalledWith(
      { kybStatus: "DONE" },
      { where: { corporateUserId: 0 } }
    );
  });
});
