const cashback = require("../../../entities/cashback");
const pkgModel = require("../../../entities/package");
const sequelizeConfig = require("../../../../configs/database/index");
const { clonePackageToPartner, addCashbacksToTargetPackage } = require("../../cashbackCopy");

jest.mock("../../../../configs/database/index", () => ({ transaction: jest.fn() }));
jest.mock("../../../entities/cashback", () => ({ findAll: jest.fn(), bulkCreate: jest.fn() }));
jest.mock("../../../entities/package", () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock("../../../entities/serviceOperator", () => ({}));

beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
});

describe("cloned packages and fees re-enter review", () => {
    it("does not carry a package's commission confirmation onto its clone", async () => {
        pkgModel.findOne
            .mockResolvedValueOnce({ id: 7, packageName: "Growth", partnerId: null, isCommissionConfigured: 1, commission: "5" })
            .mockResolvedValueOnce(null);
        pkgModel.create.mockResolvedValue({ get: () => ({ id: 99 }) });

        await clonePackageToPartner({ fromPackageId: 7, toPartnerId: "42" });

        const created = pkgModel.create.mock.calls[0][0];
        expect(created).not.toHaveProperty("isCommissionConfigured");
        expect(created.commission).toBe("5");
    });

    it("does not carry a fee's confirmation onto the copied row", async () => {
        const transaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelizeConfig.transaction.mockResolvedValue(transaction);
        pkgModel.findOne.mockResolvedValue({ id: 5 });
        cashback.findAll
            .mockResolvedValueOnce([{ id: 1, packageId: 9, serviceOperatorId: 3, surcharge: "5", isSurchargeConfigured: 1 }])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 100 }]);
        cashback.bulkCreate.mockResolvedValue([{ id: 100 }]);

        await addCashbacksToTargetPackage({ toPackageId: 5, sourceCashbackIds: [1] });

        const [rows] = cashback.bulkCreate.mock.calls[0];
        expect(rows[0]).not.toHaveProperty("isSurchargeConfigured");
        expect(rows[0].surcharge).toBe("5");
        expect(rows[0].packageId).toBe(5);
    });
});
