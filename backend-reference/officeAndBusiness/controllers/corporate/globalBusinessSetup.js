const axios = require("axios");
const crypto = require('crypto');
const pusher = require("../../utils/pusher");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");
const { findAllTransactionsForAdmin: findAllTransactions } = require("../../models/use-cases/globalBusinessSetup");
const { uploadFileToS3, getDocumentFromUrl } = require("../../utils/s3");
const accessKey = "global_business_setup";
const FormData = require("form-data");
const { hasPurchasedGlobalBusinessSetup } = require("../../models/use-cases/globalBusinessSetup");
const { getCurrencyExchangeRates } = require("../../models/use-cases/setting");
const { findOne: findOneServiceOperator } = require("../../models/use-cases/serviceOperator");
const {
  bulkUpsertApplications,
  upsertApplicationFromVendor,
  findApplicationsByFilter,
} = require("../../models/use-cases/globalBusinessSetup/application");
const {
  bulkUpsertRenewals,
  upsertRenewalFromVendor,
  findRenewalsByFilter,
} = require("../../models/use-cases/globalBusinessSetup/renewal");
const {
  isApplicationsSynced,
  markApplicationsSynced,
  isRenewalsSynced,
  markRenewalsSynced,
} = require("../../models/use-cases/globalBusinessSetup/userSync");

// Listings are served from our own Mongo cache by default. Set
// GLOBAL_BUSINESS_SETUP_DIRECT_BASE93=true to bypass the cache and hit Base93
// directly (legacy behaviour).
const useGlobalBusinessSetupCache = () =>
  process.env.GLOBAL_BUSINESS_SETUP_DIRECT_BASE93 !== "true";


// Base93 mounts all agent-facing endpoints under this path. Appended once to
// the vendor base URL so every downstream `${apiUrl}/...` call hits the right
// namespace without each call site having to know about it.
const BASE93_AGENT_PATH = '/api/v1/user/external/agent';

async function checkService(req) {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return serviceDetails;
  }
  return {
    ...serviceDetails,
    apiUrl: serviceDetails.vendor.apiUrl + BASE93_AGENT_PATH,
    apiKey: serviceDetails.vendor.optional1,
    healthUrl: serviceDetails.vendor.healthUrl,
  };
}

exports.FetchAllPlans = asyncHandler(async (req, res, next) => {
  try {
    let serviceDetails = await checkService(req);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;
    const { activities, licenceType } = req.query;
    const queryParams = new URLSearchParams();

    if (licenceType) queryParams.append('licenceType', licenceType);
    if (activities) {
      queryParams.append('activities', activities)
    }

    const url = `${apiUrl}/licences/find?${queryParams.toString()}`;
    let config = {
      method: "get",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    customLog(req?.LogTraceId, "info", {
      message: "config for fetching license",
      config
    });
    const response = await axios(config);
    if (!response || !response.data) {
      return next(
        new ErrorResponse("Something went wrong while fetching plans.", 404)
      );
    }
    customLog(req?.LogTraceId, "info", {
      message: "Fetched all license successfully",
      data: response?.data?.data
    });

    return res.status(200).json({
      status: true,
      message: "Plans fetched successfully!",
      responseCode: "000",
      data: response.data,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from FetchAllPlans",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    })
  }
});


exports.findAllGlobalBusinessSetupTransactionsAndCount = asyncHandler(async (req, res, next) => {
  try {
    let { from, to, searchText, page, itemsPerPage } = req.query;
    let corporateId = req.user.id

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    const filter = req.query.filter || undefined;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let categoryName = 'Global Business Setup'
    let sortField = 'transactionDate'

    let serviceAttribute = []
    let credentialAttribute = []
    let transactionAttribute = []
    let orderAttribute = ['id', 'amountInInr', 'paymentMode', 'status', 'orderResponse', 'transactionDate', 'corporateTxnId']

    let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField
    }

    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
    }

    const globalBusinessSetupTransactionsData = await findAllTransactions(params);
    if (!globalBusinessSetupTransactionsData) {
      return next(new ErrorResponse(`Something went wrong while fetching global business setup transactions from DB`, 500))
    } else {
      return res.status(200).json({
        'status': true,
        'data': {
          result: globalBusinessSetupTransactionsData.rows,
          totalData: globalBusinessSetupTransactionsData.count
        },
        'message': 'Global business setup transactions fetched successfully!',
        'responseCode': '000'
      })
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from findAllGlobalBusinessSetupTransactionsAndCount",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching transactions", 500));
  }
})

exports.AddCompanyInfo = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body
    let serviceDetails = await checkService(req);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    // Ownership: confirm the application belongs to the caller before mutating it.
    const ownResp = await axios.get(`${apiUrl}/companies/${encodeURIComponent(data.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ownDoc = ownResp.data?.data || null;
    if (!ownDoc || String(ownDoc.reference_id) !== String(req.user.username)) {
      return next(new ErrorResponse("Application not found", 404));
    }

    const companyData = {
      proposedCompanyName1: data?.companyName1,
      proposedCompanyName2: data?.companyName2,
      proposedCompanyName3: data?.companyName3,
      shortBusinessDescription: data?.description,
    }

    const config = {
      method: "patch",
      url: `${apiUrl}/applications/${data.id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // applicationStatus is intentionally NOT accepted from the client payload — status is
      // vendor/admin-controlled (BFLA). The corporate may only set company details here.
      data: { companyDetails: companyData },
    };
    customLog(req?.LogTraceId, "error", {
      message: "add company info config",
      config
    });
    const response = await axios(config);

    if (!response || !response.data) {
      return next(
        new ErrorResponse("Something went wrong while fetching plans.", 404)
      );
    }
    customLog(req?.LogTraceId, "info", {
      message: "Company info added successfully",
      data: response?.data?.data
    });
    return res.status(200).json({
      status: true,
      message: "Plans fetched successfully!",
      responseCode: "000",
      data: response.data,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from AddCompanyInfo",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    })
  }
});

exports.AddShareholders = asyncHandler(async (req, res, next) => {
  try {
    const data = req.body;
    let serviceDetails = await checkService(req);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400)
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    // Ownership: confirm the application belongs to the caller before mutating it.
    const ownResp = await axios.get(`${apiUrl}/companies/${encodeURIComponent(data.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ownDoc = ownResp.data?.data || null;
    if (!ownDoc || String(ownDoc.reference_id) !== String(req.user.username)) {
      return next(new ErrorResponse("Application not found", 404));
    }

    const formattedOwners = [];

    for (let i = 0; i < data.owners.length; i++) {
      const owner = { ...data.owners[i] };
      const ownerFormatted = {
        typeOfOwner: owner.typeOfOwner,
        shareHolderFullName: owner.shareHolderFullName,
        nationality: owner.nationality,
        ownershipPercentage: Number(owner.ownershipPercentage) || 0,
        designation: owner.designation || '',
        passportNumber: owner.passportNumber || '',
        signatory: owner.signatory,
        country: owner.country,
        passportCopy: '',
        passportSizePhotographs: '',
        visaCopies: '',
        noc: '',
        certificateOfIncorporation: '',
        memorandum: '',
        boardResolution: '',
        shareCertificate: '',
        goodStandingCertificate: '',
        tradeLicense: '',
        passportAuthorisedSignatory: '',
        proofOfAddressCompany: ''
      };

      const documentFields = {
        passportCopy: 'passportCopyFormat',
        passportSizePhotographs: 'passportSizePhotographsFormat',
        visaCopies: 'visaCopiesFormat',
        noc: 'nocFormat',
        certificateOfIncorporation: 'certificateOfIncorporationFormat',
        memorandum: 'memorandumFormat',
        boardResolution: 'boardResolutionFormat',
        shareCertificate: 'shareCertificateFormat',
        goodStandingCertificate: 'goodStandingCertificateFormat',
        tradeLicense: 'tradeLicenseFormat',
        passportAuthorisedSignatory: 'passportAuthorisedSignatoryFormat',
        proofOfAddressCompany: 'proofOfAddressCompanyFormat'
      };


      for (const [fieldKey, formatKey] of Object.entries(documentFields)) {
        const existingUrl = owner[fieldKey];
        const fileFormat = owner[formatKey];

        if (existingUrl && !fileFormat) {
          ownerFormatted[fieldKey] = existingUrl;
          continue;
        }

        if (existingUrl && fileFormat) {
          const filePath = `${process.env.NODE_ENV || "staging"}/globalBusinessSetup/owners`;
          const uploadedUrl = await uploadFileToS3(existingUrl, filePath, fileFormat);

          if (!uploadedUrl) {
            return next(new ErrorResponse(`Failed to upload ${fieldKey} for owner ${i + 1}`, 500));
          }

          switch (fieldKey) {
            case 'passportCopy':
              ownerFormatted.passportCopy = uploadedUrl;
              break;
            case 'passportSizePhotographs':
              ownerFormatted.passportSizePhotographs = uploadedUrl;
              break;
            case 'visaCopies':
              ownerFormatted.visaCopies = uploadedUrl;
              break;
            case 'noc':
              ownerFormatted.noc = uploadedUrl;
              break;
            default:
              ownerFormatted[fieldKey] = uploadedUrl;
          }

          delete owner[fieldKey];
          delete owner[formatKey];
        }
      }


      formattedOwners.push(ownerFormatted);
    }

    const formattedUbos = [];

    if (Array.isArray(data.ubo)) {
      for (let i = 0; i < data.ubo.length; i++) {
        const ubo = data.ubo[i];

        const formatted = {
          name: ubo.name || '',
          nationality: ubo.nationality || '',
          passportNumber: ubo.passportNumber || '',
          dob: ubo.dob || '',
          passportExpiryDate: ubo.passportExpiryDate || '',
          dateOfBecomingUBO: ubo.dateOfBecomingUBO || '',
          uboDeclaration: '',
          passportCopy: ''
        };

        const uboDocs = {
          uboDeclaration: 'uboDeclarationFormat',
          passportCopy: 'passportCopyFormat'
        };

        for (const [fieldKey, formatKey] of Object.entries(uboDocs)) {
          const base64 = ubo[fieldKey];
          const format = ubo[formatKey];

          if (base64 && !format) {
            formatted[fieldKey] = base64;
            continue;
          }

          if (base64 && format) {
            const filePath = `${process.env.NODE_ENV || 'staging'}/globalBusinessSetup/ubos`;
            const uploadedUrl = await uploadFileToS3(base64, filePath, format);

            if (!uploadedUrl) {
              return next(new ErrorResponse(`Failed to upload ${fieldKey} for UBO ${i + 1}`, 500));
            }

            formatted[fieldKey] = uploadedUrl;

            delete ubo[fieldKey];
            delete ubo[formatKey];
          }
        }

        formattedUbos.push(formatted);
      }
    }

    const config = {
      method: "patch",
      url: `${apiUrl}/applications/${data.id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // applicationStatus intentionally NOT accepted from the client payload (BFLA — status
      // is vendor/admin-controlled). The corporate may only set shareholder/UBO details here.
      data: { shareHoldersDetails: formattedOwners, ultimateBeneficialOwner: formattedUbos }
    };
    customLog(req?.LogTraceId, "info", {
      message: "config for submitting shareholders",
      config
    });
    const response = await axios(config);

    if (!response || !response.data) {
      return next(new ErrorResponse("Something went wrong while submitting shareholders.", 404));
    }
    customLog(req?.LogTraceId, "info", {
      message: "Shareholders submitted successfully",
      data: response?.data?.data
    });
    return res.status(200).json({
      status: true,
      message: "Shareholders submitted successfully!",
      responseCode: "000",
      data: response.data,
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from AddShareholders",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    })
  }
});

exports.FetchAllApplications = asyncHandler(async (req, res, next) => {
  try {
    let serviceDetails = await checkService(req);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;
    const url = `${apiUrl}/applications/all?username=${req.user.username}`;
    let config = {
      method: "get",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    customLog(req?.LogTraceId, "info", {
      message: "config for fetching all applications",
      config
    });
    const response = await axios(config);

    if (!response || !response.data) {
      return next(
        new ErrorResponse("Something went wrong while fetching plans.", 404)
      );
    }
    customLog(req?.LogTraceId, "info", {
      message: "Fetched all applications successfully",
      data: response?.data?.data
    });
    return res.status(200).json({
      status: true,
      message: "Plans fetched successfully!",
      responseCode: "000",
      data: response.data.data,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from FetchAllApplications",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    })
  }
});


exports.FetchSingleApplications = asyncHandler(async (req, res, next) => {
  try {
    let serviceDetails = await checkService(req);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/applications/${req.query.id}`;
    let config = {
      method: "get",
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    customLog(req?.LogTraceId, "info", {
      message: "config for fetching applications",
      config
    });
    const response = await axios(config);

    if (!response || !response.data) {
      return next(
        new ErrorResponse("Something went wrong while fetching plans.", 404)
      );
    }
    customLog(req?.LogTraceId, "info", {
      message: "Fetched application successfully",
      data: response?.data?.data
    });
    return res.status(200).json({
      status: true,
      message: "data fetched successfully!",
      responseCode: "000",
      data: response.data.data,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from FetchSingleApplications",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    })
  }
});

exports.getDocument = asyncHandler(async (req, res, next) => {
  try {
    const { key } = req.query

    const result = await getDocumentFromUrl(key);
    if (!result) {
      return next(new ErrorResponse(`Something went wrong while fetching document`, 500));
    }

    return res.status(200).json({
      'status': true,
      'data': result,
      'message': 'Fetched Document successfully',
      'responseCode': '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getDocument",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching document", 500));
  }
});


exports.FetchAllActivities = asyncHandler(async (req, res, next) => {

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'createdAt'

  let serviceDetails = await checkService(req);

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }

  let { searchText, licenseType } = req.query;

  const queryParams = new URLSearchParams();

  if (searchText) queryParams.append('searchText', searchText);

  if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
  }

  if (licenseType) queryParams.append('licenseType', licenseType);

  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;
  const url = `${apiUrl}/licences/findAllActivities?${queryParams.toString()}`;

  let config = {
    method: "get",
    url: url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  };
  axios(config)
    .then(function (response) {
      if (!response) {
        return next(new ErrorResponse(`something went wrong while fetching plans `, 404));
      } else {
        const sortedData = [...response.data.data].sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];

          if (!aVal || !bVal) return 0;

          const isDateField = ['createdat', 'updatedat'].includes(sortField.toLowerCase()) || sortField.toLowerCase().includes('date');

          const aValue = isDateField ? new Date(aVal).getTime() : aVal.toString().toLowerCase();
          const bValue = isDateField ? new Date(bVal).getTime() : bVal.toString().toLowerCase();

          if (aValue < bValue) return sort === 'ASC' ? -1 : 1;
          if (aValue > bValue) return sort === 'ASC' ? 1 : -1;
          return 0;
        });

        return res.status(200).json({
          status: true,
          message: "Activities fetched successfully!",
          responseCode: "000",

          data: {
            data: sortedData,
            totalItems: sortedData.length,
          },
        });
      }
    })
    .catch(function (error) {
      customLog(req?.LogTraceId, "error", {
        message: "ERROR from FetchAllActivities",
        error: error?.message,
        data: error?.response?.data ?? null
      });
      return next(new ErrorResponse(error.message, 500));
    });
});


exports.getVendorCountries = asyncHandler(async (req, res, next) => {
  const {
    filters
  } = req.query;
  const serviceDetails = await checkService(req);

  if (!serviceDetails || serviceDetails.error) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }

  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;

  const url = `${apiUrl}/countries`;
  
  try {
    const response = await axios.get(url, {
      params: {
        page: 1,
        limit: 1000,
        sort: "apps_count:desc",
        filters,
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return res.status(200).json({
      status: true,
      message: "Countries fetched successfully!",
      responseCode: "000",
      data: response.data?.data ?? [],
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getVendorCountries",
      error: error?.message,
      data: error?.response?.data ?? null
    });

    return next(
      new ErrorResponse(
        "Something went wrong while fetching countries",
        500
      )
    );
  }
});


exports.getVendorProviders = asyncHandler(async (req, res, next) => {
  const { country_id, company_type, freezone } = req.query;

  if (!country_id) {
    return next(new ErrorResponse("country_id is required", 400));
  }

  let serviceDetails = await checkService(req);

  if (!serviceDetails || serviceDetails.error) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }

  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;
  const filterParts = [`country=${country_id}`];
  if (company_type) filterParts.push(`company_type=${company_type}`);
  if (freezone) filterParts.push(`freezone=${freezone}`);
  const filters = filterParts.join("&");
  const url = `${apiUrl}/providers?filters=${encodeURIComponent(filters)}`;

  const config = {
    method: "get",
    url: url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  };

  axios(config)
    .then((response) => {
      if (!response) {
        return next(
          new ErrorResponse("Something went wrong while fetching providers", 404)
        );
      }

      return res.status(200).json({
        status: true,
        message: "Providers fetched successfully!",
        responseCode: "000",
        data: response.data?.data ?? []
      });
    })
    .catch((error) => {
      customLog(req?.LogTraceId, "error", {
        message: "ERROR from getVendorProviders",
        error: error?.message,
        data: error?.response?.data ?? null
      });
      return next(new ErrorResponse("Something went wrong", 500));
    });
});

exports.getProviderDetails = asyncHandler(async (req, res, next) => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      return next(new ErrorResponse("providerId is required", 400));
    }

    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/providers/${providerId}`;

    const response = await axios.get(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });

    return res.status(200).json({
      status: true,
      message: "Provider details fetched successfully!",
      responseCode: "000",
      data: response.data?.data ?? null
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getProviderDetails",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});


exports.getVendorForms = asyncHandler(async (req, res, next) => {
  const { country_id, company_type, region, type } = req.query;

  if (!country_id || !company_type) {
    return next(new ErrorResponse("country_id and company_type are required", 400));
  }

  let serviceDetails = await checkService(req);

  if (!serviceDetails || serviceDetails.error) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }

  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;
  const query = new URLSearchParams();
  query.append("country", country_id);
  query.append("company_type", company_type);
  if (region) query.append("freezone", region);
  if (type) query.append("type", type);

  const url = `${apiUrl}/forms?${query.toString()}`;

  const config = {
    method: "get",
    url: url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  };

  axios(config)
    .then((response) => {
      if (!response) {
        return next(
          new ErrorResponse("Something went wrong while fetching vendor forms", 404)
        );
      }

      return res.status(200).json({
        status: true,
        message: "Vendor forms fetched successfully!",
        responseCode: "000",
        data: response.data?.data ?? []
      });
    })
    .catch((error) => {
      const vendorStatus = error?.response?.status;
      const vendorData = error?.response?.data;

      customLog(req?.LogTraceId, "error", {
        message: "ERROR from getVendorForms",
        error: error?.message,
        data: vendorData,
        status: vendorStatus,
      });

      if (
        vendorStatus === 404 &&
        vendorData?.message === "No form found" &&
        vendorData?.responseCode === "BASE93_ERROR"
      ) {
        return res.status(200).json({
          status: true,
          message: 'No forms available',
          responseCode: '000',
          data: null,
        });
      }

      return next(
        new ErrorResponse(
          "Something went wrong while fetching forms",
          500
        )
      );
    });
});

exports.getFormById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ErrorResponse("Invalid request.", 400);
    }

    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse(
        "Service temporarily unavailable.",
        400
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/forms/${id}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json({
      status: true,
      message: "Form fetched successfully.",
      responseCode: "000",
      data: response.data?.data ?? null,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getFormById",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching form", 500));
  }
});

exports.getAllVendorApplications = asyncHandler(async (req, res, next) => {
  try {
    let { page = 1, itemsPerPage = 10, filters, from, to, searchText } = req.query;

    const username = req.user.username
    const period =
      from && to
        ? `${from},${to}`
        : 'all';
    // Build filters server-side only — a client-supplied ?filters= must never drop the
    // reference_id tenant scope (would return every tenant's applications).
    filters = `period=${period};status=saved,assigned,submitted,closed,rejected;reference_id=${username};is_paid=true`;

    let sortDirection = req.query.sort && req.query.sort.toUpperCase() === "DESC"
      ? "desc"
      : "asc";
    const sort = `created_at:${sortDirection}`;

    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;


    const url = `${apiUrl}/companies`;

    const response = await axios.get(url, {
      params: {
        page,
        limit: itemsPerPage,
        filters,
        sort,
        search: searchText
      },
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({
      status: true,
      message: "Applications fetched successfully!",
      responseCode: "000",
      data: response.data.data || [],
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getAllVendorApplications",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching applications", 500));
  }
});

exports.getOngoingVendorApplications = asyncHandler(async (req, res, next) => {
  try {
    let { page = 1, itemsPerPage = 10, filters, from, to, searchText } = req.query;

    const username = req.user.username;
    const userId = req.user.id;
    const cacheMode = useGlobalBusinessSetupCache();

    if (cacheMode) {
      const synced = await isApplicationsSynced(username);
      if (!synced) {
        const period = from && to ? `${from},${to}` : 'all';
        const fallbackFilters = `period=${period};reference_id=${username}`;
        const vendorPayload = await fetchCompaniesFromVendor(req, {
          page: 1, itemsPerPage: 200, filters: fallbackFilters, sort: 'DESC', searchText: undefined,
        });
        const companies = vendorPayload?.companies || [];
        if (companies.length) await bulkUpsertApplications(companies, username, userId);
        await markApplicationsSynced(username, userId);
      }

      const result = await findApplicationsByFilter({
        referenceId: username,
        isPaid: true,
        page,
        itemsPerPage,
        searchText,
        sort: req.query.sort,
        from,
        to,
      });

      return res.status(200).json({
        status: true,
        message: "Ongoing setups fetched successfully!",
        responseCode: "000",
        data: result,
      });
    }

    const period = from && to ? `${from},${to}` : 'all';
    // Build filters server-side only — client ?filters= must never drop the reference_id scope.
    filters = `period=${period};status=saved,assigned,submitted;reference_id=${username};is_paid=true`;
    const result = await fetchOngoingFromVendor(req, {
      page, itemsPerPage, filters, sort: req.query.sort, searchText,
    });

    return res.status(200).json({
      status: true,
      message: "Ongoing setups fetched successfully!",
      responseCode: "000",
      data: result || [],
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getOngoingVendorApplications",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching ongoing setups", 500));
  }
});

async function fetchOngoingFromVendor(req, { page, itemsPerPage, filters, sort, searchText }) {
  const sortDirection = sort && String(sort).toUpperCase() === "DESC" ? "desc" : "asc";
  const sortStr = `created_at:${sortDirection}`;

  const serviceDetails = await checkService(req);
  if (!serviceDetails || serviceDetails.error) {
    throw new Error("Service unavailable");
  }
  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;
  const url = `${apiUrl}/companies`;

  const response = await axios.get(url, {
    params: { page, limit: itemsPerPage, filters, sort: sortStr, search: searchText },
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return response.data?.data || { companies: [], total: 0 };
}

exports.getRenewalApplications = asyncHandler(async (req, res, next) => {
  try {
    let { page = 1, itemsPerPage = 10, filters, searchText } = req.query;

    const username = req.user.username;
    const userId = req.user.id;
    const cacheMode = useGlobalBusinessSetupCache();

    if (cacheMode) {
      const synced = await isRenewalsSynced(username);
      if (!synced) {
        const fallbackFilters = `reference_id=${username}`;
        const vendorPayload = await fetchRenewalsFromVendor(req, {
          page: 1, itemsPerPage: 200, filters: fallbackFilters, sort: 'DESC', searchText: undefined,
        });
        const renewals = vendorPayload?.renewals || [];
        if (renewals.length) await bulkUpsertRenewals(renewals, username, userId);
        await markRenewalsSynced(username, userId);
      }

      const result = await findRenewalsByFilter({
        referenceId: username,
        page,
        itemsPerPage,
        searchText,
        sort: req.query.sort,
      });

      return res.status(200).json({
        status: true,
        message: "Renewal requests fetched successfully!",
        responseCode: "000",
        data: result,
      });
    }

    // Build filters server-side only — client ?filters= must never drop the reference_id scope.
    filters = `reference_id=${username}`;
    const result = await fetchRenewalsFromVendor(req, {
      page, itemsPerPage, filters, sort: req.query.sort, searchText,
    });

    return res.status(200).json({
      status: true,
      message: "Renewal requests fetched successfully!",
      responseCode: "000",
      data: result || [],
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getRenewalApplications",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching renewal requests", 500));
  }
});

async function fetchRenewalsFromVendor(req, { page, itemsPerPage, filters, sort, searchText }) {
  const sortDirection = sort && String(sort).toUpperCase() === "DESC" ? "desc" : "asc";
  const sortStr = `created_at:${sortDirection}`;

  const serviceDetails = await checkService(req);
  if (!serviceDetails || serviceDetails.error) {
    throw new Error("Service unavailable");
  }
  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;
  const url = `${apiUrl}/renewals`;

  const response = await axios.get(url, {
    params: { page, limit: itemsPerPage, filters, sort: sortStr, search: searchText },
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return response.data?.data || { renewals: [], total: 0 };
}

exports.getRenewalApplicationById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/renewals/${id}`;

    const response = await axios.get(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const vendorDoc = response.data?.data || null;

    // Ownership: the fetched renewal must belong to the caller (shared reseller key).
    if (!vendorDoc || String(vendorDoc.reference_id) !== String(req.user.username)) {
      return next(new ErrorResponse("Renewal not found", 404));
    }

    if (vendorDoc?._id) {
      try {
        await upsertRenewalFromVendor(vendorDoc, req.user?.username, req.user?.id);
      } catch (e) {
        customLog(req?.LogTraceId, "warn", {
          message: "Failed to upsert renewal cache from detail fetch",
          error: e?.message,
        });
      }
    }

    // Vendor (Base93) prices renewal proposals in USD regardless of the
    // company's country. The FE displays the breakdown with INR labels and
    // uses `breakdown.total` as the payment amount, so always convert unless
    // the vendor explicitly tagged the quote as INR. The helper defaults to
    // USD when `currency` is missing, matching the vendor's blanket rule.
    if (
      vendorDoc?.quote?.breakdown &&
      String(vendorDoc.quote.currency || "").toUpperCase() !== "INR"
    ) {
      const rates = await fetchCurrencyRatesMap();
      if (rates) {
        vendorDoc.quote = convertRenewalQuoteToInr(vendorDoc.quote, rates);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Renewal detail fetched successfully!",
      responseCode: "000",
      data: vendorDoc,
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getRenewalApplicationById",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching renewal detail", 500));
  }
});


// ─── Renewal: create / search companies / form config / revision ─────────────

exports.searchRenewalCompanies = asyncHandler(async (req, res, next) => {
  try {
    const { search } = req.query;
    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }
    const response = await axios.get(`${serviceDetails.apiUrl}/renewals/companies/search`, {
      params: { search },
      headers: {
        Authorization: `Bearer ${serviceDetails.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    return res.status(200).json({
      status: true,
      message: "Companies fetched successfully.",
      responseCode: "000",
      data: response.data?.data ?? { companies: [] },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from searchRenewalCompanies",
      error: error?.message,
      data: error?.response?.data ?? null,
    });
    return next(new ErrorResponse("Something went wrong while searching companies", 500));
  }
});

exports.getRenewalFormConfig = asyncHandler(async (req, res, next) => {
  try {
    const { country, company_type, freezone } = req.query;
    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }
    const response = await axios.get(`${serviceDetails.apiUrl}/renewals/form-config`, {
      params: { country, company_type, freezone },
      headers: {
        Authorization: `Bearer ${serviceDetails.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    return res.status(200).json({
      status: true,
      message: "Renewal form config fetched successfully.",
      responseCode: "000",
      data: response.data?.data ?? [],
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getRenewalFormConfig",
      error: error?.message,
      data: error?.response?.data ?? null,
    });
    return next(new ErrorResponse("Something went wrong while fetching form config", 500));
  }
});

exports.createRenewalRequest = asyncHandler(async (req, res, next) => {
  try {
    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }

    // Frontend multipart shape (mirrors renewal-v3):
    //   company | external_company (JSON string) | renewal_type |
    //   additional_fields (JSON) | reference_id? | af_<name> (File parts)
    const formData = new FormData();
    Object.entries(req.body || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    if (!req.body?.reference_id && req.user?.username) {
      formData.append("reference_id", req.user.username);
    }
    if (Array.isArray(req.files)) {
      req.files.forEach(file => {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });
    }

    const response = await axios({
      method: "post",
      url: `${serviceDetails.apiUrl}/renewals`,
      data: formData,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${serviceDetails.apiKey}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const createdDoc = response?.data?.data || response?.data || null;
    const createdId = createdDoc?._id;

    let populatedDoc = createdDoc;
    if (createdId) {
      try {
        const detailRes = await axios.get(
          `${serviceDetails.apiUrl}/renewals/${createdId}`,
          {
            headers: {
              Authorization: `Bearer ${serviceDetails.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        populatedDoc = detailRes?.data?.data || detailRes?.data || createdDoc;
      } catch (e) {
        customLog(req?.LogTraceId, "warn", {
          message: "Failed to re-fetch renewal detail after create",
          error: e?.message,
        });
      }

      try {
        await upsertRenewalFromVendor(populatedDoc, req.user?.username, req.user?.id);
      } catch (e) {
        customLog(req?.LogTraceId, "warn", {
          message: "Failed to upsert renewal cache after create",
          error: e?.message,
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: "Renewal request submitted successfully.",
      responseCode: "000",
      data: populatedDoc,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from createRenewalRequest",
      error: error?.message,
      data: error?.response?.data ?? null,
    });
    const errMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while submitting the renewal request";
    return next(new ErrorResponse(errMessage, error?.response?.status || 500));
  }
});

exports.requestRenewalRevision = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }
    // Ownership: confirm the renewal belongs to the caller before requesting a revision.
    const ownResp = await axios.get(`${serviceDetails.apiUrl}/renewals/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${serviceDetails.apiKey}` },
    });
    const ownDoc = ownResp.data?.data || null;
    if (!ownDoc || String(ownDoc.reference_id) !== String(req.user.username)) {
      return next(new ErrorResponse("Renewal not found", 404));
    }
    const response = await axios.post(
      `${serviceDetails.apiUrl}/renewals/${id}/request-revision`,
      {},
      {
        headers: {
          Authorization: `Bearer ${serviceDetails.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const vendorDoc = response?.data?.data || response?.data || null;
    if (vendorDoc?._id) {
      try {
        await upsertRenewalFromVendor(vendorDoc, req.user?.username, req.user?.id);
      } catch (e) {
        customLog(req?.LogTraceId, "warn", {
          message: "Failed to upsert renewal cache after revision",
          error: e?.message,
        });
      }
    }
    return res.status(200).json({
      status: true,
      message: "Revision requested successfully.",
      responseCode: "000",
      data: vendorDoc,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from requestRenewalRevision",
      error: error?.message,
      data: error?.response?.data ?? null,
    });
    const errMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while requesting revision";
    return next(new ErrorResponse(errMessage, error?.response?.status || 500));
  }
});


exports.getDraftVendorApplications = asyncHandler(async (req, res, next) => {
  try {
    let { page = 1, itemsPerPage = 10, filters, from, to, searchText } = req.query;
    const username = req.user.username;
    const userId = req.user.id;
    const cacheMode = useGlobalBusinessSetupCache();

    if (cacheMode) {
      const synced = await isApplicationsSynced(username);
      if (!synced) {
        const period = from && to ? `${from},${to}` : 'all';
        const fallbackFilters = `period=${period};reference_id=${username}`;
        const vendorPayload = await fetchCompaniesFromVendor(req, {
          page: 1, itemsPerPage: 200, filters: fallbackFilters, sort: 'DESC', searchText: undefined,
        });
        const companies = vendorPayload?.companies || [];
        if (companies.length) await bulkUpsertApplications(companies, username, userId);
        await markApplicationsSynced(username, userId);
      }

      const result = await findApplicationsByFilter({
        referenceId: username,
        isPaid: false,
        page,
        itemsPerPage,
        searchText,
        sort: req.query.sort,
      });

      return res.status(200).json({
        status: true,
        message: "Draft applications fetched successfully!",
        responseCode: "000",
        data: result,
      });
    }

    const period = from && to ? `${from},${to}` : 'all';
    // Build filters server-side only — client ?filters= must never drop the reference_id scope.
    filters = `period=${period};status=draft,saved;reference_id=${username};is_paid=false`;
    const result = await fetchCompaniesFromVendor(req, {
      page, itemsPerPage, filters, sort: req.query.sort, searchText,
    });

    return res.status(200).json({
      status: true,
      message: "Draft applications fetched successfully!",
      responseCode: "000",
      data: result || [],
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getDraftVendorApplications",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Somthing went wrong while fetching drafts", 500));
  }
});

async function fetchCompaniesFromVendor(req, { page, itemsPerPage, filters, sort, searchText }) {
  const sortDirection = sort && String(sort).toUpperCase() === "DESC" ? "desc" : "asc";
  const sortStr = `created_at:${sortDirection}`;

  const serviceDetails = await checkService(req);
  if (!serviceDetails || serviceDetails.error) {
    throw new Error("Service unavailable");
  }
  const apiUrl = serviceDetails.apiUrl;
  const token = serviceDetails.apiKey;
  const url = `${apiUrl}/companies`;

  const response = await axios.get(url, {
    params: { page, limit: itemsPerPage, filters, sort: sortStr, search: searchText },
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return response.data?.data || { companies: [], total: 0 };
}

exports.getVendorApplicationDetails = asyncHandler(async (req, res, next) => {
  try {
    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const { id } = req.params;

    const url = `${apiUrl}/companies/${id}`;

    const response = await axios.get(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const vendorDoc = response.data?.data || null;

    // Ownership: the vendor shares one reseller key, so the fetched doc must belong to the
    // caller before we cache or return it (blocks cross-tenant read + cache reassignment).
    if (!vendorDoc || String(vendorDoc.reference_id) !== String(req.user.username)) {
      return next(new ErrorResponse("Application not found", 404));
    }

    if (vendorDoc?._id) {
      try {
        await upsertApplicationFromVendor(vendorDoc, req.user?.username, req.user?.id);
      } catch (e) {
        customLog(req?.LogTraceId, "warn", {
          message: "Failed to upsert application cache from detail fetch",
          error: e?.message,
        });
      }
    }

    // Serve `pricing` in its NATIVE currency and attach the INR rate — Review /
    // PaymentSummary show native amounts; conversion to INR happens only at the
    // payment step (FE converts via `inr_rate`).
    if (vendorDoc?.pricing) {
      const rates = (await fetchCurrencyRatesMap()) || {};
      vendorDoc.pricing = attachInrRate(vendorDoc.pricing, rates);
    }

    return res.status(200).json({
      status: true,
      message: "Application details fetched successfully!",
      responseCode: "000",
      data: vendorDoc,
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getVendorApplicationDetails",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Somthing went wrong while fetching application details", 500));
  }
});

exports.deleteVendorApplication = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ErrorResponse("Invalid request.", 400);
    }

    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse(
        "Service temporarily unavailable.",
        400
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/companies/${encodeURIComponent(id)}`;

    // Confirm ownership before deleting via the shared reseller key — a foreign id must 404
    // and make no delete call.
    const detail = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const doc = detail.data?.data || null;
    if (!doc || String(doc.reference_id) !== String(req.user.username)) {
      return next(new ErrorResponse("Application not found", 404));
    }

    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.status(200).json({
      status: true,
      message: "Application deleted successfully.",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from deleteVendorApplication",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while deleting application", 500));
  }
});

exports.submitCompanyApplication = asyncHandler(async (req, res, next) => {
  try {
    const serviceDetails = await checkService(req);
    const applicationId = req.query.applicationId
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const isUpdate = Boolean(applicationId && String(applicationId).trim());
    const url = isUpdate ? `${apiUrl}/companies/${encodeURIComponent(applicationId)}` : `${apiUrl}/companies`;
    const method = isUpdate ? "patch" : "post";

    // Ownership: an update must target the caller's own application (a create has no id yet).
    if (isUpdate) {
      const ownResp = await axios.get(`${apiUrl}/companies/${encodeURIComponent(applicationId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ownDoc = ownResp.data?.data || null;
      if (!ownDoc || String(ownDoc.reference_id) !== String(req.user.username)) {
        return next(new ErrorResponse("Application not found", 404));
      }
    }

    const formData = new FormData();

    objectToFormData(req.body, formData);

    if (Array.isArray(req.files)) {
      req.files.forEach(file => {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });
    }

    const response = await axios({
      method,
      url,
      data: formData,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const vendorData = response?.data?.data || {};

    try {
      const vendorId = vendorData._id || vendorData.vendorApplicationId || null;
      if (vendorId) {
        await upsertApplicationFromVendor(
          {
            ...vendorData,
            _id: vendorId,
            reference_id: req.user?.username,
            is_paid: vendorData.is_paid ?? false,
            created_at: vendorData.created_at || new Date(),
          },
          req.user?.username,
          req.user?.id,
        );
      }
    } catch (e) {
      customLog(req?.LogTraceId, "warn", {
        message: "Failed to upsert application cache after submit",
        error: e?.message,
      });
    }

    res.status(200).json({
      status: true,
      message: "Application submitted successfully.",
      responseCode: "000",
      data: {
        vendorApplicationId: vendorData._id || vendorData.vendorApplicationId || null,
        status: vendorData.status || null,
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from submitCompanyApplication",
      error: error?.message,
      data: error?.response?.data ?? null
    });

    const vendorData = error?.response?.data;
    const vendorErrors = Array.isArray(vendorData?.errors) ? vendorData.errors : null;

    let errMessage =
      vendorData?.message
      || (vendorErrors && vendorErrors[0])
      || error?.message
      || "Something went wrong while submitting application";

    if (vendorData?.message === "Proposed company name is required") {
      errMessage = "The first proposed company name is required to continue";
    }

    return next(
      new ErrorResponse(errMessage, error?.response?.status || 500, vendorErrors || undefined)
    );
  }
});

exports.checkWalletBalanceAndSendOtp = asyncHandler(async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      throw new ErrorResponse("Invalid request.", 400);
    }

    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const balanceResponse = await axios.get(
      `${apiUrl}/wallet`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const balance =
      balanceResponse?.data?.data?.balance ?? null;

    if (balance === null) {
      throw new ErrorResponse("Unable to fetch wallet balance.", 400);
    }

    if (Number(amount) > Number(balance)) {
      return res.status(200).json({
        status: false,
        message: "Insufficient wallet balance.",
        responseCode: "INSUFFICIENT_BALANCE",
        data: {
          balance,
        },
      });
    }

    res.status(200).json({
      status: true,
      message: "Wallet balance verified and OTP sent successfully.",
      responseCode: "000",
      data: {
        balance,
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from checkWalletBalanceAndSendOtp",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong, please try again later.", 500));
  }
});


exports.checkGlobalBusinessSetupStatus = asyncHandler(async (req, res, next) => {
  try {

    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    const serviceOperatorId = serviceDetails.id;

    const globalBusinessSetupOrder = await hasPurchasedGlobalBusinessSetup({
      credentialId,
      serviceOperatorId,
    });

    return res.status(200).json({
      status: true,
      message: "Global Business Setup status fetched successfully",
      data: {
        hasPurchasedGlobalBusinessSetup: Boolean(globalBusinessSetupOrder),
        globalBusinessSetupOrderId: globalBusinessSetupOrder?.id || null,
        purchasedAt: globalBusinessSetupOrder?.createdAt || null,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from checkGlobalBusinessSetupStatus",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong, please try again later.", 500));
  }
});

exports.getVendorFormTableById = asyncHandler(async (req, res, next) => {
  try {
    const { tableId } = req.params;

    if (!tableId) {
      return next(new ErrorResponse("tableId is required", 400));
    }

    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/forms/tables/${tableId}`;

    const config = {
      method: "get",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios(config);

    if (!response) {
      return next(
        new ErrorResponse("Something went wrong while fetching table data", 404)
      );
    }

    return res.status(200).json({
      status: true,
      message: "Form table fetched successfully!",
      responseCode: "000",
      data: response.data?.data ?? null,
    });
  } catch (error) {
    const vendorStatus = error?.response?.status;
    const vendorData = error?.response?.data;

    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getVendorFormTableById",
      error: error?.message,
      data: vendorData,
      status: vendorStatus,
    });

    if (vendorStatus === 404 && vendorData?.message === "No table found") {
      return res.status(200).json({
        status: true,
        message: "No table data available",
        responseCode: "000",
        data: null,
      });
    }

    return next(
      new ErrorResponse("Something went wrong while fetching table data", 500)
    );
  }
});

// Vendor (Base93) returns pricing in country-local currency (USD, AUD, EUR, …).
// Peko IN's wallet/payments/invoices/journals are INR-only, so convert at the
// boundary using the rates stored in the `setting` table row
// `name = "currencyExchangeRate"`. Each entry is keyed by ISO currency code
// with `value` = "units of that currency per 1 INR" (INR itself is 1).
// To convert foreign → INR: divide foreignAmount by value.
async function fetchCurrencyRatesMap() {
  try {
    const row = await getCurrencyExchangeRates();
    const details = row?.details;
    return details && typeof details === "object" ? details : null;
  } catch (e) {
    return null;
  }
}

function toInr(value, rate) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  if (!rate || rate <= 0) return value;
  return Math.round((value / rate) * 100) / 100;
}

// New currency policy: serve pricing in its NATIVE currency (the vendor's
// Pricing V2 model + form-bound amount components must stay native) and attach
// the INR conversion rate so the frontend converts to INR only at payment time.
// `inr_rate` = units of pricing.currency per 1 INR (INR itself = 1); null when a
// non-INR currency has no configured rate (the pay step must then block).
function attachInrRate(pricing, rates) {
  if (!pricing || typeof pricing !== "object") return pricing;
  const code = String(pricing.currency || "INR").toUpperCase();
  if (!code || code === "INR") return { ...pricing, inr_rate: 1 };
  const rate = Number(rates?.[code]?.value);
  return { ...pricing, inr_rate: Number.isFinite(rate) && rate > 0 ? rate : null };
}

// Renewal quotes from Base93 have a flat breakdown (government_fees,
// service_fee, gst, total) where gst is an amount (not a percentage),
// so every breakdown field is monetary and gets divided by `rate`.
// Per vendor: renewal proposals are always priced in USD regardless of the
// company's country, so default to USD when `currency` is absent.
function convertRenewalQuoteToInr(quote, rates) {
  if (!quote || typeof quote !== "object") return quote;
  const code = String(quote.currency || "USD").toUpperCase();
  if (code === "INR") return quote;
  const rate = Number(rates?.[code]?.value);
  if (!Number.isFinite(rate) || rate <= 0) return quote;

  const out = { ...quote };
  if (out.breakdown && typeof out.breakdown === "object") {
    out.breakdown = Object.fromEntries(
      Object.entries(out.breakdown).map(([k, v]) => [
        k,
        typeof v === "number" ? toInr(v, rate) : v,
      ])
    );
  }
  out.currency = "INR";
  out.currency_symbol = "INR";
  return out;
}

const objectToFormData = (obj, formData = new FormData(), parentKey = "") => {
  if (obj === null || obj === undefined) return formData;

  if (typeof File !== "undefined" && obj instanceof File) {
    formData.append(parentKey, obj);
    return formData;
  }

  if (Buffer.isBuffer(obj)) {
    formData.append(parentKey, obj);
    return formData;
  }

  if (Array.isArray(obj)) {
    obj.forEach((value, index) => {
      objectToFormData(value, formData, `${parentKey}[${index}]`);
    });
    return formData;
  }

  if (typeof obj === "object") {
    Object.entries(obj).forEach(([key, value]) => {
      const formKey = parentKey ? `${parentKey}[${key}]` : key;
      objectToFormData(value, formData, formKey);
    });
    return formData;
  }

  formData.append(parentKey, String(obj));
  return formData;
};

exports.getPlanPricing = asyncHandler(async (req, res, next) => {
  try {
    const { country, company_type, freezone } = req.query;

    if (!country || !company_type) {
      return next(
        new ErrorResponse("country and company_type are required", 400)
      );
    }

    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    // Base93's pricing collection is keyed by country + company_type. Send
    // these as direct query params (the `?filters=...` wrapper used by
    // /providers seems to be ignored by /pricing — Base93 returns the global
    // list regardless). We also apply a defensive server-side filter on the
    // response below.
    const queryParams = { country, company_type };
    if (freezone) queryParams.freezone = freezone;

    customLog(req?.LogTraceId, "info", {
      message: "Fetching pricing from Base93",
      url: `${apiUrl}/pricing`,
      queryParams,
    });

    const response = await axios({
      method: "get",
      url: `${apiUrl}/pricing`,
      params: queryParams,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    customLog(req?.LogTraceId, "info", { message: "Pricing response from Base93", data: response.data });

    const rawPricing =
      response.data?.data?.pricing ?? response.data?.data ?? response.data ?? [];
    const pricing = Array.isArray(rawPricing) ? rawPricing : [];

    // Serve pricing in its NATIVE currency and attach the INR rate. Conversion
    // to INR happens only at payment time (the FE converts via `inr_rate`), so
    // selection/quote/form/review can show the vendor's real currency and the
    // Pricing V2 amount/bracket math stays in that currency.
    const rates = (await fetchCurrencyRatesMap()) || {};
    const pricingWithRate = pricing.map((p) => attachInrRate(p, rates));

    return res.status(200).json({
      status: true,
      message: "Pricing fetched successfully",
      responseCode: "000",
      data: pricingWithRate,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getPlanPricing",
      error: error?.message,
      data: error?.response?.data ?? null
    });
    return next(new ErrorResponse("Something went wrong while fetching pricing", 500));
  }
});



exports.getFileDownloadUrl = asyncHandler(async (req, res, next) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      throw new ErrorResponse("File id is required.", 400);
    }

    const serviceDetails = await checkService(req);

    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }

    const apiUrl = serviceDetails.apiUrl;
    const token = serviceDetails.apiKey;

    const url = `${apiUrl}/files/${fileId}/download-url`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json({
      status: true,
      message: "Download URL generated.",
      responseCode: "000",
      data: response.data?.data ?? response.data ?? null,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ERROR from getFileDownloadUrl",
      error: error?.message,
      data: error?.response?.data ?? null,
    });
    return next(
      new ErrorResponse(
        error?.response?.data?.message || "Could not fetch download URL.",
        error?.response?.status || 500
      )
    );
  }
});

// ---------------------------------------------------------------------------
// Consent (vendor: /user/agent/companies/:id/consent/*) — straight proxies.
// ---------------------------------------------------------------------------

const proxyConsentRequest = async (req, res, next, { method, path, successMessage, label }) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ErrorResponse("Application id is required.", 400);
    }

    const serviceDetails = await checkService(req);
    if (!serviceDetails || serviceDetails.error) {
      throw new ErrorResponse("Service temporarily unavailable.", 400);
    }

    const url = `${serviceDetails.apiUrl}/companies/${id}/consent/${path}`;
    const headers = {
      Authorization: `Bearer ${serviceDetails.apiKey}`,
      "Content-Type": "application/json",
    };

    const response =
      method === "post"
        ? await axios.post(url, {}, { headers })
        : await axios.get(url, { headers });

    return res.status(200).json({
      status: true,
      message: successMessage,
      responseCode: "000",
      data: response.data?.data ?? response.data ?? null,
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: `ERROR from ${label}`,
      error: error?.message,
      data: error?.response?.data ?? null,
    });
    return next(
      new ErrorResponse(
        error?.response?.data?.message || `Something went wrong while processing consent`,
        error?.response?.status || 500
      )
    );
  }
};

exports.sendConsentRequest = asyncHandler(async (req, res, next) =>
  proxyConsentRequest(req, res, next, {
    method: "post",
    path: "send",
    successMessage: "Consent request sent successfully!",
    label: "sendConsentRequest",
  })
);

exports.sendConsentDocusign = asyncHandler(async (req, res, next) =>
  proxyConsentRequest(req, res, next, {
    method: "post",
    path: "docusign",
    successMessage: "Consent sent via DocuSign successfully!",
    label: "sendConsentDocusign",
  })
);

exports.refreshConsentStatus = asyncHandler(async (req, res, next) =>
  proxyConsentRequest(req, res, next, {
    method: "get",
    path: "refresh",
    successMessage: "Consent status refreshed successfully!",
    label: "refreshConsentStatus",
  })
);

exports.downloadConsentDocument = asyncHandler(async (req, res, next) => {
  const { kind } = req.params;
  if (!["signed", "certificate"].includes(kind)) {
    return next(new ErrorResponse("Invalid consent document kind.", 400));
  }
  return proxyConsentRequest(req, res, next, {
    method: "get",
    path: `document/${kind}`,
    successMessage: "Consent document fetched successfully!",
    label: "downloadConsentDocument",
  });
});

exports.updateGlobalBusinessSetupAiCheckStatus = async (req, res) => {
    try {
        customLog(req?.LogTraceId, "info", {
            message: "Base93 AI-check WEBHOOK CALL RECEIVED",
            body: req.body
        }, "VENDOR");

        const signatureHeader = req.headers['x-base93-signature'];

        const serviceOperator = await findOneServiceOperator({ accessKey });
        const secret = serviceOperator?.vendor?.optional3;

        if (!secret || !signatureHeader) {
            return res.status(401).json({ status: false, message: 'Missing signature' });
        }

        const [algorithm, ...rest] = signatureHeader.split('=');
        const receivedHmac = rest.join('=');

        if (algorithm !== 'sha256' || !receivedHmac) {
            return res.status(401).json({ status: false, message: 'Invalid signature format' });
        }

        const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(req.rawBody)
            .digest('hex');

        let isValid = false;

        try {
            if (receivedHmac.length === expectedHmac.length) {
                isValid = crypto.timingSafeEqual(
                    Buffer.from(receivedHmac, 'hex'),
                    Buffer.from(expectedHmac, 'hex')
                );
            }
        } catch (err) {
            customLog(req?.LogTraceId, "error", {
                message: "HMAC comparison failed",
                error: err.message
            }, "VENDOR");
        }

        if (!isValid) {
            const fallbackHmac = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (receivedHmac === fallbackHmac) {
                isValid = true;
            }
        }

        if (!isValid) {
            customLog(req?.LogTraceId, "error", {
                message: "Base93 webhook signature mismatch"
            }, "VENDOR");

            return res.status(401).json({ status: false, message: 'Invalid signature' });
        }

        const { stage, message, status, reference_id } = req.body;

        if (!reference_id) {
            customLog(req?.LogTraceId, "error", {
                message: "reference_id missing in webhook payload"
            }, "VENDOR");

            return res.status(400).json({ status: false, message: 'reference_id is required' });
        }

        // Forward the FULL vendor payload so the new submit-progress sub-item
        // fields (key, field_label, section_title, filename, size_mb, label,
        // entity_name, match_count, matched_names, proposed_name, tracking_id,
        // application_id, …) survive the relay.
        await pusher.trigger(
            `global-business-setup-${reference_id}`,
            'ai-check-status',
            {
                ...req.body,
                stage,
                status,
                message,
                reference_id,
            }
        );

        customLog(req?.LogTraceId, "info", {
            message: "AI-check status pushed to Pusher",
            reference_id,
            stage,
            status
        }, "VENDOR");

        return res.status(200).json({ status: true, message: 'ok' });

    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "ERROR from updateGlobalBusinessSetupAiCheckStatus",
            error: error?.message
        }, "VENDOR");

        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
