const mobileRechargeProvider = require("../../../entities/mobileRechargeProvider");
const { updateOne } = require("../../mobileRechargeProvider");

jest.mock("../../../entities/mobileRechargeProvider", () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock("../../../../utils/sortHandle", () => ({ handleSortFields: jest.fn() }));

const STORED = {
    commissionMode: "MARGIN",
    commissionType: "PERCENTAGE",
    commission: "2.5000",
    fixedCommissionPerTransaction: "0.0000",
    isCommissionInclGST: 1,
};

const FORM = {
    providerName: "Airtel",
    commissionMode: "MARGIN",
    commissionType: "PERCENTAGE",
    commission: 2.5,
    fixedCommissionPerTransaction: 0,
    isCommissionInclGST: true,
};

beforeEach(() => {
    jest.clearAllMocks();
    mobileRechargeProvider.findOne.mockResolvedValue(STORED);
    mobileRechargeProvider.update.mockResolvedValue([1]);
});

describe("updateOne", () => {
    it("saves a re-sent form without touching the confirmation", async () => {
        await updateOne(4, FORM);

        expect(mobileRechargeProvider.findOne).toHaveBeenCalledWith({
            where: { id: 4 },
            attributes: ["commissionMode", "commissionType", "commission", "fixedCommissionPerTransaction", "isCommissionInclGST"],
            raw: true,
        });
        expect(mobileRechargeProvider.update).toHaveBeenCalledWith(FORM, { where: { id: 4 } });
    });

    it("puts the provider back under review when its commission changed", async () => {
        await updateOne(4, { ...FORM, commission: 3 });

        expect(mobileRechargeProvider.update).toHaveBeenCalledWith(
            { ...FORM, commission: 3, isCommissionConfigured: false },
            { where: { id: 4 } }
        );
    });
});
