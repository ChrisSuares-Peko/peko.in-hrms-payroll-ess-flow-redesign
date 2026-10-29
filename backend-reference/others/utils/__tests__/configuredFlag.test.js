const { customLog } = require("../loggerHelper");
const {
    OPERATOR_COMMISSION,
    PLAN_COMMISSION,
    PACKAGE_COMMISSION,
    SURCHARGE,
    canonical,
    touches,
    changedFields,
    reviewOnChange,
    reviewedChange,
} = require("../configuredFlag");

jest.mock("../loggerHelper", () => ({ customLog: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

describe("canonical", () => {
    it("reads a stored decimal string and the number the form sends as the same value", () => {
        expect(canonical("5.0000")).toBe(canonical(5));
        expect(canonical("5")).toBe(canonical("5.00"));
    });

    it("reads database 0/1 and form booleans as the same value", () => {
        expect(canonical(1)).toBe(canonical(true));
        expect(canonical("0")).toBe(canonical(false));
        expect(canonical("true")).toBe(canonical(1));
    });

    it("treats empty, null and undefined alike", () => {
        expect(canonical("")).toBeNull();
        expect(canonical(null)).toBeNull();
        expect(canonical(undefined)).toBeNull();
    });

    it("compares JSON by content whatever the key order or the quoting", () => {
        expect(canonical({ b: "2", a: { y: 1, x: true } })).toBe(canonical('{"a":{"x":1,"y":"1"},"b":2}'));
        expect(canonical([1, "2"])).toBe(canonical(["1", 2]));
    });

    it("keeps different texts different", () => {
        expect(canonical("PERCENTAGE")).not.toBe(canonical("FLAT"));
    });
});

describe("changedFields", () => {
    const existing = {
        commissionMode: "MARGIN",
        commissionType: "PERCENTAGE",
        commission: "5.0000",
        fixedCommissionPerTransaction: "0.0000",
        isCommissionInclGST: 1,
    };

    it("ignores fields the payload does not carry", () => {
        expect(changedFields(existing, { commissionType: "PERCENTAGE" }, PLAN_COMMISSION.fields)).toEqual([]);
    });

    it("sees through formatting differences", () => {
        const incoming = { commission: 5, fixedCommissionPerTransaction: 0, isCommissionInclGST: true, commissionMode: "MARGIN" };

        expect(changedFields(existing, incoming, PLAN_COMMISSION.fields)).toEqual([]);
    });

    it("names every field whose value really changed", () => {
        const incoming = { commission: "7.5", isCommissionInclGST: false, commissionType: "PERCENTAGE" };

        expect(changedFields(existing, incoming, PLAN_COMMISSION.fields)).toEqual(["commission", "isCommissionInclGST"]);
    });
});

describe("touches", () => {
    it("tells whether a payload carries any value field of the group", () => {
        expect(touches({ serviceStatus: false }, SURCHARGE)).toBe(false);
        expect(touches({ surcharge: 10 }, SURCHARGE)).toBe(true);
        expect(touches({ surcharge: undefined }, SURCHARGE)).toBe(false);
        expect(touches(null, SURCHARGE)).toBe(false);
    });
});

describe("reviewOnChange", () => {
    const existing = { surchargeType: "FLAT", surcharge: "10.00" };

    it("leaves the payload alone when the fee is unchanged", () => {
        const { data, changed } = reviewOnChange(existing, { surchargeType: "FLAT", surcharge: 10, cashback: 3 }, SURCHARGE);

        expect(changed).toEqual([]);
        expect(data).toEqual({ surchargeType: "FLAT", surcharge: 10, cashback: 3 });
    });

    it("drops the configured mark when the fee changed", () => {
        const { data, changed } = reviewOnChange(existing, { surchargeType: "PERCENTAGE", surcharge: 10 }, SURCHARGE);

        expect(changed).toEqual(["surchargeType"]);
        expect(data).toEqual({ surchargeType: "PERCENTAGE", surcharge: 10, isSurchargeConfigured: false });
    });

    it("never lets a caller mark a row configured through this path", () => {
        const { data } = reviewOnChange(existing, { surcharge: 10, isSurchargeConfigured: true }, SURCHARGE);

        expect(data).toEqual({ surcharge: 10 });
    });

    it("changes nothing when the stored row is unknown", () => {
        expect(reviewOnChange(null, { surcharge: 99 }, SURCHARGE)).toEqual({ data: { surcharge: 99 }, changed: [] });
    });

    it("compares package plan commissions by content", () => {
        const stored = { planCommissions: '{"monthly":{"commissionType":"PERCENTAGE","commission":"5"}}' };
        const same = { planCommissions: { monthly: { commission: 5, commissionType: "PERCENTAGE" } } };
        const different = { planCommissions: { monthly: { commission: 6, commissionType: "PERCENTAGE" } } };

        expect(reviewOnChange(stored, same, PACKAGE_COMMISSION).changed).toEqual([]);
        expect(reviewOnChange(stored, different, PACKAGE_COMMISSION).changed).toEqual(["planCommissions"]);
    });
});

describe("reviewedChange", () => {
    it("reads the stored row only when the payload carries a value field", async () => {
        const load = jest.fn();

        const data = await reviewedChange({
            load,
            incoming: { serviceStatus: false, isSurchargeConfigured: true },
            group: SURCHARGE,
            table: "cashbacks",
            id: 4,
        });

        expect(load).not.toHaveBeenCalled();
        expect(data).toEqual({ serviceStatus: false });
    });

    it("logs which fields re-entered review and returns the payload to save", async () => {
        const load = jest.fn(async () => ({ providerCommission: "2.0000", commissionType: "PERCENTAGE" }));

        const data = await reviewedChange({
            load,
            incoming: { providerCommission: 3, commissionType: "PERCENTAGE" },
            group: OPERATOR_COMMISSION,
            table: "serviceOperators",
            id: 9,
        });

        expect(load).toHaveBeenCalledTimes(1);
        expect(data).toEqual({ providerCommission: 3, commissionType: "PERCENTAGE", isCommissionConfigured: false });
        expect(customLog).toHaveBeenCalledWith(null, "info", {
            message: "Commission re-entered review",
            table: "serviceOperators",
            id: 9,
            fields: ["providerCommission"],
        });
    });

    it("says platform fee for a surcharge change and stays quiet when nothing changed", async () => {
        await reviewedChange({
            existing: { surcharge: "1.00", surchargeType: "FLAT" },
            incoming: { surcharge: 2 },
            group: SURCHARGE,
            table: "cashbacks",
            id: 4,
        });
        expect(customLog.mock.calls[0][2].message).toBe("Platform fee re-entered review");

        customLog.mockClear();
        const data = await reviewedChange({
            existing: { surcharge: "1.00" },
            incoming: { surcharge: "1" },
            group: SURCHARGE,
            table: "cashbacks",
            id: 4,
        });
        expect(data).toEqual({ surcharge: "1" });
        expect(customLog).not.toHaveBeenCalled();
    });
});
