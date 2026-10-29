const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const settlements = require("../../../entities/paymentGatewaySettlement");
const {
    ENTRY_KINDS,
    ENTRY_TYPES,
    SETTLEMENT_STATUS_FILTERS,
    serializeSettlement,
    listByGateway,
    createSettlement,
    createReceipt,
    createFee,
    createOpeningBalance,
    reverseSettlement,
    sumReceivedFromGateway,
    sumFeesForGateway,
    sumOpeningForGateway,
    sumSettledByGateway,
    findLastReceipt,
} = require("../../paymentGatewaySettlements");

jest.mock("../../../entities/paymentGatewaySettlement", () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
}));

const GATEWAY = "4567000000000777";

const ACTOR = { id: 42, name: "Ibrahim" };

const instance = attrs => ({ ...attrs, update: jest.fn(async patch => ({ ...attrs, ...patch })) });

beforeEach(() => {
    jest.clearAllMocks();
    settlements.create.mockReset();
    // The real transaction wrapper just runs the callback; the rows are mocked.
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
    sequelizeConfig.query = jest.fn(async sql => (sql.startsWith("SELECT LAST_INSERT_ID") ? [{ value: 7 }] : []));
});

describe("recording a settlement", () => {
    it("writes the receipt and its fee as one pair, tied by the receipt's id", async () => {
        const receipt = instance({ id: 9 });
        settlements.create.mockResolvedValueOnce(receipt).mockResolvedValueOnce({ id: 10 });

        const result = await createSettlement({
            gatewayAccountId: GATEWAY,
            amount: 19600,
            feeAmount: 400,
            expectedAmount: 20000,
            entryDate: "2026-09-23",
            reference: "SETL-8891",
            mode: "NEFT",
            note: "weekly batch",
            slip: { key: "s3/key", name: "statement.pdf", format: "pdf" },
            actor: ACTOR,
        });

        expect(settlements.create).toHaveBeenCalledTimes(2);

        const [receiptArgs] = settlements.create.mock.calls[0];
        expect(receiptArgs.entryKind).toBe(ENTRY_KINDS.receipt);
        expect(receiptArgs.amount).toBe(19600);
        expect(receiptArgs.expectedAmount).toBe(20000);
        expect(receiptArgs.slipKey).toBe("s3/key");
        expect(receiptArgs.recordedByName).toBe("Ibrahim");

        // The receipt stamps its own id so both legs can be found together later.
        expect(receipt.update).toHaveBeenCalledWith({ settlementId: 9 }, { transaction: "TXN" });

        const [feeArgs] = settlements.create.mock.calls[1];
        expect(feeArgs.entryKind).toBe(ENTRY_KINDS.fee);
        expect(feeArgs.settlementId).toBe(9);
        expect(feeArgs.amount).toBe(400);
        expect(feeArgs.reference).toBe("SETL-8891");
        // The fee carries no slip of its own; the statement belongs to the receipt.
        expect(feeArgs.expectedAmount).toBeNull();

        expect(result.receipt).toBe(receipt);
    });

    it("still writes a fee row when the gateway kept nothing, so the tables stay in step", async () => {
        settlements.create.mockResolvedValueOnce(instance({ id: 3 })).mockResolvedValueOnce({});

        await createSettlement({
            gatewayAccountId: GATEWAY,
            amount: 20000,
            feeAmount: 0,
            expectedAmount: 20000,
            entryDate: "2026-09-23",
            reference: "SETL-1",
            mode: "NEFT",
            actor: ACTOR,
        });

        expect(settlements.create).toHaveBeenCalledTimes(2);
        expect(settlements.create.mock.calls[1][0].amount).toBe(0);
    });
});

describe("numbering a receipt, a fee and an opening balance", () => {
    it("gives receipts, bills and openings their own series", async () => {
        settlements.create.mockImplementation(async row => row);
        const common = { gatewayAccountId: GATEWAY, amount: 100, entryDate: "2026-10-27", reference: "R", mode: "NEFT", actor: ACTOR };

        const receipt = await createReceipt(common);
        const fee = await createFee(common);
        const opening = await createOpeningBalance({ gatewayAccountId: GATEWAY, amount: 100, asOfDate: "2026-10-01", actor: ACTOR });

        expect([receipt.entryNumber, fee.entryNumber, opening.entryNumber]).toEqual(["RCT-000007", "BIL-000007", "OPB-000007"]);
        expect(sequelizeConfig.query.mock.calls.map(([, options]) => options.replacements).filter(Boolean)).toEqual([
            { name: "RCT" },
            { name: "BIL" },
            { name: "OPB" },
        ]);
        expect(settlements.create).toHaveBeenCalledWith(expect.objectContaining({ entryKind: ENTRY_KINDS.fee }), { transaction: "TXN" });
        expect(serializeSettlement({ id: 1, entryNumber: "RCT-000007" }).entryNumber).toBe("RCT-000007");
        expect(serializeSettlement({ id: 2 }).entryNumber).toBeNull();
    });
});

describe("reversing a settlement", () => {
    it("writes a contra row for both legs and voids both originals", async () => {
        const receipt = instance({
            id: 9,
            gatewayAccountId: GATEWAY,
            settlementId: 9,
            entryKind: ENTRY_KINDS.receipt,
            entryType: ENTRY_TYPES.entry,
            status: "ACTIVE",
        });
        settlements.findOne.mockResolvedValue(receipt);

        const legs = [
            receipt,
            instance({
                id: 10,
                gatewayAccountId: GATEWAY,
                settlementId: 9,
                entryKind: ENTRY_KINDS.fee,
                entryType: ENTRY_TYPES.entry,
                amount: 400,
                status: "ACTIVE",
            }),
        ];
        settlements.findAll.mockResolvedValue(legs);
        settlements.create.mockImplementation(async row => row);

        const reversals = await reverseSettlement({
            id: 9,
            gatewayAccountId: GATEWAY,
            reason: "wrong gateway",
            actor: ACTOR,
        });

        expect(reversals).toHaveLength(2);
        expect(reversals.map(row => row.entryKind)).toEqual([
            ENTRY_KINDS.receipt,
            ENTRY_KINDS.fee,
        ]);
        reversals.forEach(row => {
            expect(row.entryType).toBe(ENTRY_TYPES.reversal);
            expect(row.note).toBe("wrong gateway");
        });
        expect(reversals.map(row => row.entryNumber)).toEqual(["RCT-000007", "BIL-000007"]);
        expect(sequelizeConfig.query.mock.calls.map(([, options]) => options.replacements)).toEqual([
            { name: "RCT" },
            undefined,
            { name: "BIL" },
            undefined,
        ]);
        legs.forEach(leg => {
            expect(leg.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: "VOIDED", voidReason: "wrong gateway" }),
                { transaction: "TXN" }
            );
        });
    });

    it("refuses a row that is already reversed, a reversal itself, or not a receipt", async () => {
        settlements.findOne.mockResolvedValue(null);
        await expect(
            reverseSettlement({ id: 1, gatewayAccountId: GATEWAY, reason: "x", actor: ACTOR })
        ).resolves.toBeNull();

        settlements.findOne.mockResolvedValue({ status: "VOIDED", entryKind: ENTRY_KINDS.receipt });
        await expect(
            reverseSettlement({ id: 1, gatewayAccountId: GATEWAY, reason: "x", actor: ACTOR })
        ).resolves.toBeNull();

        settlements.findOne.mockResolvedValue({
            status: "ACTIVE",
            entryKind: ENTRY_KINDS.receipt,
            entryType: ENTRY_TYPES.reversal,
        });
        await expect(
            reverseSettlement({ id: 1, gatewayAccountId: GATEWAY, reason: "x", actor: ACTOR })
        ).resolves.toBeNull();
    });

    it("looks for a receipt or an opening to reverse, never a fee", async () => {
        settlements.findOne.mockResolvedValue(null);
        await reverseSettlement({ id: 1, gatewayAccountId: GATEWAY, reason: "x", actor: ACTOR });

        const [options] = settlements.findOne.mock.calls[0];
        expect(options.where.id).toBe(1);
        expect(options.where.gatewayAccountId).toBe(GATEWAY);
        expect(options.where.entryKind[Op.in]).toEqual([
            ENTRY_KINDS.receipt,
            ENTRY_KINDS.opening,
        ]);
    });

    it("reverses an opening on its own, since it has no fee behind it", async () => {
        const opening = instance({
            id: 20,
            gatewayAccountId: GATEWAY,
            settlementId: null,
            entryKind: ENTRY_KINDS.opening,
            entryType: ENTRY_TYPES.entry,
            amount: 12400,
            status: "ACTIVE",
        });
        settlements.findOne.mockResolvedValue(opening);
        settlements.findAll.mockResolvedValue([opening]);
        settlements.create.mockImplementation(async row => row);

        const reversals = await reverseSettlement({
            id: 20,
            gatewayAccountId: GATEWAY,
            reason: "wrong figure",
            actor: ACTOR,
        });

        // No settlementId means no pair: the one row is locked by its own id.
        expect(settlements.findAll.mock.calls[0][0]).toEqual(
            expect.objectContaining({ where: { id: 20, status: "ACTIVE" }, transaction: "TXN", lock: true })
        );
        expect(reversals).toHaveLength(1);
        expect(reversals[0].entryKind).toBe(ENTRY_KINDS.opening);
        expect(reversals[0].entryType).toBe(ENTRY_TYPES.reversal);
        expect(reversals[0].entryNumber).toBe("OPB-000007");
        expect(opening.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: "VOIDED" }),
            { transaction: "TXN" }
        );
    });
});

describe("shaping a settlement row", () => {
    it("carries every figure the two tables ask for", () => {
        expect(
            serializeSettlement({
                id: 9,
                gatewayAccountId: GATEWAY,
                settlementId: 9,
                entryKind: "RECEIPT",
                entryType: "ENTRY",
                amount: "19600.0000",
                expectedAmount: "20000.0000",
                entryDate: "2026-09-23",
                reference: "SETL-8891",
                mode: "NEFT",
                note: "weekly batch",
                status: "ACTIVE",
                recordedByName: "Ibrahim",
            })
        ).toEqual(
            expect.objectContaining({
                id: 9,
                settlementId: 9,
                entryKind: "RECEIPT",
                entryType: "ENTRY",
                amount: 19600,
                expectedAmount: 20000,
                reference: "SETL-8891",
                recordedByName: "Ibrahim",
            })
        );
    });

    it("reports no expected figure on a fee row rather than a zero", () => {
        expect(serializeSettlement({ entryKind: "FEE", amount: "400.0000" }).expectedAmount).toBeNull();
    });

    it("marks receipts and fees as never going to the books", () => {
        ["RECEIPT", "FEE"].forEach(entryKind =>
            expect(serializeSettlement({ entryKind, amount: "1.0000" }).posting).toEqual({
                state: "notApplicable",
                note: null,
                detail: null,
            })
        );
    });
});

describe("the balances the cards read", () => {
    it("subtracts a reversal rather than rewriting the row it undid", async () => {
        settlements.findAll.mockResolvedValue([{ total: "15000.0000" }]);

        await sumReceivedFromGateway(GATEWAY);

        const [options] = settlements.findAll.mock.calls[0];
        expect(String(options.attributes[0][0].val)).toContain(
            "CASE WHEN entryType = 'REVERSAL' THEN -amount ELSE amount END"
        );
        expect(options.where.entryKind).toBe(ENTRY_KINDS.receipt);
    });

    it("keeps the receipts and the fees apart", async () => {
        settlements.findAll.mockResolvedValue([{ total: "400.0000" }]);
        await sumFeesForGateway(GATEWAY);
        expect(settlements.findAll.mock.calls[0][0].where.entryKind).toBe(ENTRY_KINDS.fee);
    });

    it("groups every kind per gateway for the list snapshot", async () => {
        settlements.findAll.mockResolvedValue([
            { gatewayAccountId: GATEWAY, entryKind: "RECEIPT", total: "15000.0000" },
            { gatewayAccountId: GATEWAY, entryKind: "FEE", total: "400.0000" },
            { gatewayAccountId: GATEWAY, entryKind: "OPENING", total: "12400.0000" },
        ]);

        await expect(sumSettledByGateway()).resolves.toEqual({
            [GATEWAY]: { received: 15000, fees: 400, opening: 12400 },
        });
    });

    it("never scopes the opening to a date window, since the balance rests on it", async () => {
        settlements.findAll.mockResolvedValue([{ total: "12400.0000" }]);
        await sumOpeningForGateway(GATEWAY);

        const [options] = settlements.findAll.mock.calls[0];
        expect(options.where.entryKind).toBe(ENTRY_KINDS.opening);
        expect(options.where.entryDate).toBeUndefined();
    });

    it("names only a live receipt as the last settlement", async () => {
        settlements.findOne.mockResolvedValue(null);
        await findLastReceipt(GATEWAY);

        expect(settlements.findOne.mock.calls[0][0].where).toEqual({
            gatewayAccountId: GATEWAY,
            status: "ACTIVE",
            entryKind: ENTRY_KINDS.receipt,
            entryType: ENTRY_TYPES.entry,
        });
    });

    it("orders both tables newest first", async () => {
        settlements.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
        await listByGateway({ gatewayAccountId: GATEWAY, entryKind: "FEE", limit: 5, offset: 0 });

        expect(settlements.findAndCountAll.mock.calls[0][0].order).toEqual([
            ["entryDate", "DESC"],
            ["id", "DESC"],
        ]);
    });
});

describe("listing the received and fee tables with a search and filters", () => {
    beforeEach(() => settlements.findAndCountAll.mockResolvedValue({ rows: [], count: 0 }));

    const whereOf = async args => {
        await listByGateway({ gatewayAccountId: GATEWAY, entryKind: "FEE", limit: 5, offset: 0, ...args });
        return settlements.findAndCountAll.mock.calls.at(-1)[0].where;
    };

    const live = { entryType: { [Op.ne]: "REVERSAL" }, status: { [Op.ne]: "VOIDED" }, deletedAt: null };

    it("lists everything of the table when nothing is filtered", async () => {
        expect(await whereOf({})).toEqual({ gatewayAccountId: GATEWAY, entryKind: "FEE" });
        expect(await whereOf({ status: "success", mode: "CASH", searchText: "" })).toEqual({
            gatewayAccountId: GATEWAY,
            entryKind: "FEE",
        });
    });

    // The Status pill reads a reversal first, then a reversed row, then the opening, else the
    // kind: received or charged.
    it.each([
        ["received", { ...live, entryKind: "RECEIPT" }],
        ["charged", { ...live, entryKind: "FEE" }],
        ["opening", { ...live, entryKind: "OPENING" }],
        ["reversal", { entryType: "REVERSAL", deletedAt: null }],
        ["reversed", { entryType: { [Op.ne]: "REVERSAL" }, status: "VOIDED", deletedAt: null }],
        ["deleted", { deletedAt: { [Op.ne]: null } }],
    ])("narrows to the rows the Status pill calls %s", async (status, expected) => {
        const where = await whereOf({ status });

        expect(where[Op.and]).toEqual([expected]);
        expect(where.entryKind).toBe("FEE");
    });

    it("keeps every status filter to the six names the pills use", () => {
        expect(Object.keys(SETTLEMENT_STATUS_FILTERS)).toEqual([
            "received",
            "charged",
            "opening",
            "reversal",
            "reversed",
            "deleted",
        ]);
    });

    // Kept as a second condition, so the other table's status finds nothing here rather than
    // replacing the kinds this table is limited to.
    it("never lets a status widen the kinds a table is scoped to", async () => {
        const where = await whereOf({ entryKind: ["RECEIPT", "OPENING"], status: "charged" });

        expect(where.entryKind).toEqual({ [Op.in]: ["RECEIPT", "OPENING"] });
        expect(where[Op.and]).toEqual([{ ...live, entryKind: "FEE" }]);
    });

    it("narrows to one mode, and ignores a mode there is not", async () => {
        expect((await whereOf({ mode: "UPI" })).mode).toBe("UPI");
        expect(await whereOf({ mode: "CASH" })).not.toHaveProperty("mode");
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
        const where = await whereOf({
            entryKind: ["RECEIPT", "OPENING"],
            range,
            status: "received",
            mode: "NEFT",
            searchText: "utr",
        });

        expect(where).toMatchObject({
            gatewayAccountId: GATEWAY,
            entryKind: { [Op.in]: ["RECEIPT", "OPENING"] },
            entryDate: { [Op.between]: ["2026-09-01", "2026-09-30"] },
            mode: "NEFT",
        });
        expect(where[Op.and]).toHaveLength(1);
        expect(where[Op.or]).toHaveLength(4);
    });
});
