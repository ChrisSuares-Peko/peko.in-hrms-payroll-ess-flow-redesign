const { collectServiceNodes } = require("../serviceTree");

describe("collectServiceNodes and a node carrying both child keys", () => {
    it("walks subServices and the legacy services key together, so no inner service is missed", () => {
        const tree = [
            {
                label: "Tax & More",
                hasAccess: true,
                subServices: [],
                services: [{ label: "TDS Filing", accessKey: "tds_filing", hasAccess: true }],
            },
            {
                label: "Utility Payments",
                hasAccess: true,
                subServices: [{ label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true }],
                services: [{ label: "Water Bill", accessKey: "bbps_utility_water", hasAccess: false }],
            },
        ];

        expect(collectServiceNodes(tree).map(node => [node.accessKey, node.path.join(" › "), node.hasAccess])).toEqual([
            ["tds_filing", "Tax & More › TDS Filing", true],
            ["bbps_utility_electricity", "Utility Payments › Electricity Bill", true],
            ["bbps_utility_water", "Utility Payments › Water Bill", false],
        ]);
    });
});
