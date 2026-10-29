const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require('../../utils/loggerHelper');
const { findOne: findOneServiceOperator } = require('./../../models/use-cases/serviceOperator')
const operatorsData = require("../../utils/operatorsData.json");
const { findCorporateUserByEmail } = require("../../models/use-cases/corporateUser");
const { updateStatusFromWebhook } = require("../../models/use-cases/invoiceSupplier");
const constantTimeEqual = require("../../utils/constantTimeEqual");
const accessKey = operatorsData["paymentlink"]["accessKey"];

exports.handleKYBWebhook = asyncHandler(async (req, res, next) => {
    try {
        //---------Auth Starts----------------------
        const apiWebhookKey = req.headers["api_key"];
        if(!apiWebhookKey)  return next(new ErrorResponse('Invalid api key', 400))

        const clientIP = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : undefined;

        customLog(req?.LogTraceId, "info", { KYBdata: req.body })
        customLog(req?.LogTraceId, "info", { clientIP: clientIP, reqIP: req.ip, remoteAddress: req.connection.remoteAddress })

        let { vendor: { optional4: vendorWebHookApiKey, optional5: whitelistedIPs } } = await findOneServiceOperator({ accessKey: accessKey })
        // F-OAB-17: fail closed when the vendor key is not configured.
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

        const {primary_email,event} = req.body

        if (!primary_email || !event) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const corporateDetails = await findCorporateUserByEmail(primary_email)
        if (!corporateDetails) {
            return res.status(404).json({ error: "Corporate user not found" });
        }
        const statusType = 'UNDER REVIEW'
        const corporateUserId = corporateDetails.id
        const supplierDetails = await updateStatusFromWebhook(corporateUserId,statusType)

        if (!supplierDetails) {
            return res.status(500).json({ error: "Failed to update status" });
        }
        return res.status(200).json({ message: "Status updated successfully" });
        
         
    } catch (e) {
        console.log(e)
        return res.status(500).send('failed')
    }
})