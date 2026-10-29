const {
    validateServiceApprovalParams,
    validateServiceApprovalsQuery,
    validateServiceApprovalNodeQuery,
} = require("../queryValidation");
const { validateServiceApprovalDecision, validateServiceApprovalGate } = require("../apiValidation");

const runQuery = (validator, req) => {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    validator(req, res, next);
    return { res, next };
};

const runBody = (validator, body) => {
    const req = { body };
    const next = jest.fn();
    validator(req, {}, next);
    return { req, next };
};

describe("validateServiceApprovalParams", () => {
    it("coerces the tree id to a number and keeps the other params", () => {
        const req = { params: { userId: "7", partnerPermissionId: "12" } };

        const { next, res } = runQuery(validateServiceApprovalParams, req);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
        expect(req.params).toEqual({ userId: "7", partnerPermissionId: 12 });
    });

    it("refuses anything that is not a positive integer", () => {
        ["0", "-3", "abc", "1.5"].forEach(value => {
            const { res } = runQuery(validateServiceApprovalParams, { params: { partnerPermissionId: value } });
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});

describe("validateServiceApprovalsQuery", () => {
    it("defaults to every status and an empty search, and drops unknown keys", () => {
        const req = { query: { foo: "bar", status: "" } };

        runQuery(validateServiceApprovalsQuery, req);

        expect(req.query).toEqual({ status: "all", searchText: "" });
    });

    it("reads the switch from 1/0 and true/false", () => {
        const on = { query: { switchedOn: "1" } };
        const off = { query: { switchedOn: "false" } };

        runQuery(validateServiceApprovalsQuery, on);
        runQuery(validateServiceApprovalsQuery, off);

        expect(on.query.switchedOn).toBe(true);
        expect(off.query.switchedOn).toBe(false);
    });

    it("refuses an unknown status", () => {
        const { res } = runQuery(validateServiceApprovalsQuery, { query: { status: "maybe" } });

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validateServiceApprovalNodeQuery", () => {
    it("requires a node key and trims it", () => {
        const req = { query: { nodeKey: "  Tax & More > GST Filing " } };

        const { next } = runQuery(validateServiceApprovalNodeQuery, req);

        expect(next).toHaveBeenCalledWith();
        expect(req.query.nodeKey).toBe("Tax & More > GST Filing");

        const { res } = runQuery(validateServiceApprovalNodeQuery, { query: {} });
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("validateServiceApprovalDecision", () => {
    const valid = { nodeKey: "esim_tunz", partnerPermissionIds: [1, 12], decision: "APPROVED" };

    it("accepts an approval without a note and normalises it to null", () => {
        const { req, next } = runBody(validateServiceApprovalDecision, { ...valid, note: "" });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ ...valid, note: null });
    });

    it("requires a note to reject", () => {
        const { next } = runBody(validateServiceApprovalDecision, { ...valid, decision: "REJECTED" });
        expect(next.mock.calls[0][0].status_code).toBe(400);

        const ok = runBody(validateServiceApprovalDecision, { ...valid, decision: "REJECTED", note: " wrong vendor " });
        expect(ok.next).toHaveBeenCalledWith();
        expect(ok.req.body.note).toBe("wrong vendor");
    });

    it("refuses an empty, duplicated or oversized partner list and an unknown decision", () => {
        [
            { ...valid, partnerPermissionIds: [] },
            { ...valid, partnerPermissionIds: [1, 1] },
            { ...valid, partnerPermissionIds: Array.from({ length: 101 }, (_, index) => index + 1) },
            { ...valid, partnerPermissionIds: ["a"] },
            { ...valid, decision: "MAYBE" },
            { ...valid, nodeKey: "" },
        ].forEach(body => {
            const { next } = runBody(validateServiceApprovalDecision, body);
            expect(next.mock.calls[0][0].status_code).toBe(400);
        });
    });

    it("keeps the routing fields the client sends along and strips anything else", () => {
        const { req } = runBody(validateServiceApprovalDecision, { ...valid, userId: 7, userType: "system_user", extra: 1 });

        expect(req.body).toEqual({ ...valid, note: null, userId: 7, userType: "system_user" });
    });
});

describe("validateServiceApprovalGate", () => {
    it("requires a boolean and defaults the reason", () => {
        const { req, next } = runBody(validateServiceApprovalGate, { enabled: false });

        expect(next).toHaveBeenCalledWith();
        expect(req.body).toEqual({ enabled: false, reason: null });
    });

    it("refuses a missing or non-boolean flag", () => {
        [{}, { enabled: "on" }, { enabled: 1 }].forEach(body => {
            const { next } = runBody(validateServiceApprovalGate, body);
            expect(next.mock.calls[0][0].status_code).toBe(400);
        });
    });
});
