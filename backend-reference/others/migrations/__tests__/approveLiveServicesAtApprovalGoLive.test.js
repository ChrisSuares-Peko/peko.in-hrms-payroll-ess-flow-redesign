const migration = require("../20261005134645-approve-live-services-at-approval-go-live");
const { GRANDFATHER_NOTE, SYSTEM_ACTOR, CONFIG_SETTING, CHUNK_SIZE, listedKeysOf } = require("../20260926000002-grandfather-service-approvals");

const { isActiveTree, missingNodesOf } = migration;

const TREE = [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    { label: "Soundbox", accessKey: "soundbox", hasAccess: true },
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: "bbps_utility_water", hasAccess: false },
        ],
    },
    { label: "Visa", accessKey: "visa", hasAccess: true },
];

const CONFIG = { service_with_plans: ["visa"], service_without_plans: ["bbps_utility_electricity", "bbps_utility_water"] };
const LISTED = listedKeysOf(CONFIG);

const queryInterface = () => ({ tableExists: jest.fn(), sequelize: { query: jest.fn() } });

const answering = ({ config = CONFIG, trees = [], rows = [] } = {}) => sql => {
    if (sql.includes("FROM `settings`")) return Promise.resolve([config === null ? [] : [{ details: config }]]);
    if (sql.includes("FROM `partnerPermissions`")) return Promise.resolve([trees]);
    if (sql.includes("FROM `serviceApprovals`")) return Promise.resolve([rows]);
    return Promise.resolve([[]]);
};

const writesOf = qi => qi.sequelize.query.mock.calls.filter(([sql]) => sql.startsWith("UPDATE") || sql.startsWith("INSERT"));

beforeEach(() => jest.clearAllMocks());

describe("isActiveTree", () => {
    it("treats a missing status as active and only an explicit off as inactive", () => {
        expect(isActiveTree({ status: undefined })).toBe(true);
        expect(isActiveTree({ status: null })).toBe(true);
        expect(isActiveTree({ status: 1 })).toBe(true);
        expect(isActiveTree({ status: true })).toBe(true);
        expect(isActiveTree({ status: 0 })).toBe(false);
        expect(isActiveTree({ status: false })).toBe(false);
    });
});

describe("missingNodesOf", () => {
    it("keeps the switched-on classified leaves the row does not know yet", () => {
        const approvals = [{ accessKey: "visa", status: "REJECTED" }, null, { status: "APPROVED" }];

        expect(missingNodesOf({ permissions: TREE }, LISTED, approvals).map(node => node.accessKey)).toEqual([
            "bbps_utility_electricity",
        ]);
        expect(missingNodesOf({ permissions: TREE }, LISTED, []).map(node => node.accessKey)).toEqual([
            "bbps_utility_electricity",
            "visa",
        ]);
    });
});

describe("up", () => {
    it("does nothing until the table exists", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(false);

        await migration.up(qi);

        expect(qi.sequelize.query).not.toHaveBeenCalled();
    });

    it("stops after the setting when nothing is classified yet", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        qi.sequelize.query.mockImplementation(answering({ config: null, trees: [{ id: 1, permissions: TREE }] }));

        await migration.up(qi);

        expect(qi.sequelize.query).toHaveBeenCalledTimes(1);
        expect(qi.sequelize.query.mock.calls[0][0]).toContain(`FROM \`settings\` WHERE name = '${CONFIG_SETTING}'`);
    });

    it("completes a tree that already has a row and creates the row for one that has none", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        qi.sequelize.query.mockImplementation(
            answering({
                config: JSON.stringify(CONFIG),
                trees: [
                    { id: 1, registeredBy: null, permissions: TREE, status: 1 },
                    { id: 12, registeredBy: "77", permissions: JSON.stringify(TREE), status: null },
                ],
                rows: [{ id: 5, partnerPermissionId: "1", approvals: [{ accessKey: "visa", status: "REJECTED", history: [] }] }],
            })
        );

        await migration.up(qi);

        const writes = writesOf(qi);
        expect(writes).toHaveLength(2);

        const [updateSql, updateOptions] = writes[0];
        expect(updateSql).toContain("UPDATE `serviceApprovals` SET approvals = ?, updatedAt = NOW() WHERE id = ?");
        const [approvals, id] = updateOptions.replacements;
        expect(id).toBe(5);
        expect(JSON.parse(approvals).map(entry => [entry.accessKey, entry.status, entry.decidedByName])).toEqual([
            ["visa", "REJECTED", undefined],
            ["bbps_utility_electricity", "APPROVED", SYSTEM_ACTOR],
        ]);

        const [insertSql, insertOptions] = writes[1];
        expect(insertSql).toContain("INSERT INTO `serviceApprovals` (partnerPermissionId, registeredBy, approvals, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())");
        const [partnerPermissionId, registeredBy, inserted] = insertOptions.replacements;
        expect([partnerPermissionId, registeredBy]).toEqual([12, "77"]);
        expect(JSON.parse(inserted).map(entry => [entry.accessKey, entry.status, entry.note])).toEqual([
            ["bbps_utility_electricity", "APPROVED", GRANDFATHER_NOTE],
            ["visa", "APPROVED", GRANDFATHER_NOTE],
        ]);
    });

    it("leaves inactive trees and complete rows alone", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        qi.sequelize.query.mockImplementation(
            answering({
                trees: [
                    { id: 1, registeredBy: null, permissions: TREE, status: 0 },
                    { id: 2, registeredBy: "9", permissions: TREE, status: 1 },
                ],
                rows: [
                    {
                        id: 6,
                        partnerPermissionId: 2,
                        approvals: [
                            { accessKey: "visa", status: "APPROVED" },
                            { accessKey: "bbps_utility_electricity", status: "APPROVED" },
                        ],
                    },
                ],
            })
        );

        await migration.up(qi);

        expect(writesOf(qi)).toHaveLength(0);
    });

    it("writes new rows in chunks", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        const trees = Array.from({ length: CHUNK_SIZE + 1 }, (_, index) => ({
            id: index + 1,
            registeredBy: String(index + 1),
            permissions: [{ label: `Service ${index}`, accessKey: `service_${index}`, hasAccess: true }],
        }));
        qi.sequelize.query.mockImplementation(
            answering({ config: { service_without_plans: trees.map((_, index) => `service_${index}`) }, trees })
        );

        await migration.up(qi);

        const inserts = writesOf(qi);
        expect(inserts).toHaveLength(2);
        expect(inserts[0][1].replacements).toHaveLength(CHUNK_SIZE * 3);
        expect(inserts[1][1].replacements).toHaveLength(3);
    });
});

describe("down", () => {
    it("keeps the record of what was live, so it changes nothing", async () => {
        const qi = queryInterface();

        await migration.down(qi);

        expect(qi.sequelize.query).not.toHaveBeenCalled();
    });
});
