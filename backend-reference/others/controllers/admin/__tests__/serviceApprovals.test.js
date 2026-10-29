const useCase = require("../../../models/use-cases/serviceApprovals");
const gate = require("../../../models/use-cases/serviceApprovalGate");
const {
    listApprovalPartners,
    listPartnerApprovals,
    getServiceApproval,
    decideServiceApprovals,
    getServiceApprovalGate,
    updateServiceApprovalGate,
} = require("../serviceApprovals");

jest.mock("../../../models/use-cases/serviceApprovals", () => ({
    listApprovalPartners: jest.fn(),
    listPartnerApprovals: jest.fn(),
    getApproval: jest.fn(),
    decideServiceApprovals: jest.fn(),
}));
jest.mock("../../../models/use-cases/serviceApprovalGate", () => ({
    getApprovalGateSettings: jest.fn(),
    saveApprovalGate: jest.fn(),
}));

const run = async (handler, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

const bodyOf = res => res.json.mock.calls[0][0];

const USER = { id: 42, name: "Ibrahim" };

beforeEach(() => jest.clearAllMocks());

describe("listing", () => {
    it("hands back the partners with their counts", async () => {
        useCase.listApprovalPartners.mockResolvedValue({ partners: [], totals: {}, gate: { enabled: true } });

        const { res } = await run(listApprovalPartners, { user: USER });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(bodyOf(res)).toEqual({
            status: true,
            data: { partners: [], totals: {}, gate: { enabled: true } },
            message: "Approval partners fetched successfully",
            responseCode: "000",
        });
    });

    it("passes the validated params and query through and answers 404 for an unknown tree", async () => {
        useCase.listPartnerApprovals.mockResolvedValue({ partner: {}, rows: [], gate: {} });

        const { res } = await run(listPartnerApprovals, {
            params: { partnerPermissionId: 12 },
            query: { status: "awaiting", searchText: "" },
            user: USER,
        });
        expect(useCase.listPartnerApprovals).toHaveBeenCalledWith(12, { status: "awaiting", searchText: "" });
        expect(res.status).toHaveBeenCalledWith(200);

        useCase.listPartnerApprovals.mockResolvedValue(null);
        const { next } = await run(listPartnerApprovals, { params: { partnerPermissionId: 99 }, query: {}, user: USER });
        expect(next.mock.calls[0][0].status_code).toBe(404);
    });

    it("reads one service by its key and answers 404 when the tree does not carry it", async () => {
        useCase.getApproval.mockResolvedValue({ row: { label: "GST Filing" } });

        const { res } = await run(getServiceApproval, {
            params: { partnerPermissionId: 1 },
            query: { nodeKey: "Tax & More > GST Filing" },
            user: USER,
        });
        expect(useCase.getApproval).toHaveBeenCalledWith(1, "Tax & More > GST Filing");
        expect(bodyOf(res).data.row.label).toBe("GST Filing");

        useCase.getApproval.mockResolvedValue(null);
        const { next } = await run(getServiceApproval, { params: { partnerPermissionId: 1 }, query: { nodeKey: "x" }, user: USER });
        expect(next.mock.calls[0][0].status_code).toBe(404);
    });
});

describe("deciding", () => {
    it("records the decision for every listed partner with the acting user", async () => {
        useCase.decideServiceApprovals.mockResolvedValue({ results: [{ partnerPermissionId: 1, ok: true, status: "APPROVED" }], decided: 1, skipped: 0 });

        const { res } = await run(decideServiceApprovals, {
            body: { nodeKey: "esim_tunz", partnerPermissionIds: [1], decision: "APPROVED", note: null },
            user: USER,
        });

        expect(useCase.decideServiceApprovals).toHaveBeenCalledWith({
            nodeKey: "esim_tunz",
            partnerPermissionIds: [1],
            decision: "APPROVED",
            note: null,
            actor: { id: 42, name: "Ibrahim" },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(bodyOf(res).data.decided).toBe(1);
    });
});

describe("the gate", () => {
    it("reads the gate", async () => {
        gate.getApprovalGateSettings.mockResolvedValue({ enabled: false, setByName: "Ibrahim" });

        const { res } = await run(getServiceApprovalGate, { user: USER });

        expect(bodyOf(res).data).toEqual({ enabled: false, setByName: "Ibrahim" });
    });

    it("saves the gate with the acting user and says which way it went", async () => {
        gate.saveApprovalGate.mockResolvedValue({ enabled: false });

        const { res } = await run(updateServiceApprovalGate, { body: { enabled: false, reason: "UAT" }, user: USER });

        expect(gate.saveApprovalGate).toHaveBeenCalledWith({ enabled: false, reason: "UAT", actor: { id: 42, name: "Ibrahim" } });
        expect(bodyOf(res).message).toBe("Approval gate turned off");
    });

    it("answers 500 when the gate could not be written", async () => {
        gate.saveApprovalGate.mockResolvedValue(null);

        const { next } = await run(updateServiceApprovalGate, { body: { enabled: true, reason: null }, user: USER });

        expect(next.mock.calls[0][0].status_code).toBe(500);
    });
});
