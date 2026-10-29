
const axios = require('axios')
const puppeteer = require("puppeteer");
const fs = require("fs");
const asyncHandler = require("../../middlewares/async");
const {
    findEsimByName,
    createEsim,
    findAllEsimsAndCount,
    updateEsim,
    checkService,
    findEsimById,
    esimPlansExport,
    updateEsimByPlanId,
    findEsimPlanByPlanId
} = require("../../models/use-cases/esim");

const countries = require("../../public/countries.json");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { fetchEsimBulkUploadTemplate } = require('../../services/EsimPlan');
const crypto = require('crypto');
const operatorsData = require("../../utils/operatorsData.json");
const { customLog } = require('../../utils/loggerHelper');
const { syncTunzInventory } = require('../../utils/tunzSync');
const { getCurrencyExchangeRate } = require('../../models/use-cases/setting');

const accessKey = operatorsData.eSIM.accessKey

exports.createEsim = asyncHandler(async (req, res, next) => {
    let serviceDetails = await checkService(accessKey)
    if (serviceDetails === false) {
        return res.status(400).json({
            status: false,
            message: "Apologies, the service you are trying to access is currently unavailable.",
            data: {},
            responseCode: "001"
        });
    }
    const URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1
    const data = req.body;
    const planName = `${data.country}_${(data.dataMBs / 1024) % 1 === 0 
        ? (data.dataMBs / 1024) 
        : (data.dataMBs / 1024).toFixed(1)}_GB_${data.periodDays}_d`;
    let isEsimAvailable = await findEsimByName(planName);
    if (isEsimAvailable.success) {
        return next(new ErrorResponse(`eSIM plan already exists`, 403));
    }
    if (token) {
        let url = `${URL}/v1/plans`;
        let config = {
            method: "post",
            url: `${url}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            data: { ...data,name :planName, periodIterations: 1, throttledSpeedKbps: 0 }
        };
        let response;
        if (process.env.NODE_ENV === 'production') {
            response = await axios(config);
        }
        else{
            response = {
                status: 201, data: {
                    "id": `plan_${crypto.randomUUID()}`,
                    "name": planName,
                    "voiceMinutes": 60,
                    "dataMegaBytes": data.dataMBs,
                    "smsMessages": 100,
                    "periodDays": 1,
                    "periodIterations": 7,
                    "throttledSpeedKbps": 128,
                    "archivedAt": null,
                    "label": "alpha",
                    "coverage": {
                        "id": "cvpr_jaaneha1",
                        "name": "Australia (Single Network)",
                        "label": "alpha",
                        "networks": [{
                            "id": "mnt_ahekjfa2",
                            "name": "Telstra", "plmn": "50501",
                            "supportedRats": ["4g", "5g"],
                            "country": { "name": "Australia", "iso2": "AU", "iso3": "AUS" }
                        }]
                    }
                }
            }
        }
        if (response.status === 201) {
            const coverage = response.data.coverage;

            const networks = coverage?.networks || [];
            
            const payloadToSave = {
              ...data,
              name: planName,
              planId: response?.data?.id,
              coverageId: coverage?.id || null,
              networks, 
            };
            
            let result = await createEsim(payloadToSave);
            
            if (!result) {
                return next(
                    new ErrorResponse(`Something went wrong while adding Esim Plan`, 500)
                );
            } else {
                return res.status(200).json({
                    status: true,
                    message: "eSIM plan added successfully",
                    data: result.data,
                    responseCode: "000",
                });
            }
        } else {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
        }
    }
    else {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
    }
});

exports.findAllEsim = asyncHandler(async (req, res, next) => {
    const { searchText, page = 1, itemsPerPage = 10 } = req.query;
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    const sortField = req.query.sortField || "createdAt";
    const esims = await findAllEsimsAndCount({
        searchText,
        page: parseInt(page),
        itemsPerPage: parseInt(itemsPerPage),
        sort,
        sortField,
        isAdmin: true,
    });
    if (!esims.success) {
        return next(
            new ErrorResponse(`Something went wrong while fetching esim Plans`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Esim Plans fetched successfully",
        data: {
            recordsTotal: esims?.data ? esims.data?.count : 0,
            recordsFiltered: esims?.data ? esims.data?.count : 0,
            data: esims?.data ? esims.data?.rows : 0,

        },
        responseCode: "000",
    });
});

exports.updateEsim = asyncHandler(async (req, res, next) => {
    const planId = req.params.planId;
    const { commissionMode, commissionType, commission, fixedCommissionPerTransaction, isCommissionInclGST } = req.body;

    let isEsimAvailable = await findEsimPlanByPlanId(planId);
    if (!isEsimAvailable.success) {
        return next(new ErrorResponse(`Esim Plan Not exists`, 403));
    }

    const commissionOnlyData = {
        commissionMode,
        commissionType,
        commission,
        fixedCommissionPerTransaction,
        isCommissionInclGST,
    };

    const esims = await updateEsimByPlanId(planId, commissionOnlyData);
    if (!esims.success) {
        return next(
            new ErrorResponse(`Something went wrong while updating Esim Plan`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Esim Plan updated successfully",
        data: esims.data,
        responseCode: "000",
    });
});

exports.fetchCountries = asyncHandler(async (req, res) => {
    const { searchQuery } = req.query;

    let filteredCountries = countries;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredCountries = countries.filter(country =>
            country.label.toLowerCase().includes(query)
        );
    }

    res.status(200).json({
        status: true,
        message: 'Countries retrieved successfully.',
        data: { countries: filteredCountries },
        responseCode: '000'
    });
})
exports.coveragepprofiles = asyncHandler(async (req, res, next) => {
    let searchQuery = req.query.search
    let serviceDetails = await checkService(accessKey)
    if (serviceDetails === false) {
        return res.status(400).json({
            status: false,
            message: "Apologies, the service you are trying to access is currently unavailable.",
            data: {},
            responseCode: "001"
        });
    }
    const URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1
    console.log("serviceDetails",serviceDetails.vendor)
    if (token) {
        let url = `${URL}/v1/coverage-profiles`;
        let config = {
            method: "get",
            url: `${url}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`,
            },
        };
        try {
            let response = await axios(config)
            if (response) {
                const searchTerm = searchQuery != "" ? searchQuery.toLowerCase() : ""; // The search term
                let result;
                if (searchQuery != "") {
                    result = response.data.filter(profile =>
                        profile.name.toLowerCase().includes(searchTerm)
                    );
                }
                return res.status(200).json({
                    status: true,
                    data: searchQuery != "" ? result : response.data,
                    message: "Coverage Profiles list fetched successfully",
                    responseCode: '000',
                });
            } else {
                console.log("HLOO",response)
                return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
            }
        } catch (err) {
            console.log( err?.response )
            console.log(err?.response?.data?.meta?.message)
            return res.status(400).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                data: {},
                responseCode: '001'
            });
        }
    } else {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
    }
})

exports.updateEsimStatus = asyncHandler(async (req, res, next) => {
    const status = req.body.status;
    const esimId = req.params.id;
    let isEsimAvailable = await findEsimById(esimId);
    if (!isEsimAvailable.success) {
        return next(new ErrorResponse(`Esim Plan Not exists`, 403));
    }
    const esims = await updateEsim(esimId, { status });
    if (!esims.success) {
        return next(
            new ErrorResponse(`Something went wrong while updating Esim Plan Status`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Esim Plans Status updated successfully",
        data: esims.data,
        responseCode: "000",
    });
});

exports.esimExcelCSV = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const { type } = req.params;
    let status = req.query.status || undefined;
  
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";
  
    let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      status,
    };
    const data = await esimPlansExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500));
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500));
    } else {
      const { buffer, fileType } = await generateExcelBufferAndType(data, type);
      return res.status(200).json({
        status: true,
        data: { buffer, fileType },
        message: "Fetched excel/csv datas successfully",
        responseCode: "000",
      });
    }
  });
  
  exports.esimPDF = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    let status = req.query.status || undefined;
  
    const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
    let sortField = req.query.sortField || "createdAt";
  
    let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      status,
    };
    const data = await esimPlansExport(params);
    if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 400));
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 400));
    }
  
    const templateDetails = {
      title: 'EsimPlans'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
    let random = new Date().valueOf();
  
    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
  
    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });
  
    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
      scale: 0.6,
      path: outputFile,
      format: "A4",
      preferCSSPageSize: true,
    });
  
    console.log("PDF generated successfully!");
  
    const buffer = fs.readFileSync(outputFile);
  
    browser.close();
  
    fs.unlinkSync(outputFile);
  
    return res.status(200).json({
      status: true,
      message: "report generated successfully.",
      data: {
        buffer,
        fileType: "application/pdf",
      },
      responseCode: "000",
    });
  });

exports.bulkExcelUploadPlans = asyncHandler(async (req, res, next) => {
    const plansJsonData = req.body.plansJsonData;
    let failedEsimPlans = [];

    // Check if the number of plans exceeds the limit
    if (plansJsonData.length > 10000) {
        return next(new ErrorResponse('Exceeded maximum limit for bulk upload (10,000 per sheet)', 500));
    }

    // Check the availability of the service
    const serviceDetails = await checkService(accessKey);
    if (!serviceDetails) {
        return res.status(400).json({
            status: false,
            message: "Apologies, the service you are trying to access is currently unavailable.",
            data: {},
            responseCode: "001"
        });
    }

    const { apiUrl: URL, optional1: token } = serviceDetails.vendor;

    if (!token) {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
    }

    // Process each plan data
    const planPromises = plansJsonData.map(async (data) => {
        // Check if the eSIM plan already exists
        let isEsimAvailable = await findEsimByName(data.name);
        if (isEsimAvailable.success) {
            failedEsimPlans.push(data)
            return null;
        }

        // Prepare the request config for creating a new plan
        const config = {
            method: "post",
            url: `${URL}/v1/plans`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            data: { ...data, periodIterations: 1, throttledSpeedKbps: 0 },
        };

        try {

            // Send the POST request to create the plan
            let response;
            if (process.env.NODE_ENV === 'production') {
                response = await axios(config);
            } else {
                // Mock response for testing in non-production environments
                const planName = `Australia_${(data.dataMBs / 1024) % 1 === 0
                    ? (data.dataMBs / 1024)
                    : (data.dataMBs / 1024).toFixed(1)}_GB_1_d`;
                response = {
                    status: 201, data: {
                        "id": "plan_zj0ormev",
                        "name": planName,
                        "voiceMinutes": 60,
                        "dataMegaBytes": data.dataMBs,
                        "smsMessages": 100,
                        "periodDays": 1,
                        "periodIterations": 7,
                        "throttledSpeedKbps": 128,
                        "archivedAt": null,
                        "label": "alpha",
                        "coverage": {
                            "id": "cvpr_jaaneha1",
                            "name": "Australia (Single Network)",
                            "label": "alpha",
                            "networks": [{
                                "id": "mnt_ahekjfa2",
                                "name": "Telstra", "plmn": "50501",
                                "supportedRats": ["4g", "5g"],
                                "country": { "name": "Australia", "iso2": "AU", "iso3": "AUS" }
                            }]
                        }
                    }
                }
            }

            // If plan creation is successful
            if (response.status === 201) {
                data.planId = response?.data?.id;
                // let result=true;
                // if (flagStatus) {
                const result = await createEsim(data);
                // }
                if (!result) {
                    throw new Error(`Failed to add eSIM Plan for ${data.name}`);
                }

                customLog(
                    req?.LogTraceId,
                    "info",
                    { message: `Plan ${data.name} added successfully` }
                );
                return data; // Return result if successful
            } else {
                failedEsimPlans.push(data)
                throw new Error(`Failed to add plan ${data.name}`);
            }
        } catch (error) {

            customLog(
                req?.LogTraceId,
                "error",
                { message: `Error adding plan ${data.name}`, error: error }
            );
            return null; // Return null for failed plan
        }
    });

    const results = await Promise.all(planPromises);
    const successfulPlans = results.filter(result => result !== null);
    if (successfulPlans.length !== 0) {
        return res.status(200).json({
            status: true,
            message: successfulPlans.length === plansJsonData.length ? "Bulk upload of eSIM plans completed" : "Some eSIM plans are created successfully",
            data: successfulPlans,
            failedEsimPlans,
            responseCode: "000"
        });
    }
    else {
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: successfulPlans,
            failedEsimPlans,
            responseCode: '001'
        });
    }

});
exports.getBulkTemplate = asyncHandler(async (req, res) => {
    const esimTemplateUrl = await fetchEsimBulkUploadTemplate(req);
  
    return res.status(200).json({
      status: true,
      message: "ESIM plan upload template fetched successfully",
      data: { esimTemplateUrl },
      responseCode: "000",
    });
  });

exports.getPriceEsimPlan = asyncHandler(async (req, res, next) => {
    const { countryIso2, indicator, label } = req.query;
    let serviceDetails = await checkService(accessKey)
    if (serviceDetails === false) {
        return res.status(400).json({
            status: false,
            message: "Apologies, the service you are trying to access is currently unavailable.",
            data: {},
            responseCode: "001"
        });
    }
    const URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1
    if (token) {
        let url = `${URL}/v2/data-prices`;
        let config = {
            method: "get",
            url: `${url}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`,
            },
        };
        try {
            let response = await axios(config)
            if (!response?.data?.items) {
                return next(new ErrorResponse('No data found from vendor', 400));
            }

            // Filter to find the single matching item
            const matchedItem = response.data.items.find(item =>
                item.countryIso2 === countryIso2 &&
                item.indicator === indicator &&
                item.label === label
            );

            if (!matchedItem) {
                return res.status(404).json({
                    status: false,
                    message: "No matching price found for the selected coverage",
                    data: {},
                    responseCode: '002',
                });
            }

            const exchangeRates = await getCurrencyExchangeRate();
            const usdToInr = exchangeRates?.USD?.value ? 1 / exchangeRates.USD.value : 85;
            matchedItem.pricePlan = (+matchedItem.pricePerGB * usdToInr).toFixed(2);

            return res.status(200).json({
                status: true,
                data: matchedItem,
                message: "Price for coverage profile fetched successfully",
                responseCode: '000',
            });
        } catch (err) {
            console.log({ err })
            console.log(err?.response?.data?.meta?.message)
            return res.status(400).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                data: {},
                responseCode: '001'
            });
        }
    } else {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400))
    }
})


let isSyncRunning = false;

exports.syncTunzPlans = asyncHandler(async (req, res, next) => {
  if (isSyncRunning) {
    customLog(req?.LogTraceId, "info", {
      message: "Sync already in progress",
      adminId: req.user?.id || "unknown"
    });

    return res.status(400).json({
      status: false,
      message: "Sync already in progress",
      data: null,
      responseCode: "001"
    });
  }

  try {
    isSyncRunning = true;

    customLog(req?.LogTraceId, "info", {
      message: "Manual Tunz sync started",
      adminId: req.user?.id || "unknown"
    });

    const result = await syncTunzInventory();

    if (!result?.success) {
      customLog(req?.LogTraceId, "error", {
        message: "Sync completed but marked as failed",
        result
      });

      return next(new ErrorResponse("Sync failed", 500));
    }

    customLog(req?.LogTraceId, "info", {
      message: "Manual Tunz sync completed",
      adminId: req.user?.id || "unknown",
      result
    });

    return res.status(200).json({
      status: true,
      message: "Tunz plans synced successfully",
      data: result,
      responseCode: "000"
    });

  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Manual Tunz sync failed",
      adminId: req.user?.id || "unknown",
      error: error.message
    });

    return next(new ErrorResponse("Failed to refresh Tunz plans", 500));

  } finally {
    isSyncRunning = false;
  }
});