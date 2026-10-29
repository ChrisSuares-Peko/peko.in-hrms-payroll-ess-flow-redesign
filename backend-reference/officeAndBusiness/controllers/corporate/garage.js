const asyncHandler = require("../../middlewares/async");
const axios = require("axios");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const operatorsData = require("../../utils/operatorsData.json");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { setValue, getValue } = require("../../utils/cacheDataMethods");
const { uploadFile } = require("../../utils/commonUploadFile");
const { safeParseDate } = require("../../utils/dateUtils");
const {
  createFleet,
  getAllFleets,
  findOneFleet,
  updateFleetServiceDates,
  deleteFleetById,
  getFleetVerificationStatusCount,
  getExcelCSVData:getExcelCSVDataFleet,
  getGarageFleetUsage,
  getServiceDueCount,
  updateFleetFastag,
  claimFleetRefresh,
  revertFleetRefreshClaim,
  applyFleetRefresh,
  nextRefreshDate
} = require("../../models/use-cases/garage/garage_fleet");
const {
  createDriver,
  getAllDrivers,
  findOneDriver,
  deleteDriverById,
  getDriverStats,
  getExcelCSVData:getExcelCSVDataDriver,
  getGarageDriverUsage,
} = require("../../models/use-cases/garage/garage_driver");
const { createAssignment, unassignDriver } = require("../../models/use-cases/garage/garage_assignment");
const { createQuoteRequest } = require("../../models/use-cases/garage/garage_quote_request");
const { getAllOperationLogs, findOneLogAndUpdateTime, createLog } = require("../../models/use-cases/garage/garage_logs");
const { getDocumentExpiryAlertsList, createDocument, getAllDocuments, deleteDocument, getDocumentById, updateDocument } = require("../../models/use-cases/garage/garage_document");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { findAllTransactions } = require("../../models/use-cases/order");
const { findMaximumUsageLimitForAccessKey } = require("../../models/use-cases/subscription");
const accessKey = operatorsData["garage"]["accessKey"];

const GENERIC_ERROR_MESSAGE = "Something went wrong. If the issue persists, please contact support at reach@peko.one";

// Search text is interpolated into LIKE queries over a utf8 (3-byte) connection, so 4-byte characters
// (emoji) make MySQL reject the query. Drop them plus the zero-width joiners / variation selectors that travel
// with them, trim, and treat an empty result as "no filter" (ticket 30995).
const sanitizeSearchText = (value) => {
  if (value === undefined || value === null) return undefined;
  const clean = String(value).replace(/[\u{10000}-\u{10FFFF}]|\u200D|\uFE0E|\uFE0F/gu, "").trim();
  return clean || undefined;
};

// Operations Log: an RC/DL lookup is a user action (and consumes paid quota), so record it. createLog never throws.
const logDocumentLookup = async ({ type, docNo, credentialId, cached }) => {
  const isRc = type === "rc";
  await createLog({
    actionType: isRc ? "RC_LOOKUP" : "DL_LOOKUP",
    referenceId: docNo,
    description: `${isRc ? "Vehicle RC" : "Driving licence"} verified for ${isRc ? "vehicle" : "DL"} number: ${docNo}${cached ? " (cached result)" : ""}`,
    meta: isRc ? { vehicleNumber: docNo } : { dlNumber: docNo },
    credentialId,
  });
};

// Total Turbo (Garage) usage = fleets + drivers. Compared against findMaximumUsageLimitForAccessKey
// (Cashback baseLimit for the active GROUP plan + any active addon's maxLimit) to gate access.
const assertGarageQuotaAvailable = async ({ corporateId, credentialId }) => {
  const [fleetUsage, driverUsage, maxLimit] = await Promise.all([
    getGarageFleetUsage(credentialId),
    getGarageDriverUsage(credentialId),
    findMaximumUsageLimitForAccessKey({ corporateId, accessKey }),
  ]);
  const fleetCount = fleetUsage?.success ? fleetUsage.data : 0;
  const driverCount = driverUsage?.success ? driverUsage.data : 0;
  const totalUsed = fleetCount + driverCount;
  // Zero quota counts as "no access" — caller must not be able to consume. The legacy
  // `max > 0 && used >= max` shape would have treated 0 as unlimited; that's the bug we're fixing.
  if (totalUsed >= maxLimit) {
    return {
      ok: false,
      maxLimit,
      totalUsed,
      message:
        maxLimit === 0
          ? "Your plan has no Turbo searches available. Please upgrade or purchase add-ons to continue."
          : `You've reached your Turbo limit (${totalUsed}/${maxLimit}). Please upgrade or purchase add-ons to continue.`,
    };
  }
  return { ok: true, maxLimit, totalUsed };
};

exports.dashboardDetails = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const subCorporateUserId = req.user.role === "CORPORATE_SUB_USER" ? req.user.subCorporateId : undefined;

    const [fleets, drivers, documents, serviceDue, recentTopups] = await Promise.all([
      getFleetVerificationStatusCount({ credentialId, subCorporateUserId }),
      getDriverStats({ credentialId, subCorporateUserId }),
      getDocumentExpiryAlertsList({ credentialId, subCorporateUserId }),
      getServiceDueCount({ credentialId, subCorporateUserId }),
      findAllTransactions({
        corporateId: credentialId,
        subCorporateUserId,
        accessKey: "bbps_utility_fastag",
        status: "SUCCESS",
        limit: 4,
        serviceAttribute: ["id", "serviceProvider", "accessKey"],
        orderAttribute: ["accountNo", "amountInINR"],
        transactionAttribute: ["corporateTxnId", "status", "id", "createdAt"],
      }).catch(() => []),
    ]);

    const tasks = [];
    if (serviceDue?.data > 0) {
      tasks.push({
        key: "serviceDue",
        count: serviceDue.data,
        vehicleId: serviceDue.vehicleId || null,
        task: serviceDue.data === 1 ? "Vehicle due for service" : "Vehicles due for service",
        action: "Review",
      });
    }

    const { ageDistributionData, ...fleetDatas } = fleets.data;
    return res.status(200).json({
      status: true,
      data: { fleets: fleetDatas, drivers: drivers.data, documents: documents.data ?? [] , ageDistributionData, recentTopups: recentTopups ?? [], tasks },
      message: "Dashboard details fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.error("get dashboard Error:", error);
    return next(new ErrorResponse("Something went wrong", 400));
  }
});

exports.verifyDocument = asyncHandler(async (req, res, next) => {
  const type = req.params.type?.toLowerCase(); //rc or dl

  const data = req.body;
  const { doc_identity_no, dob } = data;
  const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;
  const corporateTxnId = new Date().valueOf();
  const cacheKey = `peko_garage_${type}_${doc_identity_no}`;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }

  // Quota gate — every search hits the paid vendor API, so block at search time when there's
  // no remaining quota (including the 0-baseLimit "no access" case).
  const quota = await assertGarageQuotaAvailable({ corporateId: corporateUserId, credentialId });
  if (!quota.ok) {
    return next(new ErrorResponse(quota.message, 400));
  }

  let cachedDetails = type === "rc" ? await getValue(cacheKey) : null;
  if (cachedDetails) {
    const parsed = JSON.parse(cachedDetails);
    const mapped = type === "rc" ? mapRCToFleet(parsed, req?.LogTraceId) : mapDLApi(parsed, req?.LogTraceId);
    await logDocumentLookup({ type, docNo: doc_identity_no, credentialId, cached: true });
    return res.status(200).json({
      status: true,
      data: { data: mapped },
      message: `${type} details fetched successfully`,
      responseCode: "000",
    });
  }

  const payload = {
    verification_id: `peko_${corporateTxnId}`,
    ...(type === "rc" ? { vehicle_number: doc_identity_no } : { dl_number: doc_identity_no, dob }),
  };
  const result =
    type === "rc"
      ? await makeVehicleRCVerificationRequest(serviceDetails, payload, req?.LogTraceId)
      : await makeDrivingLicenseVerificationRequest(serviceDetails, payload, req?.LogTraceId);

  if (result?.status >= 200 && result?.status < 300 && result?.data) {
    const rawData = result.data;
    const mapped = type === "rc" ? mapRCToFleet(rawData, req?.LogTraceId) : mapDLApi(rawData, req?.LogTraceId);
    await setValue(cacheKey, 86400, JSON.stringify(rawData));
    await logDocumentLookup({ type, docNo: doc_identity_no, credentialId, cached: false });

    return res.status(200).json({
      status: true,
      data: { data: mapped },
      message: `${type} details fetched successfully`,
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(`Something went wrong while getting the ${type.toUpperCase()} details`, 400));
  }
});

exports.addDocumentToGarage = asyncHandler(async (req, res, next) => {
  const type = req.params.type?.toLowerCase(); //rc or dl

  const { doc_identity_no, dob, vehicleId } = req.body;
  const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;
  const cacheKey = `peko_garage_${type}_${doc_identity_no}`;
  const corporateTxnId = new Date().valueOf();
  const logId = req?.LogTraceId;

  // A vehicle linked to the new driver must belong to the caller (mirrors the assign
  // endpoint) — prevents assigning a driver to another tenant's vehicle.
  if (type === "dl" && vehicleId) {
    const fleet = await findOneFleet({ id: vehicleId, credentialId }, logId);
    if (!fleet.success) {
      return next(new ErrorResponse("Vehicle not found", 404));
    }
  }

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }

  // Quota gate — same check as verifyDocument so a user can never sneak past via /add directly.
  const quota = await assertGarageQuotaAvailable({ corporateId: corporateUserId, credentialId });
  if (!quota.ok) {
    return next(new ErrorResponse(quota.message, 400));
  }

  let cached = await getValue(cacheKey);
  let documentDetails = cached ? JSON.parse(cached) : null;

  if (!documentDetails) {
    console.log("garage data not found in cache");

    const payload =
      type === "rc"
        ? {
            verification_id: `peko_${corporateTxnId}`,
            vehicle_number: doc_identity_no,
          }
        : {
            verification_id: `peko_${corporateTxnId}`,
            dl_number: doc_identity_no,
            dob,
          };

    const result =
      type === "rc"
        ? await makeVehicleRCVerificationRequest(serviceDetails, payload, logId)
        : await makeDrivingLicenseVerificationRequest(serviceDetails, payload, logId);

    documentDetails = result?.data;

    if (documentDetails?.status === "INVALID") {
      const errMsg = type === "rc" ? "Vehicle registration is invalid" : "Driving license is invalid";
      return next(new ErrorResponse(errMsg, 400));
    }
  }
  const transformedData = type === "rc" ? mapRCToFleet(documentDetails, logId) : mapDLApi(documentDetails, logId);

  if (type === "dl" && transformedData.photoUrl) {
    const firebasePhotoUrl = await downloadAndUploadDLPhoto(transformedData.photoUrl, logId);
    transformedData.photoUrl = firebasePhotoUrl;
    if (firebasePhotoUrl && transformedData.rawData?.details_of_driving_licence) {
      transformedData.rawData.details_of_driving_licence.photo = firebasePhotoUrl;
    }
  }

  const dbResult = type === "rc" ? await createFleet(transformedData, credentialId, logId) : await createDriver(transformedData, credentialId, logId);

  if (dbResult?.success && dbResult?.data) {
    
    if(vehicleId && type === "dl"){
      const driverId = dbResult.data.id;
      await createAssignment({driverId, vehicleId}, credentialId, logId);
    }
    return res.status(200).json({
      status: true,
      data: { data: dbResult.data },
      message: `${type} details added successfully`,
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(dbResult?.error ?? `Something went wrong while adding the ${type.toUpperCase()} details`, 400));
  }
});

exports.getFleetsAndCount = asyncHandler(async (req, res, next) => {
  try {
    let { searchText, page, itemsPerPage, fromDate, toDate } = req.query;
    let credentialId = req.user.id;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let column = "createdAt";
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;

    let subCorporateUserId;
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      subCorporateUserId = req.user.subCorporateId;
    }

    let params = {
      page,
      itemsPerPage,
      searchText: sanitizeSearchText(searchText),
      sort,
      sortField: column,
      credentialId,
      subCorporateUserId,
      from: fromDate,
      to: toDate,
    };
    const data = await getAllFleets(params);
    console.log("🚀 ~ exports.getFleetsAndCount=asyncHandler ~ data:", data);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400));
    } else {
      return res.status(200).json({
        status: true,
        data: {
          data: data ? data.rows : 0,
          recordsTotal: data ? data.count : 0,
        },
        message: "All records fetched successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Garage: fetch list failed", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 500));
  }
});

exports.getDriversAndCount = asyncHandler(async (req, res, next) => {
  try {
    let { searchText, page, itemsPerPage, } = req.query;
    let credentialId = req.user.id;

    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let column = "createdAt";
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;

    let subCorporateUserId;
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      subCorporateUserId = req.user.subCorporateId;
    }

    let params = {
      page,
      itemsPerPage,
      searchText: sanitizeSearchText(searchText),
      sort,
      sortField: column,
      credentialId,
      subCorporateUserId,
     
    };
    const data = await getAllDrivers(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while getting all records from database`, 400));
    } else {
      return res.status(200).json({
        status: true,
        data: {
          data: data ? data.rows : 0,
          recordsTotal: data ? data.count : 0,
        },
        message: "All records fetched successfully",
        responseCode: "000",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Garage: fetch list failed", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 500));
  }
});

exports.getExcelDrivers = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;
  const {type} = req.params;
  const credentialId = req.user.id

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = 'createdAt'


  let params ={
      from,
      to,
      searchText: sanitizeSearchText(searchText),
      sort,
      sortField, 
      credentialId
  }

  let data = await getExcelCSVDataDriver(params)
  
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if(data.length == 0) {
      return next(new ErrorResponse(`No data available for download.`, 500))
  } else {
      const {buffer, fileType} = await generateExcelBufferAndType(data,type)
      return res.status(200).json({
          'status': true,
          'data': {buffer, fileType},
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
  }
})

exports.getExcelFleets = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;
  const {type} = req.params;
  const credentialId = req.user.id

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = 'createdAt'


  let params ={
      from,
      to,
      searchText: sanitizeSearchText(searchText),
      sort,
      sortField, 
      credentialId
  }

  let data = await getExcelCSVDataFleet(params)
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if(data.length == 0) {
      return next(new ErrorResponse(`No data available for download.`, 500))
  } else {
      const {buffer, fileType} = await generateExcelBufferAndType(data,type)
      return res.status(200).json({
          'status': true,
          'data': {buffer, fileType},
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
  }
})

exports.createGarageAssignment = asyncHandler(async (req, res, next) => {
  const data = req.body;
  const credentialId = req.user.id;

  const { driverId, vehicleId } = data;

  const [driver, fleet] = await Promise.all([ 
  findOneFleet({ id: vehicleId, credentialId }, req?.LogTraceId),
  findOneDriver({ id: driverId, credentialId }, req?.LogTraceId),
]);
   customLog(req?.LogTraceId, "info", { data:driver,message:"Driver details fetched" });
   customLog(req?.LogTraceId, "info", { data:fleet,message:"Fleet details fetched" });

  if (!driver.success || !fleet.success) {
    return next(new ErrorResponse("Driver or Vehicle not found", 404));
  }

  // if (driver.data.credentialId !== credentialId || fleet.data.credentialId !== credentialId) {
  //   return next(new ErrorResponse("Driver and Vehicle must belong to the same credential", 400));
  // }

  const result = await createAssignment(data, credentialId, req?.LogTraceId);

  if (result.success) {
    return res.status(200).json({
      status: true,
      data: result.data,
      message: "Garage assignment created successfully",
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(result.message || "Failed to create assignment", 500));
  }
});

exports.deleteGarageAssignment = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const assignmentId = req.params.id;

  const result = await unassignDriver(assignmentId, credentialId, req?.LogTraceId);

  if (result.success) {
    return res.status(200).json({
      status: true,
      message: "Driver unassigned successfully",
      responseCode: "000",
    });
  } else {
    return next(new ErrorResponse(result.message || "Failed to unassign driver", result.message === "Assignment not found" ? 404 : 500));
  }
});

exports.getAFleet = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const fleetId = req.params.id;
    const fleet = await findOneFleet({ id: fleetId, credentialId, isDeleted: false }, req?.LogTraceId);
    if (!fleet.success) {
      return next(new ErrorResponse("Fleet not found", 404));
    }
    return res.status(200).json({
      status: true,
      data: fleet.data,
      message: "Fleet fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Garage: get fleet failed", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

// "01 Oct 2026" — the wording the Manage Fleet toast and the vehicle details subtext both use.
const formatRefreshDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

// Ticket 31321: re-pull a single vehicle's RC from the vendor so stale data (insurance / PUC / RC status)
// can be corrected without deleting and re-adding the vehicle. Every call costs money, so it is capped at
// once a week per vehicle and the slot is claimed before the vendor is hit.
//
// Deliberately NOT behind assertGarageQuotaAvailable: that gate counts fleet + driver seats and exists to stop
// a user ADDING beyond their plan. A user sitting exactly on their limit still owns these vehicles and must be
// able to refresh them — the weekly cap is what controls the vendor spend here.
exports.refreshFleet = asyncHandler(async (req, res, next) => {
  const fleetId = req.params.id;
  const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;
  const logId = req?.LogTraceId;

  try {
    const claim = await claimFleetRefresh(fleetId, credentialId, logId);

    if (!claim.success && claim.notFound) {
      return next(new ErrorResponse("Fleet not found", 404));
    }

    // Still inside the weekly window — not an error, just nothing to do. 200 so the client can render its
    // own "next refresh" toast instead of the generic failure one.
    if (!claim.success && claim.cooldown) {
      return res.status(200).json({
        status: true,
        data: {
          refreshed: false,
          lastRefreshedAt: claim.lastRefreshedAt,
          nextRefreshOn: claim.nextRefreshOn,
        },
        message: claim.nextRefreshOn
          ? `Next refresh available on ${formatRefreshDate(claim.nextRefreshOn)}`
          : "This vehicle was refreshed recently. Please try again later.",
        responseCode: "000",
      });
    }

    if (!claim.success) {
      return next(new ErrorResponse(claim.message ?? GENERIC_ERROR_MESSAGE, 400));
    }

    const { data: fleet, previousLastRefreshedAt, claimedAt } = claim;
    const vehicleNumber = fleet.vehicleNumber;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      await revertFleetRefreshClaim(fleetId, credentialId, previousLastRefreshedAt, logId);
      return next(new ErrorResponse(serviceDetails.error, 400));
    }

    // Skip the 24h verify cache on purpose — the whole point of the action is a fresh vendor read.
    // The fresh payload is written back so a later verify/add of the same number sees it too.
    const result = await makeVehicleRCVerificationRequest(
      serviceDetails,
      { verification_id: `peko_${new Date().valueOf()}`, vehicle_number: vehicleNumber },
      logId
    );

    const rawData = result?.data;
    const vendorOk = result?.status >= 200 && result?.status < 300 && rawData && rawData?.status !== "INVALID";

    if (!vendorOk) {
      // The call did not give us usable data, so it must not cost the user their weekly slot.
      await revertFleetRefreshClaim(fleetId, credentialId, previousLastRefreshedAt, logId);
      customLog(logId, "error", { message: "Refresh fleet: RC lookup failed", vehicleNumber, status: result?.status });
      return next(new ErrorResponse("Unable to fetch the latest vehicle details right now. Please try again.", 400));
    }

    await setValue(`peko_garage_rc_${vehicleNumber}`, 86400, JSON.stringify(rawData));

    const mapped = mapRCToFleet(rawData, logId);
    const updated = await applyFleetRefresh(fleetId, credentialId, mapped, logId);

    if (!updated.success) {
      await revertFleetRefreshClaim(fleetId, credentialId, previousLastRefreshedAt, logId);
      return next(new ErrorResponse(updated.message ?? GENERIC_ERROR_MESSAGE, 400));
    }

    const nextRefreshOn = nextRefreshDate(claimedAt);

    return res.status(200).json({
      status: true,
      data: {
        refreshed: true,
        lastRefreshedAt: claimedAt,
        nextRefreshOn,
        fleet: updated.data,
      },
      message: "Vehicle details refreshed successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(logId, "error", { message: "Refresh Fleet Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 500));
  }
});

exports.updateFleetServiceDates = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const fleetId = req.params.id;
    const { lastServiceDate, nextServiceDue } = req.body;

    const result = await updateFleetServiceDates(
      fleetId,
      { lastServiceDate, nextServiceDue },
      credentialId,
      req?.LogTraceId
    );

    if (!result.success) {
      return next(new ErrorResponse(result.message || "Failed to update service dates", 400));
    }

    return res.status(200).json({
      status: true,
      data: result.data,
      message: "Service dates updated successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Update Fleet Service Dates Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.updateFleetFastag = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const fleetId = req.params.id;
    const { fastagProvider, fastagBillerId, fastagRegistration, fastagParamName } = req.body;

    const result = await updateFleetFastag(
      fleetId,
      { fastagProvider, fastagBillerId, fastagRegistration, fastagParamName },
      credentialId
    );

    if (!result.success) {
      return next(new ErrorResponse(result.message || "Failed to update FASTag details", 400));
    }

    return res.status(200).json({
      status: true,
      data: result.data,
      message: "FASTag details updated successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Update Fleet Fastag Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.createQuoteRequest = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const { fullName, mobileNumber, email, insuranceType, vehicleNumber, vehicleId } = req.body;

    const data = { fullName, mobileNumber, email, insuranceType, vehicleNumber, vehicleId };
    if (req.user?.role === "CORPORATE_SUB_USER" && req.user?.subCorporateId) {
      data.subCorporateUserId = req.user?.subCorporateId;
    }

    const result = await createQuoteRequest(data, credentialId, req?.LogTraceId);

    if (!result.success) {
      return next(new ErrorResponse(result.error || "Failed to submit quote request", 500));
    }

    return res.status(200).json({
      status: true,
      data: result.data,
      message: result.duplicate
        ? "Your request for quote has been received. We will get in touch with you shortly."
        : "Thanks! Our insurance team will reach out within 24 hours with a quote tailored to your vehicle.",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Create Quote Request Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.getADriver = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const driverId = req.params.id;

    const driver = await findOneDriver({ id: driverId, credentialId, status: true }, req?.LogTraceId);

    if (!driver.success) {
      return next(new ErrorResponse("Driver not found", 404));
    }

    return res.status(200).json({
      status: true,
      data: driver.data,
      message: "Driver fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Get Driver Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 500));
  }
});

exports.deleteDriver = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const driverId = req.params.id;

    const result = await deleteDriverById(driverId, credentialId);

    if (!result.success) {
      return next(new ErrorResponse(result.message, 400));
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Delete Driver Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.deleteFleet = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const fleetId = req.params.id;

    const result = await deleteFleetById(fleetId, credentialId);

    if (!result.success) {
      return next(new ErrorResponse(result.message, 400));
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Delete Fleet Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 500));
  }
});

exports.getOperationLogs = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    let { searchText, page, itemsPerPage, from, to, sort, sortField } = req.query;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
    sort = sort === "ASC" ? "ASC" : "DESC";

    const params = {
      page,
      itemsPerPage,
      searchText: sanitizeSearchText(searchText),
      from,
      to,
      sort,
      sortField: sortField || "createdAt",
      credentialId,
    };

    const data = await getAllOperationLogs(params);

    if (!data) {
      return next(new ErrorResponse("Failed to fetch operation logs", 400));
    }

    return res.status(200).json({
      status: true,
      data: {
        data: data.rows,
        recordsTotal: data.count,
      },
      message: "Operation logs fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Get Operation Logs Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 500));
  }
});

exports.refreshDashboard = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;

    const result = await findOneLogAndUpdateTime({credentialId})
      if (!result) {
        
        return next(new ErrorResponse("No logs found", 404));
    }
    return res.status(200).json({
      status: true,
      data: {
        refresh: true,
        updatedAt: result.updatedAt
      },
      message: "Data Refreshed successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Refresh api Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.createDocument = asyncHandler(async (req, res, next) => {
  let data = req.body;
  let credentialId = req.user.id;
  if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      data.subCorporateUserId = req.user?.subCorporateId
  }
  const result = await createDocument({ ...data, credentialId },req.user, req?.LogTraceId);
  if (!result.success) {
      return next(new ErrorResponse(result.error, 500));
  } else {
      return res.status(200).json({
          'status': true,
          'data': result,
          'message': 'Document submitted successfully',
          'responseCode': '000'
      });
  }
});
exports.updateDocument = asyncHandler(async (req, res, next) => {
  let data = req.body;
  let credentialId = req.user.id;
   const documentId = req.params.id;
  if (req.user?.role === 'CORPORATE_SUB_USER' && req.user?.subCorporateId) {
      data.subCorporateUserId = req.user?.subCorporateId
  }
  const result = await updateDocument(documentId,{ ...data, credentialId },req.user, req?.LogTraceId);
  if (!result.success) {
      return next(new ErrorResponse(result.error, 500));
  } else {
      return res.status(200).json({
          'status': true,
          'data': result,
          'message': 'Document updated successfully',
          'responseCode': '000'
      });
  }
});

exports.getAllUserDocuments = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    let { searchText, page, itemsPerPage, fromDate, toDate, sort, sortField, vehicleId, driverId } = req.query;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
    sort = sort === "ASC" ? "ASC" : "DESC";

    const params = {
      page,
      itemsPerPage,
      searchText: sanitizeSearchText(searchText),
      fromDate,
      toDate,
      sort,
      sortField: sortField || "createdAt",
      credentialId,
      vehicleId,
      driverId
    };

    const data = await getAllDocuments(params);

    if (!data) {
      return next(new ErrorResponse("Failed to fetch documents", 400));
    }

    return res.status(200).json({
      status: true,
      data: {
        data: data.rows,
        recordsTotal: data.count,
      },
      message: "Documents fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Get Documents Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.deleteDocuments = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const documentId = req.params.id;

    const result = await deleteDocument(documentId, credentialId);

    if (!result.success) {
      return next(new ErrorResponse(result.message, 400));
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Delete Document Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.getDocumentDetails = asyncHandler(async (req, res, next) => {
  try {
    const documentId = req.params.id;

    const result = await getDocumentById(documentId, req.user.id);

    if (!result.success) {
      return next(new ErrorResponse(result.message, 400));
    }

    return res.status(200).json({
      status: true,
      data: result.data,
      message: "Document fetched successfully.",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Get Document Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

exports.getGarageUsages = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const [fleetResult, driverResult] = await Promise.all([
      getGarageFleetUsage(credentialId),
      getGarageDriverUsage(credentialId),
    ]);

    if (!fleetResult.success || !driverResult.success) {
      const message = fleetResult.message || driverResult.message || 'Failed to fetch usage data';
      return next(new ErrorResponse(message, 400));
    }

    return res.status(200).json({
      status: true,
      data: {
        fleetsUsed: fleetResult.data,
        driversUsed: driverResult.data,
      },
      message: "Usage fetched successfully.",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Get usage Error", error: error?.message ?? String(error), stack: error?.stack });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
  }
});

const downloadAndUploadDLPhoto = async (photoUrl, logId) => {
  try {
    const response = await axios.get(photoUrl, { responseType: "arraybuffer", timeout: 10000 });
    const base64 = Buffer.from(response.data).toString("base64");
    const contentType = response.headers["content-type"] || "";
    const fileFormat = contentType.includes("png") ? "png" : "jpg";
    return await uploadFile(base64, "garage/drivers", fileFormat, 5);
  } catch (error) {
    customLog(logId, "error", { message: "Failed to upload DL photo to Firebase", error: error.message });
    return null;
  }
};

const mapRCToFleet = (data, logTraceId = null) => {
  const {
    vehicle_number,
    reg_no,
    vehicle_manufacturer_name,
    model,
    type,
    rc_status,
    vehicle_insurance_upto,
    pucc_upto,
    permit_valid_upto,
    blacklist_status,
    engine,
    chassis,
    reg_date,
    reg_authority,
    present_address,
    permanent_address,
    vehicle_manufacturing_month_year,
    vehicle_insurance_company_name,
    vehicle_insurance_policy_number,
    owner,
    is_commercial,
    ...rawData
  } = data;

  return {
    vehicleNumber: vehicle_number || reg_no,
    manufacturer: vehicle_manufacturer_name,
    model,
    fuelType: type,
    rcStatus: rc_status,
    insuranceValidUpto: safeParseDate(vehicle_insurance_upto, logTraceId),
    pucValidUpto: safeParseDate(pucc_upto, logTraceId),
    permitValidUpto: safeParseDate(permit_valid_upto, logTraceId),
    blacklistStatus: blacklist_status ? true : false,
    engineNumber: engine,
    chassisNumber: chassis,
    regDate: safeParseDate(reg_date, logTraceId),
    regAuthority: reg_authority,
    presentAddress: present_address,
    permanentAddress: permanent_address,
    manufacturingDate: vehicle_manufacturing_month_year,
    insuranceCompany: vehicle_insurance_company_name,
    policyNumber: vehicle_insurance_policy_number,
    ownerName: owner,
    isCommercial: is_commercial,
    fasttagBalance: null,
    insuranceExpiry: safeParseDate(vehicle_insurance_upto, logTraceId),
    rawData,
  };
};

function mapDLApi(data, logTraceId = null) {
  const { dl_number, dob, status, reference_id, ...rawData } = data;
  return {
    dlNumber: dl_number,
    name: data.details_of_driving_licence?.name,
    fatherName: data.details_of_driving_licence?.father_or_husband_name,
    dob: safeParseDate(dob, logTraceId),
    address: data.details_of_driving_licence?.address || null,
    permanentAddress: data.details_of_driving_licence?.address_list?.find((a) => a.type === "permanent")?.complete_address || null,
    photoUrl: data.details_of_driving_licence?.photo || null,
    nonTransportValidFrom: safeParseDate(data.dl_validity?.non_transport?.from, logTraceId),
    nonTransportValidTo: safeParseDate(data.dl_validity?.non_transport?.to, logTraceId),
    transportValidFrom: safeParseDate(data.dl_validity?.transport?.from, logTraceId),
    transportValidTo: safeParseDate(data.dl_validity?.transport?.to, logTraceId),
    hazardousValidTill: safeParseDate(data.dl_validity?.hazardous_valid_till, logTraceId),
    hillValidTill: safeParseDate(data.dl_validity?.hill_valid_till, logTraceId),
    dateOfIssue: safeParseDate(data.details_of_driving_licence?.date_of_issue, logTraceId),
    verificationStatus: status || null,
    referenceId: reference_id,
    rawData,
  };
}
const makeVehicleRCVerificationRequest = async (serviceDetails, payload, LogTraceId = null) => {
  const config = {
    method: "post",
    url: `${serviceDetails.vendor.apiUrl}/verification/vehicle-rc`,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": serviceDetails.vendor.optional1,
      "x-client-secret": serviceDetails.vendor.optional2,
    },
    data: payload,
  };

  customLog(LogTraceId, "info", { config });

  // LOCAL DEV ONLY — route through the payment MS proxy (whitelisted egress IP).
  // const dummyConfig = {
  //   method: "POST",
  //   url: `https://uatinapi.pekoapp.com/api/v1/webhook/bbps/payment/proxy-api`,
  //   headers: {
  //     sessionid: req.headers.sessionid,
  //     Authorization: req.headers.authorization,
  //   },
  //   data: config,
  // };

  let result;

  try {
    // const proxyRes = await axios(dummyConfig);
    // proxyAPIForTest wraps the real Cashfree body under data.data.response.
    // Return the same shape the direct axios(config) call produced.
    // result = { status: proxyRes.status, data: proxyRes.data?.data?.response };
    result = await axios(config);
    customLog(LogTraceId, "info", { result: result?.data });
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data?.data?.error || error?.response?.data || {};
    result = { status, data };
    customLog(LogTraceId, "error", { error: result });
  }

  return result;
};

const makeDrivingLicenseVerificationRequest = async (serviceDetails, payload, LogTraceId = null) => {
  const config = {
    method: "post",
    url: `${serviceDetails.vendor.apiUrl}/verification/driving-license`,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": serviceDetails.vendor.optional1,
      "x-client-secret": serviceDetails.vendor.optional2,
    },
    data: payload,
  };

  customLog(LogTraceId, "info", { config });

  let result;

  try {
    result = await axios(config);
    customLog(LogTraceId, "info", { result: result?.data });
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || {};
    result = { status, data };
    customLog(LogTraceId, "error", { error: result });
  }

  return result;
};
