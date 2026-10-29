/**
 * Coordinates Easy Split after ONDC on_confirm callbacks.
 *
 * Per seller on_confirm: ensure Cashfree Easy Split vendor exists.
 * Once all expected sellers for a paymentRef have reported (success or error),
 * write ONE split rule with disable_split:true for the successful ones.
 *
 * Also exposed as finalizeEasySplit(paymentRef, confirmedGroups) so
 * confirmOndcOrder can settle after timeouts / partial confirms.
 *
 * Writing the split does NOT pay the seller yet: each is immediately parked with a
 * far-out settlement-eligibility date (parkSplitPayouts) so the money stays in Peko's
 * balance until the return window closes. See services/ondcPayoutHold.js.
 *
 * Never throws to callers — order placement must not depend on settlement.
 */

const { customLog } = require("../utils/loggerHelper");
const {
  isEasySplitEnabled,
  getEasySplitSettings,
  resolveConfig: resolveEasySplitConfig,
  ensureEasySplitVendor,
  splitOrder,
} = require("../utils/easySplit");
const {
  findOndcSellersByKeys,
  updateOndcSellerVendor,
} = require("../models/use-cases/ondc_seller");
const {
  updateOndcOrderSplit,
  holdOndcOrderPayout,
  markOndcOrderPayoutNotApplicable,
} = require("../models/use-cases/ondc_order");
const { resolveGatewayOrderId, parkPayoutHold } = require("./ondcPayoutHold");
const { computeBuyerFinderFee } = require("../utils/buyerFinderFee");
const { getOndcConfig } = require("./ondc");

/** paymentRef -> checkout state */
const checkouts = new Map();

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", flow: "ondcEasySplitAfterConfirm", ...data }, "VENDOR");

const getOrCreate = (paymentRef) => {
  const key = String(paymentRef);
  if (!checkouts.has(key)) {
    checkouts.set(key, {
      expected: null,
      received: new Map(), // transactionId -> { ok, group-ish }
      splits: [],
      skipped: [],
      finalized: false,
      writing: null,
      logTraceId: null,
    });
  }
  return checkouts.get(key);
};

/**
 * Call at the start of confirm so we know how many on_confirm callbacks to expect.
 */
const registerCheckout = (paymentRef, expectedCount, logTraceId) => {
  if (!paymentRef) return;
  const state = getOrCreate(paymentRef);
  state.expected = Number(expectedCount) || 0;
  state.logTraceId = logTraceId || state.logTraceId;
  log(logTraceId, "info", {
    step: "register-checkout",
    message: "Easy Split coordinator: registered expected seller count",
    paymentRef: String(paymentRef),
    expected: state.expected,
  });
};

/**
 * The finder fee to withhold from one seller's allocation.
 *
 * Charged on item value only, using the fee WE declared (the vendor config that
 * fed /init), not the seller's echo. Returns 0 whenever it cannot be charged
 * safely — the split is written once with `disable_split:true`, so an amount
 * that is wrong here is only fixable by manual Cashfree reconciliation.
 */
const resolveFinderFeeDeduction = async (group, gross, logTraceId, paymentRef) => {
  // Rate AND on/off both live on the ONDC vendor row, so the whole feature is
  // configured in one place. Read before anything else: while it is off this
  // must behave exactly as it did before the feature existed, including staying
  // silent about quotes it would otherwise complain about.
  const cfg = await getOndcConfig();
  if (!cfg.buyerFinderFeeDeductionEnabled) return 0;

  const itemsTotal = group.quote?.itemsTotal ?? null;
  if (itemsTotal === null || itemsTotal === undefined) {
    // The seller's breakup carried no item rows, so the fee base is unknown.
    // Charging on quote.total instead would silently tax their delivery and
    // taxes, which is not the agreed base — withhold nothing and say so.
    log(logTraceId, "error", {
      step: "finder-fee",
      message: "No item rows in the seller quote — finder fee not deducted",
      paymentRef,
      transactionId: group.transactionId,
      gross,
    });
    return 0;
  }

  const fee = computeBuyerFinderFee({
    itemsTotal,
    feeType: cfg.buyerFinderFeeType,
    feeAmount: cfg.buyerFinderFeeAmount,
  });
  if (!(fee > 0)) return 0;

  // Must not drive the allocation to zero — that would trip the zero_amount skip
  // below and strand the seller's whole payout over our own fee.
  if (!(gross - fee > 0)) {
    log(logTraceId, "error", {
      step: "finder-fee",
      message: "Finder fee would consume the seller's entire allocation — not deducted",
      paymentRef,
      transactionId: group.transactionId,
      gross,
      itemsTotal,
      fee,
    });
    return 0;
  }

  log(logTraceId, "info", {
    step: "finder-fee",
    message: "Withholding buyer finder fee from the seller allocation",
    paymentRef,
    transactionId: group.transactionId,
    gross,
    itemsTotal,
    feeType: cfg.buyerFinderFeeType,
    feeRate: cfg.buyerFinderFeeAmount,
    fee,
  });
  return fee;
};

const ensureVendorAndBuildEntry = async (group, settings, config, logTraceId, paymentRef) => {
  const gross = parseFloat((group.quote?.total ?? group.amount ?? 0).toFixed(2));
  const finderFee = await resolveFinderFeeDeduction(group, gross, logTraceId, paymentRef);
  // What Cashfree actually allocates. `splitAmount` is stamped from this same
  // number and doubles as the refund cap — if the two ever diverged, a full
  // refund would ask Cashfree to debit the vendor more than they hold and the
  // buyer would not be refunded at all. Keep them the same value.
  const amount = parseFloat((gross - finderFee).toFixed(2));
  const label = group.vendorName || group.providerId || group.bppId || "seller";
  const sellers = await findOndcSellersByKeys([
    { bppId: group.bppId, providerId: group.providerId },
  ]);
  const seller = sellers.get(`${group.bppId}|${group.providerId}`);

  if (!seller) {
    log(logTraceId, "error", {
      step: "seller-lookup",
      message: "No ondcSellers row — cannot create Easy Split vendor",
      paymentRef,
      bppId: group.bppId,
      providerId: group.providerId,
      transactionId: group.transactionId,
      amount,
    });
    return { skipped: { group, label, reason: "seller_not_captured" } };
  }
  if (!(amount > 0)) {
    return { skipped: { group, label, reason: "zero_amount" } };
  }

  const vendor = await ensureEasySplitVendor(seller, {
    settings,
    config,
    logTraceId,
    persist: updateOndcSellerVendor,
  });
  if (vendor.error) {
    return {
      skipped: {
        group,
        label,
        reason: vendor.error,
        detail: vendor.message,
      },
    };
  }

  // ensureEasySplitVendor now confirms existence against Cashfree rather than trusting
  // our own ACTIVE flag. Surfaced per order because the split is ONE request with
  // disable_split:true — a vendor Cashfree does not recognise fails the write for every
  // seller in the checkout, so this line is where to look when a whole split FAILED.
  log(logTraceId, "info", {
    step: "vendor-ready",
    message: vendor.confirmed === false
      ? "Vendor NOT confirmed with Cashfree (lookup was inconclusive) — splitting on the stored record"
      : "Vendor confirmed with Cashfree and ready to split",
    paymentRef,
    transactionId: group.transactionId,
    vendorId: vendor.vendorId,
    vendorStatus: vendor.vendorStatus ?? null,
    createdNow: Boolean(vendor.created),
    confirmed: vendor.confirmed !== false,
    amount,
  });

  return {
    split: {
      group,
      amount,
      gross,
      finderFee,
      entry: {
        vendor_id: vendor.vendorId,
        amount,
        tags: {
          transaction_id: String(group.transactionId || ""),
          provider_id: String(group.providerId || ""),
          ondc_order_id: String(group.orderId || ""),
        },
      },
    },
  };
};

const stampOrders = async (splits, skipped, splitResult, paymentRef, logTraceId) => {
  const stamp = async (transactionId, patch) => {
    try {
      await updateOndcOrderSplit({ transactionId, ...patch });
    } catch (stampErr) {
      log(logTraceId, "error", {
        step: "stamp-order",
        message: "Could not record split outcome on ondcOrders",
        paymentRef,
        transactionId,
        patch,
        error: stampErr?.message || stampErr,
      });
    }
  };

  for (const s of splits) {
    // eslint-disable-next-line no-await-in-loop
    await stamp(s.group.transactionId, {
      splitVendorId: s.entry.vendor_id,
      splitStatus: splitResult.status ? "SPLIT" : "FAILED",
      splitAmount: s.amount,
      // Recorded so a net splitAmount stays auditable — without these, rows
      // written before and after the deduction are indistinguishable.
      splitGrossAmount: s.gross ?? s.amount,
      buyerFinderFeeDeducted: s.finderFee ?? 0,
      splitError: splitResult.status ? null : splitResult.message || "split_failed",
    });
  }
  for (const s of skipped) {
    // eslint-disable-next-line no-await-in-loop
    await stamp(s.group.transactionId, {
      splitStatus: "SKIPPED",
      splitAmount: parseFloat((s.group.quote?.total || s.group.amount || 0).toFixed(2)),
      splitError: s.detail ? `${s.reason}: ${s.detail}` : s.reason,
    });
    // No vendor share was routed — nothing to hold. Marked explicitly rather than
    // left null so "nothing to pay" is distinguishable from "not yet decided".
    try {
      // eslint-disable-next-line no-await-in-loop
      await markOndcOrderPayoutNotApplicable({
        transactionId: s.group.transactionId,
        payoutError: s.reason || null,
      });
    } catch (naErr) {
      log(logTraceId, "error", {
        step: "stamp-order",
        message: "Could not mark payout NOT_APPLICABLE on a skipped split",
        paymentRef,
        transactionId: s.group.transactionId,
        error: naErr?.message || naErr,
      });
    }
  }
};

/**
 * Defer each newly-split seller's settlement to the far end of the allowed window.
 *
 * THE LOAD-BEARING STEP: once the split exists Cashfree settles on the vendor's
 * cycle (merchant default when schedule_option was omitted at create — T+21 on
 * our PG). That can still land before the goods have shipped. Parking buys the
 * time NARROW and RELEASE then spend precisely.
 *
 * A failed park leaves the split standing (seller paid early = pre-existing
 * behaviour) with the reason on the order row. Never throws — the split result must
 * not be lost because a follow-up call failed.
 */
const parkSplitPayouts = async (splits, gatewayOrderId, paymentRef, logTraceId, config, settings) => {
  for (const s of splits) {
    const vendorId = s.entry.vendor_id;
    let result = { status: false, reason: "not_attempted" };
    try {
      // eslint-disable-next-line no-await-in-loop
      result = await parkPayoutHold({
        paymentRef,
        transactionId: s.group.transactionId,
        gatewayOrderId,
        vendorId,
        amount: s.amount,
        // Reuse the config/settings this finalize already resolved rather than
        // re-reading the serviceOperator and settings rows once per vendor.
        config,
        settings,
        logTraceId,
      });
    } catch (parkErr) {
      result = { status: false, reason: "exception", message: parkErr?.message || String(parkErr) };
      log(logTraceId, "error", {
        step: "park-payout",
        message: "parkPayoutHold threw — the split stands but the seller may settle early",
        paymentRef,
        transactionId: s.group.transactionId,
        vendorId,
        error: parkErr?.message || String(parkErr),
      });
    }

    // Recorded whether or not the park succeeded: HELD is what the sweep looks
    // for, and payoutError is how an operator learns the hold is not really in
    // place. Keyed on transactionId, the same key stampOrders above uses.
    try {
      // eslint-disable-next-line no-await-in-loop
      await holdOndcOrderPayout({
        transactionId: s.group.transactionId,
        payoutEligibilityDate: result.status ? result.eligibilityDate || null : null,
        payoutError: result.status ? null : `park_failed: ${result.reason || "unknown"}`,
      });
    } catch (holdErr) {
      log(logTraceId, "error", {
        step: "park-payout",
        message: "Could not record the payout hold on ondcOrders",
        paymentRef,
        transactionId: s.group.transactionId,
        vendorId,
        error: holdErr?.message || holdErr,
      });
    }
  }
};

/**
 * Write the one-shot split rule if not already done.
 * `splits` / `skipped` are the full sets for this paymentRef.
 */
const writeSplitOnce = async (paymentRef, splits, skipped, logTraceId) => {
  const state = getOrCreate(paymentRef);
  if (state.finalized) {
    log(logTraceId, "info", {
      step: "finalize-skip",
      message: "Easy Split already finalized for this paymentRef",
      paymentRef,
    });
    return state.lastResult || { status: "ALREADY_DONE" };
  }
  if (state.writing) return state.writing;

  state.writing = (async () => {
    try {
      if (!(await isEasySplitEnabled(logTraceId))) {
        state.finalized = true;
        state.lastResult = { status: "DISABLED" };
        return state.lastResult;
      }

      const config = await resolveEasySplitConfig(logTraceId);
      if (config.error) {
        log(logTraceId, "error", {
          step: "finalize",
          message: "Aborting Easy Split — Cashfree config incomplete",
          paymentRef,
          error: config.error,
        });
        state.finalized = true;
        state.lastResult = { status: "FAILED", reason: "config", message: config.error };
        return state.lastResult;
      }

      const gatewayOrderId = await resolveGatewayOrderId(paymentRef, logTraceId);
      if (!gatewayOrderId) {
        state.finalized = true;
        state.lastResult = { status: "FAILED", reason: "no_gateway_order_id" };
        return state.lastResult;
      }

      let splitResult = { status: false, message: "no eligible vendors" };
      if (splits.length) {
        splitResult = await splitOrder(
          gatewayOrderId,
          splits.map((s) => s.entry),
          { disableSplit: true, logTraceId },
          config
        );
      }

      await stampOrders(splits, skipped, splitResult, paymentRef, logTraceId);

      // Only park what actually got split — a failed splitOrder means Cashfree
      // holds no vendor allocation to defer.
      if (splitResult.status && splits.length) {
        const tunables = await getEasySplitSettings(logTraceId);
        await parkSplitPayouts(splits, gatewayOrderId, paymentRef, logTraceId, config, tunables);
      }

      const result = {
        status: !splits.length
          ? "SKIPPED"
          : splitResult.status
            ? skipped.length
              ? "PARTIAL"
              : "SPLIT"
            : "FAILED",
        gatewayOrderId,
        splitCount: splits.length,
        splitTotal: parseFloat(splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
        skipped: skipped.map((s) => ({
          seller: s.label,
          providerId: s.group.providerId,
          amount: parseFloat((s.group.quote?.total || s.group.amount || 0).toFixed(2)),
          reason: s.reason,
          detail: s.detail || null,
        })),
        message: splitResult.message || null,
      };

      log(logTraceId, result.status === "FAILED" ? "error" : "info", {
        step: "finalize-done",
        message: "Easy Split finalize complete",
        paymentRef,
        ...result,
      });

      state.finalized = true;
      state.lastResult = result;
      return result;
    } catch (err) {
      log(logTraceId, "error", {
        step: "finalize-threw",
        message: "Easy Split finalize threw",
        paymentRef,
        error: err?.message || String(err),
        stack: err?.stack || null,
      });
      state.finalized = true;
      state.lastResult = { status: "FAILED", reason: "exception", message: err?.message };
      return state.lastResult;
    } finally {
      state.writing = null;
      // Drop state after a while to avoid unbounded growth
      setTimeout(() => checkouts.delete(String(paymentRef)), 10 * 60 * 1000);
    }
  })();

  return state.writing;
};

const maybeFinalizeFromCoordinator = async (paymentRef) => {
  const state = getOrCreate(paymentRef);
  if (state.finalized) return state.lastResult;
  if (state.expected == null) return null;
  if (state.received.size < state.expected) return null;

  const splits = [];
  const skipped = [];
  for (const entry of state.received.values()) {
    if (entry.split) splits.push(entry.split);
    if (entry.skipped) skipped.push(entry.skipped);
  }
  return writeSplitOnce(paymentRef, splits, skipped, state.logTraceId);
};

/**
 * Called from on_confirm webhook (fire-and-forget after ACK).
 * Creates the vendor for this seller and, when all expected callbacks are in,
 * writes the split rule.
 */
const recordOnConfirmAndMaybeSplit = async ({
  paymentRef,
  transactionId,
  bppId,
  providerId,
  vendorName,
  orderId,
  quoteTotal,
  // Item value the buyer finder fee is charged on. Threaded from the webhook so
  // this path computes the same fee as the finalizeEasySplit safety net, whose
  // groups carry a full mapped quote.
  quoteItemsTotal = null,
  error,
  logTraceId,
} = {}) => {
  if (!paymentRef || !transactionId) {
    log(logTraceId, "error", {
      step: "on-confirm-record",
      message: "Missing paymentRef or transactionId — cannot coordinate Easy Split",
      paymentRef: paymentRef || null,
      transactionId: transactionId || null,
    });
    return;
  }

  const state = getOrCreate(paymentRef);
  state.logTraceId = logTraceId || state.logTraceId;

  if (state.received.has(String(transactionId))) {
    return maybeFinalizeFromCoordinator(paymentRef);
  }

  if (error || !(quoteTotal > 0) || !bppId || !providerId) {
    state.received.set(String(transactionId), {
      skipped: {
        group: {
          transactionId,
          bppId,
          providerId,
          vendorName,
          orderId,
          quote: { total: quoteTotal || 0, itemsTotal: quoteItemsTotal },
        },
        label: vendorName || providerId || bppId || "seller",
        reason: error ? "on_confirm_error" : "incomplete_on_confirm",
      },
    });
    return maybeFinalizeFromCoordinator(paymentRef);
  }

  try {
    if (!(await isEasySplitEnabled(logTraceId))) {
      state.received.set(String(transactionId), {
        skipped: {
          group: { transactionId, bppId, providerId, vendorName, orderId, quote: { total: quoteTotal, itemsTotal: quoteItemsTotal } },
          label: vendorName || providerId || "seller",
          reason: "disabled",
        },
      });
      return maybeFinalizeFromCoordinator(paymentRef);
    }

    const config = await resolveEasySplitConfig(logTraceId);
    if (config.error) {
      state.received.set(String(transactionId), {
        skipped: {
          group: { transactionId, bppId, providerId, vendorName, orderId, quote: { total: quoteTotal, itemsTotal: quoteItemsTotal } },
          label: vendorName || providerId || "seller",
          reason: "config",
          detail: config.error,
        },
      });
      return maybeFinalizeFromCoordinator(paymentRef);
    }

    const settings = await getEasySplitSettings(logTraceId);
    const built = await ensureVendorAndBuildEntry(
      {
        transactionId,
        bppId,
        providerId,
        vendorName,
        orderId,
        quote: { total: quoteTotal, itemsTotal: quoteItemsTotal },
      },
      settings,
      config,
      logTraceId,
      paymentRef
    );

    state.received.set(String(transactionId), built);
    log(logTraceId, "info", {
      step: "on-confirm-record",
      message: built.split
        ? "Vendor ready for Easy Split after on_confirm"
        : "Seller skipped for Easy Split after on_confirm",
      paymentRef,
      transactionId,
      received: state.received.size,
      expected: state.expected,
      vendorId: built.split?.entry?.vendor_id || null,
      skipReason: built.skipped?.reason || null,
    });
  } catch (err) {
    log(logTraceId, "error", {
      step: "on-confirm-record",
      message: "recordOnConfirmAndMaybeSplit threw",
      paymentRef,
      transactionId,
      error: err?.message || String(err),
    });
    state.received.set(String(transactionId), {
      skipped: {
        group: { transactionId, bppId, providerId, vendorName, orderId, quote: { total: quoteTotal || 0, itemsTotal: quoteItemsTotal } },
        label: vendorName || providerId || "seller",
        reason: "exception",
        detail: err?.message || String(err),
      },
    });
  }

  return maybeFinalizeFromCoordinator(paymentRef);
};

/**
 * Safety net from confirmOndcOrder after all group waiters settle.
 * Builds vendors + split from confirmed groups if coordinator has not finalized.
 */
const finalizeEasySplit = async (paymentRef, confirmedGroups = [], logTraceId) => {
  if (!paymentRef) return { status: "SKIPPED", reason: "no_payment_ref" };
  const state = getOrCreate(paymentRef);
  state.logTraceId = logTraceId || state.logTraceId;

  if (state.finalized) {
    return state.lastResult || { status: "ALREADY_DONE" };
  }

  try {
    if (!(await isEasySplitEnabled(logTraceId))) {
      state.finalized = true;
      return { status: "DISABLED" };
    }
    const config = await resolveEasySplitConfig(logTraceId);
    if (config.error) {
      state.finalized = true;
      return { status: "FAILED", reason: "config", message: config.error };
    }
    const settings = await getEasySplitSettings(logTraceId);

    const splits = [];
    const skipped = [];

    // Prefer any splits already built from on_confirm
    for (const entry of state.received.values()) {
      if (entry.split) splits.push(entry.split);
      if (entry.skipped) skipped.push(entry.skipped);
    }

    const alreadyTxn = new Set([
      ...splits.map((s) => String(s.group.transactionId)),
      ...skipped.map((s) => String(s.group.transactionId)),
    ]);

    for (const group of confirmedGroups) {
      const tid = String(group.transactionId || "");
      if (!tid || alreadyTxn.has(tid)) continue;
      // eslint-disable-next-line no-await-in-loop
      const built = await ensureVendorAndBuildEntry(
        group,
        settings,
        config,
        logTraceId,
        paymentRef
      );
      if (built.split) splits.push(built.split);
      if (built.skipped) skipped.push(built.skipped);
    }

    if (!confirmedGroups.length && !splits.length) {
      state.finalized = true;
      return { status: "SKIPPED", reason: "no_confirmed" };
    }

    return writeSplitOnce(paymentRef, splits, skipped, logTraceId);
  } catch (err) {
    log(logTraceId, "error", {
      step: "finalize",
      message: "finalizeEasySplit threw",
      paymentRef,
      error: err?.message || String(err),
    });
    return { status: "FAILED", reason: "exception", message: err?.message };
  }
};

module.exports = {
  registerCheckout,
  recordOnConfirmAndMaybeSplit,
  finalizeEasySplit,
};
