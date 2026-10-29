const systemUser = require("../../../entities/systemUser");
const { updatePartnerShare } = require("../../systemUser");

jest.mock("../../../entities/systemUser", () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

describe("updatePartnerShare", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns null and skips the update when the partner does not exist", async () => {
        systemUser.findOne.mockResolvedValue(null);

        expect(await updatePartnerShare(7, { sharePercentage: 12.5 })).toBeNull();
        expect(systemUser.update).not.toHaveBeenCalled();
    });

    it("updates only the share percentage", async () => {
        systemUser.findOne.mockResolvedValue({ id: 7 });
        systemUser.update.mockResolvedValue([1]);

        const result = await updatePartnerShare(7, { sharePercentage: 12.5 });

        expect(systemUser.update).toHaveBeenCalledWith({ sharePercentage: 12.5 }, { where: { id: 7 } });
        expect(result).toEqual({ id: 7, sharePercentage: 12.5 });
    });

    it("stores the gateway charge terms as one JSON field beside the share", async () => {
        systemUser.findOne.mockResolvedValue({ id: 7 });
        systemUser.update.mockResolvedValue([1]);

        const result = await updatePartnerShare(7, { gatewayCharge: { percentage: 1.95, fixed: 3 } });

        expect(systemUser.update).toHaveBeenCalledWith(
            { gatewayCharge: { percentage: 1.95, fixed: 3 } },
            { where: { id: 7 } }
        );
        expect(result).toEqual({ id: 7, gatewayCharge: { percentage: 1.95, fixed: 3 } });
    });
});
