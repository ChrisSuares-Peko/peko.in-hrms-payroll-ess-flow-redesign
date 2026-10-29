/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */

const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const {
    fetchServiceDetails,
    calculateSurcharge,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const {
    createWalletTransaction,
    refundWalletTransaction,
    updateWalletTransaction,
} = require("../../utils/walletTransaction");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const operatorsData = require("../../utils/operatorsData.json");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { createNotification } = require("../../models/use-cases/notification");
const emailer = require("../../utils/emailer");
const { commonFailedTemplate } = require("../../utils/emailTemplates/common");
const { generatePaymentSuccessEmailLogisticsV3 } = require("../../utils/emailTemplate/logistics");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const moment = require("moment");
const shipmentOrders = require("../../models/entities/shipmentOrders");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { getVendorAmount, amountBeforeCommission, MARKUP_MODES } = require("../../utils/applyCommissionMarkup");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

const accessKey = operatorsData["logistics"]["accessKey"]; // shipment_services
const transactionCategory = operatorsData["logistics"]["category"];  // Shipment Services
const NODE_ENV = process.env.NODE_ENV;
const STAGING_URL = process.env.FRONTEND_STAGING_URL;

// ─── Shiprocket Auth ──────────────────────────────────────────────────────────
// vendor.optional1  = Shiprocket account password
// vendor.optional2  = Shiprocket account email
// vendor.optional4  = Pickup location name (defaults to "Primary")
// Token cached for 24 h (valid for 10 days on Shiprocket side)
async function getShiprocketToken(API_URL, email, password) {
    const redisKey = `${accessKey}-refresh-token`;
    const cached = await getValue(redisKey);
    if (cached) return cached;

    try {
        const response = await axios({
            method: "POST",
            url: `${API_URL}/v1/external/auth/login`,
            headers: { "Content-Type": "application/json" },
            data: { email, password },
        });
        const token = response?.data?.token;
        if (!token) return false;
        await setValue(redisKey, 24 * 60 * 60, token);
        return token;
    } catch (error) {
        customLog(null, "error", { message: "Error fetching Shiprocket token", data: error?.response?.data || error });
        return false;
    }
}

// ─── Shiprocket Postcode Lookup ───────────────────────────────────────────────
// Fallback: resolve city + state from postcode when FE doesn't supply them.
// Tries Shiprocket first, then falls back to India Postal Pincode API.
async function getCityStateFromPostcode(API_URL, token, postcode) {
    // 1️⃣ Try Shiprocket open postcode endpoint
    try {
        const resp = await axios({
            method: "GET",
            url: `${API_URL}/v1/external/open/postcode/details?postcode=${postcode}`,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
        });
        customLog(null, "info", { message: "Shiprocket postcode lookup response", postcode, response: resp?.data });
        // Shiprocket may wrap in .data or return flat
         const d = resp?.data?.postcode_details || resp?.data?.data || resp?.data; 
        const city = d?.city || d?.district || "";
        const state = d?.state || "";
        if (city && state) {
            return { city, state };
        }
    } catch (e) {
        customLog(null, "error", { message: "Shiprocket postcode lookup failed", postcode, err: e?.response?.data || e?.message });
    }

    // 2️⃣ Fallback: India Postal Pincode API (free, no auth)
    try {
        const resp = await axios({
            method: "GET",
            url: `https://api.postalpincode.in/pincode/${postcode}`,
            timeout: 8000,
        });
        customLog(null, "info", { message: "India postal raw response", postcode, response: resp?.data?.[0]?.Status });
        const postOffices = resp?.data?.[0]?.PostOffice;
        if (Array.isArray(postOffices) && postOffices.length > 0) {
            const city = postOffices[0].District || postOffices[0].Block || postOffices[0].Name || "";
            const state = postOffices[0].State || "";
            return { city, state };
        }
    } catch (e) {
        customLog(null, "error", { message: "India postal pincode lookup failed", postcode, err: e?.message });
    }

    customLog(null, "error", { message: "Could not resolve city/state for postcode", postcode });
    return { city: "", state: "" };
}

// ─── Payment ──────────────────────────────────────────────────────────────────
exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const emailId = req.user.email;
    const name = req.user.name;
    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId,
    });
    if (serviceDetails.hasOwnProperty("error")) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

    const API_URL = serviceDetails.vendor.apiUrl;
    const password = serviceDetails.vendor.optional1;
    const vendorEmail = serviceDetails.vendor.optional2;

    const commissionType = serviceDetails.commissionType;
    const cashbackType = serviceDetails.cashbackType;
    const providerCommission = serviceDetails.providerCommission;
    const corporateCashback = serviceDetails.cashback;
    const serviceOperatorId = serviceDetails.id;

    const amount = parseFloat(req.body.amount);
    const surcharge = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId);
    const totalAmount = (amount + parseFloat(surcharge)).toFixed(2);

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });

    // The amount was checked against the delivery prices before the order was created; if that note has expired, work the delivery price back out.
    const vendorAmount =
        Math.round(
            ((await getVendorAmount(amount, accessKey, { credentialId, scope: getQuoteScope(req) })) ??
                (MARKUP_MODES.has(serviceDetails.commissionMode?.toUpperCase())
                    ? await amountBeforeCommission(serviceDetails, amount, credentialId)
                    : amount)) * 100
        ) / 100;

    const subCorporateEmail = req.body.subCorporateEmail;
    let subCorporateUserId;
    if (req.body.role === "CORPORATE_SUB_USER") {
        subCorporateUserId = req.body.subCorporateId;
    }

    const corporateTxnId = req.body.corporateTxnId || new Date().valueOf();

    // Shiprocket rejects pickup addresses under 10 chars or without a house/flat/road no.
    // Block wallet payments up front; PG payments are already captured, so they still go through the refund path.
    const pickupAddressLine = String(req.body.originAddress?.addressLine || "").trim();
    if (
        !req.body.isReturn &&
        !req.body.hasOwnProperty("paymentGatewayResponse") &&
        (pickupAddressLine.length < 10 || !/\d/.test(pickupAddressLine))
    ) {
        return next(new ErrorResponse("Pickup address line 1 must be at least 10 characters and include a house / flat / road number. Please update the address and try again.", 400));
    }

    // ── Wallet / PG debit ────────────────────────────────────────────────────
    let transactionResponse = {};
    const commonParams = {
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        transactionCategory,
        commissionType,
        cashbackType,
        providerCommission,
        surcharge,
        subCorporateUserId,
        reportData
    };

    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            orderAmount: amount,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
        });
    } else {
        transactionResponse = await createWalletTransaction({
            ...commonParams,
            amount,
        });
    }

    if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
        customLog(req?.LogTraceId, "error", { message: "logisticsV3 payment transactionResponse error", transactionResponse });
        return next(new ErrorResponse("Something went wrong", 400));
    }

    publishJournalEvent(
        {
            transactionRef: corporateTxnId,
            type: "payment",
            contextSnapshot: {
                credentialId,
                vendor: serviceDetails?.vendor || null,
                registeredBy: req?.user?.registeredBy || null,
            },
            reportData,
        },
        req?.LogTraceId
    );

    // ── Shiprocket: get token ────────────────────────────────────────────────
    const token = await getShiprocketToken(API_URL, vendorEmail, password);

    const pickupLocationName = String(corporateTxnId);

    let shiprocketOrderId = null;
    let awbCode = null;
    let response;

    const deliveryPartnerData = req.body.deliveryPartnerData;
    const courierCompanyId = deliveryPartnerData?.deliveryCompanyId;

    try {
        if (!token) throw new Error("Shiprocket token fetch failed");

        if (req.body.isReturn) {
            // ── Return shipment ──────────────────────────────────────────────
            const returnPickup = req.body.originalReceiverAddress || {};
            const returnPayload = {
                order_id: String(req.body.deliveredTxnId),
                name: returnPickup.name || "",
                email: returnPickup.email || "",
                phone: String(returnPickup.mobile || returnPickup.phoneNumber || ""),
                address: returnPickup.addressLine || returnPickup.addressLine1 || "",
                city: returnPickup.city || "",
                state: returnPickup.state || "",
                country: returnPickup.countryCode || "IN",
                pincode: String(returnPickup.postCode || returnPickup.zipCode || ""),
                channel_id: "",
                sub_total: vendorAmount,
                courier_id: courierCompanyId,
                comment: `Return for order ${req.body.deliveredTxnId}`,
            };
            customLog(req?.LogTraceId, "info", { message: "Shiprocket /orders/create/return Request", request: returnPayload}, "VENDOR");
            response = await axios({
                method: "POST",
                url: `${API_URL}/v1/external/orders/create/return`,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                data: returnPayload,
            });
            customLog(req?.LogTraceId, "info", { message: "Shiprocket /orders/create/return Response", response: response.data });
            shiprocketOrderId = response?.data?.order_id || null;

        } else {
            // ── New shipment ─────────────────────────────────────────────────
            const { originAddress, destinationAddress, items, shipmentDetails } = req.body;
            const weight = shipmentDetails?.weight;

            const {
                name: senderName, mobile: senderMobile, addressLine: senderAddressLine,
                addressLine2: senderAddressLine2,
                postCode: senderPostCode, city: senderCity, countryName: senderCountry,
                state: senderState, email: senderEmail,
            } = originAddress;

            const {
                name: receiverName, mobile: receiverMobile, addressLine: receiverAddressLine,
                addressLine2: receiverAddressLine2,
                postCode: receiverPostCode, city: receiverCity, countryName: receiverCountry,
                countryCode: receiverCountryCode,
                state: receiverState, email: receiverEmail,
            } = destinationAddress;

            const isInternationalShipment = req.body.isInternational === true;

            // Fallback: resolve city/state from postcode when FE doesn't supply them
            let resolvedSenderCity = senderCity || "";
            let resolvedSenderState = senderState || "";
            if ((!resolvedSenderCity || !resolvedSenderState) && senderPostCode) {
                const fallback = await getCityStateFromPostcode(API_URL, token, senderPostCode);
                if (!resolvedSenderCity) resolvedSenderCity = fallback.city;
                if (!resolvedSenderState) resolvedSenderState = fallback.state;
            }

            let resolvedReceiverCity = receiverCity || "";
            let resolvedReceiverState = receiverState || "";
            if ((!resolvedReceiverCity || !resolvedReceiverState) && receiverPostCode) {
                if (isInternationalShipment && receiverCountryCode) {
                    try {
                        const intlResp = await axios({
                            method: "GET",
                            url: `${API_URL}/v1/countries/location/${receiverCountryCode}/${receiverPostCode}`,
                            headers: { Authorization: `Bearer ${token}` },
                            timeout: 8000,
                        });
                        const locations = intlResp?.data?.data || [];
                        if (!resolvedReceiverCity) resolvedReceiverCity = locations.find(l => l.type === 2)?.name || "";
                        if (!resolvedReceiverState) resolvedReceiverState = locations.find(l => l.type === 1)?.name || "";
                    } catch (e) {
                        customLog(req?.LogTraceId, "info", {
                            message: "International postcode lookup failed during shipment creation",
                            postcode: receiverPostCode, countryCode: receiverCountryCode, err: e?.message,
                        });
                    }
                } else {
                    const fallback = await getCityStateFromPostcode(API_URL, token, receiverPostCode);
                    if (!resolvedReceiverCity) resolvedReceiverCity = fallback.city;
                    if (!resolvedReceiverState) resolvedReceiverState = fallback.state;
                }
            }

            const orderItems = (items || []).map((item, idx) => {
                const orderItem = {
                    name: item.name || item.description || `Item ${idx + 1}`,
                    sku: item.sku || `SKU-${corporateTxnId}-${idx}`,
                    units: item.quantity || item.units || 1,
                    selling_price: item.price || (vendorAmount / (items.length || 1)),
                };
                const hsn = item.hsn || item.hsn_code;
                if (hsn) orderItem.hsn = hsn;
                return orderItem;
            });

            if (orderItems.length === 0) {
                orderItems.push({ name: "Shipment", sku: `SKU-${corporateTxnId}`, units: 1, selling_price: vendorAmount });
            }

            const createOrderPayload = {
                order_id: String(corporateTxnId),
                order_date: moment().format("YYYY-MM-DD HH:mm"),
                pickup_location: pickupLocationName,
                billing_customer_name: senderName || "",
                billing_last_name: "",
                billing_address: senderAddressLine || "",
                billing_address_2: senderAddressLine2 || "",
                billing_city: resolvedSenderCity,
                billing_pincode: String(senderPostCode || ""),
                billing_state: resolvedSenderState,
                billing_country: senderCountry || "",
                billing_email: senderEmail || emailId || "",
                billing_phone: String(senderMobile || "").replace(/\D/g, ""),
                shipping_is_billing: 0,
                shipping_customer_name: receiverName || "",
                shipping_last_name: "",
                shipping_address: receiverAddressLine || "",
                shipping_address_2: receiverAddressLine2 || "",
                shipping_email: receiverEmail || "",
                shipping_city: resolvedReceiverCity,
                shipping_pincode: String(receiverPostCode || ""),
                shipping_state: resolvedReceiverState,
                shipping_country: receiverCountry || "",
                shipping_phone: String(receiverMobile || "").replace(/\D/g, ""),
                order_items: orderItems,
                payment_method: "Prepaid",
                sub_total: vendorAmount,
                length: shipmentDetails?.length || 0,
                breadth: shipmentDetails?.width || 0,
                height: shipmentDetails?.height || 0,
                weight: parseFloat(weight) || 0,
                vendor_details: {
                    email: senderEmail || emailId || "",
                    phone: String(senderMobile || "").replace(/\D/g, ""),
                    name: senderName || "",
                    address: senderAddressLine || "",
                    ...(senderAddressLine2 && senderAddressLine2.length >= 10 && { address_2: senderAddressLine2 }),
                    city: resolvedSenderCity,
                    state: resolvedSenderState,
                    country: senderCountry || "India",
                    pin_code: String(senderPostCode || ""),
                    pickup_location: pickupLocationName,
                },
            };

            // Save PENDING record in shipmentOrders before calling vendor
            try {
                await shipmentOrders.create({
                    amount,
                    weight: parseFloat(weight) || 0,
                    senderAddress: originAddress,
                    receiverAddress: destinationAddress,
                    items,
                    shipmentDetails: { deliveryPartnerData, boxDimensions: shipmentDetails },
                    status: "PENDING",
                    corporateTxnId,
                    credentialId,
                    consentAgreed: req.body.consentAgreed === true,
                    consentAt: req.body.consentAgreed === true ? new Date() : null,
                    businessPanUrl: req.body.businessPanUrl || null,
                });
            } catch (dbErr) {
                customLog(req?.LogTraceId, "error", { message: "shipmentOrders create failed", data: dbErr });
            }

            if (isInternationalShipment) {
                const internationalPayload = {
                    ...createOrderPayload,
                    courier_id: courierCompanyId,
                    purpose: "commercial",
                    currency: "INR",
                    invoice_currency: "INR",
                    invoice_value: vendorAmount,
                    order_items: orderItems,
                };
                customLog(req?.LogTraceId, "info", { message: "Shiprocket /international/shipments/create/forward-shipment Request", request: internationalPayload }, "VENDOR");
                response = await axios({
                    method: "POST",
                    url: `${API_URL}/v1/external/international/shipments/create/forward-shipment`,
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    data: internationalPayload,
                });
                customLog(req?.LogTraceId, "info", { message: "Shiprocket /international/shipments/create/forward-shipment Response", response: response.data });
                shiprocketOrderId = response?.data?.payload?.order_id || response?.data?.order_id || response?.data?.response?.data?.order_id || null;
                awbCode = response?.data?.payload?.awb_code || response?.data?.awb_code || response?.data?.response?.data?.awb_code || null;
            } else {
                const forwardPayload = { ...createOrderPayload, courier_id: courierCompanyId };
                customLog(req?.LogTraceId, "info", { message: "Shiprocket /shipments/create/forward-shipment Request", request: forwardPayload, orderitem: forwardPayload?.order_items }, "VENDOR");
                response = await axios({
                    method: "POST",
                    url: `${API_URL}/v1/external/shipments/create/forward-shipment`,
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    data: forwardPayload,
                });
                customLog(req?.LogTraceId, "info", { message: "Shiprocket /shipments/create/forward-shipment Response", response: response.data });
                shiprocketOrderId = response?.data?.payload?.order_id || response?.data?.order_id || null;
                awbCode = response?.data?.payload?.awb_code || response?.data?.awb_code || null;
            }
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "Shiprocket vendor API failed", data: error?.response?.data || error });
    }

    // ── Failure path ─────────────────────────────────────────────────────────
    const vendorSuccess = response?.data?.payload?.order_id || response?.data?.payload?.shipment_id
        || response?.data?.order_id || response?.data?.shipment_id
        || response?.data?.response?.data?.order_id || response?.data?.response?.data?.shipment_id;
    if (!vendorSuccess) {
        const updateDetails = {
            corporateTxnId,
            status: "FAILURE",
            providerId: "Not Available",
            message: "shipment not created",
            registeredById: req.user.registeredBy ?? null,
            couponId: transactionResponse.couponId,
        };

        if (req.body.hasOwnProperty("paymentGatewayResponse")) {
            await cancelPGTransaction(corporateTxnId);
            await refundWalletTransaction(updateDetails);
        } else {
            await refundWalletTransaction(updateDetails);
        }
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type: "refund",
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );

        const notificationData = {
            notificationTitle: "Shipment - Payment unsuccessful",
            notificationBrief: `Payment of ₹${totalAmount} for Shipment was unsuccessful. Transaction ID: ${corporateTxnId}.`,
            notificationTo: [req.user.username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
        };
        createNotification(notificationData);

        const failureSubject = "Payment failed";
        // A real partner has exactly one baseUrl (no staging/production split for
        // partner domains), so it always wins when present. Peko's own
        // staging-vs-production split only applies to the no-partner fallback.
        const baseUrl = partnerDetails?.baseUrl || (NODE_ENV === "staging" ? STAGING_URL : "https://in.peko.one");
        const resolvedFailed = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.LOGISTICS_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
            variables: {
                name,
                serviceName: "Logistics",
                paymentDate: new Date().toLocaleString(),
                baseUrl,
                branding: partnerDetails?.branding || 'Peko',
                ...v2LayoutVariables(partnerDetails),
            },
            fallback: () => commonFailedTemplate(name, "Logistics", `${baseUrl}/logistics`, partnerDetails),
            fallbackSubject: failureSubject,
            logTraceId: req?.LogTraceId,
        });
        const body = resolvedFailed.html;
        emailer.email({ to: emailId, subject: resolvedFailed.subject, body }, () => {
            customLog(req?.LogTraceId, "info", { message: "Failure email sent to " + emailId });
        });

        return res.status(400).json({
            status: false,
            message: "Payment Failed",
            responseCode: "003",
            data: {},
        });
    }

    // ── Success path ─────────────────────────────────────────────────────────
    const updateDetails = {
        corporateTxnId: String(corporateTxnId),
        providerId: shiprocketOrderId ? String(shiprocketOrderId) : "N/A",
        status: "SUCCESS",
        orderResponse: JSON.stringify(response.data),
        message: "Payment Successful",
        couponId: transactionResponse.couponId,
    };
    await updateWalletTransaction(updateDetails);

    // Update shipmentOrders with vendor order ID, AWB and initial tracking entry
    const initialTrackingDetails = [
        {
            note: "",
            status: "Order confirmed",
            dcStatus: "",
            timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
            description: "Your order has been confirmed and is now being processed.",
            printAWBURL: "",
            isMainStatus: true,
            vendorStatus: "Pending",
            reverseShipment: false,
            deliveryOptionName: deliveryPartnerData?.courierName || "",
        },
    ];
    try {
        await shipmentOrders.update(
            {
                status: "SUCCESS",
                vendorOrderId: shiprocketOrderId ? String(shiprocketOrderId) : null,
                trackingNo: awbCode || null,
                trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null,
                trackingDetails: initialTrackingDetails,
            },
            { where: { corporateTxnId: String(corporateTxnId) } }
        );
    } catch (dbErr) {
        customLog(req?.LogTraceId, "error", { message: "shipmentOrders update failed", data: dbErr });
    }

    const notificationData = {
        notificationTitle: "Shipment - Payment successful",
        notificationBrief: `Payment of ₹${totalAmount} for Shipment was successful. Transaction ID: ${corporateTxnId}.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
    };
    createNotification(notificationData);

    const emailRecipients = [emailId, subCorporateEmail].filter(Boolean);
    const sender = req.body.originAddress;
    const receiver = req.body.destinationAddress;
    const subject = "Shipment booked successfully";
    const resolvedSuccess = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.LOGISTICS_PAYMENT_SUCCESS_V3,
        service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
        variables: {
            name,
            corporateTxnId,
            from: req.body.originAddress.city,
            to: req.body.destinationAddress.city,
            senderName: sender?.name,
            senderAddressLine: sender?.addressLine,
            senderCity: sender?.city,
            senderCountryName: sender?.countryName,
            senderPostCode: sender?.postCode,
            senderMobile: sender?.mobile,
            receiverName: receiver?.name,
            receiverAddressLine: receiver?.addressLine,
            receiverCity: receiver?.city,
            receiverCountryName: receiver?.countryName,
            receiverPostCode: receiver?.postCode,
            receiverMobile: receiver?.mobile,
            totalAmount,
            branding: partnerDetails?.branding || 'Peko',
            baseUrl: partnerDetails?.baseUrl,
            ...v2LayoutVariables(partnerDetails),
        },
        fallback: () => generatePaymentSuccessEmailLogisticsV3({
            name,
            corporateTxnId,
            from: req.body.originAddress.city,
            to: req.body.destinationAddress.city,
            sender,
            receiver,
            totalAmount,
            templateDetails: partnerDetails,
        }),
        fallbackSubject: subject,
        logTraceId: req?.LogTraceId,
    });
    const successEmailBody = resolvedSuccess.html;
    if (emailRecipients.length > 0) {
        const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");
        const planDetails = [{
            name: deliveryPartnerData?.courierName ? `Shipment : ${deliveryPartnerData.courierName}` : "Shipment",
            amount,
            quantity: 1,
        }];
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount || 0,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: "Shipment",
            description: "Shiprocket shipment",
            credentialId,
            pgAmount: isPgFunded ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(
            emailRecipients,
            resolvedSuccess.subject,
            successEmailBody,
            invoiceAttachments,
            undefined,
            (emailErr) => {
                if (emailErr) {
                    customLog(req?.LogTraceId, "error", { message: "Error sending success email", emailErr });
                } else {
                    customLog(req?.LogTraceId, "info", { message: "Success email sent to " + emailRecipients });
                }
            }
        );
    }

    return res.status(200).json({
        status: true,
        message: "Order created successfully",
        responseCode: "000",
        data: {
            AWBNumber: awbCode || "N/A",
            orderId: shiprocketOrderId,
            corporateTxnId,
        },
    });
});
