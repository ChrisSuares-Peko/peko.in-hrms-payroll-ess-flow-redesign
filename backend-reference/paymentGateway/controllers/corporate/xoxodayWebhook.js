const asyncHandler = require("../../middlewares/async");
const { isGatewayPaid, isSplitWithWallet } = require("../../utils/paymentModeKind");
const fs = require("fs");
const { findOne: findOneServiceOperator } = require("../../models/use-cases/serviceOperator");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { xoxodayGetOrderDetails, multiplePdfGeneration, normalizeXoxodayVoucher } = require("./giftCard");
const { getOneTransaction } = require("../../models/use-cases/transaction");
const { findUserDetails } = require("../../utils/jwtToken");
const emailTemplates = require("../../utils/emailTemplates");
const emailer = require("../../utils/emailer");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const operatorsData = require("../../utils/operatorsData.json");

const accessKey = operatorsData["xoxoday"]["accessKey"];

exports.handleXoxodayWebhook = asyncHandler(async (req, res, next) => {
    try {
        const LogTraceId = req?.LogTraceId || new Date().getTime();

        customLog(LogTraceId, "info", { body: req.body, message: "Xoxoday WEBHOOK CALL RECEIVED" }, "VENDOR");

        //---------Auth Starts----------------------
        const apiWebhookKey = req.headers["x-api-key"];
        // const clientIP = req.headers["x-forwarded-for"]
        //     ? req.headers["x-forwarded-for"].split(",")[0].trim()
        //     : undefined;

        // optional5 stores the webhook API key configured in Xoxoday Dashboard → Settings → API → Configure Webhook
        const { vendor: { optional5: vendorWebHookApiKey } } = await findOneServiceOperator({ accessKey });

        // if (process.env.NODE_ENV === "production") {
        //     if (!clientIP || clientIP !== XOXODAY_WEBHOOK_IP) {
        //         customLog(LogTraceId, "warn", { message: "Xoxoday webhook blocked — IP not whitelisted", clientIP }, "VENDOR");
        //         return next(new ErrorResponse("Access denied: IP address not whitelisted", 400));
        //     }
        // }

        if (vendorWebHookApiKey !== apiWebhookKey) {
            customLog(LogTraceId, "error", { message: "Xoxoday webhook blocked — invalid x-api-key" }, "VENDOR");
            return next(new ErrorResponse("Invalid api key", 400));
        }
        //---------Auth Ends----------------------

        const { id: callbackId, data, createdAt } = req.body;
        const { orderId, poNumber, orderDate, deliveryStatus } = data || {};

        if (!poNumber || !deliveryStatus) {
            return next(new ErrorResponse("Invalid webhook payload: missing poNumber or deliveryStatus", 400));
        }

        // poNumber format: PEKO-{corporateTxnId}
        const corporateTxnId = poNumber.replace(/^PEKO-/, "");

        customLog(LogTraceId, "info", {
            message: "Xoxoday webhook payload parsed",
            callbackId, orderId, poNumber, corporateTxnId, deliveryStatus, orderDate, createdAt,
        }, "VENDOR");

        const transaction = await getOneTransaction({ transactionId: corporateTxnId });
        if (!transaction) {
            customLog(LogTraceId, "info", { message: "[Xoxoday] Transaction not found for webhook", corporateTxnId }, "VENDOR");
            return res.status(200).json({ status: true, message: "Transaction not found", responseCode: "000", data: {} });
        }

        customLog(LogTraceId, "info", {
            message: "[Xoxoday] Transaction found",
            data:transaction
        }, "VENDOR");

        // Parse stored orderResponse early — used for idempotency check and delivered flow.
        // The orderResponse already contains giftCardDetails, receiverEmail, etc. saved during payment.
        let storedOrderData = {};
        try {
            storedOrderData = JSON.parse(transaction.order?.orderResponse || "{}");
        } catch (parseErr) {
            customLog(LogTraceId, "error", { message: "[Xoxoday] Failed to parse orderResponse", error: parseErr?.message }, "VENDOR");
        }
       

        customLog(LogTraceId, "info", {
            message: "[Xoxoday] Stored order data parsed",
            hasGiftCardDetails: !!storedOrderData.giftCardDetails,
            receiverEmail: storedOrderData.receiverEmail,
            orderType: storedOrderData.orderType,
            accesskey: storedOrderData.accesskey,
            deliveryStatus: storedOrderData?.deliveryStatus,
            alreadyHasXoxodayOrderId: !!storedOrderData.xoxodayOrderId,
        }, "VENDOR");

        // Idempotency: xoxodayOrderId is written to orderResponse only when this webhook processes
        // the transaction. If already present → webhook was already handled, skip.
        // We do NOT use transaction.status for this check because when placeOrder returns an orderId
        // but no vouchers (delayed-delivery products), the payment function already calls
        // updateWalletTransaction({ status: "SUCCESS" }) — so the transaction is SUCCESS even though
        // the user has not received their vouchers yet. We still need to process the delivered webhook.
        const alreadyWebhookProcessed = !!storedOrderData.xoxodayOrderId;
        if (alreadyWebhookProcessed) {
            customLog(LogTraceId, "info", {
                message: "[Xoxoday] Webhook already processed for this transaction, skipping",
                corporateTxnId,
                existingXoxodayOrderId: storedOrderData.xoxodayOrderId,
            }, "VENDOR");
            return res.status(200).json({ status: true, message: "Already processed", responseCode: "000", data: {} });
        }

        // If the transaction is already FAILURE or REFUNDED, the wallet was already credited back
        // to the user during the payment flow (placeOrder failed → refundWalletTransaction called).
        // Processing a delivered webhook in this state would give the user both a refund AND vouchers.
        if (["FAILURE", "REFUNDED"].includes(transaction.status)) {
            customLog(LogTraceId, "info", {
                message: "[Xoxoday] Webhook skipped — transaction already failed/refunded, wallet was already returned to user",
                corporateTxnId,
                transactionStatus: transaction.status,
                deliveryStatus,
            }, "VENDOR");
            return res.status(200).json({ status: true, message: "Success", responseCode: "000", data: {} });
        }

        const user = await findUserDetails(transaction.credentialId);
        const paymentMode = transaction.order?.paymentMode || "WALLET";

        customLog(LogTraceId, "info", {
            message: "[Xoxoday] User details fetched",
            credentialId: transaction.credentialId,
            username: user?.username,
            email: user?.email,
            registeredBy: user?.registeredBy,
            paymentMode,
        }, "VENDOR");

        if (deliveryStatus === "delivered") {
            if (storedOrderData.deliveryStatus === "delivered") {
                customLog(LogTraceId, "info", {
                    message: "[Xoxoday] Webhook skipped — transaction already marked as delivered during payment flow",
                    corporateTxnId,
                }, "VENDOR");
                return res.status(200).json({ status: true, message: "Already processed", responseCode: "000", data: {} });
            }

            const serviceOperator = await findOneServiceOperator({ accessKey });
            const orderDetails = await xoxodayGetOrderDetails(serviceOperator.vendor, accessKey, poNumber);

            customLog(LogTraceId, "info", {
                message: "[Xoxoday] GetOrderDetails response for delivered webhook",
                poNumber,
                orderId,
               orderDetails:orderDetails
            }, "VENDOR");

            if (!orderDetails) {
                customLog(LogTraceId, "error", {
                    message: "[Xoxoday] GetOrderDetails returned null for delivered webhook — returning error so Xoxoday retries",
                    poNumber,
                    orderId,
                }, "VENDOR");
                return res.status(400).json({ status: false, message: "Failed to fetch order details", responseCode: "001", data: {} });
            }

            const {
                giftCardDetails,
                receiverEmail,
                receiverName,
                senderName,
                message: cardMessage,
                employee,
                orderType,
            } = storedOrderData;

            customLog(LogTraceId, "info", {
                message: "[Xoxoday] storedOrderData destructured",
                giftCardDetails: giftCardDetails ? { id: giftCardDetails?.id, product_name: giftCardDetails?.product_name, brand_name: giftCardDetails?.brand_name } : null,
                receiverEmail,
                receiverName,
                senderName,
                orderType,
                employeeCount: Array.isArray(employee) ? employee.length : null,
                cardMessage,
            }, "VENDOR");

            const rawVouchers = orderDetails?.vouchers || orderDetails?.voucherDetails || [];
            const VoucherDetails = rawVouchers.map(normalizeXoxodayVoucher);

            customLog(LogTraceId, "info", {
                message: "[Xoxoday] VoucherDetails after normalisation",
                voucherCount: VoucherDetails.length,
                VoucherDetails,
                rawOrderDetails: orderDetails,
            }, "VENDOR");

            if (VoucherDetails.length===0) {
                customLog(LogTraceId, "info", { message: "[Xoxoday] Delivered webhook has no vouchers, skipping email", poNumber, orderId }, "VENDOR");
                return res.status(200).json({ status: true, message: "Success", responseCode: "000", data: {} });
            }

            await updateWalletTransaction({
                corporateTxnId,
                status: "SUCCESS",
                providerId: String(orderId),
                message: "Voucher delivered",
                orderResponse: JSON.stringify({ ...storedOrderData, xoxodayOrderId: orderId, orderDetails }),
            });

            customLog(LogTraceId, "info", { message: "[Xoxoday] Order marked SUCCESS via webhook", corporateTxnId, orderId }, "VENDOR");
          

            const amountPayable = parseFloat(transaction.order?.amountInINR || 0).toFixed(2);
            const senderEmail = user?.email;
            const templateDetails = await fetchPartnerDetails(user.registeredBy);
              customLog(LogTraceId, "info", { message: "[Xoxoday] amount payable", amountPayable }, );
            const sendVoucherEmail = async (toEmail, recipientName, vouchers) => {
                const pdfResponse = await multiplePdfGeneration({ cardDetails: giftCardDetails, VoucherDetails: vouchers });
                const body = emailTemplates.generateGiftCardPaymentSuccessEmail(
                    recipientName,
                    corporateTxnId,
                    amountPayable,
                    "N/A",
                    "Vouchers",
                    "Gift/Cards",
                    cardMessage,
                    senderName
                );
                emailer.emailWithMultipleAttachment(toEmail, "Gift Card", body, pdfResponse, null, async (emailErr) => {
                    if (Array.isArray(pdfResponse)) {
                        for (const pdf of pdfResponse) {
                            if (pdf.path) { try { fs.unlinkSync(pdf.path); } catch (cleanupErr) { customLog(LogTraceId, "error", { message: "[Xoxoday] Failed to delete temp PDF", path: pdf.path, error: cleanupErr.message }, "VENDOR"); } }
                        }
                    }
                    if (emailErr) customLog(LogTraceId, "error", { message: "[Xoxoday] Receiver email error", error: emailErr?.message, code: emailErr?.code, response: emailErr?.response }, "VENDOR");
                    else customLog(LogTraceId, "info", { message: "[Xoxoday] Receiver email sent to " + toEmail }, "VENDOR");
                });
            };

              customLog(LogTraceId, "info", { message: "[Xoxoday] orderType log", orderType }, );


            // Send voucher email(s) — same branching as payment success
            if (orderType === "buyForEmployees" && Array.isArray(employee)) {
                customLog(LogTraceId, "info", { message: "[Xoxoday] Sending per-employee voucher emails", employeeCount: employee.length }, "VENDOR");
                let voucherIndex = 0;
                for (const emp of employee) {
                    if (!emp.receiverEmail) continue;
                    const empVouchers = VoucherDetails.slice(voucherIndex, voucherIndex + 1);
                    voucherIndex++;
                    if (!empVouchers.length) continue;
                    await sendVoucherEmail(emp.receiverEmail, emp.receiverFirstName, empVouchers);
                }
            } else if (receiverEmail) {
                customLog(LogTraceId, "info", { message: "[Xoxoday] Sending voucher email to receiver", receiverEmail }, "VENDOR");
                await sendVoucherEmail(receiverEmail, receiverName, VoucherDetails);
            } else {
                customLog(LogTraceId, "info", { message: "[Xoxoday] No receiver email found, skipping receiver email", corporateTxnId }, "VENDOR");
            }

            // Send confirmation email to sender
            if (senderEmail) {
                const body2 = emailTemplates.generateGiftCardPaymentSuccessEmailToCompany(
                    user?.name,
                    corporateTxnId,
                    amountPayable,
                    "N/A",
                    VoucherDetails.length,
                    giftCardDetails?.images,
                    "Vouchers",
                    "Gift/Cards",
                    giftCardDetails,
                    templateDetails
                );
                emailer.email({ to: senderEmail, subject: "Gift card order Successful", body: body2 }, function () {
                    customLog(LogTraceId, "info", { message: "[Xoxoday] Sender confirmation email sent to " + senderEmail }, "VENDOR");
                });
            } else {
                customLog(LogTraceId, "info", { message: "[Xoxoday] No sender email found, skipping sender email", corporateTxnId }, "VENDOR");
            }

        } else if (deliveryStatus === "canceled") {
            customLog(LogTraceId, "info", { message: "[Xoxoday] Processing canceled webhook — initiating refund", corporateTxnId, orderId, paymentMode }, "VENDOR");

            const refundDetails = {
                corporateTxnId,
                status: "FAILURE",
                message: "Order canceled by Xoxoday",
                orderResponse: JSON.stringify({ ...storedOrderData, xoxodayOrderId: orderId, poNumber }),
            };

            if (isGatewayPaid(paymentMode)) {
                customLog(LogTraceId, "info", { message: "[Xoxoday] Attempting PG refund before wallet refund", corporateTxnId, paymentMode }, "VENDOR");
                const refundStatus = await cancelPGTransaction(corporateTxnId);
                customLog(LogTraceId, "info", { message: "[Xoxoday] PG refund result", corporateTxnId, refundStatus }, "VENDOR");
                if (refundStatus?.status) {
                    await refundWalletTransaction(refundDetails);
                } else {
                    customLog(LogTraceId, "error", { message: "[Xoxoday] PG refund failed", corporateTxnId, refundStatus }, "VENDOR");
                    if (isSplitWithWallet(paymentMode)) {
                        await refundWalletTransaction(refundDetails);
                    }
                }
            } else {
                await refundWalletTransaction(refundDetails);
            }

            customLog(LogTraceId, "info", { message: "[Xoxoday] Order marked FAILURE and refunded via webhook", corporateTxnId, orderId, paymentMode }, "VENDOR");

        } else {
            customLog(LogTraceId, "info", { message: "[Xoxoday] Unknown deliveryStatus received", deliveryStatus, poNumber }, "VENDOR");
        }

        return res.status(200).json({
            status: true,
            message: "Success",
            responseCode: "000",
            data: {},
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { error: error?.message || String(error), message: "ERROR from handleXoxodayWebhook" }, "VENDOR");

        return res.status(400).json({
            status: false,
            message: error?.message || "Something went wrong.",
            responseCode: "001",
            data: {},
        });
    }
});
