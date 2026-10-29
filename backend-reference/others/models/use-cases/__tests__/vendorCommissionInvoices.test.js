const { Op } = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const order = require("../../entities/order");
const vendor = require("../../entities/vendor");
const vendorLedgerEntries = require("../../entities/vendorLedgerEntry");
const configAuditLog = require("../../entities/configAuditLog");

jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../utils/puppeteerPool", () => ({ renderPdf: jest.fn() }));
jest.mock("../../../utils/emailer", () => ({ emailWithMultipleAttachment: jest.fn() }));
jest.mock("../../../utils/invoiceTemplate", () => ({
    taxInvoiceTemplate: jest.fn(
        data => `invoice ${data.invoiceNumber} to ${data.billedTo.companyName} at ${data.billedTo.address}`
    ),
    PEKO_COMPANY_DETAILS: { gstin: "07AAOCP9213H1Z4" },
}));
jest.mock("../ledgerGst", () => ({
    DEFAULT_GST_RATE: 18,
    loadGstRate: jest.fn(async () => 18),
    splitEntryAmount: jest.fn(),
    gstFieldsOf: jest.fn(() => ({})),
    gstPartsOf: jest.fn(entry => ({
        amount: Number(entry.amount),
        taxableAmount: Number(entry.taxableAmount),
        gstAmount: Number(entry.gstAmount),
        gstRate: 18,
    })),
}));
jest.mock("../../../utils/requestContext", () => ({
    currentContext: () => ({ source: "ACCOUNTING_PORTAL", actorId: 7, ipAddress: "10.0.0.1" }),
    ACCOUNTING_PORTAL: "ACCOUNTING_PORTAL",
}));

const { renderPdf } = require("../../../utils/puppeteerPool");
const emailer = require("../../../utils/emailer");
const {
    searchCommissionInvoices,
    loadCommissionInvoice,
    previewCommissionInvoice,
    saveBilledTo,
    sendInvoice,
} = require("../vendorCommissionInvoices");

const ACTOR = { id: 7, name: "Ibrahim" };
const LEDGER_ACCOUNTS = ["acc-1"];

const CONTACT = {
    id: 1,
    vendorName: "Cleartrip",
    vendorEmail: ["ap@cleartrip.test", "finance@cleartrip.test"],
    gstNo: "32BBBBB0000B1Z5",
    state: "Kerala",
    address: "Kochi",
};

const INVOICE = {
    billedTo: {
        companyName: "Cleartrip Private Limited",
        address: "Old address",
        cityCountry: "Kerala",
        gstin: "32BBBBB0000B1Z5",
    },
    invoiceNumber: "INV-9",
    issuedDate: "2026-10-01",
    placeOfSupply: "Kerala (32)",
    items: [{ description: "Commission (Flights)", quantity: 1, price: 100, taxableAmount: 100, vat: 18, lineTotal: 118 }],
    subtotal: 100,
    taxLines: [{ label: "IGST (18%)", amount: 18 }],
    total: 118,
};

const BILLED_TO_VIEW = {
    companyName: "Cleartrip Private Limited",
    address: "Old address",
    state: "Kerala",
    gstin: "32BBBBB0000B1Z5",
};

const orderRow = (extra = {}) => ({
    id: 55,
    corporateTxnId: "TXN-1",
    transactionDate: "2026-10-01",
    pekoInvoiceDetails: { vendor: { invoiceData: INVOICE } },
    journalData: {
        vendorPayable: 900,
        commissionIncludingGST: 118,
        transaction: { lineItems: [{ accountId: "acc-1", direction: "credit", amount: 900 }] },
    },
    serviceOperator: { id: 3, vendorId: 1, commissionMode: "MARGIN" },
    ...extra,
});

const entryRow = (extra = {}) => ({
    id: 12,
    vendorId: 1,
    kind: "COMMISSION",
    entryNumber: "COM-000014",
    reference: "CM-14",
    amount: 236,
    taxableAmount: 200,
    gstAmount: 36,
    issueDate: "2026-10-10",
    reason: "Quarterly true-up",
    entryType: "ENTRY",
    status: "OPEN",
    documentEdits: null,
    ...extra,
});

const target = (source, id) => ({ vendorId: 1, source, id, ledgerAccountIds: LEDGER_ACCOUNTS });

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction = jest.fn(async callback => callback("TXN"));
    vendor.findOne.mockResolvedValue(CONTACT);
    order.findOne.mockResolvedValue(orderRow());
    order.update.mockResolvedValue([1]);
    vendorLedgerEntries.findOne.mockResolvedValue(entryRow());
    vendorLedgerEntries.update.mockResolvedValue([1]);
    configAuditLog.create.mockResolvedValue({});
    renderPdf.mockResolvedValue(Buffer.from("%PDF-1.4\n%test"));
    emailer.emailWithMultipleAttachment.mockImplementation((to, subject, body, files, done) => done(null, { ok: true }));
});

describe("finding a commission invoice", () => {
    it("matches a transaction id to the invoice raised on the order, and a reference to every hand-recorded commission under it", async () => {
        order.findAll.mockResolvedValue([
            { ...orderRow(), serviceOperator: { id: 3, vendorId: 1, vendor: { id: 1, vendorName: "Cleartrip" } } },
        ]);
        vendorLedgerEntries.findAll.mockResolvedValue([
            { ...entryRow(), vendor: { id: 1, vendorName: "Cleartrip" } },
            { ...entryRow({ id: 13, vendorId: 2 }), vendor: { id: 2, vendorName: "Amer Hub" } },
        ]);

        const matches = await searchCommissionInvoices(" TXN-1 ");

        expect(matches).toEqual([
            { source: "order", id: "TXN-1", vendorId: 1, vendorName: "Cleartrip", invoiceNumber: "INV-9", issuedDate: "2026-10-01", total: 118 },
            { source: "manual", id: "12", vendorId: 1, vendorName: "Cleartrip", invoiceNumber: "COM-000014", issuedDate: "2026-10-10", total: 236 },
            { source: "manual", id: "13", vendorId: 2, vendorName: "Amer Hub", invoiceNumber: "COM-000014", issuedDate: "2026-10-10", total: 236 },
        ]);
        expect(order.findAll.mock.calls[0][0].where).toEqual({ corporateTxnId: "TXN-1" });
        expect(vendorLedgerEntries.findAll.mock.calls[0][0].where).toEqual({
            kind: "COMMISSION",
            entryType: "ENTRY",
            [Op.or]: [{ entryNumber: "TXN-1" }, { reference: "TXN-1" }],
        });
    });

    it("leaves out an order whose gateway never raised a vendor invoice, and returns nothing for a blank search", async () => {
        order.findAll.mockResolvedValue([{ ...orderRow({ pekoInvoiceDetails: { vendor: { invoiceData: {} } } }), serviceOperator: { vendorId: 1, vendor: { vendorName: "Cleartrip" } } }]);
        vendorLedgerEntries.findAll.mockResolvedValue([]);

        expect(await searchCommissionInvoices("TXN-1")).toEqual([]);
        expect(await searchCommissionInvoices("   ")).toEqual([]);
        expect(order.findAll).toHaveBeenCalledTimes(1);
    });
});

describe("reading a commission invoice", () => {
    it("shows an order's invoice as generated, with the vendor's emails to send it to", async () => {
        const invoice = await loadCommissionInvoice(target("order", "TXN-1"));

        expect(invoice).toMatchObject({
            source: "order",
            id: "TXN-1",
            vendor: { id: 1, name: "Cleartrip", emails: ["ap@cleartrip.test", "finance@cleartrip.test"] },
            invoiceNumber: "INV-9",
            issuedDate: "2026-10-01",
            total: 118,
            documentTitle: "Tax Invoice",
            originalBilledTo: BILLED_TO_VIEW,
            billedTo: BILLED_TO_VIEW,
            placeOfSupply: "Kerala (32)",
            taxCase: "IGST",
            taxLines: [{ label: "IGST (18%)", amount: 18 }],
            edited: null,
            sends: [],
        });
        expect(invoice.states.find(state => state.code === "32")).toEqual({ code: "32", name: "Kerala" });
        expect(invoice.html).toBe("invoice INV-9 to Cleartrip Private Limited at Old address");
    });

    it("lays the saved billed-to over the generated one, keeps the original beside it, and lists the sends", async () => {
        order.findOne.mockResolvedValue(
            orderRow({
                pekoInvoiceDetails: {
                    vendor: {
                        invoiceData: INVOICE,
                        edits: {
                            billedTo: { companyName: "Cleartrip Private Limited", address: "New address", state: "Kerala", gstin: "32BBBBB0000B1Z5" },
                            editedAt: "2026-10-20T10:00:00.000Z",
                            editedByName: "Asha",
                            sends: [{ to: ["ap@cleartrip.test"], at: "2026-10-21T09:00:00.000Z", byName: "Asha" }],
                        },
                    },
                },
            })
        );

        const invoice = await loadCommissionInvoice(target("order", "TXN-1"));

        expect(invoice.billedTo.address).toBe("New address");
        expect(invoice.originalBilledTo.address).toBe("Old address");
        expect(invoice.edited).toEqual({ at: "2026-10-20T10:00:00.000Z", byName: "Asha" });
        expect(invoice.sends).toEqual([{ to: ["ap@cleartrip.test"], at: "2026-10-21T09:00:00.000Z", byName: "Asha" }]);
        expect(invoice.html).toContain("at New address");
    });

    it("builds a hand-recorded commission's invoice from the vendor's details, with its own saved billed-to on top", async () => {
        vendorLedgerEntries.findOne.mockResolvedValue(
            entryRow({ documentEdits: { billedTo: { companyName: "Cleartrip Ltd" }, editedAt: "2026-10-22T08:00:00.000Z", editedByName: "Asha" } })
        );

        const invoice = await loadCommissionInvoice(target("manual", "12"));

        expect(invoice).toMatchObject({
            source: "manual",
            id: "12",
            invoiceNumber: "COM-000014",
            total: 236,
            originalBilledTo: { companyName: "Cleartrip", address: "Kochi", state: "Kerala", gstin: "32BBBBB0000B1Z5" },
            billedTo: { companyName: "Cleartrip Ltd", address: "Kochi", state: "Kerala", gstin: "32BBBBB0000B1Z5" },
            placeOfSupply: "Kerala (32)",
            taxCase: "IGST",
            edited: { at: "2026-10-22T08:00:00.000Z", byName: "Asha" },
        });
        expect(vendorLedgerEntries.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "12", vendorId: 1, kind: "COMMISSION" } }));
    });

    it("answers nothing for an order without a stored invoice, or a vendor that does not exist", async () => {
        order.findOne.mockResolvedValue(orderRow({ pekoInvoiceDetails: null }));
        expect(await loadCommissionInvoice(target("order", "TXN-1"))).toBeNull();

        vendor.findOne.mockResolvedValue(null);
        expect(await loadCommissionInvoice(target("manual", "12"))).toBeNull();
    });

    it("previews a billed-to that is not saved yet, with the tax split it leads to, and the saved one when none is given", async () => {
        const draft = await previewCommissionInvoice({ ...target("order", "TXN-1"), billedTo: { address: "Draft address" } });
        expect(draft).toEqual({
            html: "invoice INV-9 to Cleartrip Private Limited at Draft address",
            placeOfSupply: "Kerala (32)",
            taxCase: "IGST",
            taxLines: [{ label: "IGST (18%)", amount: 18 }],
        });

        const moved = await previewCommissionInvoice({
            ...target("order", "TXN-1"),
            billedTo: { state: "Delhi", gstin: "07AAAAA0000A1Z5" },
        });
        expect(moved).toMatchObject({
            placeOfSupply: "Delhi (07)",
            taxCase: "CGST+SGST",
            taxLines: [
                { label: "CGST (9%)", amount: 9 },
                { label: "SGST (9%)", amount: 9 },
            ],
        });

        expect((await previewCommissionInvoice(target("order", "TXN-1"))).html).toBe(
            "invoice INV-9 to Cleartrip Private Limited at Old address"
        );
        expect(order.update).not.toHaveBeenCalled();
    });
});

describe("changing who the invoice is billed to", () => {
    const billedTo = { companyName: "Cleartrip Private Limited", address: "New address", state: "Kerala", gstin: "32BBBBB0000B1Z5" };

    it("stores the edit on the order's own invoice object and keeps the change in the audit trail", async () => {
        const result = await saveBilledTo({ ...target("order", "TXN-1"), billedTo, actor: ACTOR });

        expect(result.outcome).toBe("UPDATED");
        const [values, options] = order.update.mock.calls[0];
        expect(options).toEqual({ where: { id: 55 }, transaction: "TXN" });
        expect(values.pekoInvoiceDetails.vendor.invoiceData).toEqual(INVOICE);
        expect(values.pekoInvoiceDetails.vendor.edits).toMatchObject({ billedTo, editedById: 7, editedByName: "Ibrahim" });
        expect(values.pekoInvoiceDetails.vendor.edits.editedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(configAuditLog.create).toHaveBeenCalledWith(
            {
                actorId: 7,
                source: "ACCOUNTING_PORTAL",
                configType: "VENDOR_INVOICE",
                action: "UPDATE",
                targetTable: "orders",
                targetId: 55,
                targetLabel: "Cleartrip › Invoice INV-9",
                partnerName: null,
                ipAddress: "10.0.0.1",
                changes: [{ field: "address", from: "Old address", to: "New address" }],
            },
            { transaction: "TXN" }
        );
    });

    it("stores a hand-recorded commission's edit on the entry itself", async () => {
        const result = await saveBilledTo({ ...target("manual", "12"), billedTo: { ...billedTo, companyName: "Cleartrip Ltd", address: "Kochi" }, actor: ACTOR });

        expect(result.outcome).toBe("UPDATED");
        expect(vendorLedgerEntries.update).toHaveBeenCalledWith(
            { documentEdits: expect.objectContaining({ billedTo: { ...billedTo, companyName: "Cleartrip Ltd", address: "Kochi" }, editedByName: "Ibrahim" }) },
            { where: { id: 12 }, transaction: "TXN" }
        );
        expect(configAuditLog.create.mock.calls[0][0]).toMatchObject({
            targetTable: "vendorLedgerEntries",
            targetId: 12,
            targetLabel: "Cleartrip › Invoice COM-000014",
            changes: [{ field: "companyName", from: "Cleartrip", to: "Cleartrip Ltd" }],
        });
    });

    it("records the place of supply and the tax split moving with the state and GSTIN", async () => {
        const moved = { ...billedTo, address: "Old address", state: "Delhi", gstin: "07AAAAA0000A1Z5" };

        const result = await saveBilledTo({ ...target("order", "TXN-1"), billedTo: moved, actor: ACTOR });

        expect(result.outcome).toBe("UPDATED");
        expect(configAuditLog.create.mock.calls[0][0].changes).toEqual([
            { field: "state", from: "Kerala", to: "Delhi" },
            { field: "gstin", from: "32BBBBB0000B1Z5", to: "07AAAAA0000A1Z5" },
            { field: "placeOfSupply", from: "Kerala (32)", to: "Delhi (07)" },
            { field: "taxCase", from: "IGST", to: "CGST+SGST" },
        ]);
        const [values] = order.update.mock.calls[0];
        expect(values.pekoInvoiceDetails.vendor.edits.billedTo).toEqual(moved);
    });

    it("writes nothing when the billed-to is unchanged, and refuses an invoice that is not there", async () => {
        const unchanged = await saveBilledTo({ ...target("order", "TXN-1"), billedTo: BILLED_TO_VIEW, actor: ACTOR });
        expect(unchanged.outcome).toBe("UNCHANGED");
        expect(order.update).not.toHaveBeenCalled();
        expect(configAuditLog.create).not.toHaveBeenCalled();

        order.findOne.mockResolvedValue(null);
        expect((await saveBilledTo({ ...target("order", "TXN-1"), billedTo, actor: ACTOR })).outcome).toBe("MISSING");
    });
});

describe("sending the invoice", () => {
    it("emails the rendered invoice to the addresses given, records the send on the invoice and in the audit trail", async () => {
        const result = await sendInvoice({ ...target("order", "TXN-1"), to: ["AP@cleartrip.test ", "ap@cleartrip.test", "cfo@cleartrip.test"], actor: ACTOR });

        expect(result.outcome).toBe("SENT");
        expect(result.recipients).toEqual(["ap@cleartrip.test", "cfo@cleartrip.test"]);
        expect(renderPdf).toHaveBeenCalledWith("invoice INV-9 to Cleartrip Private Limited at Old address");
        const [to, subject, body, files] = emailer.emailWithMultipleAttachment.mock.calls[0];
        expect(to).toEqual(["ap@cleartrip.test", "cfo@cleartrip.test"]);
        expect(subject).toBe("Tax Invoice on Commission - Peko");
        expect(body).toContain("INV-9");
        expect(body).toContain("Cleartrip");
        expect(files).toHaveLength(1);
        expect(files[0].filename).toMatch(/\.pdf$/);
        expect(Buffer.isBuffer(files[0].content)).toBe(true);

        const [values] = order.update.mock.calls[0];
        expect(values.pekoInvoiceDetails.vendor.edits.sends[0]).toMatchObject({ to: ["ap@cleartrip.test", "cfo@cleartrip.test"], byId: 7, byName: "Ibrahim" });
        expect(configAuditLog.create.mock.calls[0][0]).toMatchObject({
            configType: "VENDOR_INVOICE",
            targetTable: "orders",
            changes: [{ field: "sentTo", from: null, to: "ap@cleartrip.test, cfo@cleartrip.test" }],
        });
    });

    it("sends the invoice with the saved billed-to, not the generated one", async () => {
        order.findOne.mockResolvedValue(
            orderRow({ pekoInvoiceDetails: { vendor: { invoiceData: INVOICE, edits: { billedTo: { address: "New address" } } } } })
        );

        await sendInvoice({ ...target("order", "TXN-1"), to: ["ap@cleartrip.test"], actor: ACTOR });

        expect(renderPdf).toHaveBeenCalledWith("invoice INV-9 to Cleartrip Private Limited at New address");
        const [values] = order.update.mock.calls[0];
        expect(values.pekoInvoiceDetails.vendor.edits.billedTo).toEqual({ address: "New address" });
        expect(values.pekoInvoiceDetails.vendor.edits.sends).toHaveLength(1);
    });

    it("records nothing when the email cannot be sent, or the invoice cannot be rendered", async () => {
        emailer.emailWithMultipleAttachment.mockImplementation((to, subject, body, files, done) => done(new Error("SMTP down")));
        const failed = await sendInvoice({ ...target("order", "TXN-1"), to: ["ap@cleartrip.test"], actor: ACTOR });
        expect(failed).toEqual({ outcome: "SEND_FAILED", reason: "SMTP down" });
        expect(order.update).not.toHaveBeenCalled();
        expect(configAuditLog.create).not.toHaveBeenCalled();

        renderPdf.mockResolvedValue(Buffer.from("not a pdf"));
        expect((await sendInvoice({ ...target("order", "TXN-1"), to: ["ap@cleartrip.test"], actor: ACTOR })).outcome).toBe("RENDER_FAILED");
    });

    it("sends a hand-recorded commission's invoice and records the send on the entry", async () => {
        const result = await sendInvoice({ ...target("manual", "12"), to: ["ap@cleartrip.test"], actor: ACTOR });

        expect(result.outcome).toBe("SENT");
        expect(vendorLedgerEntries.update).toHaveBeenCalledWith(
            { documentEdits: { sends: [expect.objectContaining({ to: ["ap@cleartrip.test"], byName: "Ibrahim" })] } },
            { where: { id: 12 }, transaction: "TXN" }
        );
    });
});
