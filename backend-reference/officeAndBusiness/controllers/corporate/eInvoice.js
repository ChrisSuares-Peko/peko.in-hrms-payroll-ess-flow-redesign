/* eslint-disable no-unused-vars */
const fs = require('fs');
const puppeteer = require('puppeteer');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { getEInvoiceAuth, generateIRNService, cancelIRNService, getGstinDetailsService, calculateInvoiceTotals, generateEwaybillService } = require('../../services/eInvoice');
const { createEInvoice, findAllEInvoicesAndCount, getEInvoiceById, updateEInvoice, getEInvoiceDetailsById, getNextEInvoiceNumber, getEInvoiceDashboard, getEInvoiceUsage } = require('../../models/use-cases/eInvoices');
const { createEWaybill } = require('../../models/use-cases/eWaybill');
const { updateInvoice } = require('../../models/use-cases/invoicingV2');
const { createInvoiceCustomerV2, checkGstinExist } = require('../../models/use-cases/invoiceCustomerV2');
const { customLog } = require('../../utils/loggerHelper');
const { getValue, deleteValue } = require('../../utils/cacheDataMethods');
const { buildEInvoiceHtml } = require('../../utils/eInvoicePdfTemplate');

exports.authEInvoice = asyncHandler(async (req, res, next) => {
    try {
        const { gstin, username, password } = req.body;
        const corporateUserId = req.user.corporateId;

        if (!gstin) return next(new ErrorResponse('gstin is required', 400));
        if (!username) return next(new ErrorResponse('username is required', 400));
        if (!password) return next(new ErrorResponse('password is required', 400));

        const authData = await getEInvoiceAuth(gstin, username, password, corporateUserId);

        if (!authData.tokenExpiry) {
            await Promise.all([
                deleteValue(`einvoice_auth_${authData.authToken}`),
                deleteValue(`einvoice_session_${corporateUserId}`),
            ]);
            return next(new ErrorResponse('Token expiry not provided by vendor', 400));
        }
        if (new Date(authData.tokenExpiry).getTime() <= Date.now()) {
            await Promise.all([
                deleteValue(`einvoice_auth_${authData.authToken}`),
                deleteValue(`einvoice_session_${corporateUserId}`),
            ]);
            return next(new ErrorResponse('Token received from vendor is already expired, please try again', 400));
        }

        return res.status(200).json({
            status: true,
            data: {
                authToken: authData.authToken,
                tokenExpiry: authData.tokenExpiry,
            },
            message: 'eInvoice authentication successful',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.logoutEInvoice = asyncHandler(async (req, res, next) => {
    try {
        const { authToken } = req.eInvoiceAuth;
        const corporateUserId = req.user.corporateId;

        await Promise.all([
            deleteValue(`einvoice_auth_${authToken}`),
            deleteValue(`einvoice_session_${corporateUserId}`),
        ]);

        return res.status(200).json({
            status: true,
            data: {},
            message: 'eInvoice session logged out successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.getSessionStatus = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const sessionKey = `einvoice_session_${corporateUserId}`;
        const cached = await getValue(sessionKey);

        if (!cached) {
            return res.status(200).json({
                status: false,
                data: {},
                message: 'No active eInvoice session',
                responseCode: '000',
            });
        }

        const session = JSON.parse(cached);

        const cacheKey = `einvoice_auth_${session.authToken}`;
        const authCached = await getValue(cacheKey);

        if (!authCached) {
            return res.status(200).json({
                status: false,
                data: {},
                message: 'No active eInvoice session',
                responseCode: '000',
            });
        }


        if (session.tokenExpiry && new Date(session.tokenExpiry).getTime() <= Date.now()) {
            await Promise.all([
                deleteValue(`einvoice_auth_${session.authToken}`),
                deleteValue(`einvoice_session_${corporateUserId}`),
            ]);
            return res.status(200).json({
                status: false,
                data: {},
                message: 'eInvoice session has expired',
                responseCode: '000',
            });
        }

        return res.status(200).json({
            status: true,
            data: {
                authToken: session.authToken,
                tokenExpiry: session.tokenExpiry,
                gstin: session.gstin,
                username: session.username,
            },
            message: 'eInvoice session is active',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.generateIRN = asyncHandler(async (req, res, next) => {
    try {
        const { authToken, sek, gstin, username } = req.eInvoiceAuth;
        const corporateUserId = req.user.corporateId;

        const usage = await getEInvoiceUsage({ corporateUserId });
        if (!usage || usage.used >= usage.maxLimit) {
            customLog(req?.LogTraceId, 'error', {
                message: 'generateIRN: e-invoice quota exhausted',
                corporateUserId,
                used: usage?.used ?? 0,
                maxLimit: usage?.maxLimit ?? 0,
                freeBaseLimit: usage?.freeBaseLimit ?? 0,
                addonLimit: usage?.addonLimit ?? 0,
            });
            return next(
                new ErrorResponse(
                    !usage || usage.maxLimit === 0
                        ? "Your plan doesn't include e-invoices. Please purchase an add-on to continue."
                        : `You've used all ${usage.maxLimit} e-invoices in your current cycle. Please purchase an add-on to continue.`,
                    403,
                ),
            );
        }

        const { invoiceId, customerId } = req.body;
        const invoiceData = calculateInvoiceTotals(req.body);
        const {
            supplyType, docType, prefix, docNo, docDate, reverseCharge, igstOnIntraState,
            sellerDetails, buyerDetails, placeOfSupply,
            lineItems, totalTaxableValue, totalAmount,
        } = invoiceData;

        const result = await generateIRNService(gstin, username, authToken, sek, invoiceData);

        const eInvoiceData = {
            irn: result.Irn,
            ackNo: result.AckNo,
            ackDt: result.AckDt,
            signedInvoice: result.SignedInvoice,
            signedQRCode: result.SignedQRCode,
            supplyType,
            docType,
            prefix: prefix || null,
            docNo,
            docDate,
            reverseCharge,
            igstOnIntraState,
            sellerGstin: sellerDetails.gstin,
            sellerDetails,
            buyerGstin: buyerDetails.gstin,
            buyerDetails,
            placeOfSupply,
            lineItems,
            totalTaxableValue,
            totalAmount,
            corporateUserId,
        };

        if (customerId) buyerDetails.customerId = customerId;

        const [record] = await Promise.all([
            createEInvoice(eInvoiceData),
            !customerId && buyerDetails.gstin
                ? checkGstinExist(buyerDetails.gstin, corporateUserId).then((existing) => {
                    if (!existing) {
                        return createInvoiceCustomerV2({
                            name: buyerDetails.legalName,
                            gstin: buyerDetails.gstin,
                            phoneNumber: buyerDetails.phoneNumber,
                            primaryAddress: buyerDetails.addr1,
                            primaryCity: buyerDetails.location,
                            primaryState: buyerDetails.stateCode,
                            primaryPincode: String(buyerDetails.pin || ''),
                            corporateUserId,
                        });
                    }
                })
                : Promise.resolve(),
        ]);

        if (invoiceId) await updateInvoice({ id: invoiceId, corporateUserId }, { eInvoiceId: record.id });

        return res.status(200).json({
            status: true,
            data: {
                id: record.id,
                irn: result.Irn,
                ackNo: result.AckNo,
                ackDt: result.AckDt,
                signedInvoice: result.SignedInvoice,
                signedQRCode: result.SignedQRCode,
            },
            message: 'IRN generated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

const IRN_CANCEL_REASON_MAP = { 'Duplicate': '1', 'Data Entry Mistake': '2' };

exports.cancelIRN = asyncHandler(async (req, res, next) => {
    try {
        const { authToken, sek, gstin, username } = req.eInvoiceAuth;
        const { id } = req.params;
        const { cancelReason, cancelRemark } = req.body;

        const record = await getEInvoiceById(id, req.user.corporateId);
        if (!record) return next(new ErrorResponse('E-invoice not found', 404));
        if (record.status === 'CANCELLED') return next(new ErrorResponse('eInvoice is already cancelled', 400));

        const cancelRsnCode = IRN_CANCEL_REASON_MAP[cancelReason];
        await cancelIRNService(gstin, username, authToken, sek, record.irn, cancelRsnCode, cancelRemark);

        await Promise.all([
            updateEInvoice(id, {
                status: 'CANCELLED',
                cancelledDate: new Date().toISOString(),
                cancelReason,
                cancelRemark: cancelRemark || null,
            }),
            updateInvoice({ eInvoiceId: id }, { eInvoiceId: null }),
        ]);

        return res.status(200).json({
            status: true,
            data: {},
            message: 'IRN cancelled successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.getGstinDetails = asyncHandler(async (req, res, next) => {
    try {
        const { authToken, sek, gstin, username } = req.eInvoiceAuth;
        const { gstin: searchGstin } = req.params;

        if (!searchGstin) return next(new ErrorResponse('gstin is required', 400));

        const data = await getGstinDetailsService(gstin, username, authToken, sek, searchGstin);

        return res.status(200).json({
            status: true,
            data,
            message: 'GSTIN details fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.listEInvoices = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { from, to, searchText, page, itemsPerPage, status, sortField, hasEwaybill, supplyType } = req.query;
        const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';

        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
        const limit = itemsPerPage || null;
        const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : undefined;

        const params = {
            from,
            to,
            limit,
            offset,
            searchText,
            sort,
            sortField: sortField || 'id',
            corporateUserId,
            status: status ? status.split(',').map(s => s.trim().toUpperCase()) : null,
            supplyType: supplyType ? supplyType.split(',').map(s => s.trim().toUpperCase()) : null,
            hasEwaybill,
        };

        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const result = await findAllEInvoicesAndCount(params);

        return res.status(200).json({
            status: true,
            data: {
                eInvoices: result.rows,
                recordsTotal: result.count,
                activeCount: result.activeCount,
                cancelledCount: result.cancelledCount,
            },
            message: 'eInvoices fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.getEInvoiceDetails = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        const record = await getEInvoiceDetailsById(id);
        if (!record) return next(new ErrorResponse('E-invoice not found', 404));

        return res.status(200).json({
            status: true,
            data: record,
            message: 'eInvoice details fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.getEInvoiceDashboard = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = await getEInvoiceDashboard(corporateUserId);
        return res.status(200).json({
            status: true,
            data,
            message: 'e-Invoice dashboard fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.getEInvoiceUsage = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = await getEInvoiceUsage({ corporateUserId });
        return res.status(200).json({
            status: true,
            data,
            message: 'e-Invoice usage fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'getEInvoiceUsage failed',
            corporateUserId: req?.user?.corporateId,
            error: error?.message,
            stack: error?.stack,
        });
        return next(
            new ErrorResponse(
                "We couldn't load your e-invoice usage right now. Please refresh in a moment, or contact support if the issue persists.",
                500,
            ),
        );
    }
});

exports.getNextEInvoiceNo = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const nextNumber = await getNextEInvoiceNumber(corporateUserId);
        return res.status(200).json({
            status: true,
            data: { nextNumber },
            message: 'Next e-invoice number fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.downloadEInvoicePDF = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        const record = await getEInvoiceDetailsById(id);
        if (!record) return next(new ErrorResponse('E-invoice not found', 404));
        if (!record.signedInvoice) return next(new ErrorResponse('Signed invoice not available', 400));

        const payloadStr = Buffer.from(record.signedInvoice.split('.')[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        const invoiceData = JSON.parse(payload.data);

        const ewaybill = record.eWaybill?.ewbNo ? record.eWaybill : null;
        const html = await buildEInvoiceHtml(invoiceData, record.ackNo, record.ackDt, record.irn, record.signedQRCode, ewaybill, record.status, record.cancelledDate);

        const outputFile = `eInvoice-${record.id}-${Date.now()}.pdf`;
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputFile, format: 'A4', preferCSSPageSize: true });
        await browser.close();
        const pdfBuffer = fs.readFileSync(outputFile);
        fs.unlinkSync(outputFile);

        return res.status(200).json({
            status: true,
            data: { pdfBuffer },
            message: 'e-Invoice PDF generated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});
