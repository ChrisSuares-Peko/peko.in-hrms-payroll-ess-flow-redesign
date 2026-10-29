const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    getServicesTypeConfig,
    findPlanTypeForAccessKey,
    isVendorPlanType,
    serializeService,
    listServicesByPlanType,
    findServiceByAccessKey,
    updateServiceCommission,
    updateVendorRecord,
    setServiceCommissionConfigured,
} = require("../../models/use-cases/accountingServices");
const { applyServicesTypeConfig } = require("../../models/use-cases/serviceClassification");
const { withConfiguration } = require("../../models/use-cases/serviceConfiguration");
const {
    getPlanEntityConfig,
    findPlansForService,
    countPlansForService,
    updatePlanCommission,
    updatePlanCommissionBulk,
    setPlanCommissionConfigured,
} = require("../../models/use-cases/accountingPlans");
const {
    findAddOnsForService,
    updateAddOn,
    setAddOnCommissionConfigured,
} = require("../../models/use-cases/accountingAddOns");
const { getSupportedCommissionModes } = require("../../utils/supportedCommissionModes");
const {
    bulkUpdate: bulkUpdateCashback,
    setSurchargeConfigured,
    createConfigured: createConfiguredCashback,
    updateConfigured: updateConfiguredCashback,
    findByPackageAndOperator: findCashbackByPackageAndOperator,
} = require("../../models/use-cases/cashback");

const CONFIGURE_FIRST_MESSAGE = "Please set the commission fields before marking this as configured";
const CONFIGURE_FIRST_SURCHARGE_MESSAGE = "Please set the surcharge fields before marking this as configured";

exports.getServicesTypeConfig = asyncHandler(async (req, res) => {
    const config = await getServicesTypeConfig();
    return res.status(200).json({
        status: true,
        data: config,
        message: "Services type config fetched successfully",
        responseCode: "000",
    });
});

exports.updateServicesTypeConfig = asyncHandler(async (req, res, next) => {
    const result = await applyServicesTypeConfig({
        config: req.body,
        actor: { id: req.user && req.user.id, name: req.user && req.user.name },
    });

    if (result.code === "OVERLAP") {
        return next(
            new ErrorResponse(`Access keys cannot be in both lists: ${result.keys.join(", ")}`, 400)
        );
    }
    if (result.code === "UNKNOWN") {
        return next(new ErrorResponse(`Unknown access keys: ${result.keys.join(", ")}`, 400));
    }

    return res.status(200).json({
        status: true,
        data: result.config,
        message: "Services type config updated successfully",
        responseCode: "000",
    });
});

exports.listAccountingServices = asyncHandler(async (req, res) => {
    const { type, page, itemsPerPage, searchText, sort, sortField } = req.query;
    const config = await getServicesTypeConfig();

    const result = await listServicesByPlanType({
        config,
        type,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        searchText,
        sort,
        sortField,
    });

    const services = await withConfiguration(result.rows.map(row => serializeService(row, type)));

    return res.status(200).json({
        status: true,
        data: {
            services,
            recordsTotal: result.count,
            page,
            itemsPerPage,
        },
        message: "Accounting services fetched successfully",
        responseCode: "000",
    });
});

exports.getAccountingService = asyncHandler(async (req, res, next) => {
    const { accessKey } = req.params;
    const config = await getServicesTypeConfig();

    const planType = findPlanTypeForAccessKey(config, accessKey);
    if (!isVendorPlanType(planType)) {
        return next(new ErrorResponse("Service is not mapped to an accounting plan type", 404));
    }

    const row = await findServiceByAccessKey(accessKey);
    if (!row) return next(new ErrorResponse("Service not found", 404));

    const [service] = await withConfiguration([serializeService(row, planType)]);

    return res.status(200).json({
        status: true,
        data: service,
        message: "Accounting service fetched successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServiceCommission = asyncHandler(
    async (req, res, next) => {
        const { id } = req.params;

        const result = await updateServiceCommission(id, req.body);
        if (!result)
            return next(
                new ErrorResponse(
                    "Something went wrong while updating the commission",
                    500
                )
            );

        return res.status(200).json({
            status: true,
            data: {},
            message: "Commission updated successfully",
            responseCode: "000",
        });
    }
);

exports.updateAccountingServiceCommissionStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const result = await setServiceCommissionConfigured(id, req.body.isCommissionConfigured);
    if (!result.ok) {
        return next(new ErrorResponse(CONFIGURE_FIRST_MESSAGE, 400));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Commission status updated successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServiceVendor = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const result = await updateVendorRecord(id, req.body);
    if (!result)
        return next(
            new ErrorResponse(
                "Something went wrong while updating the vendor",
                500
            )
        );

    return res.status(200).json({
        status: true,
        data: {},
        message: "Vendor updated successfully",
        responseCode: "000",
    });
});

exports.getAccountingServicePlans = asyncHandler(async (req, res) => {
    const { accessKey } = req.params;
    const supported = Boolean(getPlanEntityConfig(accessKey));
    const { page, itemsPerPage, searchText, partnerId, sort, sortField } = req.query;

    if (!supported) {
        return res.status(200).json({
            status: true,
            data: { supported, plans: [], recordsTotal: 0, page, itemsPerPage },
            message: "Plans fetched successfully",
            responseCode: "000",
        });
    }

    const filters = {
        searchText,
        partnerId,
        sort,
        sortField,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
    };
    const [plans, recordsTotal] = await Promise.all([
        findPlansForService(accessKey, filters),
        countPlansForService(accessKey, filters),
    ]);

    return res.status(200).json({
        status: true,
        data: { supported, plans, recordsTotal, page, itemsPerPage },
        message: "Plans fetched successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServicePlanCommission = asyncHandler(async (req, res, next) => {
    const { accessKey, planId } = req.params;

    if (!getPlanEntityConfig(accessKey)) {
        return next(new ErrorResponse("This service does not support plan-level commission", 404));
    }

    const { providerCommission, ...rest } = req.body;
    const result = await updatePlanCommission(accessKey, planId, {
        ...rest,
        commission: providerCommission,
    });
    if (!result) {
        return next(new ErrorResponse("Something went wrong while updating the plan commission", 500));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Plan commission updated successfully",
        responseCode: "000",
    });
});

exports.getAccountingServiceCommissionModes = asyncHandler(async (req, res) => {
    const { accessKey } = req.params;

    return res.status(200).json({
        status: true,
        data: { accessKey, commissionModes: getSupportedCommissionModes(accessKey) },
        message: "Commission modes fetched successfully",
        responseCode: "000",
    });
});

exports.getAccountingServiceAddOns = asyncHandler(async (req, res) => {
    const addOns = await findAddOnsForService(req.params.accessKey);

    return res.status(200).json({
        status: true,
        data: { supported: Boolean(addOns), addOns: addOns || [] },
        message: "Add-ons fetched successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServiceAddOn = asyncHandler(async (req, res, next) => {
    const { accessKey, addOnType } = req.params;
    const { providerCommission, ...rest } = req.body;

    if (rest.price === undefined) {
        return next(new ErrorResponse("Price is required", 400));
    }

    const updated = await updateAddOn(accessKey, addOnType, { ...rest, commission: providerCommission });
    if (!updated) {
        return next(new ErrorResponse("This service has no such add-on", 404));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Add-on updated successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServiceAddOnCommissionStatus = asyncHandler(async (req, res, next) => {
    const { accessKey, addOnType } = req.params;

    const result = await setAddOnCommissionConfigured(accessKey, addOnType, req.body.isCommissionConfigured);
    if (!result) {
        return next(new ErrorResponse("This service has no such add-on", 404));
    }
    if (!result.ok) {
        return next(new ErrorResponse(CONFIGURE_FIRST_MESSAGE, 400));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Commission status updated successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServicePlanCommissionBulk = asyncHandler(async (req, res, next) => {
    const { accessKey } = req.params;

    if (!getPlanEntityConfig(accessKey)) {
        return next(new ErrorResponse("This service does not support plan-level commission", 404));
    }

    const { planIds, providerCommission, ...rest } = req.body;
    const result = await updatePlanCommissionBulk(accessKey, planIds, {
        ...rest,
        commission: providerCommission,
    });
    if (!result) {
        return next(new ErrorResponse("Something went wrong while updating the plan commissions", 500));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Plan commissions updated successfully",
        responseCode: "000",
    });
});

exports.updateAccountingServicePlanCommissionStatus = asyncHandler(async (req, res, next) => {
    const { accessKey, planId } = req.params;

    if (!getPlanEntityConfig(accessKey)) {
        return next(new ErrorResponse("This service does not support plan-level commission", 404));
    }

    const result = await setPlanCommissionConfigured(accessKey, planId, req.body.isCommissionConfigured);
    if (!result || !result.ok) {
        return next(new ErrorResponse(CONFIGURE_FIRST_MESSAGE, 400));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Commission status updated successfully",
        responseCode: "000",
    });
});

exports.updateCashbackSurchargeStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const result = await setSurchargeConfigured(id, req.body.isSurchargeConfigured);
    if (!result.ok) {
        return next(new ErrorResponse(CONFIGURE_FIRST_SURCHARGE_MESSAGE, 400));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Surcharge status updated successfully",
        responseCode: "000",
    });
});

// Bulk-configure for the Platform Fee/Cashbacks tabs (accounting-only, unlike the shared single-row/list endpoints in the cashback controller).
exports.updateAccountingServiceCashbackBulk = asyncHandler(async (req, res, next) => {
    const { ids, ...data } = req.body;

    const result = await bulkUpdateCashback(ids, data);
    if (!result) {
        return next(new ErrorResponse("Something went wrong while updating the cashbacks", 500));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Cashbacks updated successfully",
        responseCode: "000",
    });
});

exports.createAccountingCashback = asyncHandler(async (req, res, next) => {
    const data = req.body;
    if (await findCashbackByPackageAndOperator(data)) {
        return next(new ErrorResponse("Cashback already exists", 403));
    }

    const result = await createConfiguredCashback(data);
    if (!result) {
        return next(new ErrorResponse("Something went wrong while adding the cashback", 500));
    }

    return res.status(200).json({
        status: true,
        data: result,
        message: "Cashback added successfully",
        responseCode: "000",
    });
});

exports.updateAccountingCashback = asyncHandler(async (req, res, next) => {
    const { params, body: data } = req;
    const existing = await findCashbackByPackageAndOperator(data);
    if (existing && String(existing.id) !== String(params.id)) {
        return next(new ErrorResponse("Cashback already exists", 403));
    }

    const result = await updateConfiguredCashback(params, data);
    if (!result) {
        return next(new ErrorResponse("Something went wrong while updating the cashback", 500));
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: "Cashback updated successfully",
        responseCode: "000",
    });
});
