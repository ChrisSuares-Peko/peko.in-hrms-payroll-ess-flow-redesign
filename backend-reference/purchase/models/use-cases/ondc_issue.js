const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const sequelizeConfig = require("../../configs/database/index");
const ondcIssues = require('./../entities/ondc_issue');
const { recordOndcIssueEvent, findEventsByIssueId } = require('./ondc_issue_event');
const ondcIssueEvents = require('./../entities/ondc_issue_event');
const { applyCreatedAtRange } = require('../../utils/dateRangeFilter');
const { containsLike } = require('../../utils/escapeLike');

/**
 * Single issue by id, scoped to the requesting buyer (same corporateUserId/
 * subCorporateUserId cast as findOneOndcOrderById) so one corporate user
 * can't fetch another's issue by guessing an id. `ondcOrderId`, when passed,
 * additionally pins the issue to the specific order in the URL — a buyer who
 * owns two orders can't address order A's endpoint with an issue id that
 * actually belongs to order B. Eager-loads the full event thread.
 */
exports.findOneOndcIssueById = asyncHandler(async ({ id, ondcOrderId, corporateUserId, subCorporateUserId }) => {
    const where = subCorporateUserId ? { id, subCorporateUserId } : { id, corporateUserId };
    if (ondcOrderId !== undefined) where.ondcOrderId = ondcOrderId;
    const issue = await ondcIssues.findOne({ where, raw: true });
    if (!issue) return null;
    issue.events = await findEventsByIssueId({ ondcIssueId: issue.id });
    return issue;
});

/** All issues on one order, newest first, each with its full event thread. */
exports.findOndcIssuesForOrder = asyncHandler(async ({ ondcOrderId, corporateUserId, subCorporateUserId }) => {
    const where = subCorporateUserId ? { ondcOrderId, subCorporateUserId } : { ondcOrderId, corporateUserId };
    const issues = await ondcIssues.findAll({ where, order: [['id', 'DESC']], raw: true });
    for (const issue of issues) {
        issue.events = await findEventsByIssueId({ ondcIssueId: issue.id });
    }
    return issues;
});

/**
 * Single issue by the NETWORK's own issue.id, UNSCOPED by buyer — webhook-only
 * lookup (on_issue/on_issue_status carry the network id, not our own row id
 * or the buyer's identity). Never expose this to a buyer-facing route.
 */
exports.findOndcIssueByIssueId = asyncHandler(async ({ issueId }) => {
    return await ondcIssues.findOne({ where: { issueId }, raw: true });
});

/**
 * Persist a newly-raised issue + its first OPEN event atomically (both commit
 * or neither). Callers persist BEFORE ondc.issue() so a fast seller on_issue
 * can find this row; if /issue NACKs they delete the row.
 */
exports.createOndcIssue = asyncHandler(async ({
    ondcOrderId, orderId, transactionId, corporateUserId, subCorporateUserId,
    bppId, bppUri, issueId, category, subCategory, description, firstEvent,
    igmMeta, level,
}) => {
    const transaction = await sequelizeConfig.transaction();
    let issue;
    try {
        issue = await ondcIssues.create(
            {
                ondcOrderId, orderId, transactionId, corporateUserId, subCorporateUserId,
                bppId, bppUri, issueId, category, subCategory, description,
                ...(igmMeta ? { igmMeta } : {}),
                ...(level ? { level } : {}),
            },
            { transaction }
        );
        if (firstEvent) {
            await recordOndcIssueEvent({ ondcIssueId: issue.id, ...firstEvent, transaction });
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
    return await exports.findOneOndcIssueById({ id: issue.id, corporateUserId, subCorporateUserId });
});

/**
 * Unscoped, filterable listing across ALL buyers' issues — backs the admin
 * Issues tab (controllers/admin/ecomIssues.js), its open-count badge and its
 * CSV/Excel/PDF exports. Mirrors findOndcOrdersForAdminAction's shape.
 */
exports.findAllOndcIssuesAndCount = asyncHandler(async ({ status, statusNotIn, category, bppId, searchText, from, to, sort = "DESC", sortField = "id", offset = 0, limit = 10 } = {}) => {
    const where = {};
    if (Array.isArray(status)) where.status = { [Op.in]: status };
    else if (status) where.status = status;
    // "Needs attention" / the Issues tab's open-count badge: every status the
    // buyer/seller haven't put to rest yet — see TERMINAL_ISSUE_STATUSES in
    // controllers/corporate/ondcEcommerce.js (kept in sync manually; that file
    // owns the canonical list).
    if (statusNotIn) where.status = { ...(where.status || {}), [Op.notIn]: statusNotIn };
    if (category) where.category = category;
    if (bppId) where.bppId = bppId;
    if (searchText) {
        const like = { [Op.like]: containsLike(searchText) };
        where[Op.or] = [{ orderId: like }, { transactionId: like }, { bppId: like }, { issueId: like }];
    }
    applyCreatedAtRange(where, from, to);
    return await ondcIssues.findAndCountAll({
        where,
        order: [[sortField, sort === "ASC" ? "ASC" : "DESC"]],
        offset,
        limit,
        raw: true,
    });
});

/**
 * Distinct ondcOrderId of every issue NOT YET in a terminal state — the
 * "needs attention" signal for the admin All-orders filter/toggle. Kept as a
 * plain id list (not a join) since ondcOrders/ondcIssues have no declared
 * Sequelize association between them.
 */
exports.findOndcOrderIdsWithNonTerminalIssues = asyncHandler(async (terminalStatuses) => {
    const rows = await ondcIssues.findAll({
        where: { status: { [Op.notIn]: terminalStatuses } },
        attributes: ["ondcOrderId"],
        group: ["ondcOrderId"],
        raw: true,
    });
    return rows.map((r) => r.ondcOrderId);
});

/**
 * Single issue by our own row id, UNSCOPED by buyer — for the admin issue
 * detail/respond screens, mirroring findOndcOrderByIdAdmin's exact pattern.
 * Never expose this to a buyer-facing route. Eager-loads the full event
 * thread, same as findOneOndcIssueById.
 */
exports.findOneOndcIssueByIdAdmin = asyncHandler(async ({ id }) => {
    const issue = await ondcIssues.findOne({ where: { id }, raw: true });
    if (!issue) return null;
    issue.events = await findEventsByIssueId({ ondcIssueId: issue.id });
    return issue;
});

/**
 * Persist the issue-level fields an IGM 2.0 callback carries that have no
 * per-event home — `level` and the counterparty's proposed `resolutions[]`.
 *
 * Deliberately does NOT touch `status`: that stays owned by touchOndcIssueStatus
 * (models/use-cases/ondc_issue_event.js), which has the out-of-order guard.
 * Fields are only written when present, so a callback that omits one leaves the
 * stored value alone rather than blanking it.
 */
exports.updateOndcIssueFromCallback = asyncHandler(async ({ id, level, resolution, igmMeta }) => {
    if (!id) return [0];
    const changes = {};
    if (level) changes.level = level;
    // An empty resolutions array is meaningful ("nothing proposed"), but null /
    // undefined means the callback didn't mention them at all.
    if (resolution !== undefined && resolution !== null) changes.resolution = resolution;
    if (igmMeta !== undefined && igmMeta !== null) changes.igmMeta = igmMeta;
    if (!Object.keys(changes).length) return [0];
    return await ondcIssues.update(changes, { where: { id } });
});

/** Remove a speculative raise that the seller NACKed, including its events. */
exports.deleteOndcIssue = asyncHandler(async ({ id }) => {
    if (!id) return 0;
    await ondcIssueEvents.destroy({ where: { ondcIssueId: id } });
    return await ondcIssues.destroy({ where: { id } });
});
