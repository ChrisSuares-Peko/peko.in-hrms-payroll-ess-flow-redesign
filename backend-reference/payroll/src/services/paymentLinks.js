const axios = require("axios");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../utils/error-response");
const operatorsData = require("../utils/operatorsData.json");

const { v4 } = require("uuid");
const { formatDateToYMD } = require("../utils/formatter");

const accessKey = operatorsData.paymentLinks.accessKey

let baseUrl = "http://localhost:5173";
if (process.env.NODE_ENV == "production") {
  baseUrl = process.env.PRODUCTION_URL;
} else {
  baseUrl = process.env.FRONTEND_STAGING_URL;
}

const ENACH_FREQUENCY_VALUES = [
  "Adhoc",
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Semi-Annually",
  "Yearly",
  "Bi-Monthly",
];

const ENACH_CATEGORY_CODE_VALUES = [
  "API",
  "B2B",
  "CRED",
  "MAND",
  "EDU",
  "PREM",
  "PAYM",
  "LONS",
  "LONP",
  "MF",
  "OTH",
  "SUB",
  "TRE",
  "TAX",
  "ELEC",
  "GAS",
  "TELE",
  "WAT",
];



const extractPaymentLinkUrl = (providerData = {}) => {
  if (providerData.upi_uris && typeof providerData.upi_uris === "object") {
    const uri = Object.values(providerData.upi_uris).find(
      (value) => typeof value === "string" && value.trim().length > 0
    );
    if (uri) {
      return uri;
    }
  }

  const fallbackKeys = [
    "payment_link",
    "paymentLink",
    "client_url",
    "short_url",
    "upi_uri",
    "intent_uri",
  ];

  for (const key of fallbackKeys) {
    const value = providerData?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};

const extractDynamicQrImage = (providerResponse = {}) => {
  const providerData = providerResponse?.data || {};
  const fallbackKeys = [
    "dynamic_qr_image",
    "dynamicQrImage",
    "qr_image",
    "qrImage",
    "qr_url",
    "qrUrl",
  ];

  for (const key of fallbackKeys) {
    const value = providerData?.[key] || providerResponse?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
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

  const trimmedValue = String(value || "").trim();
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

exports.createPaymentLink = async ({
  amount: rawAmount,
  purpose_message,
  expiry_time,
}) => {
  try {
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ErrorResponse("Valid amount is required", 400);
    }

    if (!purpose_message || String(purpose_message).trim().length === 0) {
      throw new ErrorResponse("purpose_message is required", 400);
    }

    const expiryTime = Number(expiry_time);
    if (!Number.isFinite(expiryTime) || expiryTime <= 0) {
      throw new ErrorResponse("Valid expires_time is required", 400);
    }

    // const serviceDetails = await resolveServiceDetails(accessKey);
    // if (!serviceDetails) {
    //   throw new ErrorResponse(
    //     "Apologies, the service you are trying to access is currently unavailable.",
    //     400
    //   );
    // }



    const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
    const apiUrl = serviceDetails?.vendor?.apiUrl
    const consumerUrn = serviceDetails?.vendor?.optional1
    const clientId = serviceDetails?.vendor?.optional2
    const clientSecret = serviceDetails?.vendor?.optional3
    const reference_id = v4()
    const redirect_url = `${baseUrl}/payment-link/success?reference_id=${reference_id}`

    if (!apiUrl || !consumerUrn || !clientId || !clientSecret) {
      throw new ErrorResponse("Payment link configuration is missing", 500);
    }

    const payload = {
      reference_id: reference_id,
      consumer_urn: consumerUrn,
      amount,
      purpose_message: String(purpose_message).trim(),
      expiry_time: expiryTime,
      redirect_url,
      generate_psp_uri: true
    };


    const config = {
      method: "POST",
      url: `${apiUrl.replace(/\/$/, "")}/v3/payments/upi/link`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    };

    const response = await axios(config);
    const providerData = response?.data?.data || {};
    const paymentLinkUrl = extractPaymentLinkUrl(providerData);

    if (!paymentLinkUrl) {
      throw new ErrorResponse("Payment link URL not returned by provider", 400);
    }

    return {
      paymentLink: paymentLinkUrl,
      reference_id,
      decentroTxnId: response?.data?.decentro_txn_id || null,
      transactionStatus:
        providerData?.transaction_status || response?.data?.status || "pending",
      providerResponse: response?.data || {},
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }



    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while generating payment link";

    throw new ErrorResponse(providerErrorMessage, 400);
  }
};

exports.createDynamicQr = async ({
  amount: rawAmount,
  purpose_message,
  expiry_time,
}) => {
  try {
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ErrorResponse("Valid amount is required", 400);
    }

    if (!purpose_message || String(purpose_message).trim().length === 0) {
      throw new ErrorResponse("purpose_message is required", 400);
    }

    const purposeMessage = String(purpose_message).trim();
    if (purposeMessage.length < 5 || purposeMessage.length > 50) {
      throw new ErrorResponse(
        "purpose_message must be between 5 and 50 characters",
        400
      );
    }

    const expiryTime = Number(expiry_time);
    if (!Number.isInteger(expiryTime) || expiryTime <= 0 || expiryTime > 1440) {
      throw new ErrorResponse(
        "expiry_time must be an integer between 1 and 1440",
        400
      );
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const consumerUrn = serviceDetails?.vendor?.optional1;
    const clientId = serviceDetails?.vendor?.optional2;
    const clientSecret = serviceDetails?.vendor?.optional3;
    const reference_id = v4();

    if (!apiUrl || !consumerUrn || !clientId || !clientSecret) {
      throw new ErrorResponse("Dynamic QR configuration is missing", 500);
    }

    const payload = {
      reference_id,
      consumer_urn: consumerUrn,
      amount,
      purpose_message: purposeMessage,
      expiry_time: expiryTime,
      generate_custom_qr_image: false,
    };

    const response = await axios({
      method: "POST",
      url: `${apiUrl.replace(/\/$/, "")}/v3/payments/upi/qr`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    });

    const providerResponse = response?.data || {};
    const providerData = providerResponse?.data || {};
    const dynamicQrImage = extractDynamicQrImage(providerResponse);

    if (!dynamicQrImage) {
      throw new ErrorResponse("Dynamic QR image not returned by provider", 400);
    }

    return {
      dynamic_qr_image: dynamicQrImage,
      reference_id:
        providerData?.reference_id || providerResponse?.reference_id || reference_id,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerData?.decentro_txn_id ||
        providerData?.decentro_transaction_id ||
        null,
      transaction_status:
        providerData?.transaction_status ||
        providerResponse?.transaction_status ||
        providerResponse?.status ||
        "PENDING",
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }

    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while generating dynamic QR";

    throw new ErrorResponse(providerErrorMessage, 400);
  }
};

exports.issueUpiCollectRequest = async ({
  payer_upi,
  amount: rawAmount,
  purpose_message,
  expiry_time,
  payer_name
}) => {
  try {
    if (!payer_upi || String(payer_upi).trim().length === 0) {
      throw new ErrorResponse("payer_upi is required", 400);
    }



    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ErrorResponse("Valid amount is required", 400);
    }

    if (!purpose_message || String(purpose_message).trim().length === 0) {
      throw new ErrorResponse("purpose_message is required", 400);
    }

    const expiryTime = Number(expiry_time);
    if (!Number.isFinite(expiryTime) || expiryTime <= 0) {
      throw new ErrorResponse("Valid expiry_time is required", 400);
    }

    // Hardcoded config -- update as needed for staging/production
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
    const apiUrl = serviceDetails?.vendor?.apiUrl
    const consumerUrn = serviceDetails?.vendor?.optional1
    const clientId = serviceDetails?.vendor?.optional2
    const clientSecret = serviceDetails?.vendor?.optional3
    const referenceId = v4();

    if (!apiUrl || !clientId || !clientSecret) {
      throw new ErrorResponse("Collect request configuration is missing", 500);
    }

    const payload = {
      reference_id: referenceId,
      payer_vpa: String(payer_upi).trim(),
      payer_name,
      amount,
      purpose_message: String(purpose_message).trim(),
      expiry_time: expiryTime,
      consumer_urn: consumerUrn
    };

    const config = {
      method: "POST",
      url: `${apiUrl.replace(/\/$/, "")}/v3/payments/upi/collect`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    };

    const response = await axios(config);
    const providerResponse = response?.data || {};

    return {
      reference_id: referenceId,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      status: providerResponse?.status || null,
      response_code: providerResponse?.response_code || null,
      message: providerResponse?.message || null,
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while creating collect request";

    throw new ErrorResponse(providerErrorMessage, 400);
  }
};

exports.createVirtualAccountV3 = async ({
  customer_va_identifier,
  name
}) => {
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
  const apiUrl = serviceDetails?.vendor?.apiUrl
  const consumerUrn = serviceDetails?.vendor?.optional1
  const clientId = serviceDetails?.vendor?.optional2
  const clientSecret = serviceDetails?.vendor?.optional3
  const referenceId = v4()

  try {

    if (!name || String(name).trim().length === 0) {
      throw new ErrorResponse("name is required", 400);
    }


    const payload = {
      reference_id: referenceId,
      consumer_urn: consumerUrn,
      customer_va_identifier,
      name
    };



    const config = {
      method: "POST",
      url: `${apiUrl}/v3/banking/account/virtual`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    };

    const response = await axios(config);
    const providerResponse = response?.data || {};

    return {
      status: providerResponse?.status || null,
      response_code: providerResponse?.response_code || null,
      message: providerResponse?.message || null,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      data: providerResponse?.data || null,
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }

    if (customer_va_identifier && String(customer_va_identifier).trim().length > 0) {
      try {
        const detailsResponse = await axios({
          method: "GET",
          url: `${apiUrl}/v3/banking/account/virtual`,
          headers: {
            "Content-Type": "application/json",
            client_id: clientId,
            client_secret: clientSecret,
          },
          params: {
            customer_va_identifier: String(customer_va_identifier).trim(),
            page: 1
          },
        });

        const providerResponse = detailsResponse?.data || {};
        return {
          status: providerResponse?.status || null,
          response_code: providerResponse?.response_code || null,
          message: providerResponse?.message || "Fetched virtual account details",
          decentro_txn_id:
            providerResponse?.decentro_txn_id ||
            providerResponse?.decentro_transaction_id ||
            null,
          data: { account_details: providerResponse?.data?.virtual_accounts } || null,
          providerResponse,
          fetchedFrom: "get_virtual_account_details",
        };
      } catch (detailsError) {
        const detailsErrorMessage =
          detailsError?.response?.data?.message ||
          detailsError?.response?.data?.error?.message;
        if (detailsErrorMessage) {
          throw new ErrorResponse(detailsErrorMessage, 400);
        }
      }
    }

    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while creating virtual account";

    throw new ErrorResponse(providerErrorMessage, 400);
  }
};

exports.createVirtualAccountV2 = async ({
  customer_id,
  name,
  pan,
  mobile,
}) => {
  const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts")
  const apiUrl = serviceDetails?.vendor?.apiUrl
  // const consumerUrn = serviceDetails?.vendor?.optional1
  const clientId = serviceDetails?.vendor?.optional1
  const clientSecret = serviceDetails?.vendor?.optional2
  const moduleSecret = serviceDetails?.vendor?.optional3
  // const referenceId = v4()

  try {

    if (!name || String(name).trim().length === 0) {
      throw new ErrorResponse("name is required", 400);
    }


    const payload = {
      bank_codes: [
        "YESB"
      ],
      // consumer_urn: consumerUrn,
      customer_id,
      name,
      pan,
      mobile,
      kyc_verified: 1,
      kyc_check_decentro: 0
    };



    const config = {
      method: "POST",
      url: `${apiUrl}/v2/banking/account/virtual`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
        module_secret: moduleSecret
      },
      data: payload,
    };

    const response = await axios(config);
    const providerResponse = response?.data || {};

    // Return shaped object so we can destructure in controller like:
    // const { virtualAccountNumber, virtualIfsc, ... } = result.data
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
        account_details: [{
          virtual_account_number: selectedData.accountNumber || null,
          virtual_account_ifsc: selectedData.ifsc || null,
          ...selectedData,
        }]
      },
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }

    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while creating virtual account";

    throw new ErrorResponse(providerErrorMessage, 400);
  }
};

exports.registerEnachMandate = async ({
  customer_name,
  customer_phone,
  customer_email,
  account_number,
  account_type,
  bank_code,
  authentication_mode,
  start_date,
  end_date,
  amount: rawAmount,
  amount_rule,
  category_code,
  frequency,
}) => {
  //   {
  //     "reference_id": "sjfsdnkjf4859tirefj121125",
  //     "consumer_urn": "6CB1490AEAE4458693F170E5C1713B4D",
  //     "start_date": "2026-04-01",
  //     "end_date": "2027-03-01",
  //     "amount": 200,
  //     "amount_rule": "max",
  //     "category_code": "Sub",
  //     "frequency": "Adhoc",
  //     "redirection_url": "https://www.decentro.tech",
  //     "uistream":true
  // }

    if (!customer_name || String(customer_name).trim().length === 0) {
      throw new ErrorResponse("customer_name is required", 400);
    }

    if (!customer_phone || String(customer_phone).trim().length === 0) {
      throw new ErrorResponse("customer_phone is required", 400);
    }

    if (!account_number || String(account_number).trim().length === 0) {
      throw new ErrorResponse("account_number is required", 400);
    }

    if (!account_type || String(account_type).trim().length === 0) {
      throw new ErrorResponse("account_type is required", 400);
    }

    if (!bank_code || String(bank_code).trim().length === 0) {
      throw new ErrorResponse("bank_code is required", 400);
    }

    if (!authentication_mode || String(authentication_mode).trim().length === 0) {
      throw new ErrorResponse("authentication_mode is required", 400);
    }

    if (!start_date || String(start_date).trim().length === 0) {
      throw new ErrorResponse("start_date is required", 400);
    }

    if (!end_date || String(end_date).trim().length === 0) {
      throw new ErrorResponse("end_date is required", 400);
    }
    // Format start_date and end_date to YYYY-MM-DD string format if they are Date objects

    start_date = formatDateToYMD(start_date);
    end_date = formatDateToYMD(end_date);

    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ErrorResponse("Valid amount is required", 400);
    }

    if (!amount_rule || String(amount_rule).trim().length === 0) {
      throw new ErrorResponse("amount_rule is required", 400);
    }
    const amountRuleKey = String(amount_rule).trim().toLowerCase();
    const normalizedAmountRule = ["fixed", "max"].includes(amountRuleKey)
      ? amountRuleKey
      : null;
    if (!normalizedAmountRule) {
      throw new ErrorResponse("amount_rule must be fixed or max", 400);
    }

    if (!category_code || String(category_code).trim().length === 0) {
      throw new ErrorResponse("category_code is required", 400);
    }
    const normalizedCategoryCode = String(category_code).trim().toUpperCase();
    if (!ENACH_CATEGORY_CODE_VALUES.includes(normalizedCategoryCode)) {
      throw new ErrorResponse("Invalid category_code value", 400);
    }

    if (!frequency || String(frequency).trim().length === 0) {
      throw new ErrorResponse("frequency is required", 400);
    }
    const normalizedFrequency = ENACH_FREQUENCY_VALUES.find(
      (item) => item.toUpperCase() === String(frequency).trim().toUpperCase()
    );
    if (!normalizedFrequency) {
      throw new ErrorResponse("Invalid frequency value", 400);
    }



    const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
    const apiUrl = serviceDetails?.vendor?.apiUrl
    const consumerUrn = serviceDetails?.vendor?.optional1
    const clientId = serviceDetails?.vendor?.optional2
    const clientSecret = serviceDetails?.vendor?.optional3
    const referenceId = v4();
    const authModeLookup = {
      debitcard: "DebitCard",
      netbanking: "NetBanking",
      aadhar: "Aadhaar",
      aadhaar: "Aadhaar",
      pan: "PAN",
      customerid: "CustomerID",
    };
    const normalizedAuthModeKey = String(authentication_mode)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
    const normalizedAuthenticationMode =
      authModeLookup[normalizedAuthModeKey] || String(authentication_mode).trim();
    const redirect_url = `${baseUrl}/enach-mandate/success?reference_id=${referenceId}`


    const payload = {
      reference_id: String(referenceId),
      consumer_urn: String(consumerUrn),
      user: {
        name: String(customer_name).trim(),
        account_number: String(account_number).trim(),
        account_type: String(account_type).trim().toUpperCase(),
        reference_number: "decentro-mandate",
        bank_code: String(bank_code).trim().toUpperCase(),
        email: customer_email ? String(customer_email).trim() : undefined,
        mobile: String(customer_phone).trim(),
      },
      start_date: String(start_date).trim(),
      end_date: String(end_date).trim(),
      amount,
      amount_rule: normalizedAmountRule,
      category_code: normalizedCategoryCode,
      frequency: normalizedFrequency,
      // uistream:true,
      authentication_mode: normalizedAuthenticationMode,
      redirection_url: redirect_url
    };
    console.log(payload)
    Object.keys(payload.user).forEach((key) => {
      if (payload.user[key] === undefined) {
        delete payload.user[key];
      }
    });

    const config = {
      method: "POST",
      url: `${apiUrl}/v3/payments/enach/mandate`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    };

    const response = await axios(config);
    const providerResponse = response?.data || {};

    return {
      reference_id: referenceId,
      status: providerResponse?.api_status || providerResponse?.status || null,
      mandate_status: providerResponse?.data?.mandate_status || null,
      mandate_link: providerResponse?.data?.page_link || null,
      response_code: providerResponse?.response_code || providerResponse?.response_key || null,
      message: providerResponse?.message || null,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      data: providerResponse?.data || null,
      providerResponse,
    };

};



exports.validateBankAccount = async () => {
  try {

    // if (!account_number || String(account_number).trim().length === 0) {
    //   throw new ErrorResponse("account_number is required", 400);
    // }
    // if (!ifsc || String(ifsc).trim().length === 0) {
    //   throw new ErrorResponse("ifsc is required", 400);
    // }

    // const allowedValidationTypes = ["penniless", "pennydrop", "hybrid"];
    // const normalizedValidationType = String(validation_type || "")
    //   .trim()
    //   .toLowerCase();
    // if (!allowedValidationTypes.includes(normalizedValidationType)) {
    //   throw new ErrorResponse(
    //     "validation_type must be one of penniless, pennydrop, hybrid",
    //     400
    //   );
    // }

    // const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    // const apiUrl = "https://in.staging.decentro.tech";
    // const consumerUrn = serviceDetails?.vendor?.optional1;
    // const clientId = serviceDetails?.vendor?.optional2;
    // const clientSecret = serviceDetails?.vendor?.optional3;
    const referenceId = v4().replace(/-/g, "");
    // const performNameMatch = !!name;

    // if (!apiUrl || !consumerUrn || !clientId || !clientSecret) {
    //   throw new ErrorResponse("Bank validation configuration is missing", 500);
    // }

    // const payload = {
    //   reference_id: referenceId,
    //   purpose_message: String(purpose_message).trim(),
    //   consumer_urn: consumerUrn,
    //   validation_type: normalizedValidationType,
    //   perform_name_match: performNameMatch,
    //   beneficiary_details: {
    //     ...(name && { name: String(name).trim() }),
    //     account_number: String(account_number).trim(),
    //     ifsc: String(ifsc).trim().toUpperCase(),
    //     ...(mobile && { mobile_number: String(mobile).trim() }),
    //   },
    // };

    // const response = await axios({
    //   method: "POST",
    //   url: `${apiUrl.replace(/\/$/, "")}/v3/banking/money_transfer/validate_bank_account`,
    //   headers: {
    //     "Content-Type": "application/json",
    //     client_id: clientId,
    //     client_secret: clientSecret,
    //   },
    //   data: payload,
    // });

    const providerResponse = {
      "decentro_txn_id": "78C85EDB672A4187B99431CA85EFC604",
      "api_status": "SUCCESS",
      "response_key": "success_validation_initiated",
      "message": "Account validation was initaited successfully",
      "data": {
        "beneficiary_name": "someone",
        "account_status": "valid",
        "validation_type": "penniless",
        "validation_message": "Status pending"
      }
    } || {};
    const providerData = providerResponse?.data || {};
    const apiStatus = String(providerResponse?.api_status || "").toLowerCase();
    const accountStatusRaw = providerData?.account_status || null;
    const accountStatusLower = String(accountStatusRaw || "").toLowerCase();
    const accountValid = apiStatus === "success" && accountStatusLower === "valid";

    return {
      status: apiStatus === "success",
      valid: accountValid,
      accountValid,
      accountStatus: accountStatusRaw,
      beneficiaryName: providerData?.beneficiary_name || null,
      nameMatchPercentage:
        typeof providerData?.name_match_percentage === "number"
          ? providerData.name_match_percentage
          : null,
      validationType: providerData?.validation_type || null,
      validationMessage: providerData?.validation_message || null,
      bankReferenceNumber: providerData?.bank_reference_number || null,
      decentroTxnId: providerResponse?.decentro_txn_id || null,
      responseKey: providerResponse?.response_key || null,
      message:
        providerResponse?.message ||
        providerData?.validation_message ||
        (accountValid
          ? "Bank account validated successfully"
          : "Bank account validation failed"),
      reference_id: referenceId,
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }

    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Something went wrong while validating bank account";

    return {
      status: false,
      valid: false,
      accountValid: false,
      message: providerErrorMessage,
      providerResponse: error?.response?.data || null,
    };
  }
};

exports.getTransactionStatus = async (reference_id) => {
  if (!reference_id) {
    throw new Error("reference_id is required");
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey)
  const apiUrl = serviceDetails?.vendor?.apiUrl
  const clientId = serviceDetails?.vendor?.optional2
  const clientSecret = serviceDetails?.vendor?.optional3

  const config = {
    method: "GET",
    url: `${apiUrl}/v3/payments/transaction/status`,
    params: {
      reference_id,
    },
    headers: {
      client_id: clientId,
      client_secret: clientSecret,
      accept: "application/json",
    },
  };

  const response = await axios(config);
  return response.data;
};

exports.getEnachMandateRegistrationStatus = async ({
  decentro_txn_id,
  decentro_mandate_id,
} = {}) => {
  const decentroTxnId = decentro_txn_id ? String(decentro_txn_id).trim() : "";
  const decentroMandateId = decentro_mandate_id
    ? String(decentro_mandate_id).trim()
    : "";

  if (!decentroTxnId && !decentroMandateId) {
    throw new ErrorResponse(
      "Either decentro_txn_id or decentro_mandate_id is required",
      400
    );
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const apiUrl = serviceDetails?.vendor?.apiUrl;
  const clientId = serviceDetails?.vendor?.optional2;
  const clientSecret = serviceDetails?.vendor?.optional3;

  const params = {};
  if (decentroTxnId) {
    params.decentro_txn_id = decentroTxnId;
  }
  if (decentroMandateId) {
    params.decentro_mandate_id = decentroMandateId;
  }

  const config = {
    method: "GET",
    url: `${apiUrl}/v3/payments/enach/mandate/status`,
    params,
    headers: {
      client_id: clientId,
      client_secret: clientSecret,
      accept: "application/json",
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while fetching ENACH mandate status";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.manageEnachMandate = async ({
  action = "CANCEL",
  decentro_mandate_id,
} = {}) => {
  const normalizedAction = String(action || "").trim().toUpperCase();
  const decentroMandateId = decentro_mandate_id
    ? String(decentro_mandate_id).trim()
    : "";

  if (!normalizedAction) {
    throw new ErrorResponse("action is required", 400);
  }

  if (!decentroMandateId) {
    throw new ErrorResponse("decentro_mandate_id is required", 400);
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const apiUrl = serviceDetails?.vendor?.apiUrl;
  const clientId = serviceDetails?.vendor?.optional2;
  const clientSecret = serviceDetails?.vendor?.optional3;
  const reference_id = v4();

  const payload = {
    reference_id,
    action: normalizedAction,
    decentro_mandate_id: decentroMandateId,
  };

  try {
    const response = await axios({
      method: "POST",
      url: `${apiUrl}/v3/payments/enach/mandate/manage`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    });

    const providerResponse = response?.data || {};
    if (String(providerResponse?.api_status || "").toUpperCase() === "FAILURE") {
      throw new ErrorResponse(
        providerResponse?.message || "Failed to manage ENACH mandate",
        400
      );
    }

    return {
      reference_id,
      status: providerResponse?.api_status || providerResponse?.status || null,
      mandate_status: providerResponse?.data?.mandate_status || null,
      mandate_status_description:
        providerResponse?.data?.mandate_status_description || null,
      decentro_mandate_id:
        providerResponse?.data?.decentro_mandate_id || decentroMandateId,
      response_key: providerResponse?.response_key || null,
      message: providerResponse?.message || null,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while managing ENACH mandate";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.executeEnachMandate = async ({
  amount: rawAmount,
  decentro_mandate_id,
  debit_date,
  split_settlement_rule_urn,
  reference_id,
} = {}) => {
  const amount = Number(rawAmount);
  const decentroMandateId = decentro_mandate_id
    ? String(decentro_mandate_id).trim()
    : "";
  const executionReferenceId = reference_id
    ? String(reference_id).trim()
    : v4();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ErrorResponse("Valid amount is required", 400);
  }

  if (!decentroMandateId) {
    throw new ErrorResponse("decentro_mandate_id is required", 400);
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const apiUrl = serviceDetails?.vendor?.apiUrl;
  const clientId = serviceDetails?.vendor?.optional2;
  const clientSecret = serviceDetails?.vendor?.optional3;

  const payload = {
    reference_id: executionReferenceId,
    decentro_mandate_id: decentroMandateId,
    amount,
  };

  if (debit_date) {
    payload.debit_date = String(formatDateToYMD(debit_date)).trim();
  }

  if (split_settlement_rule_urn && String(split_settlement_rule_urn).trim()) {
    payload.split_settlement_rule_urn = String(split_settlement_rule_urn).trim();
  }

  try {
    const response = await axios({
      method: "POST",
      url: `${apiUrl}/v3/payments/enach/mandate/execute`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
    });

    const providerResponse = response?.data || {};
    if (String(providerResponse?.api_status || "").toUpperCase() === "FAILURE") {
      throw new ErrorResponse(
        providerResponse?.message || "Failed to execute ENACH mandate",
        400
      );
    }

    return {
      reference_id: executionReferenceId,
      status:
        providerResponse?.data?.transaction_status ||
        providerResponse?.status ||
        providerResponse?.api_status ||
        "INITIATED",
      message: providerResponse?.message || null,
      decentro_mandate_id:
        providerResponse?.data?.decentro_mandate_id || decentroMandateId,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        providerResponse?.data?.decentro_txn_id ||
        null,
      payment_date:
        providerResponse?.data?.debit_date ||
        providerResponse?.data?.payment_date ||
        payload.debit_date ||
        null,
      split_settlement_rule_urn:
        providerResponse?.data?.split_settlement_rule_urn ||
        payload.split_settlement_rule_urn ||
        null,
      response_key: providerResponse?.response_key || null,
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while executing ENACH mandate";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.getVirtualAccountBalance = async ({ virtualAccountNumber }) => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const clientId = serviceDetails?.vendor?.optional2;
    const clientSecret = serviceDetails?.vendor?.optional3;

    if (!apiUrl || !clientId || !clientSecret) {
      throw new ErrorResponse("Virtual account balance configuration is missing", 500);
    }

    const response = await axios({
      method: "GET",
      url: `${apiUrl.replace(/\/$/, "")}/v3/banking/balance`,
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        accept: "application/json",
      },
      params: {
        account_number: virtualAccountNumber,
      },
    });

    return response?.data || {};
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while fetching virtual account balance";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.getVirtualAccountBalanceV2 = async ({
  accountNumber,
  customerId,
  mobileNumber,
}) => {
  try {
    const trimmedAccountNumber = String(accountNumber || "").trim();
    const trimmedCustomerId = String(customerId || "").trim();
    const trimmedMobileNumber = String(mobileNumber || "").trim();

    if (!trimmedAccountNumber) {
      throw new ErrorResponse("accountNumber is required", 400);
    }

    if (!trimmedCustomerId && !trimmedMobileNumber) {
      throw new ErrorResponse(
        "Either customerId or mobileNumber is required",
        400
      );
    }

    const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const clientId = serviceDetails?.vendor?.optional1;
    const clientSecret = serviceDetails?.vendor?.optional2;
    const moduleSecret = serviceDetails?.vendor?.optional3;
    const providerSecret = serviceDetails?.vendor?.optional4;
    console.log(serviceDetails, "vendor.optional6");
    if (!apiUrl || !clientId || !clientSecret || !moduleSecret || !providerSecret) {
      throw new ErrorResponse(
        "Virtual account balance v2 configuration is missing",
        500
      );
    }

    const params = {
      account_number: trimmedAccountNumber,
    };

    if (trimmedCustomerId) {
      params.customer_id = trimmedCustomerId;
    }

    // if (trimmedMobileNumber) {
    //   params.mobile_number = trimmedMobileNumber;
    // }

    const response = await axios({
      method: "GET",
      url: `${apiUrl.replace(/\/$/, "")}/core_banking/money_transfer/get_balance`,
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        module_secret: moduleSecret,
        provider_secret: providerSecret,
        accept: "application/json",
      },
      params,
    });

    return response?.data || {};
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while fetching virtual account balance";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.getVirtualAccountStatement = async ({
  virtualAccountNumber,
  from,
  to,
  page,
}) => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const consumerUrn = serviceDetails?.vendor?.optional1;
    const clientId = serviceDetails?.vendor?.optional2;
    const clientSecret = serviceDetails?.vendor?.optional3;

    if (!apiUrl || !consumerUrn || !clientId || !clientSecret) {
      throw new ErrorResponse(
        "Virtual account statement configuration is missing",
        500
      );
    }
    console.log(virtualAccountNumber)
    const response = await axios({
      method: "GET",
      url: `${apiUrl}/v3/banking/account/statement`,
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        accept: "application/json",
      },
      params: {
        consumer_urn: consumerUrn,
        virtual_account_number: virtualAccountNumber,
        from,
        to,
        page,
      },
    });

    return response?.data || {};
  } catch (error) {
    console.log(error.response.data)
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while fetching virtual account statement";

    throw new ErrorResponse(providerErrorMessage, statusCode);
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
    const trimmedVirtualAccountNumber = String(virtualAccountNumber || "").trim();
    const trimmedSettlementAccountNumber = String(
      settlementAccountNumber || ""
    ).trim();
    const normalizedSettlementAccountIfsc = String(
      settlementAccountIfsc || ""
    )
      .trim()
      .toUpperCase();
    const trimmedSettlementAccountName = String(
      settlementAccountName || ""
    ).trim();
    const resolvedReferenceId = String(referenceId || v4()).trim();

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

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const consumerUrn = serviceDetails?.vendor?.optional1;
    const clientId = serviceDetails?.vendor?.optional2;
    const clientSecret = serviceDetails?.vendor?.optional3;

    if (!apiUrl || !consumerUrn || !clientId || !clientSecret) {
      throw new ErrorResponse(
        "Settlement account configuration is missing",
        500
      );
    }

    const payload = {
      reference_id: resolvedReferenceId,
      consumer_urn: consumerUrn,
      action: "ACTIVATE",
      virtual_account_number: trimmedVirtualAccountNumber,
      settlement_account_number: trimmedSettlementAccountNumber,
      settlement_account_ifsc: normalizedSettlementAccountIfsc,
      settlement_account_name: trimmedSettlementAccountName,
    };

    const response = await axios({
      method: "POST",
      url: `${apiUrl}/v3/banking/settlement_account_setup`,
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      data: payload,
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
    if (error instanceof ErrorResponse) {
      throw error;
    }

    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while adding settlement account";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.createSettlement = async () => {
  try {
    const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const clientId = serviceDetails?.vendor?.optional1;
    const clientSecret = serviceDetails?.vendor?.optional2;
    const moduleSecret = serviceDetails?.vendor?.optional3;
    const providerSecret = serviceDetails?.vendor?.optional4;

    if (
      !apiUrl ||
      !clientId ||
      !clientSecret ||
      !moduleSecret ||
      !providerSecret
    ) {
      throw new ErrorResponse("Settlement configuration is missing", 500);
    }

    const response = await axios({
      method: "GET",
      url: `${apiUrl.replace(/\/$/, "")}/v2/banking/account/virtual/balance_settlement`,
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        module_secret: moduleSecret,
        provider_secret: providerSecret,
        accept: "application/json",
      },
    });

    const providerResponse = response?.data || {};

    return {
      status: providerResponse?.status || null,
      response_code:
        providerResponse?.response_code || providerResponse?.response_key || null,
      message: providerResponse?.message || null,
      decentro_txn_id:
        providerResponse?.decentro_txn_id ||
        providerResponse?.decentro_transaction_id ||
        null,
      data: providerResponse?.data || null,
      providerResponse,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }

    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while creating settlement";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

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
    const trimmedAccountNumber = String(accountNumber || "").trim();
    const trimmedCustomerId = String(customerId || "").trim();
    const trimmedMobileNumber = String(mobileNumber || "").trim();
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

    const serviceDetails = await findServiceOperatorByAccessKey("vendor_payouts");
    const apiUrl = serviceDetails?.vendor?.apiUrl;
    const clientId = serviceDetails?.vendor?.optional1;
    const clientSecret = serviceDetails?.vendor?.optional2;
    const moduleSecret = serviceDetails?.vendor?.optional3;
    const providerSecret = serviceDetails?.vendor?.optional4;

    if (!apiUrl || !clientId || !clientSecret || !moduleSecret || !providerSecret) {
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
      url: `${apiUrl.replace(/\/$/, "")}/core_banking/money_transfer/get_statement`,
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        module_secret: moduleSecret,
        provider_secret: providerSecret,
        accept: "application/json",
      },
      params,
    });

    return response?.data || {};
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while fetching virtual account statement";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

exports.getEnachMandateExecutionStatus = async ({
  reference_id,
  decentro_txn_id,
  decentro_mandate_id,
} = {}) => {
  const executionReferenceId = reference_id ? String(reference_id).trim() : "";
  const decentroTxnId = decentro_txn_id ? String(decentro_txn_id).trim() : "";
  const decentroMandateId = decentro_mandate_id
    ? String(decentro_mandate_id).trim()
    : "";

  if (!executionReferenceId && !decentroTxnId) {
    throw new ErrorResponse(
      "Either reference_id or decentro_txn_id is required",
      400
    );
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const apiUrl = serviceDetails?.vendor?.apiUrl;
  const clientId = serviceDetails?.vendor?.optional2;
  const clientSecret = serviceDetails?.vendor?.optional3;

  const params = {};
  if (executionReferenceId) params.reference_id = executionReferenceId;
  if (decentroTxnId) params.decentro_txn_id = decentroTxnId;
  if (decentroMandateId) params.decentro_mandate_id = decentroMandateId;

  try {
    const response = await axios({
      method: "GET",
      url: `${apiUrl}/v3/payments/enach/mandate/execute/status`,
      params,
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        accept: "application/json",
      },
    });

    return response?.data;
  } catch (error) {
    const statusCode = error?.response?.status || 400;
    const providerErrorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.message ||
      "Something went wrong while fetching ENACH execution status";

    throw new ErrorResponse(providerErrorMessage, statusCode);
  }
};

const decentroGateway = require("../utils/decentroGateway");

exports.createVirtualAccount = decentroGateway.createVirtualAccount;
exports.createVirtualAccountV2 = decentroGateway.createVirtualAccountV2;
exports.fetchVirtualAccounts = decentroGateway.fetchVirtualAccounts;
exports.fetchEscrowAccounts = decentroGateway.fetchEscrowAccounts;
exports.initiateTransfer = decentroGateway.initiateTransfer;
exports.getTransferStatus = decentroGateway.getTransferStatus;
exports.manageBeneficiary = decentroGateway.manageBeneficiary;
exports.getVirtualAccountBalanceV2 = decentroGateway.getVirtualAccountBalanceV2;
exports.addSettlementAccount = decentroGateway.addSettlementAccount;
exports.createSettlement = decentroGateway.createSettlement;
exports.decentroSettlementToMVA = decentroGateway.decentroSettlementToMVA;
exports.getVirtualAccountStatementV2 = decentroGateway.getVirtualAccountStatementV2;
