const { Op } = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const configAuditLog = require("../../entities/configAuditLog");
const vendorDeposits = require("../../entities/vendorDeposit");
const vendorLedgerEntries = require("../../entities/vendorLedgerEntry");
const partnerPayouts = require("../../entities/partnerPayout");
const partnerLedgerEntries = require("../../entities/partnerLedgerEntry");
const paymentGatewaySettlements = require("../../entities/paymentGatewaySettlement");
const { bindRequestContext } = require("../../../utils/requestContext");
const { OUTCOMES, field, editEntry, deleteEntry, tagBooks, earliestDate } = require("../ledgerEntryChanges");
const {
    updateDeposit,
    deleteDeposit,
    tagDepositBooks,
    findFirstEntryDate: firstDepositDate,
} = require("../vendorDeposits");
const { updateEntry: updateVendorEntry, tagEntryBooks: tagVendorEntryBooks } = require("../vendorLedgerEntries");
const { updatePayout, findFirstPayoutDate } = require("../partnerPayouts");
const { deleteEntry: deletePartnerEntry } = require("../partnerLedgerEntries");
const { updateSettlement, deleteSettlement, tagSettlementBooks } = require("../paymentGatewaySettlements");

jest.mock("../../entities/configAuditLog", () => ({ create: jest.fn() }));
jest.mock("../../entities/vendorDeposit", () => ({ findOne: jest.fn() }));
jest.mock("../../entities/vendorLedgerEntry", () => ({ findOne: jest.fn() }));
jest.mock("../../entities/partnerPayout", () => ({ findOne: jest.fn() }));
jest.mock("../../entities/partnerLedgerEntry", () => ({ findOne: jest.fn() }));
jest.mock("../../entities/paymentGatewaySettlement", () => ({ findOne: jest.fn() }));

const ACTOR = { id: 42, name: "Ibrahim" };

const rowOf = attrs => ({
    ...attrs,
    get: jest.fn(() => ({ ...attrs })),
    update: jest.fn(async () => undefined),
    destroy: jest.fn(async () => undefined),
});

const AUDIT = {
    configType: "VENDOR_LEDGER",
    table: "vendorDeposits",
    partnerName: null,
    labelOf: row => `Cleartrip › Deposit ${row.reference}`,
};

const FIELDS = [
    field("amount", "amount", "amount"),
    field("depositDate", "date", "date"),
    field("reference", "reference", "text"),
    field("mode", "mode", "text"),
    field("note", "note", "text"),
];

const DEPOSIT = {
    id: 3,
    vendorId: 1,
    amount: "25000.0000",
    depositDate: "2026-09-18",
    reference: "UTR-1",
    mode: "NEFT",
    note: null,
    status: "ACTIVE",
    entryType: "DEPOSIT",
    slipName: "old.pdf",
};

const SAME = { amount: 25000, depositDate: new Date("2026-09-18"), reference: "UTR-1", mode: "NEFT", note: "" };

const NOT_IN_BOOKS = { booksSynced: false, booksSyncedAt: null, booksSyncedById: null, booksSyncedByName: null };

const modelWith = row => ({ findOne: jest.fn().mockResolvedValue(row) });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
});

describe("editing an entry recorded by hand", () => {
    it("changes only what differs and writes one audit row in the same transaction", async () => {
        const row = rowOf(DEPOSIT);
        const model = modelWith(row);

        const result = await editEntry({
            model,
            where: { id: 3, vendorId: 1 },
            fields: FIELDS,
            values: { ...SAME, amount: 25500 },
            actor: ACTOR,
            changeReason: "Typed the wrong amount",
            audit: AUDIT,
        });

        expect(model.findOne).toHaveBeenCalledWith({
            where: { id: 3, vendorId: 1 },
            transaction: "TXN",
            lock: true,
            paranoid: false,
        });
        expect(row.update).toHaveBeenCalledWith({ amount: 25500, ...NOT_IN_BOOKS }, { transaction: "TXN" });
        expect(configAuditLog.create).toHaveBeenCalledWith(
            {
                actorId: 42,
                source: "ACCOUNTING_PORTAL",
                configType: "VENDOR_LEDGER",
                action: "UPDATE",
                targetTable: "vendorDeposits",
                targetId: 3,
                targetLabel: "Cleartrip › Deposit UTR-1",
                partnerName: null,
                ipAddress: null,
                changes: [
                    { field: "amount", from: 25000, to: 25500 },
                    { field: "changeReason", from: null, to: "Typed the wrong amount" },
                ],
            },
            { transaction: "TXN" }
        );
        expect(result).toEqual({ outcome: OUTCOMES.updated, row: expect.objectContaining({ id: 3, amount: 25500 }) });
    });

    it("replaces the document and says so in the audit", async () => {
        const row = rowOf(DEPOSIT);
        const slip = { key: "s3/new", name: "new.pdf", format: "pdf" };

        await editEntry({ model: modelWith(row), where: {}, fields: FIELDS, values: SAME, slip, actor: ACTOR, changeReason: "Better scan", audit: AUDIT });

        expect(row.update).toHaveBeenCalledWith(
            { slipKey: "s3/new", slipName: "new.pdf", slipFormat: "pdf", ...NOT_IN_BOOKS },
            { transaction: "TXN" }
        );
        expect(configAuditLog.create.mock.calls[0][0].changes[0]).toEqual({ field: "document", from: "old.pdf", to: "new.pdf" });
    });

    it("writes nothing when nothing differs", async () => {
        const row = rowOf(DEPOSIT);

        const result = await editEntry({ model: modelWith(row), where: {}, fields: FIELDS, values: SAME, actor: ACTOR, changeReason: "x", audit: AUDIT });

        expect(result).toEqual({ outcome: OUTCOMES.unchanged });
        expect(row.update).not.toHaveBeenCalled();
        expect(configAuditLog.create).not.toHaveBeenCalled();
    });

    it("leaves a reversed original, a reversal row and a missing entry alone, and honours a guard", async () => {
        const voided = rowOf({ ...DEPOSIT, status: "VOIDED" });
        const contra = rowOf({ ...DEPOSIT, entryType: "REVERSAL" });
        const args = { where: {}, fields: FIELDS, values: { ...SAME, amount: 1 }, actor: ACTOR, changeReason: "x", audit: AUDIT };

        expect(await editEntry({ ...args, model: modelWith(voided) })).toEqual({ outcome: OUTCOMES.reversed });
        expect(await editEntry({ ...args, model: modelWith(contra) })).toEqual({ outcome: OUTCOMES.reversed });
        expect(await editEntry({ ...args, model: modelWith(null) })).toEqual({ outcome: OUTCOMES.missing });
        expect(await editEntry({ ...args, model: modelWith(rowOf(DEPOSIT)), guard: () => "Not this one" })).toEqual({
            outcome: OUTCOMES.refused,
            reason: "Not this one",
        });
        expect(voided.update).not.toHaveBeenCalled();
        expect(configAuditLog.create).not.toHaveBeenCalled();
    });
});

describe("deleting an entry recorded by hand", () => {
    it("marks it deleted and out of the books, keeping every value it had, with the reason, in the audit", async () => {
        const row = rowOf({ ...DEPOSIT, note: "first top up", booksSynced: true });

        const result = await deleteEntry({ model: modelWith(row), where: { id: 3 }, fields: FIELDS, actor: ACTOR, changeReason: "Recorded twice", audit: AUDIT });

        expect(row.update).toHaveBeenCalledWith(
            {
                ...NOT_IN_BOOKS,
                deletedById: 42,
                deletedByName: "Ibrahim",
                deleteReason: "Recorded twice",
            },
            { transaction: "TXN" }
        );
        expect(row.update.mock.calls[0][0]).not.toHaveProperty("deletedAt");
        expect(row.destroy).toHaveBeenCalledWith({ transaction: "TXN" });
        expect(row.destroy.mock.calls[0][0]).not.toHaveProperty("force");
        expect(configAuditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "DELETE",
                targetId: 3,
                changes: [
                    { field: "amount", from: 25000, to: null },
                    { field: "date", from: "2026-09-18", to: null },
                    { field: "reference", from: "UTR-1", to: null },
                    { field: "mode", from: "NEFT", to: null },
                    { field: "note", from: "first top up", to: null },
                    { field: "document", from: "old.pdf", to: null },
                    { field: "changeReason", from: null, to: "Recorded twice" },
                ],
            }),
            { transaction: "TXN" }
        );
        expect(result).toEqual({
            outcome: OUTCOMES.deleted,
            row: expect.objectContaining({ id: 3, reference: "UTR-1", booksSynced: false, deletedAt: expect.any(Date) }),
        });
    });

    it("takes who did it and where from the request when no actor is passed", async () => {
        const req = { user: { id: 7 }, headers: {}, originalUrl: "/api/v1/system_user/7/others/transferFunds" };

        await new Promise(resolve =>
            bindRequestContext(req, {}, () =>
                resolve(deleteEntry({ model: modelWith(rowOf(DEPOSIT)), where: {}, fields: FIELDS, changeReason: "x", audit: AUDIT }))
            )
        );

        expect(configAuditLog.create.mock.calls[0][0]).toMatchObject({ actorId: 7, source: "ADMIN_PANEL" });
    });

    it("refuses a reversed entry", async () => {
        const row = rowOf({ ...DEPOSIT, status: "VOIDED" });

        expect(await deleteEntry({ model: modelWith(row), where: {}, fields: FIELDS, changeReason: "x", audit: AUDIT })).toEqual({
            outcome: OUTCOMES.reversed,
        });
        expect(row.destroy).not.toHaveBeenCalled();
    });
});

describe("the earliest date", () => {
    it("reads dates and days alike and skips the blanks", () => {
        expect(earliestDate([null, "2026-09-20", new Date("2026-09-12"), "2026-10-01"])).toBe("2026-09-12");
        expect(earliestDate([undefined, ""])).toBeNull();
    });
});

describe("each ledger's own entries", () => {
    const LEDGER_AUDIT = { configType: "X_LEDGER", partnerName: null, labelOf: () => "Label" };

    it("edits a vendor opening under its own key and only its amount, date and note", async () => {
        vendorDeposits.findOne.mockResolvedValue(
            rowOf({ ...DEPOSIT, entryType: "OPENING", reference: null, mode: "OTHER", note: "old" })
        );

        await updateDeposit({
            id: 3,
            vendorId: 1,
            entryType: "OPENING",
            values: { amount: 1000, depositDate: "2026-08-30", note: "carried in", reference: "ignored", mode: "UPI" },
            actor: ACTOR,
            changeReason: "Statement figure",
            audit: LEDGER_AUDIT,
        });

        expect(vendorDeposits.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 3, vendorId: 1, entryType: "OPENING" } })
        );
        const entry = configAuditLog.create.mock.calls[0][0];
        expect(entry.targetTable).toBe("vendorDeposits");
        expect(entry.changes.map(change => change.field)).toEqual(["amount", "date", "note", "changeReason"]);
    });

    it("deletes a vendor deposit under its own key", async () => {
        vendorDeposits.findOne.mockResolvedValue(rowOf(DEPOSIT));

        await deleteDeposit({ id: 3, vendorId: 1, entryType: "DEPOSIT", actor: ACTOR, changeReason: "x", audit: LEDGER_AUDIT });

        expect(vendorDeposits.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 3, vendorId: 1, entryType: "DEPOSIT" } })
        );
    });

    it("edits a vendor credit note's reason and order reference by kind", async () => {
        vendorLedgerEntries.findOne.mockResolvedValue(
            rowOf({ id: 8, vendorId: 1, kind: "CREDIT_NOTE", reference: "CN-1", amount: "100.0000", issueDate: "2026-09-20", reason: null, againstCorporateTxnId: null, status: "OPEN", entryType: "ENTRY" })
        );

        await updateVendorEntry({
            id: 8,
            vendorId: 1,
            kind: "CREDIT_NOTE",
            values: { reference: "CN-1", amount: 100, issueDate: "2026-09-20", reason: "Short delivery", againstCorporateTxnId: "TXN-9" },
            actor: ACTOR,
            changeReason: "Added the order",
            audit: LEDGER_AUDIT,
        });

        expect(vendorLedgerEntries.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 8, vendorId: 1, kind: "CREDIT_NOTE" } })
        );
        expect(configAuditLog.create.mock.calls[0][0].changes.slice(0, 2)).toEqual([
            { field: "reason", from: null, to: "Short delivery" },
            { field: "againstOrder", from: null, to: "TXN-9" },
        ]);
    });

    it("edits a partner payout by its kind and deletes a debit note by its kind", async () => {
        partnerPayouts.findOne.mockResolvedValue(
            rowOf({ id: 4, partnerCredentialId: 55, entryKind: "PAYOUT", entryType: "PAYOUT", status: "ACTIVE", amount: "500.0000", payoutDate: "2026-09-25", reference: "P-1", mode: "NEFT", note: null })
        );
        partnerLedgerEntries.findOne.mockResolvedValue(
            rowOf({ id: 6, partnerCredentialId: 55, kind: "DEBIT_NOTE", entryType: "ENTRY", status: "OPEN", reference: "DN-1", amount: "50.0000", issueDate: "2026-09-26" })
        );

        await updatePayout({
            id: 4,
            partnerCredentialId: 55,
            entryKind: "PAYOUT",
            values: { amount: 450, payoutDate: "2026-09-25", reference: "P-1", mode: "NEFT", note: "" },
            actor: ACTOR,
            changeReason: "Bank charge",
            audit: LEDGER_AUDIT,
        });
        await deletePartnerEntry({ id: 6, partnerCredentialId: 55, kind: "DEBIT_NOTE", actor: ACTOR, changeReason: "x", audit: LEDGER_AUDIT });

        expect(partnerPayouts.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 4, partnerCredentialId: 55, entryKind: "PAYOUT" } })
        );
        expect(partnerLedgerEntries.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 6, partnerCredentialId: 55, kind: "DEBIT_NOTE" } })
        );
        expect(configAuditLog.create.mock.calls.map(([entry]) => entry.targetTable)).toEqual([
            "partnerPayouts",
            "partnerLedgerEntries",
        ]);
    });

    it("refuses to change a gateway entry recorded together with its fee", async () => {
        paymentGatewaySettlements.findOne.mockResolvedValue(
            rowOf({ id: 9, gatewayAccountId: "PG1", entryKind: "RECEIPT", entryType: "ENTRY", status: "ACTIVE", settlementId: 77, amount: "900.0000" })
        );

        const edited = await updateSettlement({ id: 9, gatewayAccountId: "PG1", entryKind: "RECEIPT", values: { amount: 1 }, actor: ACTOR, changeReason: "x", audit: LEDGER_AUDIT });
        const deleted = await deleteSettlement({ id: 9, gatewayAccountId: "PG1", entryKind: "RECEIPT", actor: ACTOR, changeReason: "x", audit: LEDGER_AUDIT });

        expect(edited).toEqual({ outcome: OUTCOMES.refused, reason: "This entry was recorded together with its fee, so it can only be reversed" });
        expect(deleted.outcome).toBe(OUTCOMES.refused);
        expect(configAuditLog.create).not.toHaveBeenCalled();
    });

    it("reads the first entry dated on a ledger, leaving the opening out", async () => {
        vendorDeposits.findOne.mockResolvedValueOnce({ depositDate: "2026-09-05" }).mockResolvedValueOnce(null);
        partnerPayouts.findOne.mockResolvedValue({ payoutDate: "2026-09-07" });

        expect(await firstDepositDate(1)).toBe("2026-09-05");
        expect(await firstDepositDate(2)).toBeNull();
        expect(await findFirstPayoutDate(55)).toBe("2026-09-07");
        expect(vendorDeposits.findOne).toHaveBeenCalledWith({
            attributes: ["depositDate"],
            where: { vendorId: 1, entryType: { [Op.ne]: "OPENING" } },
            order: [["depositDate", "ASC"]],
            raw: true,
        });
        expect(partnerPayouts.findOne.mock.calls[0][0].where).toEqual({ partnerCredentialId: 55, entryKind: "PAYOUT" });
    });
});

describe("an entry and the books", () => {
    const tag = (row, synced) =>
        tagBooks({ model: modelWith(row), where: { id: 3 }, synced, actor: ACTOR, audit: AUDIT });

    it("takes the synced mark off when an entry is edited, and says so in the audit", async () => {
        const row = rowOf({ ...DEPOSIT, booksSynced: true, booksSyncedByName: "Asha" });

        await editEntry({ model: modelWith(row), where: {}, fields: FIELDS, values: { ...SAME, note: "corrected" }, actor: ACTOR, changeReason: "Typo", audit: AUDIT });

        expect(row.update.mock.calls[0][0]).toMatchObject(NOT_IN_BOOKS);
        expect(configAuditLog.create.mock.calls[0][0].changes).toContainEqual({ field: "booksSynced", from: true, to: false });
    });

    it("refuses to change or delete an entry that is deleted and waiting for the books", async () => {
        const waiting = () => rowOf({ ...DEPOSIT, deletedAt: new Date("2026-10-08") });

        expect(await editEntry({ model: modelWith(waiting()), where: {}, fields: FIELDS, values: SAME, changeReason: "x", audit: AUDIT })).toEqual({
            outcome: OUTCOMES.pendingRemoval,
        });
        expect(await deleteEntry({ model: modelWith(waiting()), where: {}, fields: FIELDS, changeReason: "x", audit: AUDIT })).toEqual({
            outcome: OUTCOMES.pendingRemoval,
        });
        expect(configAuditLog.create).not.toHaveBeenCalled();
    });

    it("marks an entry as in the books with who and when, and writes it down", async () => {
        const row = rowOf({ ...DEPOSIT, booksSynced: false });

        const result = await tag(row, true);

        expect(row.update).toHaveBeenCalledWith(
            { booksSynced: true, booksSyncedAt: expect.any(Date), booksSyncedById: 42, booksSyncedByName: "Ibrahim" },
            { transaction: "TXN" }
        );
        expect(configAuditLog.create.mock.calls[0][0]).toMatchObject({
            action: "UPDATE",
            changes: [{ field: "booksSynced", from: false, to: true }],
        });
        expect(result.outcome).toBe(OUTCOMES.updated);
    });

    it("can take the mark off again, and does nothing when the mark already says so", async () => {
        const synced = rowOf({ ...DEPOSIT, booksSynced: 1 });
        expect((await tag(synced, false)).outcome).toBe(OUTCOMES.updated);
        expect(synced.update).toHaveBeenCalledWith(NOT_IN_BOOKS, { transaction: "TXN" });

        const already = rowOf({ ...DEPOSIT, booksSynced: true });
        expect((await tag(already, true)).outcome).toBe(OUTCOMES.unchanged);
        expect(already.update).not.toHaveBeenCalled();
        expect(configAuditLog.create).toHaveBeenCalledTimes(1);
    });

    it("removes a deleted entry for good once the books have lost it, and writes that down", async () => {
        const row = rowOf({ ...DEPOSIT, deletedAt: new Date("2026-10-08"), booksSynced: false });

        const result = await tag(row, true);

        expect(row.destroy).toHaveBeenCalledWith({ force: true, transaction: "TXN" });
        expect(configAuditLog.create.mock.calls[0][0].changes).toEqual([
            { field: "booksSynced", from: false, to: true },
            { field: "removedFromPortal", from: false, to: true },
        ]);
        expect(result).toEqual({ outcome: OUTCOMES.removed, row: expect.objectContaining({ id: 3 }) });
    });

    it("keeps a deleted entry when it is marked as not in the books, and answers missing for one that is gone", async () => {
        const row = rowOf({ ...DEPOSIT, deletedAt: new Date("2026-10-08") });

        expect((await tag(row, false)).outcome).toBe(OUTCOMES.unchanged);
        expect(row.destroy).not.toHaveBeenCalled();
        expect(await tag(null, true)).toEqual({ outcome: OUTCOMES.missing });
    });

    it("finds the entry to mark on each ledger by its own key, deleted ones included", async () => {
        vendorDeposits.findOne.mockResolvedValue(rowOf({ ...DEPOSIT, entryType: "REVERSAL" }));
        vendorLedgerEntries.findOne.mockResolvedValue(rowOf({ id: 8, vendorId: 1, kind: "COMMISSION", reference: "CM-1" }));
        paymentGatewaySettlements.findOne.mockResolvedValue(rowOf({ id: 9, gatewayAccountId: "PG1", entryKind: "FEE" }));
        const audit = { configType: "X_LEDGER", partnerName: null, labelOf: () => "Label" };

        await tagDepositBooks({ id: 3, vendorId: 1, synced: true, actor: ACTOR, audit });
        await tagVendorEntryBooks({ id: 8, vendorId: 1, kind: "COMMISSION", synced: true, actor: ACTOR, audit });
        await tagSettlementBooks({ id: 9, gatewayAccountId: "PG1", entryKinds: ["FEE"], synced: true, actor: ACTOR, audit });

        expect(vendorDeposits.findOne.mock.calls[0][0]).toMatchObject({ where: { id: 3, vendorId: 1 }, paranoid: false });
        expect(vendorLedgerEntries.findOne.mock.calls[0][0].where).toEqual({ id: 8, vendorId: 1, kind: "COMMISSION" });
        expect(paymentGatewaySettlements.findOne.mock.calls[0][0].where).toEqual({
            id: 9,
            gatewayAccountId: "PG1",
            entryKind: { [Op.in]: ["FEE"] },
        });
        expect(configAuditLog.create.mock.calls.map(([entry]) => entry.targetTable)).toEqual([
            "vendorDeposits",
            "vendorLedgerEntries",
            "paymentGatewaySettlements",
        ]);
    });
});
