const { validateBankAccount } = require('./paymentLinks');
const {
  upsertByCorporateUser,
  findOneByCorporateUser,
} = require('../models/use-cases/corporateBankAccount');
const ErrorResponse = require('../utils/error-response');

exports.verifyAndSaveBankAccount = async ({
  corporateUserId,
  accountHolderName,
  accountNumber,
  ifscCode,
  branch,
  mobile,
}) => {
  if (!accountNumber || String(accountNumber).trim().length === 0) {
    throw new ErrorResponse('accountNumber is required', 400);
  }
  if (!ifscCode || String(ifscCode).trim().length === 0) {
    throw new ErrorResponse('ifscCode is required', 400);
  }

  const existing = await findOneByCorporateUser(corporateUserId);
  if (existing) {
    throw new ErrorResponse(
      'Bank account already verified for this merchant',
      409
    );
  }

  const trimmedAccountNumber = String(accountNumber).trim();
  const normalizedIfsc = String(ifscCode).trim().toUpperCase();
  const trimmedHolderName = accountHolderName
    ? String(accountHolderName).trim()
    : undefined;
  const trimmedMobile = mobile ? String(mobile).trim() : undefined;

  const result = await validateBankAccount({
    account_number: trimmedAccountNumber,
    ifsc: normalizedIfsc,
    name: trimmedHolderName,
    mobile: trimmedMobile,
    validation_type: 'pennydrop',
    purpose_message: 'Payroll account validation',
  });

  if (!result?.accountValid) {
    throw new ErrorResponse(
      result?.message || 'Bank account validation failed',
      400
    );
  }

  return upsertByCorporateUser(corporateUserId, {
    accountHolderName: trimmedHolderName,
    accountNumber: trimmedAccountNumber,
    ifscCode: normalizedIfsc,
    branch: branch ? String(branch).trim() : undefined,
    mobile: trimmedMobile,
    nameAtBank: result.beneficiaryName,
    nameMatchScore: result.nameMatchPercentage,
    accountStatus: result.accountStatus || 'Valid',
    validationType: result.validationType,
    validationMessage: result.validationMessage,
    bankReferenceNumber: result.bankReferenceNumber,
    decentroTxnId: result.decentroTxnId,
    referenceId: result.reference_id,
    responseKey: result.responseKey,
    message: result.message,
    verifiedAt: new Date(),
    providerResponse: result.providerResponse || result,
  });
};

exports.getCorporateBankAccount = async ({ corporateUserId }) => {
  const record = await findOneByCorporateUser(corporateUserId);
  if (!record) {
    throw new ErrorResponse(
      'Bank account not found for this merchant',
      404
    );
  }
  return record;
};
