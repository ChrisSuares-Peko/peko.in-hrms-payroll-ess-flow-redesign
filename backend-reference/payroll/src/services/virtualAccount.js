const { v4: uuidv4 } = require('uuid');
const {
  createVirtualAccountV2,
  getVirtualAccountBalanceV2,
  extractBalance,
} = require('../utils/decentroGateway');
const {
  upsertByCorporateUser,
  findOneByCorporateUser,
} = require('../models/use-cases/corporateVirtualAccount');
const ErrorResponse = require('../utils/error-response');



exports.onboardCorporateVirtualAccount = async ({
  corporateUserId,
  name,
  pan,
  mobile,
}) => {
  const existing = await findOneByCorporateUser(corporateUserId);
  if (existing) {
    throw new ErrorResponse(
      'Virtual account already exists for this merchant',
      409
    );
  }

  const customer_id = `PEKO-PAYROLL-${uuidv4()}`;

  const result = await createVirtualAccountV2({ customer_id, name, pan, mobile });
  const account = result?.data?.account_details?.[0] || {};

  return upsertByCorporateUser(corporateUserId, {
    decentroCustomerId: customer_id,
    decentroTxnId: result?.decentro_txn_id || null,
    virtualAccountNumber: account.virtual_account_number || null,
    virtualAccountIfsc: account.virtual_account_ifsc || null,
    bankCode: account.bankCode || account.bank_codes?.[0] || 'YESB',
    name,
    pan,
    mobile,
    status: result?.status || null,
    responseCode: result?.response_code || null,
    message: result?.message || null,
    providerResponse: result?.providerResponse || result,
  });
};

exports.getCorporateVirtualAccountStatus = async ({ corporateUserId }) => {
  const record = await findOneByCorporateUser(corporateUserId);
  if (!record) {
    throw new ErrorResponse(
      'Virtual account not found for this merchant',
      404
    );
  }
  return record;
};

exports.getCorporateVirtualAccountBalance = async ({ corporateUserId }) => {
  const record = await findOneByCorporateUser(corporateUserId);
  if (!record || !record.virtualAccountNumber) {
    throw new ErrorResponse(
      'Virtual account not found for this merchant',
      404
    );
  }

  const providerData = await getVirtualAccountBalanceV2({
    accountNumber: record.virtualAccountNumber,
    customerId: corporateUserId,
  });

  const availableBalance = extractBalance(providerData);

  return {
    virtualAccountNumber: record.virtualAccountNumber,
    virtualAccountIfsc: record.virtualAccountIfsc || null,
    accountName: record.name || null,
    availableBalance,
    providerData,
  };
};
