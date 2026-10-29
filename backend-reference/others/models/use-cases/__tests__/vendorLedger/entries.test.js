const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const vendorDeposits = require("../../../entities/vendorDeposit");
const vendorLedgerEntries = require("../../../entities/vendorLedgerEntry");
const {
    DEPOSIT_MODES,
    DEPOSIT_STATUS_FILTERS,
    serializeDeposit,
    listByVendor: listDeposits,
    createDeposit,
    createOpeningBalance,
    findOpeningBalance,
    reverseDeposit,
    sumActiveDeposits,
    sumActiveDepositsByVendor,
    sumDepositsInRange,
} = require("../../vendorDeposits");
const {
    ENTRY_KINDS,
    serializeEntry,
    listByVendor: listEntries,
    listAllByVendor,
    createEntry,
    reverseEntry,
    sumManualEntries,
    sumManualEntriesByVendor,
    sumManualEntriesInRange,
    countOpenEntries,
} = require("../../vendorLedgerEntries");

jest.mock("../../../entities/vendorDeposit", () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    sum: jest.fn(),
}));
jest.mock("../../../entities/vendorLedgerEntry", () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    sum: jest.fn(),
    count: jest.fn(),
}));

const ACTOR = { id: 42, name: "Ibrahim" };

const instance = attrs => ({ ...attrs, update: jest.fn(async patch => ({ ...attrs, ...patch })) });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
    sequelizeConfig.query = jest.fn(async sql => (sql.startsWith("SELECT LAST_INSERT_ID") ? [{ value: 7 }] : []));
});

describe("vendor deposits", () => {
    it("records a deposit as active and stamps who did it", async () => {
        vendorDeposits.create.mockResolvedValue({});

        await createDeposit({
            vendorId: 1,
            amount: 25000,
            depositDate: "2026-09-18",
            reference: "UTR-778899",
            mode: "NEFT",
            note: "",
            actor: ACTOR,
        });

        expect(vendorDeposits.create).toHaveBeenCalledWith(
            {
            vendorId: 1,
            entryNumber: "DEP-000007",
            amount: 25000,
            depositDate: "2026-09-18",
            reference: "UTR-778899",
            mode: "NEFT",
            note: null,
            status: "ACTIVE",
            entryType: "DEPOSIT",
            slipKey: null,
            slipName: null,
            slipFormat: null,
            recordedById: 42,
            recordedByName: "Ibrahim",
            ipAddress: null,
            },
            { transaction: "TXN" }
        );
        expect(DEPOSIT_MODES).toContain("CHEQUE");
    });

    it("stores the slip key, name and format when one was uploaded", async () => {
        vendorDeposits.create.mockResolvedValue({});

        await createDeposit({
            vendorId: 1,
            amount: 25000,
            depositDate: "2026-09-18",
            reference: "UTR-778899",
            mode: "NEFT",
            note: "",
            slip: { key: "staging/system_user/ibrahim/vendor-ledger-slips/1/uuid", name: "receipt.pdf", format: "pdf" },
            actor: ACTOR,
        });

        expect(vendorDeposits.create).toHaveBeenCalledWith(
            expect.objectContaining({
                slipKey: "staging/system_user/ibrahim/vendor-ledger-slips/1/uuid",
                slipName: "receipt.pdf",
                slipFormat: "pdf",
            }),
            { transaction: "TXN" }
        );
    });

    it("hands the slip back to the client on the serialised row", () => {
        expect(
            serializeDeposit({ id: 3, slipKey: "a/b/c", slipName: "receipt.pdf", slipFormat: "pdf" })
        ).toMatchObject({ slipKey: "a/b/c", slipName: "receipt.pdf", slipFormat: "pdf" });

        expect(serializeDeposit({ id: 4 })).toMatchObject({
            slipKey: null,
            slipName: null,
            slipFormat: null,
        });
    });

    it("reverses a deposit by writing a contra row rather than erasing it", async () => {
        const row = instance({
            id: 5,
            vendorId: 1,
            amount: "50000.0000",
            reference: "UTR-2",
            mode: "RTGS",
            status: "ACTIVE",
            entryType: "DEPOSIT",
        });
        vendorDeposits.findOne.mockResolvedValue(row);
        vendorDeposits.create.mockResolvedValue({ id: 6, entryType: "REVERSAL" });

        const reversal = await reverseDeposit({
            id: 5,
            vendorId: 1,
            reason: "wrong vendor",
            actor: ACTOR,
        });

        expect(vendorDeposits.create).toHaveBeenCalledWith(
            expect.objectContaining({
                vendorId: 1,
                amount: "50000.0000",
                reference: "UTR-2",
                entryNumber: "DEP-000007",
                entryType: "REVERSAL",
                reversesId: 5,
                status: "ACTIVE",
                recordedById: 42,
            }),
            { transaction: "TXN" }
        );
        expect(reversal.entryType).toBe("REVERSAL");
        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({ replacements: { name: "DEP" }, transaction: "TXN" });

        // The original is only marked so the list can render a pill; no sum reads that status.
        expect(row.update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "VOIDED",
                voidReason: "wrong vendor",
                voidedByName: "Ibrahim",
            }),
            { transaction: "TXN" }
        );
    });

    it("refuses to reverse an entry twice, a reversal itself, or one that is gone", async () => {
        vendorDeposits.findOne.mockResolvedValue(instance({ id: 5, status: "VOIDED" }));
        expect(await reverseDeposit({ id: 5, vendorId: 1, reason: "again", actor: ACTOR })).toBeNull();

        vendorDeposits.findOne.mockResolvedValue(
            instance({ id: 6, status: "ACTIVE", entryType: "REVERSAL" })
        );
        expect(await reverseDeposit({ id: 6, vendorId: 1, reason: "no", actor: ACTOR })).toBeNull();

        vendorDeposits.findOne.mockResolvedValue(null);
        expect(await reverseDeposit({ id: 9, vendorId: 1, reason: "gone", actor: ACTOR })).toBeNull();
        expect(vendorDeposits.create).not.toHaveBeenCalled();
    });

    it("nets reversals out of the sum instead of filtering on a status", async () => {
        vendorDeposits.findAll.mockResolvedValue([{ total: "200000.0000" }]);

        expect(await sumActiveDeposits(1)).toBe(200000);
        const query = vendorDeposits.findAll.mock.calls[0][0];
        expect(query.where).toEqual({ vendorId: 1 });
        expect(String(query.attributes[0][0].val)).toContain(
            "CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END"
        );

        vendorDeposits.findAll.mockResolvedValue([{ total: null }]);
        expect(await sumActiveDeposits(2)).toBe(0);
    });

    it("groups the net per vendor and filters a month range", async () => {
        vendorDeposits.findAll.mockResolvedValue([
            { vendorId: 1, total: "200000.0000" },
            { vendorId: 2, total: "10000.0000" },
        ]);
        expect(await sumActiveDepositsByVendor()).toEqual({ 1: 200000, 2: 10000 });

        vendorDeposits.findAll.mockResolvedValue([{ total: "425000" }]);
        await sumDepositsInRange({ from: "2026-09-01", to: "2026-09-18" });
        const ranged = vendorDeposits.findAll.mock.calls[1][0];
        expect(ranged.where.depositDate).toEqual({
            [Op.between]: ["2026-09-01", "2026-09-18"],
        });
    });

    it("numbers the reversal of an opening balance in the opening series", async () => {
        vendorDeposits.findOne.mockResolvedValue(
            instance({ id: 8, vendorId: 1, amount: "75000.0000", status: "ACTIVE", entryType: "OPENING" })
        );
        vendorDeposits.create.mockResolvedValue({ id: 9, entryType: "REVERSAL" });

        await reverseDeposit({ id: 8, vendorId: 1, reason: "wrong figure", actor: ACTOR });

        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({ replacements: { name: "OPB" }, transaction: "TXN" });
        expect(vendorDeposits.create).toHaveBeenCalledWith(
            expect.objectContaining({ entryNumber: "OPB-000007", entryType: "REVERSAL", reversesId: 8 }),
            { transaction: "TXN" }
        );
    });

    it("hands the entry number to the screen", () => {
        expect(serializeDeposit({ id: 1, entryNumber: "DEP-000003" }).entryNumber).toBe("DEP-000003");
        expect(serializeDeposit({ id: 2 }).entryNumber).toBeNull();
    });

    it("records an opening balance as its own entry type with no reference", async () => {
        vendorDeposits.create.mockResolvedValue({});

        await createOpeningBalance({
            vendorId: 1,
            amount: 75000,
            asOfDate: "2026-08-19",
            note: "carried in",
            actor: ACTOR,
        });

        expect(vendorDeposits.create).toHaveBeenCalledWith(
            expect.objectContaining({
                entryType: "OPENING",
                entryNumber: "OPB-000007",
                amount: 75000,
                depositDate: "2026-08-19",
                reference: null,
                status: "ACTIVE",
                recordedById: 42,
            }),
            { transaction: "TXN" }
        );
    });

    it("finds the live opening balance for a vendor", async () => {
        vendorDeposits.findOne.mockResolvedValue({ id: 8 });

        await findOpeningBalance(1);

        expect(vendorDeposits.findOne.mock.calls[0][0].where).toEqual({
            vendorId: 1,
            entryType: "OPENING",
            status: "ACTIVE",
        });
    });

    it("lists newest first and applies the date range", async () => {
        vendorDeposits.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

        await listDeposits({ vendorId: 1, range: { from: "2026-09-01", to: "2026-09-18" }, limit: 10, offset: 0 });

        const query = vendorDeposits.findAndCountAll.mock.calls[0][0];
        expect(query.where.depositDate).toEqual({ [Op.between]: ["2026-09-01", "2026-09-18"] });
        expect(query.order).toEqual([
            ["depositDate", "DESC"],
            ["id", "DESC"],
        ]);
    });

    describe("filtering the list", () => {
        const whereFor = async filters => {
            vendorDeposits.findAndCountAll.mockClear();
            vendorDeposits.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
            await listDeposits({ vendorId: 1, limit: 10, offset: 0, ...filters });
            return vendorDeposits.findAndCountAll.mock.calls[0][0].where;
        };

        it("holds the list to the vendor alone until something is picked", async () => {
            expect(await whereFor({})).toEqual({ vendorId: 1 });
        });

        it("reads each status the way the Status pill does", async () => {
            expect(await whereFor({ status: "active" })).toMatchObject({
                entryType: "DEPOSIT",
                status: { [Op.ne]: "VOIDED" },
            });
            expect(await whereFor({ status: "opening" })).toMatchObject({
                entryType: "OPENING",
                status: { [Op.ne]: "VOIDED" },
            });
            expect(await whereFor({ status: "reversal" })).toMatchObject({ entryType: "REVERSAL" });
            expect(await whereFor({ status: "reversed" })).toMatchObject({
                entryType: { [Op.ne]: "REVERSAL" },
                status: "VOIDED",
            });
            expect(await whereFor({ status: "deleted" })).toMatchObject({ deletedAt: { [Op.ne]: null } });
            expect(await whereFor({ status: "active" })).toMatchObject({ deletedAt: null });
            expect(Object.keys(DEPOSIT_STATUS_FILTERS)).toEqual(["active", "opening", "reversal", "reversed", "deleted"]);
        });

        it("narrows to one mode, and to none for a mode it does not know", async () => {
            expect((await whereFor({ mode: "UPI" })).mode).toBe("UPI");
            expect((await whereFor({ mode: "CASH" })).mode).toBeUndefined();
            expect((await whereFor({ mode: "constructor" })).mode).toBeUndefined();
        });

        it("searches the reference, the note and who recorded it", async () => {
            expect((await whereFor({ searchText: "utr" }))[Op.or]).toEqual([
                { entryNumber: { [Op.like]: "%utr%" } },
                { reference: { [Op.like]: "%utr%" } },
                { note: { [Op.like]: "%utr%" } },
                { recordedByName: { [Op.like]: "%utr%" } },
            ]);
            expect((await whereFor({ searchText: "" }))[Op.or]).toBeUndefined();
        });

        it("ignores a status it does not know, so nothing it names reaches the query", async () => {
            for (const status of ["bogus", "constructor", "toString"]) {
                expect(await whereFor({ status })).toEqual({ vendorId: 1 });
            }
        });

        it("keeps the date range, the status, the mode and the search together", async () => {
            const where = await whereFor({
                range: { from: "2026-09-01", to: "2026-09-18" },
                status: "active",
                mode: "NEFT",
                searchText: "utr",
            });

            expect(where).toMatchObject({
                vendorId: 1,
                depositDate: { [Op.between]: ["2026-09-01", "2026-09-18"] },
                entryType: "DEPOSIT",
                mode: "NEFT",
            });
            expect(where[Op.or]).toHaveLength(4);
        });
    });

    it("serialises the amount as a number", () => {
        expect(serializeDeposit({ id: 1, amount: "25000.0000", status: "ACTIVE" })).toMatchObject({
            amount: 25000,
            status: "ACTIVE",
        });
    });

    it("marks a deposit as never going to the books", () => {
        expect(serializeDeposit({ id: 1 }).posting).toEqual({ state: "notApplicable", note: null, detail: null });
    });
});

describe("vendor ledger entries", () => {
    it("holds credit notes, commissions and cost of sales in the one table, each summed on its own", () => {
        expect(ENTRY_KINDS).toEqual({
            creditNote: "CREDIT_NOTE",
            commission: "COMMISSION",
            costOfSales: "COST_OF_SALES",
            debitNote: "DEBIT_NOTE",
        });
    });

    it("sums one kind at a time", async () => {
        vendorLedgerEntries.findAll.mockResolvedValue([{ total: "354" }]);

        expect(await sumManualEntries(1, ENTRY_KINDS.costOfSales, null)).toBe(354);
        expect(vendorLedgerEntries.findAll.mock.calls[0][0].where).toEqual({ vendorId: 1, kind: "COST_OF_SALES" });
    });

    it("records a credit note as open", async () => {
        vendorLedgerEntries.create.mockResolvedValue({});

        await createEntry({
            vendorId: 1,
            kind: ENTRY_KINDS.creditNote,
            reference: "CN-1042",
            amount: 1500,
            issueDate: "2026-09-18",
            reason: "",
            againstCorporateTxnId: "",
            actor: ACTOR,
        });

        expect(vendorLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: "CREDIT_NOTE",
                entryNumber: "VCN-000007",
                reference: "VCN-000007",
                status: "OPEN",
                entryType: "ENTRY",
                reason: null,
                againstCorporateTxnId: null,
                recordedById: 42,
            }),
            { transaction: "TXN" }
        );
        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({ replacements: { name: "VCN" }, transaction: "TXN" });
    });

    it("records a manual commission the same way, under its own kind", async () => {
        vendorLedgerEntries.create.mockResolvedValue({});

        await createEntry({
            vendorId: 1,
            kind: ENTRY_KINDS.commission,
            reference: "CM-14",
            amount: 236,
            issueDate: "2026-09-19",
            reason: "Annual rebate",
            actor: ACTOR,
        });

        expect(vendorLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: "COMMISSION",
                entryNumber: "COM-000007",
                reference: "COM-000007",
                amount: 236,
                reason: "Annual rebate",
                entryType: "ENTRY",
            }),
            { transaction: "TXN" }
        );
    });

    it("reverses an entry with a contra row of the same kind", async () => {
        const row = instance({
            id: 3,
            vendorId: 1,
            kind: "CREDIT_NOTE",
            reference: "CN-1",
            amount: "1500.0000",
            status: "OPEN",
            entryType: "ENTRY",
        });
        vendorLedgerEntries.findOne.mockResolvedValue(row);
        vendorLedgerEntries.create.mockResolvedValue({ id: 4, entryType: "REVERSAL" });

        await reverseEntry({
            id: 3,
            vendorId: 1,
            kind: ENTRY_KINDS.creditNote,
            reason: "duplicate",
            actor: ACTOR,
        });

        expect(vendorLedgerEntries.findOne.mock.calls[0][0].where).toEqual({
            id: 3,
            vendorId: 1,
            kind: "CREDIT_NOTE",
        });
        expect(vendorLedgerEntries.findOne.mock.calls[0][0]).toEqual(
            expect.objectContaining({ transaction: "TXN", lock: true })
        );
        expect(vendorLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: "CREDIT_NOTE",
                entryNumber: "VCN-000007",
                reference: "CN-1",
                entryType: "REVERSAL",
                reversesId: 3,
            }),
            { transaction: "TXN" }
        );
        expect(row.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: "VOIDED", voidReason: "duplicate" }),
            { transaction: "TXN" }
        );
    });

    it("refuses to reverse a reversal, a voided entry or one that is gone", async () => {
        vendorLedgerEntries.findOne.mockResolvedValue(instance({ id: 3, status: "VOIDED" }));
        expect(await reverseEntry({ id: 3, vendorId: 1, reason: "again", actor: ACTOR })).toBeNull();

        vendorLedgerEntries.findOne.mockResolvedValue(
            instance({ id: 4, status: "OPEN", entryType: "REVERSAL" })
        );
        expect(await reverseEntry({ id: 4, vendorId: 1, reason: "no", actor: ACTOR })).toBeNull();

        vendorLedgerEntries.findOne.mockResolvedValue(null);
        expect(await reverseEntry({ id: 9, vendorId: 1, reason: "gone", actor: ACTOR })).toBeNull();
        expect(vendorLedgerEntries.create).not.toHaveBeenCalled();
    });

    it("sums one kind at a time so a commission never lands in the credit note total", async () => {
        vendorLedgerEntries.findAll.mockResolvedValue([{ total: "1500" }]);
        expect(await sumManualEntries(1, ENTRY_KINDS.creditNote)).toBe(1500);
        expect(vendorLedgerEntries.findAll.mock.calls[0][0].where).toEqual({
            vendorId: 1,
            kind: "CREDIT_NOTE",
        });

        vendorLedgerEntries.findAll.mockResolvedValue([{ vendorId: 1, total: "236" }]);
        expect(await sumManualEntriesByVendor(ENTRY_KINDS.commission)).toEqual({ 1: 236 });
        expect(vendorLedgerEntries.findAll.mock.calls[1][0].where).toEqual({ kind: "COMMISSION" });
        expect(vendorLedgerEntries.findAll.mock.calls[1][0].group).toEqual(["vendorId"]);

        vendorLedgerEntries.findAll.mockResolvedValue([{ total: "100" }]);
        await sumManualEntriesInRange(ENTRY_KINDS.commission, { from: "2026-09-01", to: "2026-09-19" });
        expect(vendorLedgerEntries.findAll.mock.calls[2][0].where.issueDate).toEqual({
            [Op.between]: ["2026-09-01", "2026-09-19"],
        });
    });

    it("nets reversals out of the sum instead of filtering on a status", async () => {
        vendorLedgerEntries.findAll.mockResolvedValue([{ total: "1500" }]);
        await sumManualEntries(1, ENTRY_KINDS.creditNote);

        const attributes = vendorLedgerEntries.findAll.mock.calls[0][0].attributes;
        expect(String(attributes[0][0].val)).toContain(
            "CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END"
        );
    });

    it("counts only live originals of one kind", async () => {
        vendorLedgerEntries.count.mockResolvedValue(4);

        expect(await countOpenEntries(ENTRY_KINDS.creditNote)).toBe(4);
        expect(vendorLedgerEntries.count.mock.calls[0][0].where).toEqual({
            kind: "CREDIT_NOTE",
            status: "OPEN",
            entryType: "ENTRY",
        });
    });

    it("lists newest first for a page and oldest first for a merge", async () => {
        vendorLedgerEntries.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        await listEntries({ vendorId: 1, kind: ENTRY_KINDS.creditNote, range: null, limit: 10, offset: 0 });
        expect(vendorLedgerEntries.findAndCountAll.mock.calls[0][0].order).toEqual([
            ["issueDate", "DESC"],
            ["id", "DESC"],
        ]);

        vendorLedgerEntries.findAll.mockResolvedValue([]);
        await listAllByVendor({ vendorId: 1, kind: ENTRY_KINDS.commission, range: null });
        expect(vendorLedgerEntries.findAll.mock.calls[0][0].order).toEqual([
            ["issueDate", "ASC"],
            ["id", "ASC"],
        ]);
    });

    it("marks every stored row as manual so the tab can tell it from a derived one", () => {
        expect(serializeEntry({ id: 1, amount: "1500.0000", status: "OPEN" })).toMatchObject({
            amount: 1500,
            status: "OPEN",
            source: "MANUAL",
            kind: "CREDIT_NOTE",
            entryType: "ENTRY",
            slipKey: null,
            posting: { state: "notApplicable", note: null, detail: null },
        });
    });

    it("gives each kind of entry its own series, and a reversal the series of what it reverses", async () => {
        vendorLedgerEntries.create.mockResolvedValue({});
        for (const [kind, prefix] of [
            [ENTRY_KINDS.costOfSales, "COS"],
            [ENTRY_KINDS.debitNote, "VDN"],
        ]) {
            sequelizeConfig.query.mockClear();
            await createEntry({ vendorId: 1, kind, reference: "R", amount: 1, issueDate: "2026-10-27", actor: ACTOR });
            expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ name: prefix });
            expect(vendorLedgerEntries.create).toHaveBeenLastCalledWith(
                expect.objectContaining({ kind, entryNumber: `${prefix}-000007` }),
                { transaction: "TXN" }
            );
        }

        vendorLedgerEntries.findOne.mockResolvedValue(
            instance({ id: 3, vendorId: 1, kind: "COST_OF_SALES", reference: "CS-1", amount: "118.0000", status: "OPEN", entryType: "ENTRY" })
        );
        sequelizeConfig.query.mockClear();
        await reverseEntry({ id: 3, vendorId: 1, kind: ENTRY_KINDS.costOfSales, reason: "twice", actor: ACTOR });
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ name: "COS" });
        expect(serializeEntry({ id: 1, entryNumber: "COS-000007" }).entryNumber).toBe("COS-000007");
        expect(serializeEntry({ id: 2 }).entryNumber).toBeNull();
    });

    it("keeps the attached document on an entry", async () => {
        vendorLedgerEntries.create.mockResolvedValue({});

        await createEntry({
            vendorId: 1,
            kind: ENTRY_KINDS.creditNote,
            reference: "CN-1",
            amount: 1500,
            issueDate: "2026-09-18",
            slip: { key: "cn/key", name: "note.png", format: "png" },
            actor: ACTOR,
        });

        expect(vendorLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({ slipKey: "cn/key", slipName: "note.png", slipFormat: "png" }),
            { transaction: "TXN" }
        );
        expect(
            serializeEntry({ id: 1, slipKey: "cn/key", slipName: "note.png", slipFormat: "png" })
        ).toMatchObject({ slipKey: "cn/key", slipName: "note.png", slipFormat: "png" });
    });
});

describe("the GST split on an entry recorded by hand", () => {
    beforeEach(() => jest.clearAllMocks());

    it("keeps the split beside the amount, inclusive unless told otherwise", async () => {
        vendorLedgerEntries.create.mockResolvedValue({});

        await createEntry({
            vendorId: 1,
            kind: ENTRY_KINDS.commission,
            reference: "CM-15",
            amount: 236,
            gstInclusive: false,
            gstRate: 18,
            taxableAmount: 200,
            gstAmount: 36,
            issueDate: "2026-10-13",
            actor: ACTOR,
        });
        expect(vendorLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 236, gstInclusive: false, gstRate: 18, taxableAmount: 200, gstAmount: 36 }),
            { transaction: "TXN" }
        );

        await createEntry({
            vendorId: 1,
            kind: ENTRY_KINDS.creditNote,
            reference: "CN-9",
            amount: 1500,
            issueDate: "2026-10-13",
            actor: ACTOR,
        });
        expect(vendorLedgerEntries.create).toHaveBeenLastCalledWith(
            expect.objectContaining({ gstInclusive: true, gstRate: null, taxableAmount: null, gstAmount: null }),
            { transaction: "TXN" }
        );
    });

    it("carries the split onto the reversal", async () => {
        const row = instance({
            id: 3,
            vendorId: 1,
            kind: "COMMISSION",
            reference: "CM-15",
            amount: "236.0000",
            gstInclusive: false,
            gstRate: "18.00",
            taxableAmount: "200.0000",
            gstAmount: "36.0000",
            status: "OPEN",
            entryType: "ENTRY",
        });
        vendorLedgerEntries.findOne.mockResolvedValue(row);
        vendorLedgerEntries.create.mockResolvedValue({ id: 4 });

        await reverseEntry({ id: 3, vendorId: 1, kind: ENTRY_KINDS.commission, reason: "duplicate", actor: ACTOR });

        expect(vendorLedgerEntries.create).toHaveBeenCalledWith(
            expect.objectContaining({
                entryType: "REVERSAL",
                amount: "236.0000",
                gstInclusive: false,
                gstRate: "18.00",
                taxableAmount: "200.0000",
                gstAmount: "36.0000",
            }),
            { transaction: "TXN" }
        );
    });

    it("hands the split to the screen as numbers, or nothing on an older entry", () => {
        expect(
            serializeEntry({
                id: 1,
                amount: "236.0000",
                gstInclusive: 0,
                gstRate: "18.00",
                taxableAmount: "200.0000",
                gstAmount: "36.0000",
            })
        ).toMatchObject({ amount: 236, gstInclusive: false, gstRate: 18, taxableAmount: 200, gstAmount: 36 });
        expect(serializeEntry({ id: 2, amount: "100.0000" })).toMatchObject({
            gstInclusive: true,
            gstRate: null,
            taxableAmount: null,
            gstAmount: null,
        });
    });
});
