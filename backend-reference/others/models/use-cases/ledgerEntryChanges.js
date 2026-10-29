const sequelizeConfig = require("../../configs/database/index");
const { istDay } = require("../../utils/istRange");
const configAuditLog = require("../entities/configAuditLog");
const { currentContext, ACCOUNTING_PORTAL } = require("../../utils/requestContext");

const OUTCOMES = {
    missing: "MISSING",
    reversed: "REVERSED",
    pendingRemoval: "PENDING_REMOVAL",
    refused: "REFUSED",
    unchanged: "UNCHANGED",
    updated: "UPDATED",
    deleted: "DELETED",
    removed: "REMOVED",
};

const CHANGE_REASON_FIELD = "changeReason";
const DOCUMENT_FIELD = "document";
const BOOKS_FIELD = "booksSynced";
const REMOVED_FIELD = "removedFromPortal";
const LABEL_LIMIT = 255;

const NOT_IN_BOOKS = {
    booksSynced: false,
    booksSyncedAt: null,
    booksSyncedById: null,
    booksSyncedByName: null,
};

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const isBlank = value => value === undefined || value === null || String(value).trim() === "";

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

const READERS = {
    amount: value => (isBlank(value) ? null : round2(value)),
    date: value => (isBlank(value) ? null : dayOf(value)),
    text: value => (isBlank(value) ? null : String(value).trim()),
    flag: value => (isBlank(value) ? null : value === true || value === "true" || Number(value) === 1),
};

const field = (column, audit, read) => ({ column, audit, read });

const readFields = (fields, source) =>
    Object.fromEntries(
        fields.map(spec => [spec.column, READERS[spec.read](source ? source[spec.column] : null)])
    );

const isLive = row => row.status !== "VOIDED" && row.entryType !== "REVERSAL";

const isSynced = row => Boolean(Number(row.booksSynced)) || row.booksSynced === true;

const plainOf = row => (row && typeof row.get === "function" ? row.get({ plain: true }) : { ...row });

const inBooksBy = actor => ({
    booksSynced: true,
    booksSyncedAt: new Date(),
    booksSyncedById: (actor && actor.id) || null,
    booksSyncedByName: (actor && actor.name) || null,
});

const auditEntryOf = ({ audit, actor, action, row, changes, changeReason }) => {
    const context = currentContext() || {};
    const actorId = actor && actor.id != null ? actor.id : context.actorId;
    const reason = isBlank(changeReason) ? [] : [{ field: CHANGE_REASON_FIELD, from: null, to: changeReason }];
    return {
        actorId: actorId == null ? null : actorId,
        source: context.source || ACCOUNTING_PORTAL,
        configType: audit.configType,
        action,
        targetTable: audit.table,
        targetId: row.id,
        targetLabel: String(audit.labelOf(row) || `${audit.table} #${row.id}`).slice(0, LABEL_LIMIT),
        partnerName: audit.partnerName || null,
        ipAddress: context.ipAddress || null,
        changes: [...changes, ...reason],
    };
};

const writeAudit = (entry, transaction) => configAuditLog.create(entry, { transaction });

const findAny = ({ model, where, transaction }) =>
    model.findOne({ where, transaction, lock: true, paranoid: false });

const loadLiveRow = async ({ model, where, guard, transaction }) => {
    const row = await findAny({ model, where, transaction });
    if (!row) return { outcome: OUTCOMES.missing };
    if (plainOf(row).deletedAt) return { outcome: OUTCOMES.pendingRemoval };
    if (!isLive(row)) return { outcome: OUTCOMES.reversed };
    const refusal = guard ? guard(row) : null;
    if (refusal) return { outcome: OUTCOMES.refused, reason: refusal };
    return { row };
};

const editEntry = ({ model, where, fields, values, slip, actor, changeReason, audit, guard }) =>
    sequelizeConfig.transaction(async transaction => {
        const loaded = await loadLiveRow({ model, where, guard, transaction });
        if (!loaded.row) return loaded;

        const { row } = loaded;
        const current = plainOf(row);
        const before = readFields(fields, current);
        const after = readFields(fields, values);
        const moved = fields.filter(spec => before[spec.column] !== after[spec.column]);
        const changes = moved.map(spec => ({
            field: spec.audit,
            from: before[spec.column],
            to: after[spec.column],
        }));
        const patch = Object.fromEntries(moved.map(spec => [spec.column, after[spec.column]]));
        if (slip) {
            changes.push({ field: DOCUMENT_FIELD, from: current.slipName || null, to: slip.name });
            Object.assign(patch, { slipKey: slip.key, slipName: slip.name, slipFormat: slip.format });
        }
        if (!changes.length) return { outcome: OUTCOMES.unchanged };

        if (isSynced(current)) changes.push({ field: BOOKS_FIELD, from: true, to: false });
        Object.assign(patch, NOT_IN_BOOKS);

        await row.update(patch, { transaction });
        const updated = { ...current, ...patch };
        await writeAudit(
            auditEntryOf({ audit, actor, action: "UPDATE", row: updated, changes, changeReason }),
            transaction
        );
        return { outcome: OUTCOMES.updated, row: updated };
    });

const deleteEntry = ({ model, where, fields, actor, changeReason, audit, guard }) =>
    sequelizeConfig.transaction(async transaction => {
        const loaded = await loadLiveRow({ model, where, guard, transaction });
        if (!loaded.row) return loaded;

        const { row } = loaded;
        const current = plainOf(row);
        const before = readFields(fields, current);
        const changes = fields
            .filter(spec => before[spec.column] !== null)
            .map(spec => ({ field: spec.audit, from: before[spec.column], to: null }));
        if (current.slipName) {
            changes.push({ field: DOCUMENT_FIELD, from: current.slipName, to: null });
        }

        const patch = {
            ...NOT_IN_BOOKS,
            deletedById: (actor && actor.id) || null,
            deletedByName: (actor && actor.name) || null,
            deleteReason: changeReason || null,
        };
        await row.update(patch, { transaction });
        await row.destroy({ transaction });
        const deleted = { ...current, ...patch, deletedAt: plainOf(row).deletedAt || new Date() };
        await writeAudit(
            auditEntryOf({ audit, actor, action: "DELETE", row: current, changes, changeReason }),
            transaction
        );
        return { outcome: OUTCOMES.deleted, row: deleted };
    });

const tagBooks = ({ model, where, synced, actor, audit }) =>
    sequelizeConfig.transaction(async transaction => {
        const row = await findAny({ model, where, transaction });
        if (!row) return { outcome: OUTCOMES.missing };

        const current = plainOf(row);
        if (current.deletedAt) {
            if (!synced) return { outcome: OUTCOMES.unchanged, row: current };
            await row.destroy({ force: true, transaction });
            await writeAudit(
                auditEntryOf({
                    audit,
                    actor,
                    action: "UPDATE",
                    row: current,
                    changes: [
                        { field: BOOKS_FIELD, from: false, to: true },
                        { field: REMOVED_FIELD, from: false, to: true },
                    ],
                }),
                transaction
            );
            return { outcome: OUTCOMES.removed, row: current };
        }

        if (isSynced(current) === Boolean(synced)) return { outcome: OUTCOMES.unchanged, row: current };

        const patch = synced ? inBooksBy(actor) : NOT_IN_BOOKS;
        await row.update(patch, { transaction });
        const updated = { ...current, ...patch };
        await writeAudit(
            auditEntryOf({
                audit,
                actor,
                action: "UPDATE",
                row: updated,
                changes: [{ field: BOOKS_FIELD, from: !synced, to: Boolean(synced) }],
            }),
            transaction
        );
        return { outcome: OUTCOMES.updated, row: updated };
    });

const earliestDate = dates => {
    const days = dates.filter(date => !isBlank(date)).map(dayOf).sort();
    return days.length ? days[0] : null;
};

const booksFieldsOf = plain => ({
    booksSynced: isSynced(plain),
    booksSyncedAt: plain.booksSyncedAt || null,
    booksSyncedByName: plain.booksSyncedByName || null,
    deleted: Boolean(plain.deletedAt),
    deletedAt: plain.deletedAt || null,
    deletedByName: plain.deletedByName || null,
    deleteReason: plain.deleteReason || null,
});

module.exports = {
    OUTCOMES,
    CHANGE_REASON_FIELD,
    DOCUMENT_FIELD,
    field,
    editEntry,
    deleteEntry,
    tagBooks,
    earliestDate,
    booksFieldsOf,
};
