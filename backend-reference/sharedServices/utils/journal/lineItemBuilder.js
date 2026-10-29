const { amountPrecision } = require("../formatter");
const {
    findAllByAccountNames,
    findGenericAccountByName,
} = require("../../models/use-cases/chartOfAccount");
const { findByCredentialId } = require("../../models/use-cases/corporateUser");
const {
    findById: findCredentialById,
} = require("../../models/use-cases/credential");
const { isInternalAccount } = require("../../models/use-cases/setting");
const { findByCorporateTxnId } = require("../../models/use-cases/order");

const ACCOUNTS = {
    transactionProcessingFees: "Transaction Processing Fees",
    outputCGST: "Output CGST",
    outputSGST: "Output SGST",
    outputIGST: "Output IGST",
    inputCGST: "Input CGST",
    inputSGST: "Input SGST",
    inputIGST: "Input IGST",
    couponDiscountExpense: "Coupon Discount Expense",
    platformFees: "Platform Fees",
    commission: "Commission",
    sales: "Sales",
    subscriptionFees: "Subscription Fees",
    physicalCardSales: "Physical Card Sales",
    deferredRevenue: "Deferred Revenue",
    partnershipFees: "Partnership Fees",
    roundingOff: "Rounding Off Account",
    internalPurchases: "Internal Purchases Temporary Account",
    vendorPayableTemporary: "Vendor Payable Temporary Account",
    cashbackExpense: "Cashback Expense",
    subscribersWallet: "Subscribers Wallet",
    vendorDeposits: "Vendor Deposits",
    partnershipFeePayable: "Partnership Fee Payable",
};

// The income account a subscription-style order credits: a physical card's own, else Deferred
// Revenue for an annual plan, else Subscription Fees.
const revenueAccountNameOf = (jd, isAnnualSubscription) => {
    if (jd.isPhysicalCard) return ACCOUNTS.physicalCardSales;
    return isAnnualSubscription
        ? ACCOUNTS.deferredRevenue
        : ACCOUNTS.subscriptionFees;
};

const normaliseRegisteredBy = (registeredBy) => {
    if (
        !registeredBy ||
        registeredBy === "null" ||
        registeredBy === "undefined"
    ) {
        return null;
    }
    return registeredBy;
};

// Every GST amount splits CGST+SGST (50/50) when intra-state, IGST (100%) when
const splitGstByState = (amount, isInterState) => {
    const amt = Number(amount || 0);
    if (amt <= 0) return { cgst: 0, sgst: 0, igst: 0 };
    if (isInterState) {
        return { cgst: 0, sgst: 0, igst: amountPrecision(amt) };
    }
    return {
        cgst: amountPrecision(amt / 2),
        sgst: amountPrecision(amt / 2),
        igst: 0,
    };
};

const pushGstLines = (
    lineItems,
    ids,
    amount,
    isInterState,
    direction,
    description
) => {
    const { cgst, sgst, igst } = splitGstByState(amount, isInterState);
    if (cgst > 0) lineItems.push(line(ids.cgst, direction, cgst, description));
    if (sgst > 0) lineItems.push(line(ids.sgst, direction, sgst, description));
    if (igst > 0) lineItems.push(line(ids.igst, direction, igst, description));
};

const ROUNDING_THRESHOLD = 0.1;

const line = (accountId, direction, amount, description) => ({
    accountId,
    direction,
    amount,
    description,
});

// Balances debits vs credits, dropping non-positive rows and pushing a rounding row
// (from the Rounding Off Account) when the gap is within threshold.
// Returns { balanced: true } when the journal is balanced (or was made balanced), or
// { balanced: false, reason } naming the specific problem so it reaches the admin UI.
const applyRoundingAdjustment = async (lineItems, corporateTxnId) => {
    for (let i = lineItems.length - 1; i >= 0; i--) {
        const rounded = amountPrecision(lineItems[i].amount);
        if (rounded > 0) {
            lineItems[i].amount = rounded;
        } else {
            lineItems.splice(i, 1);
        }
    }
    const totalDebits = lineItems.reduce(
        (s, i) => s + (i.direction === "debit" ? Number(i.amount) : 0),
        0
    );
    const totalCredits = lineItems.reduce(
        (s, i) => s + (i.direction === "credit" ? Number(i.amount) : 0),
        0
    );
    const difference = amountPrecision(Math.abs(totalDebits - totalCredits));
    if (difference === 0) return { balanced: true };
    if (difference > ROUNDING_THRESHOLD) {
        return {
            balanced: false,
            reason: `Debit/credit difference (${difference}) exceeds rounding threshold (${ROUNDING_THRESHOLD}) — debits ${totalDebits}, credits ${totalCredits}`,
        };
    }
    const [roundingAccount] = await findAllByAccountNames([
        ACCOUNTS.roundingOff,
    ]);
    if (!roundingAccount) {
        return { balanced: false, reason: "Rounding Off Account not found" };
    }
    lineItems.push(
        line(
            roundingAccount.provider_account_id,
            totalDebits < totalCredits ? "debit" : "credit",
            difference,
            corporateTxnId
        )
    );
    return { balanced: true };
};

// Principal-markup Sales. The vendor's price carries GST (outputGSTonPrincipalSales, worked out when the sale was booked),
// so Sales is booked without it, and that GST joins the GST on Peko's commission in the Output GST lines.
// An order without outputGSTonPrincipalSales (booked before it existed) gets the same lines as it always did.
const principalSalesOf = (jd) => {
    const gstOnVendorShare = Number(jd.outputGSTonPrincipalSales ?? 0);
    return {
        salesAmount: amountPrecision(
            Number(jd.principalSalesPayable ?? 0) -
                gstOnVendorShare +
                Number(jd.principalCommissionExcludingGST ?? 0)
        ),
        salesGst: amountPrecision(
            Number(jd.outputGSTonPrincipalCommission ?? 0) + gstOnVendorShare
        ),
    };
};

// Builds the (balanced) line items for a transaction journal.
// context: { journalData, corporateTxnId, vendor, paymentGatewayName, credentialId, registeredBy }
// Returns { ok: true, lineItems, journalAccountIds } or { ok: false, reason }.
const buildTransactionLineItems = async (context) => {
    const { corporateTxnId, vendor, paymentGatewayName, credentialId } =
        context;
    const registeredBy = normaliseRegisteredBy(context.registeredBy);
    const jd = context.journalData ?? {};
    const isSubscription = jd.netSubscriptionIncome != null;
    const isAnnualSubscription =
        isSubscription && jd.billingType === "ANNUALLY";

    // Per-fee-type inter-state flags — each fee's GST splits CGST+SGST vs IGST based on
    // the states of the two parties actually involved in THAT fee, not one flag for all.
    const platformFeeIsInterState = !!jd.isInterState; // corporate vs Peko (also used for subscription)
    const commissionIsInterState = !!jd.vendorIsInterState; // vendor vs Peko
    const salesIsInterState = !!jd.salesIsInterState; // corporate vs Peko (Sales GST)
    const partnerFeeIsInterState = !!jd.partnerIsInterState; // partner vs Peko

    if ((!isSubscription && !vendor?.vendorName) || !corporateTxnId) {
        return {
            ok: false,
            reason: "Vendor name and corporate transaction ID are required",
        };
    }

    // Normalise wallet/gateway split — gateway MS uses paymentThroughWallet/Gateway,
    // other MSes use walletAmount. Fall back gracefully.
    const totalTransactionAmount = Number(jd.totalTransactionAmount ?? 0);
    const paymentThroughWallet = Number(
        jd.paymentThroughWallet ?? jd.walletAmount ?? 0
    );
    const paymentThroughGateway = Number(
        jd.paymentThroughGateway ??
            totalTransactionAmount - paymentThroughWallet
    );

    const {
        couponTotalDiscount = 0,
        platformFeeIncludingGST = 0,
        outputGSTonPlatformFee = 0,
        platformFeeExcludingGST = 0,
        commissionIncludingGST = 0,
        commissionExcludingGST = 0,
        outputGSTonCommission = 0,
        vendorPayable = 0,
        partnerShipFee = 0,
        inputGSTonPartnerShipFee = 0,
        partnerPayable = 0,
        netSubscriptionIncome = 0,
        outputGSTonRevenue = 0,
    } = jd;

    // Principal-markup items book to Sales: their payable plus Peko's commission on them, without the GST on them.
    const { salesAmount, salesGst } = principalSalesOf(jd);

    const lineItems = [];
    let journalAccountIds = {};

    const internal = await isInternalAccount(credentialId);
    const corporate = await findByCredentialId(credentialId);

    if (internal) {
        if (
            (vendorPayable === 0 && salesAmount === 0) ||
            !vendor ||
            !vendor.vendorName
        ) {
            return {
                ok: false,
                reason: "Vendor details not found for internal account",
            };
        }
        const accountNames = [
            ACCOUNTS.internalPurchases,
            ACCOUNTS.commission,
            ACCOUNTS.vendorPayableTemporary,
            ACCOUNTS.outputCGST,
            ACCOUNTS.outputSGST,
            ACCOUNTS.outputIGST,
            ACCOUNTS.vendorDeposits,
        ];
        const coa = await findAllByAccountNames(accountNames);
        const internalPurchases = coa.find(
            (a) => a.account_name === ACCOUNTS.internalPurchases
        );
        const commission = coa.find(
            (a) => a.account_name === ACCOUNTS.commission
        );
        const principalPayable = coa.find(
            (a) => a.account_name === ACCOUNTS.vendorPayableTemporary
        );
        const outputCGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputCGST
        );
        const outputSGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputSGST
        );
        const outputIGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputIGST
        );
        const vendorPayableAcc = coa.find(
            (a) => a.account_name === ACCOUNTS.vendorDeposits
        );

        // Principal-markup items of an internal account: the whole amount, GST included, is one credit.
        const principalAmount = amountPrecision(
            Number(salesAmount) + Number(salesGst)
        );

        if (
            !internalPurchases ||
            !commission ||
            (principalAmount > 0 && !principalPayable) ||
            !outputCGST ||
            !outputSGST ||
            !outputIGST ||
            !vendorPayableAcc
        ) {
            return {
                ok: false,
                reason: `No COA accounts found for Internal Account (missing ${
                    principalAmount > 0 && !principalPayable
                        ? ACCOUNTS.vendorPayableTemporary
                        : ACCOUNTS.commission
                }?)`,
            };
        }
        const outputGstIds = {
            cgst: outputCGST.provider_account_id,
            sgst: outputSGST.provider_account_id,
            igst: outputIGST.provider_account_id,
        };
        const totalDebit = amountPrecision(
            Number(commissionExcludingGST) +
                Number(outputGSTonCommission) +
                Number(vendorPayable) +
                principalAmount
        );
        lineItems.push(
            line(
                internalPurchases.provider_account_id,
                "debit",
                totalDebit,
                corporateTxnId
            )
        );
        if (principalAmount > 0)
            lineItems.push(
                line(
                    principalPayable.provider_account_id,
                    "credit",
                    principalAmount,
                    corporateTxnId
                )
            );
        if (commissionExcludingGST > 0)
            lineItems.push(
                line(
                    commission.provider_account_id,
                    "credit",
                    amountPrecision(commissionExcludingGST),
                    corporateTxnId
                )
            );
        pushGstLines(
            lineItems,
            outputGstIds,
            outputGSTonCommission,
            commissionIsInterState,
            "credit",
            corporateTxnId
        );
        if (vendorPayable > 0)
            lineItems.push(
                line(
                    vendorPayableAcc.provider_account_id,
                    "credit",
                    amountPrecision(vendorPayable),
                    corporateTxnId
                )
            );
        journalAccountIds = {
            isInternalAccount: true,
            internalPurchases: internalPurchases.provider_account_id,
            commission: commission.provider_account_id,
            outputCGST: outputCGST.provider_account_id,
            outputSGST: outputSGST.provider_account_id,
            outputIGST: outputIGST.provider_account_id,
            vendorPayable: vendorPayableAcc.provider_account_id,
            ...(principalAmount > 0 && {
                vendorPayableTemporary: principalPayable.provider_account_id,
            }),
        };
    } else {
        const accountNames = [
            paymentGatewayName,
            ACCOUNTS.inputCGST,
            ACCOUNTS.inputSGST,
            ACCOUNTS.inputIGST,
            ACCOUNTS.outputCGST,
            ACCOUNTS.outputSGST,
            ACCOUNTS.outputIGST,
            ACCOUNTS.couponDiscountExpense,
        ];
        if (vendor && vendor.vendorName)
            accountNames.push(
                ACCOUNTS.platformFees,
                ACCOUNTS.commission,
                ACCOUNTS.sales,
                ACCOUNTS.vendorDeposits
            );
        if (isSubscription)
            accountNames.push(revenueAccountNameOf(jd, isAnnualSubscription));

        let partner = null;
        if (registeredBy) {
            partner = await findCredentialById(registeredBy);
            if (!partner) {
                return {
                    ok: false,
                    reason: "Partner not found by registeredBy",
                };
            }
            accountNames.push(
                ACCOUNTS.partnershipFees,
                ACCOUNTS.partnershipFeePayable
            );
        }

        const coa = await findAllByAccountNames(accountNames);
        if (!coa?.length) {
            return { ok: false, reason: "No COA accounts found" };
        }

        const inputCGST = coa.find(
            (a) => a.account_name === ACCOUNTS.inputCGST
        );
        const inputSGST = coa.find(
            (a) => a.account_name === ACCOUNTS.inputSGST
        );
        const inputIGST = coa.find(
            (a) => a.account_name === ACCOUNTS.inputIGST
        );
        const outputCGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputCGST
        );
        const outputSGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputSGST
        );
        const outputIGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputIGST
        );
        if (
            !inputCGST ||
            !inputSGST ||
            !inputIGST ||
            !outputCGST ||
            !outputSGST ||
            !outputIGST
        ) {
            return {
                ok: false,
                reason: "No COA accounts found for GST accounts",
            };
        }
        const inputGstIds = {
            cgst: inputCGST.provider_account_id,
            sgst: inputSGST.provider_account_id,
            igst: inputIGST.provider_account_id,
        };
        const outputGstIds = {
            cgst: outputCGST.provider_account_id,
            sgst: outputSGST.provider_account_id,
            igst: outputIGST.provider_account_id,
        };

        journalAccountIds = {
            isInternalAccount: false,
            inputCGST: inputCGST.provider_account_id,
            inputSGST: inputSGST.provider_account_id,
            inputIGST: inputIGST.provider_account_id,
            outputCGST: outputCGST.provider_account_id,
            outputSGST: outputSGST.provider_account_id,
            outputIGST: outputIGST.provider_account_id,
        };

        // Payment Gateway case
        if (paymentThroughGateway > 0) {
            const pgMain = coa.find(
                (a) => a.account_name === paymentGatewayName
            );
            if (!pgMain) {
                return {
                    ok: false,
                    reason: "No COA accounts found for PG vendor",
                };
            }
            lineItems.push(
                line(
                    pgMain.provider_account_id,
                    "debit",
                    amountPrecision(paymentThroughGateway),
                    corporateTxnId
                )
            );
            journalAccountIds.paymentGateway = pgMain.provider_account_id;
        }

        // Wallet case
        if (paymentThroughWallet > 0 && corporate && corporate.id) {
            const walletAccount = await findGenericAccountByName(
                ACCOUNTS.subscribersWallet,
                ["account_name", "provider_account_id"]
            );
            if (walletAccount) {
                lineItems.push(
                    line(
                        walletAccount.provider_account_id,
                        "debit",
                        paymentThroughWallet,
                        corporateTxnId
                    )
                );
                journalAccountIds.walletAccount =
                    walletAccount.provider_account_id;
            }
        }

        // Platform fee case
        if (platformFeeIncludingGST > 0) {
            const platformFee = coa.find(
                (a) => a.account_name === ACCOUNTS.platformFees
            );
            if (!platformFee) {
                return {
                    ok: false,
                    reason: "No COA accounts found for platform fees",
                };
            }
            lineItems.push(
                line(
                    platformFee.provider_account_id,
                    "credit",
                    platformFeeExcludingGST,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                outputGSTonPlatformFee,
                platformFeeIsInterState,
                "credit",
                corporateTxnId
            );
            journalAccountIds.platformFees = platformFee.provider_account_id;
        }

        // Principal-markup items — the vendor's share and Peko's margin are one Sales credit
        // (no Vendor Deposits line for them). Can sit in the same journal as the lines below.
        if (salesAmount > 0 && vendor && vendor.vendorName) {
            const sales = coa.find((a) => a.account_name === ACCOUNTS.sales);
            if (!sales) {
                return {
                    ok: false,
                    reason: `No COA accounts found for ${ACCOUNTS.sales}`,
                };
            }
            lineItems.push(
                line(
                    sales.provider_account_id,
                    "credit",
                    salesAmount,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                salesGst,
                salesIsInterState,
                "credit",
                corporateTxnId
            );
            journalAccountIds.sales = sales.provider_account_id;
        }

        // Commission case — Peko's own commission/service-fee income. Independent of
        // vendorPayable: a service where Peko keeps the full fee itself (e.g. govt
        // services, no external vendor cost) has commissionIncludingGST > 0 but
        // vendorPayable === 0, and still needs this credit posted.
        if (commissionIncludingGST > 0 && vendor && vendor.vendorName) {
            const vendorCommission = coa.find(
                (a) => a.account_name === ACCOUNTS.commission
            );
            if (!vendorCommission) {
                return {
                    ok: false,
                    reason: "No COA accounts found for commission",
                };
            }
            lineItems.push(
                line(
                    vendorCommission.provider_account_id,
                    "credit",
                    commissionExcludingGST,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                outputGSTonCommission,
                commissionIsInterState,
                "credit",
                corporateTxnId
            );
            journalAccountIds.commission =
                vendorCommission.provider_account_id;
        }

        // Vendor share of the order, separate from Peko's own commission above.
        // Peko prepays each vendor, so "Vendor Deposits" is an ASSET holding that
        // advance and this credit DRAWS IT DOWN by the vendor's share. The
        // journalAccountIds key stays `vendorPayable` because admin refunds read it
        // back off orders written before this was clarified.
        if (vendorPayable > 0 && vendor && vendor.vendorName) {
            const vendorDepositsAcc = coa.find(
                (a) => a.account_name === ACCOUNTS.vendorDeposits
            );
            if (!vendorDepositsAcc) {
                return {
                    ok: false,
                    reason: `No COA account found for ${ACCOUNTS.vendorDeposits}`,
                };
            }
            lineItems.push(
                line(
                    vendorDepositsAcc.provider_account_id,
                    "credit",
                    vendorPayable,
                    corporateTxnId
                )
            );
            journalAccountIds.vendorPayable =
                vendorDepositsAcc.provider_account_id;
        }

        // Subscription case — annual plans defer revenue to a liability account instead
        // of recognising it immediately as income (see isAnnualSubscription above).
        if (isSubscription) {
            const subscriptionRevenueAccountName = revenueAccountNameOf(
                jd,
                isAnnualSubscription
            );
            const subscriptionFees = coa.find(
                (a) => a.account_name === subscriptionRevenueAccountName
            );
            if (!subscriptionFees) {
                return {
                    ok: false,
                    reason: `No COA account found for ${subscriptionRevenueAccountName}`,
                };
            }
            lineItems.push(
                line(
                    subscriptionFees.provider_account_id,
                    "credit",
                    netSubscriptionIncome,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                outputGSTonRevenue,
                platformFeeIsInterState,
                "credit",
                corporateTxnId
            );
            journalAccountIds.subscriptionFees =
                subscriptionFees.provider_account_id;
        }

        // Coupon discount case
        if (couponTotalDiscount > 0) {
            const couponExpense = coa.find(
                (a) => a.account_name === ACCOUNTS.couponDiscountExpense
            );
            if (!couponExpense) {
                return {
                    ok: false,
                    reason: "No COA accounts found for coupon discount expense",
                };
            }
            lineItems.push(
                line(
                    couponExpense.provider_account_id,
                    "debit",
                    couponTotalDiscount,
                    corporateTxnId
                )
            );
        }

        // Partner case
        if (partnerShipFee > 0) {
            const partnerFees = coa.find(
                (a) => a.account_name === ACCOUNTS.partnershipFees
            );
            const partnerFeesPayable = coa.find(
                (a) =>
                    a.account_name ===
                    ACCOUNTS.partnershipFeePayable
            );
            if (!partnerFees || !partnerFeesPayable) {
                return {
                    ok: false,
                    reason: "No COA accounts found for partnership fees and payable",
                };
            }
            lineItems.push(
                line(
                    partnerFees.provider_account_id,
                    "debit",
                    partnerShipFee,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                inputGstIds,
                inputGSTonPartnerShipFee,
                partnerFeeIsInterState,
                "debit",
                corporateTxnId
            );
            lineItems.push(
                line(
                    partnerFeesPayable.provider_account_id,
                    "credit",
                    partnerPayable,
                    corporateTxnId
                )
            );
            journalAccountIds.partnershipFees = partnerFees.provider_account_id;
            journalAccountIds.partnershipFeesPayable =
                partnerFeesPayable.provider_account_id;
        }
    }

    const { balanced, reason: balanceReason } = await applyRoundingAdjustment(
        lineItems,
        corporateTxnId
    );
    if (!balanced) {
        return { ok: false, reason: balanceReason || "Journal is not balanced" };
    }

    return { ok: true, lineItems, journalAccountIds };
};

// Builds the (balanced) line items for a refund journal — reverses the original
// transaction's accounting. Same rule engine as buildTransactionLineItems, but every
// line's direction flips, and the gateway-fee lines are dropped entirely (Peko doesn't
// get its processing fee back from the gateway just because the customer was refunded).
// context: { journalData, corporateTxnId, vendor, paymentGatewayName, credentialId, registeredBy }
// Returns { ok: true, lineItems, journalAccountIds } or { ok: false, reason }.
const buildRefundLineItems = async (context) => {
    const { corporateTxnId, vendor, paymentGatewayName, credentialId } =
        context;
    const registeredBy = normaliseRegisteredBy(context.registeredBy);
    const jd = context.journalData ?? {};
    const isSubscription = jd.netSubscriptionIncome != null;
    const isAnnualSubscription =
        isSubscription && jd.billingType === "ANNUALLY";

    const platformFeeIsInterState = !!jd.isInterState;
    const commissionIsInterState = !!jd.vendorIsInterState;
    const salesIsInterState = !!jd.salesIsInterState;
    const partnerFeeIsInterState = !!jd.partnerIsInterState;

    if ((!isSubscription && !vendor?.vendorName) || !corporateTxnId) {
        return {
            ok: false,
            reason: "Vendor name and corporate transaction ID are required",
        };
    }

    const totalTransactionAmount = Number(jd.totalTransactionAmount ?? 0);
    const paymentThroughWallet = Number(
        jd.paymentThroughWallet ?? jd.walletAmount ?? 0
    );
    const paymentThroughGateway = Number(
        jd.paymentThroughGateway ??
            totalTransactionAmount - paymentThroughWallet
    );

    const {
        couponTotalDiscount = 0,
        platformFeeIncludingGST = 0,
        outputGSTonPlatformFee = 0,
        platformFeeExcludingGST = 0,
        commissionIncludingGST = 0,
        commissionExcludingGST = 0,
        outputGSTonCommission = 0,
        vendorPayable = 0,
        partnerShipFee = 0,
        inputGSTonPartnerShipFee = 0,
        partnerPayable = 0,
        netSubscriptionIncome = 0,
        outputGSTonRevenue = 0,
    } = jd;

    // Same Sales amount as buildTransactionLineItems.
    const { salesAmount, salesGst } = principalSalesOf(jd);

    const lineItems = [];
    let journalAccountIds = {};
    const swap = (dc) => (dc === "debit" ? "credit" : "debit");

    const internal = await isInternalAccount(credentialId);
    const corporate = await findByCredentialId(credentialId);

    if (internal) {
        if (
            (vendorPayable === 0 && salesAmount === 0) ||
            !vendor ||
            !vendor.vendorName
        ) {
            return {
                ok: false,
                reason: "Vendor details not found for internal account",
            };
        }
        const accountNames = [
            ACCOUNTS.internalPurchases,
            ACCOUNTS.commission,
            ACCOUNTS.sales,
            ACCOUNTS.vendorPayableTemporary,
            ACCOUNTS.outputCGST,
            ACCOUNTS.outputSGST,
            ACCOUNTS.outputIGST,
            ACCOUNTS.vendorDeposits,
        ];
        const coa = await findAllByAccountNames(accountNames);
        const internalPurchases = coa.find(
            (a) => a.account_name === ACCOUNTS.internalPurchases
        );
        const commission = coa.find(
            (a) => a.account_name === ACCOUNTS.commission
        );
        const sales = coa.find((a) => a.account_name === ACCOUNTS.sales);
        const principalPayable = coa.find(
            (a) => a.account_name === ACCOUNTS.vendorPayableTemporary
        );
        const outputCGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputCGST
        );
        const outputSGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputSGST
        );
        const outputIGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputIGST
        );
        const vendorPayableAcc = coa.find(
            (a) => a.account_name === ACCOUNTS.vendorDeposits
        );

        const principalAmount = amountPrecision(
            Number(salesAmount) + Number(salesGst)
        );
        // A sale booked to Sales, before the Vendor Payable Temporary Account, is taken back from Sales.
        const bookedStoredIds =
            principalAmount > 0
                ? (await findByCorporateTxnId(corporateTxnId))?.journalData
                      ?.journalAccountIds
                : null;
        const toSales =
            !!bookedStoredIds?.sales && !bookedStoredIds?.vendorPayableTemporary;

        if (
            !internalPurchases ||
            !commission ||
            (principalAmount > 0 && !(toSales ? sales : principalPayable)) ||
            !outputCGST ||
            !outputSGST ||
            !outputIGST ||
            !vendorPayableAcc
        ) {
            return {
                ok: false,
                reason: "No COA accounts found for Internal Account",
            };
        }
        const outputGstIds = {
            cgst: outputCGST.provider_account_id,
            sgst: outputSGST.provider_account_id,
            igst: outputIGST.provider_account_id,
        };
        const totalCreditAmount = amountPrecision(
            Number(commissionExcludingGST) +
                Number(outputGSTonCommission) +
                Number(vendorPayable) +
                principalAmount
        );
        lineItems.push(
            line(
                internalPurchases.provider_account_id,
                swap("debit"),
                totalCreditAmount,
                corporateTxnId
            )
        );
        if (principalAmount > 0 && toSales) {
            lineItems.push(
                line(
                    sales.provider_account_id,
                    swap("credit"),
                    salesAmount,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                salesGst,
                salesIsInterState,
                swap("credit"),
                corporateTxnId
            );
        } else if (principalAmount > 0) {
            lineItems.push(
                line(
                    principalPayable.provider_account_id,
                    swap("credit"),
                    principalAmount,
                    corporateTxnId
                )
            );
        }
        if (commissionExcludingGST > 0)
            lineItems.push(
                line(
                    commission.provider_account_id,
                    swap("credit"),
                    amountPrecision(commissionExcludingGST),
                    corporateTxnId
                )
            );
        pushGstLines(
            lineItems,
            outputGstIds,
            outputGSTonCommission,
            commissionIsInterState,
            swap("credit"),
            corporateTxnId
        );
        if (vendorPayable > 0)
            lineItems.push(
                line(
                    vendorPayableAcc.provider_account_id,
                    swap("credit"),
                    amountPrecision(vendorPayable),
                    corporateTxnId
                )
            );
        journalAccountIds = {
            isInternalAccount: true,
            internalPurchases: internalPurchases.provider_account_id,
            commission: commission.provider_account_id,
            outputCGST: outputCGST.provider_account_id,
            outputSGST: outputSGST.provider_account_id,
            outputIGST: outputIGST.provider_account_id,
            vendorPayable: vendorPayableAcc.provider_account_id,
            ...(principalAmount > 0 &&
                (toSales
                    ? { sales: sales.provider_account_id }
                    : {
                          vendorPayableTemporary:
                              principalPayable.provider_account_id,
                      })),
        };
    } else {
        const accountNames = [
            paymentGatewayName,
            ACCOUNTS.transactionProcessingFees,
            ACCOUNTS.inputCGST,
            ACCOUNTS.inputSGST,
            ACCOUNTS.inputIGST,
            ACCOUNTS.outputCGST,
            ACCOUNTS.outputSGST,
            ACCOUNTS.outputIGST,
            ACCOUNTS.couponDiscountExpense,
        ];
        if (vendor?.vendorName)
            accountNames.push(
                ACCOUNTS.platformFees,
                ACCOUNTS.commission,
                ACCOUNTS.sales,
                ACCOUNTS.vendorDeposits
            );
        if (isSubscription)
            accountNames.push(revenueAccountNameOf(jd, isAnnualSubscription));

        let partner = null;
        if (registeredBy) {
            partner = await findCredentialById(registeredBy);
            if (!partner?.name) {
                return {
                    ok: false,
                    reason: "Partner not found by registeredBy",
                };
            }
            accountNames.push(
                ACCOUNTS.partnershipFees,
                ACCOUNTS.partnershipFeePayable
            );
        }

        const coa = await findAllByAccountNames(accountNames);
        if (!coa?.length) {
            return { ok: false, reason: "No COA accounts found" };
        }

        const inputCGST = coa.find(
            (a) => a.account_name === ACCOUNTS.inputCGST
        );
        const inputSGST = coa.find(
            (a) => a.account_name === ACCOUNTS.inputSGST
        );
        const inputIGST = coa.find(
            (a) => a.account_name === ACCOUNTS.inputIGST
        );
        const outputCGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputCGST
        );
        const outputSGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputSGST
        );
        const outputIGST = coa.find(
            (a) => a.account_name === ACCOUNTS.outputIGST
        );
        if (
            !inputCGST ||
            !inputSGST ||
            !inputIGST ||
            !outputCGST ||
            !outputSGST ||
            !outputIGST
        ) {
            return {
                ok: false,
                reason: "No COA accounts found for GST accounts",
            };
        }
        const inputGstIds = {
            cgst: inputCGST.provider_account_id,
            sgst: inputSGST.provider_account_id,
            igst: inputIGST.provider_account_id,
        };
        const outputGstIds = {
            cgst: outputCGST.provider_account_id,
            sgst: outputSGST.provider_account_id,
            igst: outputIGST.provider_account_id,
        };

        journalAccountIds = {
            isInternalAccount: false,
            inputCGST: inputCGST.provider_account_id,
            inputSGST: inputSGST.provider_account_id,
            inputIGST: inputIGST.provider_account_id,
            outputCGST: outputCGST.provider_account_id,
            outputSGST: outputSGST.provider_account_id,
            outputIGST: outputIGST.provider_account_id,
        };

        // Subscription — reversed (was credit, now debit)
        if (isSubscription) {
            const subscriptionRevenueAccountName = revenueAccountNameOf(
                jd,
                isAnnualSubscription
            );
            const subscriptionFees = coa.find(
                (a) => a.account_name === subscriptionRevenueAccountName
            );
            if (!subscriptionFees) {
                return {
                    ok: false,
                    reason: `No COA account found for ${subscriptionRevenueAccountName}`,
                };
            }
            lineItems.push(
                line(
                    subscriptionFees.provider_account_id,
                    "debit",
                    netSubscriptionIncome,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                outputGSTonRevenue,
                platformFeeIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Sales — reversed (was credit, now debit) for the principal-markup items.
        if (salesAmount > 0 && vendor && vendor.vendorName) {
            const sales = coa.find((a) => a.account_name === ACCOUNTS.sales);
            if (!sales) {
                return {
                    ok: false,
                    reason: `No COA accounts found for ${ACCOUNTS.sales}`,
                };
            }
            lineItems.push(
                line(
                    sales.provider_account_id,
                    "debit",
                    salesAmount,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                salesGst,
                salesIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Commission — reversed (was credit, now debit). Independent of vendorPayable,
        // matching buildTransactionLineItems (see comment there).
        if (commissionIncludingGST > 0) {
            const vendorCommission = coa.find(
                (a) => a.account_name === ACCOUNTS.commission
            );
            if (!vendorCommission) {
                return {
                    ok: false,
                    reason: "No COA accounts found for commission",
                };
            }
            lineItems.push(
                line(
                    vendorCommission.provider_account_id,
                    "debit",
                    commissionExcludingGST,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                outputGSTonCommission,
                commissionIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Platform fee — reversed (was credit, now debit)
        if (platformFeeIncludingGST > 0) {
            const platformFee = coa.find(
                (a) => a.account_name === ACCOUNTS.platformFees
            );
            if (!platformFee) {
                return {
                    ok: false,
                    reason: "No COA accounts found for platform fees",
                };
            }
            lineItems.push(
                line(
                    platformFee.provider_account_id,
                    "debit",
                    platformFeeExcludingGST,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                outputGSTonPlatformFee,
                platformFeeIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Vendor payable — reversed (was credit, now debit). Principal-markup items
        // aren't in it — they're already in the Sales line above.
        if (vendorPayable > 0) {
            const vendorPayableAcc = coa.find(
                (a) => a.account_name === ACCOUNTS.vendorDeposits
            );
            if (!vendorPayableAcc) {
                return {
                    ok: false,
                    reason: "No COA accounts found for vendor payable",
                };
            }
            lineItems.push(
                line(
                    vendorPayableAcc.provider_account_id,
                    "debit",
                    vendorPayable,
                    corporateTxnId
                )
            );
        }

        // Partner — reversed (fees/inputGST were debit → now credit; payable was credit → now debit)
        if (partnerShipFee > 0 && partner?.name) {
            const partnerFees = coa.find(
                (a) => a.account_name === ACCOUNTS.partnershipFees
            );
            const partnerFeesPayable = coa.find(
                (a) =>
                    a.account_name ===
                    ACCOUNTS.partnershipFeePayable
            );
            if (!partnerFees || !partnerFeesPayable) {
                return {
                    ok: false,
                    reason: "No COA accounts found for partnership fees and payable",
                };
            }
            lineItems.push(
                line(
                    partnerFees.provider_account_id,
                    "credit",
                    partnerShipFee,
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                inputGstIds,
                inputGSTonPartnerShipFee,
                partnerFeeIsInterState,
                "credit",
                corporateTxnId
            );
            lineItems.push(
                line(
                    partnerFeesPayable.provider_account_id,
                    "debit",
                    partnerPayable,
                    corporateTxnId
                )
            );
        }

        // Coupon discount — reversed (was debit, now credit)
        if (couponTotalDiscount > 0) {
            const couponExpense = coa.find(
                (a) => a.account_name === ACCOUNTS.couponDiscountExpense
            );
            if (!couponExpense) {
                return {
                    ok: false,
                    reason: "No COA accounts found for coupon discount expense",
                };
            }
            lineItems.push(
                line(
                    couponExpense.provider_account_id,
                    "credit",
                    couponTotalDiscount,
                    corporateTxnId
                )
            );
        }

        // Payment Gateway — no fee lines reversed (Peko doesn't get the processing
        // fee back); just gives back the gross amount that had gone into the PG account.
        if (paymentThroughGateway > 0) {
            const pgMain = coa.find(
                (a) => a.account_name === paymentGatewayName
            );
            if (pgMain) {
                lineItems.push(
                    line(
                        pgMain.provider_account_id,
                        "credit",
                        amountPrecision(paymentThroughGateway),
                        corporateTxnId
                    )
                );
            }
        }

        // Wallet — reversed (was debit, now credit — money goes back into the wallet)
        if (paymentThroughWallet > 0 && corporate && corporate.id) {
            const walletAccount = await findGenericAccountByName(
                ACCOUNTS.subscribersWallet,
                ["account_name", "provider_account_id"]
            );
            if (walletAccount) {
                lineItems.push(
                    line(
                        walletAccount.provider_account_id,
                        "credit",
                        paymentThroughWallet,
                        corporateTxnId
                    )
                );
            }
        }
    }

    if (lineItems.length === 0) {
        return { ok: false, reason: "No line items to post" };
    }

    const { balanced, reason: balanceReason } = await applyRoundingAdjustment(
        lineItems,
        corporateTxnId
    );
    if (!balanced) {
        return { ok: false, reason: balanceReason || "Journal is not balanced" };
    }

    return { ok: true, lineItems, journalAccountIds };
};

// Shared engine for the wallet/cashback journal (double-entry: wallet account +
// Cashback Expense). Mirrors AE's recordWalletTransactionToZohoJournal — direction
// "credit" is cashback given to the corporate's wallet, "debit" is a reversal.
// Not exported directly; buildCashbackLineItems / buildCashbackReversalLineItems
// below each call this with their fixed direction.
// context: { corporateTxnId, credentialId, amount }
const buildWalletLineItems = async (context, direction) => {
    const { corporateTxnId, credentialId, amount } = context;

    if (!(Number(amount) > 0)) {
        return { ok: false, reason: "Amount must be greater than zero" };
    }

    const internal = await isInternalAccount(credentialId);
    if (internal) {
        return {
            ok: false,
            reason: "Wallet journal skipped for internal account",
        };
    }

    const walletAccount = await findGenericAccountByName(ACCOUNTS.subscribersWallet, [
        "account_name",
        "provider_account_id",
    ]);
    const coa = await findAllByAccountNames([ACCOUNTS.cashbackExpense]);
    const cashbackExpense = coa.find(
        (a) => a.account_name === ACCOUNTS.cashbackExpense
    );

    if (!walletAccount || !cashbackExpense) {
        return {
            ok: false,
            reason: "No COA accounts found for wallet or Cashback Expense",
        };
    }

    const lineItems = [
        line(
            walletAccount.provider_account_id,
            direction,
            amount,
            corporateTxnId
        ),
        line(
            cashbackExpense.provider_account_id,
            direction === "debit" ? "credit" : "debit",
            amount,
            corporateTxnId
        ),
    ];

    const journalAccountIds = {
        walletAccount: walletAccount.provider_account_id,
        cashbackExpense: cashbackExpense.provider_account_id,
    };

    const { balanced, reason: balanceReason } = await applyRoundingAdjustment(
        lineItems,
        corporateTxnId
    );
    if (!balanced) {
        return { ok: false, reason: balanceReason || "Journal is not balanced" };
    }

    return { ok: true, lineItems, journalAccountIds };
};

// Cashback credit — money given to the corporate's wallet.
const buildCashbackLineItems = (context) =>
    buildWalletLineItems(context, "credit");

// Cashback reversal — a previously given cashback taken back.
const buildCashbackReversalLineItems = (context) =>
    buildWalletLineItems(context, "debit");

// Builds the (balanced) line items for an admin-initiated refund — e.g. a support
// agent refunding a transaction after the fact, outside the normal booking-failure
// refund flow. Unlike buildRefundLineItems (which recomputes from a fresh
// reportData), this REVERSES the ORIGINAL transaction using its stored
// journalAccountIds + flat computed amounts (read back from the order row), scaled
// by the refund ratio so partial refunds post proportionally. Mirrors Peko-AE's
// recordAdminRefundToZohoJournal.
// context: { corporateTxnId, refundAmount, totalOrderAmount }
const buildAdminRefundLineItems = async (context) => {
    const { corporateTxnId, refundAmount, totalOrderAmount } = context;

    const storedOrder = await findByCorporateTxnId(corporateTxnId);
    const jd = storedOrder?.journalData;

    const accountIds = jd?.journalAccountIds;
    if (!accountIds) {
        return {
            ok: false,
            reason: "No stored journal account IDs found (order may predate this feature)",
        };
    }

    const platformFeeIsInterState = !!jd.isInterState;
    const commissionIsInterState = !!jd.vendorIsInterState;
    const salesIsInterState = !!jd.salesIsInterState;
    const partnerFeeIsInterState = !!jd.partnerIsInterState;

    const refundRatio =
        Number(totalOrderAmount) > 0
            ? Number(refundAmount) / Number(totalOrderAmount)
            : 1;
    const scale = (value) => amountPrecision(Number(value || 0) * refundRatio);

    const {
        couponTotalDiscount = 0,
        platformFeeIncludingGST = 0,
        outputGSTonPlatformFee = 0,
        platformFeeExcludingGST = 0,
        commissionIncludingGST = 0,
        commissionExcludingGST = 0,
        outputGSTonCommission = 0,
        vendorPayable = 0,
        partnerShipFee = 0,
        inputGSTonPartnerShipFee = 0,
        partnerPayable = 0,
        netSubscriptionIncome = 0,
        outputGSTonRevenue = 0,
    } = jd;

    // Same Sales amount as buildTransactionLineItems.
    const { salesAmount, salesGst } = principalSalesOf(jd);

    const paymentThroughWallet = Number(
        jd.paymentThroughWallet ?? jd.walletAmount ?? 0
    );
    const paymentThroughGateway = Number(
        jd.paymentThroughGateway ?? jd.gatewayFee ?? 0
    );

    const lineItems = [];
    const swap = (dc) => (dc === "debit" ? "credit" : "debit");
    const outputGstIds = {
        cgst: accountIds.outputCGST,
        sgst: accountIds.outputSGST,
        igst: accountIds.outputIGST,
    };
    const inputGstIds = {
        cgst: accountIds.inputCGST,
        sgst: accountIds.inputSGST,
        igst: accountIds.inputIGST,
    };
    const hasOutputGstIds =
        accountIds.outputCGST && accountIds.outputSGST && accountIds.outputIGST;
    const hasInputGstIds =
        accountIds.inputCGST && accountIds.inputSGST && accountIds.inputIGST;

    if (accountIds.isInternalAccount) {
        // Stored ids of a sale booked to Sales, before the Vendor Payable Temporary Account, are taken back from Sales.
        const toSales = !accountIds.vendorPayableTemporary;
        if (
            !accountIds.vendorPayable ||
            !accountIds.internalPurchases ||
            !accountIds.commission ||
            (salesAmount > 0 &&
                !(toSales ? accountIds.sales : accountIds.vendorPayableTemporary)) ||
            !hasOutputGstIds
        ) {
            return { ok: false, reason: "Missing internal account IDs" };
        }
        const scaledCommission = scale(commissionExcludingGST);
        const scaledOutputGST = scale(outputGSTonCommission);
        const scaledVendorPayable = scale(vendorPayable);
        const scaledSales = scale(salesAmount);
        const scaledPrincipalGST = scale(salesGst);
        const scaledPrincipal = toSales
            ? scaledSales + scaledPrincipalGST
            : scale(Number(salesAmount) + Number(salesGst));
        const totalCreditAmount = amountPrecision(
            scaledCommission +
                scaledOutputGST +
                scaledVendorPayable +
                scaledPrincipal
        );
        lineItems.push(
            line(
                accountIds.internalPurchases,
                swap("debit"),
                totalCreditAmount,
                corporateTxnId
            )
        );
        if (toSales) {
            if (scaledSales > 0)
                lineItems.push(
                    line(
                        accountIds.sales,
                        swap("credit"),
                        scaledSales,
                        corporateTxnId
                    )
                );
            pushGstLines(
                lineItems,
                outputGstIds,
                scaledPrincipalGST,
                salesIsInterState,
                swap("credit"),
                corporateTxnId
            );
        } else if (scaledPrincipal > 0) {
            lineItems.push(
                line(
                    accountIds.vendorPayableTemporary,
                    swap("credit"),
                    scaledPrincipal,
                    corporateTxnId
                )
            );
        }
        if (scaledCommission > 0)
            lineItems.push(
                line(
                    accountIds.commission,
                    swap("credit"),
                    scaledCommission,
                    corporateTxnId
                )
            );
        pushGstLines(
            lineItems,
            outputGstIds,
            scaledOutputGST,
            commissionIsInterState,
            swap("credit"),
            corporateTxnId
        );
        if (scaledVendorPayable > 0)
            lineItems.push(
                line(
                    accountIds.vendorPayable,
                    swap("credit"),
                    scaledVendorPayable,
                    corporateTxnId
                )
            );
    } else {
        // Subscription
        if (
            netSubscriptionIncome > 0 &&
            accountIds.subscriptionFees &&
            hasOutputGstIds
        ) {
            lineItems.push(
                line(
                    accountIds.subscriptionFees,
                    "debit",
                    scale(netSubscriptionIncome),
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                scale(outputGSTonRevenue),
                platformFeeIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Sales — the principal-markup items.
        if (salesAmount > 0 && accountIds.sales && hasOutputGstIds) {
            lineItems.push(
                line(
                    accountIds.sales,
                    "debit",
                    scale(salesAmount),
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                scale(salesGst),
                salesIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Commission — independent of vendorPayable, matching buildTransactionLineItems.
        if (
            commissionIncludingGST > 0 &&
            accountIds.commission &&
            hasOutputGstIds
        ) {
            lineItems.push(
                line(
                    accountIds.commission,
                    "debit",
                    scale(commissionExcludingGST),
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                scale(outputGSTonCommission),
                commissionIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Platform Fees
        if (
            platformFeeIncludingGST > 0 &&
            accountIds.platformFees &&
            hasOutputGstIds
        ) {
            lineItems.push(
                line(
                    accountIds.platformFees,
                    "debit",
                    scale(platformFeeExcludingGST),
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                outputGstIds,
                scale(outputGSTonPlatformFee),
                platformFeeIsInterState,
                "debit",
                corporateTxnId
            );
        }

        // Vendor Payable
        if (vendorPayable > 0 && accountIds.vendorPayable) {
            lineItems.push(
                line(
                    accountIds.vendorPayable,
                    "debit",
                    scale(vendorPayable),
                    corporateTxnId
                )
            );
        }

        // Partnership
        if (
            partnerShipFee > 0 &&
            accountIds.partnershipFees &&
            accountIds.partnershipFeesPayable &&
            hasInputGstIds
        ) {
            lineItems.push(
                line(
                    accountIds.partnershipFees,
                    "credit",
                    scale(partnerShipFee),
                    corporateTxnId
                )
            );
            pushGstLines(
                lineItems,
                inputGstIds,
                scale(inputGSTonPartnerShipFee),
                partnerFeeIsInterState,
                "credit",
                corporateTxnId
            );
            lineItems.push(
                line(
                    accountIds.partnershipFeesPayable,
                    "debit",
                    scale(partnerPayable),
                    corporateTxnId
                )
            );
        }

        // Coupon Discount Expense (static name, safe to look up by name)
        if (couponTotalDiscount > 0) {
            const coa = await findAllByAccountNames([
                ACCOUNTS.couponDiscountExpense,
            ]);
            const couponAccount = coa.find(
                (a) => a.account_name === ACCOUNTS.couponDiscountExpense
            );
            if (couponAccount) {
                lineItems.push(
                    line(
                        couponAccount.provider_account_id,
                        "credit",
                        scale(couponTotalDiscount),
                        corporateTxnId
                    )
                );
            }
        }

        // Balance PG/wallet credit against whatever's left on the debit side, rather
        // than scaling each independently — avoids rounding mismatches on partial refunds.
        const totalDebits = amountPrecision(
            lineItems.reduce(
                (s, i) => s + (i.direction === "debit" ? Number(i.amount) : 0),
                0
            )
        );
        const totalExistingCredits = amountPrecision(
            lineItems.reduce(
                (s, i) => s + (i.direction === "credit" ? Number(i.amount) : 0),
                0
            )
        );
        const remainingCredit = amountPrecision(
            totalDebits - totalExistingCredits
        );

        if (
            paymentThroughGateway > 0 &&
            paymentThroughWallet > 0 &&
            accountIds.paymentGateway &&
            accountIds.walletAccount
        ) {
            const gatewayCredit = scale(paymentThroughGateway);
            const walletCredit = amountPrecision(
                remainingCredit - gatewayCredit
            );
            lineItems.push(
                line(
                    accountIds.paymentGateway,
                    "credit",
                    gatewayCredit,
                    corporateTxnId
                )
            );
            lineItems.push(
                line(
                    accountIds.walletAccount,
                    "credit",
                    walletCredit,
                    corporateTxnId
                )
            );
        } else if (paymentThroughGateway > 0 && accountIds.paymentGateway) {
            lineItems.push(
                line(
                    accountIds.paymentGateway,
                    "credit",
                    remainingCredit,
                    corporateTxnId
                )
            );
        } else if (paymentThroughWallet > 0 && accountIds.walletAccount) {
            lineItems.push(
                line(
                    accountIds.walletAccount,
                    "credit",
                    remainingCredit,
                    corporateTxnId
                )
            );
        }
    }

    if (lineItems.length === 0) {
        return { ok: false, reason: "No line items to post" };
    }

    const { balanced, reason: balanceReason } = await applyRoundingAdjustment(
        lineItems,
        corporateTxnId
    );
    if (!balanced) {
        return { ok: false, reason: balanceReason || "Journal is not balanced" };
    }

    return { ok: true, lineItems, journalAccountIds: accountIds };
};

// Wallet transfer journal: Subscribers Wallet <-> Cashback Expense.
// direction "credit" = admin credited the corporate (wallet goes up, expense goes up)
// direction "debit"  = admin debited the corporate  (wallet goes down, expense goes down)
const buildWalletTransferLineItems = async ({ corporateTxnId, credentialId, amount, direction }) => {
    if (!(Number(amount) > 0)) {
        return { ok: false, reason: "Amount must be greater than zero" };
    }
    if (await isInternalAccount(credentialId)) {
        return { ok: false, reason: "Wallet transfer journal skipped for internal account" };
    }
    const walletAccount = await findGenericAccountByName(ACCOUNTS.subscribersWallet, [
        "account_name",
        "provider_account_id",
    ]);
    const coa = await findAllByAccountNames([ACCOUNTS.cashbackExpense]);
    const cashbackExpense = coa.find((a) => a.account_name === ACCOUNTS.cashbackExpense);

    if (!walletAccount || !cashbackExpense) {
        return { ok: false, reason: "No COA accounts found for Subscribers Wallet or Cashback Expense" };
    }

    const lineItems = [
        line(walletAccount.provider_account_id, direction, amount, corporateTxnId),
        line(cashbackExpense.provider_account_id, direction === "credit" ? "debit" : "credit", amount, corporateTxnId),
    ];

    const { balanced, reason: balanceReason } = await applyRoundingAdjustment(lineItems, corporateTxnId);
    if (!balanced) return { ok: false, reason: balanceReason || "Line items are not balanced" };

    return {
        ok: true,
        lineItems,
        journalAccountIds: {
            walletAccount: walletAccount.provider_account_id,
            cashbackExpense: cashbackExpense.provider_account_id,
        },
        journalAccountNames: {
            [walletAccount.provider_account_id]: ACCOUNTS.subscribersWallet,
            [cashbackExpense.provider_account_id]: ACCOUNTS.cashbackExpense,
        },
    };
};

module.exports = {
    buildTransactionLineItems,
    buildRefundLineItems,
    buildCashbackLineItems,
    buildCashbackReversalLineItems,
    buildAdminRefundLineItems,
    buildWalletTransferLineItems,
    applyRoundingAdjustment,
    ACCOUNTS,
};
