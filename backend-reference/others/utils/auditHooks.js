const { QueryTypes } = require("sequelize");
const logger = require("./logger");
const { canonical } = require("./configuredFlag");
const { currentContext } = require("./requestContext");
const { specOf, specOfTable, accessKeyOfTable, displayValue } = require("./auditedModels");

const PENDING = "configAuditPending";

const byId = rows => new Map(rows.map(row => [String(row.id), row]));

const LABEL_LIMIT = 255;

const labelOf = (info, spec, id) =>
    ([info && info.parent, info && info.name].filter(Boolean).join(" › ") || `${spec.table} #${id}`).slice(
        0,
        LABEL_LIMIT
    );

const describeRows = async (sequelize, spec, ids, accessKey, transaction) => {
    try {
        const rows = await sequelize.query(spec.describe, {
            replacements: { ids, accessKey: accessKey || null },
            type: QueryTypes.SELECT,
            transaction,
        });
        return byId(rows);
    } catch (error) {
        logger.warn("Audit trail could not name the changed rows", { table: spec.table, error });
        return new Map();
    }
};

const diffRows = (spec, before, after) => {
    const found = [];
    after.forEach((afterRow, key) => {
        const beforeRow = before.get(key);
        if (!beforeRow) return;
        Object.entries(spec.groups).forEach(([configType, fields]) => {
            const changes = fields
                .filter(field => canonical(beforeRow[field]) !== canonical(afterRow[field]))
                .map(field => ({
                    field,
                    from: displayValue(field, beforeRow[field]),
                    to: displayValue(field, afterRow[field]),
                }));
            if (changes.length) found.push({ id: afterRow.id, configType, changes });
        });
    });
    return found;
};

const lifecycleFound = (spec, rows, action) =>
    rows.map(row => ({
        id: row.id,
        configType: spec.lifecycle,
        changes: spec.tracked
            .filter(field => canonical(row[field]) !== null)
            .map(field => ({
                field,
                from: action === "CREATE" ? null : displayValue(field, row[field]),
                to: action === "CREATE" ? displayValue(field, row[field]) : null,
            })),
    }));

const toEntries = ({ context, spec, found, infos, action }) =>
    found.map(({ id, configType, changes }) => {
        const info = infos.get(String(id));
        return {
            actorId: context.actorId,
            source: context.source,
            configType,
            action,
            targetTable: spec.table,
            targetId: id,
            targetLabel: labelOf(info, spec, id),
            partnerName: (info && info.partner) || null,
            ipAddress: context.ipAddress || null,
            changes,
        };
    });

// A change inside a transaction is saved once it commits, so a rollback leaves no entry. A failed
// save is logged and never reaches the configuration change itself.
const deliver = async (entries, transaction) => {
    if (!entries.length) return;
    const write = async () => {
        try {
            const { saveAuditEntries } = require("../models/use-cases/configAuditLog");
            await saveAuditEntries(entries);
        } catch (error) {
            logger.error("Configuration audit entries could not be saved", { error, count: entries.length });
        }
    };
    if (transaction && typeof transaction.afterCommit === "function") transaction.afterCommit(write);
    else await write();
};

const record = async ({ sequelize, spec, found, action = "UPDATE", accessKey, infos, transaction }) => {
    const context = currentContext();
    if (!context || !found.length) return;
    const ids = [...new Set(found.map(item => item.id))];
    const named = infos || (await describeRows(sequelize, spec, ids, accessKey, transaction));
    await deliver(toEntries({ context, spec, found, infos: named, action }), transaction);
};

const readRows = (model, spec, where, transaction) =>
    model.findAll({ where, attributes: ["id", ...spec.tracked], raw: true, transaction });

const touchesTracked = (spec, values) => Object.keys(values || {}).some(field => spec.tracked.includes(field));

const snapshot = (spec, instance) => ({
    id: instance.id,
    ...Object.fromEntries(spec.tracked.map(field => [field, instance.get(field)])),
});

const captureUpdate = async options => {
    const spec = specOf(options.model);
    if (!spec || !currentContext()) return;
    if (!touchesTracked(spec, options.attributes)) return;
    options[PENDING] = byId(await readRows(options.model, spec, options.where, options.transaction));
};

const logBulkUpdate = async options => {
    const before = options[PENDING];
    if (!before) return;
    delete options[PENDING];
    if (!before.size) return;
    const spec = specOf(options.model);
    const ids = [...before.values()].map(row => row.id);
    const after = byId(await readRows(options.model, spec, { id: ids }, options.transaction));
    await record({
        sequelize: options.model.sequelize,
        spec,
        found: diffRows(spec, before, after),
        accessKey: accessKeyOfTable(spec.table),
        transaction: options.transaction,
    });
};

const logCreate = async (instance, options) => {
    const model = instance.constructor;
    const spec = specOf(model);
    if (!spec || !spec.lifecycle || !currentContext()) return;
    await record({
        sequelize: model.sequelize,
        spec,
        found: lifecycleFound(spec, [snapshot(spec, instance)], "CREATE"),
        action: "CREATE",
        transaction: options && options.transaction,
    });
};

const captureDestroy = async options => {
    const spec = specOf(options.model);
    if (!spec || !spec.lifecycle || !currentContext()) return;
    const rows = await readRows(options.model, spec, options.where, options.transaction);
    const infos = rows.length
        ? await describeRows(
              options.model.sequelize,
              spec,
              rows.map(row => row.id),
              accessKeyOfTable(spec.table),
              options.transaction
          )
        : new Map();
    options[PENDING] = { rows, infos };
};

const logBulkDestroy = async options => {
    const pending = options[PENDING];
    if (!pending) return;
    delete options[PENDING];
    const spec = specOf(options.model);
    await record({
        sequelize: options.model.sequelize,
        spec,
        found: lifecycleFound(spec, pending.rows, "DELETE"),
        action: "DELETE",
        infos: pending.infos,
        transaction: options.transaction,
    });
};

const safely = (name, hook) => async (...args) => {
    try {
        await hook(...args);
    } catch (error) {
        logger.error(`Configuration audit hook ${name} failed`, { error });
    }
};

const HOOKS = [
    ["beforeBulkUpdate", captureUpdate],
    ["afterBulkUpdate", logBulkUpdate],
    ["afterCreate", logCreate],
    ["beforeBulkDestroy", captureDestroy],
    ["afterBulkDestroy", logBulkDestroy],
];

const registerAuditHooks = sequelize => {
    if (!sequelize || typeof sequelize.addHook !== "function") return;
    HOOKS.forEach(([type, hook]) => sequelize.addHook(type, `configAudit:${type}`, safely(type, hook)));
};

const readTableRows = (sequelize, spec, ids) =>
    sequelize.query(`SELECT id, ${spec.tracked.join(", ")} FROM ${spec.table} WHERE id IN (:ids)`, {
        replacements: { ids },
        type: QueryTypes.SELECT,
    });

// For writes made with raw SQL, which no hook sees: reads the rows around the write and records
// what changed. Outside a request (a script, a queue job) it only runs the write.
const auditRawUpdate = async ({ sequelize, table, ids, accessKey, run }) => {
    const spec = specOfTable(table);
    if (!spec || !currentContext()) return run();

    let before = null;
    try {
        before = byId(await readTableRows(sequelize, spec, ids));
    } catch (error) {
        logger.error("Configuration audit could not read the rows before a raw update", { table, error });
    }

    const result = await run();

    if (before) {
        await safely("raw update", async () => {
            const after = byId(await readTableRows(sequelize, spec, ids));
            await record({ sequelize, spec, found: diffRows(spec, before, after), accessKey });
        })();
    }
    return result;
};

// For a setting that keeps its values as keys inside one JSON column (an add-on's details): there is no column
// for the hooks to compare, so the caller hands over those keys before and after the write. Like the hooks, it
// never reaches the change itself, and outside a request (a script, a queue job) it records nothing.
const auditSettingChange = ({ sequelize, spec, id, accessKey, name, before, after }) =>
    safely("setting change", async () => {
        if (!currentContext()) return;
        const found = diffRows(spec, byId([{ id, ...before }]), byId([{ id, ...after }]));
        if (!found.length) return;
        const [service] = await sequelize.query(
            "SELECT serviceProvider FROM serviceOperators WHERE accessKey = :accessKey LIMIT 1",
            { replacements: { accessKey }, type: QueryTypes.SELECT }
        );
        const infos = new Map([[String(id), { parent: service && service.serviceProvider, name, partner: null }]]);
        await record({ sequelize, spec, found, infos });
    })();

module.exports = { registerAuditHooks, auditRawUpdate, auditSettingChange };
