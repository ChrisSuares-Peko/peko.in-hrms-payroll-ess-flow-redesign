const useCases = require("../../../models/use-cases/paymentLinkCharges");
const {
    listPaymentLinkCharges,
    updateDefaultPaymentLinkCharge,
    updateCorporatePaymentLinkCharge,
    removeCorporatePaymentLinkCharge,
} = require("../thirdPartyConfiguration");

jest.mock("../../../models/use-cases/paymentLinkCharges", () => ({
    listPaymentLinkCorporates: jest.fn(),
    setDefaultCharge: jest.fn(),
    setCorporateCharge: jest.fn(),
    removeCorporateCharge: jest.fn(),
}));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const run = async (handler, req) => {
    const res = mockRes();
    const next = jest.fn();
    await handler({ user: { id: 5, name: "Asha" }, params: {}, query: {}, body: {}, ...req }, res, next);
    return { res, next };
};

const CHARGE = { percentage: 1.5, fixed: 3, updatedAt: "now", recordedByName: "Asha" };

describe("thirdPartyConfiguration controller", () => {
    beforeEach(() => jest.clearAllMocks());

    it("lists the corporates with the default charge, the counts and the page asked for", async () => {
        useCases.listPaymentLinkCorporates.mockResolvedValue({
            defaultCharge: CHARGE,
            rows: [{ credentialId: 99 }],
            count: 12,
            customCount: 3,
        });

        const { res } = await run(listPaymentLinkCharges, {
            query: { page: 2, itemsPerPage: 10, searchText: "ac", scope: "custom", sort: "DESC", sortField: "updatedAt" },
        });

        expect(useCases.listPaymentLinkCorporates).toHaveBeenCalledWith({
            scope: "custom",
            searchText: "ac",
            sort: "DESC",
            sortField: "updatedAt",
            limit: 10,
            offset: 10,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).toEqual({
            status: true,
            data: {
                defaultCharge: CHARGE,
                corporates: [{ credentialId: 99 }],
                recordsTotal: 12,
                customTotal: 3,
                page: 2,
                itemsPerPage: 10,
            },
            message: "Payment link charges fetched successfully",
            responseCode: "000",
        });
    });

    it("saves the default charge under the admin who set it, and answers 500 when the row could not be written", async () => {
        useCases.setDefaultCharge.mockResolvedValueOnce(CHARGE).mockResolvedValueOnce(null);

        const { res } = await run(updateDefaultPaymentLinkCharge, { body: { percentage: 1.5, fixed: 3 } });

        expect(useCases.setDefaultCharge).toHaveBeenCalledWith({ percentage: 1.5, fixed: 3 }, { id: 5, name: "Asha" });
        expect(res.json.mock.calls[0][0]).toEqual(
            expect.objectContaining({ status: true, data: { defaultCharge: CHARGE }, message: "Default payment link charge saved" })
        );

        const failed = await run(updateDefaultPaymentLinkCharge, { body: { percentage: 1.5, fixed: 3 } });
        expect(failed.next.mock.calls[0][0].status_code).toBe(500);
    });

    it("saves a corporate's own charge, and answers 404 for a corporate not onboarded", async () => {
        useCases.setCorporateCharge.mockResolvedValueOnce({ credentialId: 99, charge: CHARGE }).mockResolvedValueOnce(null);

        const { res } = await run(updateCorporatePaymentLinkCharge, {
            params: { credentialId: 99 },
            body: { percentage: 0.9, fixed: 0 },
        });
        expect(useCases.setCorporateCharge).toHaveBeenCalledWith(99, { percentage: 0.9, fixed: 0 }, { id: 5, name: "Asha" });
        expect(res.json.mock.calls[0][0]).toEqual(
            expect.objectContaining({ data: { credentialId: 99, charge: CHARGE }, message: "Payment link charge saved for the corporate" })
        );

        const missing = await run(updateCorporatePaymentLinkCharge, { params: { credentialId: 404 }, body: { percentage: 1, fixed: 0 } });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
        expect(missing.res.json).not.toHaveBeenCalled();
    });

    it("drops a corporate's own charge, and answers 404 when it had none", async () => {
        useCases.removeCorporateCharge.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

        const { res } = await run(removeCorporatePaymentLinkCharge, { params: { credentialId: 99 } });
        expect(useCases.removeCorporateCharge).toHaveBeenCalledWith(99);
        expect(res.json.mock.calls[0][0]).toEqual(
            expect.objectContaining({ data: { credentialId: 99 }, message: "The corporate now follows the default charge" })
        );

        const missing = await run(removeCorporatePaymentLinkCharge, { params: { credentialId: 100 } });
        expect(missing.next.mock.calls[0][0].status_code).toBe(404);
    });
});
