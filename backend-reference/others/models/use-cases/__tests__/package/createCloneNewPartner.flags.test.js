const { createCloneNewPartner } = require("../../package");
const sequelize = require("../../../../configs/database/index");
const pkgModel = require("../../../entities/package");
const partnerPermission = require("../../../entities/partnerPermission");
const cashback = require("../../../entities/cashback");

jest.mock("../../../entities/cashback", () => ({ bulkCreate: jest.fn(), findAll: jest.fn() }));

describe("createCloneNewPartner and the configured marks", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() });
        partnerPermission.update.mockResolvedValue(true);
        pkgModel.create.mockResolvedValue({ id: 101 });
        cashback.bulkCreate.mockResolvedValue(true);
        cashback.findAll.mockResolvedValue([
            { id: 10, packageId: 1, surcharge: "5", isSurchargeConfigured: 1 },
            { id: 20, packageId: 1, surcharge: "7", isSurchargeConfigured: 0 },
        ]);
    });

    it("copies the amounts but leaves every clone unconfirmed", async () => {
        await createCloneNewPartner({
            bulkPackagesdata: [{ id: 1, packageName: "Growth", commission: "5", isCommissionConfigured: 1 }],
            newPartnerId: 123,
            partnerPermissions: [],
            cashbackIds: [10, 20],
        });

        expect(pkgModel.create.mock.calls[0][0]).toEqual({ packageName: "Growth", commission: "5", partnerId: 123 });
        expect(cashback.bulkCreate.mock.calls[0][0]).toEqual([
            { packageId: 101, surcharge: "5" },
            { packageId: 101, surcharge: "7" },
        ]);
    });
});
