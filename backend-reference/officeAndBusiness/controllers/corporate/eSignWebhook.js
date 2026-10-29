const asyncHandler = require("../../middlewares/async");
const {
    findOne: findOneServiceOperator
} = require('./../../models/use-cases/serviceOperator')
const ErrorResponse = require('../../utils/error-response');
const { findWebHookService, handlePekoESignUpdate, handleAuthBridgeESignUpdate, handleCollectorAgreementUpdate, handlePekoESignAuditTrailUpdate } = require("../../services/eSign");
const { customLog } = require("../../utils/loggerHelper");
const { sendWPSRegistration } = require("../../utils/serviceBus/wpsRegistration");
const constantTimeEqual = require("../../utils/constantTimeEqual");

const accessKey = "REDACTED"

exports.updateESignStatus = asyncHandler(async (req, res, next) => {
    try {
        const LogTraceId = req?.LogTraceId || new Date().getTime(); // fallback if LogTraceId not provided

        //-------------------------------------------
        // Optional: log webhook call received
        customLog(LogTraceId, "info", { body: req.body, message: "Sign Desk WEBHOOK CALL RECEIVED" }, "VENDOR");
        //-------------------------------------------
        customLog(LogTraceId, 'info', { body: req.body });

        //---------Auth Starts----------------------
        // AuthBridge webhooks are publicly accessible (no api_key required per their docs)
        const firstEntry = Array.isArray(req.body) ? req.body[0] : req.body?.['0'];
        const isAuthBridgeWebhook = firstEntry?.epakId;

        if (!isAuthBridgeWebhook) {
            const apiWebhookKey = req.headers["api_key"];
            const clientIP = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : undefined;

            let { vendor: { optional3: vendorWebHookApiKey, optional4: whitelistedIPs } } = await findOneServiceOperator({ accessKey })
            // F-OAB-17: fail closed when the vendor key is not configured (don't let undefined===undefined pass).
            if (!vendorWebHookApiKey) {
                return next(new ErrorResponse('Webhook service unavailable', 503));
            }
            if (process.env.NODE_ENV === 'production') {
                if (!clientIP || !whitelistedIPs.includes(clientIP)) {
                    return next(new ErrorResponse('Access denied: IP address not whitelisted', 400));
                }
            }
            // F-OAB-17: constant-time compare to avoid a timing side channel.
            if (!constantTimeEqual(vendorWebHookApiKey, apiWebhookKey)) {
                return next(new ErrorResponse('Invalid api key', 400))
            }
        }
        //---------Auth ends----------------------

        console.log("✅✅✅✅WEBHOOK RESPONSE✅✅✅✅✅", req.body);

        // Determine service for webhook
        let { status, message, serviceAccessKey } = await findWebHookService(req)
        if (!status) throw new Error(message)

        let response;
        if (serviceAccessKey === 'signDrive_eSign') {
            response = await handlePekoESignUpdate(req);
        } else if (serviceAccessKey === 'authbridge_esign') {
            response = await handleAuthBridgeESignUpdate(req);
        } else if (serviceAccessKey === 'quick_links') {
            response = await handleCollectorAgreementUpdate(req);
        } else if (serviceAccessKey === 'peko_wps') {
            response = await sendWPSRegistration(req);
        } else {
            return next(new ErrorResponse('Webhook service not recognized', 400));
        }

        // Process response from eSign update
        const { status: updateStatus, message: updateMessage } = response;

        if (!updateStatus) throw new Error(updateMessage);

        return res.status(200).json({
            status: true,
            message: "Success",
            responseCode: '000',
            data: {}
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { error: error?.message || error, message: "ERROR from updateESignStatus" }, "VENDOR");

        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong.',
            responseCode: '001',
            data: {}
        })
    }
})

exports.updateESignAuditTrail = asyncHandler(async (req, res, next) => {
    try {

        //---------Auth Starts----------------------
        const apiWebhookKey = req.headers["api_key"];
        const clientIP = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : undefined;

        let { vendor: { optional3: vendorWebHookApiKey, optional4: whitelistedIPs } } = await findOneServiceOperator({ accessKey })
        // F-OAB-17: fail closed when the vendor key is not configured (don't let undefined===undefined pass).
        if (!vendorWebHookApiKey) {
            return next(new ErrorResponse('Webhook service unavailable', 503));
        }
        if (process.env.NODE_ENV === 'production') {
            if (!clientIP || !whitelistedIPs.includes(clientIP)) {
                return next(new ErrorResponse('Access denied: IP address not whitelisted', 400));
            }
        }
        // F-OAB-17: constant-time compare to avoid a timing side channel.
        if (!constantTimeEqual(vendorWebHookApiKey, apiWebhookKey)) {
            return next(new ErrorResponse('Invalid api key', 400))
        }
        //---------Auth ends----------------------

        let response;
        const serviceAccessKey = req.body?.custom_parameter?.access_key || ''
        if (serviceAccessKey === 'signDesk_eSign') {
            response = await handlePekoESignAuditTrailUpdate(req);
        } else if (serviceAccessKey === 'quick_links') {
            return res.status(200).json({   // no need to save audit trail
                status: true,
                message: "Success",
                responseCode: '000',
                data: {}
            })
        } else if (serviceAccessKey === 'peko_wps') {
            return res.status(200).json({   // no need to save audit trail
                status: true,
                message: "Success",
                responseCode: '000',
                data: {}
            })
        } else {
            return next(new ErrorResponse('Webhook service not recognized', 400));
        }

        const { status: updateStatus, message: updateMessage } = response;
        if (!updateStatus) throw new Error(updateMessage);

        return res.status(200).json({
            status: true,
            message: "Success",
            responseCode: '000',
            data: {}
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong.',
            responseCode: '001',
            data: {}
        })
    }
})
