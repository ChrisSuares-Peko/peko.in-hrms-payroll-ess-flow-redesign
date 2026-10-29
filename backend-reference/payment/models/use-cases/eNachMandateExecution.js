const EnachMandateExecution = require('../entities/eNachMandateExecution');
const { Op } = require("sequelize");
const { ENACH_EXECUTION_TERMINAL_STATUSES } = require("../../utils/paymentLinks");

async function addEnachMandateExecution(params) {
  const executionObj = {
    execution_reference_id: params.execution_reference_id,
    mandate_reference_id: params.mandate_reference_id,
    enach_mandate_id: params.enach_mandate_id,
    corporateUser: params.corporateUser,
    decentro_mandate_id: params.decentro_mandate_id,
    decentro_txn_id: params.decentro_txn_id,
    transaction_reference: params.transaction_reference,
    payment_date: params.payment_date,
    amount: params.amount,
    status: params.status,
    processed_or_failed_at: params.processed_or_failed_at,
    provider_response: params.provider_response,
  };

  Object.keys(executionObj).forEach((key) => {
    if (executionObj[key] === undefined) {
      delete executionObj[key];
    }
  });

  return EnachMandateExecution.create(executionObj);
}

async function findAllEnachMandateExecutions({
  mandate_reference_id,
  corporateUser,
  limit = 10,
  page = 0,
}) {
  return EnachMandateExecution.findAndCountAll({
    where: {
      mandate_reference_id,
      corporateUser,
    },
    limit,
    offset: page * limit,
    order: [['createdAt', 'DESC']],
    raw: true,
  });
}

async function updateEnachMandateExecutionByReferenceId(
  execution_reference_id,
  updates
) {
  const [updatedCount] = await EnachMandateExecution.update(updates, {
    where: { execution_reference_id },
  });

  return updatedCount;
}

async function findEnachMandateExecutionByReferenceId(execution_reference_id) {
  if (!execution_reference_id) {
    return null;
  }

  return EnachMandateExecution.findOne({
    where: { execution_reference_id },
  });
}

async function findEnachMandateExecutionByDecentroTxnId(decentro_txn_id) {
  if (!decentro_txn_id) {
    return null;
  }

  return EnachMandateExecution.findOne({
    where: { decentro_txn_id },
  });
}

async function updateEnachMandateExecutionStatus({
  execution_reference_id,
  decentro_txn_id,
  status,
  provider_response = null,
  occurredAt = null,
}) {
  if (!execution_reference_id && !decentro_txn_id) {
    throw new Error(
      "Either execution_reference_id or decentro_txn_id is required"
    );
  }

  if (!status) {
    throw new Error("status is required to update eNACH execution status");
  }

  const execution =
    (await findEnachMandateExecutionByReferenceId(execution_reference_id)) ||
    (await findEnachMandateExecutionByDecentroTxnId(decentro_txn_id));

  if (!execution) {
    throw new Error("No eNACH execution found with the given identifier");
  }

  const normalizedStatus = String(status).toUpperCase();
  const statusChanged =
    normalizedStatus !== String(execution.status || "").toUpperCase();
  const statusOccurredAt = occurredAt || new Date();
  const nextValues = {
    status: normalizedStatus,
  };

  if (
    provider_response &&
    typeof provider_response === "object" &&
    Object.keys(provider_response).length > 0
  ) {
    nextValues.provider_response = provider_response;
  }

  if (decentro_txn_id && !execution.decentro_txn_id) {
    nextValues.decentro_txn_id = decentro_txn_id;
  }

  if (ENACH_EXECUTION_TERMINAL_STATUSES.has(normalizedStatus)) {
    if (!execution.processed_or_failed_at) {
      nextValues.processed_or_failed_at = statusOccurredAt;
    }

    if (!execution.successOrFailDate) {
      nextValues.successOrFailDate = statusOccurredAt;
    }
  }

  const [updatedCount] = await EnachMandateExecution.update(nextValues, {
    where: { id: execution.id },
  });

  if (updatedCount === 0) {
    throw new Error("No eNACH execution found with the given identifier");
  }

  return {
    updated: true,
    execution_reference_id: execution.execution_reference_id,
    status: normalizedStatus,
    statusChanged,
    execution: {
      ...(typeof execution.toJSON === "function" ? execution.toJSON() : execution),
      ...nextValues,
    },
  };
}

async function findLatestEnachMandateExecutionByStatuses({
  mandate_reference_id,
  corporateUser,
  statuses = [],
}) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return null;
  }

  return EnachMandateExecution.findOne({
    where: {
      mandate_reference_id,
      corporateUser,
      status: {
        [Op.in]: statuses,
      },
    },
    order: [["createdAt", "DESC"]],
    raw: true,
  });
}

module.exports = {
  addEnachMandateExecution,
  findAllEnachMandateExecutions,
  findEnachMandateExecutionByReferenceId,
  findEnachMandateExecutionByDecentroTxnId,
  findLatestEnachMandateExecutionByStatuses,
  updateEnachMandateExecutionByReferenceId,
  updateEnachMandateExecutionStatus,
};
