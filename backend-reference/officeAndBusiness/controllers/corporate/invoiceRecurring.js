const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
    createRecurring,
    getAllRecurring,
    getRecurringById,
    updateRecurringStatus,
} = require("../../models/use-cases/invoiceRecurring");
const { updateInvoice } = require("../../models/use-cases/invoicingV2");
const emailer = require("../../utils/emailer");
const { resolveRecurringScheduleCreatedEmail } = require("../../utils/emailTemplates/invoicingV2");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");

function resolveStatus(startDate, endCondition) {
    if (!endCondition || endCondition.type === "FOREVER") return "ACTIVE";
    if (endCondition.type === "AFTER" && endCondition.runs <= 0) return "ENDED";
    if (endCondition.type === "ON") {
        const start = new Date(startDate);
        const end = new Date(endCondition.date);
        if (start >= end) return "ENDED";
    }
    return "ACTIVE";
}

// POST /recurring
exports.create = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = { ...req.body, corporateUserId };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            data.subCorporateUserId = req.user.subCorporateId;
        }

        data.status = resolveStatus(data.startDate, data.endCondition);
        data.nextRunDate = data.status !== "ENDED" ? data.startDate : null;

        const record = await createRecurring(data);

        // Backlink the source invoice to this schedule
        if (data.sourceInvoiceId) {
            await updateInvoice(
                { id: data.sourceInvoiceId, corporateUserId },
                { recurringId: record.id }
            );
        }

        // Send confirmation email to corporate user
        if (req.user.email) {
            try {
                const freqEvery = data.frequency?.every || 1;
                const freqUnit = (data.frequency?.unit || 'MONTHS').toLowerCase().replace(/s$/, '');
                const frequencyLabel = `Every ${freqEvery} ${freqUnit}${freqEvery > 1 ? 's' : ''}`;
                const partnerDetails = req.user.registeredBy
                    ? await fetchPartnerDetails(req.user.registeredBy)
                    : await partnerLogos();
                const { subject, html, sender } = await resolveRecurringScheduleCreatedEmail(
                    { startDate: data.startDate, frequency: frequencyLabel, endCondition: data.endCondition },
                    partnerDetails,
                    { fallbackSubject: 'Recurring Invoice Schedule Created – Peko', partnerId: req.user.registeredBy || null, logTraceId: req?.LogTraceId }
                );
                emailer.email(req.user.email, subject, html, () => {}, sender);
            } catch (emailErr) {
                customLog(req?.LogTraceId, "error", { message: "Failed to send recurring schedule email", error: emailErr?.message });
            }
        }

        return res.status(201).json({
            status: true,
            data: record,
            message: "Recurring schedule created",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
};

// GET /recurring
exports.getAll = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { searchText, status, page, itemsPerPage, from, to, sortField } = req.query;
        const sort = req.query.sort === "ASC" ? "ASC" : "DESC";
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : undefined;

        const params = { corporateUserId, searchText, status, page, itemsPerPage, from, to, sort, sortField };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const result = await getAllRecurring(params);
        return res.status(200).json({
            status: true,
            data: result,
            message: "Recurring schedules fetched",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
};

// GET /recurring/:id
exports.getDetails = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const record = await getRecurringById(req.params.id, corporateUserId);
        if (!record) return next(new ErrorResponse("Schedule not found", 404));
        return res.status(200).json({
            status: true,
            data: record,
            message: "Schedule fetched",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
};

// PATCH /recurring/:id/status  — body: { status: "ACTIVE"|"PAUSED"|"ENDED" }
exports.updateStatus = async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { status } = req.body;

        if (!["ACTIVE", "PAUSED", "ENDED"].includes(status)) {
            return next(new ErrorResponse("Status must be ACTIVE, PAUSED or ENDED", 400));
        }

        const record = await getRecurringById(req.params.id, corporateUserId);
        if (!record) return next(new ErrorResponse("Schedule not found", 404));
        if (record.status === "ENDED") {
            return next(new ErrorResponse("Cannot update an ended schedule", 400));
        }

        let nextRunDate = status === "ENDED" ? null : record.nextRunDate;

        // On resume from PAUSED, fast-forward nextRunDate past today
        if (status === "ACTIVE" && record.status === "PAUSED" && nextRunDate) {
            const today = new Date().toISOString().split("T")[0];
            const frequency =
                typeof record.frequency === "string"
                    ? JSON.parse(record.frequency)
                    : record.frequency;
            while (nextRunDate <= today) {
                const date = new Date(nextRunDate);
                const { every, unit } = frequency;
                if (unit === "DAYS") date.setDate(date.getDate() + every);
                else if (unit === "WEEKS") date.setDate(date.getDate() + every * 7);
                else if (unit === "MONTHS") date.setMonth(date.getMonth() + every);
                else if (unit === "QUARTERS") date.setMonth(date.getMonth() + every * 3);
                else if (unit === "YEARS") date.setFullYear(date.getFullYear() + every);
                nextRunDate = date.toISOString().split("T")[0];
            }
        }

        await updateRecurringStatus(req.params.id, corporateUserId, status, nextRunDate);

        return res.status(200).json({
            status: true,
            data: {},
            message: "Status updated successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
};
