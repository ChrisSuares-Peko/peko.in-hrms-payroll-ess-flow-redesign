const { PLATFORM_SECTIONS, parseTree, accessKeyOf, listedKeysOf, collectServiceNodes, findNode } = require("../serviceTree");

const TREE = [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    { label: "Verification Suite", hasAccess: true },
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: " bbps_utility_water ", hasAccess: false },
        ],
    },
    {
        label: "Tax & More",
        hasAccess: false,
        services: [
            { label: "GST Filing", hasAccess: true },
            { label: "TDS Filing", accessKey: "tds_filing", hasAccess: true },
        ],
    },
    { label: "Corporate Cards", accessKey: "corporate_card", hasAccess: true },
    { label: "Corporate Cards", accessKey: "peko_corporate_cards", hasAccess: false },
    { label: "Corporate Cards", accessKey: "corporate_card", hasAccess: false },
    { label: "Reports", hasAccess: true, subServices: [{ label: "Transactions", accessKey: "reports_txn", hasAccess: true }] },
    { label: "Need Help", hasAccess: true, subServices: [{ label: "Tickets", hasAccess: true }] },
    { label: "Settings", hasAccess: true, subServices: [{ label: "Security", hasAccess: true }] },
    { label: "", accessKey: "blank_label", hasAccess: true },
    { label: "Blank key", accessKey: "  ", hasAccess: true },
    null,
];

describe("parseTree", () => {
    it("accepts an array, a JSON string of an array, and nothing else", () => {
        expect(parseTree(TREE)).toBe(TREE);
        expect(parseTree(JSON.stringify([{ label: "A" }]))).toEqual([{ label: "A" }]);
        expect(parseTree('{"label":"A"}')).toEqual([]);
        expect(parseTree("not json")).toEqual([]);
        expect(parseTree(null)).toEqual([]);
        expect(parseTree(42)).toEqual([]);
    });
});

describe("accessKeyOf", () => {
    it("trims the key and treats a blank one as no link", () => {
        expect(accessKeyOf({ accessKey: " esim " })).toBe("esim");
        expect(accessKeyOf({ accessKey: "" })).toBeNull();
        expect(accessKeyOf({})).toBeNull();
    });
});

describe("listedKeysOf", () => {
    it("unions both arrays of the services type setting, trimmed and without blanks or non-strings", () => {
        expect([...listedKeysOf({ service_with_plans: ["esim_tunz", " visa "], service_without_plans: ["visa", "", 7, "forex"] })]).toEqual([
            "esim_tunz",
            "visa",
            "forex",
        ]);
    });

    it("answers an empty set for a missing or malformed setting", () => {
        expect(listedKeysOf(null).size).toBe(0);
        expect(listedKeysOf({}).size).toBe(0);
        expect(listedKeysOf({ service_with_plans: "esim_tunz" }).size).toBe(0);
    });
});

describe("collectServiceNodes", () => {
    const nodes = collectServiceNodes(TREE);

    it("lists only the leaves connected to a service operator, in tree order, keyed by their access key", () => {
        expect(nodes.map(node => node.nodeKey)).toEqual([
            "bbps_utility_electricity",
            "bbps_utility_water",
            "tds_filing",
            "corporate_card",
            "peko_corporate_cards",
        ]);
        expect(nodes.map(node => node.order)).toEqual([0, 1, 2, 3, 4]);
        nodes.forEach(node => expect(node.accessKey).toBe(node.nodeKey));
    });

    it("keeps only the classified keys when given the listed set, renumbering the order", () => {
        const listed = new Set(["bbps_utility_water", "corporate_card", "not_in_tree"]);

        expect(collectServiceNodes(TREE, listed).map(node => [node.nodeKey, node.order, node.hasAccess])).toEqual([
            ["bbps_utility_water", 0, false],
            ["corporate_card", 1, true],
        ]);
        expect(collectServiceNodes(TREE, new Set())).toEqual([]);
    });

    it("leaves label-only services alone: they are neither listed nor gated", () => {
        const labels = nodes.map(node => node.label);
        expect(labels).not.toContain("Verification Suite");
        expect(labels).not.toContain("GST Filing");
    });

    it("never lists the platform sections or their items, even when they carry a key", () => {
        expect(PLATFORM_SECTIONS).toEqual(["Dashboard", "Reports", "Need Help", "Settings"]);
        const keys = nodes.map(node => node.nodeKey);
        expect(keys).not.toContain("reports_txn");
        expect(nodes.map(node => node.label)).not.toContain("Dashboard");
    });

    it("treats group nodes as containers and records the group on their leaves", () => {
        expect(nodes.map(node => node.label)).not.toContain("Utility Payments");
        expect(nodes.find(node => node.nodeKey === "bbps_utility_electricity")).toMatchObject({
            label: "Electricity Bill",
            path: ["Utility Payments", "Electricity Bill"],
            group: "Utility Payments",
            hasAccess: true,
        });
        expect(nodes.find(node => node.nodeKey === "corporate_card")).toMatchObject({
            path: ["Corporate Cards"],
            group: null,
        });
    });

    it("walks the legacy services child key and keeps a leaf on even under a parent that is off", () => {
        expect(nodes.find(node => node.nodeKey === "tds_filing")).toMatchObject({
            hasAccess: true,
            group: "Tax & More",
        });
    });

    it("trims access keys and keeps the first occurrence of a duplicate", () => {
        expect(nodes.find(node => node.label === "Water Bill").accessKey).toBe("bbps_utility_water");
        expect(nodes.filter(node => node.label === "Corporate Cards").map(node => [node.nodeKey, node.hasAccess])).toEqual([
            ["corporate_card", true],
            ["peko_corporate_cards", false],
        ]);
    });

    it("drops nodes with a blank label or a blank key", () => {
        expect(nodes.some(node => node.nodeKey === "blank_label")).toBe(false);
        expect(nodes.some(node => node.label === "Blank key")).toBe(false);
    });

    it("reads a JSON string tree and answers nothing for garbage", () => {
        expect(collectServiceNodes(JSON.stringify(TREE)).length).toBe(nodes.length);
        expect(collectServiceNodes("oops")).toEqual([]);
        expect(collectServiceNodes(undefined)).toEqual([]);
    });

    it("reports hasAccess only for an explicit true", () => {
        const [leaf] = collectServiceNodes([{ label: "Insurance", accessKey: "insurance", hasAccess: 1 }]);
        expect(leaf.hasAccess).toBe(false);
    });
});

describe("findNode", () => {
    it("finds a leaf by its key, within the listed set when given, and answers null otherwise", () => {
        expect(findNode(TREE, "tds_filing").label).toBe("TDS Filing");
        expect(findNode(TREE, "tds_filing", new Set(["corporate_card"]))).toBeNull();
        expect(findNode(TREE, "corporate_card", new Set(["corporate_card"])).label).toBe("Corporate Cards");
        expect(findNode(TREE, "Verification Suite")).toBeNull();
        expect(findNode(TREE, "missing")).toBeNull();
    });
});
