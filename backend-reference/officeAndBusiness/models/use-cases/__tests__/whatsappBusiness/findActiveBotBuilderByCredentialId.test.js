const { findActiveBotBuilderByCredentialId } = require("../../whatsappBusiness");
const WhatsAppSubscription = require("../../../entities/whatsAppSubscription");
const Package = require("../../../entities/package");
const { Op } = require("sequelize");

jest.mock("../../../entities/whatsAppSubscription", () => ({
    findOne: jest.fn(),
    belongsTo: jest.fn(),
}));

jest.mock("../../../entities/package", () => ({
    hasMany: jest.fn(),
}));

describe("findActiveBotBuilderByCredentialId", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return active or pending custom bot-builder subscription", async () => {
        const credentialId = 101;

        const mockSubscription = {
            id: 10,
            status: "ACTIVE",
            subscriptionPaymentRefId: "PAY123",
            projectId: "PRJ999",
            package: {
                id: 1,
                packageName: "Bot Builder",
                packageType: "WHATSAPP",
            }
        };

        WhatsAppSubscription.findOne.mockResolvedValue(mockSubscription);

        const result = await findActiveBotBuilderByCredentialId(credentialId);

        expect(WhatsAppSubscription.findOne).toHaveBeenCalledWith({
            where: {
                credentialId: credentialId,
                status: { [Op.or]: ['ACTIVE', 'PENDING'] },
                isCustom: true,
                addOnType: 'BOT_BUILDER',
                subscriptionPaymentRefId: { [Op.ne]: null }
            },
            include: [
                {
                    model: Package,
                    attributes: [
                        'id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo'
                    ]
                }
            ],
            attributes: [
                'id', 'subscriptionStartDate', 'subscriptionEndDate', 'subscriptionAmountPaid',
                'subscriptionPrice', 'discount',
                'status', 'projectId', 'billingPlan', 'billingType',
                'isCancelled', 'isCustom', 'addOnType'
            ],
            raw: true,
            nest: true
        });

        expect(result).toEqual(mockSubscription);
    });

    it("should return null if no active custom subscription exists", async () => {
        WhatsAppSubscription.findOne.mockResolvedValue(null);

        const result = await findActiveBotBuilderByCredentialId(202);

        expect(result).toBeNull();
    });

    it("should return null if DB throws an error", async () => {
        WhatsAppSubscription.findOne.mockRejectedValue(new Error("DB exploded"));

        const result = await findActiveBotBuilderByCredentialId(303);

        expect(result).toBeNull();
    });

    it("should throw error if credentialId is undefined", async () => {
        await expect(findActiveBotBuilderByCredentialId()).resolves.toBe(null);
    });

    it("should still throw error if credentialId is null", async () => {
        await expect(findActiveBotBuilderByCredentialId(null)).resolves.toBe(null)
    });
});
