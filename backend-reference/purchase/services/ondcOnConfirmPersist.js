/**
 * Persist ondc_orders from BPP on_confirm (PG-direct /confirm path) and
 * kick Easy Split. ACK stays in the webhook — this runs fire-and-forget.
 */

const { Op } = require("sequelize");
const paymentGatewayOrders = require("../models/entities/paymentGatewayOrders");
const Carts = require("../models/entities/cart");
const ondcOrders = require("../models/entities/ondc_order");
const {
  createOndcOrder,
  updateOndcOrderPaymentTotals,
  findOndcOrdersByPaymentRef,
} = require("../models/use-cases/ondc_order");
const { findOneOrder } = require("../models/use-cases/order");
const { findOndcSeller } = require("../models/use-cases/ondc_seller");
const { customLog } = require("../utils/loggerHelper");
const {
  parseIsoDurationMs,
  parseOndcAmount,
  resolveBuyerPayment,
  stampBuyerFinderFee,
  sumQuoteItemsTotal,
} = require("../utils/ondc_helper");
const {
  registerCheckout,
  recordOnConfirmAndMaybeSplit,
} = require("./ondcEasySplitAfterConfirm");
const {
  maybeNotifyOndcCheckoutAndClearCart,
} = require("./ondcCheckoutNotify");
const { findCheckoutConfirmSummary } = require("../models/use-cases/ondc_checkout_confirm");

const FLOW = "ondcPgDirectConfirm";

/**
 * Cashfree paymentRefId for one ONDC seller session (context.transaction_id).
 * Looks up paymentGatewayOrders.paymentData.ondcGroups — do not trust the BPP's
 * payment.params.transaction_id echo (sellers often overwrite it).
 */
const findPaymentRefByOndcTransactionId = async (transactionId) => {
  if (!transactionId) return null;
  const needle = String(transactionId);
  const candidates = await paymentGatewayOrders.findAll({
    where: {
      // Escape LIKE wildcards so a transaction_id of "%" cannot widen the scan
      paymentData: { [Op.like]: `%${needle.replace(/[\\%_]/g, "\\$&")}%` },
    },
    order: [["id", "DESC"]],
    limit: 25,
    attributes: ["paymentRefId", "paymentData"],
    raw: true,
  });

  for (const row of candidates) {
    let paymentData;
    try {
      paymentData =
        typeof row.paymentData === "string"
          ? JSON.parse(row.paymentData)
          : row.paymentData;
    } catch (_) {
      continue;
    }
    const groups = Array.isArray(paymentData?.ondcGroups)
      ? paymentData.ondcGroups
      : [];
    const hit = groups.some(
      (g) => g?.transactionId != null && String(g.transactionId) === needle
    );
    if (hit && row.paymentRefId != null) {
      return String(row.paymentRefId);
    }
  }
  return null;
};

/**
 * Prefer PG lookup by ONDC transactionId; fall back to BPP echo only when that
 * echo actually maps to a paymentGatewayOrders row.
 */
const resolveCashfreePaymentRef = async ({
  transactionId,
  order,
  logTraceId,
} = {}) => {
  const bppEcho =
    order?.payment?.params?.transaction_id ||
    order?.payment?.params?.transactionId ||
    null;
  const fromPg = await findPaymentRefByOndcTransactionId(transactionId);

  let paymentRef = null;
  if (fromPg) {
    if (bppEcho && String(bppEcho) !== String(fromPg)) {
      customLog(
        logTraceId,
        "warn",
        {
          flow: FLOW,
          step: "resolve-payment-ref",
          message:
            "BPP payment.params.transaction_id differs from Cashfree paymentRef — using PG lookup",
          transactionId,
          bppEcho: String(bppEcho),
          paymentRef: String(fromPg),
          fromPg: String(fromPg),
        },
        "VENDOR"
      );
    }
    paymentRef = String(fromPg);
  } else if (bppEcho) {
    const ctx = await loadPaymentContext(bppEcho);
    if (ctx.paymentData) {
      paymentRef = String(bppEcho);
    } else {
      customLog(
        logTraceId,
        "warn",
        {
          flow: FLOW,
          step: "resolve-payment-ref",
          message:
            "BPP payment echo has no matching paymentGatewayOrders row",
          transactionId,
          bppEcho: String(bppEcho),
          fromPg: null,
          paymentRef: null,
        },
        "VENDOR"
      );
    }
  }

  customLog(
    logTraceId,
    paymentRef ? "info" : "error",
    {
      flow: FLOW,
      step: "resolve-payment-ref",
      message: paymentRef
        ? "Resolved Cashfree paymentRef for on_confirm"
        : "Could not resolve Cashfree paymentRef",
      transactionId,
      bppEcho: bppEcho ? String(bppEcho) : null,
      fromPg: fromPg ? String(fromPg) : null,
      paymentRef,
    },
    "VENDOR"
  );

  return paymentRef;
};

const computeExpectedDelivery = (order) => {
  const tats = (order.fulfillments || [])
    .map((f) => f["@ondc/org/TAT"])
    .filter(Boolean);
  if (!tats.length) return { deliveryTat: null, expectedDeliveryDate: null };
  const ms = tats.map(parseIsoDurationMs).filter((v) => v !== null);
  if (!ms.length) return { deliveryTat: tats[0], expectedDeliveryDate: null };
  const maxMs = Math.max(...ms);
  const base = new Date(order.updated_at || order.created_at || Date.now());
  return {
    deliveryTat: tats[ms.indexOf(maxMs)] || tats[0],
    expectedDeliveryDate: new Date(base.getTime() + maxMs),
  };
};

/** Same enrichment as confirmOndcOrder mapQuote — seller titles need cart productName. */
const mapQuote = (quote, cartItems) => {
  const breakup = quote?.breakup || [];
  const byOndcId = new Map((cartItems || []).map((c) => [c.ondcProductId, c]));
  const quoteItems = breakup
    .filter((b) => b["@ondc/org/title_type"] === "item")
    .map((b) => ({
      itemId: b["@ondc/org/item_id"],
      title: b.title,
      quantity: parseInt(b["@ondc/org/item_quantity"]?.count, 10) || null,
      amount: parseOndcAmount(b.price?.value),
    }));
  const deliveryCharge = breakup
    .filter((b) => b["@ondc/org/title_type"] === "delivery")
    .reduce((sum, b) => sum + parseOndcAmount(b.price?.value), 0);
  const otherCharges = breakup
    .filter((b) => !["item", "delivery"].includes(b["@ondc/org/title_type"]))
    .map((b) => ({
      title: b.title,
      type: b["@ondc/org/title_type"],
      amount: parseOndcAmount(b.price?.value),
    }));
  const rows = breakup.map((b) => {
    const cartItem = byOndcId.get(b["@ondc/org/item_id"]);
    return {
      itemId: b["@ondc/org/item_id"] || null,
      titleType: b["@ondc/org/title_type"] || null,
      title: b.title || "",
      productName: cartItem?.productName || null,
      returnable: cartItem?.returnable ?? null,
      cancellable: cartItem?.cancellable ?? null,
      returnWindow: cartItem?.returnWindow || null,
      quantity: parseInt(b["@ondc/org/item_quantity"]?.count, 10) || null,
      amount: parseOndcAmount(b.price?.value),
      currency: b.price?.currency || "INR",
    };
  });

  return {
    total: parseOndcAmount(quote?.price?.value),
    currency: quote?.price?.currency || "INR",
    items: quoteItems,
    // Item value excluding delivery/tax/packing — the buyer finder fee's base.
    // null when the seller sent no item rows; see sumQuoteItemsTotal.
    itemsTotal: sumQuoteItemsTotal(quote),
    deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
    otherCharges,
    rows,
    ttl: quote?.ttl || null,
  };
};

const loadPaymentContext = async (paymentRef) => {
  const empty = {
    corporateUserId: null,
    subCorporateId: null,
    ondcGroupCount: 0,
    ondcGroups: [],
    cartId: null,
    amount: null,
    pgAmount: null,
    paymentData: null,
  };
  if (!paymentRef) return empty;

  const pgOrder = await paymentGatewayOrders.findOne({
    where: { paymentRefId: String(paymentRef) },
    raw: true,
  });
  if (!pgOrder?.paymentData) return empty;

  let paymentData = {};
  try {
    paymentData =
      typeof pgOrder.paymentData === "string"
        ? JSON.parse(pgOrder.paymentData)
        : pgOrder.paymentData;
  } catch (_) {
    return empty;
  }

  const groups = Array.isArray(paymentData.ondcGroups) ? paymentData.ondcGroups : [];
  const isSub =
    paymentData.role === "CORPORATE_SUB_USER" && paymentData.subCorporateId;
  return {
    corporateUserId: isSub ? null : paymentData.corporateId || null,
    subCorporateId: isSub ? paymentData.subCorporateId : null,
    ondcGroupCount: groups.length,
    ondcGroups: groups,
    cartId: paymentData.cartId || null,
    amount: paymentData.amount != null ? parseFloat(paymentData.amount) : null,
    pgAmount: paymentData.pgAmount != null ? parseFloat(paymentData.pgAmount) : null,
    paymentData,
  };
};

const loadCartItemsForSeller = async ({ cartId, providerId, bppId, transactionId }) => {
  if (!cartId) return [];
  const cart = await Carts.findOne({
    where: { id: cartId },
    attributes: ["productDetails"],
    raw: true,
  });
  if (!cart?.productDetails) return [];

  let all = [];
  try {
    all = JSON.parse(cart.productDetails || "[]");
  } catch (_) {
    return [];
  }

  const office = (all || []).filter((p) => p && p.source === "OFFICE_SUPPLIES");
  const forSeller = office.filter((p) => {
    if (transactionId && p.transactionId && String(p.transactionId) === String(transactionId)) {
      return true;
    }
    const vendorOk =
      providerId != null &&
      p.ondcVendorId != null &&
      String(p.ondcVendorId) === String(providerId);
    const bppOk = !bppId || !p.bppId || String(p.bppId) === String(bppId);
    return vendorOk && bppOk;
  });

  return forSeller.map((i) => ({
    productId: i.productId,
    ondcProductId: i.ondcProductId,
    productName: i.productName || null,
    productQuantity: parseInt(i.productQuantity, 10) || 1,
    returnable: i.returnable ?? null,
    cancellable: i.cancellable ?? null,
    returnWindow: i.returnWindow || null,
  }));
};

/**
 * Best available seller name for an order row, in descending trustworthiness:
 * the BPP's own descriptor, then the catalog name captured into the checkout
 * groups at /select, then the ondcSellers registry (written at /init, keyed on
 * the same bppId+providerId every order carries). Null when genuinely unknown —
 * an empty string reads as "we have a name and it is blank".
 *
 * The registry is only queried when the first two miss, so the common path
 * costs nothing extra.
 */
const resolveVendorName = async ({ order, ctx, transactionId, providerId, bppId }) => {
  const fromDescriptor = order?.provider?.descriptor?.name;
  if (fromDescriptor && fromDescriptor.trim()) return fromDescriptor.trim();

  const groups = Array.isArray(ctx?.ondcGroups) ? ctx.ondcGroups : [];
  const group =
    groups.find((g) => transactionId && String(g?.transactionId) === String(transactionId)) ||
    groups.find((g) => providerId && String(g?.providerId) === String(providerId));
  if (group?.vendorName && String(group.vendorName).trim()) {
    return String(group.vendorName).trim();
  }

  if (bppId && providerId) {
    try {
      const seller = await findOndcSeller({ bppId, providerId });
      if (seller?.vendorName && String(seller.vendorName).trim()) {
        return String(seller.vendorName).trim();
      }
    } catch (_) {
      // Registry lookup is best-effort — never fail an order write over a label.
    }
  }

  return null;
};

const resolvePlatformFeeTotal = async (paymentRef, ctx, logTraceId) => {
  try {
    const paymentOrder = await findOneOrder({ corporateTxnId: String(paymentRef) });
    const fromTxn = parseFloat(paymentOrder?.surcharge);
    if (fromTxn > 0) return fromTxn;
  } catch (err) {
    customLog(
      logTraceId,
      "error",
      {
        flow: FLOW,
        message: "on_confirm: could not read payment txn surcharge",
        paymentRef,
        error: err?.message || String(err),
      },
      "VENDOR"
    );
  }
  if (ctx.pgAmount != null && ctx.amount != null) {
    const diff = parseFloat((ctx.pgAmount - ctx.amount).toFixed(2));
    if (diff > 0) return diff;
  }
  return 0;
};

/**
 * Allocate platform fee across all ondc_orders for this paymentRef
 * (proportional by totalAmount; last row absorbs rounding when all expected sellers are in).
 *
 * Confirm-after-payment checkouts (services/ondcConfirmAfterPayment.js) apportion it
 * over EVERY seller the buyer paid for, weighted by the on_init quote, not only the
 * rows confirmed so far: a seller that failed takes its share of the fee back in
 * the checkout's refund, so that share must not also land on a confirmed row's
 * amountPaid (the admin refund cap).
 */
const stampPlatformFeesForCheckout = async ({
  paymentRef,
  expectedCount,
  platformFeeTotal,
  corporateUserId,
  subCorporateId,
  logTraceId,
}) => {
  if (!paymentRef || !(platformFeeTotal > 0)) {
    const rows =
      (await findOndcOrdersByPaymentRef({
        paymentRef,
        corporateUserId,
        subCorporateUserId: subCorporateId,
      })) || [];
    for (const row of rows) {
      const sellerTotal = parseFloat(row.totalAmount) || 0;
      // eslint-disable-next-line no-await-in-loop
      await updateOndcOrderPaymentTotals({
        transactionId: row.transactionId,
        platformFee: 0,
        amountPaid: sellerTotal,
      });
    }
    return;
  }

  const rows =
    (await findOndcOrdersByPaymentRef({
      paymentRef,
      corporateUserId,
      subCorporateUserId: subCorporateId,
    })) || [];
  if (!rows.length) return;

  const confirmedTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.totalAmount) || 0),
    0
  );

  let attempts = [];
  try {
    attempts = (await findCheckoutConfirmSummary(paymentRef))?.attempts || [];
  } catch (summaryErr) {
    customLog(
      logTraceId,
      "error",
      {
        flow: FLOW,
        message: "on_confirm: could not read confirm attempts — allocating the fee over confirmed rows",
        paymentRef,
        error: summaryErr?.message || String(summaryErr),
      },
      "VENDOR"
    );
  }
  const quoteByTxn = new Map(
    attempts.map((a) => [String(a.transactionId), Number(a.quoteAmount) || 0])
  );
  const attemptTotal = attempts.reduce((sum, a) => sum + (Number(a.quoteAmount) || 0), 0);
  const byAttempts = attempts.length > 0 && attemptTotal > 0;
  const denominator = byAttempts ? attemptTotal : confirmedTotal;
  const allIn = byAttempts
    ? attempts.every((a) => a.status === "CONFIRMED") && rows.length >= attempts.length
    : expectedCount > 0 && rows.length >= expectedCount;
  let allocated = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const sellerTotal = parseFloat(rows[i].totalAmount) || 0;
    const weight = byAttempts
      ? quoteByTxn.get(String(rows[i].transactionId)) ?? sellerTotal
      : sellerTotal;
    let share = 0;
    if (allIn && i === rows.length - 1) {
      share = parseFloat((platformFeeTotal - allocated).toFixed(2));
    } else if (denominator > 0) {
      share = parseFloat(
        ((platformFeeTotal * weight) / denominator).toFixed(2)
      );
      allocated += share;
    }
    // eslint-disable-next-line no-await-in-loop
    await updateOndcOrderPaymentTotals({
      transactionId: rows[i].transactionId,
      platformFee: share,
      amountPaid: parseFloat((sellerTotal + share).toFixed(2)),
    });
  }

  customLog(
    logTraceId,
    "info",
    {
      flow: FLOW,
      message: "on_confirm: stamped platformFee/amountPaid on ondc_orders",
      paymentRef,
      platformFeeTotal,
      orderCount: rows.length,
      expectedCount,
      allIn,
      allocation: byAttempts ? "all-sellers" : "confirmed-rows",
    },
    "VENDOR"
  );
};

/**
 * Patch paymentRef / buyer on an existing row when the first write used junk/null.
 */
const healExistingOrderLinkage = async ({
  transactionId,
  paymentRef,
  ctx,
  logTraceId,
}) => {
  const existing = await ondcOrders.findOne({
    where: { transactionId: String(transactionId) },
    attributes: ["id", "paymentRef", "corporateUserId", "subCorporateUserId"],
    raw: true,
  });
  if (!existing) return null;

  const patch = {};
  if (paymentRef && String(existing.paymentRef || "") !== String(paymentRef)) {
    patch.paymentRef = String(paymentRef);
  }
  if (ctx.corporateUserId && !existing.corporateUserId) {
    patch.corporateUserId = ctx.corporateUserId;
  }
  if (ctx.subCorporateId && !existing.subCorporateUserId) {
    patch.subCorporateUserId = ctx.subCorporateId;
  }

  if (Object.keys(patch).length) {
    await ondcOrders.update(patch, {
      where: { transactionId: String(transactionId) },
    });
    customLog(
      logTraceId,
      "info",
      {
        flow: FLOW,
        step: "persist-exists-healed",
        message: "Healed existing ondc_orders paymentRef/buyer linkage",
        transactionId,
        paymentRef,
        patch,
        previousPaymentRef: existing.paymentRef || null,
      },
      "VENDOR"
    );
  }

  return existing;
};

/**
 * Persist confirmed order (idempotent) + Easy Split coordination.
 */
const persistAndSettleFromOnConfirm = async ({
  transactionId,
  order,
  error,
  context,
  logTraceId,
} = {}) => {
  const paymentRef = await resolveCashfreePaymentRef({
    transactionId,
    order,
    logTraceId,
  });
  const bppId = context?.bpp_id || null;
  const bppUri = context?.bpp_uri || null;
  const domain = context?.domain || null;
  const city = context?.city || null;
  const providerId = order?.provider?.id || null;
  const quoteTotal = parseOndcAmount(order?.quote?.price?.value);
  // Derived here, outside both the persist and heal branches, so the split
  // coordinator gets the finder fee's base on every path. If only one branch
  // carried it, the same order could settle at a different fee depending on
  // which path reached the split first.
  const quoteItemsTotal = sumQuoteItemsTotal(order?.quote);

  const ctx = await loadPaymentContext(paymentRef);

  // `provider.descriptor` is OPTIONAL in on_confirm — plenty of BPPs echo
  // `provider: { id, locations }` only — so relying on it alone left the seller
  // name blank on those orders while providerId (ONDC-required) survived. Fall
  // back to the catalog name we already captured at checkout, then the seller
  // registry. Never store providerId as the name: an id is not a name, and the
  // read side renders "-" when it is genuinely unknown.
  const vendorName = await resolveVendorName({
    order,
    ctx,
    transactionId,
    providerId,
    bppId,
  });
  if (paymentRef && ctx.ondcGroupCount > 0) {
    registerCheckout(paymentRef, ctx.ondcGroupCount, logTraceId);
  }

  if (
    paymentRef &&
    !ctx.corporateUserId &&
    !ctx.subCorporateId
  ) {
    customLog(
      logTraceId,
      "warn",
      {
        flow: FLOW,
        step: "buyer-context-empty",
        message:
          "Payment context has no buyer ids — order may be orphan until checkout-result heal",
        paymentRef,
        transactionId,
      },
      "VENDOR"
    );
  }

  // Success path only — do not write a row on NACK / missing order.
  if (error || !order || !transactionId) {
    const reason = error
      ? "bpp_error"
      : !order
        ? "no_order"
        : "no_transactionId";
    customLog(
      logTraceId,
      "warn",
      {
        flow: FLOW,
        step: "persist-skipped",
        message: "Skipping ondc_orders persist",
        reason,
        transactionId: transactionId || null,
        paymentRef,
        hasError: Boolean(error),
        hasOrder: Boolean(order),
      },
      "VENDOR"
    );
  } else if (!paymentRef) {
    customLog(
      logTraceId,
      "error",
      {
        flow: FLOW,
        step: "persist-blocked-no-payment-ref",
        message:
          "Refusing to persist ondc_orders without Cashfree paymentRef (would poison checkout-result)",
        transactionId,
        orderId: order?.id || null,
      },
      "VENDOR"
    );
  } else {
    const existing = await healExistingOrderLinkage({
      transactionId,
      paymentRef,
      ctx,
      logTraceId,
    });

    if (!existing) {
      try {
        const cartItems = await loadCartItemsForSeller({
          cartId: ctx.cartId,
          providerId,
          bppId,
          transactionId,
        });
        const quote = mapQuote(order.quote, cartItems);
        const { deliveryTat, expectedDeliveryDate } = computeExpectedDelivery(order);
        const payment = order.payment || {};
        const settlement = payment["@ondc/org/settlement_details"]?.[0] || {};

        const platformFeeTotal = await resolvePlatformFeeTotal(
          paymentRef,
          ctx,
          logTraceId
        );
        const expectedSellerTotal = (ctx.ondcGroups || []).reduce(
          (sum, g) => sum + (parseFloat(g.amount) || 0),
          0
        );
        const feeShare =
          platformFeeTotal > 0 && expectedSellerTotal > 0
            ? parseFloat(
                ((platformFeeTotal * quote.total) / expectedSellerTotal).toFixed(2)
              )
            : platformFeeTotal > 0 && ctx.ondcGroupCount <= 1
              ? platformFeeTotal
              : 0;

        await createOndcOrder({
          transactionId,
          orderId: order.id || null,
          orderState: order.state || null,
          corporateUserId: ctx.corporateUserId || null,
          subCorporateUserId: ctx.subCorporateId || null,
          bppId,
          bppUri,
          providerId,
          vendorName: vendorName || null,
          domain,
          city,
          deliveryTat,
          expectedDeliveryDate,
          totalAmount: quote.total,
          currency: quote.currency,
          platformFee: feeShare,
          amountPaid: parseFloat((quote.total + feeShare).toFixed(2)),
          ...resolveBuyerPayment(payment, paymentRef),
          settlementBasis: payment["@ondc/org/settlement_basis"] || null,
          settlementWindow: payment["@ondc/org/settlement_window"] || null,
          withholdingAmount: payment["@ondc/org/withholding_amount"] || null,
          settlementType: settlement.settlement_type || null,
          upiAddress: settlement.upi_address || null,
          settlementBankAccountNo: settlement.settlement_bank_account_no || null,
          settlementIfscCode: settlement.settlement_ifsc_code || null,
          beneficiaryName: settlement.beneficiary_name || null,
          bankName: settlement.bank_name || null,
          branchName: settlement.branch_name || null,
          items: stampBuyerFinderFee(
            cartItems.length
              ? cartItems
              : (order.items || []).map((item) => ({
                  ondcProductId: item.id || null,
                  productName: item.descriptor?.name || null,
                  productQuantity: parseInt(item.quantity?.count, 10) || 1,
                })),
            payment
          ),
          quote,
          cancellationTerms: order.cancellation_terms || null,
          billing: order.billing || null,
          fulfillments: order.fulfillments || null,
          payment: order.payment || null,
        });

        customLog(
          logTraceId,
          "info",
          {
            flow: FLOW,
            step: "persist-created",
            message: "on_confirm: persisted ondc_orders (PG-direct confirm)",
            transactionId,
            paymentRef,
            orderId: order.id || null,
            cartItemCount: cartItems.length,
            corporateUserId: ctx.corporateUserId || null,
            subCorporateId: ctx.subCorporateId || null,
          },
          "VENDOR"
        );
      } catch (persistErr) {
        customLog(
          logTraceId,
          "error",
          {
            flow: FLOW,
            step: "persist-failed",
            message:
              "on_confirm: failed to persist ondc_orders — needs reconciliation",
            transactionId,
            paymentRef,
            orderId: order?.id || null,
            error: persistErr?.message || String(persistErr),
          },
          "VENDOR"
        );
      }
    }

    try {
      const platformFeeTotal = await resolvePlatformFeeTotal(
        paymentRef,
        ctx,
        logTraceId
      );
      await stampPlatformFeesForCheckout({
        paymentRef,
        expectedCount: ctx.ondcGroupCount,
        platformFeeTotal,
        corporateUserId: ctx.corporateUserId,
        subCorporateId: ctx.subCorporateId,
        logTraceId,
      });
    } catch (feeErr) {
      customLog(
        logTraceId,
        "error",
        {
          flow: FLOW,
          message: "on_confirm: platform fee stamp failed",
          paymentRef,
          transactionId,
          error: feeErr?.message || String(feeErr),
        },
        "VENDOR"
      );
    }

    // Fire-and-forget: never block Easy Split / persist on mail/cart.
    maybeNotifyOndcCheckoutAndClearCart({
      paymentRef,
      ctx,
      logTraceId,
    }).catch(() => {});
  }

  if (paymentRef && transactionId) {
    await recordOnConfirmAndMaybeSplit({
      paymentRef,
      transactionId,
      bppId,
      providerId,
      vendorName,
      orderId: order?.id || null,
      quoteTotal,
      quoteItemsTotal,
      error: error || null,
      logTraceId,
    });
  }
};

module.exports = {
  persistAndSettleFromOnConfirm,
  findPaymentRefByOndcTransactionId,
  resolveCashfreePaymentRef,
  loadPaymentContext,
};
