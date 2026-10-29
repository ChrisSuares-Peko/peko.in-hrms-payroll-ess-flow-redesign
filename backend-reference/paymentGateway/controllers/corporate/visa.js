'use strict';

const axios = require('axios');
const { gatewayModeLabel } = require('../../utils/paymentModeKind');
const FormData = require('form-data');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const serviceOperatorModel = require('../../models/entities/serviceOperator');
const vendorModel = require('../../models/entities/vendor');
const visaOrders = require('../../models/entities/visaOrder');
const { uploadFileToS3, getFileBufferFromS3 } = require('../../utils/s3');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { createWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { customLog } = require('../../utils/loggerHelper');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const operatorsData = require('../../utils/operatorsData.json');
const { getVendorQuote, amountBeforeCommission, MARKUP_MODES, getQuoteScope } = require('../../utils/applyCommissionMarkup');
const sequelizeConfig = require('../../configs/database/index');
const order = require('../../models/entities/order');
const wallet = require('../../models/entities/wallet');
const walletTransaction = require('../../models/entities/transaction');
const { v4: uuidv4 } = require('uuid');
const emailer = require('../../utils/emailer');
const { visaConfirmationTemplate } = require('../../utils/emailTemplates/visa/visaConfirmationTemplate');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { createNotification } = require('../../models/use-cases/notification');

const accessKey = operatorsData['visa']['accessKey'];

// ─── Vendor Helpers (mirrors travel/controllers/corporate/visa.js) ────────────
// Duplicated here (rather than shared) because paymentGateway and travel are
// separate deployable services with independent node_modules — this repo's
// existing convention is per-service copies of shared integration logic (see
// e.g. utils/walletTransaction.js / utils/s3.js, which already exist in both).

// Resolves the visa vendor's API credentials, mirroring travel's checkService.
async function resolveVendorConfig(serviceDetails, useFallback) {
    if (!useFallback && serviceDetails?.vendor?.apiUrl && serviceDetails?.vendor?.optional1) {
        const vendor = serviceDetails.vendor;
        return {
            API_URL: vendor.apiUrl,
            API_KEY: vendor.optional1,
            CLIENT_CODE: vendor.optional2 || 'OVRT-001',
            BRANCH_CODE: vendor.optional3 || 'MHL',
        };
    }

    const soRow = await serviceOperatorModel.findOne({
        where: { accessKey },
        include: [{ model: vendorModel, required: false }],
    });
    const vendor = soRow?.vendor;
    if (vendor?.apiUrl && vendor?.optional1) {
        return {
            API_URL: vendor.apiUrl,
            API_KEY: vendor.optional1,
            CLIENT_CODE: vendor.optional2 || 'OVRT-001',
            BRANCH_CODE: vendor.optional3 || 'MHL',
        };
    }
    return null;
}

// Creates the order at the vendor (VisaOS). Throws ErrorResponse on failure.
async function createVendorOrder(body, vendorConfig, req) {
    const vendorPayload = {
        ...body,
        client_code: vendorConfig.CLIENT_CODE,
        branch_code: vendorConfig.BRANCH_CODE,
        unique_identifier: body.unique_identifier || String(Date.now()),
        source: 'WEB',
        order_type: 'RETAIL',
        amount: String(body.amount),
        customer_billing_country: body.customer_billing_country === 'IN' ? 'India' : body.customer_billing_country,
    };
    customLog(req?.LogTraceId, 'info', { message: 'Visa: creating order with vendor', vendorPayload }, 'VENDOR');

    let response;
    try {
        response = await axios.post(
            `${vendorConfig.API_URL}/api/order/create`,
            vendorPayload,
            { headers: { token: vendorConfig.API_KEY, 'Content-Type': 'application/json' } }
        );
    } catch (axiosError) {
        const vendorMessage = axiosError.response?.data?.message || axiosError.message;
        customLog(req?.LogTraceId, 'error', { message: 'Visa: vendor returned error on order creation', vendorMessage, vendorData: axiosError.response?.data }, 'VENDOR');
        throw new ErrorResponse(vendorMessage || 'Failed to create order', 502);
    }

    if (!response.data?.status) {
        customLog(req?.LogTraceId, 'error', { message: 'Visa: order creation failed at vendor', vendorMessage: response.data?.message }, 'VENDOR');
        throw new ErrorResponse(response.data?.message || 'Failed to create order', 400);
    }
    customLog(req?.LogTraceId, 'info', { message: 'Visa: order created successfully', orderNumber: response.data?.data?.order_number }, 'VENDOR');

    return response.data.data;
}

// Submits one document's bytes to the vendor and stores a permanent copy in S3.
// Returns { vendorResponse, key }. Throws on vendor error.
async function submitVendorDocumentBuffer({ vendorConfig, req, buffer, filename, mimetype, documentCode, applicationId, orderNumber }) {
    const formData = new FormData();
    formData.append('file', buffer, { filename, contentType: mimetype });
    formData.append('document_code', documentCode);
    formData.append('application_id', applicationId);
    formData.append('order_number', orderNumber);

    customLog(req?.LogTraceId, 'info', { message: 'Visa: uploading document to vendor', document_code: documentCode, application_id: applicationId, order_number: orderNumber, fileName: filename }, 'VENDOR');
    const response = await axios.post(
        `${vendorConfig.API_URL}/api/v1/order/updateDocument`,
        formData,
        { headers: { token: vendorConfig.API_KEY, ...formData.getHeaders() } }
    );
    customLog(req?.LogTraceId, 'info', { message: 'Visa: document uploaded to vendor', document_code: documentCode, application_id: applicationId, order_number: orderNumber }, 'VENDOR');

    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const base64 = buffer.toString('base64');
    const s3Key = await uploadFileToS3(base64, `visa-documents/${orderNumber}`, ext);
    const keyPath = s3Key.replace(`${process.env.CLOUD_DOMAIN}/`, '');
    customLog(req?.LogTraceId, 'info', { message: 'Visa: document stored in S3', document_code: documentCode, application_id: applicationId, order_number: orderNumber, s3Key: keyPath }, 'VENDOR');

    return { vendorResponse: response.data, key: keyPath };
}

async function sendVisaConfirmationEmail(req, orderNumber, orderAmount, couponDiscount = 0, invoiceAttachments = []) {
    try {
        const rows = await sequelizeConfig.query(
            `SELECT v.productName, v.destination, v.visaFormat, v.visaCategory, v.amountInINR, v.actualAmountPaid, v.applicants,
                    c.email AS credentialEmail
             FROM visaOrders v
             LEFT JOIN credentials c ON c.id = v.credentialId
             WHERE v.orderNumber = :orderNumber LIMIT 1`,
            { replacements: { orderNumber }, type: sequelizeConfig.QueryTypes.SELECT }
        );
        const visaOrder = rows && rows[0] ? rows[0] : {};
        console.log('[visaEmail] visaOrder:', visaOrder.destination, visaOrder.productName);
        const to = req.user.email || visaOrder.credentialEmail;
        console.log('[visaEmail] to:', to, '| user:', req.user?.name, '| orderNumber:', orderNumber);
        if (!to) { console.log('[visaEmail] no email found, skipping'); return; }
        const templateDetails = await fetchPartnerDetails(req.user.registeredBy);
        const rawApplicants = visaOrder.applicants;
        const applicants = (() => {
            try {
                return Array.isArray(rawApplicants)
                    ? rawApplicants
                    : JSON.parse(rawApplicants || '[]');
            } catch { return []; }
        })();
        const travellers = applicants.map(a => ({
            name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.name || 'Applicant',
        }));
        const baseTotal = parseFloat(visaOrder.actualAmountPaid ?? visaOrder.amountInINR ?? orderAmount);
        const displayTotal = parseFloat((baseTotal - parseFloat(couponDiscount || 0)).toFixed(2));
        const body = visaConfirmationTemplate({
            userName: req.user.name || req.user.username,
            destination: visaOrder.destination || req.body.destination_name,
            visaType: visaOrder.visaFormat || req.body.visa_type,
            processingType: visaOrder.visaCategory || req.body.category,
            productName: visaOrder.productName || req.body.visa_name,
            travellers,
            priceBreakdown: { total: displayTotal },
            orderNumber,
        }, templateDetails);
        console.log('[visaEmail] sending to', to);
        const subject = 'Your Visa Application Has Been Submitted – Peko';
        emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments, undefined, () => {
            console.log('[visaEmail] sent successfully to', to);
        });
    } catch (emailErr) {
        console.error('[visaEmail] error:', emailErr);
        customLog(null, 'error', { message: 'visa pg payment: email send failed', error: emailErr });
    }
}

exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const subCorporateUserId = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
        ? req.user.subCorporateId
        : undefined;

    let {
        orderNumber,
        amount,
        corporateTxnId,
        paymentGatewayResponse,
        pgAmount,
        payCashback,
        couponCode,
        couponTotalDiscount,
        product_id, applicants, travel_date, product_breakup, visa_amount,
        customer_email, customer_first_name, customer_last_name, customer_mobile,
        customer_billing_address_line_1, customer_billing_address_line_2,
        customer_billing_pincode, customer_billing_state, customer_billing_state_tax_code,
        customer_billing_country, customer_billing_city, group_name,
        adult, child, infant, residency, nationality, unique_identifier, partner, base_currency,
    } = req.body;

    if (!amount) return next(new ErrorResponse('amount is required', 400));

    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId });
    const useFallback = Object.prototype.hasOwnProperty.call(serviceDetails, 'error');

    let resolvedServiceOperatorId = useFallback ? null : serviceDetails.id;
    if (useFallback) {
        customLog(req?.LogTraceId, 'warn', { action: 'visa:payment:fetchServiceDetails', message: 'serviceOperators cashback missing, resolving serviceOperatorId directly' });
        const soRow = await serviceOperatorModel.findOne({ where: { accessKey }, attributes: ['id'], raw: true });
        if (soRow) resolvedServiceOperatorId = soRow.id;
    }

    // ── Resolve the order: either it's a retry of a previously-FAILED payment
    // (vendor order + documents already exist), or this is the first attempt —
    // by the time this handler runs, Cashfree has already confirmed the charge
    // succeeded (see cashFreeGateway.js's handlePGCallback), so the vendor order
    // + document submission happen here, now, mirroring travel's
    // /travel/visa/payment/wallet endpoint.
    let orderData = null;
    let applicantsWithDocs = null;
    let vendorAmount = visa_amount !== undefined ? parseFloat(visa_amount) : parseFloat(amount);
    let vendorBreakup = product_breakup;

    if (!orderNumber) {
        if (!product_id || !applicants?.length) {
            return next(new ErrorResponse('product_id and applicants are required', 400));
        }
        const vendorConfig = await resolveVendorConfig(serviceDetails, useFallback);
        if (!vendorConfig) return next(new ErrorResponse('Visa service is not configured', 503));

        // The vendor is sent its own price and breakup, not the marked-up ones the customer paid for. The amount was checked against the search's prices before the order was created; if that note has expired, the price is worked back out.
        const visaQuote = await getVendorQuote(vendorAmount, accessKey, {
            credentialId,
            scope: getQuoteScope(req),
            match: (item) => String(item.product_id) === String(product_id),
        });
        if (visaQuote) {
            vendorAmount = visaQuote.real;
            vendorBreakup = { breakup: visaQuote.item.breakup, age_cost_breakup: visaQuote.item.age_cost_breakup };
        } else if (MARKUP_MODES.has(serviceDetails.commissionMode?.toUpperCase())) {
            vendorAmount = await amountBeforeCommission(serviceDetails, vendorAmount, credentialId);
        }

        try {
            orderData = await createVendorOrder({
                product_id, applicants, travel_date, product_breakup: vendorBreakup,
                customer_email, customer_first_name, customer_last_name, customer_mobile,
                customer_billing_address_line_1, customer_billing_address_line_2,
                customer_billing_pincode, customer_billing_state, customer_billing_state_tax_code,
                customer_billing_country, customer_billing_city, group_name,
                adult, child, infant, residency, nationality, unique_identifier, partner, base_currency,
                amount: vendorAmount,
            }, vendorConfig, req);
            orderNumber = orderData.order_number;

            applicantsWithDocs = await Promise.all(orderData.applications.map(async (vendorApp, idx) => {
                const stagedDocs = applicants[idx]?.documents || [];
                const documents = {};
                for (const doc of stagedDocs) {
                    if (!doc?.s3Key || !doc?.document_code) continue;
                    const buffer = await getFileBufferFromS3(doc.s3Key);
                    const ext = (doc.s3Key.split('.').pop() || 'jpg').toLowerCase();
                    const result = await submitVendorDocumentBuffer({
                        vendorConfig,
                        req,
                        buffer,
                        filename: `${doc.document_code}.${ext}`,
                        mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        documentCode: doc.document_code,
                        applicationId: vendorApp.id,
                        orderNumber,
                    });
                    documents[doc.document_code] = { key: result.key, uploadedAt: new Date().toISOString() };
                }
                return { ...vendorApp, documents };
            }));
        } catch (err) {
            // The Cashfree charge has already succeeded by the time this handler
            // runs — if the vendor order/documents fail here, persist whatever we
            // have as FAILED (rather than losing the charged-but-unfulfilled
            // booking entirely) so support can reconcile it.
            customLog(req?.LogTraceId, 'error', { action: 'visa:payment:vendorOrderCreation', error: err?.message });
            if (orderNumber) {
                await visaOrders.create({
                    credentialId,
                    serviceOperatorId: resolvedServiceOperatorId,
                    orderNumber,
                    productId: product_id,
                    amountInINR: vendorAmount,
                    baseCurrency: base_currency || 'INR',
                    adult: adult || 1,
                    child: child || 0,
                    infant: infant || 0,
                    travelDate: travel_date,
                    applicants: applicantsWithDocs || [],
                    orderResponse: JSON.stringify(orderData),
                    product_breakup: vendorBreakup || null,
                    paymentStatus: 'FAILED',
                    applicationStatus: 'NEW',
                    transactionDate: new Date(),
                    statusLog: { application_created: new Date().toISOString() },
                });
            }
            return next(err instanceof ErrorResponse ? err : new ErrorResponse(err.message || 'Failed to create visa order', 502));
        }
    }

    customLog(req?.LogTraceId, 'info', { action: 'visa:payment', orderNumber, amount, corporateTxnId });

    const baseAmount     = parseFloat(amount);
    const actualTotal    = pgAmount ? parseFloat(pgAmount) : baseAmount;
    const { surcharge: actualSurcharge } = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        baseAmount,
        credentialId
    );
    const orderAmount    = baseAmount;
    const txnId = corporateTxnId ? String(corporateTxnId) : String(new Date().valueOf());

    // Persist the order as PAID: either insert it fresh (first attempt, order
    // created just above) or update the existing row (retry of a prior FAILED
    // attempt) — and persist any booking metadata sent with the payment.
    const { destination_name, visa_type, visa_name, category, addOns } = req.body;

    if (orderData) {
        await visaOrders.create({
            credentialId,
            serviceOperatorId: resolvedServiceOperatorId,
            orderNumber,
            corporateTxnId: txnId,
            productId: product_id,
            productName: visa_name || null,
            destination: destination_name || null,
            visaFormat: visa_type || null,
            visaType: visa_type || null,
            visaCategory: category || null,
            amountInINR: vendorAmount,
            baseCurrency: base_currency || 'INR',
            adult: adult || 1,
            child: child || 0,
            infant: infant || 0,
            travelDate: travel_date,
            applicants: applicantsWithDocs,
            orderResponse: JSON.stringify(orderData),
            product_breakup: vendorBreakup || null,
            paymentStatus: 'PAID',
            actualAmountPaid: actualTotal,
            addOns: addOns ? (Array.isArray(addOns) ? addOns : [addOns]) : null,
            applicationStatus: 'NEW',
            transactionDate: new Date(),
            statusLog: { application_created: new Date().toISOString(), application_submitted: new Date().toISOString() },
        });
    } else {
        const setClauses = ['paymentStatus = :status', 'corporateTxnId = :txnId', 'actualAmountPaid = :actualAmountPaid'];
        const updateReplacements = { status: 'PAID', txnId, orderNumber, actualAmountPaid: actualTotal };
        if (destination_name) { setClauses.push('destination = :destination');       updateReplacements.destination = destination_name; }
        if (visa_type)        { setClauses.push('visaFormat = :visaFormat');         updateReplacements.visaFormat = visa_type; }
        if (visa_type)        { setClauses.push('visa_type = :visaType');            updateReplacements.visaType = visa_type; }
        if (visa_name)        { setClauses.push('productName = :productName');       updateReplacements.productName = visa_name; }
        if (category)         { setClauses.push('visaCategory = :visaCategory');     updateReplacements.visaCategory = category; }
        if (addOns)           { setClauses.push('add_ons = :addOns');               updateReplacements.addOns = JSON.stringify(Array.isArray(addOns) ? addOns : [addOns]); }
        // Record application_submitted timestamp without overwriting other step keys
        setClauses.push("status_log = JSON_SET(COALESCE(status_log, '{}'), '$.application_submitted', :appSubmitted)");
        updateReplacements.appSubmitted = new Date().toISOString();

        await sequelizeConfig.query(
            `UPDATE visaOrders SET ${setClauses.join(', ')} WHERE orderNumber = :orderNumber`,
            { replacements: updateReplacements, type: sequelizeConfig.QueryTypes.UPDATE }
        );
    }

    if (useFallback) {
        const ordersRecord = await order.create({
            corporateTxnId: txnId,
            providerId: orderNumber,
            operatorId: uuidv4(),
            accountNo: orderNumber,
            amountInINR: actualTotal,
            baseAmount: orderAmount,
            baseCurrency: 'INR',
            exchangeRate: '1',
            transactionDate: new Date(),
            status: 'SUCCESS',
            message: 'Visa payment via Payment Gateway',
            paymentMode: gatewayModeLabel(paymentGatewayResponse),
            surcharge: actualSurcharge,
            credentialId,
            serviceOperatorId: resolvedServiceOperatorId,
            subCorporateUserId: subCorporateUserId || null,
            paymentModeResponse: JSON.stringify(paymentGatewayResponse || {}),
        });

        const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'], raw: true });
        await walletTransaction.create({
            corporateTxnId: txnId,
            transactionDate: new Date(),
            transactionType: 'SYSTEM',
            debitAmount: 0,
            creditAmount: 0,
            totalCashback: 0,
            corporateCashback: 0,
            systemCashback: 0,
            transactionCategory: 'Travel',
            balance: walletDetails ? walletDetails.balance : 0,
            remarks: 'SUCCESS',
            status: 'SUCCESS',
            providerId: orderNumber,
            orderId: ordersRecord.id,
            serviceOperatorId: resolvedServiceOperatorId,
            credentialId,
        });

        createNotification({
            notificationTitle: 'Visa Application - Payment Successful',
            notificationBrief: `Payment of ₹ ${actualTotal} for Visa Application was successful. Transaction ID: ${txnId}.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });
        const fallbackPgResponse = Array.isArray(paymentGatewayResponse) ? paymentGatewayResponse[0] : paymentGatewayResponse;
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: orderAmount,
            surcharge: actualSurcharge,
            corporateTxnId: txnId,
            orderId: ordersRecord.id,
            paymentType: 'Visa Application',
            description: visa_name || 'Visa Application',
            credentialId,
            pgAmount: paymentGatewayResponse ? pgAmount : null,
            paymentMethod: fallbackPgResponse?.payment_method,
            traceId: req?.LogTraceId,
        });
        sendVisaConfirmationEmail(req, orderNumber, actualTotal, 0, invoiceAttachments);
        return res.status(200).json({
            status: true,
            message: 'Visa payment processed successfully',
            responseCode: '000',
            data: { orderNumber, corporateTxnId: txnId },
        });
    }

    let txnResult;
    let reportData = null;
    if (!useFallback) {
        const {
            commissionType,
            cashbackType,
            providerCommission,
            cashback: corporateCashback,
        } = serviceDetails;
        const serviceOperatorId = resolvedServiceOperatorId;

        const journalPartnerDetails = await fetchPartnerDetails(req.user.registeredBy)
        const pgResponse = Array.isArray(paymentGatewayResponse) ? paymentGatewayResponse[0] : paymentGatewayResponse;
        reportData = await computeJournalData({
            serviceDetails,
            pgAmount: paymentGatewayResponse ? Number(pgAmount || 0) : 0,
            amount: Number(orderAmount),
            paymentMethod: pgResponse?.payment_method || {},
            partnerDetails: journalPartnerDetails,
            paymentGatewayName: 'Cashfree',
            couponTotalDiscount,
            corporateState: req.user.state || '',
            credentialId,
        });

        const commonParams = {
            providerId: orderNumber,
            corporateTxnId: txnId,
            credentialId,
            serviceOperatorId,
            accountNo: orderNumber,
            corporateCashback: corporateCashback ?? 0,
            orderAmount,
            commissionType: commissionType ?? 'PERCENTAGE',
            cashbackType: cashbackType ?? 'PERCENTAGE',
            providerCommission: providerCommission ?? 0,
            transactionCategory: 'Travel',
            surcharge: actualSurcharge,
            subCorporateUserId,
            corporateUserId,
            accessKey,
            payCashback: payCashback ?? false,
            couponCode: couponCode || undefined,
            partnerId: req.user.registeredBy,
            reportData,
        };

        txnResult = paymentGatewayResponse
            ? await createPGTransaction({
                ...commonParams,
                pgAmount: pgAmount ? parseFloat(pgAmount) : orderAmount,
                pgResponse: paymentGatewayResponse,
                partnerId: req.user.registeredBy,
            })
            : await createWalletTransaction({ ...commonParams, amount: orderAmount });

        if (txnResult && !txnResult.error) {
            await updateWalletTransaction({
                corporateTxnId: txnId,
                status: 'SUCCESS',
                message: 'Visa payment successful',
                providerId: orderNumber,
            });

            publishJournalEvent(
                {
                    transactionRef: txnId,
                    type: 'payment',
                    contextSnapshot: {
                        credentialId,
                        vendor: serviceDetails?.vendor || null,
                        registeredBy: req.user.registeredBy || null,
                    },
                    reportData,
                },
                req?.LogTraceId
            );
        } else {
            customLog(req?.LogTraceId, 'warn', { action: 'visa:payment:transaction', error: txnResult?.error, message: 'Transaction recording failed but visa order marked PAID' });
        }
    }

    const couponDiscount = parseFloat(txnResult?.couponDiscount ?? 0);
    const displayAmount = parseFloat((actualTotal - couponDiscount).toFixed(2));

    createNotification({
        notificationTitle: 'Visa Application - Payment Successful',
        notificationBrief: `Payment of ₹ ${displayAmount} for Visa Application was successful. Transaction ID: ${txnId}.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });
    const mainPgResponse = Array.isArray(paymentGatewayResponse) ? paymentGatewayResponse[0] : paymentGatewayResponse;
    const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: orderAmount,
        surcharge: actualSurcharge,
        couponDiscount,
        corporateTxnId: txnId,
        orderId: txnResult?.orderId,
        paymentType: 'Visa Application',
        description: visa_name || 'Visa Application',
        credentialId,
        pgAmount: paymentGatewayResponse ? pgAmount : null,
        paymentMethod: mainPgResponse?.payment_method,
        traceId: req?.LogTraceId,
    });
    sendVisaConfirmationEmail(req, orderNumber, actualTotal, couponDiscount, invoiceAttachments);

    return res.status(200).json({
        status: true,
        message: 'Visa payment processed successfully',
        responseCode: '000',
        data: { orderNumber, corporateTxnId: txnId },
    });
});
