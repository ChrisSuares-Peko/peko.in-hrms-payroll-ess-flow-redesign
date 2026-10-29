const { getGstDetails } = require("../models/use-cases/setting");
const { calculateSurchargeWithTax } = require("./checkAndFetchServiceDetails");
const { calculateAmountAndTax } = require("../services/GSTandTAXcalculation");
const { partnerLogos } = require("./partnerLogos");
const { amountPrecision } = require("./formatter");
const { amountBeforeCommission, markupWaiver, MARKUP_MODES } = require("./applyCommissionMarkup");
const { customLog } = require("./loggerHelper");
const { configurationGaps } = require("./journalConfigurationGate");

/**
 * Computes journal breakdown for a transaction.
 *
 * @param {object} serviceDetails - service operator record (surcharge, surchargeType, commissionType, commission, etc.)
 * @param {number} [pgAmount=0]   - amount paid via payment gateway
 * @param {number} amount         - transaction amount (base plus add-ons, before surcharge; already net of any
 *   plan/upgrade credit — the caller must subtract credit before calling, not pass it separately)
 * @param {string} paymentMethod  - payment method identifier
 * @param {object} partnerDetails - { sharePercentage, state, gatewayCharge: { percentage, fixed } | null }
 * @param {string} [paymentGatewayName="WALLET"] - this service takes wallet payments only, which have no gateway; gateway payments are journaled in paymentGateway
 * @param {string} [billingType] - "MONTHLY" | "ANNUALLY" (subscriptions only). ANNUALLY books
 *   the revenue line to Deferred Revenue instead of Subscription Fees — see lineItemBuilder.js.
 * @param {boolean} [isPhysicalCard=false] - a physical card purchase. Like a subscription, Peko is the
 *   vendor (no surcharge, commission or vendor payable), but the revenue books to Physical Card Sales
 *   and there is no billing cycle. Pass it on its own; isSubscription is not needed.
 * @param {number} [quantity=1] - items bought in this order. A FLAT platform fee is charged per item, so the fee is worked out for this many
 * @param {number} [couponTotalDiscount=0] - what a coupon or Peko Credit took off; Peko bears all of it
 * @param {string} [corporateState=''] - corp user's state (req.user.state); compared against Peko's state to determine IGST vs CGST+SGST
 *
 * @param {Array}  [planDetails]  - per-plan commission overrides. each item needs:
 *   { commissionType, commission|providerCommission, amount, quantity?, fixedCommissionPerTransaction?, isCommissionInclGST?, isCommissionConfigured?, name? }
 *
 * @param {Array}  [addOnDetails] - add-on commission entries. each item needs:
 *   { commissionType, commission|providerCommission, amount, fixedCommissionPerTransaction?, isCommissionInclGST?, commissionMode? }
 *   (no quantity — each add-on counted once; commissionMode falls back to MARGIN)
 *
 * If planDetails is empty, commission falls back to serviceDetails.
 * Each plan/add-on is bucketed by its own commissionMode. MARGIN / AGENT_MARKUP items feed
 * commission*, outputGSTonCommission and vendorPayable; PRINCIPAL_MARKUP items feed the
 * principal* fields instead (they post to Sales, not Commission + Vendor Deposits).
 * Gateway charge: the partner's own terms (a percentage of the gateway amount plus a fixed sum per
 *   transaction) come off Peko's earnings before the partner's share; nothing is posted for it.
 * GST split: CGST+SGST intra-state, IGST when isInterState=true.
 */
exports.computeJournalData = async ({
    serviceDetails,
    pgAmount = 0,
    amount,
    paymentMethod,
    partnerDetails,
    paymentGatewayName = "WALLET",
    couponTotalDiscount = 0,
    planDetails = [],
    addOnDetails = [],
    corporateState = "",
    isSubscription = false,
    billingType = null,
    isPhysicalCard = false,
    quantity = 1,
    credentialId = null,
} = {}) => {
    if (!serviceDetails || !amount || !partnerDetails) {
        customLog(null, "info", {
            msg: "[computeJournalData] missing inputs — returning empty",
            hasService: !!serviceDetails,
            hasAmount: !!amount,
            hasPartner: !!partnerDetails,
        });
        return {};
    }

    customLog(null, "info", {
        msg: "[computeJournalData] inputs",
        serviceDetails,
        pgAmount,
        amount,
        paymentMethod,
        partnerDetails,
        paymentGatewayName,
        couponTotalDiscount,
        planDetails,
        addOnDetails,
        corporateState,
        isSubscription,
        billingType,
        isPhysicalCard,
    });

    const isPekoSale = isSubscription || isPhysicalCard;

    const [gstRateInfo, pekoDetails] = await Promise.all([loadGstRate(), partnerLogos()]);
    const gstRate = gstRateInfo.rate;
    const pekoState = String(pekoDetails?.state || "").trim().toLowerCase();

    // A state that cannot be told apart is not inter-state: when Peko's own state or the other
    // party's is unknown, the split falls back to CGST + SGST rather than IGST.
    const resolveIsInterState = (otherState) => {
        const normalised = String(otherState || "").trim().toLowerCase();
        if (!pekoState || !normalised) return false;
        return normalised !== pekoState;
    };

    // Platform fee / subscription: corporate's state vs Peko's.
    const isInterState = resolveIsInterState(corporateState);

    // Commission: the service's own vendor's state vs Peko's.
    const vendorIsInterState = resolveIsInterState(serviceDetails?.vendor?.state);

    // Partnership fee: the partner's state vs Peko's.
    const partnerIsInterState = resolveIsInterState(partnerDetails?.state);

    // Subscriptions and physical cards: Peko is the vendor — no surcharge, no external commission, no vendorPayable.
    // Everything else: calculate surcharge and commission as normal.
    let surchargeWithoutTax = 0;
    let surcharge = 0;
    if (!isPekoSale) {
        const surchargeResult = await calculateSurchargeWithTax(
            serviceDetails.surcharge,
            serviceDetails.surchargeType,
            amount,
            credentialId,
            quantity
        );
        surchargeWithoutTax = surchargeResult.surchargeWithoutTax;
        surcharge = surchargeResult.surcharge;
    }

    let commissionMode = "MARGIN";
    let commissionIncludingGST = 0;
    let commissionExcludingGST = 0;
    let outputGSTonCommission = 0;
    let principalCommissionExcludingGST = 0;
    let outputGSTonPrincipalCommission = 0;
    let totalPrincipalAmount = 0;
    let principalSalesPayable = 0;
    let outputGSTonPrincipalSales = 0;
    let isFullyPrincipalMarkup = false;
    if (!isPekoSale) {
        ({
            commissionMode,
            commissionIncludingGST,
            commissionExcludingGST,
            outputGSTonCommission,
            principalCommissionExcludingGST,
            outputGSTonPrincipalCommission,
            totalPrincipalAmount,
            principalSalesPayable,
            outputGSTonPrincipalSales,
            isFullyPrincipalMarkup,
        } = await computeCommission({
            serviceDetails,
            planDetails,
            addOnDetails,
            amount,
            gstRate,
            credentialId,
        }));
    }

    const totalAmount = Number(amount) + Number(surcharge);
    const walletAmount =
        Number(totalAmount) -
            (couponTotalDiscount +
                Number(pgAmount)) || 0;

    // Principal-markup items are taken out — their vendor share is folded into the Sales credit.
    const vendorPayable = isPekoSale || isFullyPrincipalMarkup
        ? 0
        : amountPrecision(
              Number(amount) -
                  totalPrincipalAmount -
                  Number(commissionIncludingGST)
          );

    // Income decomposition of Peko's own sale (Peko is the vendor).
    const subscriptionCollected = isPekoSale
        ? calculateAmountAndTax(pgAmount, gstRate)
        : { actualAmount: 0, taxAmount: 0 };
    const netSubscriptionIncome = isPekoSale
        ? amountPrecision(
              Number(subscriptionCollected.actualAmount) +
                  couponTotalDiscount
          )
        : 0;
    const outputGSTonRevenue = subscriptionCollected.taxAmount;

    const chargeTerms = gatewayChargeTermsOf(partnerDetails?.gatewayCharge);
    const gatewayCharge = gatewayChargeOn(chargeTerms, pgAmount);

    // Partner fee:
    //   Peko's own sale → based on netSubscriptionIncome (the sale before GST and before the coupon cost)
    //   other           → based on commission + surcharge surplus
    //   either way, less the gateway charge the partner bears
    const partnerShareBase = isPekoSale
        ? netSubscriptionIncome - gatewayCharge
        : Number(commissionExcludingGST) +
          Number(principalCommissionExcludingGST) +
          Number(surchargeWithoutTax) -
          gatewayCharge;
    let partnerShipFee = 0;
    if (partnerDetails?.sharePercentage && partnerShareBase > 0) {
        partnerShipFee =
            partnerShareBase * (Number(partnerDetails.sharePercentage) / 100);
    }
    partnerShipFee = amountPrecision(partnerShipFee);

    const outputGSTonPlatformFee = surcharge - surchargeWithoutTax;
    const inputGSTonPartnerShipFee = partnerShipFee * gstRate;

    // Reported here only — recordJournal.js (sharedServices) decides whether to skip on these.
    const gaps = configurationGaps({ serviceDetails, planDetails, isPekoSale });

    const journalData = {
        ...(!isPekoSale && {
            totalTransactionAmount: amountPrecision(totalAmount),
            netTransactionAmount: amountPrecision(
                totalAmount - couponTotalDiscount
            ),
            paymentThroughWallet: amountPrecision(walletAmount),
        }),
        paymentThroughGateway: amountPrecision(pgAmount),
        ...(chargeTerms && { gatewayCharge }),
        ...(isPekoSale
            ? {
                netSubscriptionIncome,
                outputGSTonRevenue,
                ...(isPhysicalCard
                    ? { isPhysicalCard: true }
                    : { billingType: billingType || "MONTHLY" }),
            }
            : {
                platformFeeIncludingGST: amountPrecision(surcharge),
                outputGSTonPlatformFee: amountPrecision(outputGSTonPlatformFee),
                platformFeeExcludingGST: amountPrecision(surchargeWithoutTax),
                commissionMode,
                commissionIncludingGST: amountPrecision(commissionIncludingGST),
                outputGSTonCommission: amountPrecision(outputGSTonCommission),
                commissionExcludingGST: amountPrecision(commissionExcludingGST),
                vendorPayable,
                principalSalesPayable: amountPrecision(principalSalesPayable),
                outputGSTonPrincipalSales: amountPrecision(outputGSTonPrincipalSales),
                outputGSTonPrincipalCommission: amountPrecision(
                    outputGSTonPrincipalCommission
                ),
                principalCommissionExcludingGST: amountPrecision(
                    principalCommissionExcludingGST
                ),
            }),
        partnerShipFee: amountPrecision(partnerShipFee),
        inputGSTonPartnerShipFee: amountPrecision(inputGSTonPartnerShipFee),
        partnerPayable: amountPrecision(
            partnerShipFee + inputGSTonPartnerShipFee
        ),
        // India CGST/SGST/IGST decomposition (applied to the sum of output+input GST on this txn)
        gstSplit: splitGst({
            outputGSTonPlatformFee,
            outputGSTonCommission:
                Number(outputGSTonCommission) +
                Number(outputGSTonPrincipalCommission) +
                Number(outputGSTonPrincipalSales),
            inputGSTonPartnerShipFee,
            isInterState,
        }),
        isInterState,
        vendorIsInterState,
        salesIsInterState: isInterState,
        partnerIsInterState,
        gstRatePct: gstRateInfo.ratePct,
        paymentGatewayName,
        couponTotalDiscount,
        recordJournalEntry: Boolean(serviceDetails?.recordJournalEntry ?? true),
        ...gaps,
    };

    const result = {
        journalData,
    };

    customLog(null, "info", { msg: "[computeJournalData] result", result });
    return result;
};

// ─────────────────────────── helpers ───────────────────────────

const loadGstRate = async () => {
    try {
        const data = await getGstDetails();
        const ratePct = Number(data?.details?.gst ?? 18);
        return { rate: ratePct / 100, ratePct };
    } catch (err) {
        customLog(null, "error", {
            msg: "[computeJournalData] getGstDetails failed — defaulting to 18%",
            err: err?.message,
        });
        return { rate: 0.18, ratePct: 18 };
    }
};

const gatewayChargeTermsOf = (value) => {
    let terms = value;
    if (typeof value === "string") {
        try {
            terms = JSON.parse(value);
        } catch (error) {
            return null;
        }
    }
    if (!terms || typeof terms !== "object") return null;
    return {
        percentage: Number(terms.percentage) || 0,
        fixed: Number(terms.fixed) || 0,
    };
};

const gatewayChargeOn = (terms, pgAmount) =>
    terms && Number(pgAmount) > 0
        ? amountPrecision(Number(pgAmount) * (terms.percentage / 100) + terms.fixed)
        : 0;

// The order's own mode, in sellingMode.js's words: principal items with any other item make it MIXED. Margin and
// agent markup items share one commission bucket, so any agent markup item makes the order AGENT_MARKUP.
const orderCommissionMode = (modes) => {
    const hasPrincipal = modes.has("PRINCIPAL_MARKUP");
    if (hasPrincipal) return modes.size > 1 ? "MIXED" : "PRINCIPAL_MARKUP";
    return modes.has("AGENT_MARKUP") ? "AGENT_MARKUP" : "MARGIN";
};

const NO_COMMISSION = { inclGST: 0, exclGST: 0, gst: 0 };

const computeCommission = async ({
    serviceDetails,
    planDetails,
    addOnDetails,
    amount,
    gstRate = 0.18,
    credentialId = null,
}) => {
    const isWaived = markupWaiver(credentialId);
    const computeOne = (commConfig, baseAmount) => {
        const commValue = Number(
            commConfig.commission ?? commConfig.providerCommission ?? 0
        );
        const fixed = Number(commConfig.fixedCommissionPerTransaction ?? 0);
        const isInclGST = !!commConfig.isCommissionInclGST;

        let base =
            commConfig.commissionType === "FLAT"
                ? commValue
                : Number(baseAmount) * (commValue / 100);
        base += fixed;

        if (isInclGST) {
            const excl = base / (1 + gstRate);
            return { inclGST: base, exclGST: excl, gst: base - excl };
        }
        const gst = base * gstRate;
        return { inclGST: base + gst, exclGST: base, gst };
    };

    // MARGIN / AGENT_MARKUP items vs PRINCIPAL_MARKUP items; a missing mode is MARGIN.
    const margin = { incl: 0, excl: 0, gst: 0 };
    const principal = { incl: 0, excl: 0, gst: 0, amount: 0 };
    let itemCount = 0;
    let principalItemCount = 0;
    const modes = new Set();

    const addItem = async (commissionMode, commConfig, baseAmount, quantity) => {
        const bucket =
            commissionMode === "PRINCIPAL_MARKUP" ? principal : margin;
        const commissionBase = MARKUP_MODES.has(commissionMode)
            ? await amountBeforeCommission(commConfig, baseAmount, credentialId, gstRate)
            : baseAmount;
        const { inclGST, exclGST, gst } = (await isWaived(commissionMode))
            ? NO_COMMISSION
            : computeOne(commConfig, commissionBase);
        bucket.incl += inclGST * quantity;
        bucket.excl += exclGST * quantity;
        bucket.gst += gst * quantity;
        itemCount += 1;
        modes.add(commissionMode || "MARGIN");
        if (bucket === principal) {
            principal.amount += Number(baseAmount) * quantity;
            principalItemCount += 1;
        }
    };

    if (Array.isArray(planDetails) && planDetails.length > 0) {
        for (const plan of planDetails) {
            await addItem(
                plan.commissionMode,
                plan,
                plan.amount,
                Number(plan.quantity ?? 1)
            );
        }
    } else {
        await addItem(serviceDetails?.commissionMode, serviceDetails, amount, 1);
    }

    if (Array.isArray(addOnDetails) && addOnDetails.length > 0) {
        for (const addon of addOnDetails) {
            const quantity = Number(addon.quantity ?? 1);
            await addItem(addon.commissionMode, addon, addon.amount, quantity);
        }
    }

    // The vendor's price on principal markup items carries GST too (Peko is the one selling it): the GST inside it.
    const principalSales = amountPrecision(principal.amount - principal.incl);

    return {
        commissionMode: orderCommissionMode(modes),
        commissionIncludingGST: amountPrecision(margin.incl),
        commissionExcludingGST: amountPrecision(margin.excl),
        outputGSTonCommission: amountPrecision(margin.gst),
        principalCommissionExcludingGST: amountPrecision(principal.excl),
        outputGSTonPrincipalCommission: amountPrecision(principal.gst),
        totalPrincipalAmount: amountPrecision(principal.amount),
        principalSalesPayable: principalSales,
        outputGSTonPrincipalSales: amountPrecision(principalSales - principalSales / (1 + gstRate)),
        isFullyPrincipalMarkup: itemCount > 0 && principalItemCount === itemCount,
    };
};

const splitGst = ({
    outputGSTonPlatformFee = 0,
    outputGSTonCommission = 0,
    inputGSTonPartnerShipFee = 0,
    isInterState,
}) => {
    const totalOutputGST =
        Number(outputGSTonPlatformFee) + Number(outputGSTonCommission);
    const totalInputGST = Number(inputGSTonPartnerShipFee);
    if (isInterState) {
        return {
            outputIGST: amountPrecision(totalOutputGST),
            inputIGST: amountPrecision(totalInputGST),
            outputCGST: 0,
            outputSGST: 0,
            inputCGST: 0,
            inputSGST: 0,
        };
    }
    return {
        outputCGST: amountPrecision(totalOutputGST / 2),
        outputSGST: amountPrecision(totalOutputGST / 2),
        inputCGST: amountPrecision(totalInputGST / 2),
        inputSGST: amountPrecision(totalInputGST / 2),
        outputIGST: 0,
        inputIGST: 0,
    };
};
