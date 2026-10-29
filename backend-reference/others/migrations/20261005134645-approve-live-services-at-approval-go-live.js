"use strict";

const {
    CONFIG_SETTING,
    CHUNK_SIZE,
    parseTree,
    listedKeysOf,
    collectApprovedNodes,
    grandfatherEntry,
} = require("./20260926000002-grandfather-service-approvals");

const TABLE = "serviceApprovals";
const TREES = "partnerPermissions";
const SETTINGS = "settings";

const parseJson = value => {
    if (value && typeof value === "object") return value;
    if (typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const isActiveTree = tree =>
    tree.status === null || tree.status === undefined || tree.status === true || Number(tree.status) === 1;

const knownKeysOf = approvals => new Set(approvals.map(entry => entry && entry.accessKey).filter(Boolean));

const missingNodesOf = (tree, listedKeys, approvals) => {
    const known = knownKeysOf(approvals);
    return collectApprovedNodes(tree.permissions, listedKeys).filter(node => !known.has(node.accessKey));
};

const chunksOf = (rows, size) => {
    const chunks = [];
    for (let start = 0; start < rows.length; start += size) {
        chunks.push(rows.slice(start, start + size));
    }
    return chunks;
};

module.exports = {
    isActiveTree,
    missingNodesOf,

    async up(queryInterface) {
        if (!(await queryInterface.tableExists(TABLE))) return;

        const [settingRows] = await queryInterface.sequelize.query(
            `SELECT details FROM \`${SETTINGS}\` WHERE name = '${CONFIG_SETTING}' LIMIT 1`
        );
        const listedKeys = listedKeysOf(parseJson(settingRows[0] && settingRows[0].details));
        if (!listedKeys.size) return;

        const [trees] = await queryInterface.sequelize.query(
            `SELECT id, registeredBy, permissions, status FROM \`${TREES}\``
        );
        const [rows] = await queryInterface.sequelize.query(
            `SELECT id, partnerPermissionId, approvals FROM \`${TABLE}\``
        );
        const rowOf = new Map(rows.map(row => [Number(row.partnerPermissionId), row]));
        const at = new Date().toISOString();

        const inserts = [];
        for (const tree of trees.filter(isActiveTree)) {
            const row = rowOf.get(Number(tree.id));
            const approvals = row ? parseTree(row.approvals) : [];
            const entries = missingNodesOf(tree, listedKeys, approvals).map(node => grandfatherEntry(node, at));
            if (!entries.length) continue;

            if (row) {
                await queryInterface.sequelize.query(
                    `UPDATE \`${TABLE}\` SET approvals = ?, updatedAt = NOW() WHERE id = ?`,
                    { replacements: [JSON.stringify([...approvals, ...entries]), row.id] }
                );
            } else {
                inserts.push({
                    partnerPermissionId: tree.id,
                    registeredBy: tree.registeredBy === undefined ? null : tree.registeredBy,
                    approvals: entries,
                });
            }
        }

        for (const chunk of chunksOf(inserts, CHUNK_SIZE)) {
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

    async down() {},
};
