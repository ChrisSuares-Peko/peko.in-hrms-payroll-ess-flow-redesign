const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const {
  upsertBillersMeta,
  upsertBillerData,
  updateBillerName,
  findRecordByBillerId,
  findAllActive,
  updateStatus,
  removeBillersByIds,
  countAll,
  countByStatus,
  findByCategory,
  findByBillerIds,
  findFirst100,
  findStaleFirst,
  findPaginated,
  getLastUpdated,
  getCategories,
} = require('../../models/use-cases/billerMDM');
const { findAll: findAllBillFetchLogs } = require('../../models/use-cases/billFetchLog');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { formatDateTimeInIST } = require('../../utils/formatter');
const { customLog } = require('../../utils/loggerHelper');
const operatorsData = require('../../utils/operatorsData.json');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const axios = require('axios');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const { generateRequestId, encrypt, decrypt } = require('../../utils/billPayments_utils');
const { SETTING_KEY: BILLAVENUE_WALLET_KEY } = require('../../utils/billAvenueWallet');
const { createOrUpdate: createOrUpdateSetting, findByName: findSettingByName } = require('../../models/use-cases/settings');
// const { callExternalApiWithAuth } = require('../corporate/whitelistIpByPass');

const accessKey = operatorsData["billavenue"]["accessKey"];
const BATCH_SIZE = 2000;

async function fetchBillerInfoFromAPI(billerIds, config, traceId) {
  const apiBaseUrl = config.apiUrl;
  const instituteId = config.optional1;
  const version = config.optional2;
  const accessCode = config.optional3;
  const encryptionKey = config.optional4;
  const validBillerIds = (Array.isArray(billerIds) ? billerIds : [billerIds])
    .map((id) => String(id).trim())
    .filter((id) => id.length === 14);

  if (!encryptionKey) {
    customLog(traceId, "error", { message: "Encryption key not configured for fetchBillerInfo" });
    throw new Error("Encryption key not configured for fetchBillerInfo");
  }

  if (validBillerIds.length === 0) {
    customLog(traceId, "info", { message: "No valid billerIds found with 14 characters", billerIds });
    return [];
  }

  const requestId = generateRequestId();
  customLog(traceId, "info", {
    message: "Calling BillerInfo API",
    requestId,
    billerCount: validBillerIds.length,
    sampleBillerIds: validBillerIds.slice(0, 10),
  });

  try {
    const jsonPayload = { billerId: validBillerIds };
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    let xmlPayload = builder.build({ billerInfoRequest: jsonPayload });
    xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
    const encRequest = encrypt(xmlPayload, encryptionKey);

    const configs = {
      method: "POST",
      url: `${apiBaseUrl}billpay/extMdmCntrl/mdmRequestNew/xml?accessCode=${accessCode}&requestId=${requestId}&ver=${version}&instituteId=${instituteId}`,
      headers: { "Content-Type": "application/xml" },
      data: encRequest,
    };
    const response = await axios(configs);
    // const response = await callExternalApiWithAuth(configs);
    let encryptedData = response.data;
    if (typeof encryptedData !== 'string') {
      if (typeof encryptedData === 'object' && encryptedData !== null) {
        encryptedData = encryptedData.response || encryptedData.data || JSON.stringify(encryptedData);
      } else {
        encryptedData = String(encryptedData);
      }
    }

    const decryptedResponse = decrypt(encryptedData, encryptionKey);
    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsedResponse = parser.parse(decryptedResponse);

    if (parsedResponse?.billerInfoResponse?.responseCode === "000") {
      const billers = parsedResponse.billerInfoResponse.biller || [];
      return Array.isArray(billers) ? billers : [billers];
    }

    customLog(traceId, "error", {
      message: "BillerInfo API returned non-success response",
      requestId,
      apiResponse: JSON.stringify(parsedResponse),
      billerCount: billerIds.length,
      sampleBillerIds: billerIds.slice(0, 10),
      requestMeta: { apiBaseUrl, instituteId, version, accessCode }
    });
    return [];
  } catch (error) {
    customLog(traceId, "error", {
      message: "Error fetching biller info from API",
      requestId,
      error: error?.response?.data ?? error.response ?? error.message,
      statusCode: error?.response?.status,
      statusText: error?.response?.statusText,
      billerCount: billerIds.length,
      sampleBillerIds: billerIds.slice(0, 10),
      requestMeta: { apiBaseUrl, instituteId, version, accessCode }
    });
    return [];
  }
}

const toRecord = (r) => {
  const mdmBillerName = (r.data && typeof r.data === 'object') ? (r.data.billerName || null) : null;
  const savedBillerName = r.billerName || null;
  // hasMdmNameChanged: the raw MDM name differs from the saved billerName (the one shown in the
  // listing — either the original MDM value at insert time, or an admin override afterwards).
  // This surfaces a "name changed in records" indicator without overwriting the admin's value.
  const hasMdmNameChanged = !!(mdmBillerName && savedBillerName && mdmBillerName !== savedBillerName);
  return {
    billerId: r.billerId,
    billerName: savedBillerName,
    mdmBillerName,
    hasMdmNameChanged,
    billerCategory: r.billerCategory || null,
    billerCoverage: r.billerCoverage || null,
    hasMDMData: !!(r.data && Object.keys(r.data).length > 0),
    mdmUpdatedAt: r.updatedAt || null,
    status: r.status,
  };
};

exports.updateBillerName = asyncHandler(async (req, res, next) => {
  try {
    const { billerId } = req.params;
    const { billerName } = req.body || {};

    if (!billerId || String(billerId).trim().length !== 14) {
      return next(new ErrorResponse('Biller ID must be exactly 14 characters', 400));
    }
    if (billerName == null || String(billerName).trim() === '') {
      return next(new ErrorResponse('billerName is required', 400));
    }
    const trimmedName = String(billerName).trim();
    if (trimmedName.length > 255) {
      return next(new ErrorResponse('billerName cannot exceed 255 characters', 400));
    }

    const existing = await findRecordByBillerId(billerId);
    if (!existing) {
      return next(new ErrorResponse('Biller not found', 404));
    }

    const updated = await updateBillerName(billerId, trimmedName);
    if (!updated) {
      return next(new ErrorResponse('Failed to update biller name', 500));
    }

    const fresh = await findRecordByBillerId(billerId);
    return res.status(200).json({
      status: true,
      message: 'Biller name updated',
      data: toRecord(fresh),
      responseCode: '000',
    });
  } catch (error) {
    customLog(req?.LogTraceId, 'error', { message: 'Error updating biller name', error: error.message });
    return next(new ErrorResponse('Something went wrong while updating biller name', 500));
  }
});

exports.getAllBillers = asyncHandler(async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize) || 10));
    const { sortField, sortOrder, status, category, search, hasMDMData } = req.query;

    const [paginatedResult, activeCount, disabledCount, lastUpdated] = await Promise.all([
      findPaginated({ page, pageSize, sortField, sortOrder, status, category, search, hasMDMData }),
      countByStatus('active'),
      countByStatus('disabled'),
      getLastUpdated(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Billers fetched successfully",
      data: {
        billers: paginatedResult.rows.map(toRecord),
        total: paginatedResult.count,
        activeCount,
        disabledCount,
        lastUpdated,
      },
      responseCode: '000',
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error fetching billers", error: error.message });
    return next(new ErrorResponse(`Something went wrong while fetching billers`, 500));
  }
});

exports.addBiller = asyncHandler(async (req, res, next) => {
  try {
    const { billerId, billerName, billerCategory, billerCoverage } = req.body;

    if (!billerId || String(billerId).trim() === '') {
      return next(new ErrorResponse(`Biller ID is required`, 400));
    }
    const trimmedBillerId = String(billerId).trim();
    if (trimmedBillerId.length !== 14) {
      return next(new ErrorResponse(`Biller ID must be exactly 14 characters`, 400));
    }

    const existing = await findRecordByBillerId(trimmedBillerId);
    if (existing && existing.status === 'active') {
      return next(new ErrorResponse(`Biller ID ${trimmedBillerId} already exists`, 400));
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(`Service configuration not found`, 500));
    }
    const config = {
      apiUrl: serviceDetails.vendor.apiUrl,
      optional1: serviceDetails.vendor.optional1,
      optional2: serviceDetails.vendor.optional2,
      optional3: serviceDetails.vendor.optional3,
      optional4: serviceDetails.vendor.optional4,
    };

    // Upsert meta — re-enables if it was disabled
    await upsertBillersMeta([{
      billerId: trimmedBillerId,
      billerName: billerName || null,
      billerCategory: billerCategory || null,
      billerCoverage: billerCoverage || null,
      status: 'active',
    }]);

    // Fetch API data and store
    let apiData = null;
    try {
      const billersFromApi = await fetchBillerInfoFromAPI([trimmedBillerId], config, req?.LogTraceId);
      if (billersFromApi.length > 0) {
        await upsertBillerData(trimmedBillerId, billersFromApi[0]);
        apiData = billersFromApi[0];
      }
    } catch (apiErr) {
      customLog(req?.LogTraceId,"error", { message: "Failed to fetch biller data from API for new biller", error: apiErr.message });
    }

    const totalBillers = await countAll();
    customLog(req?.LogTraceId,"info", { message: "Biller added successfully", billerId: trimmedBillerId, totalBillers });

    return res.status(200).json({
      status: true,
      message: "Biller added successfully",
      data: {
        billerId: trimmedBillerId,
        billerName: billerName || null,
        billerCategory: billerCategory || null,
        billerCoverage: billerCoverage || null,
        apiData,
        totalBillers,
      },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error adding biller", error: error.message });
    return next(new ErrorResponse(`Something went wrong while adding biller`, 500));
  }
});

exports.removeBiller = asyncHandler(async (req, res, next) => {
  try {
    const { billerIds } = req.body;

    if (!billerIds || !Array.isArray(billerIds) || billerIds.length === 0) {
      return next(new ErrorResponse(`Biller IDs array is required`, 400));
    }

    const trimmedBillerIds = billerIds.map(id => String(id).trim()).filter(id => id !== '');
    if (trimmedBillerIds.length === 0) {
      return next(new ErrorResponse(`No valid biller IDs provided`, 400));
    }

    const existing = await findByBillerIds(trimmedBillerIds);
    const notFoundIds = trimmedBillerIds.filter(id => !existing.some(r => r.billerId === id));
    if (notFoundIds.length > 0) {
      return next(new ErrorResponse(`Biller IDs not found: ${notFoundIds.join(', ')}`, 404));
    }

    await removeBillersByIds(trimmedBillerIds);
    const totalBillers = await countAll();

    customLog(req?.LogTraceId,"info", { message: "Billers removed successfully", billerIds: trimmedBillerIds, removedCount: trimmedBillerIds.length, totalBillers });

    return res.status(200).json({
      status: true,
      message: "Billers removed successfully",
      data: { billerIds: trimmedBillerIds, removedCount: trimmedBillerIds.length, totalBillers },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error removing billers", error: error.message });
    return next(new ErrorResponse(`Something went wrong while removing billers`, 500));
  }
});

exports.previewBillers = asyncHandler(async (req, res, next) => {
  try {
    const billersJsonData = req.body.billersJsonData || [];

    if (!billersJsonData || billersJsonData.length === 0) {
      return next(new ErrorResponse(`No biller data provided`, 400));
    }

    const previewData = billersJsonData.map(item => ({
      blr_id: item.billerId || '',
      blr_name: item.blr_name || '',
      blr_category_name: item.blr_category_name || '',
      blr_coverage: item.blr_coverage || '',
    }));

    const allIds = previewData.map(b => b.blr_id).filter(Boolean);
    const existingRecords = await findByBillerIds(allIds);
    const existingMap = {};
    existingRecords.forEach(r => { existingMap[r.billerId] = r.status; });

    const previewWithStatus = previewData.map(biller => ({
      ...biller,
      isExisting: existingMap[biller.blr_id] === 'active',
      isDisabled: existingMap[biller.blr_id] === 'disabled',
      selected: true,
    }));

    customLog(req?.LogTraceId,"info", {
      message: "Biller preview generated from Excel",
      totalBillers: previewWithStatus.length,
      existing: previewWithStatus.filter(b => b.isExisting).length,
      disabled: previewWithStatus.filter(b => b.isDisabled).length,
    });

    return res.status(200).json({
      status: true,
      message: "Biller preview generated successfully",
      data: { preview: previewWithStatus, totalCount: previewWithStatus.length },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error generating biller preview", error: error.message });
    return next(new ErrorResponse(`Something went wrong while generating preview`, 500));
  }
});

exports.bulkUploadBillers = asyncHandler(async (req, res, next) => {
  try {
    const { selectedBillers } = req.body;

    if (!selectedBillers || !Array.isArray(selectedBillers) || selectedBillers.length === 0) {
      return next(new ErrorResponse(`Selected billers array is required`, 400));
    }

    if (selectedBillers.length > 10000) {
      return next(new ErrorResponse(`Exceeded maximum limit for bulk upload (10,000 per batch)`, 400));
    }

    const isObjects = typeof selectedBillers[0] === 'object' && selectedBillers[0] !== null;

    const metaList = (isObjects ? selectedBillers : selectedBillers.map(id => ({ blr_id: id })))
      .map(b => ({
        billerId: String(b.billerId || b.blr_id || '').trim(),
        billerName: b.blr_name || b.billerName || null,
        billerCategory: b.blr_category_name || b.billerCategory || null,
        billerCoverage: b.blr_coverage || b.billerCoverage || null,
        status: 'active',
      }))
      .filter(b => b.billerId !== '' && b.billerId.length === 14);

    if (metaList.length === 0) {
      return next(new ErrorResponse(`No valid biller IDs found (must be 14 characters)`, 400));
    }

    // Find which are new vs existing before upsert
    const existingRecords = await findByBillerIds(metaList.map(b => b.billerId));
    const existingIds = new Set(existingRecords.map(r => r.billerId));

    await upsertBillersMeta(metaList);

    const addedCount = metaList.filter(b => !existingIds.has(b.billerId)).length;
    const duplicateCount = metaList.length - addedCount;
    const totalBillers = await countAll();

    customLog(req?.LogTraceId,"info", {
      message: "Billers bulk uploaded successfully",
      totalSelected: metaList.length,
      added: addedCount,
      duplicates: duplicateCount,
      totalBillers,
    });

    return res.status(200).json({
      status: true,
      message: "Billers uploaded successfully",
      data: { totalSelected: metaList.length, added: addedCount, duplicates: duplicateCount, totalBillers },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error bulk uploading billers", error: error.message });
    return next(new ErrorResponse(`Something went wrong while uploading billers`, 500));
  }
});

exports.disableBiller = asyncHandler(async (req, res, next) => {
  try {
    const { billerIds } = req.body;

    if (!billerIds || !Array.isArray(billerIds) || billerIds.length === 0) {
      return next(new ErrorResponse(`Biller IDs array is required`, 400));
    }

    const trimmedBillerIds = billerIds.map(id => String(id).trim()).filter(id => id !== '');
    if (trimmedBillerIds.length === 0) {
      return next(new ErrorResponse(`No valid biller IDs provided`, 400));
    }

    const existing = await findByBillerIds(trimmedBillerIds);
    const existingMap = new Map(existing.map(r => [r.billerId, r.status]));
    const notActiveIds = trimmedBillerIds.filter(id => existingMap.get(id) !== 'active');
    if (notActiveIds.length > 0) {
      return next(new ErrorResponse(`Biller IDs not found in active billers: ${notActiveIds.join(', ')}`, 404));
    }

    await updateStatus(trimmedBillerIds, 'disabled');
    const [activeCount, disabledCount] = await Promise.all([countByStatus('active'), countByStatus('disabled')]);

    customLog(req?.LogTraceId,"info", {
      message: "Billers disabled successfully",
      billerIds: trimmedBillerIds,
      disabledCount: trimmedBillerIds.length,
      activeBillers: activeCount,
      disabledBillers: disabledCount,
    });

    return res.status(200).json({
      status: true,
      message: "Billers disabled successfully",
      data: { billerIds: trimmedBillerIds, disabledCount: trimmedBillerIds.length, activeBillers: activeCount, disabledBillers: disabledCount },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error disabling billers", error: error.message });
    return next(new ErrorResponse(`Something went wrong while disabling billers`, 500));
  }
});

exports.enableBiller = asyncHandler(async (req, res, next) => {
  try {
    const { billerIds } = req.body;

    if (!billerIds || !Array.isArray(billerIds) || billerIds.length === 0) {
      return next(new ErrorResponse(`Biller IDs array is required`, 400));
    }

    const trimmedBillerIds = billerIds.map(id => String(id).trim()).filter(id => id !== '');
    if (trimmedBillerIds.length === 0) {
      return next(new ErrorResponse(`No valid biller IDs provided`, 400));
    }

    const existing = await findByBillerIds(trimmedBillerIds);
    const existingMap = new Map(existing.map(r => [r.billerId, r.status]));
    const notDisabledIds = trimmedBillerIds.filter(id => existingMap.get(id) !== 'disabled');
    if (notDisabledIds.length > 0) {
      return next(new ErrorResponse(`Biller IDs not found in disabled billers: ${notDisabledIds.join(', ')}`, 404));
    }

    await updateStatus(trimmedBillerIds, 'active');
    const [activeCount, disabledCount] = await Promise.all([countByStatus('active'), countByStatus('disabled')]);

    customLog(req?.LogTraceId,"info", {
      message: "Billers enabled successfully",
      billerIds: trimmedBillerIds,
      enabledCount: trimmedBillerIds.length,
      activeBillers: activeCount,
      disabledBillers: disabledCount,
    });

    return res.status(200).json({
      status: true,
      message: "Billers enabled successfully",
      data: { billerIds: trimmedBillerIds, enabledCount: trimmedBillerIds.length, activeBillers: activeCount, disabledBillers: disabledCount },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error enabling billers", error: error.message });
    return next(new ErrorResponse(`Something went wrong while enabling billers`, 500));
  }
});

exports.bulkRemoveBillers = asyncHandler(async (req, res, next) => {
  try {
    const { billerIds } = req.body;

    if (!billerIds || !Array.isArray(billerIds) || billerIds.length === 0) {
      return next(new ErrorResponse(`Biller IDs array is required`, 400));
    }

    const trimmedBillerIds = billerIds.map(id => String(id).trim()).filter(id => id !== '');
    if (trimmedBillerIds.length === 0) {
      return next(new ErrorResponse(`No valid biller IDs provided`, 400));
    }

    await removeBillersByIds(trimmedBillerIds);
    const totalBillers = await countAll();

    customLog(req?.LogTraceId,"info", {
      message: "Billers bulk removed successfully",
      requested: trimmedBillerIds.length,
      removed: trimmedBillerIds.length,
      totalBillers,
    });

    return res.status(200).json({
      status: true,
      message: "Billers removed successfully",
      data: { requested: trimmedBillerIds.length, removed: trimmedBillerIds.length, totalBillers },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error bulk removing billers", error: error.message });
    return next(new ErrorResponse(`Something went wrong while removing billers`, 500));
  }
});

exports.refreshBillerInfo = async (req, res, next) => {
  try {
    // --- Validate and prepare before flushing headers ---
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(`Service configuration not found`, 500));
    }

    const config = {
      apiUrl: serviceDetails.vendor.apiUrl,
      optional1: serviceDetails.vendor.optional1,
      optional2: serviceDetails.vendor.optional2,
      optional3: serviceDetails.vendor.optional3,
      optional4: serviceDetails.vendor.optional4,
    };

    const { mode, category, billerIds: selectedIds } = req.body || {};

    let idsToFetch;

    if (mode === 'first100') {
      const allRecords = await findAllActive();
      idsToFetch = allRecords.map(r => r.billerId).slice(0, 100);
      if (idsToFetch.length === 0) {
        return next(new ErrorResponse(`No active billers found. Please add billers first.`, 404));
      }
    } else if (mode === 'byCategory' && category) {
      const records = await findByCategory(category);
      idsToFetch = records.map(r => r.billerId);
      if (idsToFetch.length === 0) {
        return next(new ErrorResponse(`No billers found for category: ${category}`, 404));
      }
    } else if (Array.isArray(selectedIds) && selectedIds.length > 0) {
      // Specific billers selected — refresh only those
      idsToFetch = selectedIds.map(id => String(id).trim()).filter(id => id !== '');
    } else {
      // No selection — refresh all active billers
      const activeRecords = await findAllActive();
      if (!activeRecords || activeRecords.length === 0) {
        return next(new ErrorResponse(`No active billers found. Please add billers first.`, 404));
      }
      idsToFetch = activeRecords.map(r => r.billerId);
    }

    try {
      idsToFetch = await findStaleFirst(idsToFetch);
    } catch (sortErr) {
      customLog(req?.LogTraceId,"error", { message: "Failed to sort billers by staleness, using original order", error: sortErr.message });
    }

    // --- All validation done. Switch to SSE streaming ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.flushHeaders();

    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    const send = (data) => {
      if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        // compression middleware buffers writes — flush it so events reach the client immediately
        if (typeof res.flush === 'function') res.flush();
      }
    };

    const totalBatches = Math.ceil(idsToFetch.length / BATCH_SIZE);
    let totalFetched = 0;
    const failedIds = [];

    customLog(req?.LogTraceId,"info", { message: "Starting biller MDM refresh (streaming)", mode: mode || 'all', totalBillers: idsToFetch.length, totalBatches });

    for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
      if (clientDisconnected) break;

      const batch = idsToFetch.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      try {
        const billersFromApi = await fetchBillerInfoFromAPI(batch, config, req?.LogTraceId);
        if (billersFromApi && billersFromApi.length > 0) {
          const returnedIdSet = new Set(billersFromApi.map(b => String(b.billerId || '').trim()));
          await Promise.all(billersFromApi.map(biller => upsertBillerData(biller.billerId, biller)));
          totalFetched += billersFromApi.length;
          // Track billers in this batch that the API did not return data for
          batch.forEach(id => { if (!returnedIdSet.has(id)) failedIds.push(id); });
        } else {
          batch.forEach(id => failedIds.push(id));
        }
      } catch (batchError) {
        customLog(req?.LogTraceId,"error", { message: "Biller refresh failed at batch", batchNumber, totalBatches, error: batchError?.message });
        batch.forEach(id => failedIds.push(id));
      }

      customLog(req?.LogTraceId,"info", { message: "Biller MDM batch completed", batchNumber, totalBatches, totalFetched });
      send({ type: 'progress', batchNumber, totalBatches, totalFetched, failedCount: failedIds.length });
    }

    // Auto-disable billers the BBPS API doesn't recognise
    let autoDisabledCount = 0;
    if (failedIds.length > 0 && !clientDisconnected) {
      try {
        await updateStatus(failedIds, 'disabled');
        autoDisabledCount = failedIds.length;
        customLog(req?.LogTraceId,"info", { message: "Auto-disabled billers not found in BBPS API", count: autoDisabledCount, billerIds: failedIds });
      } catch (disableErr) {
        customLog(req?.LogTraceId,"error", { message: "Failed to auto-disable unavailable billers", error: disableErr.message });
      }
    }

    send({ type: 'done', totalFetched, failedCount: failedIds.length, autoDisabledCount, lastUpdated: new Date().toISOString() });
    res.end();

  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error refreshing biller info", error: error.message });
    if (!res.headersSent) {
      return next(new ErrorResponse(`Something went wrong while refreshing biller info`, 500));
    }
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Something went wrong while refreshing' })}\n\n`);
      res.end();
    } catch (e) { /* client already disconnected */ }
  }
};

exports.fetchBillerMDM = asyncHandler(async (req, res, next) => {
  try {
    const { mode, category, billerIds: selectedIds } = req.body || {};

    let records;
    if (mode === 'first100') {
      records = await findFirst100();
    } else if (mode === 'byCategory' && category) {
      records = await findByCategory(category);
    } else if (mode === 'selected' && Array.isArray(selectedIds) && selectedIds.length > 0) {
      records = await findByBillerIds(selectedIds);
    } else {
      return next(new ErrorResponse(`mode is required: first100 | byCategory | selected`, 400));
    }

    return res.status(200).json({
      status: true,
      message: "Biller MDM data fetched successfully",
      data: { billers: records, totalCount: records.length },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error fetching biller MDM", error: error.message });
    return next(new ErrorResponse(`Something went wrong while fetching biller MDM`, 500));
  }
});

exports.getBillerCategories = asyncHandler(async (req, res, next) => {
  try {
    const categories = await getCategories();
    return res.status(200).json({
      status: true,
      message: "Biller categories fetched successfully",
      data: { categories },
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId,"error", { message: "Error fetching biller categories", error: error.message });
    return next(new ErrorResponse(`Something went wrong while fetching biller categories`, 500));
  }
});

const formatInputParams = (inputParams) => {
  const input = inputParams?.input;
  if (!input) return "N/A";
  const items = Array.isArray(input) ? input : [input];
  const parts = items
    .filter((p) => p && p.paramName)
    .map((p) => `${p.paramName}: ${p.paramValue ?? ""}`);
  return parts.length ? parts.join("; ") : JSON.stringify(inputParams);
};

exports.exportBillFetchLogs = asyncHandler(async (req, res, next) => {
  const { fromDate, toDate } = req.query;
  if (!fromDate || !toDate) {
    return next(new ErrorResponse("fromDate and toDate are required", 400));
  }

  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T23:59:59.999`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return next(new ErrorResponse("Invalid fromDate or toDate", 400));
  }

  const rows = await findAllBillFetchLogs({ fromDate: from, toDate: to });
  if (!rows || rows.length < 1) {
    return next(new ErrorResponse("No data available for export", 409));
  }

  const exportRows = rows.map((row) => ({
    "Date & Time": formatDateTimeInIST(row.createdAt) || "N/A",
    "Corporate": row.credential?.name || "N/A",
    "Corporate Email": row.credential?.email || "N/A",
    "Credential ID": row.credentialId,
    "Input Params": formatInputParams(row.inputParams),
    "Status Code": row.statusCode ?? "No response",
  }));

  const { buffer, fileType } = await generateExcelBufferAndType(exportRows, "excel");
  return res.status(200).json({
    status: true,
    data: { buffer, fileType },
    message: "Fetched bill fetch report successfully",
    responseCode: "000",
  });
});

// ── BillAvenue vendor wallet balance (internally tracked — no vendor balance API) ──
// Admin reads the current balance (shown on the bill-payments page) and updates it after a top-up.
exports.getBillAvenueWalletBalance = asyncHandler(async (req, res) => {
  const row = await findSettingByName({ name: BILLAVENUE_WALLET_KEY });
  const details = (row && row.details) || {};
  const hasBalance = details.balance !== undefined && details.balance !== null;
  return res.status(200).json({
    status: true,
    message: "BillAvenue wallet balance fetched successfully",
    data: {
      configured: hasBalance,
      balance: hasBalance ? Number(details.balance) : null,
      threshold: Number(details.threshold) || 0,
      currency: details.currency || "INR",
      updatedAt: details.updatedAt || null,
      updatedBy: details.updatedBy || null,
    },
    responseCode: "000",
  });
});

exports.updateBillAvenueWalletBalance = asyncHandler(async (req, res, next) => {
  const numBalance = Number(req.body.balance);
  if (!Number.isFinite(numBalance) || numBalance < 0) {
    return next(new ErrorResponse("A valid non-negative balance is required", 400));
  }
  let numThreshold = 0;
  const { threshold } = req.body;
  if (threshold !== undefined && threshold !== null && threshold !== "") {
    numThreshold = Number(threshold);
    if (!Number.isFinite(numThreshold) || numThreshold < 0) {
      return next(new ErrorResponse("Threshold must be a non-negative number", 400));
    }
  }
  const details = {
    balance: Number(numBalance.toFixed(2)),
    threshold: Number(numThreshold.toFixed(2)),
    currency: "INR",
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.id ?? null,
  };
  await createOrUpdateSetting({ name: BILLAVENUE_WALLET_KEY }, { details });
  customLog(req?.LogTraceId, "info", { message: "BillAvenue wallet balance updated by admin", balance: details.balance, threshold: details.threshold, by: req.user?.id });
  return res.status(200).json({
    status: true,
    message: "BillAvenue wallet balance updated successfully",
    data: details,
    responseCode: "000",
  });
});