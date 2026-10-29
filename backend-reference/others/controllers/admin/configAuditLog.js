const asyncHandler = require("../../middlewares/async");
const { dayBoundedRange } = require("../../utils/istRange");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const { listAuditLogs, serializeAuditLog } = require("../../models/use-cases/configAuditLog");
const {
    CONFIG_TYPE_LABELS,
    SOURCE_LABELS,
    configAuditLogExportColumns,
} = require("../../models/use-cases/configAuditLogExport");

// The filters the table and its export share, so both always show the same rows.
const filtersOf = ({ searchText, configType, source, partnerName, sort, sortField, from, to }) => ({
    searchText,
    configType,
    source,
    partnerName,
    sort,
    sortField,
    range: from && to ? dayBoundedRange(from, to) : null,
});

exports.listConfigAuditLogs = asyncHandler(async (req, res) => {
    const { page, itemsPerPage } = req.query;

    const result = await listAuditLogs({
        ...filtersOf(req.query),
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
    });

    return res.status(200).json({
        status: true,
        data: {
            entries: result.rows.map(serializeAuditLog),
            recordsTotal: result.count,
            page,
            itemsPerPage,
        },
        message: "Audit trail fetched successfully",
        responseCode: "000",
    });
});

exports.exportConfigAuditLogs = asyncHandler(async (req, res, next) => {
    const filters = filtersOf(req.query);
    const { configType, partnerName, source, searchText, range } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: paging => listAuditLogs({ ...filters, ...paging }),
        serialize: row => serializeAuditLog(row),
        columns: configAuditLogExportColumns(),
        title: "Audit Trail",
        period: range ? periodOf(req.query.from, req.query.to) : "All dates",
        subtitleOf: () => [
            configType ? `Configuration: ${CONFIG_TYPE_LABELS[configType]}` : null,
            partnerName ? `Partner: ${partnerName}` : null,
            source ? `Changed from: ${SOURCE_LABELS[source]}` : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});
