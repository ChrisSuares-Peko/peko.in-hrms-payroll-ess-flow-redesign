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

const DECENTRO_V3_BASE = "https://staging.api.decentro.tech";

// TODO: Remove hardcoded credentials once DB vendor config is set up
// VA credentials are separate from payout credentials
const DECENTRO_VA_STAGING = {
  client_id: "pekoplatform_staging",
  client_secret: "REDACTED",
  master_consumer_urn: "6CB1490AEAE4458693F170E5C1713B4D",
};


/**
 * Create a Virtual Account via Decentro V3
 * https://staging.api.decentro.tech/v2/banking/account/virtual
 */
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

exports.initiateTransfer = async ({
  referenceId,
  amount,
  transferType,
  beneficiaryDetails, // { name, accountNumber, ifscCode, upiId, email, mobile }
}) => {
  const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
  const vendor = serviceDetails?.vendor
  const reqUrl = `${serviceDetails?.vendor?.apiUrl}/core_banking/money_transfer/initiate`;
  console.log("Decentro payout initiateTransfer reqUrl:", reqUrl);
  try {
    const isUpi = (transferType || "NEFT").toUpperCase() === "UPI";
    const reqBody = {
      reference_id: referenceId,
      purpose_message: "Settlement",
      from_account: vendor.optional6,
      transfer_type: (transferType || "NEFT").toUpperCase(),
      transfer_amount: String(amount),
      ...(isUpi
        ? { to_upi: beneficiaryDetails.upiId }
        : { to_account: "123456789011", ifsc_code: "SBIN0001077" }),
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

exports.decentroSettlementToMVA = async ()=>{
  const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
  const vendor = serviceDetails?.vendor
  try {
    const response = await axios.get(
      `${vendor.apiUrl}/v2/banking/account/virtual/balance_settlement`,
      {
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
}
