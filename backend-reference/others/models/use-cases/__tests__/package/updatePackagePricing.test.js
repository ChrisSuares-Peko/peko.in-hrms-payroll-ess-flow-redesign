const pkgModel = require("../../../entities/package");
const { updatePackagePricing } = require("../../package");

jest.mock("../../../entities/package", () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

const pricing = {
    packagePrices: { monthly: 499, annually: 4999 },
    discount: { monthly: 50, annually: 500 },
};

describe("updatePackagePricing", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns null and skips the update when the subscription package does not exist", async () => {
        pkgModel.findOne.mockResolvedValue(null);

        expect(await updatePackagePricing(42, pricing)).toBeNull();
        expect(pkgModel.findOne).toHaveBeenCalledWith({
            where: { id: 42, type: "1" },
            attributes: ["id"],
            raw: true,
        });
        expect(pkgModel.update).not.toHaveBeenCalled();
    });

    it("updates only the price and discount columns", async () => {
        pkgModel.findOne.mockResolvedValue({ id: 42 });
        pkgModel.update.mockResolvedValue([1]);

        const result = await updatePackagePricing(42, pricing);

        expect(pkgModel.update).toHaveBeenCalledWith(
            { packagePrices: pricing.packagePrices, discount: pricing.discount },
            { where: { id: 42 } }
        );
        expect(result).toEqual({ id: 42, ...pricing });
    });
});

describe("pricing the packages of Peko's own service subscriptions", () => {
    const { Op } = require("sequelize");
    const { updatePackagePricingBulk } = require("../../package");

    beforeEach(() => jest.clearAllMocks());

    it("also finds a service package whose service is classified as Peko's own", async () => {
        pkgModel.findOne.mockResolvedValue({ id: 77 });

        await updatePackagePricing(77, pricing, { serviceAccessCodes: ["ecommerce_store"] });

        expect(pkgModel.findOne).toHaveBeenCalledWith({
            where: {
                id: 77,
                [Op.or]: [{ type: "1" }, { type: "2", accessCode: { [Op.in]: ["ecommerce_store"] } }],
            },
            attributes: ["id"],
            raw: true,
        });
    });

    it("keeps to plans alone when no service is classified as Peko's own", async () => {
        pkgModel.findOne.mockResolvedValue(null);

        expect(await updatePackagePricing(77, pricing, { serviceAccessCodes: [] })).toBeNull();
        expect(pkgModel.findOne.mock.calls[0][0].where).toEqual({ id: 77, type: "1" });
    });

    it("applies a bulk price to plans and to those service packages only", async () => {
        await updatePackagePricingBulk([1, 77], pricing, { serviceAccessCodes: ["ecommerce_store"] });

        expect(pkgModel.update).toHaveBeenCalledWith(
            { packagePrices: pricing.packagePrices, discount: pricing.discount },
            {
                where: {
                    id: { [Op.in]: [1, 77] },
                    [Op.or]: [{ type: "1" }, { type: "2", accessCode: { [Op.in]: ["ecommerce_store"] } }],
                },
            }
        );
    });
});
