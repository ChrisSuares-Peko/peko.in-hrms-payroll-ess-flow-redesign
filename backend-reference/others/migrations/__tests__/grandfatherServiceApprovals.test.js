const migration = require("../20260926000002-grandfather-service-approvals");

const {
    GRANDFATHER_NOTE,
    SYSTEM_ACTOR,
    CONFIG_SETTING,
    CHUNK_SIZE,
    listedKeysOf,
    collectApprovedNodes,
    grandfatherRowsOf,
    isGrandfathered,
} = migration;

const TREE = [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    { label: "Verification Suite", hasAccess: true },
    { label: "Insurance", hasAccess: false },
    { label: "Soundbox", accessKey: "soundbox", hasAccess: true },
    {
        label: "Utility Payments",
        hasAccess: false,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: "bbps_utility_water", hasAccess: false },
        ],
    },
    {
        label: "Tax & More",
        hasAccess: true,
        services: [{ label: "GST Filing", hasAccess: true }],
    },
    { label: "Reports", hasAccess: true, subServices: [{ label: "Transactions", hasAccess: true }] },
    { label: "Corporate Cards", accessKey: "corporate_card", hasAccess: true },
    { label: "Corporate Cards", accessKey: "corporate_card", hasAccess: true },
];

const CONFIG = {
    service_with_plans: ["corporate_card"],
    service_without_plans: ["bbps_utility_electricity", "bbps_utility_water", "visa", ""],
};
const LISTED = listedKeysOf(CONFIG);

const AT = "2026-09-26T00:00:00.000Z";

const queryInterface = () => {
    const sequelize = { query: jest.fn() };
    return { tableExists: jest.fn(), sequelize };
};

const answering = ({ config = CONFIG, trees = [], existing = [] } = {}) => sql => {
    if (sql.includes("FROM `settings`")) return Promise.resolve([config === null ? [] : [{ details: config }]]);
    if (sql.includes("FROM `partnerPermissions`")) return Promise.resolve([trees]);
    if (sql.includes("SELECT partnerPermissionId")) return Promise.resolve([existing]);
    return Promise.resolve([[]]);
};

const insertsOf = qi => qi.sequelize.query.mock.calls.filter(([sql]) => sql.includes("INSERT INTO `serviceApprovals`"));

beforeEach(() => jest.clearAllMocks());

describe("listedKeysOf", () => {
    it("unions both arrays of the services type setting, trimmed, and copes with a missing one", () => {
        expect([...LISTED]).toEqual(["corporate_card", "bbps_utility_electricity", "bbps_utility_water", "visa"]);
        expect(listedKeysOf(null).size).toBe(0);
        expect(listedKeysOf({ service_with_plans: "x" }).size).toBe(0);
    });
});

describe("collectApprovedNodes", () => {
    it("collects only switched-on leaves whose key is classified, outside the platform sections", () => {
        expect(collectApprovedNodes(TREE, LISTED)).toEqual([
            {
                accessKey: "bbps_utility_electricity",
                label: "Electricity Bill",
                path: ["Utility Payments", "Electricity Bill"],
            },
            { accessKey: "corporate_card", label: "Corporate Cards", path: ["Corporate Cards"] },
        ]);
        expect(collectApprovedNodes(TREE, LISTED).map(node => node.accessKey)).not.toContain("soundbox");
    });

    it("reads a stringified tree and ignores garbage", () => {
        expect(collectApprovedNodes(JSON.stringify(TREE), LISTED).length).toBe(2);
        expect(collectApprovedNodes("nope", LISTED)).toEqual([]);
        expect(collectApprovedNodes(TREE, new Set())).toEqual([]);
    });
});

describe("grandfatherRowsOf", () => {
    it("builds one row per tree holding an approved entry per switched-on listed service, and skips trees with none", () => {
        const rows = grandfatherRowsOf(
            [
                { id: 1, registeredBy: null, permissions: TREE },
                {
                    id: 7,
                    registeredBy: "100002226",
                    permissions: [{ label: "Insurance", hasAccess: true }, { label: "Visa", accessKey: "visa", hasAccess: true }],
                },
                { id: 9, permissions: [{ label: "Soundbox", accessKey: "soundbox", hasAccess: true }] },
            ],
            AT,
            LISTED
        );

        expect(rows.map(row => [row.partnerPermissionId, row.registeredBy, row.approvals.length])).toEqual([
            [1, null, 2],
            [7, "100002226", 1],
        ]);
        expect(rows[1].approvals[0]).toEqual({
            accessKey: "visa",
            label: "Visa",
            path: ["Visa"],
            status: "APPROVED",
            decidedById: null,
            decidedByName: SYSTEM_ACTOR,
            decidedAt: AT,
            note: GRANDFATHER_NOTE,
            configHash: null,
            configSnapshot: null,
            history: [{ action: "GRANDFATHERED", fromStatus: null, actorId: null, actorName: SYSTEM_ACTOR, note: GRANDFATHER_NOTE, at: AT }],
        });
        expect(rows[0].approvals.every(isGrandfathered)).toBe(true);
        expect(isGrandfathered({ note: GRANDFATHER_NOTE, decidedByName: "Ibrahim" })).toBe(false);
    });
});

describe("up", () => {
    it("does nothing until the table exists", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(false);

        await migration.up(qi);

        expect(qi.sequelize.query).not.toHaveBeenCalled();
    });

    it("reads the services type setting first and stops when it lists nothing", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        qi.sequelize.query.mockImplementation(answering({ config: null, trees: [{ id: 1, registeredBy: null, permissions: TREE }] }));

        await migration.up(qi);

        expect(qi.sequelize.query).toHaveBeenCalledTimes(1);
        expect(qi.sequelize.query.mock.calls[0][0]).toContain(`FROM \`settings\` WHERE name = '${CONFIG_SETTING}'`);
        expect(insertsOf(qi)).toHaveLength(0);
    });

    it("inserts one row per tree with its approved listed services as JSON, skipping trees that already have a row", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        qi.sequelize.query.mockImplementation(
            answering({
                config: JSON.stringify(CONFIG),
                trees: [
                    { id: 1, registeredBy: null, permissions: TREE },
                    { id: 12, registeredBy: "77", permissions: [{ label: "Visa", accessKey: "visa", hasAccess: true }] },
                ],
                existing: [{ partnerPermissionId: "12" }],
            })
        );

        await migration.up(qi);

        const inserts = insertsOf(qi);
        expect(inserts).toHaveLength(1);
        expect(inserts[0][0]).toContain("(partnerPermissionId, registeredBy, approvals, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())");
        const [partnerPermissionId, registeredBy, approvals] = inserts[0][1].replacements;
        expect([partnerPermissionId, registeredBy]).toEqual([1, null]);
        expect(JSON.parse(approvals).map(entry => [entry.accessKey, entry.status, entry.decidedByName, entry.note])).toEqual([
            ["bbps_utility_electricity", "APPROVED", SYSTEM_ACTOR, GRANDFATHER_NOTE],
            ["corporate_card", "APPROVED", SYSTEM_ACTOR, GRANDFATHER_NOTE],
        ]);
    });

    it("writes the rows in chunks", async () => {
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

        const inserts = insertsOf(qi);
        expect(inserts).toHaveLength(2);
        expect(inserts[0][1].replacements).toHaveLength(CHUNK_SIZE * 3);
        expect(inserts[1][1].replacements).toHaveLength(3);
    });

    it("skips the inserts when no tree has a switched-on listed service", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        qi.sequelize.query.mockImplementation(answering({ trees: [{ id: 1, registeredBy: null, permissions: [{ label: "Soundbox", accessKey: "soundbox", hasAccess: true }] }] }));

        await migration.up(qi);

        expect(insertsOf(qi)).toHaveLength(0);
    });
});

describe("down", () => {
    it("strips the grandfathered entries and deletes rows left empty", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(true);
        const system = { accessKey: "visa", status: "APPROVED", decidedByName: SYSTEM_ACTOR, note: GRANDFATHER_NOTE };
        const human = { accessKey: "esim_tunz", status: "REJECTED", decidedByName: "Ibrahim", note: "no share" };
        qi.sequelize.query.mockImplementation(sql =>
            Promise.resolve(
                sql.startsWith("SELECT")
                    ? [
                          [
                              { id: 1, approvals: [system, human] },
                              { id: 2, approvals: JSON.stringify([system]) },
                              { id: 3, approvals: [human] },
                          ],
                      ]
                    : [[]]
            )
        );

        await migration.down(qi);

        const writes = qi.sequelize.query.mock.calls.slice(1);
        expect(writes).toHaveLength(2);
        expect(writes[0][0]).toContain("UPDATE `serviceApprovals` SET approvals = ?");
        expect(writes[0][1].replacements).toEqual([JSON.stringify([human]), 1]);
        expect(writes[1][0]).toContain("DELETE FROM `serviceApprovals` WHERE id = ?");
        expect(writes[1][1].replacements).toEqual([2]);
    });

    it("does nothing when the approvals table is gone", async () => {
        const qi = queryInterface();
        qi.tableExists.mockResolvedValue(false);

        await migration.down(qi);

        expect(qi.sequelize.query).not.toHaveBeenCalled();
    });
});
