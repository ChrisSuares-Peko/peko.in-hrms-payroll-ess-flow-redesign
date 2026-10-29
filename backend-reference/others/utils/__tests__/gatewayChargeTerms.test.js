const { gatewayChargeTermsOf, gatewayChargeOn } = require("../gatewayChargeTerms");

describe("a partner's gateway charge terms", () => {
    it("reads the two values whether stored parsed or as text, and nothing when unset", () => {
        expect(gatewayChargeTermsOf({ percentage: "1.95", fixed: "3" })).toEqual({ percentage: 1.95, fixed: 3 });
        expect(gatewayChargeTermsOf('{"percentage":2,"fixed":5}')).toEqual({ percentage: 2, fixed: 5 });
        expect(gatewayChargeTermsOf(null)).toBeNull();
        expect(gatewayChargeTermsOf(undefined)).toBeNull();
        expect(gatewayChargeTermsOf("not json")).toBeNull();
        expect(gatewayChargeTermsOf({})).toEqual({ percentage: 0, fixed: 0 });
    });

    it("charges a percentage of what went through the gateway plus the fixed sum, only when something did", () => {
        const terms = { percentage: 1.95, fixed: 3 };
        expect(gatewayChargeOn(terms, 1000)).toBe(22.5);
        expect(gatewayChargeOn(terms, 333.33)).toBe(9.5);
        expect(gatewayChargeOn(terms, 0)).toBe(0);
        expect(gatewayChargeOn(terms, null)).toBe(0);
        expect(gatewayChargeOn(null, 1000)).toBe(0);
    });
});
