const asyncHandler = require("../../middlewares/async");
const { Op } = require("sequelize");
const paymentQrs = require("../entities/paymentQr");
const { customLog } = require("../../utils/loggerHelper");
const { getTransactionStatus } = require("../../services/paymentLinks");
const unifiedTransactionContract = require("./paymentCollectionTransaction");

const PAYMENT_SUCCESS_STATUSES = new Set([
  "SUCCESS",
  "COMPLETED",
  "PAID",
  "SETTLED",
  "SETTLEMENT_SUCCESS",
  "SETTLEMENT_COMPLETED",
  "SETTLEMENT_DONE",
]);
const PAYMENT_FAILED_STATUSES = new Set([
  "FAILED",
  "FAILURE",
  "ERROR",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
]);
const PAYMENT_SETTLED_STATUSES = new Set([
  "SETTLED",
  "SETTLEMENT_SUCCESS",
  "SETTLEMENT_COMPLETED",
  "SETTLEMENT_DONE",
]);

exports.addPaymentQr = asyncHandler(
  async ({
    corporateUser,
    amount,
    purpose_message,
    reference_id,
    decentro_txn_id,
    status,
    dynamic_qr_image,
    expireDate,
  }) => {
    try {
      const qr = await paymentQrs.create({
        credentialId: corporateUser,
        amount,
        purpose_message,
        reference_id,
        decentro_txn_id,
        status: String(status || "PENDING").toUpperCase(),
        dynamic_qr_image,
        expireDate: expireDate ? new Date(expireDate) : null,
      });
      return qr;
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.findAllPaymentQrs = asyncHandler(
  async ({ corporateUser, limit = 10, page = 0, status, search }) => {
    try {
      const whereClause = { credentialId: corporateUser };

      if (status) {
        whereClause.status = String(status).toUpperCase();
      }

      if (search) {
        whereClause[Op.or] = [
          { reference_id: { [Op.like]: `%${search}%` } },
          { decentro_txn_id: { [Op.like]: `%${search}%` } },
          { purpose_message: { [Op.like]: `%${search}%` } },
          { transactionId: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await paymentQrs.findAndCountAll({
        where: whereClause,
        limit,
        offset: page * limit,
        order: [["createdAt", "DESC"]],
      });

      const pendingReferenceIds = rows
        .filter((row) => String(row.status || "").toUpperCase() === "PENDING")
        .map((row) => row.reference_id)
        .filter(Boolean);

      for (const reference_id of pendingReferenceIds) {
        try {
          const providerStatus = await getTransactionStatus(reference_id);
          const nextStatus =
            providerStatus?.data?.transaction_status ||
            providerStatus?.transaction_status ||
            null;

          if (nextStatus) {
            await exports.updatePaymentQrStatus({
              reference_id,
              status: nextStatus,
              rawPayload: providerStatus,
            });
            const row = rows.find((item) => item.reference_id === reference_id);
            if (row) {
              row.status = String(nextStatus).toUpperCase();
            }
          }
        } catch (err) {
          customLog(null, "error", { error: err.message, reference_id });
        }
      }

      return { count, rows };
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.findAllPaymentQrsForExport = asyncHandler(
  async ({ corporateUser, status, search }) => {
    try {
      const whereClause = { credentialId: corporateUser };

      if (status) {
        whereClause.status = String(status).toUpperCase();
      }

      if (search) {
        whereClause[Op.or] = [
          { reference_id: { [Op.like]: `%${search}%` } },
          { decentro_txn_id: { [Op.like]: `%${search}%` } },
          { purpose_message: { [Op.like]: `%${search}%` } },
          { transactionId: { [Op.like]: `%${search}%` } },
        ];
      }

      return paymentQrs.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.findPaymentQrById = asyncHandler(async ({ id, corporateUser }) => {
  try {
    return paymentQrs.findOne({ where: { id, credentialId: corporateUser } });
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw error;
  }
});

exports.findPaymentQrByIdentifiers = asyncHandler(
  async ({ reference_id = null, decentro_txn_id = null }) => {
    try {
      const whereClause = {};

      if (reference_id) {
        whereClause.reference_id = reference_id;
      } else if (decentro_txn_id) {
        whereClause.decentro_txn_id = decentro_txn_id;
      } else {
        return null;
      }

      return paymentQrs.findOne({ where: whereClause });
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.getPaymentQrsCount = asyncHandler(async ({ corporateUser }) => {
  try {
    return paymentQrs.count({
      where: {
        credentialId: corporateUser,
        status: "PENDING",
      },
    });
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw error;
  }
});

exports.getActivePaymentQrsCount = asyncHandler(async ({ corporateUser }) => {
  try {
    return paymentQrs.count({
      where: {
        credentialId: corporateUser,
        status: "PENDING",
        [Op.or]: [{ expireDate: null }, { expireDate: { [Op.gt]: new Date() } }],
      },
    });
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw error;
  }
});

exports.getTotalAmountFromPaymentQr = asyncHandler(
  async ({ corporateUser, startDate, endDate }) => {
    try {
      const whereClause = {
        credentialId: corporateUser,
        status: "SUCCESS",
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        }
      }

      const result = await paymentQrs.findAll({
        where: whereClause,
        attributes: [
          [
            paymentQrs.sequelize.fn("SUM", paymentQrs.sequelize.col("amount")),
            "totalAmount",
          ],
        ],
        raw: true,
      });

      return Number(result?.[0]?.totalAmount) || 0;
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.updatePaymentQrStatus = asyncHandler(async ({
  reference_id,
  status,
  rawPayload = null,
  occurredAt = null,
  skipUnifiedSync = false,
}) => {
  try {
    if (!reference_id) {
      throw new Error("reference_id is required to update payment QR status");
    }

    if (!status) {
      throw new Error("status is required to update payment QR status");
    }

    const normalizedStatus = String(status).toUpperCase();
    const paymentQr = await paymentQrs.findOne({ where: { reference_id } });
    if (!paymentQr) {
      throw new Error("No payment QR found with the given reference_id");
    }
    const statusChanged =
      normalizedStatus !== String(paymentQr.status || "").toUpperCase();
    const nextValues = { status: normalizedStatus };
    const isSuccessful = PAYMENT_SUCCESS_STATUSES.has(normalizedStatus);
    const isFailed = PAYMENT_FAILED_STATUSES.has(normalizedStatus);
    const isSettled = PAYMENT_SETTLED_STATUSES.has(normalizedStatus);
    const parsedOccurredAt = occurredAt ? new Date(occurredAt) : new Date();
    const milestoneOccurredAt = Number.isNaN(parsedOccurredAt.getTime())
      ? new Date()
      : parsedOccurredAt;

    if ((isSuccessful || isFailed) && !paymentQr.successOrFailDate) {
      nextValues.successOrFailDate = milestoneOccurredAt;
    }

    if (isSettled && !paymentQr.settledDate) {
      nextValues.settledDate = milestoneOccurredAt;
      if (!paymentQr.successOrFailDate) {
        nextValues.successOrFailDate = milestoneOccurredAt;
      }
    }

    const [updatedCount] = await paymentQrs.update(nextValues, { where: { reference_id } });
    if (updatedCount === 0) {
      throw new Error("No payment QR found with the given reference_id");
    }

    if (!skipUnifiedSync) {
      const resolvedOutcomeMilestone =
        nextValues.successOrFailDate || paymentQr.successOrFailDate || null;
      const resolvedSettlementMilestone =
        nextValues.settledDate || paymentQr.settledDate || null;
      const statusOccurredAt =
        occurredAt ||
        (isSettled ? resolvedSettlementMilestone : null) ||
        (isSuccessful || isFailed ? resolvedOutcomeMilestone : null) ||
        paymentQr.createdAt ||
        new Date();
      const normalizedRawPayload =
        rawPayload &&
        typeof rawPayload === "object" &&
        Object.keys(rawPayload).length > 0
          ? rawPayload
          : null;

      try {
        await unifiedTransactionContract.upsertUnifiedTransactionStatus({
          credentialId: paymentQr.credentialId,
          source: "payment_qr",
          sourceTxnId: reference_id,
          providerTxnId: paymentQr.decentro_txn_id || null,
          status: normalizedStatus,
          amount: paymentQr.amount,
          qrImageUrl: paymentQr.dynamic_qr_image || null,
          reference: paymentQr.reference_id || null,
          purposeMessage: paymentQr.purpose_message || null,
          createdMilestoneAt: paymentQr.createdAt || new Date(),
          occurredAt: statusOccurredAt,
          rawPayload: normalizedRawPayload,
          event: {
            key: `status_${normalizedStatus.toLowerCase()}`,
            label: `Status updated to ${normalizedStatus}`,
            status: normalizedStatus,
            occurredAt: statusOccurredAt,
          },
        });
      } catch (unifiedSyncError) {
        customLog(null, "error", {
          error: unifiedSyncError.message,
          reference_id,
          source: "payment_qr",
        });
      }
    }

    return {
      updated: true,
      reference_id,
      status: normalizedStatus,
      statusChanged,
      paymentQr: {
        ...(typeof paymentQr.toJSON === "function" ? paymentQr.toJSON() : paymentQr),
        ...nextValues,
      },
    };
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw error;
  }
});
