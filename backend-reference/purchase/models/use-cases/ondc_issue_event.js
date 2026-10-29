const { Op, UniqueConstraintError } = require('sequelize');
const asyncHandler = require('./../../middlewares/async');
const ondcIssueEvents = require('./../entities/ondc_issue_event');
const ondcIssues = require('./../entities/ondc_issue');

/**
 * Out-of-order guard: a chronologically-older event that arrives late (a
 * redelivered/delayed webhook racing a newer one) can never regress the
 * status a newer event already set — the WHERE clause makes this a single
 * atomic compare-and-set rather than a read-then-write race.
 */
const touchOndcIssueStatus = async ({ id, status, actorType, occurredAt, transaction }) => {
    return await ondcIssues.update(
        { status, lastActionAt: occurredAt, lastActorType: actorType },
        {
            where: {
                id,
                [Op.or]: [{ lastActionAt: null }, { lastActionAt: { [Op.lte]: occurredAt } }],
            },
            transaction,
        }
    );
};

/**
 * The single function every write path (buyer-facing raise/respond AND the
 * on_issue/on_issue_status webhook) funnels through. A redelivered webhook or
 * a double-submit collides on the (ondcIssueId, dedupeKey) unique index and
 * is swallowed here as a no-op — returns the ALREADY-existing row rather than
 * throwing, so callers never need their own dedup logic.
 */
exports.recordOndcIssueEvent = asyncHandler(async ({
    ondcIssueId, eventType, actorType, actorName, message, images, sourceAction, occurredAt, dedupeKey, transaction,
}) => {
    let event;
    try {
        event = await ondcIssueEvents.create(
            {
                ondcIssueId,
                eventType,
                actorType,
                actorName: actorName || null,
                message: message || null,
                images: images && images.length ? images : null,
                sourceAction: sourceAction || null,
                occurredAt,
                dedupeKey: dedupeKey || null,
            },
            { transaction }
        );
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            return await ondcIssueEvents.findOne({ where: { ondcIssueId, dedupeKey }, transaction, raw: true });
        }
        throw error;
    }

    await touchOndcIssueStatus({ id: ondcIssueId, status: eventType, actorType, occurredAt, transaction });
    return event;
});

/** Full thread for one issue, oldest first — used to build the echoed
 *  issue_actions history IGM requires on every follow-up /issue call. */
exports.findEventsByIssueId = asyncHandler(async ({ ondcIssueId }) => {
    return await ondcIssueEvents.findAll({ where: { ondcIssueId }, order: [['id', 'ASC']], raw: true });
});
