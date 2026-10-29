const asyncHandler = require("../middlewares/async");
const {
  findAllIndividualPackages,
  findAllGroupPackages,
  findBasicGroupPackage,
  findOnePackage,
  findPackageByAccessCode,
  findExistingGroupPackage,
  findOneSubscription,
  cancelUserSubscription,
  findPackagesByServiceAccessKey,
  findAllGroupPackagesDiscountValue,
  findCashbackIsExist,
  findCurrentGroupSubscription,
  findSubscriptionIsExist,
  findCustomSubscription,
  findActiveIndividualBaseSubscription,
  findActiveIndividualPackageIds,
  findUserSubscriptionsByService,
  findIndiVidualPackageUnderGroup,
  findGroupServicesPricingUnderPackage,
  findAndCountAllUserSubscriptionsAll,
  findOneSubscriptionWhatsApp,
  findOneServiceSubscription,
  checkUserSubscriptionAccess,
  findLastExpiredSubscription,
  cancelUserSubscriptionPlan,
  calculateNextBillingInfo,
  findWhatsAppPackages,
  findAllActiveSubscriptionsForTest,
  shiftSubscriptionDatesForTest,
  shiftServiceSubscriptionDatesForTest,
} = require("../models/use-cases/subscription");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { subscriptionInvoiceTemplete } = require("../utils/subscriptionInvoice");
const { findUserCard } = require("../models/use-cases/savedCards");
const { findOneServiceCashbacks, findCashbackByPackageId, findBaseLimitAfterGroupDowngrade } = require("../models/use-cases/cashback");
const operatorsData = require("../utils/operatorsData.json");
const { findWhatsAppSubscription, cancelWhatsAppSubscription } = require("../models/use-cases/whatsappSubscription");
const { cancelServiceSubscription, findServiceSubscription } = require("../models/use-cases/serviceSubscription");
const { customLog } = require("../utils/loggerHelper");
const { calculateProRatedAddonPrice } = require("../utils/addonPricing");
const ErrorResponse = require("../utils/error-response");
const emailTemplates = require('../utils/emailTemplate/subscription');
const emailer = require('../utils/emailer');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { partnerLogos } = require('../utils/partnerLogos');
const moment = require('moment');
const { createNotification } = require("../models/use-cases/notification");
const corporateUser = require("../models/entities/corporateUser");
const {
  getSubscriptionLifecycleSettings,
  classifyLifecycleState,
} = require("../utils/subscriptionLifecycleSettings");
exports.listGroupPackages = asyncHandler(async (req, res) => {
  try {
    const partnerId = req.user.registeredBy;
    const packages = await findAllGroupPackages(partnerId);
    const basicPackage = await findBasicGroupPackage(partnerId);
    const allPackages = [...(packages || [])];
    if (basicPackage && !allPackages.some((pkg) => Number(pkg.id) === Number(basicPackage.id))) {
      allPackages.unshift(basicPackage);
      allPackages.sort((a, b) => Number(a.priorityLevel) - Number(b.priorityLevel));
    }

    const corporateUserId = req.user.corporateId;
    const currentSubscription = await findExistingGroupPackage(corporateUserId);
    const whatsappPlans = await findWhatsAppPackages(partnerId, req.user.id);

    if (!packages) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch subscriptions list",
        data: {},
        responseCode: "001",
      });
    }

    for (const package of allPackages) {
      const services = await findGroupServicesPricingUnderPackage(package.id, partnerId);
      package.services = services || [];
    }

    // Individual à-la-carte plans surfaced once at the top level (mirrors whatsappPlans).
    // Only listable single-service plans: must carry a priorityLevel (the ordering signal).
    // findAllIndividualPackages already limits to group-linked packages (type '1') and sorts
    // by priorityLevel. Each is flagged isOwned so the plans page can block re-purchase of a held plan.
    const allIndividualPackages = await findAllIndividualPackages(partnerId);
    const ownedIndividualPackageIds = await findActiveIndividualPackageIds(corporateUserId);
    const individualPlans = (allIndividualPackages || [])
      .filter((pkg) => pkg.priorityLevel != null)
      .map((pkg) => ({ ...pkg, isOwned: ownedIndividualPackageIds.includes(pkg.id) }));

    // When the user has no active main subscription, treat them as being on the basic plan
    const currentPackageId = currentSubscription?.package?.id ?? basicPackage?.id;
    const currentPlanPriorityLevel = currentSubscription?.package?.priorityLevel ?? basicPackage?.priorityLevel ?? 0;
    // Billing cycle of the active plan lets the plans page distinguish "current" from a monthly→annual
    // upgrade of the same package. Null for free/basic users (no paid subscription row).
    const currentBillingType = currentSubscription?.billingType ?? null;
    const currentPlanIsCancelled = Boolean(currentSubscription?.isCancelled);

    return res.status(200).json({
      status: true,
      message: "Subscriptions fetched successfully",
      data: {
        packages: allPackages,
        currentPackageId,
        currentPlanPriorityLevel,
        currentBillingType,
        currentPlanIsCancelled,
        whatsappPlans,
        individualPlans,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch subscriptions list",
      data: {},
      responseCode: "001",
    });
  }
});

// Static package config only. Dynamic pricing (discount, addon recurring price) is owned by
// the paymentGateway service — GET /payment-gateway/cashfree-gateway/subscription-pricing.
// Keep this endpoint pure metadata so price math has one source of truth.
exports.getPackageDetails = asyncHandler(async (req, res) => {
  try {
      const packageId = req.query.packageId;
      const partnerId = req.user.registeredBy;

      const packageDetails = await findOnePackage(packageId)

      if (!packageDetails) {
          return res.status(400).json({
              status: false,
              message: 'Failed to fetch plan deatils',
              data: {},
              responseCode: '001'
          });
      }

      packageDetails.individualPackages = await findIndiVidualPackageUnderGroup(packageId, partnerId) || {};
      packageDetails.services = await findGroupServicesPricingUnderPackage(packageId, partnerId) || [];

      return res.status(200).json({
          status: true,
          message: 'Plan details fetched successfully',
          data: { packageDetails },
          responseCode: '000'
      });

  } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error })
      return res.status(500).json({
          status: false,
          message: 'Failed to fetch Plan details',
          data: {},
          responseCode: '001'
      });
  }
})

// Lists all active INDIVIDUAL (à-la-carte) packages, each enriched with its cashback unitPrice +
// baseLimit (included units + per-extra-unit price). Powers the settings subscription view, where a
// user can expand each individual subscription to see its unit price and base limit (matched by
// packageId). Also carries packageId so a caller can route into the Subscribe → ReviewOrder flow.
exports.listIndividualPackages = asyncHandler(async (req, res) => {
  try {
    const partnerId = req.user.registeredBy;
    const packages = await findAllIndividualPackages(partnerId);
    if (!packages) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch individual packages",
        data: {},
        responseCode: "001",
      });
    }
    const enrichedPackages = await Promise.all(
      packages.map(async (pkg) => {
        const cashback = await findCashbackByPackageId(pkg.id);
        return {
          ...pkg,
          unitPrice: cashback?.unitPrice ?? null,
          baseLimit: cashback?.baseLimit ?? null,
          serviceAccessKey: cashback?.serviceOperator?.accessKey ?? null,
          isDynamicUnitPricing: cashback?.serviceOperator?.isDynamicUnitPricing ?? null,
        };
      })
    );
    return res.status(200).json({
      status: true,
      message: "Individual packages fetched successfully",
      data: { packages: enrichedPackages },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "listIndividualPackages failed", error: error?.message ?? error });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch individual packages",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getIndividualDetails = asyncHandler(async (req, res) => {

  try {

      const accessCode = req.query.accessKey // fallback key for package details
      const partnerId = req.user.registeredBy
      const corporateId = req.user.corporateId
      const credentialId = req.user.id;

      const serviceAccessKey = req.query.serviceAccessKey // this is main access key for identifying the service


      const subscription = await checkUserSubscriptionAccess({ corporateId, serviceAccessKey, credentialId })

      let packageDetails = await findPackagesByServiceAccessKey(serviceAccessKey, partnerId)
      if (!packageDetails || !packageDetails.length) {
          packageDetails = await findPackageByAccessCode(accessCode, partnerId)
      }

      if (!packageDetails.length) {
          return res.status(400).json({
              status: false,
              message: 'Failed to fetch Package details',
              data: {},
              responseCode: '001'
          });
      }

      const packageIds = packageDetails.map((package) => package.id)

      const isExistCashback = await findCashbackIsExist(packageIds)
      if (!isExistCashback) {
          return res.status(500).json({
              status: false,
              message: 'Service is unavailable at this moment. Please try again later.',
              data: {},
              responseCode: '001'
          });
      }

      const packageId = packageDetails[0]?.id

      // A fresh ACTIVE paid GROUP plan means any EXPIRED base row is just the previous cycle
      // (post-renewal) or the plan that was upgraded from — NOT a failed auto-renewal. We use it
      // to suppress BOTH previousSubscription and paidPlanExpiredRecently, so the RenewalOverlay
      // does not falsely show "your auto-renewal payment could not be processed" when the renewal
      // actually succeeded (predecessor row is naturally EXPIRED while the successor is ACTIVE).
      const activePaidGroup = await findCurrentGroupSubscription({ corporateId, excludeBasic: true });

      let previousSubscription = (packageId && !activePaidGroup)
          ? await findLastExpiredSubscription({ corporateId, packageId })
          : null
      if (previousSubscription) {
          previousSubscription = {
              ...previousSubscription,
              packageName: previousSubscription.package.packageName
          }
          delete previousSubscription.package
      } else {
          previousSubscription = null
      }

      const SUBSCRIPTION_LANDING_KEYS = {
            peko_payroll: 'payrollSubscriptionLanding',
            invoices: 'invoiceSubscriptionLanding',
            pekoCloud: 'cloudSubscriptionLanding'
        }

        const subscriptionLandingKey = SUBSCRIPTION_LANDING_KEYS[serviceAccessKey] || null
        let showSubscriptionLanding = false

        if (subscriptionLandingKey && corporateId) {
            const corporate = await corporateUser.findOne({
                where: { id: corporateId },
                attributes: ['id', 'productTour']
            })
            const productTour = (corporate && corporate.productTour) || {}
            if (productTour[subscriptionLandingKey] === true) {
                showSubscriptionLanding = true
            } else if (productTour[subscriptionLandingKey] === undefined) {
                // Existing purchased users → mark as already seen (false).
                // Users without an active subscription → seed as pending (true) so
                // they see the landing page once after they eventually purchase.
                // const seedValue = subscription ? false : true
                let seedValue = true

                await corporateUser.update(
                    { productTour: { ...productTour, [subscriptionLandingKey]: seedValue } },
                    { where: { id: corporateId } }
                )
                showSubscriptionLanding = seedValue
            }
        }

      // Surface any paid GROUP plan that expired in the last 30 days, independent of
      // whether the user currently has access (Peko Free fallback). Lets the UI render
      // an "upgrade" banner on addon pages even when isPurchased is true.
      // (Suppressed by the same activePaidGroup check above — post-renewal / post-upgrade.)
      const expiredGroup = activePaidGroup ? null : await findLastExpiredSubscription({ corporateId })
      const paidPlanExpiredRecently = expiredGroup
          ? {
              subscriptionId: expiredGroup.id,
              packageName: expiredGroup.package.packageName,
              packageType: expiredGroup.package.packageType,
              subscriptionEndDate: expiredGroup.subscriptionEndDate,
              billingType: expiredGroup.billingType,
              paymentMode: expiredGroup.paymentMode,
            }
          : null

      // Lifecycle state used by the frontend to decide between grace-period banner and
      // a frozen-state full-page overlay. Mirrors the structure on /check-expired-subscription.
      const lifecycleSettings = await getSubscriptionLifecycleSettings();
      const lifecycleState = subscription
          ? "ACTIVE"
          : classifyLifecycleState(paidPlanExpiredRecently?.subscriptionEndDate, lifecycleSettings);

      // Does the user already own THIS service's individual package (an active base subscription for it)?
      const ownsIndividualPackage = packageId
          ? !!(await findActiveIndividualBaseSubscription({ corporateId, packageId }))
          : false;

      return res.status(200).json({
          status: true,
          message: 'Package details fetched successfully',
          data: {
              packageDetails: packageDetails,
              isPurchased: subscription ? true : false,
              // Drive the per-service "upgrade to individual package" CTA: show it only for basic/free
              // users (no active paid GROUP plan) who don't already own this service's individual package.
              isPaidGroupUser: !!activePaidGroup,
              ownsIndividualPackage,
              previousSubscription: previousSubscription,
              paidPlanExpiredRecently: paidPlanExpiredRecently,
              lifecycle: {
                  state: lifecycleState,
                  gracePeriodDays: lifecycleSettings.gracePeriodDays,
                  frozenPeriodDays: lifecycleSettings.frozenPeriodDays,
                  payrollDataClearDays: lifecycleSettings.payrollDataClearDays,
              },
              showSubscriptionLanding,
              subscriptionLandingKey
          },
          responseCode: '000'
      });

  } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return res.status(500).json({
          status: false,
          message: 'Failed to fetch Package details',
          data: {},
          responseCode: '001'
      });
  }
})

exports.getLastUserGroupSubscription = asyncHandler(async (req, res) => {

  try {
      const corporateId = req.user.corporateId;
      const partnerId = req.user.registeredBy
      const currentSubscription = await findCurrentGroupSubscription({ corporateId, partnerId, excludeBasic: true })
      let isPurchased = false
      if (currentSubscription) {
          isPurchased = true
      }
      // Suppress the expired-plan signal when a fresh ACTIVE paid GROUP plan exists: the last
      // EXPIRED group row is then just the previous cycle (post-renewal) or the plan upgraded
      // from — NOT a failed auto-renewal. Without this the dashboard RenewalOverlay falsely shows
      // "your auto-renewal payment could not be processed" right after a successful renewal.
      let previousSubscription = currentSubscription
          ? null
          : await findLastExpiredSubscription({ corporateId })
      if (previousSubscription) {
          previousSubscription = {
              ...previousSubscription,
              packageName: previousSubscription.package.packageName,
              packageType: previousSubscription.package.packageType,
              subscriptionId: previousSubscription.id,
          }
          delete previousSubscription.package
          delete previousSubscription.id
      } else {
          previousSubscription = null
      }

      // Compute lifecycle state (ACTIVE / GRACE / FROZEN / CLEAR_ELIGIBLE) so the frontend
      // can choose between a renewal banner (GRACE) and a full UI lock with subscribe overlay
      // (FROZEN / CLEAR_ELIGIBLE). Settings come from the DB `settings` row so admins can
      // tune the windows without a deploy.
      const lifecycleSettings = await getSubscriptionLifecycleSettings();
      const lifecycleState = isPurchased
          ? "ACTIVE"
          : classifyLifecycleState(previousSubscription?.subscriptionEndDate, lifecycleSettings);

      return res.status(200).json({
          status: true,
          message: 'Package details fetched successfully',
          data: {
              isPurchased: isPurchased,
              previousSubscription: previousSubscription,
              lifecycle: {
                  state: lifecycleState,
                  gracePeriodDays: lifecycleSettings.gracePeriodDays,
                  frozenPeriodDays: lifecycleSettings.frozenPeriodDays,
                  payrollDataClearDays: lifecycleSettings.payrollDataClearDays,
              },
          },
          responseCode: '000'
      });

  } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return res.status(500).json({
          status: false,
          message: 'Failed to fetch Package details',
          data: {},
          responseCode: '001'
      });
  }
})

exports.getTableDetails = asyncHandler(async (req, res) => {
  try {
    const partnerId = req.user.registeredBy;
    const groupPackges = await findAllGroupPackages(partnerId);
    const individualPackage = await findAllIndividualPackages(partnerId);

    const groupPackgesIds = groupPackges.map((pkg) => pkg.id);
    const discount = await findAllGroupPackagesDiscountValue(groupPackgesIds);
    let tableData = {
      groupPackageDiscounts: discount,
    };

    if (groupPackges && groupPackges.length > 0) {
      const groupPackgesWithPrice = groupPackges.reduce((acc, curr) => {
        acc[curr.packageName] = curr.packagePrices.monthly - curr.discount.monthly;
        return acc;
      }, {});
      tableData.groupPackages = groupPackgesWithPrice;
    }

    if (individualPackage && individualPackage.length > 0) {
      const individualPackagesWithPrice = individualPackage.reduce((acc, curr) => {
        acc[curr.packageName] = curr.packagePrices.monthly - curr.discount.monthly;
        return acc;
      }, {});
      tableData.individualPackages = individualPackagesWithPrice;
    }

    if (!tableData) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch Package details",
        data: {},
        responseCode: "001",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Package details fetched successfully",
      data: {
        tableData,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch Package details",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getLifecycleSettings = asyncHandler(async (req, res) => {
  const lifecycleSettings = await getSubscriptionLifecycleSettings();
  const payrollFreeEmployeeLimit = await findBaseLimitAfterGroupDowngrade({
    accessKey: operatorsData.payroll.accessKey,
    corporateId: req.user.corporateId,
    partnerId: req.user.registeredBy,
  });
  return res.status(200).json({
    status: true,
    message: 'Lifecycle settings fetched successfully',
    data: {
      gracePeriodDays: lifecycleSettings.gracePeriodDays,
      frozenPeriodDays: lifecycleSettings.frozenPeriodDays,
      payrollDataClearDays: lifecycleSettings.payrollDataClearDays,
      payrollFreeEmployeeLimit,
    },
    responseCode: '000',
  });
});

exports.getCurrentSubscription = asyncHandler(async (req, res) => {
  const corporateId = req.user.corporateId;
  const partnerId = req.user.registeredBy;
  const currentSubscription = await findCurrentGroupSubscription({
    corporateId,
    partnerId,
  });

  const userCardData = await findUserCard({ corporateId });

  if (!currentSubscription) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch Subscription details",
      data: {},
      responseCode: "001",
    });
  }

  const nextBillingInfo = await calculateNextBillingInfo(corporateId, currentSubscription);

  return res.status(200).json({
    status: true,
    message: "Subscription details fetched successfully",
    data: {
      currentSubscription,
      userCardData: userCardData ? userCardData : null,
      nextBillingInfo,
    },
    responseCode: "000",
  });
});

exports.getPurchaseHistoryAll = asyncHandler(async (req, res) => {
  const corporateId = req.user.corporateId;
  const partnerId = req.user.registeredBy;
  let { status, page, itemsPerPage, packageType } = req.query;

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    limit,
    offset,
    corporateId,
    status,
    packageType,
  };
  try {
    const activeSubscriptions = await findAndCountAllUserSubscriptionsAll(params);
    const currentSubscription = await findCurrentGroupSubscription({ corporateId, excludeBasic: true, partnerId });
    if (!activeSubscriptions) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch purchase history",
        data: {},
        responseCode: "001",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Subscription history fetched successfully",
      data: {
        activeSubscriptions,
        currentGroupSubscription: currentSubscription ? currentSubscription : null,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching purchase history",
      data: {},
      responseCode: "001",
    });
  }
});

exports.findTransactionDetails = asyncHandler(async (req, res) => {
  try {
    let subscriptionId = req.params.subscriptionId;
    const corporateId = req.user.corporateId;
    let fromTable = req.query.type;

    if (subscriptionId) {
      let result;
      if (fromTable === "serviceSubscription") {
        result = await findOneServiceSubscription({ subscriptionId, corporateId });
      } else if (fromTable === "whatsAppSubscription") {
        result = await findOneSubscriptionWhatsApp({ subscriptionId, corporateId });
      } else {
        result = await findOneSubscription({ subscriptionId, corporateId });
      }

      if (!result) {
        return res.status(500).json({
          status: false,
          message: "Subscription details not found.",
          data: {},
          responseCode: "001",
        });
      }

      let userData = {
        companyName: req.user.companyName,
        email: req.user.email,
        mobile: req.user.mobileNo,
        city: req.user.city,
        country: req.user.country,
      };

      const invoiceHtmlWithStyle = subscriptionInvoiceTemplete(result, userData);
      let random = new Date().valueOf();

      let browser;
      try {
        // Create a browser instance with Puppeteer
        browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        // Set content to the page
        await page.setContent(invoiceHtmlWithStyle);

        // Generate PDF using Puppeteer
        const outputFile = `Invoice-${random}.pdf`;
        await page.pdf({
          path: outputFile,
          format: "A4",
          preferCSSPageSize: true,
        });

        const pdfBuffer = fs.readFileSync(outputFile);

        fs.unlinkSync(outputFile);

        return res.status(200).json({
          status: true,
          message: "Invoice generated successfully.",
          data: {
            pdfBuffer,
          },
          responseCode: "000",
        });
      } finally {
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            customLog(req?.LogTraceId, "error", { message: "Error closing browser", data: closeError });
          }
        }
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Subscription ID not provided",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again later.",
      data: {},
      responseCode: "001",
    });
  }
});

exports.cancelSubscription = asyncHandler(async (req, res) => {
  try {
    const subscriptionId = req.params.subscriptionId;
    const corporateId = req.user.corporateId;

    if (!subscriptionId) {
      return res.status(400).json({
        status: false,
        message: "Subscription ID not provided",
        data: {},
        responseCode: "001",
      });
    }

    let result;
    let subscription = await findOneSubscription({ subscriptionId, corporateId });

    let isCancelled = false;
    if (subscription) {
      if (subscription.status === "CANCELLED") {
        isCancelled = true;
      }
      const { packageType, packageName } = subscription.package;
      const { packageId, isCustom, subscriptionEndDate } = subscription;

      result = await cancelUserSubscription({ subscriptionId, corporateId, packageType, packageId, isCustom });
      if(result.success){
        // Addon rows inherit packageName from the GROUP plan they were bought under (e.g. a
        // Payroll add-on shows packageName="Peko+"). Surfacing that in the email/notification
        // would tell the user "Your Peko+ subscription has been cancelled" when only the
        // add-on was cancelled. Use the joined serviceOperator's serviceProvider for add-ons
        // so the copy reflects the actual service (e.g. "Your Payroll add-on…").
        const serviceProvider = subscription.serviceOperator?.serviceProvider;
        const displayName = isCustom
            ? `${serviceProvider || packageName || 'Add-on'} add-on`
            : packageName;
        const to = req.user.email
            const subject = `Your ${displayName} Subscription Has Been Cancelled`;
            const endDateFormated = moment(subscriptionEndDate).format("MMMM D, YYYY")

            // When a GROUP plan cancel cascaded across add-ons (Payroll) and the bundled
            // WhatsApp Basic, build a single human-readable list so the customer can see
            // everything that will expire on the same day.
            const cascadedNames = [];
            if (Array.isArray(result.cascadedAddons)) {
                for (const a of result.cascadedAddons) {
                    cascadedNames.push(
                        a.maxLimit ? `${a.name} add-on (${a.maxLimit} units)` : `${a.name} add-on`,
                    );
                }
            }
            if (result.bundledWhatsAppCancelled) {
                cascadedNames.push('WhatsApp Basic (bundled)');
            }
            const cascadeNote = cascadedNames.length > 0
                ? ` The following will also expire on ${endDateFormated}: ${cascadedNames.join(', ')}.`
                : '';

            const partnerData = req.user.registeredBy
                ? await fetchPartnerDetails(req.user.registeredBy)
                : await partnerLogos();
            const body = emailTemplates.generateCancellationMail(
                {
                    serviceName: displayName,
                    corporateName: req.user.name,
                    cancelledDate: moment().format("DD-MM-YYYY"),
                    endDate: endDateFormated,
                    cascadeNote,
                }, partnerData);
            emailer.email(to, subject, body);

            const notificationData = {
                notificationTitle: subject,
                notificationBrief: `Your ${displayName} subscription has been successfully cancelled. You can continue to use it until ${endDateFormated}.${cascadeNote} You can re-subscribe anytime via Peko.`,
                notificationTo: [req.user.username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            };

            await createNotification(notificationData)
      }
    }
    if (!subscription) {
      subscription = await findWhatsAppSubscription({ subscriptionId, corporateId });
      if (subscription) {
        if (subscription.isCancelled) {
          isCancelled = true;
        }
        result = await cancelWhatsAppSubscription({ subscriptionId });
      }
    }
    if (!subscription) {
      subscription = await findServiceSubscription({ subscriptionId, corporateId });
      if (subscription) {
        if (subscription.isCancelled) {
          isCancelled = true;
        }
        result = await cancelServiceSubscription({ subscriptionId });
      }
    }

    if (!subscription) {
      return res.status(404).json({
        status: false,
        message: "Invalid subscription details.",
        data: {},
        responseCode: "001",
      });
    }

    if (isCancelled) {
      return res.status(200).json({
        status: true,
        message: "Subscription already cancelled",
        data: {},
        responseCode: "001",
      });
    }

    if (!result.success) {
      return res.status(500).json({
        status: false,
        message: "Something went wrong while cancelling the subscription.",
        data: {},
        responseCode: "001",
      });
    }
    

    return res.status(200).json({
      status: true,
      message: result.message,
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data ?? error?.response });
    return res.status(500).json({
      status: false,
      message: "Something went wrong while cancelling the subscription.",
      data: {},
      responseCode: "001",
    });
  }
});

exports.cancelSubscriptionPlan = asyncHandler(async (req, res, next) => {
  try {
      const { subscriptionId, type } = req.params;
      const corporateId = req.user.corporateId;

      if (!subscriptionId || !type) {
          return res.status(400).json({
              status: false,
              message: 'Please check the request',
              data: {},
              responseCode: '001'
          });
      }

      // for peko subscription plan cancellation
          const pekoSubscription = await findOneSubscription({ subscriptionId, corporateId });
          if (!pekoSubscription) {
              return next(new ErrorResponse('Something went wrong while cancelling the subscription.', 500));
          }
          if (pekoSubscription.status === 'CANCELLED' || pekoSubscription.isCancelled) {
              return next(new ErrorResponse('The subscription you are trying to cancel has already been cancelled.', 400))
          }
          const { packageType, packageName } = pekoSubscription.package;
          const { packageId, isCustom, subscriptionEndDate } = pekoSubscription;
          let result = await cancelUserSubscriptionPlan({ subscriptionId, corporateId, packageType, packageId, isCustom });

          if (!result.success) return next(new ErrorResponse('Something went wrong while cancelling the subscription.', 500));

          // Same rationale as cancelSubscription above: addon rows inherit packageName from
          // the GROUP plan they were bought under, so use the joined serviceOperator's
          // serviceProvider for add-ons to keep the copy accurate.
          const serviceProvider = pekoSubscription.serviceOperator?.serviceProvider;
          const displayName = isCustom
              ? `${serviceProvider || packageName || 'Add-on'} add-on`
              : packageName;
          const to = req.user.email
          const subject = `Your ${displayName} Subscription Has Been Cancelled`;
          const endDateFormated = moment(subscriptionEndDate).format("MMMM D, YYYY")
          const partnerData = req.user.registeredBy
              ? await fetchPartnerDetails(req.user.registeredBy)
              : await partnerLogos();
          const body = emailTemplates.generateCancellationMail(
              {
                  serviceName: displayName,
                  corporateName: req.user.name,
                  cancelledDate: moment().format("DD-MM-YYYY"),
                  endDate: endDateFormated
              }, partnerData);
          emailer.email(to, subject, body);

          const notificationData = {
              notificationTitle: subject,
              notificationBrief: `Your ${displayName} subscription has been successfully cancelled. You can continue to use it until ${endDateFormated}. You can re-subscribe anytime via Peko.`,
              notificationTo: [req.user.username],
              notificationCategory: "CORPORATE",
              notificationBy: "ADMIN",
          };

          await createNotification(notificationData)

      if(result){
          return res.status(200).json({
              status: true,
              message: result.message,
              data: {},
              responseCode: '000'
          });
      }
      

      return res.status(500).json({
          status: false,
          message: 'Something went wrong while cancelling the subscription.',
          data: {},
          responseCode: '001'
      });
  } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return res.status(500).json({
          status: false,
          message: 'Something went wrong while cancelling the subscription.',
          data: {},
          responseCode: '001'
      });
  }
});

exports.getServiceAdditionalDetails = asyncHandler(async (req, res) => {
  try {
    const accessKey = req.query.accessKey;
    const { user } = req;
    const corporateId = user.corporateId;
    const partnerId = req.user.registeredBy;

    customLog(req?.LogTraceId, "info", {
      message: "getServiceAdditionalDetails: request received",
      handler: "getServiceAdditionalDetails",
      stage: "entry",
      accessKey,
      corporateId,
      partnerId,
      partnerIdType: typeof partnerId,
      role: user?.role,
      credentialId: user?.id,
    });

    if (!accessKey) {
      customLog(req?.LogTraceId, "error", {
        message: "getServiceAdditionalDetails: responding 401",
        handler: "getServiceAdditionalDetails",
        stage: "accessKey-missing",
        httpStatus: 401,
        responseCode: "001",
        corporateId,
        query: req.query,
      });
      return res.status(401).json({
        status: false,
        message: "Access key is required",
        data: {},
        responseCode: "001",
      });
    }
    // use the access key for fetching all entries from cashback table. it will includes more than one entries
    let allCashbacks = await findOneServiceCashbacks(accessKey, partnerId);

    customLog(req?.LogTraceId, "info", {
      message: "getServiceAdditionalDetails: cashbacks fetched",
      handler: "getServiceAdditionalDetails",
      stage: "cashbacks",
      accessKey,
      corporateId,
      partnerId,
      isArray: Array.isArray(allCashbacks),
      cashbackCount: Array.isArray(allCashbacks) ? allCashbacks.length : 0,
      cashbacks: Array.isArray(allCashbacks)
        ? allCashbacks.map((row) => ({
            packageId: row.packageId,
            packageType: row.package?.packageType,
            unitPrice: row.unitPrice,
            baseLimit: row.baseLimit,
            serviceOperatorId: row.serviceOperator?.id,
            isDynamicUnitPricing: row.serviceOperator?.isDynamicUnitPricing,
          }))
        : allCashbacks,
    });

    if (!allCashbacks.length) {
      customLog(req?.LogTraceId, "error", {
        message: "getServiceAdditionalDetails: responding 401",
        handler: "getServiceAdditionalDetails",
        stage: "no-cashbacks",
        httpStatus: 401,
        responseCode: "001",
        accessKey,
        corporateId,
        partnerId,
        cashbackLookupFailed: allCashbacks === false,
      });
      return res.status(401).json({
        status: false,
        message: "Failed to fetch add on details",
        data: {},
        responseCode: "001",
      });
    }

    // Collect all packageIds from cashbacks (covers both INDIVIDUAL and GROUP packages for this service)
    const packageIds = allCashbacks.map((row) => row.packageId);

    // Check if the user has an active (or recently expired) subscription for this service
    const isUserSubscribed = await findSubscriptionIsExist({
      corporateId,
      packageIds,
    });

    customLog(req?.LogTraceId, "info", {
      message: "getServiceAdditionalDetails: base subscription lookup",
      handler: "getServiceAdditionalDetails",
      stage: "base-subscription",
      accessKey,
      corporateId,
      packageIds,
      found: !!isUserSubscribed,
      subscriptionId: isUserSubscribed?.id,
      subscriptionPackageId: isUserSubscribed?.packageId,
      subscriptionStatus: isUserSubscribed?.status,
      subscriptionEndDate: isUserSubscribed?.subscriptionEndDate,
    });

    if (!isUserSubscribed) {
      customLog(req?.LogTraceId, "error", {
        message: "getServiceAdditionalDetails: responding 401",
        handler: "getServiceAdditionalDetails",
        stage: "no-base-subscription",
        httpStatus: 401,
        responseCode: "001",
        accessKey,
        corporateId,
        packageIds,
      });
      return res.status(401).json({
        status: false,
        message: "Subscription not purchased.",
        data: {},
        responseCode: "001",
      });
    }

    // ── Remaining days calculation ─────────────────────────────────────────────
    // How many days are left in the user's current billing cycle.
    // This is used for pro-rated pricing: if < 30 days remain, the addon price
    // is reduced proportionally so the user only pays for the days left.
    // Example: unitPrice = ₹50, 10 days left → charge = (50/30) × 10 = ₹16.67
    const subscriptionEndDate = new Date(isUserSubscribed.subscriptionEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((subscriptionEndDate - today) / (1000 * 60 * 60 * 24));

    customLog(req?.LogTraceId, "info", {
      message: "getServiceAdditionalDetails: remaining days computed",
      handler: "getServiceAdditionalDetails",
      stage: "days-remaining",
      accessKey,
      corporateId,
      subscriptionId: isUserSubscribed?.id,
      subscriptionStatus: isUserSubscribed?.status,
      rawSubscriptionEndDate: isUserSubscribed?.subscriptionEndDate,
      parsedSubscriptionEndDate: Number.isNaN(subscriptionEndDate.getTime())
        ? "INVALID_DATE"
        : subscriptionEndDate.toISOString(),
      now: today.toISOString(),
      daysRemaining,
    });

    // If subscription is already expired (daysRemaining <= 0), deny addon pricing
    if (daysRemaining <= 0) {
      customLog(req?.LogTraceId, "error", {
        message: "getServiceAdditionalDetails: responding 401",
        handler: "getServiceAdditionalDetails",
        stage: "subscription-expired",
        httpStatus: 401,
        responseCode: "001",
        accessKey,
        corporateId,
        subscriptionId: isUserSubscribed?.id,
        subscriptionStatus: isUserSubscribed?.status,
        rawSubscriptionEndDate: isUserSubscribed?.subscriptionEndDate,
        daysRemaining,
      });
      return res.status(401).json({
        status: false,
        message: "Subscription not purchased.",
        data: {},
        responseCode: "001",
      });
    }

    // ── Pricing source selection ────────────────────────────────────────────────
    // Prefer GROUP cashback row for the user's active group plan (Peko Go/Peko+),
    // fallback to INDIVIDUAL cashback only if group row is unavailable.
    const individualCashback = allCashbacks.find((row) => row.package.packageType === "INDIVIDUAL");
    const groupSubscription = await findCurrentGroupSubscription({ corporateId, partnerId });
    const groupCashback = groupSubscription
      ? allCashbacks.find(
          (row) => row.package.packageType === "GROUP" && row.packageId === groupSubscription.package.id
        )
      : null;

    // Does the user own an ACTIVE individual package for this service? Drives BOTH the limit stack
    // and pricing precedence (its lower unit price + own packageId). The individual package's
    // included limit is snapshotted (locked) on its base row's maxLimit at purchase.
    let individualBaseSub = null;
    if (individualCashback) {
      individualBaseSub = await findActiveIndividualBaseSubscription({
        corporateId,
        packageId: individualCashback.packageId,
      });
    }
    const ownsIndividual = !!individualBaseSub;

    // INDIVIDUAL-wins when the user owns the active individual package; otherwise GROUP (Peko Go/Peko+),
    // then INDIVIDUAL as a fallback. The server-side addon purchase + renewal recompute mirror this.
    const pricingCashback = (ownsIndividual && individualCashback)
      ? individualCashback
      : (groupCashback || individualCashback);

    customLog(req?.LogTraceId, "info", {
      message: "getServiceAdditionalDetails: pricing tier resolved",
      handler: "getServiceAdditionalDetails",
      stage: "pricing-tier",
      accessKey,
      corporateId,
      partnerId,
      hasIndividualCashback: !!individualCashback,
      individualCashbackPackageId: individualCashback?.packageId,
      hasGroupSubscription: !!groupSubscription,
      groupSubscriptionPackageId: groupSubscription?.package?.id,
      hasGroupCashback: !!groupCashback,
      groupCashbackPackageId: groupCashback?.packageId,
      ownsIndividual,
      individualBaseSubscriptionId: individualBaseSub?.id,
      individualBaseMaxLimit: individualBaseSub?.maxLimit,
      resolvedPackageId: pricingCashback?.packageId,
      resolvedPackageType: pricingCashback?.package?.packageType,
      resolvedUnitPrice: pricingCashback?.unitPrice,
    });

    if (!pricingCashback) {
      customLog(req?.LogTraceId, "error", {
        message: "getServiceAdditionalDetails: responding 401",
        handler: "getServiceAdditionalDetails",
        stage: "no-pricing-cashback",
        httpStatus: 401,
        responseCode: "001",
        accessKey,
        corporateId,
        partnerId,
        ownsIndividual,
        hasIndividualCashback: !!individualCashback,
        hasGroupCashback: !!groupCashback,
        groupSubscriptionPackageId: groupSubscription?.package?.id,
        cashbackPackageIds: packageIds,
      });
      return res.status(401).json({
        status: false,
        message: "Failed to fetch add on details",
        data: {},
        responseCode: "001",
      });
    }

    // ── Effective base limit ───────────────────────────────────────────────────
    // When the user owns the INDIVIDUAL package for this service, ONLY its limit applies — the
    // group/basic plan's included limit is NOT added (an individual Payroll of 25 means 25, not
    // 25 + the free 3 = 28). Otherwise the group/basic base limit applies. The individual limit is
    // snapshotted (locked) on its base subscription row's maxLimit at purchase, so read it from the
    // row — not the live cashback. Add-ons still stack on top (below). Mirrors the enforcement in
    // officeAndBusiness findMaximumUsageLimitForAccessKey.
    const groupBaseLimit = groupCashback ? (parseInt(groupCashback.baseLimit) || 0) : 0;
    // Legacy individual rows (purchased before snapshotting) have maxLimit NULL —
    // fall back to the individual package's live cashback baseLimit instead of reading 0.
    const individualBaseLimit = ownsIndividual
      ? (individualBaseSub.maxLimit != null
          ? (parseInt(individualBaseSub.maxLimit) || 0)
          : (parseInt(individualCashback.baseLimit) || 0))
      : 0;
    let effectiveBaseLimit = ownsIndividual ? individualBaseLimit : groupBaseLimit;
    let baseUnitPrice = parseFloat(pricingCashback.unitPrice);

    // Add-on eligibility: the unit price must be configured on the resolved tier's cashback — i.e. the
    // user's CURRENT plan (individual package if owned, else the active group/basic package). If it isn't
    // configured (empty / 0 / non-numeric), add-ons aren't offered for that plan, so return a clear message
    // instead of a NaN price the client can't use.
    const isAddonPurchaseAllowed = baseUnitPrice > 0;

    // ── Pro-rated unit price ───────────────────────────────────────────────────
    // isDynamicUnitPricing = true  → pro-rate when < 30 days remain
    //   charge = (baseUnitPrice / 30) × daysRemaining  (rounded up to nearest paisa)
    // isDynamicUnitPricing = false → always charge full price regardless of days left
    // daysRemaining > 30           → always charge full price (next renewal will handle it)
    let unitPrice;
    if (daysRemaining > 30 || !pricingCashback.serviceOperator?.isDynamicUnitPricing) {
      unitPrice = baseUnitPrice;
    } else {
      unitPrice = calculateProRatedAddonPrice(baseUnitPrice, daysRemaining);
    }

    // ── Total allowed limit ────────────────────────────────────────────────────
    // maxLimit = plan's base limit + sum of THIS service's addon rows only.
    // serviceOperatorId + accessKey are the reliable per-service identifiers. Do NOT fall back to
    // the GROUP plan's packageId for the packageId lookup: a service with no INDIVIDUAL package
    // (e.g. Turbo/garage) would otherwise be counted against the shared group package, which every
    // addon under that plan carries — summing other services' addons (Payroll, eInvoice, …) into
    // this service's limit. When there's no individual package, leave packageId undefined so the
    // count stays scoped to serviceOperatorId / accessKey.
    const addonLookupPackageId = pricingCashback.package.packageType === "INDIVIDUAL"
      ? pricingCashback.packageId
      : individualCashback?.packageId;
    const isCustomSubscriptionExist = await findCustomSubscription({
      corporateId,
      serviceOperatorId: pricingCashback.serviceOperator?.id,
      accessKey,
      packageId: addonLookupPackageId,
    });

    customLog(req?.LogTraceId, "info", {
      message: "getServiceAdditionalDetails: addon rows lookup",
      handler: "getServiceAdditionalDetails",
      stage: "addon-limit",
      accessKey,
      corporateId,
      serviceOperatorId: pricingCashback.serviceOperator?.id,
      addonLookupPackageId,
      found: !!isCustomSubscriptionExist,
      addonMaxLimit: isCustomSubscriptionExist?.maxLimit,
      unitPrice,
      isAddonPurchaseAllowed,
    });
    const addonLimit = isCustomSubscriptionExist ? parseInt(isCustomSubscriptionExist.maxLimit) : 0;
    const maxLimit = effectiveBaseLimit + addonLimit;

    return res.status(200).json({
      status: true,
      message: "Package details fetched successfully",
      data: {
        unitPrice: unitPrice,
        maxLimit: maxLimit,
        freeBaseLimit: effectiveBaseLimit,
        addonLimit: addonLimit,
        isDynamicUnitPricing: pricingCashback.serviceOperator?.isDynamicUnitPricing ?? false,
        isAddonPurchaseAllowed,
        packageId: pricingCashback.package.packageType === "INDIVIDUAL"
          ? pricingCashback.packageId
          : (individualCashback?.packageId || pricingCashback.packageId),
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "getServiceAdditionalDetails: responding 500",
      handler: "getServiceAdditionalDetails",
      stage: "unhandled-error",
      httpStatus: 500,
      responseCode: "001",
      accessKey: req?.query?.accessKey,
      corporateId: req?.user?.corporateId,
      partnerId: req?.user?.registeredBy,
      error: error?.message,
      stack: error?.stack,
    });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch add on details",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getServiceBasePurchaseHistory = asyncHandler(async (req, res) => {
  const corporateId = req.user.corporateId;
  let { accessCode } = req.query;
  let params = {
    accessCode,
    corporateId,
  };
  try {
    const subscriptionList = await findUserSubscriptionsByService(params);
    if (!subscriptionList.currentSubscription) {
      return res.status(500).json({
        status: false,
        message: "Invalid Subscription details",
        data: {},
        responseCode: "001",
      });
    }

    let { currentSubscription, cashbacks, addOns, cancelledAddOns } = subscriptionList;
    // let maxLimit = addOns ? parseInt(cashbacks.baseLimit) + parseInt(addOns.maxLimit) : parseInt(cashbacks.baseLimit);
    let maxLimit = parseFloat(cashbacks.baseLimit)

    // if (addOns) {
    //   addOns = {
    //     ...addOns,
    //     maxLimit: parseInt(addOns.maxLimit),
    //     subscriptionAmountPaid: parseFloat(addOns.maxLimit) * parseFloat(cashbacks.unitPrice)
    //   };
    // }
    const { billingType, package } = currentSubscription;
    const packagePrices = typeof package.packagePrices === 'string'
      ? JSON.parse(package.packagePrices)
      : package.packagePrices;
    const packageDiscount = typeof package.discount === 'string'
      ? JSON.parse(package.discount)
      : package.discount;
    const isAnnually = billingType === 'ANNUALLY';
    const currentSubscriptionAmount = packagePrices
      ? parseFloat((isAnnually ? packagePrices.annually : packagePrices.monthly) ?? 0)
      : 0;
    const currentSubscriptionAmountDiscount = packageDiscount
      ? parseFloat((isAnnually ? packageDiscount.annually : packageDiscount.monthly) ?? 0)
      : 0;

    currentSubscription = {
      ...currentSubscription,
      subscriptionAmountPaid: currentSubscriptionAmount - currentSubscriptionAmountDiscount,
      maxLimit: maxLimit,
    };

    return res.status(200).json({
      status: true,
      message: "Subscription details fetched successfully",
      data: {
        currentSubscription,
        addOns,
        cancelledAddOns,
        isGroupSubscription: currentSubscription?.package?.packageType === "GROUP",
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching purchase history",
      data: {},
      responseCode: "001",
    });
  }
});

// ── TEST-ONLY endpoints (UAT date manipulation) ──────────────────────────────

exports.getActiveSubscriptionsForTest = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_ROUTES) {
    return res.status(403).json({
      status: false,
      message: "Test endpoint disabled in production",
      data: {},
      responseCode: "001",
    });
  }
  // Admin (SYSTEM_USER) passes ?corporateId=<target>; a corporate's own token omits it and we resolve
  // from req.user. Number('') / Number(undefined) → NaN → falls back to the token's corporateId.
  // Only an admin may target another corporate.
  const requestedCorporateId = req.user?.role === "SYSTEM_USER" ? Number(req.query.corporateId) : NaN;
  const corporateId = requestedCorporateId || req.user?.corporateId;
  if (!corporateId) {
    return res.status(400).json({
      status: false,
      message: "corporateId is required",
      data: {},
      responseCode: "001",
    });
  }
  const subscriptions = await findAllActiveSubscriptionsForTest(corporateId);

  if (subscriptions === false) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch active subscriptions",
      data: {},
      responseCode: "001",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Active subscriptions fetched successfully",
    data: { subscriptions, count: subscriptions.length },
    responseCode: "000",
  });
});

exports.shiftSubscriptionDatesForTest = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_ROUTES) {
    return res.status(403).json({
      status: false,
      message: "Test endpoint disabled in production",
      data: {},
      responseCode: "001",
    });
  }
  // Admin passes corporateId in the body; a corporate's own token omits it and we resolve from req.user.
  // Only an admin may target another corporate.
  const requestedCorporateId = req.user?.role === "SYSTEM_USER" ? Number(req.body.corporateId) : NaN;
  const corporateId = requestedCorporateId || req.user?.corporateId;
  const days = parseInt(req.body.days, 10);

  if (!corporateId) {
    return res.status(400).json({
      status: false,
      message: "corporateId is required",
      data: {},
      responseCode: "001",
    });
  }

  if (!days || days <= 0 || days > 365) {
    return res.status(400).json({
      status: false,
      message: "days must be a positive integer between 1 and 365",
      data: {},
      responseCode: "001",
    });
  }

  // Optional per-package targeting. The UI sends the selected rows split by table (ids are not unique
  // across tables). Omit both to shift ALL shiftable packages (free/basic is always excluded server-side).
  // Reject a present-but-malformed target field (e.g. a bare number instead of an array) rather than
  // silently degrading to "shift all" — a mistyped targeting payload must not become a mass shift.
  const rawSubIds = req.body.subscriptionIds;
  const rawWaIds = req.body.whatsappSubscriptionIds;
  if ((rawSubIds !== undefined && !Array.isArray(rawSubIds)) || (rawWaIds !== undefined && !Array.isArray(rawWaIds))) {
    return res.status(400).json({
      status: false,
      message: "subscriptionIds and whatsappSubscriptionIds must be arrays of ids",
      data: {},
      responseCode: "001",
    });
  }
  const toIdArray = (v) =>
    Array.isArray(v) ? v.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0) : undefined;
  const subscriptionIds = toIdArray(rawSubIds);
  const whatsappSubscriptionIds = toIdArray(rawWaIds);
  const hasTargets = subscriptionIds !== undefined || whatsappSubscriptionIds !== undefined;
  if (hasTargets && !(subscriptionIds?.length || whatsappSubscriptionIds?.length)) {
    return res.status(400).json({
      status: false,
      message: "Select at least one subscription to shift, or omit the selection to shift all.",
      data: {},
      responseCode: "001",
    });
  }
  const targets = hasTargets ? { subscriptionIds, whatsappSubscriptionIds } : null;

  const result = await shiftSubscriptionDatesForTest(corporateId, days, targets);

  if (result === false) {
    return res.status(500).json({
      status: false,
      message: "Failed to shift subscription dates",
      data: {},
      responseCode: "001",
    });
  }

  const { subscriptions: subRows, whatsappSubscriptions: waRows } = result;
  const totalRows = subRows + waRows;

  return res.status(200).json({
    status: true,
    message: `Shifted ${totalRows} row(s) back by ${days} day(s) — ${subRows} subscription/add-on(s), ${waRows} WhatsApp row(s). Perpetual/free plans untouched.`,
    data: {
      affectedRows: totalRows,
      subscriptionRows: subRows,
      whatsappRows: waRows,
      daysDeducted: days,
    },
    responseCode: "000",
  });
});

// TEST-ONLY: same UAT date-shift as shiftSubscriptionDatesForTest, for serviceSubscriptions-backed
// services (Peko Commerce/ecommerce_store) — lets a mandate's end date be pulled forward to hit the
// scheduler's renewal window without waiting real days. NOT for production — gated by NODE_ENV.
exports.shiftServiceSubscriptionDatesForTest = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_ROUTES) {
    return res.status(403).json({
      status: false,
      message: "Test endpoint disabled in production",
      data: {},
      responseCode: "001",
    });
  }

  // Only an admin may target another corporate.
  const requestedCorporateId = req.user?.role === "SYSTEM_USER" ? Number(req.body.corporateId) : NaN;
  const corporateId = requestedCorporateId || req.user?.corporateId;
  const days = parseInt(req.body.days, 10);
  const accessCode = req.body.accessCode || "ecommerce_store";

  if (!corporateId) {
    return res.status(400).json({
      status: false,
      message: "corporateId is required",
      data: {},
      responseCode: "001",
    });
  }

  if (!days || days <= 0 || days > 365) {
    return res.status(400).json({
      status: false,
      message: "days must be a positive integer between 1 and 365",
      data: {},
      responseCode: "001",
    });
  }

  const result = await shiftServiceSubscriptionDatesForTest(corporateId, days, accessCode);

  if (result === false) {
    return res.status(500).json({
      status: false,
      message: "Failed to shift service subscription dates",
      data: {},
      responseCode: "001",
    });
  }

  return res.status(200).json({
    status: true,
    message: `Shifted ${result.rows} row(s) back by ${days} day(s) for ${accessCode}.`,
    data: { affectedRows: result.rows, daysDeducted: days, accessCode },
    responseCode: "000",
  });
});

// ── TEST-ONLY: revert today's purchases and drop the user back to Peko Free ──
// Wipes everything the user purchased TODAY (subscriptions, addons, WhatsApp bundle,
// matching order rows, paymentGateway order rows), un-marks any rows that were
// flipped to UPGRADED today, then points the user's packageId at the basic GROUP
// package. Used for re-running purchase flows on UAT without spinning up a fresh
// account each time. NOT for production — gated by NODE_ENV.
exports.revertToBasicForTest = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_ROUTES) {
    return res.status(403).json({
      status: false,
      message: "Test endpoint disabled in production",
      data: {},
      responseCode: "001",
    });
  }

  const sequelize = require("../configs/database/index");

  const corporateId = req.user.corporateId;
  const partnerId = req.user.registeredBy;
  // "Today" anchor — anything created on or after this moment counts as a purchase to revert.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const t = await sequelize.transaction();
  try {
    const basicPackage = await findBasicGroupPackage(partnerId);
    if (!basicPackage) {
      await t.rollback();
      return res.status(500).json({
        status: false,
        message: "No basic GROUP package found for this partner — cannot revert",
        data: {},
        responseCode: "001",
      });
    }

    // 1. Subscriptions created today (both base + addons).
    // Pull subscriptionPaymentRefId + vendorSubscriptionId too so we can clean paymentGatewayOrders
    // (which keys by those, not by corporateTxnId).
    const [todaySubs] = await sequelize.query(
      `SELECT id, corporateTxnId, subscriptionPaymentRefId, vendorSubscriptionId
         FROM subscriptions
        WHERE corporateUserId = :corporateId
          AND createdAt >= :todayStart`,
      {
        replacements: { corporateId, todayStart },
        transaction: t,
      }
    );
    const todaySubIds = todaySubs.map((r) => r.id);
    const todayTxnIds = [...new Set(todaySubs.map((r) => r.corporateTxnId).filter(Boolean))];
    const todayPaymentRefIds = [
      ...new Set(todaySubs.map((r) => r.subscriptionPaymentRefId).filter(Boolean)),
    ];
    const todayVendorSubIds = [
      ...new Set(todaySubs.map((r) => r.vendorSubscriptionId).filter(Boolean)),
    ];

    // 2. Delete order history rows. `orders.corporateTxnId` is UNIQUE (per the entity), so the
    // txnId list alone is enough — no extra owner filter required.
    if (todayTxnIds.length > 0) {
      await sequelize.query(
        `DELETE FROM orders WHERE corporateTxnId IN (:txnIds)`,
        {
          replacements: { txnIds: todayTxnIds },
          transaction: t,
        }
      );
    }
    // paymentGatewayOrders is keyed by paymentRefId / vendorSubscriptionId — clear matching rows.
    if (todayPaymentRefIds.length > 0 || todayVendorSubIds.length > 0) {
      try {
        const clauses = [];
        const replacements = {};
        if (todayPaymentRefIds.length > 0) {
          clauses.push(`paymentRefId IN (:paymentRefIds)`);
          replacements.paymentRefIds = todayPaymentRefIds;
        }
        if (todayVendorSubIds.length > 0) {
          clauses.push(`vendorSubscriptionId IN (:vendorSubIds)`);
          replacements.vendorSubIds = todayVendorSubIds;
        }
        await sequelize.query(
          `DELETE FROM paymentGatewayOrders WHERE ${clauses.join(" OR ")}`,
          { replacements, transaction: t }
        );
      } catch (pgOrderErr) {
        // Non-fatal — table may not exist or have a different schema in this env. Log and proceed.
        customLog(req?.LogTraceId, "error", {
          message: "revertToBasicForTest: paymentGatewayOrders cleanup skipped",
          error: pgOrderErr?.message,
        });
      }
    }

    // 3. Delete today's subscriptions (the rows we collected above)
    if (todaySubIds.length > 0) {
      await sequelize.query(
        `DELETE FROM subscriptions WHERE id IN (:ids)`,
        { replacements: { ids: todaySubIds }, transaction: t }
      );
    }

    // 4. Delete ALL WhatsApp subscription rows for this corporate (not just today's).
    // For UAT re-testing we want a clean WA state — leaving an older active row would make
    // bundleWhatsAppBasicForPekoPlus skip creation on the next Peko+ purchase
    // (see whatsappForBusiness.js:705 — any ACTIVE WA row blocks bundling).
    await sequelize.query(
      `DELETE FROM whatsAppSubscriptions WHERE corporateUserId = :corporateId`,
      {
        replacements: { corporateId },
        transaction: t,
      }
    );

    // 4b. Clear webhookEvents the corporate's recent purchase produced.
    // If Cashfree redelivers the same idempotencyKey, the webhook is marked PROCESSED and
    // bundleWhatsAppBasicForPekoPlus never re-runs. Cleaning today's events lets the next
    // delivery be processed fresh. Wrapped in try/catch because the column shapes for
    // identifying "this corporate's events" differ — fall back to a date-bounded prune.
    try {
      const vendorSubFilter = todayVendorSubIds.length > 0
        ? `OR vendorSubscriptionId IN (:vendorSubIds)`
        : "";
      await sequelize.query(
        `DELETE FROM webhookEvents
          WHERE createdAt >= :todayStart
            AND (eventType LIKE 'SUBSCRIPTION%' ${vendorSubFilter})`,
        {
          replacements: {
            todayStart,
            ...(todayVendorSubIds.length > 0 ? { vendorSubIds: todayVendorSubIds } : {}),
          },
          transaction: t,
        }
      );
    } catch (whErr) {
      customLog(req?.LogTraceId, "error", {
        message: "revertToBasicForTest: webhookEvents cleanup skipped",
        error: whErr?.message,
      });
    }

    // 5. Re-activate anything that got flipped to UPGRADED today (the user's previous plan/addons
    // before today's purchase). This is what restores access to Peko Free + any pre-existing addons.
    await sequelize.query(
      `UPDATE subscriptions
          SET status = 'ACTIVE'
        WHERE corporateUserId = :corporateId
          AND status = 'UPGRADED'
          AND updatedAt >= :todayStart`,
      {
        replacements: { corporateId, todayStart },
        transaction: t,
      }
    );

    // 6. Point corporateUsers.packageId at the basic GROUP package so the user reads as "on Peko Free"
    await sequelize.query(
      `UPDATE corporateUsers SET packageId = :packageId WHERE id = :corporateId`,
      {
        replacements: { packageId: basicPackage.id, corporateId },
        transaction: t,
      }
    );

    // 7. Ensure a clean ACTIVE Peko Free subscription row exists. If the user already had one
    // (and we re-activated it in step 5) this insert is skipped via the existence check.
    const [existingBasic] = await sequelize.query(
      `SELECT id FROM subscriptions
        WHERE corporateUserId = :corporateId
          AND packageId = :packageId
          AND status = 'ACTIVE'
        LIMIT 1`,
      {
        replacements: { corporateId, packageId: basicPackage.id },
        transaction: t,
      }
    );
    if (!existingBasic || existingBasic.length === 0) {
      const now = new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      // paymentMode is an ENUM('PAYMENT GATEWAY','ACTIVATION_CODE') and allows NULL.
      // No money changed hands for Peko Free, so leave it NULL (omit from column list).
      await sequelize.query(
        `INSERT INTO subscriptions
           (subscriptionStartDate, subscriptionEndDate, subscriptionPrice,
            subscriptionAmountPaid, corporateUserId, packageId, discount,
            billingType, isCustom, status, createdAt, updatedAt)
         VALUES
           (:start, :end, 0, 0, :corporateId, :packageId, 0,
            'MONTHLY', 0, 'ACTIVE', :now, :now)`,
        {
          replacements: {
            start: now,
            end: oneYearLater,
            corporateId,
            packageId: basicPackage.id,
            now,
          },
          transaction: t,
        }
      );
    }

    await t.commit();

    return res.status(200).json({
      status: true,
      message: "Reverted to Peko Free",
      data: {
        deletedSubscriptionIds: todaySubIds,
        deletedTransactionIds: todayTxnIds,
        basicPackageId: basicPackage.id,
      },
      responseCode: "000",
    });
  } catch (error) {
    await t.rollback();
    customLog(req?.LogTraceId, "error", {
      message: "revertToBasicForTest failed",
      error: error?.message,
      stack: error?.stack,
    });
    return res.status(500).json({
      status: false,
      message: error?.message || "Failed to revert",
      data: {},
      responseCode: "001",
    });
  }
});

