const {
    ONE_TIME_ITEM_KEYS,
    isOneTimeItemOperator,
    isOneTimeItemOrder,
    withOneTimeItemKeys,
} = require("../oneTimeItems");

describe("one-time items", () => {
    it("lists Corporate Cards by the access key the operator data carries", () => {
        expect(ONE_TIME_ITEM_KEYS).toEqual(["corporate_cards"]);
    });

    it("tests an operator column null-safely, on whatever alias the query uses", () => {
        expect(isOneTimeItemOperator()).toBe(
            "(COALESCE(serviceOperators.accessKey, '') IN (:oneTimeItemKeys))"
        );
        expect(isOneTimeItemOperator("serviceOperator.accessKey")).toBe(
            "(COALESCE(serviceOperator.accessKey, '') IN (:oneTimeItemKeys))"
        );
    });

    it("tests an order with no operator join, so an order without an operator never matches", () => {
        expect(isOneTimeItemOrder()).toBe(
            "COALESCE(orders.serviceOperatorId IN (SELECT id FROM serviceOperators WHERE accessKey IN (:oneTimeItemKeys)), false)"
        );
        expect(isOneTimeItemOrder("o.serviceOperatorId")).toContain("COALESCE(o.serviceOperatorId IN (");
    });

    it("binds the keys without touching the replacements it was given", () => {
        const given = { accountingFloor: "2026-01-01" };

        expect(withOneTimeItemKeys(given)).toEqual({
            accountingFloor: "2026-01-01",
            oneTimeItemKeys: ["corporate_cards"],
        });
        expect(given).toEqual({ accountingFloor: "2026-01-01" });
        expect(withOneTimeItemKeys()).toEqual({ oneTimeItemKeys: ["corporate_cards"] });
    });
});
