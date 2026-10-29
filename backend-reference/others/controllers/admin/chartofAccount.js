const asyncHandler = require("../../middlewares/async");
const {
    create,
    listAccounts,
    findById,
    findByAccountName,
    updateAccount,
} = require("../../models/use-cases/chartOfAccount");
const { dispatch } = require("../../utils/bull/queue/accountingQueues");

exports.createChartofAccounts = asyncHandler(async (req, res) => {
    const existing = await findByAccountName(req.body.account_name);
    if (existing) {
        return res.status(400).json({
            status: false,
            message: `An account named "${req.body.account_name}" already exists`,
        });
    }

    const localResult = await create({
        account_name: req.body.account_name,
        account_type: req.body.account_type,
        description: req.body.description,
        account_code: req.body.account_code,
        parent_account_id: req.body.parent_account_id || null,
        syncStatus: "CREATE_PENDING",
    });

    try {
        const providerResult = await dispatch("create", {
            payload: req.body,
            localId: localResult.id,
        });

        if (!providerResult || !providerResult.account_id) {
            return res.status(500).json({
                status: false,
                data: localResult,
                message:
                    "Chart of Account saved locally, but the accounting provider did not confirm creation",
            });
        }

        return res.status(200).json({
            status: true,
            data: {
                ...localResult.toJSON(),
                ...providerResult,
                syncStatus: "CREATE_SUCCESS",
            },
            message: "Chart of Account created successfully",
        });
    } catch (error) {
        const stillProcessing = error.message?.includes("timeout");
        if (stillProcessing) {
            return res.status(202).json({
                status: true,
                data: localResult,
                message:
                    "Chart of Account saved locally and is still syncing with the accounting provider — check back shortly",
            });
        }
        return res.status(500).json({
            status: false,
            data: localResult,
            message:
                error.message ||
                "Chart of Account saved locally, but syncing with the accounting provider failed",
        });
    }
});

exports.updateChartOfAccounts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;

    const account = await findById(id);
    if (!account) {
        return res.status(404).json({
            status: false,
            message: "Chart of Account not found",
        });
    }

    const pendingResult = await updateAccount(id, {
        ...payload,
        syncStatus: "UPDATE_PENDING",
    });

    try {
        const providerResult = await dispatch("update", {
            accountId: account.provider_account_id,
            payload,
            localId: id,
        });

        if (!providerResult || !providerResult.account_id) {
            return res.status(500).json({
                status: false,
                data: pendingResult,
                message:
                    "Chart of Account saved locally, but the accounting provider did not confirm the update",
            });
        }

        return res.status(200).json({
            status: true,
            data: {
                ...pendingResult.toJSON(),
                ...providerResult,
                syncStatus: "UPDATE_SUCCESS",
            },
            message: "Chart of Account updated successfully",
            responseCode: "000",
        });
    } catch (error) {
        const stillProcessing = error.message?.includes("timeout");
        if (stillProcessing) {
            return res.status(202).json({
                status: true,
                data: pendingResult,
                message:
                    "Chart of Account saved and is still syncing with the accounting provider — check back shortly",
            });
        }
        return res.status(500).json({
            status: false,
            data: pendingResult,
            message:
                error.message ||
                "Chart of Account saved locally, but syncing with the accounting provider failed",
        });
    }
});

exports.listChartOfAccounts = asyncHandler(async (req, res) => {
    let { searchText, page, itemsPerPage } = req.query;
    const sort = req.query.sort === "ASC" ? "ASC" : "DESC";
    const sortField = req.query.sortField || "createdAt";

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    const limit = itemsPerPage;
    const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : undefined;

    const params = { limit, offset, searchText, sort, sortField };
    const result = await listAccounts(params);

    const accounts = result.rows || [];
    if (accounts.length === 0) {
        return res.status(200).json({
            status: true,
            data: { data: [], recordsTotal: 0 },
            message: "No Chart of Accounts found",
            responseCode: "000",
        });
    }

    return res.status(200).json({
        status: true,
        data: { data: accounts, recordsTotal: result.count },
        message: "Chart of Accounts fetched successfully",
        responseCode: "000",
    });
});

exports.getAccountTypes = asyncHandler(async (req, res) => {
    const types = await dispatch("getAccountTypes");

    return res.status(200).json({
        status: true,
        data: types || [],
        message: "Fetched account types successfully",
        responseCode: "000",
    });
});

exports.listParentAccounts = asyncHandler(async (req, res) => {
    const parentAccounts = await dispatch("getParentAccounts");

    return res.status(200).json({
        status: true,
        data: parentAccounts || [],
        message: "Fetched valid parent accounts successfully",
        responseCode: "000",
    });
});
