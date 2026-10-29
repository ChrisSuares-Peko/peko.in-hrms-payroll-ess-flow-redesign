const axios = require("axios");
const { v4 } = require("uuid");

const ErrorResponse = require("./error-response");
const { customLog } = require("./loggerHelper");
const { formatDateToYMD } = require("./formatter");
const {
  fetchServiceDetails,
  findServiceOperatorByAccessKey,
} = require("./checkAndFetchServiceDetails");

const PAYOUT_ACCESS_KEY = "vendor_payouts";
const VA_ACCESS_KEY = "vendor_virtual_accounts";

const trimValue = (value) => String(value || "").trim();


exports.extractBalance = (providerResponse = {}) => {
  const data = providerResponse.data || {};
  const possibleBalance =
    data.account_balance?.current_balance ??
    data.current_balance ??
    providerResponse.account_balance?.current_balance ??
    providerResponse.current_balance ??
    data.presentBalance ??
    providerResponse.presentBalance ??
    data.balance ??
    providerResponse.balance;

  const numericBalance = Number(possibleBalance);
  return Number.isFinite(numericBalance) ? numericBalance : null;
};

const normalizeStatementDateInput = (value, fieldName) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ErrorResponse(
        `${fieldName} must be a valid date in YYYY-MM-DD format`,
        400
      );
    }
    return formatDateToYMD(value);
  }

  const trimmedValue = trimValue(value);
  const ymdPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (ymdPattern.test(trimmedValue)) {
    return trimmedValue;
  }

  const isoPrefixMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoPrefixMatch) {
    return isoPrefixMatch[1];
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ErrorResponse(
      `${fieldName} must be a valid date in YYYY-MM-DD format`,
      400
    );
  }

  return formatDateToYMD(parsedDate);
};

const resolveVendorConfig = async ({
  accessKey,
  credentialId,
  corporateUserId,
  serviceType,
  configLabel,
}) => {
  let serviceDetails = null;

  if (typeof fetchServiceDetails === "function") {
    serviceDetails = await fetchServiceDetails({
      accessKey,
      credentialId,
      corporateUserId,
      serviceType,
    });
  }

  if (!serviceDetails || serviceDetails.error) {
    serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  }

  const vendor = serviceDetails?.vendor;
  if (!vendor) {
    throw new ErrorResponse(configLabel, 500);
  }

  return vendor;
};

const providerError = (error, fallbackMessage) => {
  if (error instanceof ErrorResponse) {
    return error;
  }

  const statusCode = error?.response?.status || 400;
  const providerErrorMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallbackMessage;

  return new ErrorResponse(providerErrorMessage, statusCode);
};

const payoutHeaders = (vendor) => ({
  client_id: vendor.optional1,
  client_secret: vendor.optional2,
  module_secret: vendor.optional3,
  provider_secret: vendor.optional4,
  "Content-Type": "application/json",
});

const virtualAccountHeaders = (vendor) => ({
  client_id: vendor.optional1,
  client_secret: vendor.optional2,
  module_secret: vendor.optional3,
  "Content-Type": "application/json",
});

exports.fetchVirtualAccounts = async ({ credentialId, corporateUserId } = {}) => {
  try {
    const vendor = await resolveVendorConfig({
      accessKey: VA_ACCESS_KEY,
      credentialId,
      corporateUserId,
      configLabel: "Virtual account configuration is missing",
    });

    const response = await axios.get(`${vendor.apiUrl}/v2/payments/vpa`, {
      headers: virtualAccountHeaders(vendor),
    });

    customLog(null, "info", {
      message: "Decentro fetchVirtualAccounts response",
      data: response.data,
    });

    return response.data;
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while fetching virtual accounts"
    );
  }
};

exports.fetchEscrowAccounts = async ({ credentialId, corporateUserId } = {}) => {
  try {
    const vendor = await resolveVendorConfig({
      accessKey: VA_ACCESS_KEY,
      credentialId,
      corporateUserId,
      configLabel: "Escrow configuration is missing",
    });

    const response = await axios.get(`${vendor.apiUrl}/v2/payments/escrow`, {
      headers: virtualAccountHeaders(vendor),
    });

    customLog(null, "info", {
      message: "Decentro fetchEscrowAccounts response",
      data: response.data,
    });

    return response.data;
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while fetching escrow accounts"
    );
  }
};

exports.createVirtualAccountV2 = async ({
  customer_id,
  name,
  pan,
  mobile,
}) => {
  try {
    const trimmedName = trimValue(name);
    if (!trimmedName) {
      throw new ErrorResponse("name is required", 400);
    }

    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      configLabel: "Virtual account configuration is missing",
    });

    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2 || !vendor.optional3) {
      throw new ErrorResponse("Virtual account configuration is missing", 500);
    }

    const payload = {
      bank_codes: ["YESB"],
      customer_id,
      name: trimmedName,
      pan,
      mobile,
      kyc_verified: 1,
      kyc_check_decentro: 0,
    };

    const response = await axios({
      method: "POST",
      url: `${vendor.apiUrl.replace(/\/$/, "")}/v2/banking/account/virtual`,
      headers: virtualAccountHeaders(vendor),
      data: payload,
    });

    const providerResponse = response?.data || {};
    const selectedData = providerResponse?.data?.[0] || {};

    return {
      status: providerResponse?.status || null,
      response_code: providerResponse?.response_code || null,
      message: providerResponse?.message || null,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      data: {
        account_details: [
          {
            virtual_account_number: selectedData.accountNumber || null,
            virtual_account_ifsc: selectedData.ifsc || null,
            ...selectedData,
          },
        ],
      },
      providerResponse,
    };
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while creating virtual account"
    );
  }
};

exports.createVirtualAccount = async (params) =>
  exports.createVirtualAccountV2(params);

exports.initiateTransfer = async ({
  credentialId,
  corporateUserId,
  referenceId,
  amount,
  transferType = "IMPS",
  fromAccount,
  virtualAccountNumber,
  senderAccountNumber,
  beneficiaryDetails = {},
  purposeMessage = "Salary payout",
}) => {
  if (process.env.NODE_ENV!== 'production') {
    return {
  "status": "success",
  "decentroTxnId": "DECXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "responseCode": "S00000",
  "transferType": "IMPS",
  "bankReferenceNumber": "227715217094",
  "beneficiaryName": "name",
  "newBalance": 281,
  "providerResponse": "fundTransfer successfully processed",
  "transactionStatus": "success"
}
  }
  try {
    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      credentialId,
      corporateUserId,
      configLabel: "Payout configuration is missing",
    });

    const normalizedReferenceId = trimValue(referenceId || v4());
    const normalizedFromAccount = trimValue(
      fromAccount || virtualAccountNumber || senderAccountNumber || vendor.optional6
    );
    console.log("normalizedFromAccount!!!", normalizedFromAccount)
    const normalizedTransferType = trimValue(transferType || "IMPS").toUpperCase();
    const transferAmount = Number(amount);
    const isUpi = normalizedTransferType === "UPI";

    if (!normalizedFromAccount) {
      throw new ErrorResponse("fromAccount is required", 400);
    }

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      throw new ErrorResponse("Valid amount is required", 400);
    }

    if (!isUpi && !trimValue(beneficiaryDetails.accountNumber)) {
      throw new ErrorResponse("beneficiary account number is required", 400);
    }

    if (!isUpi && !trimValue(beneficiaryDetails.ifscCode)) {
      throw new ErrorResponse("beneficiary IFSC code is required", 400);
    }

    if (isUpi && !trimValue(beneficiaryDetails.upiId)) {
      throw new ErrorResponse("beneficiary UPI ID is required", 400);
    }

    if (!trimValue(beneficiaryDetails.name)) {
      throw new ErrorResponse("beneficiary name is required", 400);
    }

    const payload = {
      reference_id: normalizedReferenceId,
      purpose_message: trimValue(purposeMessage) || "Salary payout",
      from_account: normalizedFromAccount,
      transfer_type: normalizedTransferType,
      transfer_amount: String(transferAmount),
      ...(isUpi
        ? { to_upi: trimValue(beneficiaryDetails.upiId) }
        : {
            to_account: trimValue(beneficiaryDetails.accountNumber),
            ifsc_code: trimValue(beneficiaryDetails.ifscCode).toUpperCase(),
          }),
      beneficiary_details: {
        payee_name: trimValue(beneficiaryDetails.name),
        ...(!isUpi && {
          ifsc_code: trimValue(beneficiaryDetails.ifscCode).toUpperCase(),
        }),
        ...(trimValue(beneficiaryDetails.email) && {
          email_address: trimValue(beneficiaryDetails.email),
        }),
        ...(trimValue(beneficiaryDetails.mobile) && {
          mobile_number: trimValue(beneficiaryDetails.mobile),
        }),
      },
    };

    const response = await axios.post(
      `${vendor.apiUrl.replace(/\/$/, "")}/core_banking/money_transfer/initiate`,
      payload,
      {
        headers: payoutHeaders(vendor),
      }
    );

    customLog(null, "info", {
      message: "Decentro initiateTransfer response",
      data: response.data,
    });

    return response.data;
  } catch (error) {
    customLog(null, "error", {
      message: "Decentro initiateTransfer error",
      data: error?.response?.data || error?.message,
    });
    throw providerError(
      error,
      "Something went wrong while initiating payout transfer"
    );
  }
};

exports.getTransferStatus = async ({
  credentialId,
  corporateUserId,
  referenceId,
  decentroTxnId,
}) => {
  try {
    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      credentialId,
      corporateUserId,
      configLabel: "Payout configuration is missing",
    });

    const normalizedReferenceId = trimValue(referenceId);
    const normalizedDecentroTxnId = trimValue(decentroTxnId);

    if (!normalizedReferenceId && !normalizedDecentroTxnId) {
      throw new ErrorResponse(
        "Either referenceId or decentroTxnId is required",
        400
      );
    }

    const response = await axios.get(
      `${vendor.apiUrl.replace(/\/$/, "")}/core_banking/money_transfer/get_status`,
      {
        params: {
          ...(normalizedReferenceId && { reference_id: normalizedReferenceId }),
          ...(normalizedDecentroTxnId && {
            decentro_txn_id: normalizedDecentroTxnId,
          }),
        },
        headers: payoutHeaders(vendor),
      }
    );

    customLog(null, "info", {
      message: "Decentro getTransferStatus response",
      data: response.data,
    });

    return response.data;
  } catch (error) {
    customLog(null, "error", {
      message: "Decentro getTransferStatus error",
      data: error?.response?.data || error?.message,
    });
    throw providerError(
      error,
      "Something went wrong while fetching payout transfer status"
    );
  }
};

exports.manageBeneficiary = async ({
  credentialId,
  corporateUserId,
  action,
  senderAccountNumber,
  accountNumber,
  ifscCode,
  upiHandle,
  transferType = "IMPS",
  name,
  email,
  mobile,
  beneficiaryCode,
}) => {
  try {
    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      credentialId,
      corporateUserId,
      configLabel: "Beneficiary configuration is missing",
    });

    const normalizedAction = trimValue(action).toUpperCase();
    console.log(senderAccountNumber,"senderAccountNumber from request")
    const normalizedSenderAccountNumber = trimValue(
      senderAccountNumber || vendor.optional6
    );
    //  const normalizedSenderAccountNumber = "D95357896657784368"
   console.log("normalizedSenderAccountNumber!!!", normalizedSenderAccountNumber)
    if (!normalizedAction) {
      throw new ErrorResponse("action is required", 400);
    }

    if (!normalizedSenderAccountNumber) {
      throw new ErrorResponse("senderAccountNumber is required", 400);
    }

    const payload = {
      action: normalizedAction,
      sender_account_number: normalizedSenderAccountNumber,
      ...(trimValue(accountNumber) && { account_number: trimValue(accountNumber) }),
      ...(trimValue(ifscCode) && { ifsc: trimValue(ifscCode).toUpperCase() }),
      ...(trimValue(upiHandle) && { upi_handle: trimValue(upiHandle) }),
      ...(trimValue(name) && { name: trimValue(name) }),
      ...(trimValue(email) && { email: trimValue(email) }),
      ...(trimValue(mobile) && { mobile: trimValue(mobile) }),
      ...(trimValue(beneficiaryCode) && {
        beneficiary_code: trimValue(beneficiaryCode),
      }),
      ...(!trimValue(upiHandle) && {
        transfer_type: trimValue(transferType || "IMPS").toUpperCase(),
      }),
    };

    const response = await axios.post(
      `${vendor.apiUrl.replace(/\/$/, "")}/v2/banking/beneficiary`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          client_id: vendor.optional1,
          client_secret: vendor.optional2,
          module_secret: vendor.optional3,
          provider_secret: vendor.optional4,
        },
      }
    );

    customLog(null, "info", {
      message: "Decentro manageBeneficiary response",
      data: response.data,
    });
   console.log(response.data,"response from decentro benficiary api")
    return response.data;
  } catch (error) {
    console.log("Error in Decentro manageBeneficiary", error?.response?.data || error?.message)
    customLog(null, "error", {
      message: "Decentro manageBeneficiary error",
      data: error?.response?.data || error?.message,
    });
    throw providerError(
      error,
      "Something went wrong while managing beneficiary"
    );
  }
};

exports.getVirtualAccountBalanceV2 = async ({
  accountNumber,
  customerId,
  mobileNumber,
}) => {
  if (process.env.NODE_ENV!== 'production') {
    return {
      decentroTxnId: `MOCK_${Date.now()}`,
      status: 'success',
      responseCode: 'S00000',
      type: 'VIRTUAL',
      accountNumber,
      presentBalance: Number("50000"),
      minimumBalance: 0,
    };
  }
  try {
    const trimmedAccountNumber = trimValue(accountNumber);
    const trimmedCustomerId = trimValue(customerId);
    const trimmedMobileNumber = trimValue(mobileNumber);

    if (!trimmedAccountNumber) {
      throw new ErrorResponse("accountNumber is required", 400);
    }

    if (!trimmedCustomerId && !trimmedMobileNumber) {
      throw new ErrorResponse(
        "Either customerId or mobileNumber is required",
        400
      );
    }

    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      configLabel: "Virtual account balance v2 configuration is missing",
    });
     
    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2 || !vendor.optional3 || !vendor.optional4) {
      throw new ErrorResponse(
        "Virtual account balance v2 configuration is missing",
        500
      );
    }

    const params = { account_number: trimmedAccountNumber };
    if (trimmedCustomerId) params.customer_id = trimmedCustomerId;
    if (trimmedMobileNumber) params.mobile_number = trimmedMobileNumber;

    const response = await axios({
      method: "GET",
      url: `${vendor.apiUrl.replace(/\/$/, "")}/core_banking/money_transfer/get_balance`,
      headers: {
        ...payoutHeaders(vendor),
        accept: "application/json",
      },
      params,
    });

    return response?.data || {};
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while fetching virtual account balance"
    );
  }
};

exports.debitVirtualAccount = async ({
  referenceId,
  accountNumber,
  amount,
  bankReferenceNumber,
  transferType = "IMPS",
  purpose = "SALARY_PAYOUT",
}) => {
  try {
    const trimmedReferenceId = trimValue(referenceId);
    const trimmedAccountNumber = trimValue(accountNumber);
    const numericAmount = Number(amount);
    const trimmedBankReferenceNumber = trimValue(bankReferenceNumber);
    const normalizedTransferType = trimValue(transferType || "IMPS").toUpperCase();
    const trimmedPurpose = trimValue(purpose || "SALARY_PAYOUT");

    if (!trimmedReferenceId) {
      throw new ErrorResponse("referenceId is required", 400);
    }

    if (!trimmedAccountNumber) {
      throw new ErrorResponse("accountNumber is required", 400);
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new ErrorResponse("Valid amount is required", 400);
    }

    if (!trimmedBankReferenceNumber) {
      throw new ErrorResponse("bankReferenceNumber is required", 400);
    }

    if (!["IMPS", "NEFT", "RTGS", "UPI"].includes(normalizedTransferType)) {
      throw new ErrorResponse("transferType must be IMPS, NEFT, RTGS, or UPI", 400);
    }

    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      configLabel: "Virtual account debit configuration is missing",
    });

    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2 || !vendor.optional3 || !vendor.optional4) {
      throw new ErrorResponse(
        "Virtual account debit configuration is missing",
        500
      );
    }

    const payload = {
      reference_id: trimmedReferenceId,
      action: "Debit",
      purpose: trimmedPurpose,
      account_number: trimmedAccountNumber,
      amount: numericAmount,
      bank_reference_number: trimmedBankReferenceNumber,
      transfer_type: normalizedTransferType,
    };

    const response = await axios({
      method: "POST",
      url: `${vendor.apiUrl.replace(/\/$/, "")}/v2/banking/virtual/account/update_balance`,
      headers: {
        ...payoutHeaders(vendor),
        accept: "application/json",
      },
      data: payload,
    });

    customLog(null, "info", {
      message: "Decentro debitVirtualAccount response",
      data: response.data,
    });

    return response?.data || {};
  } catch (error) {
    customLog(null, "error", {
      message: "Decentro debitVirtualAccount error",
      data: error?.response?.data || error?.message,
    });
    throw providerError(
      error,
      "Something went wrong while debiting virtual account"
    );
  }
};

exports.addSettlementAccount = async ({
  virtualAccountNumber,
  settlementAccountNumber,
  settlementAccountIfsc,
  settlementAccountName,
  referenceId,
}) => {
  try {
    const trimmedVirtualAccountNumber = trimValue(virtualAccountNumber);
    const trimmedSettlementAccountNumber = trimValue(settlementAccountNumber);
    const normalizedSettlementAccountIfsc = trimValue(
      settlementAccountIfsc
    ).toUpperCase();
    const trimmedSettlementAccountName = trimValue(settlementAccountName);
    const resolvedReferenceId = trimValue(referenceId || v4());

    if (!trimmedVirtualAccountNumber) {
      throw new ErrorResponse("virtualAccountNumber is required", 400);
    }

    if (!trimmedSettlementAccountNumber) {
      throw new ErrorResponse("settlementAccountNumber is required", 400);
    }

    if (!normalizedSettlementAccountIfsc) {
      throw new ErrorResponse("settlementAccountIfsc is required", 400);
    }

    if (!trimmedSettlementAccountName) {
      throw new ErrorResponse("settlementAccountName is required", 400);
    }

    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      configLabel: "Settlement account configuration is missing",
    });

    const consumerUrn = trimValue(vendor.optional5);
    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2 || !consumerUrn) {
      throw new ErrorResponse(
        "Settlement account configuration is missing",
        500
      );
    }

    const response = await axios({
      method: "POST",
      url: `${vendor.apiUrl.replace(/\/$/, "")}/v3/banking/settlement_account_setup`,
      headers: {
        "Content-Type": "application/json",
        client_id: vendor.optional1,
        client_secret: vendor.optional2,
      },
      data: {
        reference_id: resolvedReferenceId,
        consumer_urn: consumerUrn,
        action: "ACTIVATE",
        virtual_account_number: trimmedVirtualAccountNumber,
        settlement_account_number: trimmedSettlementAccountNumber,
        settlement_account_ifsc: normalizedSettlementAccountIfsc,
        settlement_account_name: trimmedSettlementAccountName,
      },
    });

    const providerResponse = response?.data || {};

    return {
      reference_id: resolvedReferenceId,
      status: providerResponse?.status || null,
      response_code:
        providerResponse?.response_code || providerResponse?.response_key || null,
      message: providerResponse?.message || null,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      settlement_account_urn:
        providerResponse?.data?.settlement_account_urn ||
        providerResponse?.settlement_account_urn ||
        null,
      data: providerResponse?.data || null,
      providerResponse,
    };
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while adding settlement account"
    );
  }
};

exports.decentroSettlementToMVA = async ({
  credentialId,
  corporateUserId,
} = {}) => {
  try {
    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      credentialId,
      corporateUserId,
      configLabel: "Settlement configuration is missing",
    });

    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2 || !vendor.optional3 || !vendor.optional4) {
      throw new ErrorResponse("Settlement configuration is missing", 500);
    }

    const response = await axios({
      method: "GET",
      url: `${vendor.apiUrl.replace(/\/$/, "")}/v2/banking/account/virtual/balance_settlement`,
      headers: {
        ...payoutHeaders(vendor),
        accept: "application/json",
      },
    });

    customLog(null, "info", {
      message: "Decentro settlementToMVA response",
      data: response.data,
    });

    return response?.data || {};
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while creating settlement"
    );
  }
};

exports.createSettlement = async (params = {}) =>
  exports.decentroSettlementToMVA(params);

exports.getVirtualAccountStatementV2 = async ({
  accountNumber,
  customerId,
  mobileNumber,
  from,
  to,
  page,
  limit,
}) => {
  try {
    const trimmedAccountNumber = trimValue(accountNumber);
    const trimmedCustomerId = trimValue(customerId);
    const trimmedMobileNumber = trimValue(mobileNumber);
    const trimmedFrom = typeof from === "string" ? from.trim() : from;
    const trimmedTo = typeof to === "string" ? to.trim() : to;

    if (!trimmedAccountNumber) {
      throw new ErrorResponse("accountNumber is required", 400);
    }

    if (!trimmedFrom) {
      throw new ErrorResponse("from is required", 400);
    }

    if (!trimmedTo) {
      throw new ErrorResponse("to is required", 400);
    }

    if (!trimmedCustomerId && !trimmedMobileNumber) {
      throw new ErrorResponse(
        "Either customerId or mobileNumber is required",
        400
      );
    }

    const normalizedFrom = normalizeStatementDateInput(trimmedFrom, "from");
    const normalizedTo = normalizeStatementDateInput(trimmedTo, "to");

    const vendor = await resolveVendorConfig({
      accessKey: PAYOUT_ACCESS_KEY,
      configLabel: "Virtual account statement v2 configuration is missing",
    });

    if (!vendor.apiUrl || !vendor.optional1 || !vendor.optional2 || !vendor.optional3 || !vendor.optional4) {
      throw new ErrorResponse(
        "Virtual account statement v2 configuration is missing",
        500
      );
    }

    const params = {
      account_number: trimmedAccountNumber,
      from: normalizedFrom,
      to: normalizedTo,
      page: page === undefined ? 0 : page,
    };
    if (trimmedCustomerId) params.customer_id = trimmedCustomerId;
    if (trimmedMobileNumber) params.mobile_number = trimmedMobileNumber;
    if (limit !== undefined) params.limit = limit;

    const response = await axios({
      method: "GET",
      url: `${vendor.apiUrl.replace(/\/$/, "")}/core_banking/money_transfer/get_statement`,
      headers: {
        ...payoutHeaders(vendor),
        accept: "application/json",
      },
      params,
    });

    return response?.data || {};
  } catch (error) {
    throw providerError(
      error,
      "Something went wrong while fetching virtual account statement"
    );
  }
};
