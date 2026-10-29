const crypto = require('crypto');
const { customLog } = require('./loggerHelper');
const { formatNumberWithLocalString } = require('./formatter');
const { findByName } = require('../models/use-cases/setting');
const { upsertBillers, findByBillerId, findRecordByBillerId, findByBillerCategory } = require('../models/use-cases/billerMDM');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const axios = require("axios");
// const { callExternalApiWithAuth } = require('../controllers/corporate/whitelistIpByPass');


function generateRequestId() {
    const randomString = [...Array(27)].map(() => Math.random().toString(36)[2]).join("");
    const now = new Date();
    const yearLastDigit = String(now.getFullYear()).slice(-1);
    const dayOfYear = String(Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 86400000)).padStart(3, "0");
    const time = now.toTimeString().slice(0, 5).replace(":", "");
    return `${randomString}${yearLastDigit}${dayOfYear}${time}`;
  }
  
  
  function encrypt(plainText, key) {
    const keyHash = crypto.createHash('md5').update(key).digest('hex');
    const encryptionKey = Buffer.from(keyHash, 'hex');
    const initVector = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    
    const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, initVector);
    let encryptedText = cipher.update(plainText, 'utf8', 'hex');
    encryptedText += cipher.final('hex');
    return encryptedText;
  }
  
  function decrypt(encryptedText, key) {
    const keyHash = crypto.createHash('md5').update(key).digest('hex');
    const decryptionKey = Buffer.from(keyHash, 'hex');
    const initVector = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', decryptionKey, initVector);
    let decryptedText = decipher.update(encryptedText, 'hex', 'utf8');
    decryptedText += decipher.final('utf8');
    return decryptedText;
  }


async function fetchBillerInfo(billerIds, config, logTraceId = null) {
  const apiBaseUrl = config.apiUrl;
  const instituteId = config.optional1;
  const version = config.optional2;
  const accessCode = config.optional3;
  const encryptionKey = config.optional4;
  try {
    const requestId = generateRequestId();
    const jsonPayload = { billerId: billerIds };
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billerInfoRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    customLog(logTraceId, "info", { xmlPayload, message: "xml Payload for billerInfo" });
    const encRequest = encrypt(xmlPayload, encryptionKey);
    customLog(
      logTraceId,
      "info",
      {
        url: `${apiBaseUrl}billpay/extMdmCntrl/mdmRequestNew/xml?accessCode=${accessCode}&requestId=${requestId}&ver=${version}&instituteId=${instituteId}`,
        encRequest,
        xmlPayload,
      },
      "VENDOR"
    );
    const configs={
      method: "POST",
      url: `${apiBaseUrl}billpay/extMdmCntrl/mdmRequestNew/xml?accessCode=${accessCode}&requestId=${requestId}&ver=${version}&instituteId=${instituteId}`,
      headers: { "Content-Type": "application/xml" },
      data: encRequest,
    }
    // testing api for working locally
    // const response= await callExternalApiWithAuth(configs)
    const response = await axios(configs);

    customLog(logTraceId, "info", { message: "response from billerInfo api:-", response: response?.data }, "VENDOR");
    const decryptedResponse = decrypt(response.data, encryptionKey);
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);
    customLog(
      logTraceId,
      "info",
      { message: "decrypted and parsed response from billerInfo api:-", decryptedResponse, parsedResponse },
      "VENDOR"
    );
    if (parsedResponse && parsedResponse?.billerInfoResponse && parsedResponse?.billerInfoResponse?.responseCode === "000") {
      return parsedResponse.billerInfoResponse.biller; // Expecting an array of biller objects
    } else {
      return [];
    }
  } catch (error) {
    customLog(logTraceId, "error", { message: "Error fetching biller info", error: error.response ? error.response.data : error.message });
    return [];
  }
}

async function fetchAndCacheBatch(billerIds, config, logTraceId = null) {
  const FETCH_BATCH = 2000;
  for (let i = 0; i < billerIds.length; i += FETCH_BATCH) {
    const batch = billerIds.slice(i, i + FETCH_BATCH);
    const billersFromApi = await fetchBillerInfo(batch, config, logTraceId);
    if (billersFromApi.length > 0) {
      await upsertBillers(billersFromApi);
    }
  }
}

/**
 * Returns a specific biller by billerId.
 * Uses category-aware bulk fetching when possible.
 */
async function getBillerByBillerID(billerId, config, logTraceId = null) {
  const record = await findRecordByBillerId(billerId);

  const hasData = record && record.data && Object.keys(record.data).length > 0;

  if (hasData) {
    customLog(logTraceId, "info", { message: "biller fetched from DB", billerId });
    return record.data;
  }

  // Data missing — smart category-based fetch
  if (record && record.billerCategory) {
    customLog(logTraceId, "info", { message: "fetching billers by category from API", category: record.billerCategory });
    const categoryRecords = await findByBillerCategory(record.billerCategory);
    const categoryBillerIds = categoryRecords.map(r => r.billerId);
    // Ensure the requested billerId is included
    if (!categoryBillerIds.includes(billerId)) categoryBillerIds.push(billerId);
    await fetchAndCacheBatch(categoryBillerIds, config, logTraceId);
  } else {
    customLog(logTraceId, "info", { message: "fetching single biller from API", billerId });
    await fetchAndCacheBatch([billerId], config, logTraceId);
  }

  return findByBillerId(billerId);
}

function calculateCCF1(billerData, txnAmountRupees) {
  const ccf1Info = billerData?.interchangeFeeCCF1;
  if (!ccf1Info) return null;
  const txnAmountPaisa = Math.round(parseFloat(txnAmountRupees) * 100);
  const flatFee    = parseFloat(ccf1Info.flatFee    ?? 0);
  const percentFee = parseFloat(ccf1Info.percentFee ?? 0);
  const feeMinAmt  = parseFloat(ccf1Info.feeMinAmt  ?? 0);
  const feeMaxAmt  = parseFloat(ccf1Info.feeMaxAmt  ?? Infinity);
  const calculated = flatFee + (txnAmountPaisa * percentFee / 100);
  if (calculated <= 0) return null;
  const withGST = Math.floor(calculated * 1.18);
  return String(Math.min(Math.max(withGST, feeMinAmt), feeMaxAmt));
}

const BBPS_AGT_ACCESS_KEY = 'bbps_telecom_otme';
const BBPS_LIMIT_SETTING_NAME = 'bbpsChannelLimit';
const SERVICE_MIN_AMOUNT_PAISE = { bbps_utility_fastag: 10000 };

const isBillPaymentAccessKey = (key) => String(key || '').startsWith('bbps_') || key === 'billavenue';

const resolveInitChannel = (accessKey, vendor) =>
  (accessKey === BBPS_AGT_ACCESS_KEY ? 'AGT' : (String(vendor?.optional6 || '').trim() || 'INT'));

const getPaymentModeEntries = (billerData) => {
  const info = billerData?.billerPaymentModes?.paymentModeInfo;
  return Array.isArray(info) ? info : (info ? [info] : []);
};

const getPaymentChannelEntries = (billerData) => {
  const info = billerData?.billerPaymentChannels?.paymentChannelInfo;
  return Array.isArray(info) ? info : (info ? [info] : []);
};

const findPaymentModeLimits = (billerData, paymentMode) => {
  if (!paymentMode) return null;
  return getPaymentModeEntries(billerData).find(
    (e) => String(e?.paymentMode || '').toLowerCase() === String(paymentMode).toLowerCase()
  ) || null;
};

const findPaymentChannelLimits = (billerData, channelName) => {
  if (!channelName) return null;
  return getPaymentChannelEntries(billerData).find(
    (e) => String(e?.paymentChannelName || '').toLowerCase() === String(channelName).toLowerCase()
  ) || null;
};

const toLimitPaise = (raw) => {
  const n = Number(String(raw ?? '').trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const toPaise = (rupees) => {
  const n = Number(rupees);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

const boundFromEntry = (entry) => {
  if (!entry) return { status: 'UNKNOWN', reason: 'ENTRY_NOT_FOUND', minPaise: 0, maxPaise: 0 };
  const minPaise = toLimitPaise(entry.minAmount);
  const maxPaise = toLimitPaise(entry.maxAmount);
  if (minPaise > 0 && maxPaise > 0 && minPaise > maxPaise) {
    return { status: 'UNKNOWN', reason: 'LIMITS_INVERTED', minPaise, maxPaise };
  }
  if (minPaise === 0 && maxPaise === 0) return { status: 'UNLIMITED', minPaise: 0, maxPaise: 0 };
  return { status: 'BOUNDED', minPaise, maxPaise };
};

const resolveChannelBound = (billerData, channelName) => {
  if (!billerData || typeof billerData !== 'object' || Object.keys(billerData).length === 0) {
    return { status: 'UNKNOWN', reason: 'MDM_DATA_UNAVAILABLE', minPaise: 0, maxPaise: 0 };
  }
  if (getPaymentChannelEntries(billerData).length === 0) {
    return { status: 'UNKNOWN', reason: 'CHANNELS_NOT_PUBLISHED', minPaise: 0, maxPaise: 0 };
  }
  const entry = findPaymentChannelLimits(billerData, channelName);
  if (!entry) return { status: 'UNKNOWN', reason: 'CHANNEL_NOT_LISTED', minPaise: 0, maxPaise: 0 };
  return boundFromEntry(entry);
};

const applyServiceFloor = (bound, accessKey) => {
  const floorPaise = SERVICE_MIN_AMOUNT_PAISE[accessKey] || 0;
  if (!floorPaise) return bound;
  const channelMinPaise = bound?.status === 'BOUNDED' ? bound.minPaise : 0;
  const maxPaise = bound?.status === 'BOUNDED' ? bound.maxPaise : 0;
  const minPaise = Math.max(channelMinPaise, floorPaise);
  if (maxPaise > 0 && minPaise > maxPaise) return bound;
  return { status: 'BOUNDED', minPaise, maxPaise };
};

const checkAmountAgainstBound = (amountPaise, bound) => {
  if (!bound || bound.status !== 'BOUNDED') return null;
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) return null;
  if (bound.minPaise > 0 && amountPaise < bound.minPaise) {
    return { violation: 'BELOW_MIN', minPaise: bound.minPaise, maxPaise: bound.maxPaise };
  }
  if (bound.maxPaise > 0 && amountPaise > bound.maxPaise) {
    return { violation: 'ABOVE_MAX', minPaise: bound.minPaise, maxPaise: bound.maxPaise };
  }
  return null;
};

const toRupeeAmountLimit = (bound) => ({
  status: bound?.status ?? 'UNKNOWN',
  minAmount: bound?.status === 'BOUNDED' && bound.minPaise > 0
    ? Number((bound.minPaise / 100).toFixed(2)) : null,
  maxAmount: bound?.status === 'BOUNDED' && bound.maxPaise > 0
    ? Number((bound.maxPaise / 100).toFixed(2)) : null,
});

const buildAmountBoundMessage = (bound) => {
  const min = `₹${formatNumberWithLocalString((bound.minPaise / 100).toFixed(2))}`;
  const max = `₹${formatNumberWithLocalString((bound.maxPaise / 100).toFixed(2))}`;
  if (bound.minPaise > 0 && bound.maxPaise > 0) {
    return `This biller accepts payments between ${min} and ${max}. Please change the amount and try again.`;
  }
  if (bound.minPaise > 0) {
    return `This biller accepts payments of ${min} or more. Please change the amount and try again.`;
  }
  return `This biller accepts payments of ${max} or less. Please change the amount and try again.`;
};

const isProductionRuntime = () => process.env.NODE_ENV === 'production';

async function isChannelLimitEnforced(logTraceId = null) {
  if (!isProductionRuntime()) return false;
  try {
    const row = await findByName({ name: BBPS_LIMIT_SETTING_NAME });
    const details = typeof row?.details === 'string' ? JSON.parse(row.details) : row?.details;
    return String(details?.mode || 'block').toLowerCase() !== 'monitor';
  } catch (error) {
    customLog(logTraceId, 'error', {
      action: 'bbps:limitModeReadFailed',
      settingName: BBPS_LIMIT_SETTING_NAME,
      error: error?.message || error,
    });
    return true;
  }
}

async function assertBbpsChannelAmount({
  billerData, accessKey, vendor, amount, ccf1Amount = null, billerId, logTraceId = null,
}) {
  if (!isBillPaymentAccessKey(accessKey)) return null;
  const initChannel = resolveInitChannel(accessKey, vendor);
  const channelBound = resolveChannelBound(billerData, initChannel);
  const bound = applyServiceFloor(channelBound, accessKey);
  const base = { accessKey, billerId, initChannel };
  if (channelBound.status !== 'BOUNDED') {
    customLog(logTraceId, 'error', {
      action: 'bbps:channelBoundUnknown',
      reason: channelBound.reason,
      channelEntryCount: getPaymentChannelEntries(billerData).length,
      minPaise: channelBound.minPaise,
      maxPaise: channelBound.maxPaise,
      serviceFloorPaise: SERVICE_MIN_AMOUNT_PAISE[accessKey] || 0,
      ...base,
    }, 'VENDOR');
    if (bound.status !== 'BOUNDED') return null;
  }
  const amountPaise = toPaise(amount);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    customLog(logTraceId, 'error', { action: 'bbps:channelBoundAmountUnusable', amount, ...base }, 'VENDOR');
    return null;
  }
  const withCcf1Paise = amountPaise + toLimitPaise(ccf1Amount);
  const breach = checkAmountAgainstBound(amountPaise, bound);
  if (!breach) {
    if (checkAmountAgainstBound(withCcf1Paise, bound)) {
      customLog(logTraceId, 'error', {
        action: 'bbps:channelBoundCcf1BasisDivergence',
        amountPaise, withCcf1Paise, minPaise: bound.minPaise, maxPaise: bound.maxPaise, ...base,
      }, 'VENDOR');
    }
    return null;
  }
  const enforced = await isChannelLimitEnforced(logTraceId);
  customLog(logTraceId, 'error', {
    action: enforced ? 'bbps:channelLimitBlocked' : 'bbps:channelLimitWouldBlock',
    nodeEnv: process.env.NODE_ENV || 'unset',
    amountPaise, withCcf1Paise, violation: breach.violation,
    minPaise: breach.minPaise, maxPaise: breach.maxPaise, ...base,
  }, 'VENDOR');
  return enforced ? buildAmountBoundMessage(bound) : null;
}

  module.exports = {
    generateRequestId, encrypt, decrypt, getBillerByBillerID, calculateCCF1,
    isBillPaymentAccessKey, resolveInitChannel, getPaymentModeEntries, getPaymentChannelEntries,
    findPaymentModeLimits, findPaymentChannelLimits, toLimitPaise, toPaise, boundFromEntry,
    resolveChannelBound, applyServiceFloor, checkAmountAgainstBound, toRupeeAmountLimit,
    buildAmountBoundMessage, isChannelLimitEnforced, assertBbpsChannelAmount,
  };