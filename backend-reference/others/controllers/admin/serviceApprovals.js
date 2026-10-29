const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    listApprovalPartners,
    listPartnerApprovals,
    getApproval,
    decideServiceApprovals,
} = require("../../models/use-cases/serviceApprovals");
const {
    getApprovalGateSettings,
    saveApprovalGate,
} = require("../../models/use-cases/serviceApprovalGate");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

exports.listApprovalPartners = asyncHandler(async (req, res) =>
    ok(res, await listApprovalPartners(), "Approval partners fetched successfully")
);

exports.listPartnerApprovals = asyncHandler(async (req, res, next) => {
    const data = await listPartnerApprovals(req.params.partnerPermissionId, req.query);
    if (!data) return next(new ErrorResponse("Partner permission tree not found", 404));
    return ok(res, data, "Service approvals fetched successfully");
});

exports.getServiceApproval = asyncHandler(async (req, res, next) => {
    const data = await getApproval(req.params.partnerPermissionId, req.query.nodeKey);
    if (!data) return next(new ErrorResponse("Service not found in this partner's tree", 404));
    return ok(res, data, "Service approval fetched successfully");
});

exports.decideServiceApprovals = asyncHandler(async (req, res) =>
    ok(
        res,
        await decideServiceApprovals({
            nodeKey: req.body.nodeKey,
            partnerPermissionIds: req.body.partnerPermissionIds,
            decision: req.body.decision,
            note: req.body.note,
            actor: actorOf(req),
        }),
        "Service approval decisions recorded"
    )
);

exports.getServiceApprovalGate = asyncHandler(async (req, res) =>
    ok(res, await getApprovalGateSettings(), "Approval gate fetched successfully")
);

exports.updateServiceApprovalGate = asyncHandler(async (req, res, next) => {
    const saved = await saveApprovalGate({
        enabled: req.body.enabled,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!saved) return next(new ErrorResponse("Failed to save the approval gate", 500));
    return ok(res, saved, `Approval gate turned ${saved.enabled ? "on" : "off"}`);
});
