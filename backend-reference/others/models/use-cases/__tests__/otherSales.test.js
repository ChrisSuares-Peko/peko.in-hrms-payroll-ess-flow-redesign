const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../../entities/credential");
const {
    buildOtherSalesQuery,
    buildOtherSalesTotalsQuery,
    listOtherSales,
    serializeOtherSale,
    otherSalesExportColumns,
    otherSalesExportSummary,
} = require("../otherSales");

jest.mock("../../entities/credential", () => ({ findAll: jest.fn() }));

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-22 23:59:59" };

const ROW = {
    id: 41,
    corporateTxnId: "1789647165639",
    transactionDate: "2026-09-22T10:00:00.000Z",
    status: "SUCCESS",
    service: "Data Cards",
    vendorId: 9,
    vendorName: "Markup Fixture",
    registeredBy: "55",
    totalAmount: "1080.0000",
    platformFee: "80.0000",
    markup: "118.0000",
    couponDiscount: "100.0000",
    transactionVerdict: "true",
};

const TOTALS = {
    totalCount: "2",
    totalAmount: "1316.0000",
    platformFee: "80.0000",
    markup: "154.0000",
    couponDiscount: "100.0000",
};

const run = (overrides = {}) =>
    listOtherSales({
        range: null,
        vendorId: null,
        partnerId: null,
        searchText: "",
        sort: "DESC",
        sortField: "transactionDate",
        limit: 10,
        offset: 0,
        ...overrides,
    });

beforeEach(() => {
    jest.clearAllMocks();
    credential.findAll.mockResolvedValue([{ id: 55, name: "Gulf Reach" }]);
    sequelizeConfig.query.mockImplementation(sql =>
        Promise.resolve(sql.includes("COUNT(*)") ? [TOTALS] : [ROW])
    );
});

describe("which orders the screen asks for", () => {
    const sql = buildOtherSalesQuery({ sort: "DESC", sortField: "transactionDate" });

    it("keeps only principal markup, and only what the gateway answered on", () => {
        expect(sql).toContain("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode')), CASE WHEN");
        expect(sql).toContain(
            "THEN 'MIXED' END, CONVERT(serviceOperators.commissionMode USING utf8mb4), 'MARGIN') IN ('PRINCIPAL_MARKUP', 'MIXED')"
        );
        expect(sql).toContain("orders.status <> 'PENDING'");
    });

    it("lists a mixed order for its principal share only, and a principal markup whole", () => {
        expect(sql).toContain("orders.amountInINR)) * CASE WHEN COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode'))");
        expect(sql).toContain("= 'MIXED' THEN CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode'))");
        expect(sql).toContain("WHEN 'PRINCIPAL_MARKUP' THEN 1 ELSE 0 END ELSE 1 END AS totalAmount");
        expect(sql).toContain("ELSE 1 END AS platformFee");
        expect(sql).toContain("ELSE 1 END AS couponDiscount");
    });

    it("lists an order whose journal never ran, by its own breakdown or else the mode its operator sells under", () => {
        expect(sql).not.toContain("orders.journalData IS NOT NULL");
        expect(sql).toContain("(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.totalTransactionAmount')) AS DECIMAL(16, 4)), orders.amountInINR)) *");
        expect(sql).toContain("'$.principalSalesPayable')) AS DECIMAL(16, 4)), 0)");
    });

    it("reads the markup as Peko's commission including GST, whether the item was a margin or a principal one, and blank for a sale on Peko's own account", () => {
        expect(sql).toContain(
            "= 'OWN_REVENUE' THEN NULL WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionIncludingGST')) AS DECIMAL(16, 4)) IS NULL"
        );
        expect(sql).toContain("= 'MIXED' THEN 0 ELSE COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionIncludingGST')) AS DECIMAL(16, 4)), 0) END + COALESCE(");
        expect(sql).toContain("'$.principalCommissionExcludingGST')) AS DECIMAL(16, 4)), 0) + COALESCE(");
        expect(sql).toContain("'$.outputGSTonPrincipalCommission')) AS DECIMAL(16, 4)), 0) END AS markup");
        expect(sql).toContain("IS NULL THEN NULL ELSE");
        expect(buildOtherSalesTotalsQuery({})).toContain("'$.outputGSTonPrincipalCommission')) AS DECIMAL(16, 4)), 0) END END), 0) AS markup");
    });

    it("reaches the vendor through the service operator and the partner through the credential", () => {
        expect(sql).toContain(
            "INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId"
        );
        expect(sql).toContain("LEFT JOIN vendors ON vendors.id = serviceOperators.vendorId");
        expect(sql).toContain("LEFT JOIN credentials ON credentials.id = orders.credentialId");
    });

    it("converts every text column, because the legacy tables are latin1", () => {
        ["corporateTxnId", "status", "serviceProvider", "vendorName", "registeredBy"].forEach(
            column => {
                expect(sql).toContain(`CONVERT(`);
                expect(sql).toContain(column);
            }
        );
    });

    it("adds a filter only when one was asked for", () => {
        const bare = buildOtherSalesQuery({});
        expect(bare).not.toContain("transactionDate BETWEEN");
        expect(bare).not.toContain("serviceOperators.vendorId = :vendorId");
        expect(bare).not.toContain("credentials.registeredBy = :partnerId");
        expect(bare).not.toContain("LIKE :searchText");

        const filtered = buildOtherSalesQuery({
            range: RANGE,
            vendorId: 9,
            partnerId: 55,
            searchText: "data",
        });
        expect(filtered).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(filtered).toContain("serviceOperators.vendorId = :vendorId");
        expect(filtered).toContain("credentials.registeredBy = :partnerId");
        expect(filtered).toContain("orders.corporateTxnId LIKE :searchText");
        expect(filtered).toContain("serviceOperators.serviceProvider LIKE :searchText");
        expect(filtered).toContain("vendors.vendorName LIKE :searchText");
    });

    it("narrows to the sales Peko made to its own customers when Default is picked", () => {
        const direct = buildOtherSalesQuery({ partnerId: "default" });

        expect(direct).toContain(
            "(credentials.registeredBy IS NULL OR credentials.registeredBy NOT REGEXP '^[0-9]+$')"
        );
        expect(direct).not.toContain(":partnerId");
        expect(buildOtherSalesTotalsQuery({ partnerId: "default" })).toContain("credentials.registeredBy IS NULL");
    });

    it("sorts by a known column only, newest first by default", () => {
        expect(sql).toContain("ORDER BY orders.transactionDate DESC");
        expect(buildOtherSalesQuery({ sortField: "vendorName", sort: "ASC" })).toContain(
            "ORDER BY vendors.vendorName ASC"
        );
        expect(buildOtherSalesQuery({ sortField: "; DROP TABLE orders" })).toContain(
            "ORDER BY orders.transactionDate DESC"
        );
    });

    it("counts and totals over the same filters as the listing", () => {
        const totals = buildOtherSalesTotalsQuery({ vendorId: 9 });
        expect(totals).toContain("COUNT(*) AS totalCount");
        expect(totals).toContain("serviceOperators.vendorId = :vendorId");
        expect(totals).not.toContain("LIMIT");
    });

    it("adds up only the sales whose entry reached the books, while still counting every row", () => {
        const totals = buildOtherSalesTotalsQuery({});
        const gate = "SUM(CASE WHEN (JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) = 'true' OR (";
        expect(totals.split(gate)).toHaveLength(5);
        expect(totals).toContain("'$.transaction.skipped')), 'false') <> 'true')) THEN (COALESCE(");
        expect(totals).toContain("COUNT(*) AS totalCount");
    });

    it("never shows the vendor payable, which misleads on principal markup, and only reads it to tell the mode and the share", () => {
        [sql, buildOtherSalesTotalsQuery({})].forEach(query => {
            expect(query).not.toContain("AS vendorPayable");
            expect(query).toContain("'$.vendorPayable')) AS DECIMAL(16, 4)), 0) > 0 OR");
        });
    });
});

describe("listing them", () => {
    it("binds only the filters that were given, and always the accounting floor", async () => {
        await run({ range: RANGE, vendorId: 9, partnerId: 55, searchText: "data" });

        const [, options] = sequelizeConfig.query.mock.calls[0];
        expect(options.replacements).toEqual({
            accountingFloor: "9999-12-31",
            oneTimeItemKeys: ["corporate_cards"],
            from: RANGE.from,
            to: RANGE.to,
            vendorId: 9,
            partnerId: "55",
            searchText: "%data%",
            limit: 10,
            offset: 0,
        });
    });

    it("binds no partner when Default is picked, because that filter is not an id", async () => {
        await run({ range: RANGE, partnerId: "default" });

        const [, options] = sequelizeConfig.query.mock.calls[0];
        expect(options.replacements).not.toHaveProperty("partnerId");
    });

    it("floors even when no date range is given, so a bare page load is not all time", async () => {
        await run({});

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain(":accountingFloor");
        expect(sql).not.toContain("BETWEEN :from AND :to");
        expect(options.replacements.accountingFloor).toBe("9999-12-31");
    });

    it("names the partner behind each sale", async () => {
        const result = await run();

        expect(credential.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ attributes: ["id", "name"] })
        );
        expect(result.rows[0].partnerName).toBe("Gulf Reach");
    });

    it("leaves a direct sale without an invented partner", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("COUNT(*)") ? [TOTALS] : [{ ...ROW, registeredBy: null }]
            )
        );

        const result = await run();

        expect(credential.findAll).not.toHaveBeenCalled();
        expect(result.rows[0].partnerName).toBeNull();
    });

    it("carries the count and the totals beside the page", async () => {
        const result = await run();

        expect(result.count).toBe(2);
        expect(result.totals).toEqual({
            totalAmount: 1316,
            platformFee: 80,
            markup: 154,
            couponDiscount: 100,
        });
    });
});

describe("shaping a row", () => {
    it("turns every decimal string into a number", () => {
        expect(serializeOtherSale({ ...ROW, partnerName: "Gulf Reach" })).toEqual({
            id: 41,
            corporateTxnId: "1789647165639",
            transactionDate: "2026-09-22T10:00:00.000Z",
            service: "Data Cards",
            vendorId: 9,
            vendorName: "Markup Fixture",
            partnerName: "Gulf Reach",
            totalAmount: 1080,
            platformFee: 80,
            markup: 118,
            couponDiscount: 100,
            status: "SUCCESS",
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("says a sale whose entry never ran is not in the books yet", () => {
        expect(serializeOtherSale({ ...ROW, transactionVerdict: null }).posting).toEqual({
            state: "notPosted",
            note: "Not recorded yet",
            detail: null,
        });
    });

    it("drops a vendor payable even when a row carries one", () => {
        expect(serializeOtherSale({ ...ROW, vendorPayable: "882.0000" })).not.toHaveProperty(
            "vendorPayable"
        );
    });

    it("dashes what is missing rather than inventing it", () => {
        expect(
            serializeOtherSale({ id: 1, corporateTxnId: "X", transactionDate: "2026-09-22", transactionVerdict: "true" })
        ).toMatchObject({
            service: null,
            vendorName: null,
            partnerName: null,
            totalAmount: null,
            platformFee: null,
            markup: null,
            couponDiscount: null,
            status: null,
        });
    });

    it("dashes every amount, the full amount included, when the entry was skipped or never recorded, and keeps them when the books refused it", () => {
        const amounts = row => {
            const sale = serializeOtherSale(row);
            return [sale.totalAmount, sale.platformFee, sale.markup, sale.couponDiscount];
        };

        expect(amounts({ ...ROW, transactionVerdict: null })).toEqual([null, null, null, null]);
        expect(amounts({ ...ROW, transactionVerdict: "false", transactionSkipped: "true" })).toEqual([null, null, null, null]);
        expect(amounts({ ...ROW, transactionVerdict: "false", transactionSkipped: null })).toEqual([1080, 80, 118, 100]);
        expect(amounts(ROW)).toEqual([1080, 80, 118, 100]);
    });
});

describe("the posting status", () => {
    it("reads each sale's journal entries on the rows only, never on the grouped totals", () => {
        const rows = buildOtherSalesQuery({ sort: "DESC", sortField: "transactionDate" });

        expect(rows).toContain(
            "JSON_UNQUOTE(JSON_EXTRACT(orders.journalRecordStatus, '$.transaction')) AS transactionVerdict"
        );
        expect(rows).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.adminRefund.reason')) AS adminRefundReason");
        expect(buildOtherSalesTotalsQuery({})).not.toContain("Verdict");
    });
});

describe("otherSalesExportColumns — what the downloaded file carries", () => {
    const cellsOf = row => otherSalesExportColumns().map(column => column.value(row));

    it("gives the table's columns in the table's order", () => {
        expect(otherSalesExportColumns().map(column => column.header)).toEqual([
            "Date",
            "Txn ID",
            "Service",
            "Vendor",
            "Partner",
            "Full Amount",
            "Platform Fee",
            "Markup",
            "Coupon",
            "Status",
            "Posted",
        ]);
    });

    it("fills a row with what the screen shows, amounts as numbers and the day in IST", () => {
        expect(cellsOf(serializeOtherSale({ ...ROW, partnerName: "Gulf Reach" }))).toEqual([
            "22 Sep 2026",
            "1789647165639",
            "Data Cards",
            "Markup Fixture",
            "Gulf Reach",
            1080,
            80,
            118,
            100,
            "Success",
            "Posted",
        ]);
    });

    it("rolls the day over at IST midnight, not UTC", () => {
        expect(cellsOf({ transactionDate: "2026-09-22T20:00:00.000Z" })[0]).toBe("23 Sep 2026");
    });

    it("calls a sale with no referring partner Peko (Default), as the screen does", () => {
        expect(cellsOf({ partnerName: null })[4]).toBe("Peko (Default)");
    });

    it("labels the status the way the status pill does", () => {
        const statusOf = status => cellsOf({ status })[9];

        expect(statusOf("SUCCESS")).toBe("Success");
        expect(statusOf("ordered")).toBe("Success");
        expect(statusOf("REFUND")).toBe("Refunded");
        expect(statusOf("FAILURE")).toBe("Failed");
        expect(statusOf("PROCESSING")).toBe("PROCESSING");
        expect(statusOf(null)).toBe("Unknown");
    });

    it("leaves blanks where the journal derived no figure, rather than zeros", () => {
        const [, , , , , , platformFee, markup, coupon] = cellsOf(
            serializeOtherSale({ ...ROW, platformFee: null, markup: null, couponDiscount: null })
        );

        expect([platformFee, markup, coupon]).toEqual([null, null, null]);
    });

    it("leaves a blank date rather than 'Invalid date'", () => {
        expect(cellsOf({ transactionDate: null })[0]).toBe("");
    });
});

describe("otherSalesExportSummary — the totals tiles in the PDF", () => {
    it("shows the four totals the screen's summary strip shows, in its order", () => {
        const totals = { totalAmount: 5224.4, platformFee: 88.35, markup: 3583.46, couponDiscount: 0 };

        expect(otherSalesExportSummary(totals)).toEqual([
            { label: "Full Amount", value: 5224.4, money: true },
            { label: "Platform Fee", value: 88.35, money: true },
            { label: "Markup", value: 3583.46, money: true },
            { label: "Coupon", value: 0, money: true },
        ]);
    });
});

describe("other sales for the internal purchase accounts", () => {
    it("narrows the listing to the accounts given, and to nothing when there are none", () => {
        expect(buildOtherSalesQuery({ accountIds: [12, 15] })).toContain("orders.credentialId IN (:accountScopeIds)");
        expect(buildOtherSalesQuery({ accountIds: [] })).toContain("AND 1 = 0");
        expect(buildOtherSalesQuery({})).not.toContain("credentialId IN");
    });
});
