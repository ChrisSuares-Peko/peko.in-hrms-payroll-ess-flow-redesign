const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    listClassification,
    classifyService,
    classifyServices,
    listClassificationOptions,
} = require("../../models/use-cases/serviceClassification");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

exports.listServiceClassification = asyncHandler(async (req, res) => {
    const { classification, page, itemsPerPage, searchText, sort, sortField } = req.query;
    const result = await listClassification({
        classification,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        searchText,
        sort,
        sortField,
    });
    return ok(res, { ...result, page, itemsPerPage }, "Service classification fetched successfully");
});

exports.classifyService = asyncHandler(async (req, res, next) => {
    const { accessKey } = req.params;
    const result = await classifyService({ accessKey, planType: req.body.planType, actor: actorOf(req) });
    if (result.code === "UNKNOWN") {
        return next(new ErrorResponse(`Unknown access key: ${accessKey}`, 400));
    }
    return ok(
        res,
        result,
        result.changed ? "Service classification updated" : "Service classification unchanged"
    );
});

exports.listClassificationOptions = asyncHandler(async (req, res) =>
    ok(res, await listClassificationOptions(), "Service classification options fetched successfully")
);

exports.classifyServices = asyncHandler(async (req, res, next) => {
    const result = await classifyServices({
        accessKeys: req.body.accessKeys,
        planType: req.body.planType,
        actor: actorOf(req),
    });
    if (result.code === "UNKNOWN") {
        return next(new ErrorResponse(`Unknown access keys: ${result.keys.join(", ")}`, 400));
    }
    return ok(res, result, "Service classification updated");
});
