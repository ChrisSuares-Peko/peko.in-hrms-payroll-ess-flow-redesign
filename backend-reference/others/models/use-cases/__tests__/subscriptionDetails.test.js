const sequelizeConfig = require("../../../configs/database/index");

jest.mock("../accountingPeriod", () => ({
    loadAccountingFloor: jest.fn().mockResolvedValue("2000-01-01"),
    flooredAfter: jest.fn(expr => `${expr} > :accountingFloor`),
}));

jest.mock("../../entities/credential", () => ({ findAll: jest.fn() }));

const credential = require("../../entities/credential");
const {
    buildWhere,
    buildRowsQuery,
    listSubscriptionDetails,
    serializeSubscriptionDetail,
    subscriptionExportColumns,
} = require("../subscriptionDetails");

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-22 23:59:59" };

const ROW = {
    id: 20632,
    corporateTxnId: "1790230428010",
    transactionDate: "2026-09-24T06:14:02.000Z",
    subscriberUsername: "100000919",
    subscriberName: "JOHN DOE",
    registeredBy: "55",
    plan: "Peko+",
    billingType: "MONTHLY",
    orderValue: "236.0000",
    netRevenue: "200.0000",
    pekoInvoiceDetails: null,
    status: "SUCCESS",
    transactionVerdict: "false",
    transactionSkipped: "true",
    transactionReason: "Journal recording is currently paused",
};

beforeEach(() => {
    jest.clearAllMocks();
    credential.findAll.mockResolvedValue([{ id: 55, name: "Gulf Reach" }]);
    sequelizeConfig.query.mockImplementation(sql =>
        Promise.resolve(sql.includes("COUNT(*)") ? [{ totalCount: "1" }] : [ROW])
    );
});

describe("eligibility — matches the dashboard's subscriptions KPI exactly", () => {
    it("requires status = SUCCESS and a netSubscriptionIncome figure, an order tagged as a Peko plan or add-on, or one of Peko's own services", () => {
        const sql = buildWhere({ range: null, searchText: "", partnerId: null, billingType: null });
        expect(sql).toContain("orders.status = 'SUCCESS'");
        expect(sql).toContain("netSubscriptionIncome");
        expect(sql).toContain(
            "OR (COALESCE(orders.optional, '') = 'SUBSCRIPTION' OR (COALESCE(orders.optional, '') = 'SUBSCRIPTION-ADDONS' AND planSubscription.serviceOperatorId IS NULL)) OR JSON_CONTAINS("
        );
        expect(sql).toContain("JSON_QUOTE(COALESCE(serviceOperators.accessKey, ''))");
        expect(sql).toContain("'$.peko_service_subscriptions'");
        expect(sql).toContain("NOT (COALESCE(serviceOperators.accessKey, '') IN (:oneTimeItemKeys))");
        expect(buildRowsQuery({ range: null, searchText: "", partnerId: null, billingType: null })).toContain(
            "SELECT corporateTxnId, packageId, serviceOperatorId, ROW_NUMBER() OVER (PARTITION BY corporateTxnId ORDER BY id DESC) AS latestFirst " +
                "FROM subscriptions WHERE corporateTxnId IS NOT NULL) AS ranked WHERE latestFirst = 1) AS planSubscription"
        );
    });

    it("adds a billingType filter only when one was asked for", () => {
        const bare = buildWhere({ range: null, searchText: "", partnerId: null, billingType: null });
        expect(bare).not.toContain("billingType");

        const filtered = buildWhere({ range: null, searchText: "", partnerId: null, billingType: "MONTHLY" });
        expect(filtered).toContain(
            "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.billingType')), CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.billingType')) END) = :billingType"
        );
    });

    it("reads the billing cycle off the order itself when the entry carries none", () => {
        const sql = buildRowsQuery({ range: null, searchText: "", partnerId: null, billingType: null });
        expect(sql).toContain(
            "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.billingType')), CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.billingType')) END) AS billingType"
        );
    });

    it("adds a partner filter only when one was asked for", () => {
        const bare = buildWhere({ range: null, searchText: "", partnerId: null, billingType: null });
        expect(bare).not.toContain("registeredBy");

        const filtered = buildWhere({ range: null, searchText: "", partnerId: 55, billingType: null });
        expect(filtered).toContain("credentials.registeredBy = :partnerId");
    });

    it("filters to unpartnered subscribers for the dropdown's Default option", async () => {
        const sql = buildWhere({ range: null, searchText: "", partnerId: "default", billingType: null });
        expect(sql).toContain("credentials.registeredBy IS NULL OR credentials.registeredBy = ''");
        expect(sql).not.toContain(":partnerId");

        await listSubscriptionDetails({
            range: RANGE,
            searchText: "",
            partnerId: "default",
            billingType: null,
            limit: 10,
            offset: 0,
        });
        const [, options] = sequelizeConfig.query.mock.calls[0];
        expect(options.replacements.partnerId).toBeUndefined();
        expect(options.replacements.oneTimeItemKeys).toEqual(["corporate_cards"]);
    });

    it("adds a date/search filter only when one was asked for", () => {
        const filtered = buildWhere({ range: RANGE, searchText: "acme", partnerId: null, billingType: null });
        expect(filtered).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(filtered).toContain("orders.corporateTxnId LIKE :searchText");
        expect(filtered).toContain("credentials.username LIKE :searchText");
        expect(filtered).toContain("credentials.name LIKE :searchText");
    });

    it("searches the plan as the table shows it, Peko Commerce plans included, whatever the case", () => {
        const filtered = buildWhere({ range: null, searchText: "commerce", partnerId: null, billingType: null });
        const plan = filtered.slice(filtered.indexOf("OR LOWER(CONVERT(COALESCE(packages.packageName"));

        expect(plan).toContain("JSON_EXTRACT(orders.orderResponse, '$.serviceName')");
        expect(plan).toContain("CONVERT(serviceOperators.serviceProvider USING utf8mb4)");
        expect(plan).toContain("USING utf8mb4)) LIKE LOWER(:searchText))");

        const search = filtered.slice(filtered.indexOf(" AND (orders.corporateTxnId"));
        const depth = [...search].reduce((open, char) => open + (char === "(") - (char === ")"), 0);
        expect(depth).toBe(0);
    });
});

describe("row shape", () => {
    it("resolves the plan through packages, falling back to the service", () => {
        const sql = buildRowsQuery({ range: null, searchText: "", partnerId: null, billingType: null });
        expect(sql).toContain("COALESCE(packages.packageName");
        expect(sql).toContain("serviceOperators.serviceProvider");
    });
});

describe("listing them", () => {
    it("names the partner behind each subscription", async () => {
        const result = await listSubscriptionDetails({
            range: RANGE,
            searchText: "",
            partnerId: null,
            billingType: null,
            limit: 10,
            offset: 0,
        });
        expect(credential.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ attributes: ["id", "name"] })
        );
        expect(result.rows[0].partnerName).toBe("Gulf Reach");
        expect(result.count).toBe(1);
    });

    it("leaves a direct subscriber without an invented partner", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(sql.includes("COUNT(*)") ? [{ totalCount: "1" }] : [{ ...ROW, registeredBy: null }])
        );
        const result = await listSubscriptionDetails({
            range: RANGE,
            searchText: "",
            partnerId: null,
            billingType: null,
            limit: 10,
            offset: 0,
        });
        expect(credential.findAll).not.toHaveBeenCalled();
        expect(result.rows[0].partnerName).toBeNull();
    });
});

describe("shaping a row", () => {
    it("turns every decimal string into a number", () => {
        expect(
            serializeSubscriptionDetail({ ...ROW, partnerName: "Gulf Reach", transactionVerdict: "true", transactionSkipped: null, transactionReason: null })
        ).toEqual({
            id: 20632,
            corporateTxnId: "1790230428010",
            transactionDate: "2026-09-24T06:14:02.000Z",
            subscriberUsername: "100000919",
            subscriberName: "JOHN DOE",
            partnerName: "Gulf Reach",
            plan: "Peko+",
            billingType: "MONTHLY",
            orderValue: 236,
            netRevenue: 200,
            pekoInvoiceDetails: null,
            posting: { state: "posted", note: null, detail: null },
        });
    });

    it("dashes both amounts, the order value included, when the entry was skipped or never recorded, and keeps them when the books refused it", () => {
        const amounts = row => {
            const sale = serializeSubscriptionDetail(row);
            return [sale.orderValue, sale.netRevenue];
        };

        expect(amounts(ROW)).toEqual([null, null]);
        expect(serializeSubscriptionDetail(ROW).posting).toEqual({
            state: "notPosted",
            note: "Recording paused",
            detail: "Journal recording is currently paused",
        });
        expect(amounts({ ...ROW, transactionVerdict: null, transactionSkipped: null })).toEqual([null, null]);
        expect(amounts({ ...ROW, transactionVerdict: "false", transactionSkipped: null })).toEqual([236, 200]);
    });

    it("dashes what is missing rather than inventing it", () => {
        expect(
            serializeSubscriptionDetail({ id: 1, corporateTxnId: "X", transactionDate: "2026-09-22", transactionVerdict: "true" })
        ).toMatchObject({
            subscriberUsername: null,
            partnerName: null,
            plan: null,
            billingType: null,
            orderValue: null,
            netRevenue: null,
        });
    });
});

describe("subscriptionExportColumns — what the downloaded file carries", () => {
    const cellsOf = row => subscriptionExportColumns().map(column => column.value(row));

    it("gives the table's columns in the table's order, without the invoice button", () => {
        expect(subscriptionExportColumns().map(column => column.header)).toEqual([
            "Date",
            "Order Ref",
            "Subscriber",
            "Subscriber Name",
            "Partner",
            "Plan",
            "Billing",
            "Order Value",
            "Net Revenue (excl. GST)",
            "Posted",
        ]);
    });

    it("fills a row with what the screen shows, amounts as numbers and the time in IST", async () => {
        const [row] = (await listSubscriptionDetails({ range: RANGE, searchText: "", limit: 10, offset: 0 })).rows;

        expect(cellsOf(serializeSubscriptionDetail(row))).toEqual([
            "24 Sep 2026, 11:44 AM",
            "1790230428010",
            "100000919",
            "JOHN DOE",
            "Gulf Reach",
            "Peko+",
            "Monthly",
            null,
            null,
            "Not posted — Recording paused",
        ]);
    });

    it("calls a subscriber with no referring partner Peko (Default), as the screen does", () => {
        expect(cellsOf({ partnerName: null })[4]).toBe("Peko (Default)");
    });

    it("spells out the billing cycle", () => {
        expect(cellsOf({ billingType: "ANNUALLY" })[6]).toBe("Annually");
        expect(cellsOf({ billingType: null })[6]).toBe("");
    });

    it("leaves a blank date rather than 'Invalid date'", () => {
        expect(cellsOf({ transactionDate: null })[0]).toBe("");
    });
});

describe("subscription details for the internal purchase accounts", () => {
    it("narrows to the accounts given only when asked, and to nothing when there are none", () => {
        expect(buildWhere({ range: null, searchText: "" })).not.toContain("credentialId IN");
        expect(buildWhere({ range: null, searchText: "", accountIds: [12, 15] })).toContain(
            "orders.credentialId IN (:accountScopeIds)"
        );
        expect(buildWhere({ range: null, searchText: "", accountIds: [] })).toContain("AND 1 = 0");
    });
});
