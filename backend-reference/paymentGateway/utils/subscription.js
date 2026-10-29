const CorporateUser = require("./../models/entities/corporateUser");
const Subscription = require("./../models/entities/subscription");
const Package = require("./../models/entities/package");
const sequelize = require("./../configs/database/index");
const moment = require("moment");
const subscriptionUseCases = require("../models/use-cases/subscription");
const { Op } = require("sequelize");
const { findOneServiceCashbacks, findOneByPackageId } = require("../models/use-cases/cashback");
const { updateOneCouponData, findOneCouponData } = require("../models/use-cases/pekoCredits");
const orders = require("../models/entities/order");
const { v4: uuidv4 } = require("uuid");
const { customLog } = require("./loggerHelper");
const { resolveAddonTierPricing } = require("./resolveAddonTierPricing");
const { calculateRemainingCost, roundDownToNearest, calculateSubscriptionPrice, computeAddonEndDate } = require("./subscriptionPricing");
const { isRecurringAddon, calculateAddonLineTotal, calculateProRatedAddonPrice, annualizeAddon } = require("./addonPricing");
const { calculateTaxBreakdown } = require("../services/GSTandTAXcalculation");

const toPaymentModeResponse = (pgResponse) =>
  JSON.stringify(Array.isArray(pgResponse) ? pgResponse : [pgResponse]);

exports.createSubscription = async (data, traceId = null) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const {
      packageId,
      pgAmount,
      corporateId,
      corporateTxnId,
      providerId,
      billingType,
      paymentGatewayResponse,
      couponCode,
      subscriptionId,
      credentialId,
      partnerId,
      authPayment = false,
      isOneTime = false,
      isComplimentary = false,
      isInitialPurchase: isInitialPurchaseRequested = false,
      quotedAt = null,
      creditCurrentGroupPlan = true,
      reportData = {},
    } = data;

    const isInitialPurchase = authPayment || isInitialPurchaseRequested;
    const pricingAsOf = quotedAt || undefined;
    const amount = pgAmount; // user paid amonut
    let newSubscriptionStatus = "ACTIVE";
    // Net-0 (fully-prorated/coupon) synchronous path sends no providerId/subscriptionId; resolved in
    // the GROUP branch below — a payment ref for history visibility + the carried-forward mandate.
    let effectivePaymentRefId = providerId;
    let effectiveVendorSubscriptionId = subscriptionId;
    // A one-time purchase that supersedes a mandate-backed GROUP plan records that plan's mandate here so
    // the caller can best-effort cancel it at Cashfree post-commit (it's never adopted — review finding C1).
    let supersededMandateId = null;
    // Pro-rated discount breakdown (same shape as the subscription-pricing API) — recorded on the
    // order's orderResponse so a net-0 / discounted order captures WHY the amount was reduced.
    let discountBreakdown = null;
    // Coupon portion of the discount — surfaced to callers so receipts can show
    // pre-coupon service amount vs actually-paid amount (AE parity).
    let appliedCouponDiscount = 0;
    let orderTaxBreakdown = { taxableAmount: 0, taxAmount: 0, taxRate: 0 };
    const isExistingSubscription = await Subscription.findOne({
      include: [{ model: Package }],
      where: {
        packageId: packageId,
        corporateUserId: corporateId,
        status: "ACTIVE",
        billingType: {
          [Op.eq]: billingType,
        },
      },
      raw: true,
      nest: true,
    });

    let adjustedStartDate = moment().startOf("day");
    if (isExistingSubscription) {
      const existingEndDate = moment(isExistingSubscription.subscriptionEndDate);
      if (existingEndDate.isAfter(adjustedStartDate)) {
        adjustedStartDate = existingEndDate.clone().add(1, "day").startOf("day");
        newSubscriptionStatus = "PENDING"; // activate it later
      }
      // return {
      //   error: true,
      //   message: `User already has the ${isExistingSubscription.package.packageName} subscription plan.`,
      // };
    }

    // Lost/late SUCCESS webhook recovery (renewal path only). The scheduler now expires a lapsed sub
    // at endDate+1 (subscriptionAutoRenewal), so a webhook arriving after that finds no ACTIVE
    // predecessor and the code below would otherwise create a fresh TODAY-dated cycle. Instead recover
    // the last (now-expired) paid cycle and back-date the successor from its end date, so a late
    // success produces the same ACTIVE cycle a timely webhook would have. Treated like a same-plan
    // renewal (addons are renewed solely by renewAddonSubscriptions on the CHARGE webhook), but ACTIVE
    // immediately since there is no still-valid predecessor to defer behind.
    let isLateSuccessRenewal = false;
    if (!isExistingSubscription && !isInitialPurchase) {
      const expiredPredecessor = await subscriptionUseCases.findExpiredBasePredecessor({
        corporateUserId: corporateId,
        packageId,
        billingType,
        vendorSubscriptionId: subscriptionId,
      });
      if (expiredPredecessor?.subscriptionEndDate) {
        adjustedStartDate = moment(expiredPredecessor.subscriptionEndDate).clone().add(1, "day").startOf("day");
        isLateSuccessRenewal = true;
      }
    }

    const packageDetails = await Package.findOne({
      where: { id: packageId },
      attributes: ["id", "packageName", "packagePrices", "discount", "packageType"],
      raw: true,
      nest: true,
    });

    if (!packageDetails) {
      return {
        error: true,
        message: "Invalid package details",
      };
    }

    const packagePrices = packageDetails.packagePrices;

    let packagePrice = 0;
    let discountPrice = 0;

    let subscriptionStartDate = adjustedStartDate.toDate();
    let subscriptionEndDate;
    if (billingType === "MONTHLY") {
      packagePrice = parseFloat(packagePrices.monthly);
      discountPrice = parseFloat(packageDetails.discount.monthly);
      subscriptionEndDate = adjustedStartDate.clone().add(30, "days").endOf("day").toDate();
    } else if (billingType === "ANNUALLY") {
      packagePrice = parseFloat(packagePrices.annually);
      discountPrice = parseFloat(packageDetails.discount.annually);
      subscriptionEndDate = adjustedStartDate.clone().add(365, "days").endOf("day").toDate();
    } else {
      await transaction.rollback();
      return {
        error: true,
        message: "Invalid billing type",
      };
    }
    let totalDiscount = discountPrice;
    let totalAddonPrice = 0;

    // INDIVIDUAL packages snapshot their included limit + serviceOperator onto the base row
    // (maxLimit holds the included limit here, addon quantity on addon rows). GROUP leaves both
    // null and resolves its limit live from the group cashback — keeping the GROUP path unchanged.
    let baseMaxLimit = null;
    let baseServiceOperatorId = null;

    // check the amount passed in the payload is match with db . only for individual packages
    if (packageDetails.packageType === "INDIVIDUAL") {
      // Lock the included limit + serviceOperator from this package's cashback at purchase time.
      const individualCashback = await findOneByPackageId(packageId);
      if (individualCashback) {
        baseMaxLimit = individualCashback.baseLimit != null ? parseFloat(individualCashback.baseLimit) : null;
        baseServiceOperatorId = individualCashback.serviceOperatorId ?? null;
      } else {
        customLog(traceId, "error", { message: "INDIVIDUAL package missing cashback — base limit/serviceOperator not stamped", packageId });
      }
      // check if user is already having same package monthly subscription and also it's addon
      const activeSubscriptionAndAddons = await Subscription.findAll({
        where: {
          corporateUserId: corporateId,
          packageId: packageId,
          status: "ACTIVE",
        },
        raw: true,
        nest: true,
      });

      // Single source of truth for price math (mirrors validatePrice + /subscription-pricing).
      const pricing = await calculateSubscriptionPrice({
        corporateId,
        packageDetails,
        billingType,
        couponCode,
        partnerId,
        authPayment: isInitialPurchase,
        asOf: pricingAsOf,
        creditCurrentGroupPlan,
      });
      totalDiscount = pricing.totalDiscount;
      discountBreakdown = pricing.breakdown ?? null;
      appliedCouponDiscount = pricing.couponDiscount || 0;
      totalAddonPrice = authPayment ? 0 : pricing.cycleAddonTotal;
      if (!isComplimentary) {
        orderTaxBreakdown = { taxableAmount: pricing.taxableAmount, taxAmount: pricing.taxAmount, taxRate: pricing.taxRate };
      }

      // Side effects: mark existing same-package subscriptions UPGRADED and create the carry-over addon row.
      if (activeSubscriptionAndAddons && activeSubscriptionAndAddons.length > 0) {
        // Same-plan renewal guard (mirrors the GROUP carry-over at the bottom of this function). When
        // newSubscriptionStatus === 'PENDING' the new row is a future-dated successor of the SAME plan
        // — a scheduler-triggered CHARGE renewal fired ~2 days early. In that case the predecessor base
        // + its addons must stay ACTIVE until they expire naturally, and the addons are renewed by
        // renewAddonSubscriptions on the CHARGE webhook (the SOLE addon creator on the renewal path).
        // Re-anchoring addons here too would create duplicate / ₹0 rows that double-charge and
        // double-count limits on the next cycle. So only mark the predecessor UPGRADED and carry its
        // addons forward for a genuine immediate switch (monthly→annual upgrade, status ACTIVE): there
        // the UPGRADED update retires the old base + addon rows and the carry-over below recreates
        // EVERY addon on the new (annual) cycle so none are lost.
        if (newSubscriptionStatus !== "PENDING" && !isLateSuccessRenewal) {
          await Subscription.update(
            { status: "UPGRADED" },
            {
              where: {
                corporateUserId: corporateId,
                packageId: packageId,
                status: "ACTIVE",
              },
              transaction,
            },
          );

          // Carry over EVERY active addon row for this individual package (each addon purchase is a
          // separate row), preserving its serviceOperatorId + seats, so none are orphaned by the
          // UPGRADED update above. The carry-over addon's end date = the new base's end date (annual),
          // so it renews together with the base. If there are no active addons, fall back to the most
          // recent lapsed one (resurrect the user's last addon on upgrade — prior single-addon behaviour).
          let addonsToCarryOver = activeSubscriptionAndAddons.filter((subscription) => subscription.isCustom === 1);
          if (addonsToCarryOver.length === 0) {
            const lapsedAddon = await Subscription.findOne({
              where: {
                corporateUserId: corporateId,
                packageId,
                isCustom: 1,
                status: {
                  [Op.in]: ["CANCELLED", "EXPIRED"],
                },
              },
              order: [["updatedAt", "DESC"]],
              raw: true,
            });
            if (lapsedAddon) addonsToCarryOver = [lapsedAddon];
          }
          for (const addon of addonsToCarryOver) {
            const { data: addonData } = await subscriptionUseCases.findAddonPrice({ packageId, serviceOperatorId: addon.serviceOperatorId });
            // Annualize the catalogue price so an ANNUAL plan's carry-over addon row reflects its full-year
            // cost (× 12), matching its billingType + 365-day end date.
            const addonLineTotal = isRecurringAddon(addonData)
              ? annualizeAddon(calculateAddonLineTotal(addonData.unitPrice, addon.maxLimit), billingType)
              : 0;
            const addonTax = await calculateTaxBreakdown(addonLineTotal);
            const newAddon = {
              subscriptionStartDate: subscriptionStartDate,
              subscriptionEndDate: subscriptionEndDate,
              subscriptionPaymentRefId: providerId,
              // Catalogue = full cycle cost; collected = 0 at AUTH (add-ons bill from the next cycle).
              subscriptionPrice: addonLineTotal,
              subscriptionAmountPaid: addonTax.grossAmount,
              taxableAmount: addonTax.taxableAmount,
              taxAmount: addonTax.taxAmount,
              taxRate: addonTax.taxRate,
              corporateUserId: corporateId,
              packageId: packageId,
              serviceOperatorId: addon.serviceOperatorId ?? null,
              discount: totalDiscount,
              billingType: billingType,
              isCustom: true,
              maxLimit: addon.maxLimit,
              paymentModeResponse: toPaymentModeResponse(paymentGatewayResponse),
              paymentMode: "PG",
              couponCode,
              vendorSubscriptionId: subscriptionId,
              status: newSubscriptionStatus,
              corporateTxnId,
            };
            await Subscription.create(newAddon, { transaction: transaction });
          }
        }
      }

      // Fetch coupon record for claiming if canonical pricing applied a coupon discount.
      let couponDataToClaim = null;
      if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "" && pricing.couponDiscount > 0) {
        const { data: couponData } = await findOneCouponData({ couponCode, corporateUserId: corporateId, packageId });
        if (couponData) {
          couponDataToClaim = { couponData, discountAmount: pricing.couponDiscount };
        }
      }
      if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "" && pricing.couponDiscount === 0) {
        await transaction.rollback();
        return { error: true, message: "Invalid coupon code." };
      }

      // AUTH (initial purchase) only — same rationale as the GROUP path below: CHARGE renewals are
      // computed by the scheduler (calculatePlanAmount, incl. recurring addons) and already validated by
      // the webhook against that charge calc + stored order, so re-validating here with the divergent
      // calculateSubscriptionPrice can falsely reject a correct renewal that includes an addon.
      const expectedPaymentAmount = pricing.expectedPaymentAmount;
      const normalizedExpected = Number(expectedPaymentAmount).toFixed(2);
      const normalizedAmount = Number(amount).toFixed(2);

      // TEMPORARY: accept the pre-tax (net) amount during the GST rollout window — remove after release.
      const isLegacyNetAmount = Number(pricing.taxableAmount).toFixed(2) === normalizedAmount && normalizedExpected !== normalizedAmount;
      if (isLegacyNetAmount) {
        customLog(traceId, "error", {
          message: "createSubscription: accepted PRE-TAX (legacy net) amount during GST rollout window",
          packageId,
          corporateId,
          amount,
          expectedGross: normalizedExpected,
        });
      }

      if (isInitialPurchase && !isComplimentary && normalizedExpected !== normalizedAmount && !isLegacyNetAmount) {
        await transaction.rollback();
        return {
          error: true,
          message: "Invalid package amount. Please check the amount",
          expectedPaymentAmount: normalizedExpected,
          amount: normalizedAmount,
        };
      }

      if (couponDataToClaim) {
        const claimResult = await updateOneCouponData({
          couponData: couponDataToClaim.couponData,
          corporateId,
          transaction,
          discountAmount: couponDataToClaim.discountAmount,
        });
        if (!claimResult || !claimResult.success) {
          await transaction.rollback();
          customLog(traceId, "error", { message: "Failed to claim coupon after validation", claimResult });
          return {
            error: true,
            message: "Failed to claim coupon. Please try again.",
          };
        }
      }
    }

    let currentSubscription;
    // if user is purchased standard or premium plan then want to check user is already have an individual subscription under the group package
    if (packageDetails.packageType === "GROUP") {
      const data = await subscriptionUseCases.findExistingGroupPackage(corporateId);
      currentSubscription = data;
      const currentPackageId = currentSubscription?.package?.id;

      // Net-0 upgrade (fully prorated / coupon) reaches createSubscription via the synchronous
      // /subscriptions/payment path with no Cashfree payment, so providerId/subscriptionId are absent.
      // Stamp a payment ref so the upgraded plan shows in history (corporatePurchaseSubscriptionView and
      // findCurrentGroupSubscription both require subscriptionPaymentRefId NOT NULL), and carry the
      // existing paid plan's mandate forward so the scheduler keeps auto-renewing it at the new price
      // (triggerSubscriptionCharges requires vendorSubscriptionId NOT NULL). The previous plan is marked
      // UPGRADED below but its mandate is NOT cancelled — it now backs the new plan.
      if (!authPayment) {
        effectivePaymentRefId = providerId ?? corporateTxnId;
        if (currentSubscription?.id) {
          const previousGroup = await Subscription.findOne({
            where: { id: currentSubscription.id },
            attributes: ["vendorSubscriptionId"],
            raw: true,
            transaction,
          });
          if (previousGroup?.vendorSubscriptionId) {
            if (isOneTime) {
              // One-time supersede: never adopt the previous plan's mandate — the base row AND the addon
              // carry-over rows below would otherwise auto-renew a plan the user explicitly declined to
              // keep (review finding C1). Capture it so the caller best-effort cancels it at Cashfree after
              // commit; otherwise it lingers orphaned (the old plan is marked UPGRADED so it never charges).
              supersededMandateId = previousGroup.vendorSubscriptionId;
            } else {
              // Recurring net-0 upgrade: carry the mandate forward so the scheduler keeps auto-renewing at
              // the new price. The previous plan is marked UPGRADED below but its mandate now backs this one.
              effectiveVendorSubscriptionId = previousGroup.vendorSubscriptionId;
            }
          }
        }
      }

      const userSubscriptionsData = await subscriptionUseCases.findAllActiveIndividualSubscriptions({
        corporateId,
        packageId,
        currentPackageId,
        partnerId,
      });

      // Single source of truth for price math — utils/subscriptionPricing.calculateSubscriptionPrice.
      // Same function powers validatePrice + the public /subscription-pricing endpoint, so the
      // expectedPaymentAmount here matches what the frontend showed and what validatePrice accepted.
      const pricing = await calculateSubscriptionPrice({
        corporateId,
        packageDetails,
        billingType,
        couponCode,
        partnerId,
        authPayment: isInitialPurchase,
        asOf: pricingAsOf,
        creditCurrentGroupPlan,
      });
      totalDiscount = pricing.totalDiscount;
      discountBreakdown = pricing.breakdown ?? null;
      appliedCouponDiscount = pricing.couponDiscount || 0;
      if (!isComplimentary) {
        orderTaxBreakdown = { taxableAmount: pricing.taxableAmount, taxAmount: pricing.taxAmount, taxRate: pricing.taxRate };
      }

      if (userSubscriptionsData) {
        const { allActiveSubscriptions, previousAddons } = userSubscriptionsData;
        const activePackageIds = new Set(allActiveSubscriptions.map((subscription) => subscription.packageId));

        // Create addon entries for previous addons that aren't in active subscriptions.
        const filteredPreviousAddons = previousAddons.filter((prev) => !activePackageIds.has(prev.packageId));
        const mergedSubscriptions = [...allActiveSubscriptions, ...filteredPreviousAddons];

        // Carry over ALL addons (static + dynamic) onto the new plan's cycle. Per product spec,
        // every addon has an end date tied to the current paid GROUP plan — so a plan change
        // re-anchors the addon's end date to the new plan's expiry.
        //   - Dynamic addons (Payroll): auto-renew via mandate on CHARGE webhook.
        //   - Static addons (eSign / Invoicing / Turbo): expire on end date, no auto-renew.
        //     User must re-purchase to extend.
        // Per-row addonPrice still depends on isRecurringAddon — only recurring addons
        // contribute a recurring monthly cost; static addons are one-time so subscriptionPrice = 0
        // on carry-over rows (the original purchase already collected payment).
        const newAddonsArray = [];
        const addonIdsBeingReplaced = [];
        // Same-plan renewals (PENDING successor) are handled by renewAddonSubscriptions on the CHARGE
        // webhook — carrying addons here too would create duplicate / ₹0 rows. Only re-anchor addons
        // for a genuine plan change (upgrade/downgrade), and only RECURRING ones: static one-time
        // addons (eSign / Turbo / Invoicing) never auto-renew and are left on their own cycle.
        if (newSubscriptionStatus !== "PENDING" && !isLateSuccessRenewal) {
          for (const subscription of mergedSubscriptions) {
            if (!subscription.isCustom || subscription.isCancelled) continue;
            // Price against the NEW plan's tier (groupPackageId = the plan being created), like the charge API.
            const addonData = await subscriptionUseCases.findAddonPrice({
              packageId: subscription.packageId,
              serviceOperatorId: subscription.serviceOperatorId,
              groupPackageId: packageId,
            });
            if (!isRecurringAddon(addonData)) continue; // static one-time addon — don't carry over
            const addonPrice = calculateAddonLineTotal(addonData.unitPrice, subscription.maxLimit);
            if (!(addonPrice > 0)) continue; // never create a ₹0 addon row
            // Annualize the catalogue price so the carry-over row reflects its full cycle cost (× 12 on an
            // ANNUAL plan), matching its billingType + 365-day end date.
            const addonCycleTotal = annualizeAddon(addonPrice, billingType);
            totalAddonPrice += addonCycleTotal;
            if (subscription.id) addonIdsBeingReplaced.push(subscription.id);
            customLog(traceId, "info", {
              message: "createSubscription - recurring addon re-anchored to new plan",
              subscriptionId: subscription.id,
              serviceOperatorId: subscription.serviceOperatorId,
              newPlanPackageId: packageId,
              unitPrice: addonData.unitPrice,
              maxLimit: subscription.maxLimit,
              addonPrice,
              addonCycleTotal,
              totalAddonPrice,
            });
            const addonTax = await calculateTaxBreakdown(addonPrice);
            const newAddon = {
              subscriptionStartDate: subscriptionStartDate,
              subscriptionEndDate: subscriptionEndDate,
              subscriptionPaymentRefId: effectivePaymentRefId,
              subscriptionPrice: addonPrice,
              subscriptionAmountPaid: addonTax.grossAmount,
              taxableAmount: addonTax.taxableAmount,
              taxAmount: addonTax.taxAmount,
              taxRate: addonTax.taxRate,
              corporateUserId: corporateId,
              packageId: subscription.packageId,
              serviceOperatorId: subscription.serviceOperatorId ?? null,
              discount: totalDiscount,
              billingType: billingType,
              isCustom: true,
              maxLimit: subscription.maxLimit,
              paymentModeResponse: toPaymentModeResponse(paymentGatewayResponse),
              paymentMode: "PAYMENT GATEWAY",
              couponCode,
              vendorSubscriptionId: effectiveVendorSubscriptionId,
              status: newSubscriptionStatus,
              corporateTxnId,
            };
            newAddonsArray.push(newAddon);
          }
          if (newAddonsArray.length > 0) {
            await Subscription.bulkCreate(newAddonsArray, { transaction });
          }
        }
        customLog(traceId, "info", {
          message: "Discount from createSubscription",
          ...pricing,
          amount,
          packagePrice,
          totalAddonPrice,
          authPayment,
        });

        // Mark the base GROUP subscription and ALL addons we just re-stamped as UPGRADED.
        // The fresh addon rows take over from the previous ones with the new cycle's dates.
        //
        // EXCEPTION — same-plan renewal: when newSubscriptionStatus === 'PENDING' the new rows
        // are a future-dated successor of the SAME plan (set in the isExistingSubscription branch
        // above, because the renewal charge fires ~2 days before expiry while the current plan is
        // still ACTIVE). For a renewal the predecessor must stay ACTIVE until its paid period ends
        // and then expire naturally via subscriptionAutoRenewal, while the PENDING successor is
        // activated on its start date. Marking the predecessor UPGRADED here would strand the
        // account in "predecessor UPGRADED + successor PENDING" — i.e. NO ACTIVE paid plan during
        // the gap — so we skip it. Genuine upgrades/downgrades to a DIFFERENT plan keep
        // newSubscriptionStatus === 'ACTIVE' (no existing same-package sub) and still mark the old
        // plan UPGRADED, which is correct for an immediate plan switch.
        const isSamePlanRenewal = newSubscriptionStatus === "PENDING" || isLateSuccessRenewal;
        const upgradeIds = isSamePlanRenewal
          ? []
          : allActiveSubscriptions
              .filter((s) => !s.isCustom)
              .map((s) => s.id)
              .concat(addonIdsBeingReplaced);
        if (upgradeIds.length > 0) {
          await Subscription.update(
            { status: "UPGRADED" },
            {
              where: { id: upgradeIds },
              transaction,
            },
          );
        }
      }

      // Fetch coupon record for claiming if the canonical pricing applied a coupon discount.
      let couponDataToClaim = null;
      if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "" && pricing.couponDiscount > 0) {
        const { data: couponData } = await findOneCouponData({ couponCode, corporateUserId: corporateId, packageId });
        if (couponData) {
          couponDataToClaim = { couponData, discountAmount: pricing.couponDiscount };
        }
      }
      // If a coupon was supplied but rejected by the validator, fail loudly.
      if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "" && pricing.couponDiscount === 0) {
        await transaction.rollback();
        return {
          error: true,
          message: "Invalid coupon code.",
          couponCode,
        };
      }

      // Validate amount against the canonical expectedPaymentAmount — AUTH (initial purchase) only.
      // For AUTH, `amount` is the client-supplied figure that must be server-verified here.
      // For CHARGE (renewal), the amount is computed by the scheduler (calculatePlanAmount = plan +
      // recurring addons) and already validated by the webhook against that SAME charge calc + the stored
      // order before createSubscription runs. calculateSubscriptionPrice's GROUP path enumerates addons
      // differently and can miss recurring addons (e.g. payroll, isDynamicUnitPricing=true) — so
      // re-validating a CHARGE against it raised a false "Invalid group package price" (999 vs 1299).
      const expectedPaymentAmount = pricing.expectedPaymentAmount;
      if (isInitialPurchase && !isComplimentary && expectedPaymentAmount > 0) {
        const normalizedExpected = Number(expectedPaymentAmount).toFixed(2);
        const normalizedAmount = Number(amount).toFixed(2);
        // TEMPORARY: accept the pre-tax (net) amount during the GST rollout window — remove after release.
        const isLegacyNetAmount = Number(pricing.taxableAmount).toFixed(2) === normalizedAmount;
        if (isLegacyNetAmount && normalizedExpected !== normalizedAmount) {
          customLog(traceId, "error", {
            message: "createSubscription (GROUP): accepted PRE-TAX (legacy net) amount during GST rollout window",
            packageId,
            corporateId,
            amount,
            expectedGross: normalizedExpected,
          });
        }
        if (normalizedExpected !== normalizedAmount && !isLegacyNetAmount) {
          await transaction.rollback();
          customLog(traceId, "error", {
            message: "Invalid group package price - calculation mismatch",
            ...pricing,
            normalizedExpected,
            normalizedAmount,
            amount,
            packagePrice,
            totalAddonPrice,
            discountPrice,
            authPayment,
          });
          return {
            error: true,
            message: "Invalid group package price",
            data: { expectedPaymentAmount: normalizedExpected, amount: normalizedAmount },
          };
        }
      } else {
        if (isInitialPurchase && !isComplimentary && amount != 0) {
          await transaction.rollback();
          return {
            error: true,
            message: `The user already has a total discount of ${totalDiscount}, which is larger than the package amount. The payment amount must be zero.`,
            data: { amount },
          };
        }
      }

      if (couponDataToClaim) {
        const claimResult = await updateOneCouponData({
          couponData: couponDataToClaim.couponData,
          corporateId,
          transaction,
          discountAmount: couponDataToClaim.discountAmount,
        });
        if (!claimResult || !claimResult.success) {
          await transaction.rollback();
          customLog(traceId, "error", { message: "Failed to claim coupon after validation", claimResult });
          return {
            error: true,
            message: "Failed to claim coupon. Please try again.",
          };
        }
      }

      // if user is already have an group subscription plan then update status into upgraded.
      // scenerio --> user going to upgrade plan standard into premium. check wheather standard plan is expired or not
      if (currentSubscription) {
        if (isInitialPurchase) {
          await Subscription.update(
            { status: "UPGRADED" },
            {
              where: {
                packageId: currentPackageId,
                corporateUserId: corporateId,
              },
              transaction,
            },
          );
        } else {
          const activeBasicSubs = await Subscription.findAll({
            include: [{ model: Package, where: { packageType: "GROUP" }, attributes: ["id"] }],
            where: {
              corporateUserId: corporateId,
              status: "ACTIVE",
              isCustom: false,
              subscriptionPaymentRefId: null,
            },
            attributes: ["id"],
            raw: true,
            nest: true,
            transaction,
          });
          const basicIds = activeBasicSubs.map((s) => s.id);
          if (basicIds.length > 0) {
            await Subscription.update(
              { status: "UPGRADED" },
              { where: { id: { [Op.in]: basicIds } }, transaction },
            );
          }

          const currentEnd = moment(currentSubscription.subscriptionEndDate);
          // For a late-success renewal adjustedStartDate is already anchored to the expired PAID
          // predecessor's end date; don't let the downgraded basic row's end date clobber it.
          if (currentEnd.isAfter(adjustedStartDate) && !isLateSuccessRenewal) {
            adjustedStartDate = currentEnd.clone().add(1, "day").startOf("day");
          }
        }
      }
      subscriptionStartDate = adjustedStartDate.toDate();
      if (billingType === "MONTHLY") {
        subscriptionEndDate = adjustedStartDate.clone().add(30, "days").endOf("day").toDate();
      } else if (billingType === "ANNUALLY") {
        subscriptionEndDate = adjustedStartDate.clone().add(365, "days").endOf("day").toDate();
      }

      // update package id in the  corporate user table
      await CorporateUser.update(
        { packageId: packageId },
        {
          where: {
            id: corporateId,
          },
          transaction,
        },
      );
    }

    // One-time (non-auto-renew) purchase: never carry a mandate forward. The GROUP branch above may have
    // adopted the previous paid plan's vendorSubscriptionId, which would make triggerSubscriptionCharges
    // auto-debit a plan the user explicitly declined to renew (review finding C1). Force it NULL. Also
    // always stamp a payment ref so the subscriptionAutoRenewal expiry pass reaps the row at end date and
    // it shows in history — the INDIVIDUAL branch never sets effectivePaymentRefId, so it would otherwise
    // stay ACTIVE forever (review finding C2). Applies to both GROUP and INDIVIDUAL.
    if (isOneTime) {
      effectiveVendorSubscriptionId = null;
      effectivePaymentRefId = corporateTxnId;
    }

    const baseRowTax = (isInitialPurchase || isOneTime)
      ? orderTaxBreakdown
      : await calculateTaxBreakdown(Math.max(0, packagePrice - totalDiscount));

    const newSubscription = {
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      subscriptionPaymentRefId: effectivePaymentRefId,
      subscriptionPrice: packagePrice,
      subscriptionAmountPaid: (isInitialPurchase || isOneTime) ? amount : baseRowTax.grossAmount,
      taxableAmount: baseRowTax.taxableAmount,
      taxAmount: baseRowTax.taxAmount,
      taxRate: baseRowTax.taxRate,
      corporateUserId: corporateId,
      packageId: packageId,
      maxLimit: baseMaxLimit,
      serviceOperatorId: baseServiceOperatorId,
      discount: totalDiscount,
      billingType: billingType,
      paymentModeResponse: toPaymentModeResponse(paymentGatewayResponse),
      paymentMode: "PAYMENT GATEWAY",
      couponCode,
      vendorSubscriptionId: effectiveVendorSubscriptionId,
      authPayment,
      status: newSubscriptionStatus,
      isCancelled: !authPayment && !!isExistingSubscription?.isCancelled,
      corporateTxnId,
    };

    const subscription = await Subscription.create(newSubscription, {
      transaction: transaction,
    });

    const orderDetailsPayload = {
      ...newSubscription,
      serviceName: packageDetails.packageName,
      breakdown: discountBreakdown,
      taxableAmount: orderTaxBreakdown.taxableAmount,
      taxAmount: orderTaxBreakdown.taxAmount,
      taxRate: orderTaxBreakdown.taxRate,
    };
    delete orderDetailsPayload.paymentModeResponse;

    const orderDetails = await orders.create(
      {
        corporateTxnId: corporateTxnId,
        providerId: providerId,
        operatorId: uuidv4(),
        corporateId: credentialId,
        transactionDate: new Date(),
        amountInINR: parseFloat(amount) || 0,
        baseAmount: parseFloat(amount) || 0,
        baseCurrency: "INR",
        exchangeRate: 1,
        status: "SUCCESS",
        paymentMode: "PAYMENT GATEWAY",
        paymentModeResponse: JSON.stringify([{ ...paymentGatewayResponse, pgAmount: parseFloat(amount) }]),
        accountNo: null,
        surcharge: 0,
        serviceOperatorId: null,
        credentialId,
        subCorporateUserId: null,
        orderResponse: JSON.stringify(orderDetailsPayload),
        message: "Payment Successful",
        optional: "SUBSCRIPTION",
        ...reportData,
      },
      {
        transaction: transaction,
      },
    );

    await transaction.commit();
    return {
      subscription,
      packageDetails,
      currentSubscription,
      orderId: orderDetails?.id,
      supersededMandateId,
      couponDiscount: appliedCouponDiscount,
      taxBreakdown: orderTaxBreakdown,
    };
  } catch (error) {
    customLog(traceId, "error", {
      message: "createSubscription error:",
      error: error?.response?.data ?? error?.response ?? error,
    });
    await transaction.rollback();
    return {
      error: true,
      message: "something went wrong ",
    };
  }
};

exports.calculateRemainingCost = calculateRemainingCost;
exports.roundDownToNearest = roundDownToNearest;

exports.createSubscriptionForAddOns = async (data) => {
  const {
    corporateTxnId,
    providerId,
    corporateId,
    paymentGatewayResponse,
    quantity,
    pgAmount,
    addonsAccessKey,
    partnerId,
    subscriptionId,
    credentialId,
    authPayment = false,
    paymentMode = "PAYMENT GATEWAY",
    traceId,
    reportData = {},
  } = data;
  let transaction;
  try {
    transaction = await sequelize.transaction();
    let allCashbacks = await findOneServiceCashbacks({ accessKey: addonsAccessKey, partnerId });

    if (!allCashbacks.length) {
      await transaction.rollback();
      return {
        error: true,
        message: "Invalid package details",
      };
    }

    const packageIds = allCashbacks.map((row) => row.packageId);

    // Confirm the user has an active subscription that covers this service
    const isUserSubscribed = await subscriptionUseCases.findSubscriptionIsExist({
      corporateId,
      packageIds,
    });
    if (!isUserSubscribed) {
      await transaction.rollback();
      return {
        error: true,
        message: "Subscription not purchased.",
      };
    }

    // Use the cashback row that matches the user's actual subscribed package for pricing.
    // e.g. Peko Go → Peko Go price, Peko+ → Peko+ price, Basic → Basic price.
    const individualCashback = allCashbacks.find((row) => Number(row.packageId) === Number(isUserSubscribed.packageId)) ?? allCashbacks[0];

    // ── Remaining days in the current billing cycle ────────────────────────────
    // Used to decide:
    //   1. Whether to pro-rate the charge (< 30 days left in cycle)
    //   2. When the addon subscription should expire
    //      - daysRemaining > 30 → addon expires after 30 days (next renewal)
    //      - daysRemaining ≤ 30 → addon expires with the current subscription (same end date)
    const currentSubscriptionEndDate = new Date(isUserSubscribed.subscriptionEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((currentSubscriptionEndDate - today) / (1000 * 60 * 60 * 24));

    // INDIVIDUAL-wins: if the user owns an ACTIVE individual package for this service, anchor the
    // addon to the individual tier (no group re-anchor) and stamp the individual packageId — matching
    // the /add-ons display and the individual-package renewal recompute (groupPackageId is null there).
    const individualPackageCashback = allCashbacks.find((row) => row.package.packageType === "INDIVIDUAL");
    let ownsIndividual = false;
    if (individualPackageCashback) {
      const indivBaseSub = await Subscription.findOne({
        where: {
          corporateUserId: corporateId,
          packageId: individualPackageCashback.packageId,
          isCustom: false,
          isCancelled: false,
          status: "ACTIVE",
        },
        attributes: ["id"],
        raw: true,
      });
      ownsIndividual = !!indivBaseSub;
    }
    const pricingCashbackRow = ownsIndividual ? individualPackageCashback : individualCashback;
    const groupSub = ownsIndividual ? null : await subscriptionUseCases.findExistingGroupPackage(corporateId);
    const tier = resolveAddonTierPricing(allCashbacks, groupSub, pricingCashbackRow);
    if (!tier) {
      await transaction.rollback();
      return {
        error: true,
        message: "Invalid package details",
      };
    }

    const baseUnitPrice = tier.unitPrice;
    if (!(baseUnitPrice > 0)) {
      await transaction.rollback();
      return { error: true, message: "Add-on purchase is not available for your current plan." };
    }

    // ── Pro-rated charge for the current cycle ─────────────────────────────────
    // isDynamicUnitPricing comes from the tier row (GROUP/Peko+ when configured). A recurring addon is
    // pro-rated over the days remaining in the base cycle so it aligns to (and expires with) the base —
    // on an ANNUAL base this naturally charges ~a full year (365/30 × unitPrice), on a MONTHLY base one
    // month. (Was gated to `daysRemaining > 30 → full month`, which under-charged addons on annual bases.)
    let originalUnitPrice;
    if (!tier.isDynamicUnitPricing) {
      originalUnitPrice = baseUnitPrice;
    } else {
      originalUnitPrice = calculateProRatedAddonPrice(baseUnitPrice, daysRemaining);
    }

    const parsedQuantity = parseInt(quantity) || 0;

    const lineNet = parsedQuantity * originalUnitPrice;
    const addonTax = await calculateTaxBreakdown(lineNet);

    // Validate: the amount the user paid must exactly match the gross of quantity × pro-rated unit price.
    // TEMPORARY: accept the pre-tax (net) amount during the GST rollout window — remove after release.
    const normalizedPgAmount = Number(pgAmount).toFixed(2);
    const isLegacyNetAmount =
      Number(addonTax.grossAmount).toFixed(2) !== normalizedPgAmount &&
      Number(lineNet).toFixed(2) === normalizedPgAmount;
    if (isLegacyNetAmount) {
      customLog(traceId, "error", {
        message: "createSubscriptionForAddOns: accepted PRE-TAX (legacy net) amount during GST rollout window",
        corporateId,
        pgAmount,
        expectedGross: addonTax.grossAmount,
      });
    }
    if (Number(addonTax.grossAmount).toFixed(2) !== normalizedPgAmount && !isLegacyNetAmount) {
      await transaction.rollback();
      return {
        error: true,
        message: "Invalid purchase amount. Please check the amount",
      };
    }

    // subscriptionPrice = catalogue price (full, non-pro-rated, NET) — stored for reference
    // subscriptionAmountPaid = pgAmount — what the user actually paid (pro-rated + GST)
    const subscriptionPrice = parsedQuantity * baseUnitPrice;
    const subscriptionStartDate = moment().startOf("day").toDate();

    // All addons (static + dynamic) get an end date now. Helper enforces the rule:
    //   - paid GROUP plan active → addon expires with that plan
    //   - active INDIVIDUAL base for this addon's package → addon expires with that base (annual-safe)
    //   - Peko Free → 30 days from purchase
    // Auto-renewal is gated downstream (only dynamic-pricing addons renew via mandate).
    const subscriptionEndDate = await computeAddonEndDate(
      corporateId,
      subscriptionStartDate,
      pricingCashbackRow.packageId,
    );

    const newSubscription = {
      subscriptionStartDate: subscriptionStartDate,
      subscriptionEndDate: subscriptionEndDate,
      subscriptionPaymentRefId: providerId,
      subscriptionPrice: subscriptionPrice,
      subscriptionAmountPaid: pgAmount,
      taxableAmount: addonTax.taxableAmount,
      taxAmount: addonTax.taxAmount,
      taxRate: addonTax.taxRate,
      corporateUserId: corporateId,
      packageId: pricingCashbackRow.packageId,
      serviceOperatorId: pricingCashbackRow.serviceOperator?.id ?? null,
      discount: 0,
      billingType: "MONTHLY",
      isCustom: true,
      maxLimit: parsedQuantity,
      paymentModeResponse: toPaymentModeResponse(paymentGatewayResponse),
      paymentMode,
      vendorSubscriptionId: subscriptionId ?? null,
      authPayment,
      corporateTxnId,
    };

    // Each addon purchase is always a separate subscription row for clear per-transaction history.
    const createdSubscription = await Subscription.create(newSubscription, { transaction });
    const subscription = createdSubscription.get({ plain: true });

    const serviceProviderName = individualCashback.serviceOperator?.serviceProvider;
    const addonBillingType = tier.isDynamicUnitPricing
      ? (isUserSubscribed.billingType ?? "MONTHLY")
      : "ONE_TIME";

    const orderDetailsPayload = {
      ...newSubscription,
      serviceName: serviceProviderName
        ? `Add On (${serviceProviderName}) - ${parsedQuantity} units`
        : `${individualCashback.package.packageName} - Add-ons`,
      billingType: addonBillingType,
    };
    delete orderDetailsPayload.paymentModeResponse;

    // Wallet payments create the order row in createWalletTransaction (PENDING),
    // then the controller updates it to SUCCESS via updateWalletTransaction.
    // Only create a new order here for PG payments.
    let addonOrderDetails = null;
    if (paymentMode !== "WALLET") {
      addonOrderDetails = await orders.create(
        {
          corporateTxnId: corporateTxnId,
          providerId: providerId,
          operatorId: uuidv4(),
          corporateId: credentialId,
          transactionDate: new Date(),
          amountInINR: parseFloat(pgAmount),
          baseAmount: parseFloat(pgAmount),
          baseCurrency: "INR",
          exchangeRate: 1,
          status: "SUCCESS",
          paymentMode: "PAYMENT GATEWAY",
          paymentModeResponse: JSON.stringify([{ ...paymentGatewayResponse, pgAmount: parseFloat(pgAmount) }]),
          accountNo: null,
          surcharge: 0,
          serviceOperatorId: null,
          credentialId,
          subCorporateUserId: null,
          orderResponse: JSON.stringify(orderDetailsPayload),
          message: "Payment Successful",
          optional: "SUBSCRIPTION-ADDONS",
          ...reportData,
        },
        {
          transaction: transaction,
        },
      );
    }

    await transaction.commit();
    return {
      subscription,
      packageDetails: individualCashback.package,
      serviceOperator: individualCashback.serviceOperator,
      addonBillingType,
      orderId: addonOrderDetails?.id,
      taxBreakdown: { taxableAmount: addonTax.taxableAmount, taxAmount: addonTax.taxAmount, taxRate: addonTax.taxRate },
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    customLog(traceId, "info", { message: " Subscription error from createSubscriptionForAddons:", error });
    return {
      error: true,
      message: "something went wrong ",
    };
  }
};
