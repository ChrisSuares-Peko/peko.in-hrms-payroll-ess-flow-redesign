const asyncHandler = require("../../middlewares/async");
const { dayBoundedRange } = require("../../utils/istRange");
const {
    listOtherSales,
    serializeOtherSale,
    otherSalesExportColumns,
    otherSalesExportSummary,
    OTHER_SALES_EXPORT_NOTE,
    PEKO_DEFAULT_PARTNER,
} = require("../../models/use-cases/otherSales");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const { resolveAccountIds, accountScopeLabel } = require("../../models/use-cases/internalAccounts");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const rangeOf = query =>
    query.from && query.to ? dayBoundedRange(query.from, query.to) : null;

const pageOf = query => ({
    limit: query.itemsPerPage,
    offset: (query.page - 1) * query.itemsPerPage,
});

// The filters shared by the Other Sales table and its export, so both always show the same rows.
const filtersOf = async query => ({
    range: rangeOf(query),
    vendorId: query.vendorId,
    partnerId: query.partnerId,
    searchText: query.searchText,
    accountIds: await resolveAccountIds(query.accounts),
    sort: query.sort,
    sortField: query.sortField,
});

exports.listOtherSales = asyncHandler(async (req, res) => {
    const { page, itemsPerPage } = req.query;

    const result = await listOtherSales({ ...(await filtersOf(req.query)), ...pageOf(req.query) });

    return ok(
        res,
        {
            entries: result.rows.map(serializeOtherSale),
            recordsTotal: result.count,
            totals: result.totals,
            page,
            itemsPerPage,
        },
        "Other sales fetched successfully"
    );
});

exports.exportOtherSales = asyncHandler(async (req, res, next) => {
    const filters = await filtersOf(req.query);
    const { range, vendorId, partnerId, searchText } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: paging => listOtherSales({ ...filters, ...paging }),
        serialize: row => serializeOtherSale(row),
        columns: otherSalesExportColumns(),
        summaryOf: result => otherSalesExportSummary(result.totals),
        note: OTHER_SALES_EXPORT_NOTE,
        title: "Other Sales",
        period: range ? periodOf(req.query.from, req.query.to) : "All dates",
        subtitleOf: rows => [
            vendorId ? `Vendor: ${rows[0].vendorName || vendorId}` : null,
            partnerId === "default"
                ? `Partner: ${PEKO_DEFAULT_PARTNER}`
                : partnerId
                  ? `Partner: ${rows[0].partnerName || partnerId}`
                  : null,
            accountScopeLabel(filters.accountIds),
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});
