const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    createCoaRules,
    updateCoaRules,
    getAllCoaRules,
    deleteCoaRules,
    setActiveCoaRule,
} = require("../../models/use-cases/coaRules");

exports.createCoaRule = asyncHandler(async (req, res, next) => {
    const { entityType, prefix, accountType, parentAccountId, description } =
        req.body;
    if (!entityType || !prefix || !accountType) {
        return next(new ErrorResponse("Required fields are missing", 400));
    }
    const newRule = await createCoaRules({
        entityType,
        prefix,
        accountType,
        parentAccountId,
        description,
    });
    return res
        .status(201)
        .json({
            status: true,
            message: "COA Rule created successfully",
            data: newRule,
        });
});

exports.updateCoaRule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const rule = await updateCoaRules(id, updateData);
    if (!rule) {
        return res
            .status(404)
            .json({
                status: false,
                message: "COA Rule not found or update failed",
            });
    }
    return res
        .status(200)
        .json({
            status: true,
            message: "Rule updated successfully",
            data: rule,
        });
});

exports.changeCoaRuleStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updatedRule = await setActiveCoaRule(id, status);
    if (!updatedRule) {
        return res
            .status(404)
            .json({
                status: false,
                message: "Failed to update COA Rule status — rule not found",
            });
    }
    return res.status(200).json({
        status: true,
        message: `Rule for entity '${updatedRule.entityType}' is now ${
            status ? "active" : "inactive"
        }`,
        data: updatedRule,
    });
});

exports.getAllCoaRules = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage } = req.query;
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage;
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    const params = { limit, offset, searchText, sort, sortField };
    const rules = await getAllCoaRules(params);
    if (!rules) {
        return next(
            new ErrorResponse(
                `Something went wrong while fetching COA Rules`,
                400
            )
        );
    }
    return res.status(200).json({
        status: true,
        message: "Rules fetched successfully",
        data: { data: rules.rows, recordsTotal: rules.count },
    });
});

exports.deleteCoaRule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await deleteCoaRules(id);
    if (!deleted) {
        return res
            .status(404)
            .json({
                status: false,
                message: "COA Rule not found or could not be deleted",
            });
    }
    return res
        .status(200)
        .json({ status: true, message: "Rule deleted successfully" });
});
