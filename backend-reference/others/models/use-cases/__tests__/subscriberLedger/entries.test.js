const sequelizeConfig = require("../../../../configs/database/index");
const {
    listSubscriberOrders,
    listSubscriberBills,
    findSubscriberOrderDocument,
    subscriberAmountsFromJournal,
    serializeTransaction,
    serializeBill,
    gatewayAmountOf,
} = require("../../subscriberLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/wallet", () => ({ findOne: jest.fn() }));

const RANGE = { from: "2026-09-01 00:00:00", to: "2026-09-19 23:59:59" };

const JOURNAL = {
    totalTransactionAmount: 1224,
    netTransactionAmount: 1174,
    paymentThroughWallet: 674,
    paymentThroughGateway: 500,
    platformFeeExcludingGST: 21.19,
    outputGSTonPlatformFee: 3.81,
    platformFeeIncludingGST: 25,
    couponTotalDiscount: 50,
};

const FEE_INVOICE = {
    invoiceNumber: "PI-2026-0102",
    issuedDate: "2026-09-05",
    placeOfSupply: "Kerala (32)",
    items: [{ description: "Platform Fee (Electricity)", quantity: 1, price: 21.19, taxableAmount: 21.19, vat: 3.81, lineTotal: 25 }],
    subtotal: 21.19,
    taxLines: [{ label: "IGST (18%)", amount: 3.81 }],
    total: 25,
};

const PLAN_INVOICE = {
    invoiceNumber: "PI-2026-0101",
    issuedDate: "2026-09-05",
    placeOfSupply: "Delhi (07)",
    items: [{ description: "Electricity Bill", quantity: 1, price: 1016.1, taxableAmount: 1016.1, vat: 182.9, lineTotal: 1199 }],
    subtotal: 1016.1,
    taxLines: [
        { label: "CGST (9%)", amount: 91.45 },
        { label: "SGST (9%)", amount: 91.45 },
    ],
    total: 1199,
};

const billRow = extra => ({
    id: 7,
    corporateTxnId: "1787561688848",
    transactionDate: "2026-09-05T10:00:00.000Z",
    service: "Electricity Bill",
    document: "pekoInvoice",
    documentRank: 2,
    documentData: JSON.stringify(FEE_INVOICE),
    ...extra,
});

const orderRow = extra => ({
    id: 7,
    corporateTxnId: "1787561688848",
    transactionDate: "2026-09-05T10:00:00.000Z",
    amountInINR: "1224.0000",
    status: "SUCCESS",
    paymentMode: "PAYMENT GATEWAY + WALLET",
    optional: null,
    journalData: JSON.stringify(JOURNAL),
    journalRecordStatus: JSON.stringify({ transaction: true }),
    service: "Electricity Bill",
    ...extra,
});

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockImplementation(sql =>
        Promise.resolve(sql.includes("COUNT(*) AS totalCount") ? [{ totalCount: "31" }] : [orderRow()])
    );
});

describe("subscriberAmountsFromJournal", () => {
    it("reads the subscriber side of the split", () => {
        expect(subscriberAmountsFromJournal(JOURNAL, "1224.0000")).toEqual({
            orderAmount: 1224,
            discount: 50,
            paidFromWallet: 674,
            paidViaGateway: 500,
        });
    });

    it("falls back to the order amount and leaves the split empty with no journal", () => {
        expect(subscriberAmountsFromJournal(null, "999.5000")).toEqual({
            orderAmount: 999.5,
            discount: null,
            paidFromWallet: null,
            paidViaGateway: null,
        });
    });

    it("keeps a subscription order honest about what it does not record", () => {
        expect(subscriberAmountsFromJournal({ paymentThroughGateway: 1180, netSubscriptionIncome: 1000 }, "1180")).toEqual({
            orderAmount: 1180,
            discount: null,
            paidFromWallet: null,
            paidViaGateway: 1180,
        });
    });
});

describe("serializers", () => {
    it("shapes a transaction row and parses the journal text", () => {
        expect(serializeTransaction(orderRow())).toEqual({
            id: 7,
            corporateTxnId: "1787561688848",
            transactionDate: "2026-09-05T10:00:00.000Z",
            service: "Electricity Bill",
            orderAmount: 1224,
            discount: 50,
            paidFromWallet: 674,
            paidViaGateway: 500,
            status: "SUCCESS",
            paymentMode: "PAYMENT GATEWAY + WALLET",
            receiptAvailable: false,
            posting: { state: "posted", note: null, detail: null },
        });
        expect(serializeTransaction(orderRow({ hasReceipt: 1 })).receiptAvailable).toBe(true);
        expect(serializeTransaction(orderRow({ hasReceipt: "0" })).receiptAvailable).toBe(false);
        expect(serializeTransaction(orderRow({ hasFullInvoice: 1 }))).not.toHaveProperty("fullInvoiceAvailable");
    });

    it("accepts a journal the driver already parsed and survives broken json", () => {
        expect(serializeTransaction(orderRow({ journalData: JOURNAL })).paidViaGateway).toBe(500);
        expect(serializeTransaction(orderRow({ journalData: "{not json" })).paidViaGateway).toBeNull();
        expect(serializeTransaction(orderRow({ service: null })).service).toBeNull();
    });

    it("flags a failed order whose sale reached the books but was never reversed", () => {
        expect(serializeTransaction(orderRow({ status: "FAILED" })).posting).toEqual({
            state: "notPosted",
            note: "Refund: Not recorded yet",
            detail: null,
        });
        expect(serializeTransaction(orderRow({ status: "FAILED", journalRecordStatus: null })).posting).toEqual({
            state: "notApplicable",
            note: null,
            detail: null,
        });
    });

    // The payment response on the order names what went through the gateway even when the
    // journal never ran, in the object shape most flows write and the array shape the
    // subscription flows write.
    it("dashes every split figure when the sale entry was skipped or never recorded, whatever the payment response says", () => {
        const response = '{"paymentGatewayName":"Cashfree","pgAmount":"500.00"}';
        const never = orderRow({ journalData: null, journalRecordStatus: null, paymentModeResponse: response });
        expect(serializeTransaction(never)).toMatchObject({ orderAmount: null, discount: null, paidFromWallet: null, paidViaGateway: null });

        const skipped = orderRow({
            journalData: JSON.stringify({ ...JOURNAL, transaction: { skipped: true, reason: "disabled" } }),
            journalRecordStatus: JSON.stringify({ transaction: false }),
            paymentModeResponse: response,
        });
        expect(serializeTransaction(skipped)).toMatchObject({ orderAmount: null, discount: null, paidFromWallet: null, paidViaGateway: null });
    });

    it("reads what went through the gateway off the payment response when a refused entry carries no gateway figure", () => {
        const refused = extra =>
            orderRow({
                journalData: JSON.stringify({ ...JOURNAL, paymentThroughGateway: null }),
                journalRecordStatus: JSON.stringify({ transaction: false }),
                ...extra,
            });

        expect(
            serializeTransaction(refused({ paymentModeResponse: '{"paymentGatewayName":"Cashfree","pgAmount":"500.00"}' })).paidViaGateway
        ).toBe(500);
        expect(serializeTransaction(refused({ paymentModeResponse: '[{"pgAmount":724}]' })).paidViaGateway).toBe(724);
        expect(serializeTransaction(refused({ paymentModeResponse: "oops" })).paidViaGateway).toBeNull();
        expect(serializeTransaction(refused({ paymentModeResponse: '{"pgAmount":0}' })).paidViaGateway).toBeNull();
        expect(serializeTransaction(refused({ paymentModeResponse: null })).paidViaGateway).toBeNull();
        expect(gatewayAmountOf('{"pgAmount":"12.345"}')).toBe(12.35);
    });

    it("shapes Peko's invoice as the platform fee invoice when the platform fee is all it carries", () => {
        expect(serializeBill(billRow())).toEqual({
            id: "7:pekoInvoice",
            orderId: 7,
            corporateTxnId: "1787561688848",
            transactionDate: "2026-09-05T10:00:00.000Z",
            service: "Electricity Bill",
            document: "pekoInvoice",
            kind: "platformFeeInvoice",
            label: "Platform Fee Invoice",
            documentNumber: "PI-2026-0102",
            issuedDate: "2026-09-05",
            taxable: 21.19,
            gst: 3.81,
            total: 25,
        });
    });

    it("calls Peko's invoice an invoice when it carries the plan itself, and the full amount invoice always", () => {
        const plan = serializeBill(
            billRow({
                documentData: {
                    ...FEE_INVOICE,
                    items: [
                        { description: "Growth plan", quantity: 1, price: 1000, taxableAmount: 1000, vat: 180, lineTotal: 1180 },
                        ...FEE_INVOICE.items,
                    ],
                },
            })
        );
        expect(plan).toMatchObject({ kind: "invoice", label: "Invoice", documentNumber: "PI-2026-0102" });

        const full = serializeBill(billRow({ document: "fullInvoice", documentRank: 1, documentData: PLAN_INVOICE }));
        expect(full).toMatchObject({
            id: "7:fullInvoice",
            document: "fullInvoice",
            kind: "invoice",
            label: "Invoice",
            documentNumber: "PI-2026-0101",
            taxable: 1016.1,
            gst: 182.9,
            total: 1199,
        });
    });

    it("dashes the figures of a stored invoice that carries none, and survives broken json", () => {
        expect(serializeBill(billRow({ documentData: JSON.stringify({ invoiceNumber: "PI-9" }) }))).toMatchObject({
            kind: "invoice",
            documentNumber: "PI-9",
            taxable: null,
            gst: null,
            total: null,
        });
        expect(serializeBill(billRow({ documentData: "{broken" }))).toMatchObject({
            kind: "invoice",
            documentNumber: null,
            issuedDate: null,
            taxable: null,
        });
    });
});

describe("order lists", () => {
    it("pages every order of the credential newest first and counts them", async () => {
        const result = await listSubscriberOrders({ credentialId: 99, range: RANGE, searchText: "", limit: 10, offset: 10 });

        const [dataSql, dataOptions] = sequelizeConfig.query.mock.calls[0];
        const [countSql, countOptions] = sequelizeConfig.query.mock.calls[1];
        expect(dataSql).toContain("orders.credentialId = :credentialId");
        expect(dataSql).toContain("LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId");
        expect(dataSql).toContain(
            "COALESCE(CONVERT(serviceOperators.serviceProvider USING utf8mb4), CASE WHEN JSON_VALID(orders.orderResponse)"
        );
        expect(dataSql).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(dataSql).toContain("ORDER BY orders.transactionDate DESC, orders.id DESC LIMIT :limit OFFSET :offset");
        expect(dataSql).not.toContain("orders.status =");
        expect(dataSql).toContain("DATE(orders.transactionDate) > :accountingFloor");
        expect(dataOptions.replacements).toEqual({
            credentialId: 99,
            ...RANGE,
            accountingFloor: "9999-12-31",
            limit: 10,
            offset: 10,
        });
        expect(countSql).toContain("COUNT(*) AS totalCount");
        expect(countOptions.replacements).toEqual({
            credentialId: 99,
            ...RANGE,
            accountingFloor: "9999-12-31",
        });
        expect(result).toEqual({ rows: [orderRow()], count: 31 });
    });

    it("searches reference, status and service", async () => {
        await listSubscriberOrders({ credentialId: 99, range: null, searchText: "elec", limit: 10, offset: 0 });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("orders.corporateTxnId LIKE :searchText OR orders.status LIKE :searchText OR ");
        expect(sql).not.toContain("BETWEEN");
        expect(options.replacements.searchText).toBe("%elec%");
    });

    // A Peko plan or add-on payment has no service operator, so the Service column names it
    // from the order's own response. The search has to read the same name to find it.
    it.each([
        ["transactions", listSubscriberOrders],
        ["bills", listSubscriberBills],
    ])("searches the service name the %s table shows, including one stored on the order itself", async (_name, list) => {
        await list({ credentialId: 99, range: null, searchText: "peko go", limit: 10, offset: 0 });

        const [dataSql] = sequelizeConfig.query.mock.calls[0];
        const [countSql] = sequelizeConfig.query.mock.calls[1];
        const shown =
            "COALESCE(CONVERT(serviceOperators.serviceProvider USING utf8mb4), CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.serviceName')) END)";
        expect(dataSql).toContain(`OR ${shown} LIKE :searchText`);
        expect(countSql).toContain(`OR ${shown} LIKE :searchText`);
        expect(dataSql).not.toContain("OR serviceOperators.serviceProvider LIKE");
    });

    // The Status pill on this table reads the order's own status, so the filter does too.
    it.each([
        ["success", "orders.status IN ('SUCCESS', 'ORDERED')"],
        ["refunded", "orders.status IN ('REFUND', 'REFUNDED')"],
        ["failed", "orders.status IN ('FAILED', 'FAILURE')"],
    ])("narrows to the orders the Status pill calls %s, in the list and the count", async (status, clause) => {
        await listSubscriberOrders({ credentialId: 99, range: null, searchText: "", status, limit: 10, offset: 0 });

        const [dataSql] = sequelizeConfig.query.mock.calls[0];
        const [countSql, countOptions] = sequelizeConfig.query.mock.calls[1];
        expect(dataSql).toContain(`AND ${clause} ORDER BY`);
        expect(countSql).toContain(clause);
        expect(countOptions.replacements).not.toHaveProperty("status");
    });

    it("keeps the status, the search and the date range together", async () => {
        await listSubscriberOrders({ credentialId: 99, range: RANGE, searchText: "elec", status: "failed", limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("orders.status IN ('FAILED', 'FAILURE')");
        expect(sql).toContain("orders.corporateTxnId LIKE :searchText");
        expect(sql).toContain("orders.transactionDate BETWEEN :from AND :to");
    });

    it.each([[undefined], [""], ["earned"], ["reversed"], ["orders.status = 1"]])(
        "lists every order for the status %p, which the Status pill does not have",
        async status => {
            await listSubscriberOrders({ credentialId: 99, range: null, searchText: "", status, limit: 10, offset: 0 });

            expect(sequelizeConfig.query.mock.calls[0][0]).not.toContain("orders.status IN");
        }
    );

    it("has no status filter on the bills list, whose table shows no status", async () => {
        await listSubscriberBills({ credentialId: 99, range: null, searchText: "", status: "failed", limit: 10, offset: 0 });

        expect(sequelizeConfig.query.mock.calls[0][0]).not.toContain("orders.status IN");
    });

    it("lists one row per stored invoice, the full amount invoice before Peko's own, newest order first", async () => {
        const result = await listSubscriberBills({ credentialId: 99, range: null, searchText: "", limit: 10, offset: 0 });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        const [countSql] = sequelizeConfig.query.mock.calls[1];
        expect(sql).toContain(
            "'fullInvoice' AS document, 1 AS documentRank, JSON_EXTRACT(orders.pekoInvoiceDetails, '$.corporate.planInvoiceData') AS documentData FROM orders"
        );
        expect(sql).toContain(
            "'pekoInvoice' AS document, 2 AS documentRank, JSON_EXTRACT(orders.pekoInvoiceDetails, '$.corporate.invoiceData') AS documentData FROM orders"
        );
        expect(sql).not.toContain("receiptData");
        expect(sql).toContain(" UNION ALL SELECT orders.id, orders.corporateTxnId, orders.transactionDate, ");
        expect(sql).toContain("'$.corporate.planInvoiceData')) > 0 THEN 1 ELSE 0 END) ELSE 0 END) = 1");
        expect(sql).toContain("'$.corporate.invoiceData')) > 0 THEN 1 ELSE 0 END) ELSE 0 END) = 1");
        expect(sql).toContain("ORDER BY transactionDate DESC, id DESC, documentRank ASC LIMIT :limit OFFSET :offset");
        expect(sql).not.toContain("orders.journalData");
        expect(options.replacements).not.toHaveProperty("searchText");
        expect(countSql).toContain("SELECT COUNT(*) AS totalCount FROM (SELECT orders.id FROM orders LEFT JOIN serviceOperators");
        expect(countSql).toContain(" UNION ALL SELECT orders.id FROM orders");
        expect(result.count).toBe(31);
    });

    it("searches a bill by its reference, its service or the number on the invoice, within the dates", async () => {
        await listSubscriberBills({ credentialId: 99, range: RANGE, searchText: "PI-2026", limit: 10, offset: 0 });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain(
            "OR JSON_UNQUOTE(JSON_EXTRACT(JSON_EXTRACT(orders.pekoInvoiceDetails, '$.corporate.invoiceData'), '$.invoiceNumber')) LIKE :searchText)"
        );
        expect(sql).toContain(
            "OR JSON_UNQUOTE(JSON_EXTRACT(JSON_EXTRACT(orders.pekoInvoiceDetails, '$.corporate.planInvoiceData'), '$.invoiceNumber')) LIKE :searchText)"
        );
        expect(sql).not.toContain("receiptNo");
        expect(sql).toContain("orders.transactionDate BETWEEN :from AND :to");
        expect(options.replacements.searchText).toBe("%PI-2026%");
    });

    it("reads only whether a receipt was issued off the transactions list, never the invoices", async () => {
        await listSubscriberOrders({ credentialId: 99, range: null, searchText: "", limit: 10, offset: 0 });
        const [transactionSql] = sequelizeConfig.query.mock.calls[0];
        const [transactionCountSql] = sequelizeConfig.query.mock.calls[1];

        expect(transactionSql).toContain(
            "'$.corporate.receiptData')) > 0 THEN 1 ELSE 0 END) ELSE 0 END) AS hasReceipt FROM orders"
        );
        expect(transactionSql).not.toContain("invoiceData");
        expect(transactionCountSql).not.toContain("pekoInvoiceDetails");
    });

    it("keeps peko plan and add-on payments on the transactions list, named by the order's own service", async () => {
        await listSubscriberOrders({ credentialId: 99, range: null, searchText: "", limit: 10, offset: 0 });

        const [sql] = sequelizeConfig.query.mock.calls[0];
        expect(sql.slice(sql.indexOf(" WHERE "))).not.toContain("orders.optional");
        expect(sql).toContain("JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.serviceName'))");
    });
});

describe("findSubscriberOrderDocument", () => {
    const stored = pekoInvoiceDetails => [{ id: 7, corporateTxnId: "1787561688848", pekoInvoiceDetails }];

    it("reads the invoice stored on the subscriber's own order, and the receipt for the transactions tab", async () => {
        sequelizeConfig.query.mockResolvedValue(
            stored({ corporate: { planInvoiceData: { invoiceNumber: "VI-9" }, receiptData: { receiptNo: "PR-1" } } })
        );

        const document = await findSubscriberOrderDocument({ credentialId: 99, orderId: "7", kind: "fullInvoice" });

        const [sql, options] = sequelizeConfig.query.mock.calls[0];
        expect(sql).toContain("WHERE orders.id = :orderId AND orders.credentialId = :credentialId LIMIT 1");
        expect(options.replacements).toEqual({ orderId: 7, credentialId: 99 });
        expect(document).toEqual({
            corporateTxnId: "1787561688848",
            data: { invoiceNumber: "VI-9" },
            type: "Invoice",
            label: "Invoice",
        });

        expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: "7", kind: "receipt" })).toEqual({
            corporateTxnId: "1787561688848",
            data: { receiptNo: "PR-1" },
            type: "Receipt",
            label: "Receipt",
        });
    });

    it("reads Peko's own invoice from a stored text payload and names the file by what it carries", async () => {
        sequelizeConfig.query.mockResolvedValue(
            stored(JSON.stringify({ corporate: { invoiceData: FEE_INVOICE, receiptData: {} } }))
        );
        const fee = await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "pekoInvoice" });
        expect(fee).toMatchObject({ data: FEE_INVOICE, type: "Invoice", label: "Platform-Fee-Invoice" });

        sequelizeConfig.query.mockResolvedValue(
            stored({ corporate: { invoiceData: { ...FEE_INVOICE, items: [{ description: "Growth plan", price: 1000 }] } } })
        );
        const plan = await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "pekoInvoice" });
        expect(plan).toMatchObject({ type: "Invoice", label: "Invoice" });
    });

    it("reads the full amount invoice issued on behalf of the vendor", async () => {
        sequelizeConfig.query.mockResolvedValue(
            stored({ corporate: { invoiceData: { invoiceNo: "PI-1" }, planInvoiceData: { invoiceNo: "VI-9" } } })
        );

        const document = await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "fullInvoice" });

        expect(document).toMatchObject({
            data: { invoiceNo: "VI-9" },
            type: "Invoice",
            label: "Invoice",
        });
    });

    it("returns nothing for a document that was never issued, or an order that is not the subscriber's", async () => {
        for (const details of [{ corporate: { planInvoiceData: {} } }, { corporate: {} }, {}, null, "{broken", { corporate: { planInvoiceData: [] } }]) {
            sequelizeConfig.query.mockResolvedValue(stored(details));
            expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "fullInvoice" })).toBeNull();
        }

        sequelizeConfig.query.mockResolvedValue([]);
        expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "fullInvoice" })).toBeNull();
    });

    it("never queries for an unknown document or an order id that is not a positive whole number", async () => {
        sequelizeConfig.query.mockClear();

        expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "statement" })).toBeNull();
        expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: 7, kind: "commissionInvoice" })).toBeNull();
        expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: "7 OR 1=1", kind: "fullInvoice" })).toBeNull();
        expect(await findSubscriberOrderDocument({ credentialId: 99, orderId: "0", kind: "fullInvoice" })).toBeNull();
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

