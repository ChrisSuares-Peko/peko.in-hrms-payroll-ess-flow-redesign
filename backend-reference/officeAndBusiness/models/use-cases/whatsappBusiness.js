const { Op, fn, col, where, cast } = require("sequelize");
const sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const WhatsAppBusiness = require("../entities/whatsappBusiness");
const WhatsAppSubscription = require("../entities/whatsAppSubscription");
const credential = require("../entities/credential");
const { handleSortFields } = require("../../utils/sortHandle");
const corporateUser = require("../entities/corporateUser");
const orders = require("../entities/order");
const pkgModel = require("../entities/package");
const { capitalizeFirstLetter, formattedDateTime, formatNumberWithLocalString} = require("../../utils/formatter");
const Package = require("../entities/package");
const Subscription = require("../entities/subscription");
const { customLog } = require("../../utils/loggerHelper");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");
const { PLAN_COMMISSION } = require("../../utils/configuredFlag");

exports.createWhatsAppBusinessEntry = async (params) => {
  try {
    const result = await WhatsAppBusiness.create(params);
    // Convert the Sequelize instance to a plain object
    const plainResult = result.get({ plain: true });
    return { status: true, message: 'Success', data: plainResult };
  } catch (error) {
    console.error('Error creating WhatsApp Business entry:', error);
    return { status: false, message: 'Failed to create WhatsApp Business entry' };
  }
};

exports.fetchWhatsAppBusinessByCredentialId = async (credentialId) => {
  try {
    const whatsappBusinessData = await WhatsAppBusiness.findOne({
      where: { credentialId: credentialId }
    });
    console.log(whatsappBusinessData)
    if (whatsappBusinessData?.businessId) {
      return {
        status: true,
        message: 'Success',
        businessId: whatsappBusinessData.businessId,
        projectId: whatsappBusinessData.projectId  // Include projectId in the response
      };
    }
    return { status: false, message: 'Not found' };
  } catch (error) {
    return { status: false, message: 'Something went wrong' };
  }
};

exports.isTopTierGroupPackage = async (packageId, options = {}) => {
  if (!packageId) return false;
  const pkg = await Package.findByPk(packageId, {
    attributes: ['id', 'packageType', 'partnerId'],
    raw: true,
    ...options,
  });
  if (!pkg || pkg.packageType !== 'GROUP') return false;
  const topTier = await Package.findOne({
    where: {
      status: true,
      packageType: 'GROUP',
      partnerId: pkg.partnerId ?? null,
    },
    order: [['priorityLevel', 'DESC']],
    attributes: ['id'],
    raw: true,
    ...options,
  });
  return Boolean(topTier) && String(topTier.id) === String(pkg.id);
};

// Self-heal helper for the Peko+ → WhatsApp bundle.
// Returns null if the user has no active Peko+ subscription (i.e. no bundle is owed).
// Otherwise returns the bundled whatsAppSubscriptions row — existing one if present,
// or a newly created one (projectId='PENDING' so the LandingPage init endpoint mints
// the AiSensy project on first visit).
//
// Mirrors `bundleWhatsAppBasicForPekoPlus` in paymentGateway/utils/whatsappForBusiness.js
// so a missed bundle hook during the Peko+ AUTH webhook (mandate branch, transient
// failure, race with frontend, package-name mismatch) doesn't lock the customer out
// of the WhatsApp module they paid for.
exports.ensurePekoPlusWhatsAppBundle = async ({ corporateUserId, credentialId }) => {
  if (!corporateUserId) return null;

  // Existing bundle row? Use it as-is — idempotent, even if it's already cancelled or
  // has a real (non-PENDING) projectId, the caller decides what to do with it.
  const existing = await WhatsAppSubscription.findOne({
    where: { corporateUserId, status: 'ACTIVE', isCancelled: false },
    raw: true,
  });
  if (existing) return existing;

  // No bundle yet — only proceed if the user actually has an active Peko+ plan.
  const groupSubs = await Subscription.findAll({
    include: [
      {
        model: Package,
        where: { packageType: 'GROUP' },
        attributes: ['id', 'packageName', 'partnerId'],
      },
    ],
    where: {
      corporateUserId,
      status: 'ACTIVE',
      isCustom: false,
      isCancelled: false,
    },
    attributes: [
      'id',
      'subscriptionStartDate',
      'subscriptionEndDate',
      'billingType',
      'vendorSubscriptionId',
      'corporateTxnId',
    ],
    raw: true,
    nest: true,
  });

  const topTierChecks = await Promise.all(
    groupSubs.map((sub) => exports.isTopTierGroupPackage(sub.package?.id))
  );
  const pekoPlusSub = groupSubs.find((_, index) => topTierChecks[index]);
  if (!pekoPlusSub) return null;

  // Resolve the basic WhatsApp package — same priority/partner rules as paymentGateway helper.
  const partnerId = pekoPlusSub.package?.partnerId;
  const pkgWhere = { status: true, accessCode: 'whatsapp' };
  if (partnerId !== undefined && partnerId !== null && partnerId !== '') {
    pkgWhere.partnerId = partnerId;
  }
  const basicPkg = await Package.findOne({
    where: pkgWhere,
    order: [['priorityLevel', 'ASC']],
    raw: true,
  });
  if (!basicPkg) {
    customLog(null, 'error', {
      message: '[WA-BUNDLE] ensurePekoPlusWhatsAppBundle: no basic WhatsApp package found',
      corporateUserId,
      partnerId,
    });
    return null;
  }

  const created = await WhatsAppSubscription.create({
    corporateUserId,
    credentialId,
    packageId: basicPkg.id,
    subscriptionStartDate: pekoPlusSub.subscriptionStartDate,
    subscriptionEndDate: pekoPlusSub.subscriptionEndDate,
    subscriptionPaymentRefId: null, // bundle marker
    subscriptionPrice: 0,
    subscriptionAmountPaid: 0,
    discount: 0,
    status: 'ACTIVE',
    billingType: pekoPlusSub.billingType,
    billingPlan: 'BASIC', // bundle marker
    projectId: 'PENDING', // deferred — LandingPage init creates the AiSensy project
    isCancelled: false,
    isCustom: false, // bundle marker
    vendorSubscriptionId: pekoPlusSub.vendorSubscriptionId,
    corporateTxnId: pekoPlusSub.corporateTxnId,
  });

  customLog(null, 'info', {
    message: '[WA-BUNDLE] ensurePekoPlusWhatsAppBundle: backfilled bundle row for Peko+ customer',
    corporateUserId,
    credentialId,
    whatsAppSubscriptionId: created.id,
    packageId: basicPkg.id,
  });

  return created.get({ plain: true });
};
exports.fetchWhatsAppBusinessByEmail = asyncHandler(async (businessId) => {
  try {
    // Fetch the WhatsAppBusiness instance using businessId
    const whatsAppBusiness = await WhatsAppBusiness.findOne({
      where: { businessId },
      include: {
        model: credential,
        attributes: ['email', 'name'], // Select only the 'email' attribute from the credential table
      },
    });

    if (!whatsAppBusiness) {
      throw new Error("WhatsApp Business not found with the provided businessId");
    }

    return whatsAppBusiness.credential; // Access email from the included credential

  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error for proper handling
  }
})

exports.fetchOrdersByCredentialAndServiceOperator = asyncHandler(async (params) => {
  const { credentialId, serviceOperatorId, searchText, subCorporateUserId } = params
  const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
  const safeSearch = escapeLike((searchText || "").toLowerCase());

  const whereClause = {
    credentialId,
    serviceOperatorId,
  };

  if (safeSearch) {
    whereClause[Op.or] = [
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("paymentMode")),
        { [Op.like]: `%${safeSearch}%` }
      ),
      sequelize.where(
        sequelize.cast(sequelize.col("id"), "CHAR"),
        { [Op.like]: `%${safeSearch}%` }
      ),
    ];
  }
  // Add subCorporateUserId condition if provided
  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  // Fetch the orders based on the whereClause
  const ordersData = await orders.findAll({
    where: whereClause
  });

  // Return orders if found, otherwise return false
  return ordersData.length > 0 ? ordersData : false;

});

exports.findPackageByAccessCode = asyncHandler(async (accessKey, partnerId, credentialId) => {
  try {

      const packages = await pkgModel.findAll({
          where: { status: true, accessCode: accessKey, partnerId: partnerId },
          attributes: ['id', 'packageName', "packagePrices", "description", "discount","priorityLevel", ...PLAN_COMMISSION.fields, "planCommissions"],
          order:[['priorityLevel','ASC']],
          raw: true,
          nest: true
      })

      await applyCommissionMarkup(packages, "packagePrices.monthly", credentialId);
      await applyCommissionMarkup(packages, "packagePrices.annually", credentialId);

      return packages
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findAndCountAllUserSubscriptions = asyncHandler(async (params) => {

  try {
      const { corporateId, limit, offset, status, packageType, searchText } = params;

      let whereConditions = {
          corporateUserId: corporateId,
      };

      if (status) {
          whereConditions.status = status;
      }

      let packageWhereConditions = {}
      if (packageType) {
          packageWhereConditions.packageType = packageType;
      }

      if (searchText) {
        const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
        const lowerSearch = escapeLike(searchText.toLowerCase());
        
          const orConditions = [
              where(fn('LOWER', col('subscriptionPaymentRefId')), {
                  [Op.like]: `%${lowerSearch}%`
              }),
              where(fn('LOWER', cast(col('subscriptionAmountPaid'), 'CHAR')), {
                  [Op.like]: `%${lowerSearch}%`
              }),
              // Only include real package name match if it's NOT custom
              {
                  [Op.and]: [
                      { isCustom: false },
                      where(fn('LOWER', col('package.packageName')), {
                          [Op.like]: `%${lowerSearch}%`
                      })
                  ]
              }
          ];

          // Match "add on" or partial "add on" search
          const normalizedSearch = lowerSearch.replace(/\s+/g, '');
          if ('addon'.includes(normalizedSearch)) {
              orConditions.push({ isCustom: true });
          }

          whereConditions[Op.or] = orConditions;
      }

      const allActiveSubscriptions = await WhatsAppSubscription.findAndCountAll({
          include: [
              {
                  model: pkgModel,
                  attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo'],
                  where: packageWhereConditions,
              }
          ],
          where: whereConditions,
          attributes: ['id', 'createdAt', 'subscriptionStartDate', 'subscriptionEndDate', 'subscriptionAmountPaid', 'status', 'billingType', 'billingPlan', 'isCustom', 'subscriptionPaymentRefId'],
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
          raw: true,
          nest: true
      })

      return allActiveSubscriptions

  } catch (error) {
    customLog(null, "error", { message: "Error finding package details:", error })
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findActiveSubscriptionByCredentialId = asyncHandler(async (credentialId) => {
  try {
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
                  model: pkgModel,
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
              'subscriptionPaymentRefId',
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

exports.findAllAddOnAndCount = asyncHandler(async (params) => {
  let {
      limit,
      offset,
      searchText,
      sort,
      sortField,
      corporateId, 
      from, 
      to,
      status,
      subCorporateUserId
  } = params;

  let order = handleSortFields(sortField, sort);

  let whereClause = {
      [Op.and]: [ // Ensure 'AND' conditions are applied
          { isCustom: true }, // Add this condition for isCustom
          {
              [Op.or]: [
                  {
                      id: {
                          [Op.like]: '%' + searchText + '%'
                      }
                  },
                  {
                      projectId: {
                          [Op.like]: '%' + searchText + '%'
                      }
                  },
                  {
                      invoiceId: {
                          [Op.like]: '%' + searchText + '%'
                      }
                  },
                  {
                      status: {
                            [Op.like]: '%' + searchText + '%'
                        }
                  },
                  {
                      '$credential.username$': {
                          [Op.like]: '%' + searchText + '%',
                      },
                  },
                  {
                      '$credential.name$': {
                          [Op.like]: '%' + searchText + '%',
                      },
                  },
              ]
          }
      ]
  };

  if (from && to) {
      let tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause[Op.and].push({
          createdAt: {
              [Op.between]: [from, tomorrow]
          }
      });
  }

  if (corporateId) {
      whereClause[Op.and].push({ corporateUserId: corporateId });
  }
  if(status){
    whereClause[Op.and].push({status:status})
  }

  if (subCorporateUserId) {
      whereClause[Op.and].push({ subCorporateUserId: subCorporateUserId });
  }

  return await WhatsAppSubscription.findAndCountAll({
      attributes: [
          'id',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'subscriptionPrice',
          'subscriptionAmountPaid',
          'discount',
          'status',
          'billingType',
          'projectId',
          'invoiceId',
          'createdAt',
          'isCustom',
          'addOnType'
      ],
      include: [
          {
              model: credential,
              attributes: ['id', 'name', 'username'],
              include: [
                  {
                      // Self-reference join to get the name of the registeredBy user
                      model: credential,
                      as: 'registeredByCredential', // Alias for the registeredBy relation
                      attributes: ['name']
                  }
              ],
          },
          {
              model: corporateUser,
              attributes: ['id', 'name']
          }
      ],
      where: whereClause,
      order: order,
      limit,
      offset
  });
});

// eslint-disable-next-line no-unused-vars
exports.AddOnsExport = async (params, userId = false) => {
  try {
      let { searchText, sort, sortField ,from,to,status} = params
      let order = handleSortFields(sortField, sort)
      // Prepare the where clause
      let whereClause = {
        [Op.and]: [ // Ensure 'AND' conditions are applied
            { isCustom: true }, // Add this condition for isCustom
            {
                [Op.or]: [
                    {
                        id: {
                            [Op.like]: '%' + searchText + '%'
                        }
                    },
                    {
                        projectId: {
                            [Op.like]: '%' + searchText + '%'
                        }
                    },
                    {
                        invoiceId: {
                            [Op.like]: '%' + searchText + '%'
                        }
                    },
                    {
                        '$credential.username$': {
                            [Op.like]: '%' + searchText + '%',
                        },
                    },
                    {
                        '$credential.name$': {
                            [Op.like]: '%' + searchText + '%',
                        },
                    },
                ]
            }
        ]
    };

    if(from && to){
      // Adjust 'to' date to end of day
         const tomorrow = new Date(to);
         tomorrow.setDate(tomorrow.getDate() + 1);
         tomorrow.setHours(0, 0, 0, 0);
          whereClause.createdAt = {
            [sequelize.Op.between]: [from, tomorrow]
        }
        }

        if(status){
          whereClause[Op.and].push({status:status})
        }
  

    const data =  await WhatsAppSubscription.findAndCountAll({
      attributes: [
          'id',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'subscriptionPrice',
          'subscriptionAmountPaid',
          'discount',
          'status',
          'billingType',
          'projectId',
          'invoiceId',
          'createdAt',
          'isCustom',
          'addOnType'
      ],
      include: [
          {
              model: credential,
              attributes: ['id', 'name', 'username'],
              include: [
                  {
                      // Self-reference join to get the name of the registeredBy user
                      model: credential,
                      as: 'registeredByCredential', // Alias for the registeredBy relation
                      attributes: ['name']
                  }
              ],
          },
          {
              model: corporateUser,
              attributes: ['id', 'name']
          }
      ],
      where: whereClause,
      order: order,
      raw: true,
      nest: true,
  });
  const ADD_ON_LABELS = {
      BOT_BUILDER: 'Bot Builder',
      SHOPIFY_INTEGRATION: 'Shopify Integration',
  };
  let finalData = []
      data.rows.forEach(function (limitData) {
          finalData.push({
              Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
              "Corporate Name": limitData.corporateUser?.name ? limitData.corporateUser?.name : "Not Available",
              "Corporate ID": limitData.credential ? limitData.credential.username : "Not Available",
              "Add-on": ADD_ON_LABELS[limitData.addOnType] || "Not Available",
              "Amount": limitData.subscriptionPrice ? "₹ "  + formatNumberWithLocalString(limitData.subscriptionPrice) : "₹ 0.00",
              "Amount Paid": limitData.subscriptionAmountPaid ? "₹ "  + formatNumberWithLocalString(limitData.subscriptionAmountPaid) : "₹ 0.00",
              //"Mobile Number": limitData.corporateUser ? limitData.corporateUser.mobileNo : "Not Available",
              "Status": limitData.status ? capitalizeFirstLetter(limitData.status) : "Not Available",
             // "Agreement Status":limitData.agreementDetails?capitalizeFirstLetter(limitData.agreementDetails.status) : "Pending"
          })
      })
      return finalData
  } catch (error) {
      console.log({ error })
      return false
  }

}

exports.findCurrentWhatsAppSubscription = asyncHandler(async (params) => {
    try {
        const { corporateId } = params;
  
        let whereConditions = {
            corporateUserId: corporateId,
            status: 'ACTIVE',
        };
  
        const subscription = await WhatsAppSubscription.findOne({
            include: [
                {
                    model: Package,
                    attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo', 'priorityLevel']
                },
            ],
            where: whereConditions,
            attributes: ['id', 'subscriptionStartDate', 'subscriptionEndDate', 'isCustom', 'isCancelled', 'billingType', 'status', 'subscriptionAmountPaid'],
            raw: true,
            nest: true,
        });
  
        if (!subscription) {
            return false;
        }
  
        return {
            subscription,
        };
    } catch (error) {
      customLog(null, "error", { message: "Error finding WhatsApp subscription details:", error })
        return false;
    }
  });
  
exports.findLastExpiredWhatsAppSubscription = asyncHandler(async (params) => {
    try {
        const { corporateId } = params;
        const checkLatestExpiredSubscription = await WhatsAppSubscription.findOne({
            include: [
                {
                    model: Package,
                },
            ],
            where: {
                status: 'EXPIRED',
                corporateUserId: corporateId,
                isCustom: false,
            },
            order: [['subscriptionEndDate', 'DESC']],
            raw: true,
            nest: true,
        });
        return checkLatestExpiredSubscription;
    } catch (error) {
        console.log(error);
        return false;
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
      customLog(null, "error", { message: "Error finding active subscription:", error })
        return null;
    }
  });

  exports.findLastExpiredBotBuilderSubscription = asyncHandler(async (params) => {
    try {
        const { corporateId } = params;
        const checkLatestExpiredSubscription = await WhatsAppSubscription.findOne({
            include: [
                {
                    model: Package,
                },
            ],
            where: {
                status: 'EXPIRED',
                corporateUserId: corporateId,
                isCustom: true,
                addOnType: 'BOT_BUILDER',
            },
            order: [['subscriptionEndDate', 'DESC']],
            raw: true,
            nest: true,
        });
        return checkLatestExpiredSubscription;
    } catch (error) {
        console.log(error);
        return false;
    }
  });

  exports.stopBotBuilderStatus = async (id) => {
    try {
        const [updatedRows] = await WhatsAppSubscription.update(
            { isCancelled: true },
            {
                where: {
                    id,
                    isCustom: true,
                    addOnType: 'BOT_BUILDER',
                },
            }
        );
        return updatedRows > 0;
    } catch (error) {
      customLog(null, "error", { message: "Error updating botBuilder status", error })
        return false
    }
  }

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
      customLog(null, "error", { message: "Error finding active Shopify Integration subscription:", error })
        return null;
    }
  });

  exports.findLastExpiredShopifyIntegrationSubscription = asyncHandler(async (params) => {
    try {
        const { corporateId } = params;
        const checkLatestExpiredSubscription = await WhatsAppSubscription.findOne({
            include: [
                {
                    model: Package,
                },
            ],
            where: {
                status: 'EXPIRED',
                corporateUserId: corporateId,
                isCustom: true,
                addOnType: 'SHOPIFY_INTEGRATION',
            },
            order: [['subscriptionEndDate', 'DESC']],
            raw: true,
            nest: true,
        });
        return checkLatestExpiredSubscription;
    } catch (error) {
        console.log(error);
        return false;
    }
  });

  exports.stopShopifyIntegrationStatus = async (id) => {
    try {
        const [updatedRows] = await WhatsAppSubscription.update(
            { isCancelled: true },
            {
                where: {
                    id,
                    isCustom: true,
                    addOnType: 'SHOPIFY_INTEGRATION',
                },
            }
        );
        return updatedRows > 0;
    } catch (error) {
      customLog(null, "error", { message: "Error updating Shopify Integration status", error })
        return false
    }
  }

  exports.findOne = asyncHandler(async (params, attributes=undefined) => {
    try {
        return await WhatsAppSubscription.findOne({
            where: params,
            include:[
                {
                    model: Package,
                    attributes: ['packageName', 'accessCode']
                }
            ],
            attributes,
            raw: true,
            nest:true,
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("SERVICE SUBSCRIPTION FIND ONE ROUTE CALLED")
    }
  })