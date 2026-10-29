const asyncHandler = require("../../middlewares/async");
const { Op } = require("sequelize");
const paymentLinks = require("../entities/paymentLink");
const { formattedDateTime, capitalizeFirstLetter } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const Sequelize = require('sequelize');
const { getTransactionStatus } = require("../../services/paymentLinks");
const invoicingV2 = require("../entities/invoicingV2");
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

exports.findAllPaymentLinksByAdmin = asyncHandler(async (params, attributes = undefined) => {
  let { limit, offset, sort, sortField, searchText, from, to } = params;


  const whereClause = { [Op.and]: [] };
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // include full 'to' day
    toDate.setHours(0, 0, 0, 0);

    whereClause[Op.and].push({
      createdAt: {
        [Op.between]: [fromDate, toDate],
      },
    });
  }
  if (searchText) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${searchText}%` } },
      { status: { [Op.like]: `%${searchText}%` } },
        {
          paymentLink: {
            [Op.like]: `%${searchText}%`,
          },
        },
        {
          amount: {
            [Op.like]: `%${searchText}%`,
          },
        },
      { invoiceId: { [Op.like]: `%${searchText}%` } },
      { credentialId: { [Op.like]: `%${searchText}%` } },
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.json('sentPayload.full_name')),
          {
            [Op.like]: `%${searchText.toLowerCase()}%`,
          }
        ),
    ];
  }

  whereClause[Op.and].push({ type: "ADMIN" });

  const order = [[sortField || "createdAt", sort || "DESC"]];

  const queryOptions = {
    where: whereClause,
    order,
    attributes,
    raw: true,
    nest: true,
  };

  if (limit) queryOptions.limit = limit;
  if (offset !== undefined) queryOptions.offset = offset;

  return await paymentLinks.findAndCountAll(queryOptions);
});


exports.paymentLinksExport = async (params) => {
  try {
    let { sort, sortField, searchText, from, to } = params;
    // Adjust 'to' date to end of day
    let whereClause = { [Op.and]: [] };
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1); // include full 'to' day
      toDate.setHours(0, 0, 0, 0);

      whereClause[Op.and].push({
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      });
    }

    if (searchText) {

      whereClause[Op.and].push({
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            status: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            invoiceId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            credentialId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
        ],
      });
    }

    // fetch only admin added
    whereClause[Op.and].push({
      type: "ADMIN",
    });

    const data = await paymentLinks.findAndCountAll({
      where: whereClause,
      order: [[sortField, sort]],
      raw: true,
      nest: true,
    });
    let finalData = [];
    data.rows.forEach((limitData) => {
      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
        "Customer Name": limitData.sentPayload?.full_name || "Not Available",
        Amount: limitData.amount || "Not Available",
        "Expiry Date": limitData.expireDate ? formattedDateTime(limitData.expireDate) : "Not Available",
        Status: limitData.status ? capitalizeFirstLetter(limitData.status) : "Not Available",
        "Payment Link": limitData.paymentLink ? limitData.paymentLink : "Not Available",
      });
    });
    return finalData;

  } catch (error) {
    customLog(null, 'error', { error: error.message });
    return false
  }

}

exports.storePaymentLink = asyncHandler(async ({
  amount,
  paymentLink,
  status,
  reference_id,
  decentro_txn_id,
  vendor = null,
  expireDate,
  corporateUser,
  client_url = "test",
  customerPhone,
  customerName,
  purpose_message,
  invoiceId,
  accessKey
}) => {
  try {
    const newPaymentLink = await paymentLinks.create({
      amount,
      paymentLink,
      status,
      reference_id,
      decentro_txn_id,
      vendor,
      expireDate: expireDate ? new Date(expireDate) : null,
      credentialId:corporateUser,
      client_url,
      customerName,
      customerPhone,
      purpose_message,
      invoiceId,
      accessKey
    });
    return newPaymentLink;
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});


exports.getPaymentLinksCount = asyncHandler(async ({ corporateUser }) => {
  try {
    const count = await paymentLinks.count({
      where: {
        credentialId: corporateUser,
        status: 'PENDING'
      }
    });
    return count;
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});

exports.findAllPaymentLinks = asyncHandler(async ({ corporateUser, limit = 10, page = 0, status, search,accessKey=null }) => {
  try {
    const whereClause = { credentialId: corporateUser };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (search) {
      whereClause[Op.or] = [
        { reference_id: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { decentro_txn_id: { [Op.like]: `%${search}%` } },
        { transactionId: { [Op.like]: `%${search}%` } },
      ];
    }

    if(accessKey){
      whereClause.accessKey = accessKey
    }

    const { count, rows: paymentLinksList } = await paymentLinks.findAndCountAll({
      where: whereClause,
      limit,
      offset: page * limit,
      order: [['createdAt', 'DESC']],
    });

    // NuPay links are refreshed by their collection webhook (and on-demand on the detail page),
    // so skip them here — calling Decentro's status API with a NuPay reference would only error.
    const pendingPaymentLinks = paymentLinksList
      .filter(link => link.status === 'PENDING' && link.vendor !== 'nupay')
      .map((x) => x?.reference_id);
    for (const reference_id of pendingPaymentLinks) {
      try {
        const data = await getTransactionStatus(reference_id);
        await exports.updatePaymentLinkStatus({
          reference_id,
          status: data?.data?.transaction_status,
          rawPayload: data,
        });
        const link = paymentLinksList.find((links) => links.reference_id === reference_id);
        if (link) {
          link.status = data.data.transaction_status;
        }
      } catch (err) {
        customLog(null, 'error', { error: err.message, reference_id });
      }
    }

    return { count, rows: paymentLinksList };
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});

exports.findAllPaymentLinksForExport = asyncHandler(async ({ corporateUser, status, search, accessKey = null,startDate,endDate }) => {
  try {
    const whereClause = { credentialId: corporateUser };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (search) {
      whereClause[Op.or] = [
        { reference_id: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { decentro_txn_id: { [Op.like]: `%${search}%` } },
        { transactionId: { [Op.like]: `%${search}%` } },
      ];
    }

    if (accessKey) {
      whereClause.accessKey = accessKey;
    }

    // Add createdAt filter if either startDate or endDate is provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const paymentLinksList = await paymentLinks.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    return paymentLinksList;
  } catch (error) {
    customLog(null, "error", { error: error.message });
    throw error;
  }
});


exports.getTotalAmountFromPaymentLink = asyncHandler(async ({ corporateUser, startDate, endDate }) => {
  try {
    const whereClause = {
      credentialId: corporateUser,
      status:"SUCCESS"
    };

    // Only add createdAt filter if either startDate or endDate is provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const result = await paymentLinks.findAll({
      where: whereClause,
      attributes: [
        [paymentLinks.sequelize.fn('SUM', paymentLinks.sequelize.col('amount')), 'totalAmount']
      ],
      raw: true
    });

    const totalAmount = Number(result[0]?.totalAmount) || 0;
    return totalAmount;
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});

exports.updatePaymentLinkStatus = asyncHandler(async ({
  reference_id,
  status,
  rawPayload = null,
  occurredAt = null,
  skipUnifiedSync = false,
}) => {
  try {
    if (!reference_id) {
      throw new Error("reference_id is required to update payment link status");
    }
    if (!status) {
      throw new Error("status is required to update payment link status");
    }

    const normalizedStatus = String(status).toUpperCase();
    const link = await paymentLinks.findOne({ where: { reference_id } });
    if (!link) {
      throw new Error("No payment link found with the given reference_id");
    }
    const statusChanged = normalizedStatus !== String(link.status || "").toUpperCase();
    const nextValues = { status: normalizedStatus };
    const isSuccessful = PAYMENT_SUCCESS_STATUSES.has(normalizedStatus);
    const isFailed = PAYMENT_FAILED_STATUSES.has(normalizedStatus);
    const isSettled = PAYMENT_SETTLED_STATUSES.has(normalizedStatus);
    const parsedOccurredAt = occurredAt ? new Date(occurredAt) : new Date();
    const milestoneOccurredAt = Number.isNaN(parsedOccurredAt.getTime())
      ? new Date()
      : parsedOccurredAt;

    if ((isSuccessful || isFailed) && !link.successOrFailDate) {
      nextValues.successOrFailDate = milestoneOccurredAt;
    }
    if(link.accessKey==="invoice" && (isSuccessful || isSettled)){
      invoicingV2.update({status:"PAID"},{where:{ id:link.invoiceId}})
    }
    if (isSettled && !link.settledDate) {
      nextValues.settledDate = milestoneOccurredAt;
      if (!link.successOrFailDate) {
        nextValues.successOrFailDate = milestoneOccurredAt;
      }
    }

    const [updatedCount] = await paymentLinks.update(nextValues, { where: { reference_id } });
    if (updatedCount === 0) {
      throw new Error("No payment link found with the given reference_id");
    }

    if (!skipUnifiedSync) {
      const resolvedOutcomeMilestone =
        nextValues.successOrFailDate || link.successOrFailDate || null;
      const resolvedSettlementMilestone =
        nextValues.settledDate || link.settledDate || null;
      const statusOccurredAt =
        occurredAt ||
        (isSettled ? resolvedSettlementMilestone : null) ||
        (isSuccessful || isFailed ? resolvedOutcomeMilestone : null) ||
        link.createdAt ||
        new Date();
      const normalizedRawPayload =
        rawPayload &&
        typeof rawPayload === "object" &&
        Object.keys(rawPayload).length > 0
          ? rawPayload
          : null;

      try {
        await unifiedTransactionContract.upsertUnifiedTransactionStatus({
          credentialId: link.credentialId,
          source: "payment_link",
          sourceTxnId: reference_id,
          providerTxnId: link.decentro_txn_id || null,
          status: normalizedStatus,
          amount: link.amount,
          customerName: link.customerName || null,
          customerPhone: link.customerPhone || null,
          linkUrl: link.paymentLink || null,
          reference: link.reference_id || null,
          purposeMessage: link.purpose_message || null,
          createdMilestoneAt: link.createdAt || new Date(),
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
          source: "payment_link",
        });
      }
    }

    return {
      updated: true,
      reference_id,
      status: normalizedStatus,
      statusChanged,
      paymentLink: {
        ...(typeof link.toJSON === "function" ? link.toJSON() : link),
        ...nextValues,
      },
    };
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});

exports.findPaymentLinkById = asyncHandler(async ({ id, corporateUser }) => {
  try {
    const link = await paymentLinks.findOne({
      where: { id, credentialId: corporateUser },
    });
    return link;
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});

exports.findInvoicePaymentLinkByInvoiceId = asyncHandler(
  async ({ invoiceId, corporateUser }) => {
    try {
      if (!invoiceId || !corporateUser) {
        return null;
      }

      return paymentLinks.findOne({
        where: {
          credentialId: corporateUser,
          invoiceId: String(invoiceId),
          accessKey: "invoice",
        },
        order: [["createdAt", "DESC"]],
      });
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.findPaymentLinkByIdentifiers = asyncHandler(
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

      return paymentLinks.findOne({ where: whereClause });
    } catch (error) {
      customLog(null, "error", { error: error.message });
      throw error;
    }
  }
);

exports.getActivePaymentLinksCount = asyncHandler(async ({ corporateUser }) => {
  try {
    const count = await paymentLinks.count({
      where: {
        credentialId: corporateUser,
        status:"PENDING",
        [Op.or]: [
          { expireDate: null },
          { expireDate: { [Op.gt]: new Date() } }
        ]
      }
    });
    return count;
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw error;
  }
});

exports.createPendingUnifiedTransaction = unifiedTransactionContract.createPendingUnifiedTransaction;
exports.upsertUnifiedTransactionStatus = unifiedTransactionContract.upsertUnifiedTransactionStatus;
exports.appendTimelineEvent = unifiedTransactionContract.appendTimelineEvent;
exports.normalizeUnifiedStatus = unifiedTransactionContract.normalizeUnifiedStatus;
