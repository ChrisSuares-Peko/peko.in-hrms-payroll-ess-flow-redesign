const { Op } = require("sequelize");
const Package = require("../entities/package");
const WhatsAppBusiness = require("../entities/whatsappBusiness");
const WhatsAppSubscription = require("../entities/whatsappSubscription");
const asyncHandler = require("../../middlewares/async");

exports.fetchWhatsAppBusinessByCredentialId = async (credentialId) => {
  try {
    console.log(credentialId)
    const whatsappBusinessData = await WhatsAppBusiness.findOne({
      where: { credentialId: credentialId }
    });
    console.log(whatsappBusinessData,"OOOOOOOOOOOOOOOO")
    if (whatsappBusinessData?.businessId) {
      return { status: true, message: 'Success', businessId: whatsappBusinessData.businessId };
    }
    return { status: false, message: 'Not found' };
  } catch (error) {
    console.log(error)
    return { status: false, message: 'Something went wrong' };
  }
};

exports.whatsappSubscriptionUpdate = async (params, data) => {
  try {
    if (!data.invoiceId) {
      return {
        error: true,
        message: `Invoice Id is not provided`
      };
    }

    const subscription = await WhatsAppSubscription.update(
      data,
      {
        where: params
      }
    );
    return { subscription };

  } catch (error) {
    console.log("Subscription error:", error);
    return {
      error: true,
      message: "something went wrong "
    };
  }
};

exports.findActiveSubscriptionByCredentialId = asyncHandler(async (credentialId) => {
  try {
      // No subscriptionPaymentRefId filter — a bundled WA Basic row (free perk attached to
      // Peko+) has paymentRefId = null but is still a legitimate "active main subscription"
      // for upgrade detection. Filtering it out hides the row that would otherwise become
      // mainSubId in subscription_tags, so the upgrade webhook never marks Basic UPGRADED.
      const activeSubscription = await WhatsAppSubscription.findOne({
          where: {
              credentialId: credentialId,
              status: {
                [Op.or]: ['ACTIVE', 'PENDING']
              },
              isCustom: false,
          },
          include: [
              {
                  model: Package,
                  attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo', 'priorityLevel', 'packagePrices', 'discount', 'commissionMode', 'commissionType', 'commission', 'fixedCommissionPerTransaction', 'isCommissionInclGST', 'planCommissions']
              }
          ],
          attributes: [
              'id', 
              'subscriptionStartDate', 
              'subscriptionEndDate', 
              'subscriptionAmountPaid',
              'subscriptionPrice',
              'discount',
              'status',
              'projectId',
              'billingPlan',
              'billingType',
              'isCancelled',
              'botBuilder'
          ],
          raw: true,
          nest: true
      });

      return activeSubscription;

  } catch (error) {
      console.error('Error finding active subscription:', error);
      return null;
  }
});
exports.findActiveBotBuilderByCredentialId = asyncHandler(async (credentialId) => {
  try {
    const activeSubscription = await WhatsAppSubscription.findOne({
        where: {
            credentialId: credentialId,
            status: {
              [Op.or]: ['ACTIVE', 'PENDING']
            },
            isCustom: true,
            addOnType: 'BOT_BUILDER',
            subscriptionPaymentRefId: {
                [Op.ne]: null
            }
        },
        include: [
            {
                model: Package,
                attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo']
            }
        ],
        attributes: [
            'id',
            'subscriptionStartDate',
            'subscriptionEndDate',
            'subscriptionAmountPaid',
            'subscriptionPrice',
            'discount',
            'status',
            'projectId',
            'billingPlan',
            'billingType',
            'isCancelled',
            'isCustom',
            'addOnType',
        ],
        raw: true,
        nest: true
    });

    return activeSubscription;

} catch (error) {
    console.error('Error finding active subscription:', error);
    return null;
}
});

exports.findActiveShopifyIntegrationByCredentialId = asyncHandler(async (credentialId) => {
  try {
    const activeSubscription = await WhatsAppSubscription.findOne({
        where: {
            credentialId: credentialId,
            status: {
              [Op.or]: ['ACTIVE', 'PENDING']
            },
            isCustom: true,
            addOnType: 'SHOPIFY_INTEGRATION',
            subscriptionPaymentRefId: {
                [Op.ne]: null
            }
        },
        include: [
            {
                model: Package,
                attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo']
            }
        ],
        attributes: [
            'id',
            'subscriptionStartDate',
            'subscriptionEndDate',
            'subscriptionAmountPaid',
            'subscriptionPrice',
            'discount',
            'status',
            'projectId',
            'billingPlan',
            'billingType',
            'isCancelled',
            'isCustom',
            'addOnType',
        ],
        raw: true,
        nest: true
    });

    return activeSubscription;

} catch (error) {
    console.error('Error finding active Shopify Integration subscription:', error);
    return null;
}
});