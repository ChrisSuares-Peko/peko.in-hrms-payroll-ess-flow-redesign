const axios = require("axios");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");
const { customLog } = require("../../utils/loggerHelper");
const { generateRequestId, encrypt } = require("../../utils/billPayments_utils");
const { decrypt } = require("../../utils/encryptionUtils");
// const { callExternalApiWithAuth } = require("./whitelistIpByPass");

exports.billValidationApi = async (config, jsonPayload, logTraceId = null) => {
  try {
    const requestId = generateRequestId();
    const apiBaseUrl = config.apiUrl;
    const encryptionKey = config.optional4;
    if (!encryptionKey) throw new Error("Encryption key not configured");

    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billValidationRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);
    const data = {
      accessCode: config.optional3,
      requestId,
      encRequest,
      ver: config.optional2,
      instituteId: config.optional1,
    };
    const parameters = new URLSearchParams(data).toString();

    customLog(logTraceId, "info", { message: "XML PAYLOAD billValidation", requestId, xmlPayload }, "VENDOR");
    const response = await axios({
      method: "POST",
      url: `${apiBaseUrl}billpay/extBillValCntrl/billValidationRequest/xml`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    });

    const rawData = response.data;
    let decryptedResponse;
    // Vendor occasionally returns plain XML for compliance errors (e.g. BVR008 — zero/negative bill)
    // instead of the usual encrypted payload; detect and skip decryption in that case.
    if (typeof rawData === "string" && rawData.trimStart().startsWith("<")) {
      decryptedResponse = rawData;
    } else {
      let encryptedData = rawData;
      if (typeof encryptedData !== "string") {
        encryptedData = typeof encryptedData === "object" && encryptedData !== null
          ? encryptedData.response || encryptedData.data || JSON.stringify(encryptedData)
          : String(encryptedData);
      }
      decryptedResponse = decrypt(encryptedData, encryptionKey);
    }
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(logTraceId, "info", { message: "billValidation response", decryptedResponse, parsedResponse }, "VENDOR");

    if (parsedResponse?.billValidationResponse?.responseCode === "000") {
      return { status: true, data: { ...parsedResponse.billValidationResponse, requestId } };
    }
    const billValResp = parsedResponse?.billValidationResponse;
    return {
      status: false,
      data: billValResp,
      message: billValResp?.complianceReason || billValResp?.responseReason || "Validation failed",
    };
  } catch (error) {
    customLog(logTraceId, "error", { message: "billValidationApi error", error: error.message }, "VENDOR");
    return { status: false, data: {}, message: error.message };
  }
};

// for payment
exports.paymentApi = async (config, jsonPayload, prevReqId, logTraceId = null) => {
  try {
    if (!config || !jsonPayload) {
      throw new Error("Config and jsonPayload are required");
    }
    if (!jsonPayload.amountInfo || !jsonPayload.amountInfo.amount) {
      throw new Error("Amount information is required");
    }
    jsonPayload.amountInfo.amount = Math.round(parseFloat(jsonPayload.amountInfo.amount) * 100);
    if (jsonPayload?.billerResponse?.billAmountInPaise) {
      jsonPayload.billerResponse.billAmount = jsonPayload.billerResponse.billAmountInPaise;
      delete jsonPayload.billerResponse.billAmountInPaise;
  }
    customLog(logTraceId, "info", {jsonPayload, message: "payload for bbps payment in json"})
    const requestId = prevReqId ? prevReqId : generateRequestId();
    const apiBaseUrl = config.apiUrl;
    const encryptionKey = config.optional4;
    if (!encryptionKey) {
      throw new Error("Encryption key not configured");
    }
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billPaymentRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);
    customLog(logTraceId, "info", {message:'XML PAYLOAD payment', xmlPayload}, "VENDOR");

    const data = {
      accessCode: config.optional3,
      requestId: requestId,
      encRequest: encRequest,
      ver: config.optional2,
      instituteId: config.optional1,
    };
    const parameters = new URLSearchParams(data).toString();
    const configs={
      method: "POST",
      url: `${apiBaseUrl}billpay/extBillPayCntrl/billPayRequest/xml`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: parameters,
    }

    // const response= await callExternalApiWithAuth(configs)
    customLog(logTraceId, "info", { configs, message:"config before payment bill avenue call" }, "VENDOR");
    const response = await axios(configs);
    customLog(logTraceId, "info", {message:'respone from billpay request', configs: configs, encResponse:response.data }, "VENDOR");
    const decryptedResponse = decrypt(response.data, encryptionKey);

    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(logTraceId, "info", {message:'decrypted and parsed response paymentAPI', decryptedResponse,parsedResponse}, "VENDOR");
    const extResp = parsedResponse?.ExtBillPayResponse;
    const isReversalType = extResp?.txnRespType === "REVERSAL TYPE RESPONSE";
    const isAwaited = extResp?.txnStatus === "AWAITED";
    if (extResp && extResp.responseCode === "000" && !isReversalType) {
      return {
        status: true,
        data: { ...extResp, message: "Payment Successful" },
      };
    } else if (isAwaited) {
      return {
        status: false,
        awaited: true,
        data: { ...extResp, message: "Payment Awaited" },
      };
    } else {
      return {
        status: false,
        data: { ...extResp, message: isReversalType ? "Payment reversed by biller" : "Payment Failed" },
      };
    }

  } catch (error) {
    customLog(
      logTraceId,
      "error",
      { message: error?.message ?? "Error from paymentApi", error: error },
      "VENDOR"
    );
    return {
      status: false,
      data: { message: error.message || "Something went wrong" },
    };
  }
};
