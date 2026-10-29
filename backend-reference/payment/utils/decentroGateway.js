const axios = require("axios");
const { fetchServiceDetails, findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");

const getVendorConfig = async ({ credentialId, corporateUserId, accessKey = "vendor_payouts" }) => {
  const service = await fetchServiceDetails({
    accessKey,
    credentialId,
    corporateUserId,
  });
  if (service.error) throw new Error(service.error);
  return service.vendor;
};

/**
 * Initiate a payout transfer via Decentro V3
 * https://docs.decentro.tech/reference/payments_api-initiate-payout-v3
 *
 * Headers map:
 *   optional1 = client_id
 *   optional2 = client_secret
 *   optional3 = module_secret
 *   optional4 = provider_secret
 *   optional5 = consumer_urn  (sender virtual account URN from Decentro)
 */
/**
 * Virtual & Escrow Accounts — Decentro V2 (read-only, fetched from Decentro)
 *
 * Vendor config (accessKey: "vendor_virtual_accounts"):
 *   optional1 = client_id
 *   optional2 = client_secret
 *   optional3 = module_secret
 */
const getVAVendorConfig = async ({ credentialId, corporateUserId }) =>
  getVendorConfig({ credentialId, corporateUserId, accessKey: "vendor_virtual_accounts" });

const vaHeaders = (vendor) => ({
  client_id: vendor.optional1,
  client_secret: vendor.optional2,
  module_secret: vendor.optional3,
  "Content-Type": "application/json",
});

exports.fetchVirtualAccounts = async ({ credentialId, corporateUserId }) => {
  try {
    const vendor = await getVAVendorConfig({ credentialId, corporateUserId });
    const response = await axios.get(
      `${vendor.apiUrl}/v2/payments/vpa`,
      { headers: vaHeaders(vendor) }
    );
    customLog(null, "info", { message: "Decentro fetchVirtualAccounts response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro fetchVirtualAccounts error", error: errData });
    throw new Error(errData?.message || "Failed to fetch virtual accounts from Decentro");
  }
};

exports.fetchEscrowAccounts = async ({ credentialId, corporateUserId }) => {
  try {
    const vendor = await getVAVendorConfig({ credentialId, corporateUserId });
    const response = await axios.get(
      `${vendor.apiUrl}/v2/payments/escrow`,
      { headers: vaHeaders(vendor) }
    );
    customLog(null, "info", { message: "Decentro fetchEscrowAccounts response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro fetchEscrowAccounts error", error: errData });
    throw new Error(errData?.message || "Failed to fetch escrow accounts from Decentro");
  }
};

/* F-PAY-20: Decentro VA creation is dead (replaced by NuPay). Commented out, not removed.
const DECENTRO_V3_BASE = "https://staging.api.decentro.tech";

const DECENTRO_VA_STAGING = {
  client_id: "pekoplatform_staging",
  client_secret: "REDACTED",
  master_consumer_urn: "6CB1490AEAE4458693F170E5C1713B4D",
};
*/


/**
 * Create a Virtual Account via Decentro V3
 * https://staging.api.decentro.tech/v2/banking/account/virtual
 */
/* F-PAY-20: dead Decentro VA creation (replaced by NuPay) — commented out, not removed.
exports.createVirtualAccount = async ({ referenceId, name, customerVaIdentifier, mobile, email, ifsc, generateStaticQr = false }) => {
  try {
    const reqBody = {
      reference_id: referenceId,
      name,
      consumer_urn: DECENTRO_VA_STAGING.master_consumer_urn,
      customer_va_identifier: customerVaIdentifier,
      ...(mobile && { mobile }),
      ...(email && { email }),
      ...(ifsc && { ifsc }),
      generate_static_qr: generateStaticQr,
    };

    const response = await axios.post(
      `${DECENTRO_V3_BASE}/v3/banking/account/virtual`,
      reqBody,
      {
        headers: {
          client_id: DECENTRO_VA_STAGING.client_id,
          client_secret: DECENTRO_VA_STAGING.client_secret,
          master_consumer_urn: DECENTRO_VA_STAGING.master_consumer_urn,
          "Content-Type": "application/json",
        },
      }
    );

    customLog(null, "info", { message: "Decentro createVirtualAccount response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro createVirtualAccount error", error: errData });
    throw new Error(errData?.message || "Failed to create virtual account via Decentro");
  }
};
*/

exports.deactivateVirtualAccount = async ({ vaNumber, name, pan }) => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const clientId = serviceDetails?.vendor?.optional1;
    const clientSecret = serviceDetails?.vendor?.optional2;
    const moduleSecret = serviceDetails?.vendor?.optional3;
    const providerSecret = serviceDetails?.vendor?.optional4;

    const response = await axios.put(
      `${apiUrl}/v2/banking/account/virtual/${vaNumber}`,
      { name, pan, is_active: false },
      {
        headers: {
          client_id: clientId,
          client_secret: clientSecret,
          module_secret: moduleSecret,
          provider_secret: providerSecret,
          'Content-Type': 'application/json',
        },
      }
    );
    customLog(null, 'info', { message: 'Decentro deactivateVirtualAccount response', data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, 'error', { message: 'Decentro deactivateVirtualAccount error', error: errData });
    throw new Error(errData?.message || 'Failed to deactivate virtual account via Decentro');
  }
};

exports.updateVirtualAccount = async ({ vaNumber, name, pan, email, mobile, address }) => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const clientId = serviceDetails?.vendor?.optional1;
    const clientSecret = serviceDetails?.vendor?.optional2;
    const moduleSecret = serviceDetails?.vendor?.optional3;
    const providerSecret = serviceDetails?.vendor?.optional4;

    const body = { action: 'update', name, pan };
    if (email)   body.email   = email;
    if (mobile)  body.mobile  = mobile;
    if (address) body.address = address;

    const response = await axios.put(
      `${apiUrl}/v2/banking/account/virtual/${vaNumber}`,
      body,
      {
        headers: {
          client_id:      clientId,
          client_secret:  clientSecret,
          module_secret:  moduleSecret,
          provider_secret: providerSecret,
          'Content-Type': 'application/json',
        },
      }
    );
    customLog(null, 'info', { message: 'Decentro updateVirtualAccount response', data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, 'error', { message: 'Decentro updateVirtualAccount error', error: errData });
    throw new Error(errData?.message || 'Failed to update virtual account via Decentro');
  }
};

exports.loadUnloadVirtualAccount = async ({
  credentialId,
  corporateUserId,
  referenceId,
  action,
  purpose,
  accountNumber,
  amount,
  bankReferenceNumber,
  transferType,
}) => {
  try {
    const vendor = await getVAVendorConfig({ credentialId, corporateUserId });
    const response = await axios.post(
      `${vendor.apiUrl}/v2/banking/virtual/account/update_balance`,
      {
        reference_id: referenceId,
        action,
        purpose,
        account_number: accountNumber,
        amount,
        bank_reference_number: bankReferenceNumber,
        transfer_type: transferType,
      },
      {
        headers: {
          client_id: vendor.optional1,
          client_secret: vendor.optional2,
          module_secret: vendor.optional3,
          provider_secret: vendor.optional4,
          'Content-Type': 'application/json',
        },
      }
    );
    customLog(null, 'info', { message: 'Decentro loadUnloadVirtualAccount response', data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, 'error', { message: 'Decentro loadUnloadVirtualAccount error', error: errData });
    throw new Error(errData?.message || 'Failed to load/unload virtual account via Decentro');
  }
};

exports.initiateTransfer = async ({
  credentialId,
  corporateUserId,
  referenceId,
  amount,
  transferType,
  virtualAccountNumber,
  beneficiaryDetails, // { name, accountNumber, ifscCode, upiId, email, mobile }
}) => {
  const vendor = await getVendorConfig({ credentialId, corporateUserId });
  const reqUrl = `${vendor.apiUrl}/core_banking/money_transfer/initiate`;

  if (process.env.NODE_ENV !== "production") {
    customLog(null, "info", { message: "Decentro initiateTransfer MOCKED (non-production)", referenceId });
    return {
      status: "success",
      decentroTxnId: "DECXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      responseCode: "S00000",
      data: {
        transferType: (transferType || "IMPS").toUpperCase(),
        bankReferenceNumber: "227715217094",
        beneficiaryName: beneficiaryDetails.name,
        newBalance: 281,
        providerResponse: "fundTransfer successfully processed",
        transactionStatus: "success",
      },
    };
  }

  try {
    const isUpi = (transferType || "NEFT").toUpperCase() === "UPI";
    const reqBody = {
      reference_id: referenceId,
      purpose_message: "Payout",
      from_account: virtualAccountNumber || vendor.optional6,
      transfer_type: (transferType || "NEFT").toUpperCase(),
      transfer_amount: String(amount),
      ...(isUpi
        ? { to_upi: beneficiaryDetails.upiId }
        // : { to_account: "123456789011", ifsc_code: "SBIN0001077" }),
        : { to_account: beneficiaryDetails.accountNumber, ifsc_code: beneficiaryDetails.ifscCode }),

      beneficiary_details: {
        payee_name: beneficiaryDetails.name,
        ...(!isUpi && beneficiaryDetails.ifscCode && { ifsc_code: "SBIN0001077" }),
        ...(beneficiaryDetails.email && { email_address: beneficiaryDetails.email }),
        ...(beneficiaryDetails.mobile && /^[6-9]\d{9}$/.test(beneficiaryDetails.mobile) && { mobile_number: beneficiaryDetails.mobile }),
      },
    };
  
    const response = await axios.post(reqUrl, reqBody, {
      headers: {
        client_id: vendor.optional1,
        client_secret: vendor.optional2,
        module_secret: vendor.optional3,
        provider_secret: vendor.optional4,
        "Content-Type": "application/json",
      },
    });
    
    customLog(null, "info", { message: "Decentro initiateTransfer response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro initiateTransfer error", error: errData });
    const errMessage = errData?.error?.message || errData?.message || errData?.response_key || "Failed to initiate transfer with Decentro";
    const err = new Error(errMessage);
    err.decentroError = errData;
    throw err;
  }
};

/**
 * Manage Beneficiary via Decentro V2
 * https://in.decentro.tech/v2/banking/beneficiary
 *
 * Vendor config (accessKey: "vendor_payouts"):
 *   optional1 = client_id
 *   optional2 = client_secret
 *   optional3 = module_secret
 *   optional4 = provider_secret
 *   optional5 = sender_account_number (virtual account)
 */
exports.manageBeneficiary = async ({
  credentialId,
  corporateUserId,
  action,
  accountNumber,
  ifscCode,
  upiHandle,
  transferType,
  name,
  email,
  mobile,
  beneficiaryCode,
  senderAccountNumber,
}) => {
  const vendor = await getVendorConfig({ credentialId, corporateUserId });
  const isUpi = action === "ADD" ? !ifscCode && !!upiHandle : !!upiHandle;
  const reqBody = {
    action,
    sender_account_number:senderAccountNumber || "D95357896657784368" ,
    ...(accountNumber && { account_number: accountNumber }),
    ...(ifscCode && { ifsc: ifscCode }),
    ...(upiHandle && { upi_handle: upiHandle }),
    ...(!isUpi && { transfer_type: transferType || "IMPS" }),
    ...(name && { name }),
    ...(email && { email }),
    ...(mobile && { mobile }),
    ...(beneficiaryCode && { beneficiary_code: beneficiaryCode }),
  };

  try {
    const response = await axios.post(
      `${vendor.apiUrl}/v2/banking/beneficiary`,
      reqBody,
      {
        headers: {
          client_id: vendor.optional1,
          client_secret: vendor.optional2,
          module_secret: vendor.optional3,
          provider_secret: vendor.optional4,
          "Content-Type": "application/json",
        },
      }
    );
    customLog(null, "info", { message: "Decentro manageBeneficiary response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro manageBeneficiary error", error: errData });
    const errMessage = errData?.message || errData?.response_key || "Failed to manage beneficiary with Decentro";
    const err = new Error(errMessage);
    err.decentroError = errData;
    throw err;
  }
};

/**
 * Load / Unload a Virtual Account via Decentro
 * https://docs.decentro.tech/reference/virtual_accounts_api-load-unload-va
 *
 * Vendor config (accessKey: "vendor_virtual_accounts") — same as fetchVirtualAccounts:
 *   optional1 = client_id
 *   optional2 = client_secret
 *   optional3 = module_secret
 */
const callLoadUnload = async ({
  credentialId,
  corporateUserId,
  referenceId,
  virtualAccountNumber,
  amount,
  transactionType, // "LOAD" | "UNLOAD"
  purposeMessage,
}) => {
  const vendor = await getVAVendorConfig({ credentialId, corporateUserId });
  const reqBody = {
    reference_id: referenceId,
    virtual_account_number: virtualAccountNumber,
    transaction_amount: String(amount),
    transaction_type: transactionType,
    ...(purposeMessage && { purpose_message: purposeMessage }),
  };

  try {
    const response = await axios.post(
      `${vendor.apiUrl}/v2/banking/account/virtual/load_unload`,
      reqBody,
      { headers: vaHeaders(vendor) }
    );
    customLog(null, "info", { message: `Decentro ${transactionType} VA response`, data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: `Decentro ${transactionType} VA error`, error: errData });
    const errMessage =
      errData?.error?.message ||
      errData?.message ||
      errData?.response_key ||
      `Failed to ${transactionType.toLowerCase()} virtual account via Decentro`;
    const err = new Error(errMessage);
    err.decentroError = errData;
    throw err;
  }
};

exports.loadVirtualAccount = async (params) =>
  callLoadUnload({ ...params, transactionType: "LOAD" });

exports.unloadVirtualAccount = async (params) =>
  callLoadUnload({ ...params, transactionType: "UNLOAD" });

exports.getVALoadUnloadStatus = async ({ credentialId, corporateUserId, referenceId }) => {
  const vendor = await getVAVendorConfig({ credentialId, corporateUserId });
  try {
    const response = await axios.get(
      `${vendor.apiUrl}/v2/banking/account/virtual/load_unload/status`,
      {
        params: { reference_id: referenceId },
        headers: vaHeaders(vendor),
      }
    );
    customLog(null, "info", { message: "Decentro getVALoadUnloadStatus response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro getVALoadUnloadStatus error", error: errData });
    const err = new Error(errData?.message || "Failed to fetch VA load/unload status from Decentro");
    err.decentroError = errData;
    throw err;
  }
};

exports.getTransferStatus = async ({ credentialId, corporateUserId, referenceId }) => {
  const vendor = await getVendorConfig({ credentialId, corporateUserId });
  console.log("Decentro payout getTransferStatus referenceId:", referenceId);
  try {
    const response = await axios.get(
      `${vendor.apiUrl}/core_banking/money_transfer/get_status`,
      {
        params: { reference_id: referenceId },
        headers: {
          client_id: vendor.optional1,
          client_secret: vendor.optional2,
          module_secret: vendor.optional3,
          provider_secret: vendor.optional4,
        },
      }
    );
    customLog(null, "info", { message: "Decentro getTransferStatus response", data: response.data });
    return response.data;
  } catch (error) {
    const errData = error?.response?.data || error.message;
    customLog(null, "error", { message: "Decentro getTransferStatus error", error: errData });
    throw new Error(errData?.message || "Failed to get transfer status from Decentro");
  }
};
