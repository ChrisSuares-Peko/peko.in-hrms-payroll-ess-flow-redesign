const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const partnerPayouts = require("../../../entities/partnerPayout");
const {
    ENTRY_TYPES,
    PAYOUT_STATUS_FILTERS,
    serializePayout,
    listByPartner,
    createPayout,
    createOpeningBalance,
    reversePayout,
    sumPaidToPartner,
    findLastPayout,
} = require("../../partnerPayouts");

jest.mock("../../../entities/partnerPayout", () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
}));

const ACTOR = { id: 42, name: "Ibrahim" };

const instance = attrs => ({ ...attrs, update: jest.fn(async patch => ({ ...attrs, ...patch })) });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
    sequelizeConfig.query = jest.fn(async sql => (sql.startsWith("SELECT LAST_INSERT_ID") ? [{ value: 7 }] : []));
});

describe("recording a payout", () => {
    it("stamps who did it and keeps the suggestion beside the amount", async () => {
        partnerPayouts.create.mockResolvedValue({});

        await createPayout({
            partnerCredentialId: 55,
            amount: 30,
            calculatedAmount: 35.4,
            payoutDate: "2026-09-10",
            reference: "NEFT-1",
            mode: "NEFT",
            note: "part settlement",
            slip: { key: "s3/key", name: "slip.pdf", format: "pdf" },
            actor: ACTOR,
        });

        expect(partnerPayouts.create).toHaveBeenCalledWith(
            {
            partnerCredentialId: 55,
            entryNumber: "PAY-000007",
            amount: 30,
            calculatedAmount: 35.4,
            payoutDate: "2026-09-10",
            reference: "NEFT-1",
            mode: "NEFT",
            note: "part settlement",
            status: "ACTIVE",
            entryKind: "PAYOUT",
            entryType: "PAYOUT",
            slipKey: "s3/key",
            slipName: "slip.pdf",
            slipFormat: "pdf",
            recordedById: 42,
            recordedByName: "Ibrahim",
            ipAddress: null,
            },
            { transaction: "TXN" }
        );
        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({ replacements: { name: "PAY" }, transaction: "TXN" });
        expect(serializePayout({ id: 1, entryNumber: "PAY-000007" }).entryNumber).toBe("PAY-000007");
    });

    it("numbers an opening balance in the series every ledger's openings share", async () => {
        partnerPayouts.create.mockResolvedValue({});

        await createOpeningBalance({ partnerCredentialId: 55, amount: 100, asOfDate: "2026-09-01", actor: ACTOR });

        expect(sequelizeConfig.query.mock.calls[0][1]).toEqual({ replacements: { name: "OPB" }, transaction: "TXN" });
        expect(partnerPayouts.create).toHaveBeenCalledWith(
            expect.objectContaining({ entryKind: "OPENING", entryNumber: "OPB-000007", reference: null }),
            { transaction: "TXN" }
        );
    });

    it("records no suggestion rather than a zero when none was given", async () => {
        partnerPayouts.create.mockResolvedValue({});

        await createPayout({ partnerCredentialId: 55, amount: 30, payoutDate: "2026-09-10" });

        expect(partnerPayouts.create.mock.calls[0][0].calculatedAmount).toBeNull();
    });
});

describe("reversing a payout", () => {
    it("writes a contra row and voids the original rather than deleting it", async () => {
        const row = instance({
            id: 7,
            partnerCredentialId: 55,
            amount: "30.0000",
            calculatedAmount: "35.4000",
            reference: "NEFT-1",
            mode: "NEFT",
            status: "ACTIVE",
            entryType: "PAYOUT",
        });
        partnerPayouts.findOne.mockResolvedValue(row);
        partnerPayouts.create.mockResolvedValue({ id: 8 });

        await reversePayout({ id: 7, partnerCredentialId: 55, reason: "sent twice", actor: ACTOR });

        expect(partnerPayouts.findOne).toHaveBeenCalledWith({
            where: { id: 7, partnerCredentialId: 55 },
            transaction: "TXN",
            lock: true,
        });
        expect(partnerPayouts.create).toHaveBeenCalledWith(
            expect.objectContaining({
                partnerCredentialId: 55,
                entryNumber: "PAY-000007",
                amount: "30.0000",
                entryType: "REVERSAL",
                reversesId: 7,
                note: "sent twice",
            }),
            { transaction: "TXN" }
        );
        expect(row.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: "VOIDED", voidReason: "sent twice" }),
            { transaction: "TXN" }
        );
    });

    it("refuses a row that is missing, already voided or itself a reversal", async () => {
        partnerPayouts.findOne.mockResolvedValue(null);
        await expect(reversePayout({ id: 7, partnerCredentialId: 55 })).resolves.toBeNull();

        partnerPayouts.findOne.mockResolvedValue(instance({ status: "VOIDED" }));
        await expect(reversePayout({ id: 7, partnerCredentialId: 55 })).resolves.toBeNull();

        partnerPayouts.findOne.mockResolvedValue(instance({ entryType: ENTRY_TYPES.reversal }));
        await expect(reversePayout({ id: 7, partnerCredentialId: 55 })).resolves.toBeNull();
    });
});

describe("what has been paid", () => {
    it("subtracts a reversal instead of filtering on status", async () => {
        partnerPayouts.findAll.mockResolvedValue([{ total: "70.0000" }]);

        await expect(sumPaidToPartner(55)).resolves.toBe(70);

        const [options] = partnerPayouts.findAll.mock.calls[0];
        expect(String(options.attributes[0][0].val)).toContain(
            "CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END"
        );
        expect(JSON.stringify(options.where)).not.toContain("status");
    });

    it("scopes the sum to a range when one is given", async () => {
        partnerPayouts.findAll.mockResolvedValue([{ total: "0" }]);

        await sumPaidToPartner(55, { from: "2026-09-01", to: "2026-09-30" });

        expect(partnerPayouts.findAll.mock.calls[0][0].where).toHaveProperty("payoutDate");
    });

    it("names the last live payout, not a reversed one", async () => {
        partnerPayouts.findOne.mockResolvedValue({ payoutDate: "2026-09-10", amount: "30.0000" });

        await findLastPayout(55);

        expect(partnerPayouts.findOne.mock.calls[0][0].where).toEqual({
            partnerCredentialId: 55,
            status: "ACTIVE",
            entryKind: "PAYOUT",
            entryType: "PAYOUT",
        });
    });
});

describe("shaping a payout", () => {
    it("says by how much the entered amount differed from the suggestion", () => {
        expect(
            serializePayout({
                id: 7,
                partnerCredentialId: 55,
                amount: "30.0000",
                calculatedAmount: "35.4000",
                payoutDate: "2026-09-10",
                reference: "NEFT-1",
                mode: "NEFT",
                status: "ACTIVE",
                entryType: "PAYOUT",
            })
        ).toMatchObject({ amount: 30, calculatedAmount: 35.4, difference: -5.4 });
    });

    it("leaves the difference unknown when nothing was suggested", () => {
        expect(serializePayout({ id: 7, amount: "30.0000", calculatedAmount: null })).toMatchObject({
            calculatedAmount: null,
            difference: null,
        });
    });

    it("marks a payout as never going to the books", () => {
        expect(serializePayout({ id: 7, amount: "30.0000" }).posting).toEqual({
            state: "notApplicable",
            note: null,
            detail: null,
        });
    });
});

describe("listing payouts", () => {
    beforeEach(() => partnerPayouts.findAndCountAll.mockResolvedValue({ rows: [], count: 0 }));

    const whereOf = async args => {
        await listByPartner({ partnerCredentialId: 55, limit: 10, offset: 0, ...args });
        return partnerPayouts.findAndCountAll.mock.calls.at(-1)[0].where;
    };

    it("shows the newest first", async () => {
        await listByPartner({ partnerCredentialId: 55, limit: 10, offset: 0 });

        expect(partnerPayouts.findAndCountAll.mock.calls[0][0].order).toEqual([
            ["payoutDate", "DESC"],
            ["id", "DESC"],
        ]);
    });

    it("lists everything of the partner when nothing is filtered", async () => {
        expect(await whereOf({})).toEqual({ partnerCredentialId: 55 });
        expect(await whereOf({ status: "success", mode: "CASH", searchText: "" })).toEqual({ partnerCredentialId: 55 });
    });

    // The Status pill reads a reversal first, then a reversed row, then the opening, else Paid.
    it.each([
        [
            "paid",
            {
                entryType: { [Op.ne]: "REVERSAL" },
                status: { [Op.ne]: "VOIDED" },
                entryKind: "PAYOUT",
                deletedAt: null,
            },
        ],
        [
            "opening",
            {
                entryType: { [Op.ne]: "REVERSAL" },
                status: { [Op.ne]: "VOIDED" },
                entryKind: "OPENING",
                deletedAt: null,
            },
        ],
        ["reversal", { entryType: "REVERSAL", deletedAt: null }],
        ["reversed", { entryType: { [Op.ne]: "REVERSAL" }, status: "VOIDED", deletedAt: null }],
        ["deleted", { deletedAt: { [Op.ne]: null } }],
    ])("narrows to the rows the Status pill calls %s", async (status, expected) => {
        expect(await whereOf({ status })).toEqual({ partnerCredentialId: 55, ...expected });
    });

    it("keeps every status filter to the five names the pill uses", () => {
        expect(Object.keys(PAYOUT_STATUS_FILTERS)).toEqual(["paid", "opening", "reversal", "reversed", "deleted"]);
    });

    it("narrows to one mode, and ignores a mode there is not", async () => {
        expect(await whereOf({ mode: "UPI" })).toEqual({ partnerCredentialId: 55, mode: "UPI" });
        expect(await whereOf({ mode: "CASH" })).toEqual({ partnerCredentialId: 55 });
    });

    it("searches the reference, the note and who recorded it", async () => {
        const where = await whereOf({ searchText: "utr" });

        expect(where[Op.or]).toEqual([
            { entryNumber: { [Op.like]: "%utr%" } },
            { reference: { [Op.like]: "%utr%" } },
            { note: { [Op.like]: "%utr%" } },
            { recordedByName: { [Op.like]: "%utr%" } },
        ]);
    });

    it("keeps the dates, the status, the mode and the search together", async () => {
        const range = { from: "2026-09-01", to: "2026-09-30" };
        const where = await whereOf({ range, status: "paid", mode: "NEFT", searchText: "utr" });

        expect(where).toMatchObject({
            partnerCredentialId: 55,
            payoutDate: { [Op.between]: ["2026-09-01", "2026-09-30"] },
            entryKind: "PAYOUT",
            mode: "NEFT",
        });
        expect(where[Op.or]).toHaveLength(4);
    });
});
