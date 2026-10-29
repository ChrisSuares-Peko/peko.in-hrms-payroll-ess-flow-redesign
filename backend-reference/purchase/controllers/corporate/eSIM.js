const axios = require('axios')
const asyncHandler = require("../../middlewares/async");
const { getUniqueCountries,getPlanOptionsByCountry,getPlan,getPlanByPlanId,checkService,getRegionOptions,getPlanOptionsByRegion } = require("../../models/use-cases/esim");
const { REGIONS } = require("../../utils/esimPlanHelpers");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require('../../utils/loggerHelper');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { findOneOrder, updateOrder } = require('../../models/use-cases/order');
const operatorsData = require("../../utils/operatorsData.json");
const { removeCommissionFields } = require("../../utils/configuredFlag");

// const { fetchServiceDetailsByOperatorId } = require('../../models/use-cases/serviceOperator');
const accessKey = operatorsData.eSIM.accessKey
const accessKeyTunz = operatorsData.eSIMTunz.accessKey

exports.getCountries = asyncHandler(async (req, res, next) => {
    const countries=await getUniqueCountries();
    if(!countries){
        return next(
            new ErrorResponse(`Something went wrong while fetching countries`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Countries fetched successfully",
        data:countries,
        responseCode: "000",
    });
});

exports.getPlans=asyncHandler(async (req, res, next) => {
    const country=req.params.country;
    const plans = await getPlanOptionsByCountry(country,"", req.user?.id);
    if(!plans){
        return next(
            new ErrorResponse(`Something went wrong while fetching plans`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Plans fetched successfully",
        data:plans,
        responseCode: "000",
    });
})

exports.getRegions = asyncHandler(async (req, res, next) => {
    const regions = await getRegionOptions();
    if (!regions) {
        return next(
            new ErrorResponse(`Something went wrong while fetching regions`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Regions fetched successfully",
        data: regions,
        responseCode: "000",
    });
});

exports.getPlansByRegion = asyncHandler(async (req, res, next) => {
    const regionCode = req.params.regionCode;
    if (!REGIONS[regionCode]) {
        return next(new ErrorResponse(`Invalid region`, 400));
    }
    const plans = await getPlanOptionsByRegion(regionCode, req.user?.id);
    if (!plans) {
        return next(
            new ErrorResponse(`Something went wrong while fetching plans`, 500)
        );
    }
    return res.status(200).json({
        status: true,
        message: "Plans fetched successfully",
        data: plans,
        responseCode: "000",
    });
});

exports.getPlanDetails = asyncHandler(async (req, res, next) => {
    const { orders } = req.body
    if (!Array.isArray(orders) || orders.length === 0) {
        return next(new ErrorResponse('Orders array is required', 400));
    }
    const plan = await getPlan(orders, req.user?.id);
    if (!plan) {
        return next(
            new ErrorResponse(`Something went wrong while fetching plan details`, 500)
        );
    }
    removeCommissionFields(plan.plans);
    return res.status(200).json({
        status: true,
        message: "Plan details fetched successfully",
        data: plan,
        responseCode: "000",
    });
})

exports.getPlansTop = asyncHandler(async (req, res, next) => {
    let planId = req.params.planId;
    const planDetails = await getPlanByPlanId(planId)
    const countryFromFE = req.query.country;

    if (!planDetails) {
        return next(new ErrorResponse(`PlanId not found`, 500));
    }
    let { country, provider, coverageId } = planDetails;
    // Regional eSIMs top up strictly within the same Tunz coverage set (regions overlap heavily)
    const isRegionalTunzPlan = provider === "tunz" && Boolean(REGIONS[coverageId]);
    if (provider === "tunz" && !isRegionalTunzPlan) {
        if (countryFromFE) {
            country = countryFromFE;
        }
        if (!country) {
            return next(new ErrorResponse(`Country is required for Tunz top-up`, 400));
        }
    }

    const serviceDetails = await checkService(accessKey)

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
    if (!token) {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
    }

    try {
        if (provider === "tunz") {

            const plans = isRegionalTunzPlan
                ? await getPlanOptionsByRegion(coverageId, req.user?.id)
                : await getPlanOptionsByCountry(country, provider, req.user?.id);

            if (!plans) {
                return next(
                    new ErrorResponse(`Something went wrong while fetching plans for TopUp`, 500)
                );
            }

            return res.status(200).json({
                status: true,
                message: "Topup Plans fetched successfully",
                data: plans,
                responseCode: "000",
            });
        }

        // 🔹 Bondio validation
        let vendorPlanId = planId;

        if (process.env.NODE_ENV === 'staging') {
            vendorPlanId = 'plan_3pgmii7w';
        }

        const url = `${URL}/v1/plans/${vendorPlanId}`;

        const config = {
            method: "get",
            url,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };

        const response = await axios(config);

        if (response?.status !== 200) {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
        }
        if (
            process.env.NODE_ENV !== 'staging' &&
            (response.data?.label || '').toLowerCase() !== (provider || '').toLowerCase()
        ) {
            return next(new ErrorResponse(`Topup plan not supported`, 500));
        }

        const plans = await getPlanOptionsByCountry(country, provider, req.user?.id);

        if (!plans) {
            return next(
                new ErrorResponse(`Something went wrong while fetching plans for TopUp`, 500)
            );
        }
        return res.status(200).json({
            status: true,
            message: "Topup Plans fetched successfully",
            data: plans,
            responseCode: "000",
        });

    } catch (err) {
        customLog(req?.LogTraceId, "error", {
            message: err?.message,
            data: err?.response?.data,
        });

        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {},
            responseCode: '001',
        });
    }
})

exports.getEsimQRCode = asyncHandler(async (req, res, next) => {

    const corporateTxnId = req.params.esimId;

    const order = await findOneOrder({ corporateTxnId });

    if (!order) {
        customLog(req?.LogTraceId, "error", {
            message: "Order not found for getEsimQRCode",
            corporateTxnId
        });
        return next(new ErrorResponse("Order not found", 404));
    }

    // The QR activates the eSIM, so only its owner may fetch it
    if (String(order.credentialId) !== String(req.user.id)) {
        return next(new ErrorResponse("Order not found", 404));
    }

    const orderResponse = JSON.parse(order.orderResponse || "{}");

    const iccid =
        orderResponse?.esim ||
        orderResponse?.esimProfile?.iccid ||
        orderResponse?.iccid;

    // Try multiple locations for activation code since Tunz API response structure varies
    const activationCode =
        orderResponse?.esimProfile?.activationCode ||
        orderResponse?.activationCode ||
        orderResponse?.activatedItem?.activationCode;

    // Check if this is a top-up (any provider):
    // - Top-up has: iccid (from req body), no activationCode, and no qrCodeUrl/qrCodeBase64
    // This means the eSIM is already installed, so QR code is not needed for top-ups
    const isTopUp = !activationCode && orderResponse?.iccid && !orderResponse?.qrCodeUrl && !orderResponse?.qrCodeBase64;

    customLog(req?.LogTraceId, "info", {
        message: "getEsimQRCode - Retrieved order data",
        corporateTxnId,
        hasActivationCode: !!activationCode,
        isTopUp,
        hasEsimProfile: !!orderResponse?.esimProfile,
        hasActivatedItem: !!orderResponse?.activatedItem,
        hasQrCodeUrl: !!orderResponse?.qrCodeUrl,
        hasQrCodeBase64: !!orderResponse?.qrCodeBase64,
        iccid: orderResponse?.iccid
    });

    // For top-ups: QR code is not needed since eSIM is already installed
    if (isTopUp) {
        customLog(req?.LogTraceId, "info", {
            message: "Top-up order detected - QR code not applicable",
            corporateTxnId,
            iccid: orderResponse?.iccid
        });

        return res.status(200).json({
            status: true,
            message: "QR code not available for top-ups",
            data: {},
            responseCode: '000',
        });
    }

    // ---------------- TUNZ - NEW PURCHASE ----------------
    if (activationCode) {

        const QRCode = require("qrcode");

        const qrImage = await QRCode.toDataURL(activationCode);

        return res.status(200).json({
            status: true,
            data: qrImage.replace(/^data:image\/png;base64,/, ''),
            message: "QR Code Generated successfully",
            responseCode: '000'
        });
    }

    // ---------------- BONDIO ----------------

    // Return cached base64 if already fetched previously
    const cachedQRBase64 = orderResponse?.qrCodeBase64;
    if (cachedQRBase64) {
        return res.status(200).json({
            status: true,
            data: cachedQRBase64,
            message: "QR Code Generated successfully",
            responseCode: '000',
        });
    }

    // If qrCodeUrl was saved during purchase, fetch from there instead of calling Bondio API again
    const storedQRCodeUrl = orderResponse?.qrCodeUrl;
    if (storedQRCodeUrl) {
        try {
            const imgResponse = await axios.get(storedQRCodeUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imgResponse.data, 'binary');
            const base64Image = imageBuffer.toString('base64');
            return res.status(200).json({
                status: true,
                data: base64Image,
                message: "QR Code Generated successfully",
                responseCode: '000',
            });
        } catch (urlErr) {
            customLog(req?.LogTraceId, "error", { message: "Failed to fetch QR from stored URL, falling back to Bondio API", error: urlErr?.message });
        }
    }

    let serviceDetails = await checkService(accessKey);

    if (serviceDetails === false) {
        return res.status(400).json({
            status: false,
            message: "Apologies, the service you are trying to access is currently unavailable.",
            data: {},
            responseCode: "001"
        });
    }

    const URL = serviceDetails.vendor.apiUrl;
    const token = serviceDetails.vendor.optional1;

    if (!token) {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
    }

    let url = `${URL}/v1/esims/${iccid}/qrcode`;

    let config = {
        method: "get",
        url,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`,
        },
        responseType: 'arraybuffer'
    };

    try {

        let response = await axios(config);

        if (!response) {
            return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
        }

        const imageBuffer = Buffer.from(response.data, 'binary');
        const base64Image = imageBuffer.toString('base64');

        // Cache the base64 QR in orderResponse so future requests skip the Bondio API call
        try {
            await updateOrder({ id: order.id }, {
                orderResponse: JSON.stringify({ ...orderResponse, qrCodeBase64: base64Image })
            });
        } catch (cacheErr) {
            customLog(req?.LogTraceId, "error", { message: "Failed to cache QR code in orderResponse", error: cacheErr?.message });
        }

        return res.status(200).json({
            status: true,
            data: base64Image,
            message: "QR Code Generated successfully",
            responseCode: '000',
        });

    } catch (err) {

        customLog(req?.LogTraceId, "error", {
            message: err?.message,
            data: err?.response?.data
        });

        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {},
            responseCode: '001'
        });
    }

});

exports.getEsimQDetails=asyncHandler(async (req, res, next) => {
    const planId=req.query.planId
    const iccidNo=req.query.iccidNo
    const customerUid = req.query.customerUid
    let serviceDetails = await checkService(accessKey)
    let serviceDetailsTunz = await checkService(accessKeyTunz)
    if (serviceDetails === false) {
        return res.status(400).json({
            status: false,
            message: "Apologies, the service you are trying to access is currently unavailable.",
            data: {},
            responseCode: "001"
        });
    }

    const URL = serviceDetails.vendor.apiUrl;
    const URL_TUNZ = serviceDetailsTunz.vendor.apiUrl;
    let token;

    

    let esimDetails = await getPlanByPlanId(planId);
    if (!esimDetails) {
        return next(new ErrorResponse(`PlanId not found`, 500));
    }

    const { provider } = esimDetails;
    if (provider === "tunz") {
        // Fetching token for Tunz from specific method
        token = await getToken(serviceDetailsTunz.vendor, accessKeyTunz);
    } else {
        token = serviceDetails.vendor.optional1; // Default token for other vendors
    }

    if (!token) {
        return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
    }
    try {
        // ---------------- TUNZ ----------------
        if (provider === "tunz") {

            if (!customerUid) {
                return next(new ErrorResponse("customerUid is required for Tunz", 400));
            }

            // Tunz catalogue sends size 0 for unlimited plans, but the activation balance carries a GB allowance
            const isUnlimited = esimDetails.dataMBs != null && Number(esimDetails.dataMBs) === 0;

            if (process.env.NODE_ENV === 'staging') {
                // Mock mirrors the actually purchased plan so it stays consistent with order history
                const countryForMock = req.query.country || esimDetails.country || 'India';
                const mockSizeMBs = Number(esimDetails.dataMBs) || 1024;
                const mockData = isUnlimited
                    ? "Unlimited"
                    : mockSizeMBs >= 1024
                        ? `${mockSizeMBs / 1024} GB`
                        : `${mockSizeMBs} MB`;
                const mockValidityDays = Number(esimDetails.periodDays) || 30;

                return res.status(200).json({
                    status: true,
                    data: {
                        countryName: countryForMock,
                        networks: esimDetails.coverageId || "",
                        validity: `${mockValidityDays} days`,
                        newTopupData: mockData,
                        esim: req.query.iccidNo || "",
                        dataBal: mockData,
                        planName: esimDetails.name || "",
                        activationMode: "FIRST_USE",
                        activatedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + mockValidityDays * 24 * 60 * 60 * 1000).toISOString(),
                        lastSeen: new Date().toISOString(),
                        esimState: "INSTALLED",
                        installationUrl: ""
                    },
                    message: "Esim details fetched successfully",
                    responseCode: "000",
                });
            }

            const config = {
                method: "get",
                url: `${URL_TUNZ}/gigastore/activations/customers/${encodeURIComponent(customerUid)}`,
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            };

            const response = await axios(config);

            const activatedItems = response?.data?.activatedItems || [];


            if (!activatedItems.length) {
                return next(new ErrorResponse("No activated items found", 500));
            }

            // Get the latest activated package
            const latestItem = activatedItems[activatedItems.length - 1];
            const balance = latestItem.balance;
            const relatedEsim = response?.data?.relatedEsims?.[0];

            return res.status(200).json({
                status: true,
                data: {
                    countryName: req.query.country,
                    networks: balance?.countrySet || "",
                    validity: `${balance?.validitySize} ${balance?.validityUnit}`,
                    newTopupData: isUnlimited ? "Unlimited" : `${balance?.size?.sizeValue} ${balance?.size?.sizeUnit}`,
                    esim: relatedEsim?.iccid || "",
                    dataBal: `${balance?.availableBalance?.sizeValue} ${balance?.availableBalance?.sizeUnit}`,
                    planName: balance?.name || "",
                    activationMode: balance?.activationMode || "",
                    activatedAt: balance?.activatedAt || null,
                    expiresAt: balance?.expiresAt || null,
                    lastSeen: relatedEsim?.lastSeen || null,
                    esimState: relatedEsim?.state || "",
                    installationUrl: relatedEsim?.installationUrl || ""
                },
                message: "Esim details fetched successfully",
                responseCode: "000",
            });
        }

        // ---------------- BONDIO (existing logic unchanged) ----------------

        if (process.env.NODE_ENV === 'staging') {
            // Get country from plan if not provided in query
            let countryForMock = req.query.country;
            if (!countryForMock && esimDetails) {
                countryForMock = esimDetails.country || 'India'; // Fallback to default country
            }

            return res.status(200).json({
                status: true,
                data: {
                    countryName: countryForMock,
                    networks: "IN",
                    validity: "30 Days",
                    newTopupData: "1.00 GB",
                    esim: iccidNo,
                    dataBal: "0.80 GB"
                },
                message: "Esim details fetched successfully",
                responseCode: "000",
            });
        }

        let url = `${URL}/v2/subscriptions/${encodeURIComponent(iccidNo)}/plan-attachments?expand=plan`;

        let config = {
            method: "get",
            url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        };

        let response = await axios(config);

        const items = response?.data?.items || [];
        if (!items.length) {
            return next(new ErrorResponse("No subscription items found", 500));
        }

        let dataBal = 0, totalBal = 0;
        let countryName = "", networks = "", validity = 0, lattestTopData = 0, newTopupData = 0;

        const subscriptionList = response.data?.items;

        const coverageProfileId = items[0]?.plan?.coverageProfileId;

        if (!coverageProfileId) {
            return next(new ErrorResponse("Coverage profile ID not found", 500));
        }
        let getCountryNameUrl = `${URL}/v1/coverage-profiles/${coverageProfileId}`;
        config = {
            method: "get",
            url: getCountryNameUrl,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        };

        let countryNameResponse = await axios(config);

        const countryFromCoverage = countryNameResponse?.data?.countries?.[0]?.name || "";

        subscriptionList.map((item) => {

            if (item.state !== 'EXPIRED') {

                const dataUsedMb = (1024 * 1024) * item.plan.dataMegaBytes;

                if (dataUsedMb > item.usedAllowance.dataBytes) {

                    totalBal = dataUsedMb + totalBal;
                    dataBal = item.usedAllowance.dataBytes + dataBal;

                    countryName = countryFromCoverage;

                    if (lattestTopData < (item.activationAt === null ? item.createdAt : item.activationAt)) {

                        lattestTopData = item.activationAt === null ? item.createdAt : item.activationAt;
                        networks = countryFromCoverage;
                        validity = item.plan.periodDays;
                        newTopupData = item.plan.dataMegaBytes;
                    }
                }
            }
        });

        const userDataBalance = (totalBal - dataBal) / (1024 * 1024 * 1024);

        return res.status(200).json({
            status: true,
            data: {
                countryName: countryName,
                networks: networks,
                validity: validity + " Days",
                newTopupData: (newTopupData / 1024).toFixed(2) + " GB",
                esim: iccidNo,
                dataBal: userDataBalance.toFixed(2) + " GB"
            },
            message: "Esim details fetched successfully",
            responseCode: '000',
        });

    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: err?.message, data: err?.response?.data });
        console.log(err.response.data)
        return res.status(400).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            data: {},
            responseCode: '001'
        });
    }

});

async function getToken(details, accessKey) {
    try {
        const cacheKey = `tunz-io-${accessKey}`;
        const cachedToken = await getValue(cacheKey);

        if (cachedToken) {
            return cachedToken;
        }
        const response = await axios.post(
            `${details.apiUrl}/reseller/authenticate`,
            {},
            {
                auth: {
                    username: details.optional1,
                    password: details.optional2,
                },
                headers: {
                    Accept: "application/json",
                },
            }
        );

        if (response.status === 200 && response.data.accessToken) {
            const token = response.data.accessToken;
            const expiresIn = response.data.expiresIn; // seconds

            // Store token in cache (subtract 60 sec buffer)
            await setValue(cacheKey, expiresIn - 60, token);

            return token;
        }

        return false;

    } catch (err) {
        console.log(err)
        customLog(null, "error", {
            message: err?.message,
            data: err?.response?.data,
        });
        return false;
    }
}