const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const partnerLedgerEntries = require("../../../entities/partnerLedgerEntry");
const {
    ENTRY_KINDS,
    ENTRY_STATUS_FILTERS,
    serializeEntry,
    listByPartner,
    listAllByPartner,
    createEntry,
    reverseEntry,
    sumEntries,
    sumEntriesByPartner,
    sumEntriesInRange,
} = require("../../partnerLedgerEntries");

jest.mock("../../../entities/partnerLedgerEntry", () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
}));

const ACTOR = { id: 42, name: "Ibrahim" };

const instance = attrs => ({ ...attrs, update: jest.fn(async patch => ({ ...attrs, ...patch })) });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
    sequelizeConfig.query = jest.fn(async sql => (sql.startsWith("SELECT LAST_INSERT_ID") ? [{ value: 7 }] : []));
});

describe("recording a debit note", () => {
    it("holds debit notes as their own kind", () => {
        expect(ENTRY_KINDS).toEqual({ debitNote: "DEBIT_NOTE" });
    });

    it("records a debit note as open and stamps who did it", async () => {
        partnerLedgerEntries.create.mockResolvedValue({});

        await createEntry({
            partnerCredentialId: 55,
            kind: ENTRY_KINDS.debitNote,
            reference: "DN-1042",
            amount: 150,
            issueDate: "2026-10-07",
            reason: "",
            againstCorporateTxnId: "",
            slip: { key: "s3/key", name: "note.pdf", format: "pdf" },
            actor: ACTOR,
        });

        expect(partnerLedgerEntries.create).toHaveBeenCalledWith(
            {
            partnerCredentialId: 55,
            entryNumber: "PDN-000007",
            kind: "DEBIT_NOTE",
            reference: "PDN-000007",
            amount: 150,
            gstInclusive: true,
            gstRate: null,
            taxableAmount: null,
            gstAmount: null,
            issueDate: "2026-10-07",
            reason: null,
            againstCorporateTxnId: null,
            status: "OPEN",
            entryType: "ENTRY",
            slipKey: "s3/key",
            slipName: "note.pdf",
            slipFormat: "pdf",
            recordedById: 42,
            recordedByName: "Ibrahim",
            ipAddress: null,
            },
            { transaction: "TXN" }
        );
        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({ replacements: { name: "PDN" }, transaction: "TXN" });
        expect(serializeEntry({ id: 1, entryNumber: "PDN-000007" }).entryNumber).toBe("PDN-000007");
    });
});

describe("reversing a debit note", () => {
    it("writes a contra row of the same kind and voids the original rather than deleting it", async () => {
        const row = instance({
            id: 3,
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
            reference: "DN-1",
            amount: "150.0000",
            againstCorporateTxnId: "TXN-9",
            status: "OPEN",
            entryType: "ENTRY",
        });
        partnerLedgerEntries.findOne.mockResolvedValue(row);
        partnerLedgerEntries.create.mockResolvedValue({ id: 4, entryType: "REVERSAL" });

        const reversal = await reverseEntry({
            id: 3,
            partnerCredentialId: 55,
            kind: ENTRY_KINDS.debitNote,
            reason: "raised twice",
            actor: ACTOR,
        });

        expect(partnerLedgerEntries.findOne).toHaveBeenCalledWith({
            where: { id: 3, partnerCredentialId: 55, kind: "DEBIT_NOTE" },
            transaction: "TXN",
            lock: true,
        });
        expect(partnerLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({
                partnerCredentialId: 55,
                kind: "DEBIT_NOTE",
                reference: "DN-1",
                entryNumber: "PDN-000007",
                amount: "150.0000",
                againstCorporateTxnId: "TXN-9",
                entryType: "REVERSAL",
                reversesId: 3,
                reason: "raised twice",
                recordedById: 42,
            }),
            { transaction: "TXN" }
        );
        expect(row.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: "VOIDED", voidedById: 42, voidReason: "raised twice" }),
            { transaction: "TXN" }
        );
        expect(reversal).toEqual({ id: 4, entryType: "REVERSAL" });
    });

    it("refuses a row that is missing, already voided or itself a reversal", async () => {
        partnerLedgerEntries.findOne.mockResolvedValueOnce(null);
        expect(await reverseEntry({ id: 9, partnerCredentialId: 55, reason: "gone", actor: ACTOR })).toBeNull();

        partnerLedgerEntries.findOne.mockResolvedValueOnce(instance({ id: 5, status: "VOIDED", entryType: "ENTRY" }));
        expect(await reverseEntry({ id: 5, partnerCredentialId: 55, reason: "again", actor: ACTOR })).toBeNull();

        partnerLedgerEntries.findOne.mockResolvedValueOnce(instance({ id: 6, status: "OPEN", entryType: "REVERSAL" }));
        expect(await reverseEntry({ id: 6, partnerCredentialId: 55, reason: "no", actor: ACTOR })).toBeNull();

        expect(partnerLedgerEntries.create).not.toHaveBeenCalled();
    });
});

describe("what the debit notes add up to", () => {
    it("nets reversals out of the sum instead of filtering on a status", async () => {
        partnerLedgerEntries.findAll.mockResolvedValue([{ total: "130.0000" }]);

        expect(await sumEntries(55, ENTRY_KINDS.debitNote)).toBe(130);

        const call = partnerLedgerEntries.findAll.mock.calls[0][0];
        expect(call.where).toEqual({ partnerCredentialId: 55, kind: "DEBIT_NOTE" });
        expect(String(call.attributes[0][0].val)).toContain("WHEN entryType = 'REVERSAL' THEN -amount");
    });

    it("scopes the sum to a range when one is given", async () => {
        partnerLedgerEntries.findAll.mockResolvedValue([{ total: "20.0000" }]);

        await sumEntries(55, ENTRY_KINDS.debitNote, { from: "2026-09-01", to: "2026-09-30" });

        expect(partnerLedgerEntries.findAll.mock.calls[0][0].where).toEqual({
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
            issueDate: { [Op.between]: ["2026-09-01", "2026-09-30"] },
        });
    });

    it("groups the net per partner and sums a month range", async () => {
        partnerLedgerEntries.findAll
            .mockResolvedValueOnce([
                { partnerCredentialId: 55, total: "20.0000" },
                { partnerCredentialId: 56, total: "0.0000" },
            ])
            .mockResolvedValueOnce([{ total: "25.0000" }]);

        expect(await sumEntriesByPartner(ENTRY_KINDS.debitNote)).toEqual({ 55: 20, 56: 0 });
        expect(partnerLedgerEntries.findAll.mock.calls[0][0]).toMatchObject({
            where: { kind: "DEBIT_NOTE" },
            group: ["partnerCredentialId"],
        });

        expect(
            await sumEntriesInRange(ENTRY_KINDS.debitNote, { from: "2026-10-01", to: "2026-10-31" })
        ).toBe(25);
        expect(partnerLedgerEntries.findAll.mock.calls[1][0].where).toEqual({
            kind: "DEBIT_NOTE",
            issueDate: { [Op.between]: ["2026-10-01", "2026-10-31"] },
        });
    });
});

describe("shaping a debit note", () => {
    it("serialises the amount as a number and marks it as never going to the books", () => {
        expect(
            serializeEntry({
                id: 1,
                partnerCredentialId: 55,
                amount: "150.0000",
                status: "OPEN",
                slipKey: "a/b/c",
                slipName: "note.pdf",
                slipFormat: "pdf",
            })
        ).toMatchObject({
            id: 1,
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
            amount: 150,
            status: "OPEN",
            entryType: "ENTRY",
            reversesId: null,
            source: "MANUAL",
            slipKey: "a/b/c",
            slipName: "note.pdf",
            slipFormat: "pdf",
            posting: { state: "notApplicable", note: null, detail: null },
        });
    });
});

describe("listing debit notes", () => {
    beforeEach(() => partnerLedgerEntries.findAndCountAll.mockResolvedValue({ rows: [], count: 0 }));

    const whereOf = async args => {
        await listByPartner({
            partnerCredentialId: 55,
            kind: ENTRY_KINDS.debitNote,
            limit: 10,
            offset: 0,
            ...args,
        });
        return partnerLedgerEntries.findAndCountAll.mock.calls.at(-1)[0].where;
    };

    it("shows the newest first for a page and the oldest first for a statement", async () => {
        await listByPartner({ partnerCredentialId: 55, kind: ENTRY_KINDS.debitNote, limit: 10, offset: 0 });
        expect(partnerLedgerEntries.findAndCountAll.mock.calls[0][0].order).toEqual([
            ["issueDate", "DESC"],
            ["id", "DESC"],
        ]);

        partnerLedgerEntries.findAll.mockResolvedValue([]);
        await listAllByPartner({ partnerCredentialId: 55, kind: ENTRY_KINDS.debitNote, range: null });
        expect(partnerLedgerEntries.findAll.mock.calls[0][0]).toMatchObject({
            where: { partnerCredentialId: 55, kind: "DEBIT_NOTE" },
            order: [
                ["issueDate", "ASC"],
                ["id", "ASC"],
            ],
            raw: true,
        });
    });

    it("lists everything of the partner's kind when nothing is filtered", async () => {
        expect(await whereOf({})).toEqual({ partnerCredentialId: 55, kind: "DEBIT_NOTE" });
        expect(await whereOf({ status: "paid", searchText: "" })).toEqual({
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
        });
    });

    it.each([
        ["active", { entryType: { [Op.ne]: "REVERSAL" }, status: { [Op.ne]: "VOIDED" }, deletedAt: null }],
        ["reversal", { entryType: "REVERSAL", deletedAt: null }],
        ["reversed", { entryType: { [Op.ne]: "REVERSAL" }, status: "VOIDED", deletedAt: null }],
        ["deleted", { deletedAt: { [Op.ne]: null } }],
    ])("narrows to the rows the Status pill calls %s", async (status, expected) => {
        expect(await whereOf({ status })).toEqual({ partnerCredentialId: 55, kind: "DEBIT_NOTE", ...expected });
    });

    it("keeps every status filter to the four names the pill uses", () => {
        expect(Object.keys(ENTRY_STATUS_FILTERS)).toEqual(["active", "reversal", "reversed", "deleted"]);
    });

    it("searches the debit note, the order it is against, the reason and who recorded it", async () => {
        const where = await whereOf({ searchText: "dn" });

        expect(where[Op.or]).toEqual([
            { entryNumber: { [Op.like]: "%dn%" } },
            { reference: { [Op.like]: "%dn%" } },
            { againstCorporateTxnId: { [Op.like]: "%dn%" } },
            { reason: { [Op.like]: "%dn%" } },
            { recordedByName: { [Op.like]: "%dn%" } },
        ]);
    });

    it("keeps the dates, the status and the search together", async () => {
        const range = { from: "2026-09-01", to: "2026-09-30" };
        const where = await whereOf({ range, status: "active", searchText: "dn" });

        expect(where).toMatchObject({
            partnerCredentialId: 55,
            kind: "DEBIT_NOTE",
            issueDate: { [Op.between]: ["2026-09-01", "2026-09-30"] },
            entryType: { [Op.ne]: "REVERSAL" },
        });
        expect(where[Op.or]).toHaveLength(5);
    });
});

describe("the GST split on a debit note", () => {
    it("hands the split to the screen as numbers, or nothing on an older note", () => {
        expect(
            serializeEntry({
                id: 1,
                amount: "150.0000",
                gstInclusive: 1,
                gstRate: "18.00",
                taxableAmount: "127.1200",
                gstAmount: "22.8800",
            })
        ).toMatchObject({ amount: 150, gstInclusive: true, gstRate: 18, taxableAmount: 127.12, gstAmount: 22.88 });
        expect(serializeEntry({ id: 2, amount: "150.0000" })).toMatchObject({
            gstInclusive: true,
            gstRate: null,
            taxableAmount: null,
            gstAmount: null,
        });
    });
});
