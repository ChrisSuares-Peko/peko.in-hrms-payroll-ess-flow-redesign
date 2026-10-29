const cashback = require("../../../entities/cashback");
const { customLog } = require("../../../../utils/loggerHelper");
const { update, updateConfigured, createConfigured, findByPackageAndOperator } = require("../../cashback");

jest.mock("../../../entities/cashback", () => ({ findOne: jest.fn(), update: jest.fn(), create: jest.fn() }));

const STORED = { surchargeType: "FLAT", surcharge: "10.00" };

beforeEach(() => {
    jest.clearAllMocks();
    cashback.findOne.mockResolvedValue(STORED);
    cashback.update.mockResolvedValue([1]);
});

describe("a Settings › Cashback save", () => {
    it("reads the stored fee first", async () => {
        await update({ id: 5 }, { surchargeType: "FLAT", surcharge: 10 });

        expect(cashback.findOne).toHaveBeenCalledWith({
            where: { id: 5 },
            attributes: ["surchargeType", "surcharge"],
            raw: true,
        });
    });

    it("keeps the confirmation when the fee did not change", async () => {
        await update({ id: 5 }, { surchargeType: "FLAT", surcharge: 10, cashback: 2, cashbackType: "FLAT" });

        expect(cashback.update).toHaveBeenCalledWith(
            { surchargeType: "FLAT", surcharge: 10, cashback: 2, cashbackType: "FLAT" },
            { where: { id: 5 } }
        );
        expect(customLog).not.toHaveBeenCalled();
    });

    it("puts the fee back under review when its value changed", async () => {
        await update({ id: 5 }, { surchargeType: "FLAT", surcharge: 15 });

        expect(cashback.update).toHaveBeenCalledWith(
            { surchargeType: "FLAT", surcharge: 15, isSurchargeConfigured: false },
            { where: { id: 5 } }
        );
        expect(customLog).toHaveBeenCalledWith(null, "info", {
            message: "Platform fee re-entered review",
            table: "cashbacks",
            id: 5,
            fields: ["surcharge"],
        });
    });

    it("no longer confirms a fee on a status toggle", async () => {
        await update({ id: 5 }, { serviceStatus: false });

        expect(cashback.update).toHaveBeenCalledWith({ serviceStatus: false }, { where: { id: 5 } });
    });

    it("ignores a confirmation sent by the client", async () => {
        await update({ id: 5 }, { surcharge: 10, isSurchargeConfigured: true });

        expect(cashback.update).toHaveBeenCalledWith({ surcharge: 10 }, { where: { id: 5 } });
    });

    it("passes a database failure through", async () => {
        cashback.update.mockRejectedValue(new Error("Error updating cashback"));

        await expect(update({ id: 5 }, { surcharge: 10 })).rejects.toThrow("Error updating cashback");
    });
});

describe("the accounting portal's own writes", () => {
    it("confirms the fee it saves", async () => {
        await updateConfigured({ id: 5 }, { surchargeType: "FLAT", surcharge: 15 });

        expect(cashback.findOne).not.toHaveBeenCalled();
        expect(cashback.update).toHaveBeenCalledWith(
            { surchargeType: "FLAT", surcharge: 15, isSurchargeConfigured: true },
            { where: { id: 5 } }
        );
    });

    it("creates a fee as confirmed", async () => {
        cashback.create.mockResolvedValue({ id: 9 });

        expect(await createConfigured({ packageId: 1, serviceOperatorId: 2, surcharge: 3 })).toEqual({ id: 9 });
        expect(cashback.create).toHaveBeenCalledWith({ packageId: 1, serviceOperatorId: 2, surcharge: 3, isSurchargeConfigured: true });
    });

    it("looks a fee up by package and service", async () => {
        cashback.findOne.mockResolvedValue({ id: 9 });

        expect(await findByPackageAndOperator({ packageId: "1", serviceOperatorId: "2", surcharge: 3 })).toEqual({ id: 9 });
        expect(cashback.findOne).toHaveBeenCalledWith({
            where: { packageId: "1", serviceOperatorId: "2" },
            attributes: ["id"],
            raw: true,
        });
    });
});
