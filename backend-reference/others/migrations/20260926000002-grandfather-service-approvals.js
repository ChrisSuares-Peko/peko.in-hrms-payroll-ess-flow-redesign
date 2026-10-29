"use strict";

const TABLE = "serviceApprovals";
const TREES = "partnerPermissions";
const SETTINGS = "settings";
const CONFIG_SETTING = "servicesTypeConfig";
const CONFIG_FIELDS = ["service_with_plans", "service_without_plans"];

const GRANDFATHER_NOTE = "Live before the approval gate";
const SYSTEM_ACTOR = "system";
const PLATFORM_SECTIONS = ["Dashboard", "Reports", "Need Help", "Settings"];
const CHILD_KEYS = ["subServices", "services"];
const CHUNK_SIZE = 100;

const parseJson = value => {
    if (value && typeof value === "object") return value;
    if (typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const parseTree = raw => {
    const parsed = parseJson(raw);
    return Array.isArray(parsed) ? parsed : [];
};

const listedKeysOf = config =>
    new Set(
        CONFIG_FIELDS.flatMap(field => (config && Array.isArray(config[field]) ? config[field] : []))
            .map(key => (typeof key === "string" ? key.trim() : ""))
            .filter(Boolean)
    );

const childrenOf = node => {
    const key = CHILD_KEYS.find(candidate => Array.isArray(node[candidate]));
    return key ? node[key] : [];
};

const labelOf = node => (typeof node.label === "string" ? node.label.trim() : "");

const accessKeyOf = node =>
    (typeof node.accessKey === "string" && node.accessKey.trim()) || null;

const collectApprovedNodes = (tree, listedKeys) => {
    const nodes = [];
    const seen = new Set();

    const walk = (list, path) => {
        list.forEach(node => {
            if (!node || typeof node !== "object") return;
            const label = labelOf(node);
            if (!path.length && PLATFORM_SECTIONS.includes(label)) return;

            const nodePath = [...path, label];
            const children = childrenOf(node);
            if (children.length) {
                walk(children, nodePath);
                return;
            }
            const accessKey = accessKeyOf(node);
            if (!label || !accessKey || !listedKeys.has(accessKey) || node.hasAccess !== true || seen.has(accessKey)) return;
            seen.add(accessKey);
            nodes.push({ accessKey, label, path: nodePath });
        });
    };

    walk(parseTree(tree), []);
    return nodes;
};

const grandfatherEntry = (node, at) => ({
    accessKey: node.accessKey,
    label: node.label,
    path: node.path,
    status: "APPROVED",
    decidedById: null,
    decidedByName: SYSTEM_ACTOR,
    decidedAt: at,
    note: GRANDFATHER_NOTE,
    configHash: null,
    configSnapshot: null,
    history: [
        {
            action: "GRANDFATHERED",
            fromStatus: null,
            actorId: null,
            actorName: SYSTEM_ACTOR,
            note: GRANDFATHER_NOTE,
            at,
        },
    ],
});

const grandfatherRowsOf = (trees, at, listedKeys) =>
    trees
        .map(tree => ({
            partnerPermissionId: tree.id,
            registeredBy: tree.registeredBy === undefined ? null : tree.registeredBy,
            approvals: collectApprovedNodes(tree.permissions, listedKeys).map(node => grandfatherEntry(node, at)),
        }))
        .filter(row => row.approvals.length);

const isGrandfathered = entry =>
    Boolean(entry) && entry.note === GRANDFATHER_NOTE && entry.decidedByName === SYSTEM_ACTOR;

const chunksOf = (rows, size) => {
    const chunks = [];
    for (let start = 0; start < rows.length; start += size) {
        chunks.push(rows.slice(start, start + size));
    }
    return chunks;
};

module.exports = {
    GRANDFATHER_NOTE,
    SYSTEM_ACTOR,
    CONFIG_SETTING,
    CHUNK_SIZE,
    parseTree,
    listedKeysOf,
    collectApprovedNodes,
    grandfatherEntry,
    grandfatherRowsOf,
    isGrandfathered,

    async up(queryInterface) {
        if (!(await queryInterface.tableExists(TABLE))) return;

        const [settingRows] = await queryInterface.sequelize.query(
            `SELECT details FROM \`${SETTINGS}\` WHERE name = '${CONFIG_SETTING}' LIMIT 1`
        );
        const listedKeys = listedKeysOf(parseJson(settingRows[0] && settingRows[0].details));
        if (!listedKeys.size) return;

        const [trees] = await queryInterface.sequelize.query(
            `SELECT id, registeredBy, permissions FROM \`${TREES}\``
        );
        const [existing] = await queryInterface.sequelize.query(
            `SELECT partnerPermissionId FROM \`${TABLE}\``
        );
        const seeded = new Set(existing.map(row => Number(row.partnerPermissionId)));
        const rows = grandfatherRowsOf(trees, new Date().toISOString(), listedKeys).filter(
            row => !seeded.has(Number(row.partnerPermissionId))
        );

        for (const chunk of chunksOf(rows, CHUNK_SIZE)) {
            await queryInterface.sequelize.query(
                `INSERT INTO \`${TABLE}\` (partnerPermissionId, registeredBy, approvals, createdAt, updatedAt) VALUES ${chunk
                    .map(() => "(?, ?, ?, NOW(), NOW())")
                    .join(", ")}`,
                {
                    replacements: chunk.flatMap(row => [
                        row.partnerPermissionId,
                        row.registeredBy,
                        JSON.stringify(row.approvals),
                    ]),
                }
            );
        }
    },

    async down(queryInterface) {
        if (!(await queryInterface.tableExists(TABLE))) return;

        const [rows] = await queryInterface.sequelize.query(`SELECT id, approvals FROM \`${TABLE}\``);
        for (const row of rows) {
            const approvals = parseTree(row.approvals);
            const remaining = approvals.filter(entry => !isGrandfathered(entry));
            if (remaining.length === approvals.length) continue;
            if (remaining.length) {
                await queryInterface.sequelize.query(
                    `UPDATE \`${TABLE}\` SET approvals = ?, updatedAt = NOW() WHERE id = ?`,
                    { replacements: [JSON.stringify(remaining), row.id] }
                );
            } else {
                await queryInterface.sequelize.query(`DELETE FROM \`${TABLE}\` WHERE id = ?`, {
                    replacements: [row.id],
                });
            }
        }
    },
};
