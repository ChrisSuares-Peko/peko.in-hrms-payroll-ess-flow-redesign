const sequelizeConfig = require("../../../configs/database/index");
const {
    THIRD_PARTY_SALE_KINDS,
    buildPaymentLinksQuery,
    buildPaymentLinksTotalsQuery,
    getThirdPartySalesTotals,
    listPaymentLinks,
    serializePaymentLink,
    paymentLinksExportColumns,
    paymentLinksExportSummary,
    PAYMENT_LINKS_EXPORT_NOTE,
    handlerFor,
} = require("../thirdPartySales");

const RANGE = { from: "2026-10-01 00:00:00", to: "2026-10-12 23:59:59" };

const ROW = {
    id: 301,
    linkId: "PYT_TXN0301",
    reference: "REF301",
    corporateName: "Acme Traders",
    corporateUsername: "acme",
    customerName: "Rahul",
    customerPhone: "9876543210",
    purpose: "Invoice 42",
    accessKey: "invoice",
    type: null,
    vendor: "nupay",
    amount: "1499.00",
    outcome: "paid",
    settlement: "settled",
    createdAt: "2026-10-03T04:00:00.000Z",
    eventDate: "2026-10-04T10:30:00.000Z",
    paidAt: "2026-10-04T10:30:00.000Z",
    settledDate: "2026-10-05T03:00:00.000Z",
    utr: "UTR123",
    settlementUtr: "SUTR123",
    expireDate: "2026-10-10T04:00:00.000Z",
    paymentLink: "https://pay.example/abc",
    clientUrl: "test",
};

const TOTALS = {
    totalCount: "4",
    collected: "2998.0000",
    pending: "500.0000",
    failed: "0",
    expired: "250.0000",
};

const STATUS = "UPPER(COALESCE(paymentLinks.status, ''))";
const PAID_SET =
    "IN ('SUCCESS', 'COMPLETED', 'PAID', 'SETTLED', 'SETTLEMENT_SUCCESS', 'SETTLEMENT_COMPLETED', 'SETTLEMENT_DONE', 'SETTLEMENT_PROCESSING')";
const OUTCOME_DATE = "COALESCE(paymentLinks.successOrFailDate, paymentLinks.updatedAt)";

const run = (overrides = {}) =>
    listPaymentLinks({
        range: null,
        status: undefined,
        searchText: "",
        sort: "DESC",
        sortField: "eventDate",
        limit: 10,
        offset: 0,
        ...overrides,
    });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockImplementation(sql =>
        Promise.resolve(sql.includes("COUNT(*)") ? [TOTALS] : [ROW])
    );
});

describe("which links the screen asks for", () => {
    const sql = buildPaymentLinksQuery({ sort: "DESC", sortField: "eventDate" });

    it("reads the status in upper case, so an old lowercase paid counts and settlement in progress is still paid", () => {
        expect(sql).toContain(`CASE WHEN ${STATUS} ${PAID_SET} THEN 'paid'`);
    });

    it("calls a failed link failed, an open link past its expiry expired, and anything else pending", () => {
        expect(sql).toContain(
            `WHEN ${STATUS} IN ('FAILED', 'FAILURE', 'ERROR', 'DECLINED', 'REJECTED', 'CANCELLED', 'CANCELED', 'EXPIRED') THEN 'failed'`
        );
        expect(sql).toContain(
            "WHEN paymentLinks.expireDate IS NOT NULL AND paymentLinks.expireDate < NOW() THEN 'expired' ELSE 'pending' END AS outcome"
        );
    });

    it("dates a paid or failed link by the day it was answered, and an open one by the day it was raised", () => {
        expect(sql).toContain(`THEN ${OUTCOME_DATE} ELSE paymentLinks.createdAt END AS eventDate`);
        expect(sql).toContain(`CASE WHEN ${STATUS} ${PAID_SET} THEN ${OUTCOME_DATE} END AS paidAt`);
    });

    it("floors, ranges and sorts on that same date", () => {
        expect(sql).toContain("WHERE DATE(CASE WHEN");
        expect(sql).toContain("ELSE paymentLinks.createdAt END) > :accountingFloor");
        expect(sql).toContain("ORDER BY eventDate DESC, paymentLinks.id DESC LIMIT :limit OFFSET :offset");

        const ranged = buildPaymentLinksQuery({ range: RANGE });
        expect(ranged).toContain("ELSE paymentLinks.createdAt END BETWEEN :from AND :to");
    });

    it("says whether the money has reached the corporate", () => {
        expect(sql).toContain(
            `CASE WHEN paymentLinks.settledDate IS NOT NULL OR ${STATUS} IN ('SETTLED', 'SETTLEMENT_SUCCESS', 'SETTLEMENT_COMPLETED', 'SETTLEMENT_DONE') THEN 'settled' WHEN ${STATUS} = 'SETTLEMENT_PROCESSING' THEN 'processing' END AS settlement`
        );
    });

    it("names the billed corporate from the request for a link an admin raised, and the customer from it for an older link", () => {
        expect(sql).toContain(
            "CASE WHEN paymentLinks.type = 'ADMIN' THEN JSON_UNQUOTE(JSON_EXTRACT(paymentLinks.sentPayload, '$.full_name')) ELSE CONVERT(credentials.name USING utf8mb4) END AS corporateName"
        );
        expect(sql).toContain("CASE WHEN paymentLinks.type = 'ADMIN' THEN NULL ELSE CONVERT(credentials.username USING utf8mb4) END AS corporateUsername");
        expect(sql).toContain(
            "ELSE COALESCE(NULLIF(CONVERT(paymentLinks.customerName USING utf8mb4), ''), JSON_UNQUOTE(JSON_EXTRACT(paymentLinks.sentPayload, '$.full_name'))) END AS customerName"
        );
    });

    it("keeps a link whose corporate account is gone, and falls back to the reference when the link has no id of its own", () => {
        expect(sql).toContain("FROM paymentLinks LEFT JOIN credentials ON credentials.id = paymentLinks.credentialId");
        expect(sql).toContain(
            "COALESCE(NULLIF(CONVERT(paymentLinks.transactionId USING utf8mb4), ''), CONVERT(paymentLinks.reference_id USING utf8mb4)) AS linkId"
        );
    });

    it("adds a filter only when one was asked for", () => {
        expect(sql).not.toContain("BETWEEN :from AND :to");
        expect(sql).not.toContain("= :status");
        expect(sql).not.toContain("LIKE :searchText");

        const filtered = buildPaymentLinksQuery({ status: "paid", searchText: "acme" });
        expect(filtered).toContain("ELSE 'pending' END = :status");
        [
            "paymentLinks.reference_id LIKE :searchText",
            "paymentLinks.customerName LIKE :searchText",
            "paymentLinks.customerPhone LIKE :searchText",
            "credentials.name LIKE :searchText",
            "credentials.username LIKE :searchText",
            "paymentLinks.purpose_message LIKE :searchText",
            "JSON_UNQUOTE(JSON_EXTRACT(paymentLinks.sentPayload, '$.full_name')) LIKE :searchText",
        ].forEach(fragment => expect(filtered).toContain(fragment));
        expect(filtered).toContain("USING utf8mb4)) LIKE :searchText OR paymentLinks.reference_id LIKE :searchText");
    });

    it("sorts only by a listed column", () => {
        expect(buildPaymentLinksQuery({ sortField: "amount", sort: "ASC" })).toContain(
            "ORDER BY paymentLinks.amount ASC, paymentLinks.id DESC"
        );
        expect(buildPaymentLinksQuery({ sortField: "status" })).toContain("ORDER BY outcome DESC");
        expect(buildPaymentLinksQuery({ sortField: "createdAt" })).toContain("ORDER BY paymentLinks.createdAt DESC");
        expect(buildPaymentLinksQuery({ sortField: "id; DROP TABLE paymentLinks" })).toContain(
            "ORDER BY eventDate DESC"
        );
    });

    it("adds up every outcome beside the row count, and never touches the order journals", () => {
        const totals = buildPaymentLinksTotalsQuery({ range: RANGE });

        expect(totals).toContain("SELECT COUNT(*) AS totalCount, ");
        expect(totals).toContain("ELSE 'pending' END = 'paid' THEN paymentLinks.amount ELSE 0 END), 0) AS collected");
        expect(totals).toContain("= 'pending' THEN paymentLinks.amount ELSE 0 END), 0) AS pending");
        expect(totals).toContain("= 'failed' THEN paymentLinks.amount ELSE 0 END), 0) AS failed");
        expect(totals).toContain("= 'expired' THEN paymentLinks.amount ELSE 0 END), 0) AS expired");
        expect(totals).not.toContain("LIMIT");
        [sql, totals].forEach(query => {
            expect(query).not.toContain("journalRecordStatus");
            expect(query).not.toContain("PRINCIPAL_MARKUP");
            expect(query).not.toContain("FROM orders");
        });
    });
});

describe("listing the links", () => {
    it("binds the floor, the window, the status and the search on both queries, and the page on the rows only", async () => {
        await run({ range: RANGE, status: "paid", searchText: "acme" });

        const [rows, totals] = sequelizeConfig.query.mock.calls;
        expect(rows[1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            from: RANGE.from,
            to: RANGE.to,
            status: "paid",
            searchText: "%acme%",
            limit: 10,
            offset: 0,
        });
        expect(totals[1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            from: RANGE.from,
            to: RANGE.to,
            status: "paid",
            searchText: "%acme%",
        });
    });

    it("binds only the floor when nothing was filtered", async () => {
        await run();

        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({
            accountingFloor: "9999-12-31",
            limit: 10,
            offset: 0,
        });
    });

    it("returns the rows with the count and the five totals, rounded to the paisa", async () => {
        const result = await run();

        expect(result.rows).toEqual([ROW]);
        expect(result.count).toBe(4);
        expect(result.totals).toEqual({ links: 4, collected: 2998, pending: 500, failed: 0, expired: 250 });
    });

    it("reads zero totals when the window holds nothing", async () => {
        sequelizeConfig.query.mockImplementation(sql => Promise.resolve(sql.includes("COUNT(*)") ? [] : []));

        const result = await run();

        expect(result.count).toBe(0);
        expect(result.totals).toEqual({ links: 0, collected: 0, pending: 0, failed: 0, expired: 0 });
    });
});

describe("the dashboard figure", () => {
    it("adds up the links paid in the window, by payment date, above the floor it was given", async () => {
        const result = await getThirdPartySalesTotals({ range: RANGE, accountingFloor: "2026-09-01" });

        expect(sequelizeConfig.query).toHaveBeenCalledTimes(1);
        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("COUNT(*) AS totalCount");
        expect(sql).toContain("BETWEEN :from AND :to");
        expect(sql).toContain("ELSE 'pending' END = :status");
        expect(options.replacements).toEqual({
            accountingFloor: "2026-09-01",
            from: RANGE.from,
            to: RANGE.to,
            status: "paid",
        });
        expect(result).toEqual({ count: 4, totalAmount: 2998 });
    });

    it("reads zero when nothing was paid", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        expect(await getThirdPartySalesTotals({ range: RANGE, accountingFloor: "2026-09-01" })).toEqual({
            count: 0,
            totalAmount: 0,
        });
    });
});

describe("serializePaymentLink", () => {
    it("reads an invoice link a corporate raised through NuPay", () => {
        expect(serializePaymentLink(ROW)).toEqual({
            id: 301,
            linkId: "PYT_TXN0301",
            reference: "REF301",
            corporateName: "Acme Traders",
            corporateUsername: "acme",
            customerName: "Rahul",
            customerPhone: "9876543210",
            purpose: "Invoice 42",
            kind: "invoice",
            raisedBy: "corporate",
            provider: "NuPay",
            amount: 1499,
            outcome: "paid",
            settlement: "settled",
            createdAt: "2026-10-03T04:00:00.000Z",
            eventDate: "2026-10-04T10:30:00.000Z",
            paidAt: "2026-10-04T10:30:00.000Z",
            settledAt: "2026-10-05T03:00:00.000Z",
            utr: "UTR123",
            settlementUtr: "SUTR123",
            expiresAt: "2026-10-10T04:00:00.000Z",
            linkUrl: "https://pay.example/abc",
        });
    });

    it("reads a legacy link an admin raised through Decentro, with the short link when that is all there is", () => {
        const entry = serializePaymentLink({
            ...ROW,
            type: "ADMIN",
            accessKey: "payment_link",
            vendor: null,
            paymentLink: null,
            clientUrl: "https://short.example/x",
            settlement: null,
            paidAt: null,
            settledDate: null,
            outcome: "pending",
        });

        expect(entry).toMatchObject({
            kind: "payment_link",
            raisedBy: "admin",
            provider: "Decentro",
            settlement: null,
            paidAt: null,
            settledAt: null,
            outcome: "pending",
            linkUrl: "https://short.example/x",
        });
    });

    it("shows nothing for a link with no address, no amount and no outcome yet", () => {
        const entry = serializePaymentLink({ id: 1, paymentLink: null, clientUrl: "test", amount: null });

        expect(entry.linkUrl).toBeNull();
        expect(entry.amount).toBeNull();
        expect(entry.outcome).toBe("pending");
        expect(entry.corporateName).toBeNull();
    });
});

describe("the export", () => {
    const headersOf = () => paymentLinksExportColumns().map(column => column.header);
    const cellsOf = row => paymentLinksExportColumns().map(column => column.value(row));

    it("keeps the table's columns in the table's order", () => {
        expect(headersOf()).toEqual([
            "Date",
            "Link ID",
            "Type",
            "Raised by",
            "Corporate",
            "Customer",
            "Purpose",
            "Provider",
            "Amount",
            "Status",
            "Paid on",
            "UTR",
            "Expires",
        ]);
        expect(paymentLinksExportColumns().filter(column => column.money).map(column => column.header)).toEqual([
            "Amount",
        ]);
    });

    it("writes every cell in words the accounts team uses, on Indian dates", () => {
        expect(cellsOf(serializePaymentLink(ROW))).toEqual([
            "04 Oct 2026",
            "PYT_TXN0301",
            "Invoice link",
            "Corporate",
            "Acme Traders",
            "Rahul",
            "Invoice 42",
            "NuPay",
            1499,
            "Paid",
            "04 Oct 2026",
            "UTR123",
            "10 Oct 2026",
        ]);
    });

    it("rolls a late-evening payment onto the next Indian day, and leaves blank what has not happened", () => {
        const cells = cellsOf(
            serializePaymentLink({
                ...ROW,
                eventDate: "2026-10-04T20:30:00.000Z",
                outcome: "pending",
                settlement: "processing",
                paidAt: null,
                settledDate: null,
                expireDate: null,
                utr: null,
            })
        );

        expect(cells[0]).toBe("05 Oct 2026");
        expect(cells[9]).toBe("Pending");
        expect(cells[10]).toBe("");
        expect(cells[11]).toBeNull();
        expect(cells[12]).toBe("");
    });

    it("puts the five totals above the table, counting the links rather than pricing them", () => {
        expect(paymentLinksExportSummary({ links: 4, collected: 2998, pending: 500, failed: 0, expired: 250 })).toEqual([
            { label: "Links", value: 4 },
            { label: "Collected", value: 2998, money: true },
            { label: "Pending", value: 500, money: true },
            { label: "Failed", value: 0, money: true },
            { label: "Expired", value: 250, money: true },
        ]);
        expect(PAYMENT_LINKS_EXPORT_NOTE).toMatch(/Collected adds up the links that were paid/);
    });
});

describe("the kinds of third-party sale", () => {
    it("offers payment links, and nothing else yet", () => {
        expect(THIRD_PARTY_SALE_KINDS).toEqual({ paymentLinks: "payment-links" });

        const handler = handlerFor("payment-links");
        expect(handler.title).toBe("Third-Party Sales (Payment Links)");
        expect(handler.list).toBe(listPaymentLinks);
        expect(handler.serialize).toBe(serializePaymentLink);
        expect(handler.exportColumns).toBe(paymentLinksExportColumns);
        expect(handler.exportSummary).toBe(paymentLinksExportSummary);
        expect(handler.exportNote).toBe(PAYMENT_LINKS_EXPORT_NOTE);
        expect(handlerFor("qr-codes")).toBeNull();
    });
});

describe("payment links for the internal purchase accounts", () => {
    it("narrows the listing to the accounts given, and to nothing when there are none", () => {
        expect(buildPaymentLinksQuery({ accountIds: [12, 15] })).toContain("paymentLinks.credentialId IN (:accountScopeIds)");
        expect(buildPaymentLinksQuery({ accountIds: [] })).toContain("AND 1 = 0");
        expect(buildPaymentLinksQuery({})).not.toContain("credentialId IN");
    });
});
