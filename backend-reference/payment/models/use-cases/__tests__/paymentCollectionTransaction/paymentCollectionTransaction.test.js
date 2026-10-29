const entity = require("../../../entities/paymentCollectionTransaction");
const {
  normalizeUnifiedStatus,
  appendTimelineEvent,
  createPendingUnifiedTransaction,
  upsertUnifiedTransactionStatus,
} = require("../../paymentCollectionTransaction");

jest.mock("../../../entities/paymentCollectionTransaction", () => ({
  findOrCreate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe("normalizeUnifiedStatus", () => {
  it("maps provider statuses into the unified buckets", () => {
    ["SETTLED", "SETTLEMENT_SUCCESS", "SETTLEMENT_DONE"].forEach((s) =>
      expect(normalizeUnifiedStatus(s)).toBe("SETTLED")
    );
    ["SUCCESS", "COMPLETED", "PAID", "APPROVED", "ACTIVE", "REGISTERED"].forEach((s) =>
      expect(normalizeUnifiedStatus(s)).toBe("SUCCESS")
    );
    ["FAILED", "ERROR", "DECLINED", "REJECTED", "EXPIRED"].forEach((s) =>
      expect(normalizeUnifiedStatus(s)).toBe("FAILED")
    );
    ["CANCELLED", "CANCELED", "VOID", "VOIDED"].forEach((s) =>
      expect(normalizeUnifiedStatus(s)).toBe("CANCELLED")
    );
    ["PENDING", "PROCESSING", "IN_PROGRESS", "INITIATED"].forEach((s) =>
      expect(normalizeUnifiedStatus(s)).toBe("PENDING")
    );
  });

  it("is case/whitespace-insensitive and defaults unknown/empty to PENDING", () => {
    expect(normalizeUnifiedStatus("  paid  ")).toBe("SUCCESS");
    expect(normalizeUnifiedStatus("")).toBe("PENDING");
    expect(normalizeUnifiedStatus(null)).toBe("PENDING");
    expect(normalizeUnifiedStatus("SOMETHING_ELSE")).toBe("PENDING");
  });
});

describe("appendTimelineEvent", () => {
  it("appends a normalized event and keeps existing ones", () => {
    const events = appendTimelineEvent([], { key: "created", status: "paid", occurredAt: "2026-08-06T00:00:00Z" });
    expect(events).toHaveLength(1);
    expect(events[0].key).toBe("created");
    expect(events[0].status).toBe("SUCCESS"); // normalized
  });

  it("dedupes by key + occurredAt", () => {
    const existing = [{ key: "created", occurredAt: "2026-08-06T00:00:00.000Z" }];
    const events = appendTimelineEvent(existing, { key: "created", occurredAt: "2026-08-06T00:00:00Z" });
    expect(events).toHaveLength(1);
  });

  it("ignores a non-object or key-less event", () => {
    expect(appendTimelineEvent([], null)).toEqual([]);
    expect(appendTimelineEvent([], { key: "  " })).toEqual([]);
  });
});

describe("createPendingUnifiedTransaction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates required fields and source", async () => {
    await expect(createPendingUnifiedTransaction({})).rejects.toThrow("credentialId is required");
    await expect(createPendingUnifiedTransaction({ credentialId: 1 })).rejects.toThrow("sourceTxnId is required");
    await expect(
      createPendingUnifiedTransaction({ credentialId: 1, sourceTxnId: "t" })
    ).rejects.toThrow("amount is required");
    await expect(
      createPendingUnifiedTransaction({ credentialId: 1, sourceTxnId: "t", amount: 10, source: "bad" })
    ).rejects.toThrow("Invalid source");
  });

  it("creates a pending row via findOrCreate", async () => {
    entity.findOrCreate.mockResolvedValue([{ id: 1 }, true]);
    const res = await createPendingUnifiedTransaction({
      credentialId: 1,
      source: "payment_link",
      sourceTxnId: "t1",
      amount: 500,
    });
    expect(entity.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { source: "payment_link", sourceTxnId: "t1" } })
    );
    expect(res.created).toBe(true);
  });

  it("appends a missing timeline event on an existing row and saves", async () => {
    const transaction = { timelineEvents: [], save: jest.fn() };
    entity.findOrCreate.mockResolvedValue([transaction, false]);
    await createPendingUnifiedTransaction({
      credentialId: 1,
      source: "payment_qr",
      sourceTxnId: "t2",
      amount: 500,
    });
    expect(transaction.save).toHaveBeenCalled();
  });
});

describe("upsertUnifiedTransactionStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates sourceTxnId, status and source", async () => {
    await expect(upsertUnifiedTransactionStatus({})).rejects.toThrow("sourceTxnId is required");
    await expect(upsertUnifiedTransactionStatus({ sourceTxnId: "t" })).rejects.toThrow("status is required");
    await expect(
      upsertUnifiedTransactionStatus({ sourceTxnId: "t", status: "PAID", source: "bad" })
    ).rejects.toThrow("Invalid source");
  });

  it("creates the transaction when missing (given credentialId + amount)", async () => {
    entity.findOne.mockResolvedValue(null);
    entity.create.mockResolvedValue({ id: 1, status: "SUCCESS" });
    const res = await upsertUnifiedTransactionStatus({
      credentialId: 1,
      source: "payment_link",
      sourceTxnId: "t1",
      status: "PAID",
      amount: 500,
    });
    expect(entity.create).toHaveBeenCalledWith(expect.objectContaining({ status: "SUCCESS" }));
    expect(res).toMatchObject({ created: true, updated: true });
  });

  it("throws when the transaction is missing and no credentialId is given", async () => {
    entity.findOne.mockResolvedValue(null);
    await expect(
      upsertUnifiedTransactionStatus({ source: "payment_link", sourceTxnId: "t1", status: "PAID" })
    ).rejects.toThrow("credentialId is required when upserting missing transaction");
  });

  it("updates + saves an existing row when the status changes", async () => {
    const transaction = { status: "PENDING", timelineEvents: [], rawPayload: {}, save: jest.fn() };
    entity.findOne.mockResolvedValue(transaction);
    const res = await upsertUnifiedTransactionStatus({
      source: "payment_link",
      sourceTxnId: "t1",
      status: "SUCCESS",
    });
    expect(transaction.status).toBe("SUCCESS");
    expect(transaction.save).toHaveBeenCalled();
    expect(res.updated).toBe(true);
  });

  it("does not save when nothing changed", async () => {
    const occurredAt = "2026-08-06T00:00:00.000Z";
    const transaction = {
      status: "SUCCESS",
      providerTxnId: null,
      sourceParentId: null,
      customerName: null,
      customerPhone: null,
      linkUrl: null,
      reference: null,
      purposeMessage: null,
      currency: "INR",
      qrImageUrl: null,
      amount: 500,
      createdMilestoneAt: new Date(occurredAt),
      outcomeMilestoneAt: new Date(occurredAt),
      timelineEvents: [{ key: "status_success", occurredAt }],
      save: jest.fn(),
    };
    entity.findOne.mockResolvedValue(transaction);
    const res = await upsertUnifiedTransactionStatus({
      source: "payment_link",
      sourceTxnId: "t1",
      status: "SUCCESS",
      currency: "INR",
      occurredAt,
      event: { key: "status_success", occurredAt },
    });
    expect(transaction.save).not.toHaveBeenCalled();
    expect(res.updated).toBe(false);
  });
});
