const { applyApprovalGate, collectLeafAccessKeys } = require("../approvalGate");

const tree = () => [
    { label: "Dashboard", hasAccess: true, alias: "Home", icon: "<svg/>", subServices: [] },
    {
        label: "Utility Payments",
        hasAccess: true,
        icon: "<svg/>",
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", serviceProviderId: 5, hasAccess: true },
            {
                label: "Telecom",
                hasAccess: true,
                subServices: [{ label: "Prepaid", accessKey: "REDACTED", hasAccess: true }],
            },
        ],
    },
    {
        label: "Tax & More",
        hasAccess: true,
        subServices: [],
        services: [{ label: "GST Filing", hasAccess: true }, { label: "TDS Filing", accessKey: "tds_filing", hasAccess: true }],
    },
    { label: "Logistics", accessKey: "shipment_services", hasAccess: true, enableMoreService: true, alias: "Shipping", subServices: [] },
    { label: "Need Help", hasAccess: true, subServices: [{ label: "Tickets", accessKey: "tickets", hasAccess: true }] },
];

const withAccess = (nodes, label, hasAccess) =>
    nodes.map(node => {
        const copy = { ...node };
        if (copy.label === label) copy.hasAccess = hasAccess;
        if (Array.isArray(copy.subServices)) copy.subServices = withAccess(copy.subServices, label, hasAccess);
        if (Array.isArray(copy.services)) copy.services = withAccess(copy.services, label, hasAccess);
        return copy;
    });

describe("the gate and the shape of the partner tree", () => {
    it("changes only the hasAccess of the blocked leaves, leaving every other key, value and order as it was", () => {
        const nodes = tree();

        applyApprovalGate(nodes, new Set(["JRI_prepaid", "shipment_services"]));

        let expected = withAccess(tree(), "Prepaid", false);
        expected = withAccess(expected, "Logistics", false);
        expect(JSON.stringify(nodes)).toBe(JSON.stringify(expected));
    });

    it("reaches a service however deep it sits, under subServices or the legacy services key, even side by side", () => {
        const nodes = tree();

        applyApprovalGate(nodes, new Set(["tds_filing", "JRI_prepaid"]));

        expect(nodes[2].services[1].hasAccess).toBe(false);
        expect(nodes[1].subServices[1].subServices[0].hasAccess).toBe(false);
        expect([...collectLeafAccessKeys(tree())]).toEqual([
            "bbps_utility_electricity",
            "JRI_prepaid",
            "tds_filing",
            "shipment_services",
        ]);
    });

    it("never touches a parent, a platform section, or a leaf the gate does not name", () => {
        const nodes = tree();

        applyApprovalGate(nodes, new Set(["tickets", "bbps_utility_electricity"]));

        expect(nodes[1].hasAccess).toBe(true);
        expect(nodes[1].subServices[1].hasAccess).toBe(true);
        expect(nodes[4].subServices[0].hasAccess).toBe(true);
        expect(nodes[1].subServices[0].hasAccess).toBe(false);
        expect(JSON.stringify(nodes)).toBe(JSON.stringify(withAccess(tree(), "Electricity Bill", false)));
    });

    it("hands the same array back, so callers keep working on the object they passed in", () => {
        const nodes = tree();

        expect(applyApprovalGate(nodes, new Set())).toBe(nodes);
        expect(JSON.stringify(nodes)).toBe(JSON.stringify(tree()));
    });
});
