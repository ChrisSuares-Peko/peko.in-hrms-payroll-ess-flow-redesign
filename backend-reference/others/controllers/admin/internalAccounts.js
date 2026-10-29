const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    findAllCredentialAccounts,
    findAllInternalCredentialAccounts,
} = require("../../models/use-cases/credential");
const {
    getInternalAccounts,
    updateInternalAccounts,
} = require("../../models/use-cases/setting");

exports.findAllInternalAccounts = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage } = req.query;
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : undefined;
    let limit = itemsPerPage;
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    const internalAccountIds = await getInternalAccounts();
    let params = {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        internalAccountIds,
    };
    const attributes = ["id", "username", "name", "email", "role", "createdAt"];

    const result = await findAllInternalCredentialAccounts(params, attributes);

    if (!result) {
        return next(
            new ErrorResponse(
                `Something went wrong while getting internal accounts from database`,
                500
            )
        );
    }
    return res.status(200).json({
        status: true,
        data: {
            internalAccounts: result.rows || [],
            recordsTotal: result.count || 0,
        },
        message: "All internal accounts fetched successfully.",
        responseCode: "000",
    });
});

exports.findAllAccounts = asyncHandler(async (req, res) => {
    const attributes = ["id", "username", "name"];
    const allAccounts = await findAllCredentialAccounts(attributes);

    return res.status(200).json({
        status: true,
        data: { allAccounts },
        message: "All accounts fetched successfully.",
        responseCode: "000",
    });
});

exports.addInternalAccounts = asyncHandler(async (req, res) => {
    const { accounts } = req.body;
    const internalAccounts = await getInternalAccounts();
    const uniqueAccounts = [...new Set([...internalAccounts, ...accounts])];

    await updateInternalAccounts(uniqueAccounts);

    return res.status(200).json({
        status: true,
        data: {},
        message: "Accounts added successfully",
        responseCode: "000",
    });
});

exports.deleteInternalAccounts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const internalAccounts = await getInternalAccounts();
    const accounts = internalAccounts.filter((item) => item != id);

    await updateInternalAccounts(accounts);

    return res.status(200).json({
        status: true,
        data: {},
        message: "Accounts deleted successfully",
        responseCode: "000",
    });
});
