const sequelizeConfig = require("../../../configs/database/index");

jest.mock("../accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2000-01-01"),
    flooredAfter: jest.fn(expr => `${expr} > :accountingFloor`),
}));

jest.mock("../vendorLedger", () => ({
    getVendorDepositAccounts: jest.fn().mockResolvedValue({ sharedAccountId: "42", legacyByVendorId: {} }),
    allAccountIds: jest.fn(() => ["42"]),
    REFUND_KEYS: ["refund", "adminRefund"],
}));

const { getVendorDepositAccounts, allAccountIds } = require("../vendorLedger");
const { buildWhere, buildRowsQuery, listFeeDetails, serializeFeeDetail, feeExportColumns } = require("../feeDetails");

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-22 23:59:59" };

const COMMISSION_ROW = {
    id: 41,
    corporateTxnId: "1789647165639",
    transactionDate: "2026-09-22T10:00:00.000Z",
    service: "Data Cards",
    vendorName: "Markup Fixture",
    orderValue: "1080.0000",
    vendorPayable: "882.0000",
    refunded: "441.0000",
    feeExcludingGST: "100.0000",
    feeIncludingGST: "118.0000",
    pekoInvoiceDetails: null,
    status: "SUCCESS",
    transactionVerdict: "true",
    refundVerdict: "true",
};

beforeEach(() => {
    jest.clearAllMocks();
    getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "42", legacyByVendorId: {} });
    allAccountIds.mockReturnValue(["42"]);
    sequelizeConfig.query.mockImplementation(sql =>
        Promise.resolve(sql.includes("COUNT(*)") ? [{ totalCount: "3" }] : [COMMISSION_ROW])
    );
});

describe("eligibility — which orders belong on each screen", () => {
    // Matches the dashboard KPI's own definition exactly — confirmed against live data that a
    // principal-markup (Other Sales) order can still carry a non-zero commissionExcludingGST,
    // and the Commission card counts it. Excluding it here would make the list disagree with
    // the very card it drills into.
    it("does not exclude principal markup for either fee type — the dashboard card doesn't either", () => {
        expect(buildWhere({ feeType: "commission", range: null, searchText: "" })).not.toContain(
            "PRINCIPAL_MARKUP"
        );
        expect(buildWhere({ feeType: "platformFee", range: null, searchText: "" })).not.toContain(
            "PRINCIPAL_MARKUP"
        );
    });

    it("reads the right journalData field per fee type", () => {
        expect(buildWhere({ feeType: "commission", range: null, searchText: "" })).toContain(
            "commissionIncludingGST"
        );
        expect(buildWhere({ feeType: "platformFee", range: null, searchText: "" })).toContain(
            "platformFeeIncludingGST"
        );
    });

    // Confirmed against live data: 66 SUCCESS orders this month carry a commission/platform-fee
    // figure without their transaction journal posted yet — the dashboard card counts them
    // (status = SUCCESS only), so a journal-posted requirement here would silently drop them.
    it("requires status = SUCCESS, not a posted transaction journal", () => {
        const sql = buildWhere({ feeType: "commission", range: null, searchText: "" });
        expect(sql).toContain("orders.status = 'SUCCESS'");
        expect(sql).not.toContain("journalRecordStatus");
    });

    it("adds a date/search filter only when one was asked for", () => {
        const bare = buildWhere({ feeType: "commission", range: null, searchText: "" });
        expect(bare).not.toContain("BETWEEN");
        expect(bare).not.toContain("LIKE");

        const filtered = buildWhere({ feeType: "commission", range: RANGE, searchText: "acme" });
        expect(filtered).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(filtered).toContain("orders.corporateTxnId LIKE :searchText");
        expect(filtered).toContain("vendors.vendorName LIKE :searchText");
    });

    it("filters by vendor only when one was asked for", () => {
        const bare = buildWhere({ feeType: "commission", range: null, searchText: "" });
        expect(bare).not.toContain("vendorId");

        const filtered = buildWhere({ feeType: "commission", range: null, searchText: "", vendorId: 9 });
        expect(filtered).toContain("serviceOperators.vendorId = :vendorId");
    });
});

describe("the commission row also joins the refund-reversal subquery", () => {
    it("only for commission — platform fee has no reversal concept", () => {
        const commissionSql = buildRowsQuery({ feeType: "commission", range: null, searchText: "" });
        const platformFeeSql = buildRowsQuery({ feeType: "platformFee", range: null, searchText: "" });

        expect(commissionSql).toContain("refunds.orderId = orders.id");
        expect(commissionSql).toContain("vendorPayable");
        expect(platformFeeSql).not.toContain("refunds.orderId");
        expect(platformFeeSql).not.toContain("vendorPayable");
    });
});

describe("listing them", () => {
    it("resolves vendor deposit accounts only for commission, not platform fee", async () => {
        await listFeeDetails({ feeType: "commission", range: RANGE, searchText: "", limit: 10, offset: 0 });
        expect(getVendorDepositAccounts).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();
        getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "42", legacyByVendorId: {} });
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(sql.includes("COUNT(*)") ? [{ totalCount: "0" }] : [])
        );
        await listFeeDetails({ feeType: "platformFee", range: RANGE, searchText: "", limit: 10, offset: 0 });
        expect(getVendorDepositAccounts).not.toHaveBeenCalled();
    });

    it("carries the count beside the page", async () => {
        const result = await listFeeDetails({
            feeType: "commission",
            range: RANGE,
            searchText: "",
            limit: 10,
            offset: 0,
        });
        expect(result.count).toBe(3);
        expect(result.rows).toEqual([COMMISSION_ROW]);
    });
});

describe("shaping a row", () => {
    it("reverses commission in proportion to how much of the vendor's payable came back", () => {
        // Half the vendor payable was refunded, so half the commission is reversed too.
        expect(serializeFeeDetail(COMMISSION_ROW, "commission")).toEqual({
            id: 41,
            corporateTxnId: "1789647165639",
            transactionDate: "2026-09-22T10:00:00.000Z",
            service: "Data Cards",
            vendorName: "Markup Fixture",
            orderValue: 1080,
            feeExcludingGST: 100,
            feeIncludingGST: 118,
            feeReversed: 59,
            feeNet: 59,
            pekoInvoiceDetails: null,
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("says the fee is not in the books until the refund that took part of it back is posted too", () => {
        expect(
            serializeFeeDetail({ ...COMMISSION_ROW, refundVerdict: null, refundSkipped: "true" }, "commission").posting
        ).toEqual({ state: "notPosted", note: "Refund: Could not be prepared", detail: null });
    });

    it("never divides by zero when the order has no vendor payable at all", () => {
        const result = serializeFeeDetail({ ...COMMISSION_ROW, vendorPayable: 0, refunded: 0 }, "commission");
        expect(result.feeReversed).toBe(0);
        expect(result.feeNet).toBe(118);
    });

    it("leaves out feeReversed/feeNet entirely for platform fee — that concept doesn't exist there", () => {
        const result = serializeFeeDetail(COMMISSION_ROW, "platformFee");
        expect(result).not.toHaveProperty("feeReversed");
        expect(result).not.toHaveProperty("feeNet");
        expect(result.feeIncludingGST).toBe(118);
    });

    it("dashes what is missing rather than inventing it", () => {
        expect(
            serializeFeeDetail({ id: 1, corporateTxnId: "X", transactionDate: "2026-09-22" }, "platformFee")
        ).toMatchObject({ service: null, vendorName: null, orderValue: 0, feeIncludingGST: 0 });
    });
});

describe("feeExportColumns — what the downloaded file carries", () => {
    const cellsOf = (feeType, row) => feeExportColumns(feeType).map(column => column.value(row));
    const headersOf = feeType => feeExportColumns(feeType).map(column => column.header);

    it("gives the commission table's columns in the table's order, without the invoice button", () => {
        expect(headersOf("commission")).toEqual([
            "Date",
            "Order Ref",
            "Service",
            "Vendor",
            "Order Value",
            "Commission (excl. GST)",
            "Commission (incl. GST)",
            "Reversed",
            "Net",
            "Posted",
        ]);
    });

    it("gives platform fee its own labels and no Reversed or Net", () => {
        expect(headersOf("platformFee")).toEqual([
            "Date",
            "Order Ref",
            "Service",
            "Vendor",
            "Order Value",
            "Platform Fee (excl. GST)",
            "Platform Fee (incl. GST)",
            "Posted",
        ]);
    });

    it("fills a commission row with the same figures the screen shows, amounts as numbers", () => {
        const row = serializeFeeDetail(COMMISSION_ROW, "commission");

        expect(cellsOf("commission", row)).toEqual([
            "22 Sep 2026, 03:30 PM",
            "1789647165639",
            "Data Cards",
            "Markup Fixture",
            1080,
            100,
            118,
            59,
            59,
            "Posted",
        ]);
    });

    it("writes the time in IST, whatever timezone the server runs in", () => {
        const [date] = cellsOf("platformFee", { transactionDate: "2026-09-22T20:00:00.000Z" });
        expect(date).toBe("23 Sep 2026, 01:30 AM");
    });

    it("spells out why a row isn't in the books, as the Posted column on screen does", () => {
        const row = serializeFeeDetail({ ...COMMISSION_ROW, refundVerdict: null, refundSkipped: "true" }, "commission");

        expect(cellsOf("commission", row).at(-1)).toBe("Not posted — Refund: Could not be prepared");
    });

    it("leaves a blank date rather than 'Invalid date'", () => {
        expect(cellsOf("platformFee", { transactionDate: null })[0]).toBe("");
    });
});

describe("fee details for the internal purchase accounts", () => {
    it("narrows to the accounts given only when asked, and to nothing when there are none", () => {
        expect(buildWhere({ feeType: "commission", range: null, searchText: "" })).not.toContain("credentialId IN");
        expect(buildWhere({ feeType: "commission", range: null, searchText: "", accountIds: [12, 15] })).toContain(
            "orders.credentialId IN (:accountScopeIds)"
        );
        expect(buildWhere({ feeType: "platformFee", range: null, searchText: "", accountIds: [] })).toContain("AND 1 = 0");
    });
});
