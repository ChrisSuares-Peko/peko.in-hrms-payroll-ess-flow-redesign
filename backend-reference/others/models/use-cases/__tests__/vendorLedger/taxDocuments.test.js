const orders = require("../../../entities/order");
const vendors = require("../../../entities/vendor");
const vendorLedgerEntries = require("../../../entities/vendorLedgerEntry");
const settings = require("../../setting");
const {
    storedInvoiceFor,
    creditNoteNumberFor,
    asInvoice,
    asCreditNote,
    taxLinesFor,
    isCreditNoteEntry,
    manualDocumentPayload,
    manualDocumentNumber,
    manualAgainstNumber,
    loadGstRate,
    refundEventDate,
    orderInvoiceDocument,
    orderCreditNoteDocument,
    manualEntryDocument,
    documentFileName,
} = require("../../vendorTaxDocuments");

const LEDGER_ACCOUNTS = ["4567000000000999", "4567000000000777"];

jest.mock("../../../entities/order", () => ({ findOne: jest.fn() }));
jest.mock("../../../entities/vendor", () => ({ findOne: jest.fn() }));
jest.mock("../../../entities/vendorLedgerEntry", () => ({ findOne: jest.fn() }));
jest.mock("../../setting", () => ({ getASetting: jest.fn() }));

const SHARED_ACCOUNT = "4567000000000999";

const STORED_INVOICE = {
    invoiceNumber: "INV-20260921-000001",
    issuedDate: "2026-09-21",
    dueDate: "2026-09-21",
    placeOfSupply: "Delhi (07)",
    billedTo: {
        companyName: "Cleartrip Private Limited",
        address: "Somewhere",
        cityCountry: "Delhi",
        gstin: "07AAACC0000A1Z5",
    },
    items: [
        {
            description: "Commission (Flights)",
            quantity: 1,
            price: 50,
            taxableAmount: 50,
            vat: 9,
            lineTotal: 59,
        },
    ],
    subtotal: 50,
    taxLines: [
        { label: "CGST (9%)", amount: 4.5 },
        { label: "SGST (9%)", amount: 4.5 },
    ],
    total: 59,
    note: "Thank you for your service",
};

const orderRow = (overrides = {}) => ({
    id: 7,
    corporateTxnId: "TXN-1",
    transactionDate: "2026-09-21 10:00:00",
    pekoInvoiceDetails: { vendor: { invoiceData: STORED_INVOICE } },
    journalData: {
        commissionIncludingGST: 59,
        vendorPayable: 941,
        transaction: { lineItems: [{ accountId: SHARED_ACCOUNT, direction: "credit", amount: 941 }] },
    },
    ...overrides,
});

const refundOf = amount => ({
    journalDate: "2026-09-25",
    lineItems: [{ accountId: SHARED_ACCOUNT, direction: "debit", amount }],
});

const VENDOR = {
    id: 8,
    vendorName: "Refund Fixture",
    gstNo: "27AAACR0000A1Z5",
    state: "Maharashtra",
    address: "14 Marine Drive",
};

beforeEach(() => {
    jest.clearAllMocks();
    settings.getASetting.mockResolvedValue({ gst: 18, type: "PERCENTAGE" });
});

describe("the stored invoice", () => {
    it("is read whether the driver hands back json or a string", () => {
        expect(storedInvoiceFor(orderRow()).invoiceNumber).toBe("INV-20260921-000001");
        expect(
            storedInvoiceFor({
                pekoInvoiceDetails: JSON.stringify({ vendor: { invoiceData: STORED_INVOICE } }),
            }).invoiceNumber
        ).toBe("INV-20260921-000001");
    });

    it("is absent when the gateway never raised one", () => {
        expect(storedInvoiceFor(null)).toBeNull();
        expect(storedInvoiceFor({ pekoInvoiceDetails: null })).toBeNull();
        expect(storedInvoiceFor({ pekoInvoiceDetails: { vendor: {} } })).toBeNull();
        expect(storedInvoiceFor({ pekoInvoiceDetails: { vendor: { invoiceData: {} } } })).toBeNull();
        expect(storedInvoiceFor({ pekoInvoiceDetails: "{not json" })).toBeNull();
    });
});

describe("the credit note number", () => {
    it("is the invoice's own number with the series swapped", () => {
        expect(creditNoteNumberFor("INV-20260921-000001")).toBe("CRN-20260921-000001");
    });

    it("is the same every time the same refund is downloaded", () => {
        expect(creditNoteNumberFor("INV-1")).toBe(creditNoteNumberFor("INV-1"));
    });

    it("falls back when there is nothing to derive from", () => {
        expect(creditNoteNumberFor("", "TXN-9")).toBe("TXN-9");
        expect(creditNoteNumberFor(null)).toBe("");
        expect(creditNoteNumberFor("ABC-9")).toBe("CRN-ABC-9");
    });
});

describe("the credit note", () => {
    it("is the invoice negated, line for line", () => {
        const note = asCreditNote(STORED_INVOICE, { ratio: 1 });

        expect(note).toMatchObject({
            documentTitle: "Tax Credit Note",
            numberLabel: "Credit Note Number",
            invoiceNumber: "CRN-20260921-000001",
            subtotal: -50,
            total: -59,
            taxLines: [
                { label: "CGST (9%)", amount: -4.5 },
                { label: "SGST (9%)", amount: -4.5 },
            ],
            items: [
                {
                    description: "Commission (Flights)",
                    quantity: 1,
                    price: -50,
                    taxableAmount: -50,
                    vat: -9,
                    lineTotal: -59,
                },
            ],
        });
    });

    it("scales a partial refund by the same ratio the ledger uses", () => {
        expect(asCreditNote(STORED_INVOICE, { ratio: 0.5 })).toMatchObject({
            subtotal: -25,
            total: -29.5,
            taxLines: [
                { label: "CGST (9%)", amount: -2.25 },
                { label: "SGST (9%)", amount: -2.25 },
            ],
        });
    });

    it("names the invoice it reverses and takes the refund's date", () => {
        expect(
            asCreditNote(STORED_INVOICE, {
                ratio: 1,
                number: "CRN-1",
                againstInvoiceNumber: "INV-20260921-000001",
                issuedDate: "2026-09-25",
            })
        ).toMatchObject({
            invoiceNumber: "CRN-1",
            againstInvoiceNumber: "INV-20260921-000001",
            issuedDate: "2026-09-25",
        });
    });

    it("leaves the stored payload untouched", () => {
        asCreditNote(STORED_INVOICE, { ratio: 1 });

        expect(STORED_INVOICE.total).toBe(59);
        expect(STORED_INVOICE.items[0].lineTotal).toBe(59);
    });

    it("keeps the invoice itself positive and unreferenced", () => {
        expect(asInvoice(STORED_INVOICE)).toMatchObject({
            documentTitle: "Tax Invoice",
            numberLabel: "Invoice Number",
            invoiceNumber: "INV-20260921-000001",
            total: 59,
            againstInvoiceNumber: "",
        });
    });
});

describe("a manual entry's document", () => {
    it("splits an inclusive amount at the configured rate", () => {
        const payload = manualDocumentPayload({
            entry: { kind: "COMMISSION", entryNumber: "COM-000001", reference: "MC-1", amount: 236, issueDate: "2026-09-10", reason: "Q2 true-up" },
            party: VENDOR,
            gstRate: 18,
        });

        expect(payload).toMatchObject({
            invoiceNumber: "COM-000001",
            issuedDate: "2026-09-10",
            subtotal: 200,
            total: 236,
            items: [
                {
                    description: "Commission — Q2 true-up",
                    quantity: 1,
                    price: 200,
                    taxableAmount: 200,
                    vat: 36,
                    lineTotal: 236,
                },
            ],
        });
    });

    it("bills the vendor and states the place of supply", () => {
        expect(
            manualDocumentPayload({
                entry: { kind: "CREDIT_NOTE", reference: "CN-7", amount: 118, issueDate: "2026-09-10" },
                party: VENDOR,
                gstRate: 18,
            })
        ).toMatchObject({
            placeOfSupply: "Maharashtra (27)",
            billedTo: {
                companyName: "Refund Fixture",
                address: "14 Marine Drive",
                cityCountry: "Maharashtra",
                gstin: "27AAACR0000A1Z5",
            },
            items: [{ description: "Credit note" }],
        });
    });

    it("charges IGST across states and CGST plus SGST within one", () => {
        expect(taxLinesFor(36, 18, true)).toEqual([{ label: "IGST (18%)", amount: 36 }]);
        expect(taxLinesFor(36, 18, false)).toEqual([
            { label: "CGST (9%)", amount: 18 },
            { label: "SGST (9%)", amount: 18 },
        ]);
    });

    it("falls back to intra-state when a party's state cannot be resolved", () => {
        expect(
            manualDocumentPayload({
                entry: { kind: "COMMISSION", reference: "MC-2", amount: 236, issueDate: "2026-09-10" },
                party: { vendorName: "Unknown", gstNo: null, state: null, address: null },
                gstRate: 18,
            })
        ).toMatchObject({
            placeOfSupply: "Delhi (07)",
            taxLines: [
                { label: "CGST (9%)", amount: 18 },
                { label: "SGST (9%)", amount: 18 },
            ],
        });
    });

    it("raises an invoice for a commission and a credit note for its reversal", () => {
        expect(isCreditNoteEntry({ kind: "COMMISSION", entryType: "ENTRY" })).toBe(false);
        expect(isCreditNoteEntry({ kind: "COMMISSION", entryType: "REVERSAL" })).toBe(true);
        expect(isCreditNoteEntry({ kind: "CREDIT_NOTE", entryType: "ENTRY" })).toBe(true);
        expect(isCreditNoteEntry({ kind: "CREDIT_NOTE", entryType: "REVERSAL" })).toBe(false);
    });

    it("numbers itself by its entry number, and a reversal names the entry it reverses", () => {
        expect(manualDocumentNumber({ entryNumber: "VCN-000007", reference: "CN-7", entryType: "ENTRY" })).toBe("VCN-000007");
        expect(manualDocumentNumber({ entryNumber: "COM-000009", reference: "COM-000001", entryType: "REVERSAL" })).toBe("COM-000009");
        expect(
            manualAgainstNumber({ reference: "COM-000001", entryType: "REVERSAL" }, true, { entryNumber: "COM-000001" })
        ).toBe("COM-000001");
        expect(manualAgainstNumber({ reference: "MC-1", entryType: "REVERSAL" }, true, null)).toBe("MC-1");
        expect(
            manualAgainstNumber({ reference: "CN-7", entryType: "ENTRY", againstCorporateTxnId: "TXN-4" }, true)
        ).toBe("TXN-4");
    });
});

describe("the gst rate", () => {
    it("comes from the tax rate setting", async () => {
        await expect(loadGstRate()).resolves.toBe(18);
        expect(settings.getASetting).toHaveBeenCalledWith("taxRate");
    });

    it("falls back when the setting is missing or unusable", async () => {
        settings.getASetting.mockResolvedValue(false);
        await expect(loadGstRate()).resolves.toBe(18);

        settings.getASetting.mockResolvedValue({ gst: "not a number" });
        await expect(loadGstRate()).resolves.toBe(18);
    });
});

describe("the refund date", () => {
    it("is the latest refund event, falling back to the order's own date", () => {
        expect(
            refundEventDate({ refund: { journalDate: "2026-09-22" }, adminRefund: { journalDate: "2026-09-25" } })
        ).toBe("2026-09-25");
        expect(refundEventDate({}, "2026-09-21 10:00:00")).toBe("2026-09-21");
    });
});

describe("downloading an order's document", () => {
    it("returns the invoice the gateway stored", async () => {
        orders.findOne.mockResolvedValue(orderRow());

        const document = await orderInvoiceDocument({
            vendorId: 8,
            corporateTxnId: "TXN-1",
            ledgerAccountIds: LEDGER_ACCOUNTS,
        });

        expect(document).toMatchObject({
            number: "INV-20260921-000001",
            payload: { documentTitle: "Tax Invoice", total: 59 },
        });
    });

    it("refuses an order sold wholly as principal, which earns no commission, even asked for directly", async () => {
        orders.findOne.mockResolvedValue(
            orderRow({
                journalData: {
                    commissionMode: "PRINCIPAL_MARKUP",
                    commissionIncludingGST: 118,
                    vendorPayable: 882,
                    transaction: {
                        lineItems: [{ accountId: "sales-account", direction: "credit", amount: 982 }],
                    },
                },
            })
        );

        await expect(
            orderInvoiceDocument({
                vendorId: 8,
                corporateTxnId: "TXN-1",
                ledgerAccountIds: LEDGER_ACCOUNTS,
            })
        ).resolves.toBeNull();
    });

    it("scopes the lookup to the vendor asking for it", async () => {
        orders.findOne.mockResolvedValue(null);

        await expect(orderInvoiceDocument({ vendorId: 1, corporateTxnId: "TXN-1" })).resolves.toBeNull();
        expect(orders.findOne.mock.calls[0][0].where).toMatchObject({
            corporateTxnId: "TXN-1",
            "$serviceOperator.vendorId$": 1,
        });
    });

    it("offers nothing when no invoice was raised", async () => {
        orders.findOne.mockResolvedValue(orderRow({ pekoInvoiceDetails: null }));

        await expect(orderInvoiceDocument({ vendorId: 8, corporateTxnId: "TXN-1" })).resolves.toBeNull();
    });

    it("credits back the share that actually came off the deposit", async () => {
        orders.findOne.mockResolvedValue(
            orderRow({
                journalData: {
                    commissionIncludingGST: 59,
                    vendorPayable: 941,
                    adminRefund: refundOf(470.5),
                },
            })
        );

        await expect(
            orderCreditNoteDocument({ vendorId: 8, corporateTxnId: "TXN-1", accountIds: [SHARED_ACCOUNT] })
        ).resolves.toMatchObject({
            number: "CRN-20260921-000001",
            payload: {
                documentTitle: "Tax Credit Note",
                invoiceNumber: "CRN-20260921-000001",
                againstInvoiceNumber: "INV-20260921-000001",
                issuedDate: "2026-09-25",
                total: -29.5,
                subtotal: -25,
            },
        });
    });

    it("offers no credit note when nothing came back", async () => {
        orders.findOne.mockResolvedValue(orderRow());

        await expect(
            orderCreditNoteDocument({ vendorId: 8, corporateTxnId: "TXN-1", accountIds: [SHARED_ACCOUNT] })
        ).resolves.toBeNull();
    });

    it("offers no credit note when the order never had an invoice", async () => {
        orders.findOne.mockResolvedValue(
            orderRow({
                pekoInvoiceDetails: null,
                journalData: { commissionIncludingGST: 59, vendorPayable: 941, refund: refundOf(941) },
            })
        );

        await expect(
            orderCreditNoteDocument({ vendorId: 8, corporateTxnId: "TXN-1", accountIds: [SHARED_ACCOUNT] })
        ).resolves.toBeNull();
    });
});

describe("downloading a manual entry's document", () => {
    it("raises a tax invoice for a recorded commission", async () => {
        vendorLedgerEntries.findOne.mockResolvedValue({
            id: 12,
            vendorId: 8,
            kind: "COMMISSION",
            entryType: "ENTRY",
            entryNumber: "COM-000014",
            reference: "CM-14",
            amount: "236.0000",
            issueDate: "2026-09-19",
            reason: "Annual rebate",
        });
        vendors.findOne.mockResolvedValue(VENDOR);

        await expect(manualEntryDocument({ vendorId: 8, id: 12, kind: "COMMISSION" })).resolves.toMatchObject({
            number: "COM-000014",
            payload: {
                documentTitle: "Tax Invoice",
                invoiceNumber: "COM-000014",
                subtotal: 200,
                total: 236,
                taxLines: [{ label: "IGST (18%)", amount: 36 }],
            },
        });
    });

    it("raises a tax credit note for a recorded credit note", async () => {
        vendorLedgerEntries.findOne.mockResolvedValue({
            id: 13,
            vendorId: 8,
            kind: "CREDIT_NOTE",
            entryType: "ENTRY",
            entryNumber: "VCN-000077",
            reference: "CN-77",
            amount: "118.0000",
            issueDate: "2026-09-19",
            againstCorporateTxnId: "TXN-4",
        });
        vendors.findOne.mockResolvedValue(VENDOR);

        await expect(manualEntryDocument({ vendorId: 8, id: 13, kind: "CREDIT_NOTE" })).resolves.toMatchObject({
            number: "VCN-000077",
            payload: {
                documentTitle: "Tax Credit Note",
                invoiceNumber: "VCN-000077",
                againstInvoiceNumber: "TXN-4",
                subtotal: -100,
                total: -118,
                taxLines: [{ label: "IGST (18%)", amount: -18 }],
            },
        });
    });

    it("scopes the lookup to the vendor and the tab asking for it", async () => {
        vendorLedgerEntries.findOne.mockResolvedValue(null);

        await expect(manualEntryDocument({ vendorId: 1, id: 12, kind: "COMMISSION" })).resolves.toBeNull();
        expect(vendorLedgerEntries.findOne).toHaveBeenCalledWith({
            where: { id: 12, vendorId: 1, kind: "COMMISSION" },
            raw: true,
        });
    });
});

describe("the file name", () => {
    it("names the party, the document and its number", () => {
        expect(documentFileName("Cleartrip", asInvoice(STORED_INVOICE))).toBe(
            "Cleartrip Tax Invoice INV-20260921-000001.pdf"
        );
    });

    it("strips what a file system will not take", () => {
        expect(documentFileName('Clear/trip "Co"', asInvoice(STORED_INVOICE))).toBe(
            "Clear-trip -Co- Tax Invoice INV-20260921-000001.pdf"
        );
    });
});

describe("a manual entry recorded with its GST split", () => {
    it("prints the split that was kept, at the rate it was recorded under, instead of splitting again", () => {
        const payload = manualDocumentPayload({
            entry: {
                kind: "COMMISSION",
                reference: "MC-2",
                amount: 224,
                taxableAmount: 200,
                gstAmount: 24,
                gstRate: 12,
                gstInclusive: false,
                issueDate: "2026-10-13",
                reason: null,
            },
            party: VENDOR,
            gstRate: 18,
        });

        expect(payload).toMatchObject({
            subtotal: 200,
            total: 224,
            items: [{ description: "Commission", price: 200, taxableAmount: 200, vat: 24, lineTotal: 224 }],
            taxLines: [{ label: "IGST (12%)", amount: 24 }],
        });
    });
});
