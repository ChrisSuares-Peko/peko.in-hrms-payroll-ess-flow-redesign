const { configurationGaps, flagOf } = require("../journalConfigurationGate");

const operator = (overrides = {}) => ({
    id: 12,
    serviceProvider: "Electricity Bill",
    isCommissionConfigured: 1,
    isSurchargeConfigured: 1,
    packageId: 3,
    ...overrides,
});

describe("flagOf", () => {
    it("reads booleans the way MySQL and JSON hand them over", () => {
        expect([true, 1, "1", "true"].map(flagOf)).toEqual([true, true, true, true]);
        expect([false, 0, "0", "false"].map(flagOf)).toEqual([false, false, false, false]);
        expect([undefined, null, ""].map(flagOf)).toEqual([null, null, null]);
    });
});

describe("configurationGaps", () => {
    it("lets a service without plans through once its commission and platform fee are marked configured", () => {
        expect(configurationGaps({ serviceDetails: operator() })).toEqual({
            commissionNotConfiguredFor: null,
            surchargeNotConfiguredFor: null,
        });
    });

    it("names the service when its own commission is not marked configured", () => {
        expect(configurationGaps({ serviceDetails: operator({ isCommissionConfigured: 0 }) })).toEqual({
            commissionNotConfiguredFor: "Electricity Bill",
            surchargeNotConfiguredFor: null,
        });
    });

    it("names the platform fee and remembers the package whose fee is not marked configured", () => {
        expect(configurationGaps({ serviceDetails: operator({ isSurchargeConfigured: false }) })).toEqual({
            commissionNotConfiguredFor: null,
            surchargeNotConfiguredFor: "Electricity Bill",
            surchargeNotConfiguredPackageId: 3,
        });
    });

    it("does not hold a journal back for a platform fee when no package fee row was part of the order", () => {
        const serviceDetails = operator();
        delete serviceDetails.isSurchargeConfigured;
        delete serviceDetails.packageId;

        expect(configurationGaps({ serviceDetails }).surchargeNotConfiguredFor).toBeNull();
    });

    it("checks each plan on its own flag and names the first one not marked configured", () => {
        const gaps = configurationGaps({
            serviceDetails: operator({ isCommissionConfigured: 0 }),
            planDetails: [
                { name: "eSIM : Asia 5GB", isCommissionConfigured: 1 },
                { name: "eSIM : Europe 10GB", isCommissionConfigured: 0 },
            ],
        });

        expect(gaps.commissionNotConfiguredFor).toBe("eSIM : Europe 10GB");
    });

    it("passes when every plan is marked configured even if the service's own commission is not", () => {
        const gaps = configurationGaps({
            serviceDetails: operator({ isCommissionConfigured: 0 }),
            planDetails: [{ name: "Service Package : Basic", isCommissionConfigured: true }],
        });

        expect(gaps.commissionNotConfiguredFor).toBeNull();
    });

    it("falls back to the service's own flag for an item that has none of its own, naming the service", () => {
        const item = { commissionType: "FLAT", commission: 499, amount: 499 };

        expect(
            configurationGaps({ serviceDetails: operator({ serviceProvider: "GST Registration" }), planDetails: [item] })
                .commissionNotConfiguredFor
        ).toBeNull();
        expect(
            configurationGaps({
                serviceDetails: operator({ serviceProvider: "GST Registration", isCommissionConfigured: 0 }),
                planDetails: [item],
            }).commissionNotConfiguredFor
        ).toBe("GST Registration");
    });

    it("never holds back an order made only of add-ons", () => {
        const gaps = configurationGaps({
            serviceDetails: operator({ isCommissionConfigured: 0 }),
            planDetails: [{ name: "WhatsApp Bot Builder", isAddOn: true }],
        });

        expect(gaps.commissionNotConfiguredFor).toBeNull();
    });

    it("uses the provider name a purchase hands over for its commission source", () => {
        const gaps = configurationGaps({
            serviceDetails: operator({
                serviceProvider: "Mobile Prepaid",
                commissionConfigurationName: "Airtel",
                isCommissionConfigured: 0,
            }),
        });

        expect(gaps).toEqual({ commissionNotConfiguredFor: "Airtel", surchargeNotConfiguredFor: null });
    });

    it("never holds back a sale of Peko's own, which carries neither a commission nor a platform fee", () => {
        expect(
            configurationGaps({
                serviceDetails: operator({ isCommissionConfigured: 0, isSurchargeConfigured: 0 }),
                isPekoSale: true,
            })
        ).toEqual({ commissionNotConfiguredFor: null, surchargeNotConfiguredFor: null });
    });

    it("falls back to generic names when the purchase hands over none", () => {
        expect(
            configurationGaps({
                serviceDetails: { isCommissionConfigured: 0, isSurchargeConfigured: 0 },
                planDetails: [{ isCommissionConfigured: 0 }],
            })
        ).toEqual({ commissionNotConfiguredFor: "this plan", surchargeNotConfiguredFor: "this service" });
    });
});
