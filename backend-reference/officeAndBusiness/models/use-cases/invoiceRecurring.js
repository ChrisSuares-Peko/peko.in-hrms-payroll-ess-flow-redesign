const { Op } = require("sequelize");
const invoiceRecurring = require("../entities/invoiceRecurring");
const invoicingV2 = require("../entities/invoicingV2");
const { customLog } = require("../../utils/loggerHelper");

exports.createRecurring = async (data) => {
    try {
        return await invoiceRecurring.create(data);
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while creating recurring schedule");
    }
};

exports.getAllRecurring = async ({
    corporateUserId,
    subCorporateUserId,
    searchText,
    status,
    page,
    itemsPerPage,
    from,
    to,
    sort,
    sortField,
}) => {
    try {
        const allowedSortFields = ["createdAt", "scheduleName", "status", "startDate"];
        const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
        const orderDir = sort === "ASC" ? "ASC" : "DESC";

        const where = { corporateUserId };
        if (subCorporateUserId) where.subCorporateUserId = subCorporateUserId;
        if (status) where.status = status;
        if (searchText) {
            where[Op.or] = [{ scheduleName: { [Op.like]: `%${searchText}%` } }];
        }
        if (from && to) {
            const endOfDay = new Date(to);
            endOfDay.setDate(endOfDay.getDate() + 1);
            where.createdAt = { [Op.between]: [from, endOfDay] };
        }

        const limit = itemsPerPage || undefined;
        const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : 0;

        const [rows, totalSchedule, active, revenueResult] = await Promise.all([
            invoiceRecurring.findAndCountAll({
                where,
                include: [
                    {
                        model: invoicingV2,
                        as: "sourceInvoice",
                        attributes: ["id", "totalAmount"],
                    },
                ],
                order: [[orderField, orderDir]],
                limit,
                offset,
                raw: true,
                nest: true,
            }),
            invoiceRecurring.count({ where: { corporateUserId } }),
            invoiceRecurring.count({ where: { corporateUserId, status: "ACTIVE" } }),
            invoiceRecurring.findAll({
                where: { corporateUserId },
                include: [
                    {
                        model: invoicingV2,
                        as: "sourceInvoice",
                        attributes: ["totalAmount"],
                    },
                ],
                attributes: ["completedRuns"],
                raw: true,
                nest: true,
            }),
        ]);

        let revenueGenerated = 0;
        revenueResult.forEach((r) => {
            const runs = parseInt(r.completedRuns) || 0;
            if (!runs) return;
            revenueGenerated += parseFloat(r["sourceInvoice.totalAmount"] || r.sourceInvoice?.totalAmount || 0) * runs;
        });

        return {
            rows: rows.rows,
            recordsTotal: rows.count,
            stats: {
                totalSchedule,
                active,
                revenueGenerated: revenueGenerated.toFixed(2),
            },
        };
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while fetching recurring schedules");
    }
};

exports.getRecurringById = async (id, corporateUserId) => {
    try {
        return await invoiceRecurring.findOne({
            where: { id, corporateUserId },
            include: [
                {
                    model: invoicingV2,
                    as: "sourceInvoice",
                    attributes: ["id", "name", "email", "phoneNumber", "address", "totalAmount", "invoiceDate", "dueDate", "prefix", "invoiceNumber"],
                },
            ],
            raw: true,
            nest: true,
        });
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while fetching recurring schedule");
    }
};

exports.updateRecurringStatus = async (id, corporateUserId, status, nextRunDate = undefined) => {
    try {
        const updateData = { status };
        if (nextRunDate !== undefined) updateData.nextRunDate = nextRunDate;
        return await invoiceRecurring.update(updateData, {
            where: { id, corporateUserId },
        });
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while updating recurring status");
    }
};
