const axios = require('axios');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const { findAllActive, upsertBillerData, updateStatus } = require('../models/use-cases/billerMDM');
const { customLog } = require('../utils/loggerHelper');
const { generateRequestId, encrypt, decrypt } = require('../utils/billPayments_utils');
// const { callExternalApiWithAuth } = require('../controllers/corporate/whitelistIpByPass');
const operatorsData = require('../utils/operatorsData.json');

const { accessKey } = operatorsData.billavenue;
const BATCH_SIZE = 2000;
const DISABLE_THRESHOLD_PERCENT = 20; // abort if >20% of active billers would be disabled

async function fetchBillerInfoFromAPI(billerIds, config) {
  const { apiUrl, optional1: instituteId, optional2: version, optional3: accessCode, optional4: encryptionKey } = config;
  const requestMeta = { apiUrl, instituteId, version, accessCode };

  const allIds = (Array.isArray(billerIds) ? billerIds : [billerIds]).map(id => String(id).trim());
  const validBillerIds = allIds.filter(id => id.length === 14);
  const skippedIds = allIds.filter(id => id.length !== 14);

  if (skippedIds.length > 0) {
    customLog(null, 'info', { message: 'billerMDM refresh: biller IDs skipped due to length !== 14', count: skippedIds.length, sample: skippedIds.slice(0, 5), requestMeta });
  }

  if (!encryptionKey) throw new Error('Encryption key not configured for billerMDM refresh');
  if (validBillerIds.length === 0) return [];

  const requestId = generateRequestId();
  const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
  let xmlPayload = builder.build({ billerInfoRequest: { billerId: validBillerIds } });
  xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
  const encRequest = encrypt(xmlPayload, encryptionKey);

  const configs = {
    method: 'POST',
    url: `${apiUrl}billpay/extMdmCntrl/mdmRequestNew/xml?accessCode=${accessCode}&requestId=${requestId}&ver=${version}&instituteId=${instituteId}`,
    headers: { 'Content-Type': 'application/xml' },
    data: encRequest,
  };

  let response;
  try {
    response = await axios(configs);
    // response = await callExternalApiWithAuth(configs);
  } catch (err) {
    customLog(null, 'error', {
      message: 'billerMDM refresh: API request failed',
      error: err?.response?.data ?? err.message,
      statusCode: err?.response?.status,
      statusText: err?.response?.statusText,
      billerCount: validBillerIds.length,
      sampleBillerIds: validBillerIds.slice(0, 5),
      requestMeta,
    });
    throw err;
  }

  let encryptedData = response.data;
  if (typeof encryptedData !== 'string') {
    encryptedData = (typeof encryptedData === 'object' && encryptedData !== null)
      ? (encryptedData.response || encryptedData.data || JSON.stringify(encryptedData))
      : String(encryptedData);
  }

  const decryptedResponse = decrypt(encryptedData, encryptionKey);
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
  const parsedResponse = parser.parse(decryptedResponse);

  if (parsedResponse?.billerInfoResponse?.responseCode === '000') {
    const billers = parsedResponse.billerInfoResponse.biller || [];
    return Array.isArray(billers) ? billers : [billers];
  }

  customLog(null, 'error', {
    message: 'billerMDM refresh: API returned non-success response',
    responseCode: parsedResponse?.billerInfoResponse?.responseCode,
    billerCount: validBillerIds.length,
    requestMeta,
  });
  return [];
}

exports.refreshBillerMDM = async () => {
  customLog(null, 'info', { message: 'billerMDM refresh scheduler started' });
  try {
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceDetails || serviceDetails.error) {
      customLog(null, 'error', { message: 'billerMDM refresh: service config not found', accessKey });
      return;
    }

    const config = {
      apiUrl:    serviceDetails.vendor.apiUrl,
      optional1: serviceDetails.vendor.optional1,
      optional2: serviceDetails.vendor.optional2,
      optional3: serviceDetails.vendor.optional3,
      optional4: serviceDetails.vendor.optional4,
    };

    const activeRecords = await findAllActive();
    if (!activeRecords || activeRecords.length === 0) {
      customLog(null, 'info', { message: 'billerMDM refresh: no active billers found, skipping' });
      return;
    }

    const idsToFetch = activeRecords.map(r => r.billerId);
    const totalBatches = Math.ceil(idsToFetch.length / BATCH_SIZE);
    let totalFetched = 0;
    const failedIds = [];

    customLog(null, 'info', { message: 'billerMDM refresh: starting', totalBillers: idsToFetch.length, totalBatches });

    for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
      const batch = idsToFetch.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      try {
        const billersFromApi = await fetchBillerInfoFromAPI(batch, config);
        if (billersFromApi && billersFromApi.length > 0) {
          const returnedIdSet = new Set(billersFromApi.map(b => String(b.billerId || '').trim()));
          await Promise.all(billersFromApi.map(biller => upsertBillerData(biller.billerId, biller)));
          totalFetched += billersFromApi.length;
          batch.forEach(id => { if (!returnedIdSet.has(id)) failedIds.push(id); });
        } else {
          batch.forEach(id => failedIds.push(id));
        }
        customLog(null, 'info', { message: 'billerMDM refresh: batch done', batchNumber, totalBatches, totalFetched });
      } catch (batchErr) {
        customLog(null, 'error', { message: 'billerMDM refresh: batch failed', batchNumber, error: batchErr.message });
        batch.forEach(id => failedIds.push(id));
      }
    }

    if (failedIds.length > 0) {
      const failedPercent = (failedIds.length / idsToFetch.length) * 100;
      if (failedPercent > DISABLE_THRESHOLD_PERCENT) {
        customLog(null, 'error', {
          message: 'billerMDM refresh: aborting disable — too many billers would be disabled, likely an API or config issue',
          failedCount: failedIds.length,
          totalActive: idsToFetch.length,
          failedPercent: failedPercent.toFixed(1),
          threshold: DISABLE_THRESHOLD_PERCENT,
        });
      } else {
        try {
          await updateStatus(failedIds, 'disabled');
          customLog(null, 'info', { message: 'billerMDM refresh: auto-disabled billers not found in API', count: failedIds.length });
        } catch (disableErr) {
          customLog(null, 'error', { message: 'billerMDM refresh: failed to auto-disable billers', error: disableErr.message });
        }
      }
    }

    customLog(null, 'info', { message: 'billerMDM refresh scheduler completed', totalFetched, failedCount: failedIds.length });
  } catch (error) {
    customLog(null, 'error', { message: 'billerMDM refresh: unhandled error', error: error.message });
  }
};
