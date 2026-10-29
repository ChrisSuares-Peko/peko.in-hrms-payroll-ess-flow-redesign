const asyncHandler = require("../../middlewares/async");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { setValue, getValue } = require("../../utils/cacheDataMethods");
const { fetchServiceDetails, findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const axios = require("axios");
// const wkhtmltopdf = require("wkhtmltopdf");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { updateWalletTransaction, getPartialRefundDetails} = require("../../utils/walletTransaction");
const { customLog } = require("../../utils/loggerHelper");
// const accessKey = "hotels_api";
const emailer = require("../../utils/emailer");
const { fetchBookings, updateBookingStatus } = require("../../models/use-cases/hotels");
const { findOneOrderById, findOrdersByServiceOperatorId, findOneOrderByTxnId, findOrderById } = require("../../models/use-cases/order");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { createOtp, verifyOtp } = require("../../models/use-cases/otp");
const { emailOTPTemaplte } = require('../../utils/emailTemplates/common');
const { hotelTicketPDFTemplateNew, generateHotelTicketAndSendToMailNew, HotelBookingCancelledEmailTemplate } = require("../../utils/emailTemplates/hotel/hotelTicketPDF");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { findOneTransaction } = require("../../models/use-cases/transaction");
const schedule = require("node-schedule");
// const { findOne } = require("../../models/use-cases/vendors");
const { getSchedulerInterval } = require("../../models/use-cases/settings");
const { createNotification } = require("../../models/use-cases/notification");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["hotel"]["accessKey"];
const NODE_ENV = process.env.NODE_ENV;
const STAGING_URL = process.env.FRONTEND_STAGING_URL;


// 3 call sites in this file (cancellation-by-vendor-API paths) - resolveEmailTemplate needs
// one named helper per rule, not an inline call at each site.
async function sendHotelBookingCancelledEmail(to, bookingDetailsResponse, hotelBookingDetails, amount, templateDetails, mainGuestPassenger, passengerData, user, logTraceId) {
    function convertDateToDDMMYYYY(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    }
    function nightsBetween(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;
        const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
    }
    const totalRooms = hotelBookingDetails?.TotalRooms;
    const nights = nightsBetween(hotelBookingDetails?.checkInDate, hotelBookingDetails?.checkOutDate);
    const totalGuests = passengerData?.totalCount || 0;
    const userName = user?.username || mainGuestPassenger?.PassengerName || "Guest";

    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.HOTEL_CANCELLED,
        service: EMAIL_TEMPLATE_SERVICES.HOTEL,
        variables: {
            userName,
            hotelName: bookingDetailsResponse?.HotelName,
            hotelAddress: bookingDetailsResponse?.AddressLine1,
            roomsText: `${totalRooms || 0} ${totalRooms === 1 ? 'Room' : 'Rooms'}`,
            nightsText: `${nights} ${nights === 1 ? 'Night' : 'Nights'}`,
            guestCountText: `${totalGuests} ${totalGuests === 1 ? 'Guest' : 'Guests'}`,
            checkInDateText: convertDateToDDMMYYYY(hotelBookingDetails?.checkInDate),
            checkOutDateText: convertDateToDDMMYYYY(hotelBookingDetails?.checkOutDate),
            mainGuestName: mainGuestPassenger?.PassengerName || userName,
            branding: templateDetails?.branding || 'Peko',
            ...v2LayoutVariables(templateDetails),
        },
        fallback: () => HotelBookingCancelledEmailTemplate(bookingDetailsResponse, hotelBookingDetails, amount, templateDetails, mainGuestPassenger, passengerData, user),
        fallbackSubject: " Your Hotel Booking Has Been Cancelled Successfully",
        logTraceId,
    });

    emailer.email(to, resolved.subject, resolved.html, function () {
        customLog(logTraceId, "info", { message: "Email sent to " + to });
    });
}

//check service access
async function checkService(req) {
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

        const authUrlObj = serviceDetails?.vendor?.optionals;
        const authUrl = authUrlObj ? authUrlObj.hotelsAuth : null;
        const endUserIp = authUrlObj?.endUserIp;

        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return serviceDetails;
        }
         customLog(req?.LogTraceId, "info", { data: serviceDetails, message: "Service details from checkService" });
        return {
            userName: serviceDetails.vendor.optional1,
            password: serviceDetails.vendor.optional2,
            ClientId: serviceDetails.vendor.optional3,
            userNameNew: serviceDetails.vendor.optional4,
            passwordNew: serviceDetails.vendor.optional5,
            API_URL: serviceDetails.vendor.apiUrl,
            API_URL_New: serviceDetails.vendor.optional6,
            HEALTH_URL: serviceDetails.vendor.healthUrl,
            AUTH_URL: authUrl,
            EndUserIp: endUserIp
        };
    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "Error in checkService.", error: e });
        return { error: e?.message || "Error fetching service details" };
    }
}




async function getSession(serviceDetails) {
    try {
      
    let tokenId = await getValue(`tokenId-${accessKey}`);
    const memberId = await getValue(`memberId-${accessKey}`);
    const agencyId = await getValue(`agencyId-${accessKey}`);
    if (tokenId && tokenId !== "null") {
        return {
            tokenId: tokenId,
            memberId: memberId !== "null" ? memberId : null,
            agencyId: agencyId !== "null" ? agencyId : null
        };
    } else {
            try {
                let data = JSON.stringify({
                     "ClientId": serviceDetails.ClientId,
                        "UserName": serviceDetails.userName,
                        "Password": serviceDetails.password,
                        "EndUserIp": serviceDetails.EndUserIp,
                });

                let config = {
                    method: "post",
                    url: `${serviceDetails.AUTH_URL}/Authenticate`,
                    headers: {
                    "Content-Type": "application/json",
                    Accept: "*/*",
                    },
                    data: data,
                };

                const response = await axios(config);

                if (!response) {
                    throw new Error("Authentication failed")
                } else {
                    const now = Math.floor(Date.now() / 1000);
                    const midnight = new Date();
                    midnight.setHours(23, 59, 59, 0);
                    const expirySeconds = Math.floor(midnight.getTime() / 1000) - now;

                    await setValue(`tokenId-${accessKey}`, expirySeconds, response.data?.TokenId);
                    await setValue(`memberId-${accessKey}`, expirySeconds, response.data?.Member?.MemberId);
                    await setValue(`agencyId-${accessKey}`, expirySeconds, response.data?.Member?.AgencyId);

                    return {
                        tokenId: response.data?.TokenId,
                        memberId: response.data?.Member?.MemberId,
                        agencyId: response.data?.Member?.AgencyId
                    };
                }
            } catch (error) {
                customLog(null, 'error', { message: "Error fetching authentication token", error });
                return { tokenId: "", memberId: "", agencyId: "" };
            }
        }
    } catch (error) {
        customLog(null, 'error', { message: "Unexpected error in getSession", error });
        return { tokenId: "", memberId: "", agencyId: "" };
    }
}


// The TBO wallet balance is internal — it is compared against the booking amount here and never
// sent to the client, and every failure surfaces to the user as the same generic message.
const BALANCE_CHECK_FAILED_MESSAGE = "Something went wrong, Please try again later";

const sendBalanceCheckResult = (req, res, next, balanceData, requiredAmount) => {
    const cashBalance = Number(balanceData?.CashBalance);
    if (!Number.isFinite(cashBalance) || cashBalance <= requiredAmount) {
        customLog(req?.LogTraceId, "error", {
            message: "[TBO Hotels] Insufficient wallet balance",
            balance: balanceData?.CashBalance,
            requiredAmount,
            userId: req?.user?.id,
        });
        return next(new ErrorResponse(BALANCE_CHECK_FAILED_MESSAGE, 400));
    }
    return res.status(200).json({
        status: true,
        message: "Balance check successful",
        responseCode: '000',
    });
};

//to check the TBO wallet balance against the booking amount
exports.balanceCkeck = asyncHandler(async (req, res, next) => {
    const redisKey = 'tbo_balanceCheck';
    const cacheTTL = 3 * 24 * 60 * 60;

    customLog(req?.LogTraceId, "info", { message: "Function for balance check API" });
    try {
        const { amount } = req.body;
        const requiredAmount = Number(amount);
        if (!amount || !Number.isFinite(requiredAmount) || requiredAmount <= 0) {
            customLog(req?.LogTraceId, "error", { message: "Invalid amount for balance check", amount });
            return next(new ErrorResponse("Invalid amount", 400));
        }

        const serviceDetails = await checkService(req);
        customLog(req?.LogTraceId, "info", { data: serviceDetails, message: "Service details fetched successfully" });

        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails.error, 400));
        }

        const cachedData = await getValue(redisKey);
        if (cachedData) {
            customLog(req?.LogTraceId, "info", { message: "Data fetched from Redis cache for tbo balance check." });
            return sendBalanceCheckResult(req, res, next, JSON.parse(cachedData), requiredAmount);
        }

        const clientId = serviceDetails.ClientId;
        customLog(req?.LogTraceId, "info", { message: "checking log before the getsession" });
        const auth = await getSession(serviceDetails);
        customLog(req?.LogTraceId, "info", { data: auth, message: "log for getting auth" });

        if (!auth.tokenId || !auth.memberId || !auth.agencyId) {
            customLog(req?.LogTraceId, "error", { message: "Fetch authentication token failed." });
            return next(new ErrorResponse(BALANCE_CHECK_FAILED_MESSAGE, 500));
        }

        const data = JSON.stringify({
            "ClientId": clientId,
            "TokenAgencyId": auth.agencyId,
            "TokenMemberId": auth.memberId,
            "EndUserIp": serviceDetails.EndUserIp,
            "TokenId": auth.tokenId,
        });
        const config = {
            method: 'post',
            url: `${serviceDetails.AUTH_URL}/GetAgencyBalance`,
            headers: { 'Content-Type': 'application/json' },
            data,
        };
        customLog(req?.LogTraceId, "info", { config, message: "API Call for balance check." });
        let response;
        try {
            response = await axios(config);
            customLog(req?.LogTraceId, "info", { message: "balance successfully fetched", response: response?.data });
        } catch (e) {
            customLog(req?.LogTraceId, "error", { message: "Error fetching Balance.", error: e?.message });
            return next(new ErrorResponse(BALANCE_CHECK_FAILED_MESSAGE, 500));
        }

        if (!response || !response.data) {
            customLog(req?.LogTraceId, "error", { message: "No result found." });
            return next(new ErrorResponse(BALANCE_CHECK_FAILED_MESSAGE, 500));
        }

        if (response.data.Status == 2) {
            customLog(req?.LogTraceId, "error", { message: "Balance check Failed.", response: response.data });
            return next(new ErrorResponse(BALANCE_CHECK_FAILED_MESSAGE, 500));
        }

        await setValue(redisKey, cacheTTL, JSON.stringify(response.data));
        return sendBalanceCheckResult(req, res, next, response.data, requiredAmount);
    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "Error fetching Balance.", error: e });
        return next(new ErrorResponse(BALANCE_CHECK_FAILED_MESSAGE, 500));
    }
})


exports.countryLists = asyncHandler(async (req, res, next) => {
    const redisKey = 'countryList_tbo';
    const cacheTTL = 24 * 60 * 60;
    let serviceDetails = await checkService(req)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    let response
    try {
        const cachedData = await getValue(redisKey);

        if (cachedData) {
            customLog(req?.LogTraceId, "info", { message: "Data fetched from Redis cache for tbo countries." });
            return res.status(200).json({
                status: true,
                message: "Countries fetched successfully from cache!",
                responseCode: '000',
                data: {
                    response: JSON.parse(cachedData),
                },
            });
        }
        const username = serviceDetails.userNameNew;
        const password = serviceDetails.passwordNew
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

        let config = {
            method: 'get',
            url: `${serviceDetails.API_URL_New}/CountryList`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`, // Add Basic Auth header

            },
        };
        customLog(req?.LogTraceId, "info", { config, message: "API Call for tbo country list." });
        response = await axios(config);
        customLog(req?.LogTraceId, "error", { message: "Country list successfully fetched", response: response?.data });
    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "Error fetching country list.", error: e?.message });
    }
    if (!response || !response.data) {
        return next(new ErrorResponse(`No Results found`, 404));
    } else {
        await setValue(redisKey, cacheTTL, JSON.stringify(response.data));
        return res.status(200).json({
            status: true,
            message: "countries Fetched Successfully!",
            responseCode: '000',
            data: {
                // conversationId,
                response: response.data
            }
        })
    }
})

exports.cityLists = asyncHandler(async (req, res, next) => {
    const countryCode = req.body.CountryCode
    const redisKey = `citiesListTbo_${countryCode}`;
    const cacheTTL = 10 * 24 * 60 * 60;

    let serviceDetails = await checkService(req)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }
    let data = JSON.stringify({
        "CountryCode": countryCode
    });

    const cachedData = await getValue(redisKey);

    if (cachedData) {
        customLog(req?.LogTraceId, "info", { message: "Data fetched from Redis cache for tbo cities.", countryCode });
        return res.status(200).json({
            status: true,
            message: "cities fetched successfully from cache!",
            responseCode: '000',
            data: {
                response: JSON.parse(cachedData),
            },
        });
    }

    const username = serviceDetails.userNameNew;
    const password = serviceDetails.passwordNew
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');



    let config = {
        method: 'post',
        url: `${serviceDetails.API_URL_New}/CityList`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,

        },
        data: data
    };
    customLog(req?.LogTraceId, "info", { config, message: "API Call for tbo city list." });

    let response
    try {
        response = await axios(config);
        customLog(req?.LogTraceId, "info", { data: response.data, message: "Data fetched from city API" });
    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "🚀 ~ Error in cityLists", error: e.response });
    }
    if (!response || !response.data || !response.data.CityList || !Array.isArray(response.data.CityList) || response.data.CityList.length === 0) {
        return next(new ErrorResponse(`No cities found`, 404));
    } else {
        await setValue(redisKey, cacheTTL, JSON.stringify(response.data));
        return res.status(200).json({
            status: true,
            message: "cities Fetched Successfully!",
            responseCode: '000',
            data: {
                // conversationId,
                response: response.data
            }
        })
    }
})

exports.hotelCodes = asyncHandler(async (req, res, next) => {

    let serviceDetails = await checkService(req)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const username = serviceDetails.userNameNew;
    const password = serviceDetails.passwordNew
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    let config = {
        method: 'get',
        url: `${serviceDetails.API_URL_New}/hotelcodelist`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`, // Add Basic Auth header

        },
    };
    customLog(req?.LogTraceId, "info", { config, message: "API Call for tbo hotel codes." });

    let response
    try {
        response = await axios(config);
        customLog(req?.LogTraceId, "info", { data: response.data, message: "Data fetched from hotelCodes API" });
    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "🚀 ~ Error in hotelcodelist", error: e.response });
    }
    if (!response) {
        return next(new ErrorResponse(`No Results found`, 404));
    } else {
        return res.status(200).json({
            status: true,
            message: "hotel codes Fetched Successfully!",
            responseCode: '000',
            data: {
                // conversationId,
                response: response.data
            }
        })
    }
})

exports.hotelDetails = asyncHandler(async (req, res, next) => {
    const hotelCode = req.body.Hotelcodes
    const hotelDetailsRedisKey = 'hotelDetails_tbo';
    const cacheTTL = 7 * 24 * 60 * 60;
    let response
    let serviceDetails = await checkService(req)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const hotelDetailsCacheData = await getValue(`${hotelDetailsRedisKey}_${hotelCode}`); // Cache key for specific batch
    if (hotelDetailsCacheData) {

        customLog(req?.LogTraceId, "info", {data: JSON.parse(hotelDetailsCacheData), message: `Data fetched from hotel details cache for batch: ${hotelCode}` });
        return res.status(200).json({
            status: true,
            message: "details fetched successfully from cache!",
            responseCode: '000',
            data: {
                response: JSON.parse(hotelDetailsCacheData),
            },
        });
    }

    const username = serviceDetails.userNameNew;
    const password = serviceDetails.passwordNew
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    let data = JSON.stringify(
        {
            "Hotelcodes": req.body.Hotelcodes,
            "Language": "EN"
        }
    );

    let config = {
        method: 'post',
        url: `${serviceDetails.API_URL_New}/Hoteldetails`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,
        },
        data: data
    };
    customLog(req?.LogTraceId, "info", { config, message: "API Call for hotel details." });


    try {
        response = await axios(config);
        customLog(req?.LogTraceId, "info", { data: response.data, message: "Data fetched from hotelDetails API" });

    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "🚀 ~ Error in hotelDetails", error: e.response });
    }
    if (!response) {
        return next(new ErrorResponse(`No Results found`, 404));
    } else if (!response.data.HotelDetails) {
        return next(new ErrorResponse(`${response.data.Status.Description}`, 500));
    } else {
        await setValue(`${hotelDetailsRedisKey}_${hotelCode}`, cacheTTL, JSON.stringify(response.data));
        return res.status(200).json({
            status: true,
            message: "hotel details Fetched Successfully!",
            responseCode: '000',
            data: {
                // conversationId,
                response: response.data
            }
        })
    }
})

exports.hotelCodeList = asyncHandler(async (req, res, next) => {

    let serviceDetails = await checkService(req)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    let data = JSON.stringify({
        "CountryCode": req.body.countryCode,
        "IsDetailedResponse": "true"
    });

    const username = serviceDetails.userNameNew;
    const password = serviceDetails.passwordNew
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    let config = {
        method: 'post',
        url: `${serviceDetails.API_URL_New}/TBOHotelCodeList`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`, // Add Basic Auth header

        },
        data: data
    };

    customLog(req?.LogTraceId, "info", { config, message: "API Call for tboHotelCodeList." });
    let response
    try {
        response = await axios(config);
        customLog(req?.LogTraceId, "info", { data: response.data, message: "Data fetched from city API" });
    } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "🚀 ~ Error in tboHotelCodeList", error: e.response });
    }
    if (!response) {
        return next(new ErrorResponse(`No Results found`, 404));
    } else {
        return res.status(200).json({
            status: true,
            message: "hotel code lists Fetched Successfully!",
            responseCode: '000',
            data: {
                // conversationId,
                response: response.data
            }
        })
    }
})



// Sliding-window concurrency limiter (same behaviour as p-limit, no extra dependency).
// Keeps at most `limit` async tasks running at the same time across ALL requests.
function createConcurrencyLimiter(limit) {
    let active = 0;
    const queue = [];
    const run = () => {
        if (queue.length === 0 || active >= limit) return;
        active++;
        const { fn, resolve, reject } = queue.shift();
        fn().then(resolve).catch(reject).finally(() => { active--; run(); });
    };
    return (fn) => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); run(); });
}
const globalLimit = createConcurrencyLimiter(10);

// In-flight deduplication: concurrent requests for the same city+dates share one promise
// instead of each firing their own full set of API calls.
const inflightSearches = new Map();

function buildSearchKey(body) {
    return [body.City, body.CheckIn, body.CheckOut, JSON.stringify(body.PaxRooms), body.GuestNationality].join('|');
}

// for searching hotels
exports.hotelsSearch = asyncHandler(async (req, res, next) => {
    const searchKey = buildSearchKey(req.body);

    if (inflightSearches.has(searchKey)) {
        customLog(req?.LogTraceId, "info", { message: "Attaching to in-flight search", searchKey });
        try {
            const data = await inflightSearches.get(searchKey);
            return res.status(200).json(data);
        } catch (e) {
            return next(e);
        }
    }

    // All errors inside searchPromise must be thrown (not passed to next()) so the
    // promise rejects properly and the outer catch can call next() exactly once.
    const searchPromise = (async () => {
        const cityCode = req.body.City;
        const hotelCodelistredisKey = `hotelCodeList_${cityCode}`;
        const cacheTTL = 15 * 24 * 60 * 60;

        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
           throw new ErrorResponse(serviceDetails.error, 400);
        }

        const authHeader = Buffer.from(`${serviceDetails.userName}:${serviceDetails.password}`).toString('base64');
        const authHeaderNew = Buffer.from(`${serviceDetails.userNameNew}:${serviceDetails.passwordNew}`).toString('base64');

        // Step 1: Fetch hotel codes
        const hotelCodelistcachedData = await getValue(hotelCodelistredisKey);
        let hotelCodesList;

        if (hotelCodelistcachedData) {
            customLog(req?.LogTraceId, "info", { message: "Data fetched from hotelcodelist API cache" });
            hotelCodesList = JSON.parse(hotelCodelistcachedData);
        } else {
            const hotelCodeConfig = {
                method: 'post',
                url: `${serviceDetails.API_URL_New}/TBOHotelCodeList`,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeaderNew}` },
                data: JSON.stringify({ "CityCode": req.body.City, "IsDetailedResponse": "true" })
            };
            customLog(req?.LogTraceId, "info", { hotelCodeConfig, message: "API Call for getting tbo hotelCodeList." });
            try {
                const hotelCodeResponse = await axios(hotelCodeConfig);
                hotelCodesList = hotelCodeResponse.data.Hotels;
                customLog(req?.LogTraceId, "info", { message: "Data fetched from hotelcodelist API" });
            } catch (e) {
                customLog(null, "error", { message: "🚀 ~ Error in hotelCodeList", error: e.response });
                throw new ErrorResponse(`Failed to fetch hotels`, 400);  // throw, not next()
            }
        }

        if (!hotelCodesList) throw new ErrorResponse(`No hotels found`, 404);
        await setValue(hotelCodelistredisKey, cacheTTL, JSON.stringify(hotelCodesList));

        const hotelCodesArray = hotelCodesList.map(hotel => hotel.HotelCode);
        if (hotelCodesArray.length === 0) throw new ErrorResponse(`No hotel available for the given city`, 404);

        const batchSize = 100;
        const batches = [];
        for (let i = 0; i < hotelCodesArray.length; i += batchSize) {
            batches.push(hotelCodesArray.slice(i, i + batchSize).join(','));
        }

        // Step 2: search + details with global sliding-window concurrency limit
        const searchResults = [];
        const hotelDetailsResults = [];

        const searchTasks = batches.map(batch =>
            globalLimit(() =>
                axios({
                    method: 'post',
                    url: `${serviceDetails.API_URL}/Search`,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeader}` },
                    data: {
                        CheckIn: req.body.CheckIn,
                        CheckOut: req.body.CheckOut,
                        HotelCodes: batch,
                        GuestNationality: req.body.GuestNationality,
                        NoOfRooms: 0,
                        PaxRooms: req.body.PaxRooms,
                        ResponseTime: 23.0,
                        IsDetailedResponse: true,
                        Filters: {},
                    },
                })
                .then(response => response.data)  // Bug fix: renamed from 'res' to avoid shadowing Express res
                .catch(err => {
                    customLog(null, 'error', { message: '🚀 ~ Error in hotel search batch', error: err.response?.data || err.message });
                    return null;
                })
            )
        );

        const detailsTasks = batches.map((batch, batchIndex) =>
            globalLimit(async () => {
                // Bug fix: use cityCode + batchIndex so different cities never share cache keys
                const cacheKey = `hotelDetails_${cityCode}_${batchIndex}`;
                const cached = await getValue(cacheKey);
                if (cached) {
                    customLog(req?.LogTraceId, "info", { message: `Hotel details cache hit: ${cacheKey}` });
                    const parsed = JSON.parse(cached);
                    return parsed.HotelDetails || [];
                }
                const response = await axios({
                    method: 'post',
                    url: `${serviceDetails.API_URL_New}/hoteldetails`,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeaderNew}` },
                    data: { Hotelcodes: batch, Language: 'EN' },
                })
                .then(response => response.data)
                .catch(err => {
                    customLog(null, 'error', { message: '🚀 ~ Error in hotel details API', error: err.response?.data || err.message });
                    return null;
                });

                if (response?.HotelDetails) {
                    await setValue(cacheKey, cacheTTL, JSON.stringify(response));
                    return response.HotelDetails;
                }
                return [];
            })
        );

        // Run search and details in parallel — they hit different APIs, no reason to wait on each other
        const [searchResponses, detailsResponses] = await Promise.all([
            Promise.all(searchTasks),
            Promise.all(detailsTasks)
        ]);

        searchResponses.forEach(r => { if (r?.HotelResult) searchResults.push(...r.HotelResult); });
        detailsResponses.forEach(r => { if (r) hotelDetailsResults.push(...r); });

        if (!searchResults.length && !hotelDetailsResults.length) {
            throw new ErrorResponse('No hotels found', 404);  // throw, not next()
        }

        return {
            status: true,
            message: "Hotels fetched successfully!",
            responseCode: '000',
            data: { hotelCodeList: hotelCodesList, searchResults, hotelDetails: hotelDetailsResults },
        };

    })().finally(() => inflightSearches.delete(searchKey));

    inflightSearches.set(searchKey, searchPromise);

    // Bug fix: errors thrown inside searchPromise are caught here and passed to next() once
    try {
        const finalResponse = await searchPromise;
        return res.status(200).json(finalResponse);
    } catch (e) {
        return next(e);
    }
});





// Retries a batch call once on failure (timeout/network/vendor error) before giving
// up on it — a single transient blip otherwise drops up to 100 hotels from the response.
const withRetry = async (fn, { retries = 1, delayMs = 400 } = {}) => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            // eslint-disable-next-line no-await-in-loop
            return await fn();
        } catch (e) {
            lastErr = e;
            if (attempt < retries) {
                // eslint-disable-next-line no-await-in-loop
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastErr;
};

exports.searchHotels = asyncHandler(async (req, res, next) => {
    const searchStartTime = Date.now();
    const cityCode = req.body.City
    const hotelCodelistredisKey = `hotelCodeList_tbo_${cityCode}`;
    const hotelDetailsRedisKey = 'hotelDetails_tbo';
    const cacheTTL = 7 * 24 * 60 * 60;
    // above TBO's own 23s response window, so slow-but-normal batches are not dropped
    const TBO_TIMEOUT_MS = 30000;
    let serviceDetails = await checkService(req)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400));
    }

    const username = serviceDetails.userName;
    const password = serviceDetails.password;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const usernameNew = serviceDetails.userNameNew;
    const passwordNew = serviceDetails.passwordNew;
    const authHeaderNew = Buffer.from(`${usernameNew}:${passwordNew}`).toString('base64');

    // Step 1: Fetch hotel codes
    const hotelCodelistcachedData = await getValue(hotelCodelistredisKey);
    let hotelCodesList;
    let hotelCodeResponse

    if (hotelCodelistcachedData) {
    
        hotelCodesList = JSON.parse(hotelCodelistcachedData)
       
    } else {

        let hotelCodeListData = JSON.stringify({
            "CityCode": req.body.City,
            "IsDetailedResponse": "true"
        });

        let hotelCodeConfig = {
            method: 'post',
            url: `${serviceDetails.API_URL_New}/TBOHotelCodeList`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeaderNew}`,
            },
            data: hotelCodeListData,
            timeout: TBO_TIMEOUT_MS
        };
        customLog(req?.LogTraceId, "info", { message: `API Call for getting tbo hotelCodeList (city: ${cityCode})` });


        try {
            hotelCodeResponse = await axios(hotelCodeConfig);

            hotelCodesList = hotelCodeResponse.data.Hotels
           
        } catch (e) {
            customLog(req?.LogTraceId, "error", {
                message: "🚀 ~ Error in hotelCodeList",
                request: hotelCodeListData,
                status: e.response?.status,
                vendorResponse: e.response?.data,
                error: e.message
            });
            return next(new ErrorResponse(`Failed to fetch hotels`, 400));
        }

    }


    if (!hotelCodesList) {
        return next(new ErrorResponse(`No hotels found`, 404));
    }

    const hotelCodesArray = hotelCodesList.map(hotel => hotel.HotelCode);
    if (hotelCodesArray.length === 0) {
        return next(new ErrorResponse(`No hotel available for the given city`, 404));
    }

    // only cache non-empty lists — caching an empty result would hide a city's
    // hotels from every search for 15 days if TBO adds them after this response
    await setValue(hotelCodelistredisKey, cacheTTL, JSON.stringify(hotelCodesList));

    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < hotelCodesArray.length; i += batchSize) {
        batches.push(hotelCodesArray.slice(i, i + batchSize).join(','));
    }

    customLog(req?.LogTraceId, "info", {
        message: `Timing: hotel code list resolved in ${Date.now() - searchStartTime}ms (source: ${hotelCodelistcachedData ? 'cache' : 'api'}, hotels: ${hotelCodesArray.length})`
    });

    // Step 2: Sliding-window pool — same peak concurrency as the old 3-group
    // approach, but no barrier waits on each group's slowest batch
    const poolLimit = Math.max(10, Math.ceil((batches.length * 2) / 3));

    let searchResults = [];
    let hotelDetailsResults = [];
    const searchBatchCounts = [];
    let failedSearchBatches = 0;
    let detailsCacheHits = 0;

    const searchBatch = async (batch, index) => {
        const searchHotelData = JSON.stringify({
            "CheckIn": req.body.CheckIn,
            "CheckOut": req.body.CheckOut,
            "HotelCodes": batch,
            "GuestNationality": req.body.GuestNationality,
            "NoOfRooms": 0,
            "PaxRooms": req.body.PaxRooms,
            "ResponseTime": 23.0,
            "IsDetailedResponse": true,
            "Filters": {}
        });
        const searchHotelConfig = {
            method: 'post',
            url: `${serviceDetails.API_URL}/Search`,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeader}` },
            data: searchHotelData,
            timeout: TBO_TIMEOUT_MS
        };
        try {
            customLog(req?.LogTraceId, "info", { searchHotelConfig, message: "API Call for tbo hotels search." });
            const response = await withRetry(() => axios(searchHotelConfig));
            // customLog(req?.LogTraceId, "info", {
            //     message: `Hotel search response for batch ${index + 1}`,
            //     response: response?.data
            // });
            if (response.data?.HotelResult) {
                searchBatchCounts[index] = response.data.HotelResult.length;
                searchResults.push(...response.data.HotelResult);
            } else {
                // TBO can reply 200 with an error/empty body — keep its status code visible
                searchBatchCounts[index] = `0 (status ${response.data?.Status?.Code ?? 'n/a'})`;
            }
        } catch (e) {
            failedSearchBatches += 1;
            customLog(req?.LogTraceId, "error", {
                message: `🚀 ~ Error in hotel search batch ${index + 1}/${batches.length} (after retry):`,
                request: searchHotelData,
                status: e.response?.status,
                vendorResponse: e.response?.data,
                error: e.message
            });
        }
    };

    const detailsBatch = async (batch, index) => {
        const detailsCacheKey = `${hotelDetailsRedisKey}_${batch}`;
        try {
            const hotelDetailsCacheData = await getValue(detailsCacheKey);
            if (hotelDetailsCacheData) {
                const cachedDetails = JSON.parse(hotelDetailsCacheData);
                if (cachedDetails?.HotelDetails) {
                    hotelDetailsResults.push(...cachedDetails.HotelDetails);
                }
                detailsCacheHits += 1;
                return;
            }
        } catch (e) {
            // cache errors degrade to an API call instead of failing the search
            customLog(req?.LogTraceId, "error", { message: "Redis read failed for hotel details batch, falling back to API", error: e.message });
        }
        const hotelDetailsData = JSON.stringify({ "Hotelcodes": batch, "Language": "EN" });
        const hotelDetailsConfig = {
            method: 'post',
            url: `${serviceDetails.API_URL_New}/hoteldetails`,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeaderNew}` },
            data: hotelDetailsData,
            timeout: TBO_TIMEOUT_MS
        };
        try {
             customLog(req?.LogTraceId, "info", { hotelDetailsConfig, message: "API Call for tbo hotels details search." });
            const response = await withRetry(() => axios(hotelDetailsConfig));
            if (response.data?.HotelDetails) {
                hotelDetailsResults.push(...response.data.HotelDetails);
                
                // only cache a response that actually has details — caching an empty/malformed
                // vendor reply would hide this batch's hotels for the full 15-day TTL instead
                // of just retrying on the next search
                try {
                    await setValue(detailsCacheKey, cacheTTL, JSON.stringify(response.data));
                } catch (cacheErr) {
                    customLog(req?.LogTraceId, "error", { message: "Redis write failed for hotel details batch", error: cacheErr.message });
                }
            }
        } catch (e) {
            customLog(req?.LogTraceId, "error", {
                message: `🚀 ~ Error in hotel details API (batch ${index + 1}/${batches.length}, after retry)`,
                request: hotelDetailsData,
                status: e.response?.status,
                vendorResponse: e.response?.data,
                error: e.message
            });
        }
    };

    const tasks = [];
    batches.forEach((batch, index) => {
        tasks.push(() => searchBatch(batch, index));
        tasks.push(() => detailsBatch(batch, index));
    });

    let nextTask = 0;
    const runWorker = async () => {
        while (nextTask < tasks.length) {
            const task = tasks[nextTask];
            nextTask += 1;
            await task();
        }
    };
    await Promise.all(Array.from({ length: Math.min(poolLimit, tasks.length) }, runWorker));

    customLog(req?.LogTraceId, "info", {
        message: `Timing: all TBO batch calls completed at ${Date.now() - searchStartTime}ms (search results: ${searchResults.length}, details: ${hotelDetailsResults.length}, failed search batches: ${failedSearchBatches}/${batches.length}, details cache hits: ${detailsCacheHits}/${batches.length})`,
        searchBatchHotelCounts: searchBatchCounts
    });

    if (searchResults.length === 0 && hotelDetailsResults.length === 0) {
        return next(new ErrorResponse(`No hotels found`, 404));
    }

    const availableHotelCodes = new Set(searchResults.map(h => h.HotelCode));

    // Step 3: Backfill details for any available hotel the batch run above didn't get one
    // for — either its whole details batch failed outright (nothing cached, would just fail
    // the same way again next search), or the batch succeeded but TBO's response simply
    // didn't include that code (that batch is now a permanent cache hit, so the gap would
    // otherwise persist for the life of the 15-day TTL). Re-requesting just the missing
    // codes here closes the gap without waiting on the whole original batch to expire.
    const detailedHotelCodes = new Set(hotelDetailsResults.map(h => h.HotelCode));
    const missingDetailCodes = Array.from(availableHotelCodes).filter(code => !detailedHotelCodes.has(code));

    if (missingDetailCodes.length > 0) {
        customLog(req?.LogTraceId, "info", {
            message: `Backfilling hotel details for ${missingDetailCodes.length} hotel(s) missing details after main batch run`
        });

        const backfillBatches = [];
        for (let i = 0; i < missingDetailCodes.length; i += batchSize) {
            backfillBatches.push(missingDetailCodes.slice(i, i + batchSize).join(','));
        }

        await Promise.all(backfillBatches.map(async (batch, i) => {
            const hotelDetailsData = JSON.stringify({ "Hotelcodes": batch, "Language": "EN" });
            const hotelDetailsConfig = {
                method: 'post',
                url: `${serviceDetails.API_URL_New}/hoteldetails`,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeaderNew}` },
                data: hotelDetailsData,
                timeout: TBO_TIMEOUT_MS
            };
            try {
                 customLog(req?.LogTraceId, "info", { hotelDetailsConfig, message: "API Call for tbo hotels backfill details search." });
                const response = await withRetry(() => axios(hotelDetailsConfig));
                if (response.data?.HotelDetails) {
                    hotelDetailsResults.push(...response.data.HotelDetails);
                    
                    try {
                        await setValue(`${hotelDetailsRedisKey}_${batch}`, cacheTTL, JSON.stringify(response.data));
                    } catch (cacheErr) {
                        customLog(req?.LogTraceId, "error", { message: "Redis write failed for hotel details backfill batch", error: cacheErr.message });
                    }
                }
            } catch (e) {
                customLog(req?.LogTraceId, "error", {
                    message: `🚀 ~ Error backfilling hotel details (batch ${i + 1}/${backfillBatches.length}, after retry)`,
                    request: hotelDetailsData,
                    status: e.response?.status,
                    vendorResponse: e.response?.data,
                    error: e.message
                });
            }
        }));

        customLog(req?.LogTraceId, "info", {
            message: `Timing: details backfill completed at ${Date.now() - searchStartTime}ms (details now: ${hotelDetailsResults.length})`
        });
    }

    const filteredHotelDetails = hotelDetailsResults.filter(h => availableHotelCodes.has(h.HotelCode));
    // Built from availableHotelCodes (the true source of "hotels found") rather than by
    // filtering the cached hotelCodesList — a hotel newly added to TBO's live inventory can
    // appear in searchResults before it exists in our (up to 15-day-old) cached code list,
    // and would otherwise be silently dropped here. The cached list is only used to enrich
    // with city-list metadata (name/address) when available; the full list stays cached in redis.
    const hotelCodeMap = new Map(hotelCodesList.map(h => [h.HotelCode, h]));
    const filteredHotelCodeList = Array.from(availableHotelCodes).map(
        code => hotelCodeMap.get(code) || { HotelCode: code }
    );

    customLog(req?.LogTraceId, "info", {
        message: `Timing: response ready at ${Date.now() - searchStartTime}ms (available hotels: ${filteredHotelCodeList.length})`
    });

    return res.status(200).json({
        status: true,
        message: "Hotels fetched successfully!",
        responseCode: '000',
        data: {
            hotelCodeList: filteredHotelCodeList,
            searchResults: searchResults,
            hotelDetails: filteredHotelDetails,
            totalCount: searchResults.length
        }
    });
});


exports.prebook = asyncHandler(async (req, res, next) => {

    let serviceDetails = await checkService(req)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const username = serviceDetails.userName;
    const password = serviceDetails.password
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    // let conversationId = uuidv4()
    let data = JSON.stringify(
        {
            "BookingCode": req.body.BookingCode,
            "PaymentMode": "Limit"
        }

    );

    let config = {
        method: 'post',
        url: `${serviceDetails.API_URL}/PreBook`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,
        },
        data: data
    };
    customLog(req?.LogTraceId, "info", { config, message: "API Call for tbo prebook api." });
    let response
    try {
        response = await axios(config);
        const prebookRes = response?.data
        customLog(req?.LogTraceId, "info", { prebookRes, message: "Data fetched from prebook api" });
    } catch (e) {
        console.log(e)
        customLog(req?.LogTraceId, "error", { message: "🚀 ~ Error in tbocodeList", error: e.response });
    }
    if (!response) {
        return next(new ErrorResponse(`No Results found`, 404));
    } else if (!response.data.HotelResult) {
        return next(new ErrorResponse(`${response.data.Status.Description}`, 500));
    } else {
        // The cached paymentAmount is what payment-gateway validates the hotel payment against,
        // so it must never be lower than the fare TBO quoted for this BookingCode. Fail closed if
        // the vendor fare is missing or the client amount undercuts it (₹1 tolerance for rounding).
        const vendorFare = Number(response.data.HotelResult?.[0]?.Rooms?.[0]?.TotalFare);
        const clientAmount = Number(req.body.amount);
        if (!Number.isFinite(vendorFare) || vendorFare <= 0) {
            customLog(req?.LogTraceId, "error", { BookingCode: req.body.BookingCode, message: "Prebook response has no valid TotalFare" });
            return next(new ErrorResponse(`Unable to verify hotel price. Please try again.`, 400));
        }
        if (!Number.isFinite(clientAmount) || clientAmount < vendorFare - 1) {
            customLog(req?.LogTraceId, "error", { BookingCode: req.body.BookingCode, clientAmount, vendorFare, message: "Prebook amount is lower than vendor fare" });
            return next(new ErrorResponse(`Hotel price has changed. Please search again.`, 400));
        }
        await setValue(`${accessKey}-${req.body.BookingCode}-paymentAmount`, 60 * 60, clientAmount);

        return res.status(200).json({
            status: true,
            message: "hotels prebook response Fetched Successfully!",
            responseCode: '000',
            data: {
                // conversationId,
                response: response.data
            }
        })
    }
})


const getBookingDetails = async (serviceDetails, TraceId) => {
    try {
        customLog(null, "info", { data: serviceDetails, message: "log for checking service details" });
       let tokenId;
        try {
            ({ tokenId } = await getSession(serviceDetails));
        } catch (sessionError) {
            customLog(null, "error", { message: "Failed to retrieve token", error: sessionError });
            throw new Error("Something went wrong.");
        }

        if (!tokenId) {
            customLog(null, "error", { message: "TokenId is null or undefined, skipping booking detail API call." });
            throw new Error("Something went wrong.");
        }

        customLog(null, "info", { data: tokenId, message: "log for checking token" });

        const username = serviceDetails.userName;
        const password = serviceDetails.password;
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify({
            "EndUserIp": serviceDetails.EndUserIp,
            "TokenId": tokenId,
            "TraceId": TraceId,
        });


        const config = {
            method: 'post',
            url: `${serviceDetails.HEALTH_URL}/GetBookingDetail`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`,
            },
            data: body,
        };

        customLog(null, "info", { config, message: "API Call for getting tbo bookingDetails config." });


        const response = await axios(config);
        customLog(null, "info", { response: response.data, message: "API Call for getting tbo bookingDetails." });

        // Check if response data exists and is valid
        if (!response?.data?.GetBookingDetailResult) {
            throw new Error("Invalid API response structure.");
        }

        const bookingDetails = response.data.GetBookingDetailResult;

        // Check API-specific errors in the response
        if (!bookingDetails.VoucherStatus || bookingDetails.ResponseStatus !== 1) {
            const errorMessage = bookingDetails?.Error?.ErrorMessage || "Unknown API error.";
            throw new Error(errorMessage);
        }

        return bookingDetails
    } catch (error) {
        customLog(null, "error", { message: "🚀 ~ Error in getBookingDetails", error });

        if (error.response) {

            throw new Error(error.response || "API Error");
        } else if (error.request) {
            // No response received
            throw new Error("No response from API server");
        } else {
            // Other unexpected errors
            throw new Error(error.message || "Internal Server Error");
        }
    }
};


// Loads a hotel order only if it belongs to the requesting user (and to the sub-user, when the
// caller is one) — same scope as listAllBookings. Returns null for someone else's order.
const findOwnedHotelOrder = async (req, orderId) => {
    if (!orderId) return null;
    const order = await findOrderById({ credentialId: req.user.id, orderId });
    if (!order) return null;
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
        && String(order.subCorporateUserId) !== String(req.user.subCorporateId)) {
        return null;
    }
    return order;
};

exports.sendChangeRequest = asyncHandler(async (req, res, next) => {
    try {
        let scope = req.body.scope
        // const credentialId = req.user.id
        let otp = req.body.otp
        if (scope === 'email') {
            let result = await verifyOtp({ contact: req.user.email, otp: otp, context: 'email' })
            if (result.isVerified === false) {
                return res.status(401).json({ status: false, message: result.message, data: {}, responseCode: '001' });
            }
        } else {
            return next(new ErrorResponse('OTP verification failed due to invalid scope or an unexpected error.', 400))
        }
        const orderId = req.body.orderId
        const orders = await findOwnedHotelOrder(req, orderId)
        if (!orders) {
            return next(new ErrorResponse('Booking not found!', 404))
        }
        // Take the transaction from the stored order, never from the request body
        const transaction = await findOneTransaction({ corporateTxnId: orders.corporateTxnId })
        if (!transaction) {
            return next(new ErrorResponse('No transactions found!', 404))
        }// transaction is for refund purpose
        let serviceDetails = await checkService(req);
        const orderResponse = JSON.parse(orders.orderResponse);
        const BookingId = orderResponse.bookingDetailsResponse.BookingId
        const traceId = orderResponse.bookingDetailsResponse.TraceId
        const ConfirmationNo = orders.providerId
        const {tokenId} = await getSession(serviceDetails);

        const username = serviceDetails.userName;
        const password = serviceDetails.password;
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify({
            "BookingMode": 5,
            "EndUserIp": serviceDetails.EndUserIp,
            "TokenId": tokenId,
            "BookingId": BookingId,
            "Remarks": "Remarks",
            "RequestType": 4,
        });

        const config = {
            method: 'post',
            url: `${serviceDetails.HEALTH_URL}/SendChangeRequest`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`,
            },
            data: body,
        };
        customLog(req?.LogTraceId, "info", { config, message: "API Call for tbo send change request." });

        const response = await axios(config);

        const result = response?.data?.HotelChangeRequestResult;
        customLog(req?.LogTraceId, "info", { data: response?.data, message: "Data fetched from send change request api." });

        // Handle errors in API response
        if (!result || result.ResponseStatus !== 1 || result.Error?.ErrorCode !== 0) {
            const errorMessage = result?.Error?.ErrorMessage || "Unknown error occurred";
            const bookingDetailsResponse = await getBookingDetails(serviceDetails, traceId);
            if (bookingDetailsResponse.Status === 6) {
                await orders.update(
                    {
                        status: 'REFUND_REQUESTED',
                        message: 'Cancelled and requested for refund.',
                    },
                    { where: { id: transaction?.order?.id } }
                );

              let passengersDetails = orderResponse.bookingDetailsResponse.Rooms || []
      
        const simplifiedPassengerTypes = passengersDetails.map((room) => ({
           
            passengers: room.HotelPassenger.map((passenger) => ({
                PassengerType: passenger.Age > 12 ? "Adult" : "Child",
                PassengerName: `${passenger.FirstName} ${passenger.LastName}`, // Added space between names
                Email: passenger.Email,
                Phoneno: passenger.Phoneno,
            })),
        }));
       
        orderResponse.bookingDetailsResponse.PassengerTypes = simplifiedPassengerTypes;

                let adultCount = 0;
                let childCount = 0;
                let passengers = orderResponse?.bookingDetailsResponse.PassengerTypes || []

                passengers.forEach((passenger) => {

                    passenger.passengers.forEach((item) => {
                        if (item.PassengerType === "Adult") {
                            adultCount++;
                        } else if (item.PassengerType === "Child") {
                            childCount++;
                        }
                    });
                });

                const passengerData = {
                    adultCount,
                    childCount,
                    totalCount: adultCount + childCount
                }

                const notificationData = {
                    notificationTitle: "Hotel Booking Cancelled",
                    notificationBrief: `Your hotel booking at ${orderResponse.bookingDetailsResponse.HotelName} for ${orderResponse.hotelBookingDetails.TotalRooms} ${orderResponse.hotelBookingDetails.TotalRooms == 1 ? 'Room' : 'Rooms'} from ${orderResponse.hotelBookingDetails.checkInDate} has been successfully cancelled. Please allow 5–7 working days for the refund to reflect in your account`,
                    notificationTo: [req.user.username],
                    notificationCategory: "CORPORATE",
                    notificationBy: "ADMIN",
                };
                createNotification(notificationData);

                let templateDetails;
                req.user.registeredBy ?
                    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
                    :
                    // eslint-disable-next-line no-unused-vars
                    templateDetails = await fetchPartnerDetails()
                const to = orderResponse.bookingDetailsResponse.HotelRoomsDetails[0].HotelPassenger[0].Email;
                const bookingDetailsResponse = orderResponse.bookingDetailsResponse
                const hotelBookingDetails = orderResponse.hotelBookingDetails
                const amount = orders.baseAmount

                await sendHotelBookingCancelledEmail(to, bookingDetailsResponse, hotelBookingDetails, amount, templateDetails, passengers[0]?.passengers?.[0], passengerData, req.user, req?.LogTraceId);



                // await processRefund(transaction, result, req, corporateTxnId);

                // walletDetails = await wallet.findOne({
                //     where: {
                //         credentialId
                //     },
                //     attributes: ['balance']
                // })
            } else {

                return next(new ErrorResponse(errorMessage, 400));
            }
        }
        let bookingStatus
        const statusNo = result.ChangeRequestStatus
        if (statusNo === 1) {
            bookingStatus = 'Pending'
        } else if (statusNo === 2) {
            bookingStatus = 'InProgress'
        } else if (statusNo === 3) {
            bookingStatus = 'Processed'
        } else if (statusNo === 4) {
            bookingStatus = 'Rejected'
        } else {
            bookingStatus = 'NotSet'
        }

        let totalCancellationCharges = result.CancellationChargeBreakUp;

        const CancellationCharges = totalCancellationCharges?.CancellationFees + totalCancellationCharges?.CancellationServiceCharge

        let refundAmount = parseFloat(transaction.order.amountInINR) || 0;

        if (!isNaN(parseFloat(CancellationCharges))) {
            refundAmount -= parseFloat(CancellationCharges);
        }
        customLog(req?.LogTraceId, "info", { refundAmount, message: "refundAmount for change request." });

        // Fetch partial refund details
        let partialRefund = await getPartialRefundDetails({ corporateTxnId: orders.corporateTxnId, refundAmount });


        await updateBookingStatus({ ConfirmationNo, totalCancellationCharges, partialRefund, bookingStatus, ChangeRequestId: result.ChangeRequestId })

        if (bookingStatus == 'Processed') {

            await orders.update(
                {
                    status: 'REFUND_REQUESTED',
                    message: 'Cancelled and requested for refund.',
                },
                { where: { id: transaction?.order?.id } }
            );
            let passengersDetails = orderResponse.bookingDetailsResponse.Rooms || []
      
        const simplifiedPassengerTypes = passengersDetails.map((room) => ({
           
            passengers: room.HotelPassenger.map((passenger) => ({
                PassengerType: passenger.Age > 12 ? "Adult" : "Child",
                PassengerName: `${passenger.FirstName} ${passenger.LastName}`, // Added space between names
                Email: passenger.Email,
                Phoneno: passenger.Phoneno,
            })),
        }));
            orderResponse.bookingDetailsResponse.PassengerTypes = simplifiedPassengerTypes;

            let adultCount = 0;
            let childCount = 0;
            let passengers = orderResponse?.bookingDetailsResponse.PassengerTypes || []

            passengers.forEach((passenger) => {

                passenger.passengers.forEach((item) => {
                    if (item.PassengerType === "Adult") {
                        adultCount++;
                    } else if (item.PassengerType === "Child") {
                        childCount++;
                    }
                });
            });

            const passengerData = {
                adultCount,
                childCount,
                totalCount: adultCount + childCount
            }

            const notificationData = {
                notificationTitle: "Hotel Booking Cancelled",
                notificationBrief: `Your hotel booking at ${orderResponse.bookingDetailsResponse.HotelName} for ${orderResponse.hotelBookingDetails.TotalRooms} ${orderResponse.hotelBookingDetails.TotalRooms == 1 ? 'Room' : 'Rooms'} from ${orderResponse.hotelBookingDetails.checkInDate} has been successfully cancelled. Please allow 5–7 working days for the refund to reflect in your account`,
                notificationTo: [req.user.username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
            };
            createNotification(notificationData);

            let templateDetails;
            req.user.registeredBy ?
                templateDetails = await fetchPartnerDetails(req.user.registeredBy)
                :
                // eslint-disable-next-line no-unused-vars
                templateDetails = await fetchPartnerDetails()
            const to = orderResponse?.hotelBookingDetails?.customerInfo?.emailAddress;
            const bookingDetailsResponse = orderResponse.bookingDetailsResponse
            const hotelBookingDetails = orderResponse.hotelBookingDetails
            const amount = orders.baseAmount

            await sendHotelBookingCancelledEmail(to, bookingDetailsResponse, hotelBookingDetails, amount, templateDetails, passengers[0]?.passengers?.[0], passengerData, req.user, req?.LogTraceId);



            // await processRefund(transaction, result, req, corporateTxnId);

            // walletDetails = await wallet.findOne({
            //     where: {
            //         credentialId
            //     },
            //     attributes: ['balance']
            // })

        }
        return res.status(200).json({
            status: true,
            data: {
                ...result, status: bookingStatus,
                // corporateFinalBalance: walletDetails['balance']
            },
            message: "Change request processed successfully",
            responseCode: "000",
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "🚀 ~ Error in sendChangeRequest",
            error,
        });

        if (error.response) {
            // Server returned a response outside of the 2xx range
            return next(new ErrorResponse(error.response?.data?.message || "API Error", error.response.status || 500));
        } else if (error.request) {
            // No response received
            return next(new ErrorResponse("No response from API server", 502));
        } else {
            // Other unexpected errors
            return next(new ErrorResponse(error.message || "Internal Server Error", 500));
        }
    }
});



async function createDataForHotelTicket(orderId) {
    try {
        const order = await findOneOrderById(orderId)
        if (!order) {
            throw new Error("Order not found");
        }
        let orderResponse = {};

        try {
            orderResponse = JSON.parse(order.orderResponse || "{}");
        } catch {
            orderResponse = {};
        }
        let {

            HotelImage,

            HotelName,
            checkInDate,
            checkOutDate,

            // eslint-disable-next-line no-unsafe-optional-chaining
        } = orderResponse?.hotelBookingDetails
        // let {
        //     CheckInDate,
        //     CheckOutDate,

        // } = orderResponse?.bookingDetailsResponse


        let { BookingRefNo, BookingDate, } = orderResponse.bookingDetailsResponse

        let transactionDate = BookingDate
        const TotalRooms = orderResponse.bookingDetailsResponse.NoOfRooms
        // const BookingRefNo = orderResponse.BookingRefNo


        let passengersDetails = orderResponse.bookingDetailsResponse.Rooms || []
      
        const simplifiedPassengerTypes = passengersDetails.map((room) => ({
           
            passengers: room.HotelPassenger.map((passenger) => ({
                PassengerType: passenger.Age > 12 ? "Adult" : "Child",
                PassengerName: `${passenger.FirstName} ${passenger.LastName}`, // Added space between names
                Email: passenger.Email,
                Phoneno: passenger.Phoneno,
            })),
        }));
       
        orderResponse.bookingDetailsResponse.PassengerTypes = simplifiedPassengerTypes;
        const checkInDate1 = new Date(checkInDate);
        const checkOutDate1 = new Date(checkOutDate);
        const timeDiff = checkOutDate1.getTime() - checkInDate1.getTime();
        const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const RoomTypeName = orderResponse.bookingDetailsResponse.Rooms?.map(room => room.RoomTypeName);
       
        const CancellationPolicy = orderResponse.bookingDetailsResponse.Rooms?.[0]?.CancellationPolicy

        let adultCount = 0;
        let childCount = 0;
        let passengers = orderResponse?.bookingDetailsResponse.PassengerTypes || []

        passengers?.forEach((passenger) => {

            passenger?.passengers?.forEach((item) => {
                if (item.PassengerType === "Adult") {
                    adultCount++;
                } else if (item.PassengerType === "Child") {
                    childCount++;
                }
            });
        });



        let AddressLine1 = orderResponse.bookingDetailsResponse.AddressLine1
        let HotelPolicyDetail = orderResponse.bookingDetailsResponse?.RateConditions
        // HotelPolicyDetail = HotelPolicyDetail?.replace(/INR/g, "₹");

        const bookingData = {
            HotelName,
            AddressLine1,
            transactionDate,
            CheckInDate:checkInDate,
            CheckOutDate:checkOutDate,
            HotelImage,
            nights: nightDifference,
            hotelAdultCount: adultCount == 1 ? adultCount + ' Adult' : adultCount + ' Adults',
            hotelChildCount: (childCount == 1 || childCount == 0) ? childCount + ' Child' : childCount + ' Children',
            hotelRoomCount: TotalRooms == 1 ? TotalRooms + ' Room' : TotalRooms + ' Rooms',
            CancellationPolicy,
            RoomTypeName,
            HotelPolicyDetail,

        };
        const netAmount=orderResponse?.bookingDetailsResponse?.totalFare
    
        const data = {
            bookingReferenceId: BookingRefNo,
            amount: parseFloat(netAmount).toFixed(2),
            hotelTicketHTML: '',
            bookingData,
            passengers: passengers,
            surcharge: parseFloat(order?.surcharge || 0).toFixed(2),
            totalAmount: (parseFloat(order.baseAmount) - parseFloat(orderResponse?.couponDiscount || 0)).toFixed(2),
            pdfName: `${bookingData?.HotelName} – Booking Confirmation`,
        }

        return data
    } catch (error) {
        return error
    }

}

// Generate the hotel-ticket PDF with bounded retries, the same way the flight ticket PDF does in
// controllers/corporate/airline.js (generateFlightTicketPdf): a fresh browser launched per attempt,
// printed to a temp file and read back, no shared browser pool. This avoids any dependency on a
// long-lived pooled browser instance going stale across requests (e.g. the pooled getBrowser() in
// utils/puppeteer.js throwing "globalBrowser.isConnected is not a function" on UAT).
const HOTEL_TICKET_FONT_DENYLIST = ["fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net"];

const generateHotelTicketPdf = async (html, traceId) => {
    const MAX_PDF_ATTEMPTS = 3;
    const PAGE_TIMEOUT_MS = 60000;
    const IMAGE_WAIT_MS = 8000;
    let buffer = null;
    let isValidPdf = false;

    for (let attempt = 1; attempt <= MAX_PDF_ATTEMPTS; attempt += 1) {
        let browser = null;
        const outputFile = `hotel-ticket-${traceId || "na"}-${new Date().valueOf()}-${attempt}.pdf`;
        try {
            // eslint-disable-next-line no-await-in-loop
            browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
            // eslint-disable-next-line no-await-in-loop
            const page = await browser.newPage();

            // eslint-disable-next-line no-await-in-loop
            await page.setRequestInterception(true);
            page.on("request", (request) => {
                try {
                    const url = request.url();
                    if (url.startsWith("data:")) {
                        request.continue();
                        return;
                    }
                    if (request.resourceType() === "font" || HOTEL_TICKET_FONT_DENYLIST.some((host) => url.includes(host))) {
                        request.abort();
                        return;
                    }
                    request.continue();
                } catch (_) {
                    try { request.continue(); } catch (__) { /* request already handled */ }
                }
            });

            // eslint-disable-next-line no-await-in-loop
            await page.setContent(html, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });

            // eslint-disable-next-line no-await-in-loop
            await Promise.race([
                page.evaluate(
                    () => Promise.all(
                        Array.from(document.images || []).map((img) => (img.complete
                            ? Promise.resolve()
                            : new Promise((resolve) => {
                                const t = setTimeout(resolve, 5000);
                                img.addEventListener("load", () => { clearTimeout(t); resolve(); });
                                img.addEventListener("error", () => { clearTimeout(t); resolve(); });
                            })))
                    )
                ),
                new Promise((resolve) => { setTimeout(resolve, IMAGE_WAIT_MS); }),
            ]);

            // eslint-disable-next-line no-await-in-loop
            await page.pdf({
                path: outputFile,
                format: "A4",
                preferCSSPageSize: true,
                timeout: PAGE_TIMEOUT_MS,
            });
            buffer = fs.readFileSync(outputFile);

            const pdfHeader = Buffer.isBuffer(buffer) ? buffer.subarray(0, 4).toString() : "";
            isValidPdf = Buffer.isBuffer(buffer) && buffer.length > 1024 && pdfHeader === "%PDF";
            if (isValidPdf) break;

            customLog(traceId, "error", {
                message: "Hotel ticket PDF attempt produced invalid output, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                reason: `Invalid PDF buffer (${buffer?.length || 0} bytes, header: ${pdfHeader || "empty"})`,
                htmlLength: html?.length || 0,
            });
        } catch (err) {
            customLog(traceId, "error", {
                message: "Hotel ticket PDF attempt threw, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                errorMessage: err?.message || String(err),
                errorStack: err?.stack,
                htmlLength: html?.length || 0,
            });
        } finally {
            try { if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile); } catch (_) { /* temp file already gone */ }
            if (browser) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await browser.close();
                } catch (_) { /* browser already gone */ }
            }
        }
        if (attempt < MAX_PDF_ATTEMPTS) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => { setTimeout(resolve, 1500 * attempt); });
        }
    }

    return { isValidPdf, buffer };
};

exports.downloadBookingTicket = asyncHandler(async (req, res, next) => {
    try {
        // const data = req.body
        const orderId = req.query.orderId
        const ownedOrder = await findOwnedHotelOrder(req, orderId)
        if (!ownedOrder) {
            return next(new ErrorResponse('Booking not found!', 404))
        }
        const data = await createDataForHotelTicket(ownedOrder.id)

        let partnerDetails;
        partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

        customLog(req?.LogTraceId, "info", { message: "checking data for download ticket", data: data })


        const html = hotelTicketPDFTemplateNew(data, partnerDetails);
        const { isValidPdf: status, buffer } = await generateHotelTicketPdf(html, req?.LogTraceId)
        customLog(req?.LogTraceId, "info", { message: "checking status for download ticket", data: status })
        if (!status) {

            return next(new ErrorResponse("Error generating PDF", 500))
        } else {
            return res.status(200).json({
                status: true,
                message: 'Ticket fetched successfully',
                responseCode: '000',
                data: { pdfFile: buffer, pdfName: data?.pdfName }
            })
        }

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse("Something went wrong", 500))
    }
})

exports.getOtpCancel = asyncHandler(async (req, res) => {
    let { scope } = req.query;
    let otp;
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    if (scope == "email") {
        //it will create a bycrypted otp in db and return the created otp to send via email
        otp = await createOtp({ contact: req.user.email });
        if (!otp) {
            return res.status(500).json({ status: false, message: "Failed to create OTP.", responseCode: '001', data: {} });
        }

        //Sending Email with otp
        const otpDigits = String(otp ?? '').padEnd(6, ' ').split('').slice(0, 6);
        const otpBoxesHtml = `<table border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr>${otpDigits.map((d, i) => `<td style="padding:0 ${i < 5 ? '8px' : '0'} 0 0;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:44px;height:52px;background-color:#ffffff;border:1px solid #D1D5DB;border-radius:10px;"><tbody><tr><td align="center" valign="middle" style="width:44px;height:52px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:700;color:#000000;">${d}</td></tr></tbody></table></td>`).join('')}</tr></tbody></table>`;
        const resolvedHotelOtp = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.HOTEL_CANCELLATION_OTP,
            service: EMAIL_TEMPLATE_SERVICES.HOTEL,
            variables: {
                name: req.user.name,
                otpBoxesHtml,
                branding: templateDetails?.branding || 'Peko',
                ...v2LayoutVariables(templateDetails),
            },
            fallback: () => emailOTPTemaplte(req.user.name, otp, templateDetails),
            fallbackSubject: "Hotel Booking cancellation Request",
            logTraceId: req?.LogTraceId,
        });
        await emailer.email(req.user.email, resolvedHotelOtp.subject, resolvedHotelOtp.html);

        console.log("EMAIL:", otp, "------");

    }
    //ADD OTP RESPONSE
    return res.status(200).json({
        status: true,
        message: "OTP sent successfully via email.",
        data: process.env.NODE_ENV !== "production" ? { otp } : {},
        responseCode: '000'
    });
});

exports.listAllBookings = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        const credentialId = req.user.id
        const corporateUserId = req.user.corporateId
        const { serviceOperatorId } = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId: req.user.packageId,
            corporateUserId
        })

        let subCorporateUserId
        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            subCorporateUserId = req.user.subCorporateId;
        }

        const bookingData = await fetchBookings({ credentialId, serviceOperatorId, limit, page, subCorporateUserId });
        customLog(req?.LogTraceId, "info", { data: bookingData, message: "Data fetched from booking list" });

        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404))
        }
        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: bookingData.rows
            }
        })

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        return next(new ErrorResponse("Something went wrong", 400))
    }
});


exports.getCancellationStatus = asyncHandler(async (req, res, next) => {
    try {
        const orderId = req.body.orderId
        const orders = await findOwnedHotelOrder(req, orderId)
        if (!orders) {
            return next(new ErrorResponse('Booking not found!', 404))
        }

        const orderResponse = JSON.parse(orders.orderResponse);
        let serviceDetails = await checkService(req);
        const ChangeRequestId = orderResponse.ChangeRequestId;
        const ConfirmationNo = orders.providerId

        const username = serviceDetails.userName;
        const password = serviceDetails.password;
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');
        const {tokenId} = await getSession(serviceDetails);
        // Take the transaction from the stored order, never from the request body
        const transaction = await findOneTransaction({ corporateTxnId: orders.corporateTxnId })

        if (!transaction) {
            return next(new ErrorResponse('No transactions found!', 404))
        }// transaction is for refund purpose
        const body = JSON.stringify({
            "BookingMode": 5,
            "EndUserIp": serviceDetails.EndUserIp,
            "ChangeRequestId": ChangeRequestId,
            "RequestType": 4,
            "TokenId": tokenId
        });



        const config = {
            method: 'post',
            url: `${serviceDetails.HEALTH_URL}/GetChangeRequestStatus`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`,
            },
            data: body,
        };

        customLog(req?.LogTraceId, "info", { config, message: "API Call for change request status." });


        const response = await axios(config);

        const result = response?.data?.HotelChangeRequestResult;
        customLog(req?.LogTraceId, "info", { data: result, message: "Data fetched from change status api." });
        let status
        const statusNo = response?.data.HotelChangeRequestStatusResult.ChangeRequestStatus;
        if (statusNo === 1) {
            status = 'Pending'
        } else if (statusNo === 2) {
            status = 'InProgress'
        } else if (statusNo === 3) {
            status = 'Processed'
        } else if (statusNo === 0) {
            status = 'NotSet'
        } else {
            status = 'Rejected'
        }
        let totalCancellationCharges = result?.CancellationChargeBreakUp;

        const CancellationCharges = totalCancellationCharges?.CancellationFees + totalCancellationCharges?.CancellationServiceCharge

        let refundAmount = parseFloat(transaction.order.amountInINR) || 0;

        if (!isNaN(parseFloat(CancellationCharges))) {
            refundAmount -= parseFloat(CancellationCharges);
        }
        customLog(req?.LogTraceId, "info", { refundAmount, message: "refundAmount for change request." });

        // Fetch partial refund details
        let partialRefund = await getPartialRefundDetails({ corporateTxnId: orders.corporateTxnId, refundAmount });

        await updateBookingStatus({ ConfirmationNo, totalCancellationCharges, partialRefund, status, ChangeRequestId: result?.ChangeRequestId })

        if (status == 'Processed') {
            try {
                await orders.update(
                    {
                        status: 'REFUND_REQUESTED',
                        message: 'Cancelled and requested for refund.',
                    },
                    { where: { id: transaction?.order?.id } }
                );
                let passengersDetails = orderResponse.bookingDetailsResponse.HotelRoomsDetails || []
                const simplifiedPassengerTypes = passengersDetails.map((room) => ({
                    passengers: room.HotelPassenger.map((passenger) => ({
                        PassengerType: passenger.Age > 12 ? "Adult" : "Child",
                        PassengerName: `${passenger.FirstName} ${passenger.LastName}`, // Added space between names
                        Email: passenger.Email,
                        Phoneno: passenger.Phoneno,
                    })),
                }));
                orderResponse.bookingDetailsResponse.PassengerTypes = simplifiedPassengerTypes;

                let adultCount = 0;
                let childCount = 0;
                let passengers = orderResponse?.bookingDetailsResponse.PassengerTypes || []

                passengers.forEach((passenger) => {

                    passenger.passengers.forEach((item) => {
                        if (item.PassengerType === "Adult") {
                            adultCount++;
                        } else if (item.PassengerType === "Child") {
                            childCount++;
                        }
                    });
                });

                const passengerData = {
                    adultCount,
                    childCount,
                    totalCount: adultCount + childCount
                }

                const notificationData = {
                    notificationTitle: "Hotel Booking Cancelled",
                    notificationBrief: `Your hotel booking at ${orderResponse.bookingDetailsResponse.HotelName} for ${orderResponse.hotelBookingDetails.TotalRooms} ${orderResponse.hotelBookingDetails.TotalRooms == 1 ? 'Room' : 'Rooms'} from ${orderResponse.hotelBookingDetails.checkInDate} has been successfully cancelled. Please allow 5–7 working days for the refund to reflect in your account`,
                    notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
                    notificationCategory: "CORPORATE", // Replace with the relevant category
                    notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
                };
                createNotification(notificationData);


                let templateDetails;
                req.user.registeredBy ?
                    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
                    :
                    // eslint-disable-next-line no-unused-vars
                    templateDetails = await fetchPartnerDetails()
                const to = orderResponse.bookingDetailsResponse.HotelRoomsDetails[0].HotelPassenger[0].Email;
                const bookingDetailsResponse = orderResponse.bookingDetailsResponse
                const hotelBookingDetails = orderResponse.hotelBookingDetails
                const amount = orders.baseAmount

                await sendHotelBookingCancelledEmail(to, bookingDetailsResponse, hotelBookingDetails, amount, templateDetails, passengers[0]?.passengers?.[0], passengerData, req.user, req?.LogTraceId);

            } catch (error) {
                customLog(req?.LogTraceId, "error", { message: error?.message })
            }
        }
        return res.status(200).json({
            status: true,
            data: {
                ...result,
                status
            },
            message: "Status fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        console.log(error)
        customLog(req?.LogTraceId, "error", {
            message: "🚀 ~ Error in sendChangeRequest",
            error,
        });

        if (error.response) {
            // Server returned a response outside of the 2xx range
            return next(new ErrorResponse(error.response?.data?.message || "API Error", error.response.status || 500));
        } else if (error.request) {
            // No response received
            return next(new ErrorResponse("No response from API server", 502));
        } else {
            // Other unexpected errors
            return next(new ErrorResponse(error.message || "Internal Server Error", 500));
        }
    }
})

const processHotelBooking = asyncHandler(async ({ serviceDetails, updateDetails, TraceId, userDetails }) => {
    try {

        customLog(null, "info", { message: "processing processHotelBooking", data: updateDetails });

        let bookingDetailsResponse = null;

        try {
            bookingDetailsResponse = await getBookingDetails(serviceDetails, TraceId);
            const transactionId = updateDetails.corporateTxnId
            customLog(null, "info", { updateDetails, message: "updateDetails before modification:" });



            // Step 1: Parse the existing orderResponse safely
            let existingOrderResponse = {};
            if (typeof updateDetails.orderResponse === 'string') {
                try {
                    existingOrderResponse = JSON.parse(updateDetails.orderResponse);
                } catch (err) {
                    customLog(null, 'error', { message: 'Invalid JSON in orderResponse', error: err });
                    existingOrderResponse = {}; // Fallback to empty object
                }
            } else if (typeof updateDetails.orderResponse === 'object' && updateDetails.orderResponse !== null) {
                existingOrderResponse = updateDetails.orderResponse;
            }

            // Step 2: Add or merge bookingDetailsResponse to the existing orderResponse
            existingOrderResponse.bookingDetailsResponse = bookingDetailsResponse; // Add the new data

            // Step 3: Stringify and assign the updated orderResponse back to updateDetails
            updateDetails.orderResponse = JSON.stringify(existingOrderResponse);


            // Ensure corporateTxnId is always a string
            if (updateDetails.corporateTxnId) {
                updateDetails.corporateTxnId = String(updateDetails.corporateTxnId);
            }
            customLog(null, "info", { data: updateDetails.orderResponse, message: "order response after modification:" });


            await updateWalletTransaction(updateDetails);
            customLog(null, "info", { transactionId, message: "log for getting transaction id" });

            const orderData = await findOneOrderByTxnId(transactionId)

            customLog(null, "info", { data: orderData, message: "hotel order fetched" });
            const orderResponse = JSON.parse(orderData.orderResponse);
            const emailId = orderResponse.customerInfo?.emailAddress;
            let templateDetails;
            templateDetails = await fetchPartnerDetails(userDetails.registeredBy)
            const data = {
                email: emailId,
                name: userDetails.name,
                orderId: orderData.id,
                corporateTxnId: transactionId,
                amount: parseFloat(orderData.amountInINR) + parseFloat(orderData.surcharge),
                baseAmount: parseFloat(orderData.amountInINR),
                surcharge: parseFloat(orderData.surcharge) || 0,
                credentialId: userDetails.id,
                templateDetails
            }
            data.registeredBy = userDetails.registeredBy
            customLog(null, "info", { response: data, message: "send email data..." });
            // eslint-disable-next-line no-unused-vars
            generateAttachmentAndSendEmailAndNotification(data, (err, pdfFile) => {

                customLog(null, "info", { message: "email sent successfully" });
            });

            return true;
        } catch (error) {
            customLog(null, "error", {
                message: "🚀 ~ Error fetching booking details:",
                error,
            });
            return false;
        }

    } catch (error) {
        customLog(null, "error", {
            message: "🚀 ~ Error fetching booking catch:",
            error,
        });
        return false;
    }
});




async function fetchAndProcessOrders() {
    try {

        // Fetch orders with serviceOperatorId and filter unprocessed bookingStatus
        const serviceOperator = await findServiceOperatorByAccessKey(accessKey); // Fetch all relevant orders
        const orders = await findOrdersByServiceOperatorId(serviceOperator.id)
        const filteredOrders = orders.filter(order => {
            const orderResponse = JSON.parse(order.orderResponse || "{}");
            return orderResponse.bookingStatus && orderResponse.bookingStatus !== "Processed" && orderResponse.ChangeRequestId;
        });


        // Process all orders concurrently using Promise.all
        await Promise.all(
            filteredOrders.map(async (order) => {
                try {
                    // Call getCancellationStatus or similar logic for each order
                    await processOrderStatus(order); // Implement `processOrderStatus` logic
                } catch (error) {
                    customLog(null, "error", { message: `Error processing order ${order.id}:`, error: error.message });
                }
            })
        );

    } catch (error) {
        customLog(null, "error", { message: "🚀 ~ Error in scheduler:", error: error.message });
    }
}


async function generateAttachmentAndSendEmailAndNotification(params, callback) {
    try {

        let data = await createDataForHotelTicket(params.orderId)
        customLog(null, "info", { response: data, message: "created data for hotelTicket" });

        const partnerDetails = params?.templateDetails
        let to = params.email;
        let user = params.name;

        const html = hotelTicketPDFTemplateNew(data, partnerDetails);

        const { buffer } = await generateHotelTicketPdf(html)

        const files = [{ filename: `${data?.pdfName}.pdf`, content: buffer }]
        const subject = "Your hotel booking confirmed";

        const bd = data.bookingData || {};
        const mainGuest = data.passengers?.[0]?.passengers?.[0]; /// passengers[0] == main guest
        const convertDateToDDMMYYYY = (dateStr) => {
            if (!dateStr) return "N/A";
            return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
        };
        const convertTimeTo12HR = (dateStr) => {
            if (!dateStr) return "N/A";
            return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).replace(/am|pm/i, (m) => m.toUpperCase());
        };
        const nights = bd.nights;
        const bookingDataWithRef = { ...bd, bookingReferenceId: data?.bookingReferenceId };

        // Staging always uses Peko's own staging URL (one shared domain for testing).
        // Production uses the partner's own baseUrl, since white-label partners have
        // their own frontend domain there.
        const manageBookingBaseUrl = NODE_ENV === "staging" ? STAGING_URL : partnerDetails?.baseUrl;

        const resolved = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.HOTEL_BOOKING_CONFIRMATION,
            service: EMAIL_TEMPLATE_SERVICES.HOTEL,
            variables: {
                user,
                hotelName: bd.HotelName,
                address: bd.AddressLine1,
                bookingReferenceId: data?.bookingReferenceId,
                checkInDate: convertDateToDDMMYYYY(bd.CheckInDate),
                checkInTime: convertTimeTo12HR(bd.CheckInDate),
                checkOutDate: convertDateToDDMMYYYY(bd.CheckOutDate),
                checkOutTime: convertTimeTo12HR(bd.CheckOutDate),
                hotelAdultCount: bd.hotelAdultCount,
                hotelChildCount: bd.hotelChildCount,
                nightsText: `${nights} ${nights === 1 ? 'Night' : 'Nights'}`,
                hotelRoomCount: bd.hotelRoomCount,
                mainGuestLabel: mainGuest ? `${mainGuest.PassengerName} (${mainGuest.PassengerType})` : "",
                hotelImageUrl: bd.HotelImage ? bd.HotelImage.replace(/ /g, "%20") : "https://peko-storage.s3.me-central-1.amazonaws.com/staging/common/templates/fogg-welcome-by-man.png",
                manageBookingUrl: `${manageBookingBaseUrl}/corporate-travel/hotels/manage-bookings`,
                branding: partnerDetails?.branding || 'Peko',
                ...v2LayoutVariables(partnerDetails),
            },
            fallback: () => generateHotelTicketAndSendToMailNew({ user }, bookingDataWithRef, mainGuest, { ...partnerDetails, baseUrl: manageBookingBaseUrl }),
            fallbackSubject: subject,
            logTraceId: params.orderId,
        });
        const body = resolved.html;
        const resolvedSubject = resolved.subject;

        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: params?.baseAmount,
            surcharge: params?.surcharge || 0,
            couponDiscount: 0,
            corporateTxnId: params?.corporateTxnId,
            orderId: params?.orderId,
            paymentType: "Hotel Booking",
            credentialId: params?.credentialId,
            pgAmount: null,
            traceId: null,
        });

        // Call email function to send email with payment details in the body
        emailer.emailWithMultipleAttachment(to, resolvedSubject, body, [...files, ...invoiceAttachments], async (emailErr) => {
            try {
                if (emailErr) {

                    customLog(null, "error", { emailErr, message: "Error sending email:" });
                    callback(emailErr, null);
                } else {
                    customLog(null, "info", { message: "email sent for hotel booking", data: to });
                    callback(null, true);
                }

            } catch (error) {
                customLog(null, "error", { message: "log for getting error on ticket generate", error: error })
            }

        });
    } catch (err) {
        console.error(`Error in generateAttachmentAndSendEmailAndNotificationFunction: ${err}`);
        customLog(null, "error", { error: err, message: "Error in generateAttachmentAndSendEmailAndNotificationFunction:" });
        callback(err, null);
    }
}

async function processOrderStatus(order) {
    try {
        // Simulate calling a similar function to `getCancellationStatus`
        const orderResponse = JSON.parse(order.orderResponse);
        const ChangeRequestId = orderResponse.ChangeRequestId;
        const ConfirmationNo = order.providerId;
        // const vendorName = "TBO Hotels"
        // const vendor = await findOne({ vendorName: vendorName })

        const serviceOperator = await findServiceOperatorByAccessKey(accessKey);

        const vendor= serviceOperator?.vendor

        const authUrlObj = vendor.optionals
        const authUrl = authUrlObj ? authUrlObj.hotelsAuth : null;

        // Fetch service details
        const serviceDetails = {
            userName: vendor.optional1,
            password: vendor.optional2,
            ClientId: vendor.optional3,
            userNameNew: vendor.optional4,
            passwordNew: vendor.optional5,
            API_URL: vendor.apiUrl,
            API_URL_New: vendor.optional6,
            HEALTH_URL: vendor.healthUrl,
            AUTH_URL: authUrl
        };
        const transaction = await findOneTransaction({ corporateTxnId: order.corporateTxnId })
        if (!serviceDetails) {
            throw new Error('Failed to fetch service details');
        }

        // Get session token
        const {tokenId} = await getSession(serviceDetails);
        if (!tokenId) {
            throw new Error('Failed to fetch session token');
        }

        // Prepare the request body for the API call
        const body = JSON.stringify({
            BookingMode: 5,
            EndUserIp: serviceDetails.EndUserIp,
            ChangeRequestId: ChangeRequestId,
            RequestType: 4,
            TokenId: tokenId,
        });

        // Configure the API request
        const config = {
            method: "post",
            url: `${serviceDetails.HEALTH_URL}/internalhotelservice.svc/rest/GetChangeRequestStatus`,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(`${serviceDetails.userName}:${serviceDetails.password}`).toString("base64")}`,
            },
            data: body,
        };

        // Make the API call
        const response = await axios(config);
        if (!response || !response.data) {
            throw new Error('Invalid response from API');
        }

        const statusNo = response?.data?.HotelChangeRequestStatusResult?.ChangeRequestStatus;
        const result = response?.data?.HotelChangeRequestResult;

        let status;
        switch (statusNo) {
            case 1: status = "Pending"; break;
            case 2: status = "InProgress"; break;
            case 3: status = "Processed"; break;
            case 0: status = "NotSet"; break;
            default: status = "Rejected"; break;
        }

        let totalCancellationCharges = result?.CancellationChargeBreakUp;

        const CancellationCharges = totalCancellationCharges?.CancellationFees + totalCancellationCharges?.CancellationServiceCharge

        let refundAmount = parseFloat(transaction.order.amountInINR) || 0;

        if (!isNaN(parseFloat(CancellationCharges))) {
            refundAmount -= parseFloat(CancellationCharges);
        }
        customLog(null, "info", { refundAmount, message: "refundAmount for change request." });

        // Fetch partial refund details
        let partialRefund = await getPartialRefundDetails({ corporateTxnId: order.corporateTxnId, refundAmount });

        await updateBookingStatus({ ConfirmationNo, totalCancellationCharges, partialRefund, status, ChangeRequestId: result?.ChangeRequestId })


        if (status == 'Processed') {
            try {
                await order.update(
                    {
                        status: 'REFUND_REQUESTED',
                        message: 'Cancelled and requested for refund.',
                    },
                    { where: { id: transaction?.order?.id } }
                );

            } catch (error) {
                customLog(null, "error", { message: error?.message })
            }
        }
        return {
            status: true,
            message: 'Order status processed successfully',
        };

    } catch (error) {

        customLog(null, "error", { message: "Error in processOrderStatus:", error });

        // Optionally, you can log the traceId if available
        if (order?.LogTraceId) {
            customLog(order.LogTraceId, "error", {
                message: `Error processing order status for orderId: ${order.id}`,
                error: error.message || error,
            });
        }

        // Return a structured error response
        return {
            status: false,
            message: error.message || 'Internal server error',
        };
    }
}



let currentJob = null;

async function startDynamicScheduler() {
    try {
        const interval = await getSchedulerInterval("hotelBookingCancellation");
        const millisecondsInterval = interval * 60 * 60 * 1000; // Convert hours to milliseconds

        if (currentJob) {
            currentJob.cancel();
        }

        currentJob = schedule.scheduleJob(new Date(Date.now() + millisecondsInterval), async function schedulerJob() {
            try {
                await fetchAndProcessOrders();
            } catch (error) {
                customLog(null, "error", { message: "Error during scheduled task execution" });
            } finally {
                console.log(`Rescheduling next execution in ${interval} hours...`);
                startDynamicScheduler();
            }
        });
    } catch (error) {
        customLog(null, "error", { message: error.message });
    }
}

startDynamicScheduler();

exports.processHotelBooking = processHotelBooking;
