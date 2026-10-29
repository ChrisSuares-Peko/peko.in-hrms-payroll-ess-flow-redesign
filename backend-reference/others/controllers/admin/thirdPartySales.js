const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { dayBoundedRange } = require("../../utils/istRange");
const { handlerFor, OUTCOME_LABELS } = require("../../models/use-cases/thirdPartySales");
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

const filtersOf = async query => ({
    range: rangeOf(query),
    status: query.status,
    searchText: query.searchText,
    accountIds: await resolveAccountIds(query.accounts),
    sort: query.sort,
    sortField: query.sortField,
});

const unknownKind = () => new ErrorResponse("Unknown third-party sales kind", 404);

exports.listThirdPartySales = asyncHandler(async (req, res, next) => {
    const handler = handlerFor(req.params.kind);
    if (!handler) return next(unknownKind());

    const { page, itemsPerPage } = req.query;
    const result = await handler.list({ ...(await filtersOf(req.query)), ...pageOf(req.query) });

    return ok(
        res,
        {
            entries: result.rows.map(row => handler.serialize(row)),
            recordsTotal: result.count,
            totals: result.totals,
            page,
            itemsPerPage,
            kind: req.params.kind,
        },
        "Third-party sales fetched successfully"
    );
});

exports.exportThirdPartySales = asyncHandler(async (req, res, next) => {
    const handler = handlerFor(req.params.kind);
    if (!handler) return next(unknownKind());

    const filters = await filtersOf(req.query);
    const { range, status, searchText } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: paging => handler.list({ ...filters, ...paging }),
        serialize: row => handler.serialize(row),
        columns: handler.exportColumns(),
        summaryOf: result => handler.exportSummary(result.totals),
        note: handler.exportNote,
        title: handler.title,
        period: range ? periodOf(req.query.from, req.query.to) : "All dates",
        subtitleOf: () => [
            status ? `Status: ${OUTCOME_LABELS[status] || status}` : null,
            accountScopeLabel(filters.accountIds),
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});
