jest.mock("../../../models/use-cases/vendorLedger", () => ({
    findVendorById: jest.fn(),
    getVendorDepositAccounts: jest.fn(),
    ledgerAccountIdsForVendor: jest.fn(() => ["acc-1"]),
}));
jest.mock("../../../models/use-cases/vendorCommissionInvoices", () => ({
    SOURCES: { order: "order", manual: "manual" },
    OUTCOMES: {
        missing: "MISSING",
        unchanged: "UNCHANGED",
        updated: "UPDATED",
        renderFailed: "RENDER_FAILED",
        sendFailed: "SEND_FAILED",
        sent: "SENT",
    },
    searchCommissionInvoices: jest.fn(),
    loadCommissionInvoice: jest.fn(),
    previewCommissionInvoice: jest.fn(),
    saveBilledTo: jest.fn(),
    sendInvoice: jest.fn(),
}));

const { findVendorById, getVendorDepositAccounts } = require("../../../models/use-cases/vendorLedger");
const useCase = require("../../../models/use-cases/vendorCommissionInvoices");
const {
    searchCommissionInvoices,
    getCommissionInvoice,
    previewCommissionInvoice,
    updateCommissionInvoiceBilledTo,
    sendCommissionInvoice,
} = require("../vendorCommissionInvoices");

const USER = { id: 7, name: "Ibrahim" };

const run = async (handler, req) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await handler({ query: {}, body: {}, params: {}, user: USER, ...req }, res, next);
    return { res, next };
};

const dataOf = res => res.json.mock.calls[0][0].data;

beforeEach(() => {
    jest.clearAllMocks();
    findVendorById.mockResolvedValue({ id: 1, vendorName: "Cleartrip" });
    getVendorDepositAccounts.mockResolvedValue({ sharedAccountId: "acc-1" });
});

describe("finding commission invoices", () => {
    it("hands the matches back", async () => {
        useCase.searchCommissionInvoices.mockResolvedValue([{ source: "order", id: "TXN-1" }]);

        const { res } = await run(searchCommissionInvoices, { query: { search: "TXN-1" } });

        expect(useCase.searchCommissionInvoices).toHaveBeenCalledWith("TXN-1");
        expect(dataOf(res)).toEqual({ matches: [{ source: "order", id: "TXN-1" }] });
    });
});

describe("reading one invoice", () => {
    it("refuses a source it does not know and a vendor that is not there", async () => {
        const bad = await run(getCommissionInvoice, { params: { vendorId: "1", source: "auto", id: "TXN-1" } });
        expect(bad.next.mock.calls[0][0].status_code).toBe(400);

        findVendorById.mockResolvedValue(null);
        const missing = await run(getCommissionInvoice, { params: { vendorId: "9", source: "order", id: "TXN-1" } });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
        expect(useCase.loadCommissionInvoice).not.toHaveBeenCalled();
    });

    it("loads the invoice with the vendor's ledger accounts, and says when there is none", async () => {
        useCase.loadCommissionInvoice.mockResolvedValue({ invoiceNumber: "INV-9" });
        const { res } = await run(getCommissionInvoice, { params: { vendorId: "1", source: "order", id: "TXN-1" } });
        expect(useCase.loadCommissionInvoice).toHaveBeenCalledWith({ vendorId: 1, source: "order", id: "TXN-1", ledgerAccountIds: ["acc-1"] });
        expect(dataOf(res)).toEqual({ invoiceNumber: "INV-9" });

        useCase.loadCommissionInvoice.mockResolvedValue(null);
        const none = await run(getCommissionInvoice, { params: { vendorId: "1", source: "manual", id: "12" } });
        expect(none.next.mock.calls[0][0].status_code).toBe(404);
    });

    it("renders a preview of a billed-to not saved yet", async () => {
        useCase.previewCommissionInvoice.mockResolvedValue({ html: "<html>draft</html>", placeOfSupply: "Delhi (07)", taxCase: "CGST+SGST", taxLines: [] });

        const { res } = await run(previewCommissionInvoice, {
            params: { vendorId: "1", source: "order", id: "TXN-1" },
            body: { billedTo: { companyName: "Cleartrip Ltd" } },
        });

        expect(useCase.previewCommissionInvoice).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: 1, source: "order", id: "TXN-1", billedTo: { companyName: "Cleartrip Ltd" } })
        );
        expect(dataOf(res)).toEqual({ html: "<html>draft</html>", placeOfSupply: "Delhi (07)", taxCase: "CGST+SGST", taxLines: [] });
    });
});

describe("changing the billed-to", () => {
    it("saves it under the signed-in accountant and says when nothing changed", async () => {
        useCase.saveBilledTo.mockResolvedValue({ outcome: "UPDATED", invoice: { invoiceNumber: "INV-9" } });
        const body = { companyName: "Cleartrip Ltd", address: "", state: "", gstin: "" };

        const { res } = await run(updateCommissionInvoiceBilledTo, { params: { vendorId: "1", source: "order", id: "TXN-1" }, body });

        expect(useCase.saveBilledTo).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: 1, source: "order", id: "TXN-1", billedTo: body, actor: USER })
        );
        expect(res.json.mock.calls[0][0].message).toBe("Invoice billed-to updated successfully");

        useCase.saveBilledTo.mockResolvedValue({ outcome: "UNCHANGED", invoice: {} });
        const same = await run(updateCommissionInvoiceBilledTo, { params: { vendorId: "1", source: "order", id: "TXN-1" }, body });
        expect(same.res.json.mock.calls[0][0].message).toBe("Nothing changed on the invoice");

        useCase.saveBilledTo.mockResolvedValue({ outcome: "MISSING" });
        const missing = await run(updateCommissionInvoiceBilledTo, { params: { vendorId: "1", source: "order", id: "TXN-1" }, body });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
    });
});

describe("sending the invoice", () => {
    const params = { vendorId: "1", source: "manual", id: "12" };

    it("names the recipients in the answer", async () => {
        useCase.sendInvoice.mockResolvedValue({ outcome: "SENT", recipients: ["ap@cleartrip.test"], invoice: { invoiceNumber: "CM-14" } });

        const { res } = await run(sendCommissionInvoice, { params, body: { to: ["ap@cleartrip.test"] } });

        expect(useCase.sendInvoice).toHaveBeenCalledWith(expect.objectContaining({ vendorId: 1, source: "manual", id: "12", to: ["ap@cleartrip.test"], actor: USER }));
        expect(res.json.mock.calls[0][0].message).toBe("Invoice sent to ap@cleartrip.test");
        expect(dataOf(res)).toEqual({ invoiceNumber: "CM-14" });
    });

    it("maps a missing invoice, a render failure and an email failure to their own errors", async () => {
        useCase.sendInvoice.mockResolvedValue({ outcome: "MISSING" });
        expect((await run(sendCommissionInvoice, { params, body: { to: ["a@b.test"] } })).next.mock.calls[0][0].status_code).toBe(404);

        useCase.sendInvoice.mockResolvedValue({ outcome: "RENDER_FAILED" });
        expect((await run(sendCommissionInvoice, { params, body: { to: ["a@b.test"] } })).next.mock.calls[0][0].status_code).toBe(503);

        useCase.sendInvoice.mockResolvedValue({ outcome: "SEND_FAILED", reason: "SMTP down" });
        const failed = await run(sendCommissionInvoice, { params, body: { to: ["a@b.test"] } });
        expect(failed.next.mock.calls[0][0].status_code).toBe(502);
        expect(failed.next.mock.calls[0][0].message).toBe("Could not send the invoice: SMTP down");
    });
});
