const { Sequelize } = require("sequelize");
const sequelize = require("../../configs/database/index");
const ManualRefunds = require("../entities/manualRefunds");
const Order = require("../entities/order");
const Transaction = require("../entities/transaction");
const Credential = require("../entities/credential");
const operatorsData = require("../../utils/operatorsData.json");
const { resolveRefundOrderStatus } = require("../../utils/refundOrderStatus");
const { customLog } = require("../../utils/loggerHelper");
const { MANUAL_REFUND_STATUSES, MANUAL_REFUND_TRANSITIONS } = require("../../constants/manualRefunds");

const PROVIDER = operatorsData.mswipePaymentGateway.accessKey;

const statusOption = (status) => MANUAL_REFUND_STATUSES.find((option) => option.status === status);

const parseJson = (value, fallback) => {
  if (value && typeof value === "object") return value;
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

exports.findAllManualRefunds = async ({ status, partnerId, from, to, searchText, page, itemsPerPage }) => {
  const limit = Number(itemsPerPage) || 10;
  const offset = ((Number(page) || 1) - 1) * limit;

  let partnerClause = "";
  if (partnerId === "default") {
    partnerClause = "AND c.registeredBy IS NULL";
  } else if (partnerId) {
    partnerClause = "AND c.registeredBy = :partnerId";
  }

  const whereClause = `
    WHERE mr.pgProvider = :pgProvider
      AND (:status IS NULL OR mr.status = :status)
      AND (:searchText IS NULL OR
        mr.corporateTxnId LIKE CONCAT('%', :searchText, '%') OR
        c.name LIKE CONCAT('%', :searchText, '%') OR
        c.email LIKE CONCAT('%', :searchText, '%'))
      AND (:from IS NULL OR mr.createdAt >= :from)
      AND (:to IS NULL OR mr.createdAt < DATE_ADD(:to, INTERVAL 1 DAY))
      ${partnerClause}`;

  const replacements = {
    pgProvider: PROVIDER,
    status: status || null,
    searchText: searchText || null,
    from: from || null,
    to: to || null,
    partnerId,
    limit,
    offset,
  };

  const rows = await sequelize.query(
    `SELECT
        mr.id, mr.corporateTxnId, mr.orderId, mr.paymentGatewayOrderId, mr.status, mr.refundAmount,
        mr.paidAmount, mr.serviceName, mr.reason,
        mr.gatewayOrderId, mr.gatewayReference, mr.paymentDetails, mr.refundReference, mr.remarks,
        mr.history, mr.createdAt, mr.updatedAt,
        c.name AS customerName, c.email AS customerEmail, p.name AS partnerName
      FROM manualRefunds mr
      LEFT JOIN credentials c ON c.id = mr.credentialId
      LEFT JOIN credentials p ON p.id = c.registeredBy
      ${whereClause}
      ORDER BY mr.createdAt DESC, mr.id DESC
      LIMIT :limit OFFSET :offset`,
    { replacements, type: Sequelize.QueryTypes.SELECT }
  );

  const [countRow] = await sequelize.query(
    `SELECT COUNT(*) AS count
      FROM manualRefunds mr
      LEFT JOIN credentials c ON c.id = mr.credentialId
      ${whereClause}`,
    { replacements, type: Sequelize.QueryTypes.SELECT }
  );

  return {
    recordsTotal: Number(countRow?.count || 0),
    statuses: MANUAL_REFUND_STATUSES,
    rows: rows.map((row) => ({
      ...row,
      refundAmount: Number(row.refundAmount),
      paidAmount: row.paidAmount === null ? null : Number(row.paidAmount),
      paymentDetails: parseJson(row.paymentDetails, null),
      history: parseJson(row.history, []),
      statusName: statusOption(row.status)?.name ?? row.status,
      nextStatuses: (MANUAL_REFUND_TRANSITIONS[row.status] || []).map(statusOption),
    })),
  };
};

const applyToOrder = async ({ orderRow, record, status, refundReference, at, transaction }) => {
  const body = parseJson(orderRow.paymentModeResponse, null);
  if (!body || Array.isArray(body)) {
    customLog(null, "error", { action: "refund:mswipeManualRefundOrderShapeUnexpected", corporateTxnId: record.corporateTxnId });
    return;
  }

  const refundId = `refund_${record.corporateTxnId}`;
  const priorResults = Array.isArray(body.refundResults) ? body.refundResults : [];
  const existing = priorResults.find((result) => result?.refund_id === refundId);
  const entry = {
    ...(existing || { gateway: PROVIDER, refund_id: refundId, refund_mode: "MANUAL", refund_amount: Number(record.refundAmount) }),
    refund_status: status,
    ...(refundReference && { refund_arn: refundReference }),
    updated_at: at,
  };
  const refundResults = [...priorResults.filter((result) => result?.refund_id !== refundId), entry];

  const fields = { paymentModeResponse: JSON.stringify({ ...body, refundStatus: status, refundResults }) };
  if (status === "SUCCESS") {
    const nextStatus = resolveRefundOrderStatus({
      refundId,
      refundResults,
      capturedAmount: body.payment_amount,
      currentStatus: orderRow.status,
    });
    if (nextStatus) fields.status = nextStatus;
  }
  await Order.update(fields, { where: { id: orderRow.id }, transaction });

  if (status === "SUCCESS") {
    const refundedAmount = refundResults
      .filter((result) => result?.refund_status === "SUCCESS")
      .reduce((sum, result) => sum + Number(result?.refund_amount || 0), 0);
    await Transaction.update({ refundedAmount }, { where: { corporateTxnId: record.corporateTxnId }, transaction });
  }
};

exports.updateManualRefundStatus = async ({ id, status, refundReference, remarks, adminId }) => {
  const record = await ManualRefunds.findByPk(id);
  if (!record || record.pgProvider !== PROVIDER) {
    return { status: false, notFound: true, message: "Refund not found." };
  }
  if (!(MANUAL_REFUND_TRANSITIONS[record.status] || []).includes(status)) {
    return {
      status: false,
      message: `This refund is already ${statusOption(record.status)?.name.toLowerCase()} and cannot be marked as ${statusOption(status)?.name.toLowerCase()}.`,
    };
  }
  if (status === "SUCCESS" && !refundReference) {
    return { status: false, message: "Please enter the Mswipe refund reference" };
  }
  if (status === "FAILED" && !remarks) {
    return { status: false, message: "Please enter the reason for rejecting the refund" };
  }

  const at = new Date().toISOString();
  const history = [
    ...parseJson(record.history, []),
    { status, at, by: adminId ?? null, ...(refundReference && { refundReference }), ...(remarks && { remarks }) },
  ];

  const transaction = await sequelize.transaction();
  try {
    const [updated] = await ManualRefunds.update(
      {
        status,
        refundReference: refundReference || record.refundReference,
        remarks: remarks || record.remarks,
        updatedBy: adminId ?? null,
        history,
      },
      { where: { id: record.id, status: record.status }, transaction }
    );
    if (!updated) {
      await transaction.rollback();
      return { status: false, conflict: true, message: "This refund was just updated by someone else. Please refresh and try again." };
    }

    const orderRow = await Order.findOne({
      where: record.orderId ? { id: record.orderId } : { corporateTxnId: record.corporateTxnId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (orderRow) {
      await applyToOrder({ orderRow, record, status, refundReference, at, transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    customLog(null, "error", { action: "refund:mswipeManualRefundUpdateFailed", id, status, error: error?.message ?? error });
    return { status: false, message: "Something went wrong while updating the refund." };
  }

  const customer = record.credentialId
    ? await Credential.findByPk(record.credentialId, { attributes: ["username", "name", "email", "registeredBy"], raw: true })
    : null;

  customLog(null, "info", { action: "refund:mswipeManualRefundStatusUpdated", id: record.id, corporateTxnId: record.corporateTxnId, from: record.status, to: status, adminId });

  return {
    status: true,
    message: "Refund status updated successfully.",
    data: {
      corporateTxnId: record.corporateTxnId,
      status,
      refundAmount: Number(record.refundAmount),
      refundReference: refundReference || record.refundReference,
      customer,
    },
  };
};
