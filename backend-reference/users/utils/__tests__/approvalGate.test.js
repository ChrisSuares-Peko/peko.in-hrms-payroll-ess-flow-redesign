const {
    PLATFORM_SECTIONS,
    collectLeafAccessKeys,
    applyApprovalGate,
    filterAccessibleServices,
} = require("../approvalGate");

const tree = () => [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    { label: "Verification Suite", hasAccess: true },
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: " bbps_utility_water ", hasAccess: true },
        ],
    },
    {
        label: "Tax & More",
        hasAccess: true,
        services: [{ label: "GST Filing", hasAccess: true }, { label: "TDS Filing", accessKey: "tds_filing", hasAccess: true }],
    },
    { label: "eSIM", accessKey: "esim_tunz", hasAccess: true, enableMoreService: true },
    { label: "Soundbox", accessKey: "soundbox", hasAccess: true },
    { label: "Reports", hasAccess: true, subServices: [{ label: "Transactions", accessKey: "reports_txn", hasAccess: true }] },
    { label: "Need Help", hasAccess: true, subServices: [{ label: "Tickets", hasAccess: true }] },
];

const leaf = (nodes, label) => {
    const found = [];
    const walk = list =>
        list.forEach(node => {
            if (node.label === label) found.push(node);
            walk(node.subServices || node.services || []);
        });
    walk(nodes);
    return found[0];
};

describe("collectLeafAccessKeys", () => {
    it("collects the keys of the leaves connected to a service operator, trimmed, at any depth", () => {
        expect([...collectLeafAccessKeys(tree())]).toEqual([
            "bbps_utility_electricity",
            "bbps_utility_water",
            "tds_filing",
            "esim_tunz",
            "soundbox",
        ]);
    });

    it("leaves the platform sections out even when their items carry a key", () => {
        expect(PLATFORM_SECTIONS).toEqual(["Dashboard", "Reports", "Need Help", "Settings"]);
        expect(collectLeafAccessKeys(tree()).has("reports_txn")).toBe(false);
    });
});

describe("applyApprovalGate", () => {
    it("switches off exactly the leaves whose key the gate blocks", () => {
        const nodes = tree();

        applyApprovalGate(nodes, new Set(["bbps_utility_water", "tds_filing", "esim_tunz", "reports_txn", "not_in_tree"]));

        expect(leaf(nodes, "Electricity Bill").hasAccess).toBe(true);
        expect(leaf(nodes, "Water Bill").hasAccess).toBe(false);
        expect(leaf(nodes, "TDS Filing").hasAccess).toBe(false);
        expect(leaf(nodes, "eSIM").hasAccess).toBe(false);
        expect(leaf(nodes, "Soundbox").hasAccess).toBe(true);
        expect(leaf(nodes, "Verification Suite").hasAccess).toBe(true);
        expect(leaf(nodes, "GST Filing").hasAccess).toBe(true);
        expect(leaf(nodes, "Dashboard").hasAccess).toBe(true);
        expect(leaf(nodes, "Transactions").hasAccess).toBe(true);
        expect(leaf(nodes, "Tickets").hasAccess).toBe(true);
        expect(leaf(nodes, "Utility Payments").hasAccess).toBe(true);
    });

    it("touches nothing when the gate blocks nothing", () => {
        const nodes = tree();

        applyApprovalGate(nodes, new Set());

        expect(JSON.stringify(nodes)).toBe(JSON.stringify(tree()));
    });

    it("keeps an already switched-off leaf off, and returns the same tree", () => {
        const nodes = tree();
        leaf(nodes, "eSIM").hasAccess = false;

        const result = applyApprovalGate(nodes, new Set());

        expect(result).toBe(nodes);
        expect(leaf(nodes, "eSIM").hasAccess).toBe(false);
    });

    it("copes with nulls and a non-array tree", () => {
        expect(applyApprovalGate(null, new Set(["x"]))).toBeNull();
        expect(applyApprovalGate([null, { label: "X", accessKey: "x", hasAccess: true }], new Set(["x"]))[1].hasAccess).toBe(false);
    });
});

describe("filterAccessibleServices", () => {
    it("drops only the blocked keys that are leaves of this tree", () => {
        const keys = ["bbps_utility_electricity", "bbps_utility_water", "esim_tunz", "soundbox", "not_in_tree"];

        expect(filterAccessibleServices(keys, tree(), new Set(["bbps_utility_water", "esim_tunz", "not_in_tree"]))).toEqual([
            "bbps_utility_electricity",
            "soundbox",
            "not_in_tree",
        ]);
    });

    it("keeps everything when nothing is blocked and tolerates a missing list", () => {
        expect(filterAccessibleServices(["esim_tunz", "other"], tree(), new Set())).toEqual(["esim_tunz", "other"]);
        expect(filterAccessibleServices(undefined, tree(), new Set(["esim_tunz"]))).toEqual([]);
    });
});
