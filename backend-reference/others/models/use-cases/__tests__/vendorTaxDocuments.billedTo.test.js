jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../utils/invoiceTemplate", () => ({
    taxInvoiceTemplate: jest.fn(),
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

const {
    BILLED_TO_FIELDS,
    TAX_CASES,
    GST_STATES,
    billedToOf,
    templateBilledTo,
    partyBilledTo,
    taxPlacement,
    taxCaseOf,
    gstRateOf,
    withBilledToEdits,
    storedEditsFor,
    entryEditsFor,
    manualDocumentPayload,
} = require("../vendorTaxDocuments");

// Peko sells from Delhi (07), so a Kerala vendor is across the state line.
const GENERATED = {
    invoiceNumber: "INV-9",
    placeOfSupply: "Kerala (32)",
    billedTo: { companyName: "Cleartrip Private Limited", address: "Old address", cityCountry: "Kerala", gstin: "32BBBBB0000B1Z5" },
    items: [{ description: "Commission (Flights)", quantity: 1, price: 100, taxableAmount: 100, vat: 18, lineTotal: 118 }],
    subtotal: 100,
    taxLines: [{ label: "IGST (18%)", amount: 18 }],
    total: 118,
};

describe("the billed-to the accounts team can change on an invoice", () => {
    it("names the four fields, reads the generated state off the invoice's own line, and lists every GST state", () => {
        expect(BILLED_TO_FIELDS).toEqual(["companyName", "address", "state", "gstin"]);
        expect(billedToOf(GENERATED.billedTo)).toEqual({
            companyName: "Cleartrip Private Limited",
            address: "Old address",
            state: "Kerala",
            gstin: "32BBBBB0000B1Z5",
        });
        expect(billedToOf({ companyName: " Cleartrip ", state: "Delhi", gstin: null, extra: "x" })).toEqual({
            companyName: "Cleartrip",
            address: "",
            state: "Delhi",
            gstin: "",
        });
        expect(billedToOf({ state: "kerala" }).state).toBe("Kerala");
        expect(billedToOf({ cityCountry: "DELHI" }).state).toBe("Delhi");
        expect(billedToOf({ state: "Kochi" }).state).toBe("Kochi");
        expect(templateBilledTo(billedToOf({ companyName: "A", state: "Goa" }))).toEqual({
            companyName: "A",
            address: "",
            cityCountry: "Goa",
            gstin: "",
        });
        expect(partyBilledTo({ vendorName: "Cleartrip", state: "Kerala", gstNo: "32B", address: null })).toEqual({
            companyName: "Cleartrip",
            address: "",
            state: "Kerala",
            gstin: "32B",
        });
        expect(GST_STATES).toContainEqual({ code: "32", name: "Kerala" });
        expect(GST_STATES).toContainEqual({ code: "07", name: "Delhi" });
        expect(TAX_CASES).toEqual({ interState: "IGST", intraState: "CGST+SGST" });
    });

    it("places the supply by the GSTIN first, then the state, and splits the tax by the state line", () => {
        expect(taxPlacement({ gstin: "32BBBBB0000B1Z5", state: "Kerala" })).toEqual({
            interState: true,
            stateCode: "32",
            placeOfSupply: "Kerala (32)",
            taxCase: "IGST",
        });
        expect(taxPlacement({ gstin: "", state: "Delhi" })).toMatchObject({ interState: false, placeOfSupply: "Delhi (07)", taxCase: "CGST+SGST" });
        expect(taxPlacement({ gstin: "07AAAAA0000A1Z5", state: "Kerala" })).toMatchObject({ placeOfSupply: "Delhi (07)", taxCase: "CGST+SGST" });
        expect(taxPlacement({ gstin: "", state: "" })).toMatchObject({ interState: false, stateCode: null, placeOfSupply: "Delhi (07)" });
        expect(taxCaseOf(GENERATED)).toBe("IGST");
        expect(taxCaseOf({ ...GENERATED, taxLines: [{ label: "CGST (9%)", amount: 9 }, { label: "SGST (9%)", amount: 9 }] })).toBe("CGST+SGST");
        expect(gstRateOf(GENERATED)).toBe(18);
        expect(gstRateOf({ ...GENERATED, taxLines: [{ label: "CGST (6%)", amount: 6 }, { label: "SGST (6%)", amount: 6 }] })).toBe(12);
        expect(gstRateOf({ ...GENERATED, taxLines: [] })).toBe(18);
    });

    it("lays the saved fields over the generated ones and keeps the figures when the state line is not crossed", () => {
        const edited = withBilledToEdits(GENERATED, { billedTo: { address: " New address ", gstin: "" } });

        expect(edited.billedTo).toEqual({ companyName: "Cleartrip Private Limited", address: "New address", cityCountry: "Kerala", gstin: "" });
        expect(edited.placeOfSupply).toBe("Kerala (32)");
        expect(edited.taxLines).toBe(GENERATED.taxLines);
        expect(edited.total).toBe(118);
        expect(withBilledToEdits(GENERATED, null)).toBe(GENERATED);
        expect(withBilledToEdits(GENERATED, { billedTo: {} })).toBe(GENERATED);
    });

    it("moves the place of supply and rebuilds the tax split when the billed-to crosses the state line, for the same tax", () => {
        const moved = withBilledToEdits(GENERATED, { billedTo: { state: "Delhi", gstin: "07AAAAA0000A1Z5" } });

        expect(moved.billedTo).toEqual({ companyName: "Cleartrip Private Limited", address: "Old address", cityCountry: "Delhi", gstin: "07AAAAA0000A1Z5" });
        expect(moved.placeOfSupply).toBe("Delhi (07)");
        expect(moved.taxLines).toEqual([
            { label: "CGST (9%)", amount: 9 },
            { label: "SGST (9%)", amount: 9 },
        ]);
        expect(moved.total).toBe(118);
        expect(moved.subtotal).toBe(100);

        const back = withBilledToEdits(moved, { billedTo: { state: "Kerala", gstin: "32BBBBB0000B1Z5" } });
        expect(back.taxLines).toEqual([{ label: "IGST (18%)", amount: 18 }]);
        expect(back.placeOfSupply).toBe("Kerala (32)");

        const byGstin = withBilledToEdits(GENERATED, { billedTo: { gstin: "07AAAAA0000A1Z5" } });
        expect(byGstin.placeOfSupply).toBe("Delhi (07)");
        expect(byGstin.taxLines.map(line => line.label)).toEqual(["CGST (9%)", "SGST (9%)"]);
    });

    it("reads the saved edits off an order's invoice object and off a hand-recorded entry, parsed when stored as text", () => {
        const edits = { billedTo: { address: "New address" }, editedByName: "Asha" };
        expect(storedEditsFor({ pekoInvoiceDetails: { vendor: { invoiceData: GENERATED, edits } } })).toEqual(edits);
        expect(storedEditsFor({ pekoInvoiceDetails: JSON.stringify({ vendor: { invoiceData: GENERATED, edits } }) })).toEqual(edits);
        expect(storedEditsFor({ pekoInvoiceDetails: { vendor: { invoiceData: GENERATED } } })).toBeNull();
        expect(storedEditsFor(null)).toBeNull();

        expect(entryEditsFor({ documentEdits: edits })).toEqual(edits);
        expect(entryEditsFor({ documentEdits: JSON.stringify(edits) })).toEqual(edits);
        expect(entryEditsFor({ documentEdits: null })).toBeNull();
    });

    it("bills a hand-recorded commission to the vendor as it stands, with the entry's own saved billed-to deciding the split", () => {
        const party = { vendorName: "Cleartrip", address: "Kochi", state: "Kerala", gstNo: "32BBBBB0000B1Z5" };
        const entry = {
            kind: "COMMISSION",
            entryNumber: "COM-000014",
            reference: "CM-14",
            amount: 236,
            taxableAmount: 200,
            gstAmount: 36,
            issueDate: "2026-10-10",
            reason: null,
            documentEdits: null,
        };

        const asIs = manualDocumentPayload({ entry, party, gstRate: 18 });
        expect(asIs.billedTo).toEqual({ companyName: "Cleartrip", address: "Kochi", cityCountry: "Kerala", gstin: "32BBBBB0000B1Z5" });
        expect(asIs.placeOfSupply).toBe("Kerala (32)");
        expect(asIs.taxLines).toEqual([{ label: "IGST (18%)", amount: 36 }]);
        expect(asIs.total).toBe(236);

        const edited = manualDocumentPayload({
            entry: { ...entry, documentEdits: { billedTo: { companyName: "Cleartrip Ltd", state: "Delhi", gstin: "07AAAAA0000A1Z5" } } },
            party,
            gstRate: 18,
        });
        expect(edited.billedTo).toEqual({ companyName: "Cleartrip Ltd", address: "Kochi", cityCountry: "Delhi", gstin: "07AAAAA0000A1Z5" });
        expect(edited.placeOfSupply).toBe("Delhi (07)");
        expect(edited.taxLines).toEqual([
            { label: "CGST (9%)", amount: 18 },
            { label: "SGST (9%)", amount: 18 },
        ]);
        expect(edited.invoiceNumber).toBe("COM-000014");
    });
});
