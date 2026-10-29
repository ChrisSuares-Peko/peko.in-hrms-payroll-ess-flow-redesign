const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails');
const serviceOperatorModel = require('../../models/entities/serviceOperator');
const vendorModel = require('../../models/entities/vendor');
const { uploadFileToS3, getPresignedUrl, getFileBufferFromS3 } = require('../../utils/s3');
const { createWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { applyServiceCommission, getVendorQuote, getQuoteScope } = require('../../utils/applyCommissionMarkup');
const operatorsData = require('../../utils/operatorsData.json');
const {
    createVisaOrder: saveVisaOrder,
    updateVisaOrderPaymentStatus,
    updateVisaOrderDocuments,
    updateVisaDocumentStatus,
    findVisaOrders,
    findAllVisaOrders,
    findVisaOrderByOrderNumber,
} = require('../../models/use-cases/visa');
const emailer = require('../../utils/emailer');
const { visaConfirmationTemplate } = require('../../utils/emailTemplates/visa/visaConfirmationTemplate');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');
const { createNotification } = require('../../models/use-cases/notification');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { Op } = require('sequelize');
const addressDetailsModel = require('../../models/entities/addressDetails');
const { getCurrencyExchangeRates } = require('../../models/use-cases/setting');
const { convertVisaProductToInr, needsInrConversion } = require('../../utils/visaCurrency');

const indiaSheet = require('../../utils/indiaSheet.json');
const countryFlags = require('../../public/countryFlags.json');

// Comprehensively-sanctioned countries/regions — never offered as a Nationality or Country of
// Residence choice, and rejected here even if a request bypasses the frontend dropdown. Mirrored
// on Peko-AE (travel/controllers/corporate/visa.js) and the frontend (useVisaApi.ts) for the
// dropdown UX. Crimea/Donetsk/Luhansk aren't in the vendor's country list today, but are excluded
// here too in case they're ever added.
const SANCTIONED_COUNTRIES = new Set([
    'Cuba',
    'Iran',
    'North Korea',
    'Syria',
    'Crimea',
    'Donetsk',
    'Luhansk',
]);

// Vendor ids for the sanctioned countries above (confirmed against VisaOS's live /api/countries
// response — same global id space Peko-AE already validated: Cuba=55, Iran=105, North Korea=118,
// Syria=216). Used so searchVisaOptions can reject a sanctioned residency/nationality by code,
// since that's all the vendor search request carries.
const SANCTIONED_CODES = new Set(['55', '105', '118', '216']);

// Precomputed ONCE at startup: no reachable-URL problem to solve (no gateway auth, no ingress
// restriction, no scheme/host guessing) if there's no follow-up image request to route anywhere —
// the SVG travels inline, inside the same JSON response this data already comes back in.
const countryFlagsWithInlineImages = countryFlags.map((c) => {
    const svgPath = path.join(__dirname, '../../public', c.image);
    const base64 = fs.readFileSync(svgPath, 'base64');
    return { ...c, image: `data:image/svg+xml;base64,${base64}` };
});

const accessKey = operatorsData.visa.accessKey;

// ─── Service Check (with fallback flag) ───────────────────────────────────────

async function checkService(req) {
    const serviceDetails = await fetchServiceDetails({
        credentialId: req.user.id,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId: req.user.corporateId,
    });

    if (serviceDetails.error) {
        // Cashback record missing for this package, but vendor credentials may still exist.
        // Fetch them directly from serviceOperator + vendor so real API calls can proceed.
        const soRow = await serviceOperatorModel.findOne({
            where: { accessKey },
            include: [{ model: vendorModel, required: false }],
        });
        const vendor = soRow?.vendor;
        if (vendor?.apiUrl && vendor?.optional1) {
            return {
                useFallback: false,
                serviceOperatorId: soRow.id,
                API_URL: vendor.apiUrl,
                API_KEY: vendor.optional1,
                CLIENT_CODE: vendor.optional2 || 'OVRT-001',
                BRANCH_CODE: vendor.optional3 || 'MHL',
                surcharge: 0,
                commissionType: 'PERCENTAGE',
                providerCommission: 0,
                corporateCashback: 0,
                cashbackType: 'PERCENTAGE',
            };
        }
        return {
            useFallback: true,
            serviceOperatorId: soRow ? soRow.id : null,
        };
    }

    const vendor = serviceDetails.vendor;
    return {
        useFallback: false,
        serviceDetails,
        API_URL: vendor.apiUrl,
        API_KEY: vendor.optional1,
        CLIENT_CODE: vendor.optional2 || 'OVRT-001',
        BRANCH_CODE: vendor.optional3 || 'MHL',
        serviceOperatorId: serviceDetails.id,
        commissionType: serviceDetails.commissionType,
        providerCommission: serviceDetails.providerCommission,
        surcharge: serviceDetails.surcharge ?? 0,
        corporateCashback: serviceDetails.corporateCashback ?? 0,
        cashbackType: serviceDetails.cashbackType,
    };
}

// ─── Countries ────────────────────────────────────────────────────────────────

exports.getCountries = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);
    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching countries from vendor', apiUrl: service.API_URL }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/countries`, {
        headers: { token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: countries fetched successfully', response: response }, 'VENDOR');

    return res.status(200).json({ status: true, data: response.data });
});

// ─── Destinations ─────────────────────────────────────────────────────────────

exports.getDestinations = asyncHandler(async (req, res) => {
    return res.status(200).json({ status: true, data: indiaSheet });
});

// ─── Country Flags ────────────────────────────────────────────────────────────
// Full name + ISO code + emoji + flag image (inline base64 data URI) for every country, keyed by name
// so the frontend can match it against whatever destination/nationality/residency name string it
// already has on hand. Mounted on BOTH the authenticated /corporate/:id/travel/visa tree (this route)
// and the unauthenticated /vendor/:vendorId/travel/flags tree (see routes/API/v1/webhooks/countryFlags.js)
// — the latter is what the frontend actually calls, since a plain <img> load can't carry session/JWT
// headers and this service's own host isn't reachable directly on ingress-restricted deployments.
exports.getCountryFlags = asyncHandler(async (req, res) => {
    return res.status(200).json({ status: true, data: countryFlagsWithInlineImages });
});

// ─── Nationality & Residency ──────────────────────────────────────────────────

exports.getNationalityAndResidency = asyncHandler(async (req, res, next) => {
    // indiaSheet.json's nationality/residency columns are both fixed to "India" — that's a trait
    // of this static pricing sheet (every row prices an Indian national/resident's visa), not a
    // list of valid nationalities/countries of residence. searchVisaOptions doesn't consult this
    // sheet at all — it forwards residency/nationality codes straight to the live vendor API — so
    // the full vendor country reference is fetched live from VisaOS's own /api/countries (same
    // call as getCountries above, same id space confirmed to match Peko-AE's uaeSheet.json)
    // instead of being limited to the single value this sheet happens to use.
    const service = await checkService(req);
    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching countries from vendor for nationality/residency', apiUrl: service.API_URL }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/countries`, {
        headers: { token: service.API_KEY },
    });

    const raw = response.data?.data ?? response.data;
    const list = Array.isArray(raw) ? raw : [];
    const countries = list
        .filter(c => c.id !== undefined && c.id !== null && c.name && !SANCTIONED_COUNTRIES.has(c.name))
        .map(c => ({ name: c.name, code: c.id }));

    return res.status(200).json({
        status: true,
        data: {
            nationality: countries,
            residency: countries,
        },
    });
});

// ─── Address Details ──────────────────────────────────────────────────────────

exports.findAllAddress = asyncHandler(async (req, res) => {
    const credentialId = req.user.id;
    const { q: searchText, isReceiver } = req.query;

    const escapeLike = (str = '') => str.replace(/[\\%_]/g, '\\$&');
    const safeSearch = escapeLike(searchText.toLowerCase());

    const whereClause = { credentialId, isReceiver };

    if (safeSearch) {
        whereClause[Op.or] = [
            { nickname: { [Op.like]: `%${safeSearch}%` } },
            { name: { [Op.like]: `%${safeSearch}%` } },
        ];
    }

    const result = await addressDetailsModel.findAll({ where: whereClause, raw: true, nest: true });

    return res.status(200).json({
        status: true,
        data: { addressDetails: result || [] },
        message: 'All addresses retrieved successfully.',
        responseCode: '000',
    });
});

// ─── Search Visa Options ──────────────────────────────────────────────────────

exports.searchVisaOptions = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);
    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    const {
        residency, nationality, destination, category,
        adult = 1, child = 0, infant = 0, billing_state_code = '27',
    } = req.query;

    if (!residency || !nationality || !destination) {
        return next(new ErrorResponse('residency, nationality and destination are required', 400));
    }

    if (SANCTIONED_CODES.has(String(residency)) || SANCTIONED_CODES.has(String(nationality))) {
        return next(new ErrorResponse('This country is not supported for visa services', 403));
    }

    customLog(req?.LogTraceId, 'info', { message: 'Visa: searching visa options from vendor', residency, nationality, destination, category }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/v5/client/product/cost`, {
        params: {
            residency, nationality, destination, category: category || 'Tourist',
            adult, child, infant,
            branch_code: service.BRANCH_CODE,
            client_code: service.CLIENT_CODE,
            billing_state_code,
        },
        headers: { Token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: search visa options response received', vendorResponse: response }, 'VENDOR');

    const raw = response.data?.data || response.data;
    const data = Array.isArray(raw)
        ? raw.filter(item => {
            if (item.visa_type?.toLowerCase() !== 'evisa') return false;
            const components = item.breakup?.components ?? [];
            const hasEmbassyPayment = components.some(
                c => c.remark && c.remark.trim() !== '' && c.remark !== 'null'
            );
            return !hasEmbassyPayment;
        })
        : raw;

    if (Array.isArray(data)) {
        await applyServiceCommission(data, 'breakup.total_value', accessKey, { credentialId: req.user.id, scope: getQuoteScope(req) });
    }
    if (!needsInrConversion(data)) return res.status(200).json({ status: true, data });

    // Some products are quoted in a foreign currency — convert to INR (see utils/visaCurrency.js).
    // A product whose rate is unavailable is dropped rather than shown with foreign figures as rupees.
    const rates = await getCurrencyExchangeRates();
    const converted = [];
    for (const product of data) {
        const inrProduct = convertVisaProductToInr(product, rates);
        if (inrProduct) {
            converted.push(inrProduct);
        } else {
            customLog(req?.LogTraceId, 'error', {
                message: 'Visa: no INR exchange rate for product currency — product hidden from search',
                product_id: product?.product_id,
                base_currency: product?.base_currency,
                ratesAvailable: !!rates,
            }, 'VENDOR');
        }
    }
    return res.status(200).json({ status: true, data: converted });
});

// ─── Product Documents ────────────────────────────────────────────────────────

exports.getProductDocuments = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    const { product_id } = req.query;
    if (!product_id) return next(new ErrorResponse('product_id is required', 400));

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching product documents from vendor', product_id }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/client/product/documents`, {
        params: { product_id },
        headers: { token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: product documents fetched successfully', product_id,vendorResponse:response }, 'VENDOR');

    return res.status(200).json({ status: true, data: response.data?.data || response.data });
});

// ─── Product Content ──────────────────────────────────────────────────────────

exports.getProductContent = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    const { visatype } = req.query;
    if (!visatype) return next(new ErrorResponse('visatype is required', 400));

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching product content from vendor', visatype }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/client/product/content`, {
        params: { visatype, residency: req.query.residency, nationality: req.query.nationality, type: 'T' },
        headers: { token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: product content fetched successfully', visatype,vendorResponse:response }, 'VENDOR');

    return res.status(200).json({ status: true, data: response.data?.data || response.data });
});

// ─── Vendor Helpers (shared by /order/create and payment-time order creation) ─

// Creates the order at the vendor (VisaOS). Throws ErrorResponse on failure.
async function createVendorOrder(body, service, req) {
    const vendorPayload = {
        ...body,
        client_code: service.CLIENT_CODE,
        branch_code: service.BRANCH_CODE,
        unique_identifier: body.unique_identifier || String(Date.now()),
        source: 'WEB',
        order_type: 'RETAIL',
        amount: String(body.amount),
        customer_billing_country: body.customer_billing_country === 'IN' ? 'India' : body.customer_billing_country,
    };
    customLog(req?.LogTraceId, 'info', {
        message: 'Visa: creating order with vendor',
        vendorPayload,
    }, 'VENDOR');

    let response;
    try {
        response = await axios.post(
            `${service.API_URL}/api/order/create`,
            vendorPayload,
            { headers: { token: service.API_KEY, 'Content-Type': 'application/json' } }
        );
    } catch (axiosError) {
        const vendorStatus = axiosError.response?.status;
        const vendorMessage = axiosError.response?.data?.message || axiosError.message;
        customLog(req?.LogTraceId, 'error', {
            message: 'Visa: vendor returned error on order creation',
            vendorStatus,
            vendorMessage,
            vendorData: axiosError.response?.data,
        }, 'VENDOR');
        throw new ErrorResponse(vendorMessage || 'Failed to create order', 502);
    }

    if (!response.data?.status) {
        customLog(req?.LogTraceId, 'error', { message: 'Visa: order creation failed at vendor', vendorMessage: response.data?.message }, 'VENDOR');
        throw new ErrorResponse(response.data?.message || 'Failed to create order', 400);
    }
    customLog(req?.LogTraceId, 'info', { message: 'Visa: order created successfully', orderNumber: response.data?.data?.order_number, apiurl: `${service.API_URL}/api/order/create`, vendorPayload, vendorResponse: response }, 'VENDOR');

    return response.data.data;
}

// Submits one document's bytes to the vendor and stores a permanent copy in S3.
// Returns { vendorResponse, key, url }. Throws on vendor error.
async function submitVendorDocumentBuffer({ service, req, buffer, filename, mimetype, documentCode, applicationId, orderNumber }) {
    const formData = new FormData();
    formData.append('file', buffer, { filename, contentType: mimetype });
    formData.append('document_code', documentCode);
    formData.append('application_id', applicationId);
    formData.append('order_number', orderNumber);

    customLog(req?.LogTraceId, 'info', { message: 'Visa: uploading document to vendor', document_code: documentCode, application_id: applicationId, order_number: orderNumber, fileName: filename }, 'VENDOR');
    const response = await axios.post(
        `${service.API_URL}/api/v1/order/updateDocument`,
        formData,
        { headers: { token: service.API_KEY, ...formData.getHeaders() } }
    );
    customLog(req?.LogTraceId, 'info', { message: 'Visa: document uploaded to vendor', document_code: documentCode, application_id: applicationId, order_number: orderNumber, vendorStatus: response }, 'VENDOR');

    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const base64 = buffer.toString('base64');
    const s3Key = await uploadFileToS3(base64, `visa-documents/${orderNumber}`, ext);
    const keyPath = s3Key.replace(`${process.env.CLOUD_DOMAIN}/`, '');
    const presignedUrl = await getPresignedUrl(keyPath, 3600);
    customLog(req?.LogTraceId, 'info', { message: 'Visa: document stored in S3', document_code: documentCode, application_id: applicationId, order_number: orderNumber, s3Key: keyPath }, 'VENDOR');

    return { vendorResponse: response.data, key: keyPath, url: presignedUrl };
}

// ─── Create Order ─────────────────────────────────────────────────────────────

exports.createOrder = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    const body = req.body;
    if (!body.product_id || !body.applicants?.length) {
        return next(new ErrorResponse('product_id and applicants are required', 400));
    }

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    let orderData;
    try {
        orderData = await createVendorOrder(body, service, req);
    } catch (err) {
        return next(err);
    }

    await saveVisaOrder({
        credentialId: req.user.id,
        serviceOperatorId: service.serviceOperatorId || null,
        orderNumber: orderData.order_number,
        productId: body.product_id,
        productName: body.visa_name || null,
        destination: body.destination_name || null,
        visaFormat: body.visa_type || null,
        visaType: body.visa_type || null,
        visaCategory: body.category || null,
        amountInINR: parseFloat(body.amount) || 0,
        baseCurrency: body.base_currency || 'INR',
        adult: body.adult || 1,
        child: body.child || 0,
        infant: body.infant || 0,
        travelDate: body.travel_date,
        applicants: orderData.applications,
        orderResponse: orderData,
        product_breakup: body.product_breakup || null,
        paymentStatus: 'PENDING',
        statusLog: { application_created: new Date().toISOString() },
    });

    return res.status(200).json({ status: true, message: 'Order Created', data: orderData });
});

// ─── Stage Document (S3 only, no order dependency) ────────────────────────────

exports.stageDocument = asyncHandler(async (req, res, next) => {
    if (!req.file) return next(new ErrorResponse('file is required', 400));

    const { document_code } = req.body;
    if (!document_code) return next(new ErrorResponse('document_code is required', 400));

    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const base64 = req.file.buffer.toString('base64');
    const s3Key = await uploadFileToS3(base64, `visa-documents/staging/${req.user.id}`, ext);
    const keyPath = s3Key.replace(`${process.env.CLOUD_DOMAIN}/`, '');

    return res.status(200).json({ status: true, data: { s3Key: keyPath, documentCode: document_code } });
});

// The vendor calls below use the platform API key, so the order must belong to the
// logged-in user first — same rule as getOrderDetails.
const isOwnVisaOrder = async (req, orderNumber) => {
    const order = await findVisaOrderByOrderNumber(orderNumber);
    return !!order && String(order.credentialId) === String(req.user.id);
};

// ─── Applicant Documents ──────────────────────────────────────────────────────

exports.getApplicantDocuments = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    const { application_id, order_number } = req.query;
    if (!application_id || !order_number) {
        return next(new ErrorResponse('application_id and order_number are required', 400));
    }

    if (!(await isOwnVisaOrder(req, order_number))) {
        return next(new ErrorResponse('Visa order not found', 404));
    }

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching applicant documents from vendor', application_id, order_number }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/order/applicant/document`, {
        params: { application_id, order_number },
        headers: { token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: applicant documents fetched successfully', application_id, order_number,vendorResponse:response }, 'VENDOR');

    return res.status(200).json({ status: true, data: response.data?.data || response.data });
});

// ─── Upload Document ──────────────────────────────────────────────────────────

exports.uploadDocument = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    if (!req.file) return next(new ErrorResponse('file is required', 400));

    const { document_code, application_id, order_number } = req.body;
    if (!document_code || !application_id || !order_number) {
        return next(new ErrorResponse('document_code, application_id and order_number are required', 400));
    }

    if (!(await isOwnVisaOrder(req, order_number))) {
        return next(new ErrorResponse('Visa order not found', 404));
    }

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    const result = await submitVendorDocumentBuffer({
        service,
        req,
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        documentCode: document_code,
        applicationId: application_id,
        orderNumber: order_number,
    });

    await updateVisaOrderDocuments({
        orderNumber: order_number,
        applicationId: application_id,
        documentCode: document_code,
        s3Key: result.key,
        presignedUrl: result.url,
    });

    // Re-uploading a rejected document only replaces the file — the vendor
    // hasn't re-reviewed it yet, so clear the stale REJECTED status/reason
    // here rather than leaving the old verdict attached to the new file.
    await updateVisaDocumentStatus({
        orderNumber: order_number,
        documents: [{ document_code, status: 'PENDING', rejection_reason: null }],
    });

    return res.status(200).json({ status: true, data: result.vendorResponse });
});

// ─── Application Status ───────────────────────────────────────────────────────

exports.getApplicationStatus = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    const { application_id, order_number } = req.query;
    if (!application_id || !order_number) {
        return next(new ErrorResponse('application_id and order_number are required', 400));
    }

    if (!(await isOwnVisaOrder(req, order_number))) {
        return next(new ErrorResponse('Visa order not found', 404));
    }

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching application status from vendor', application_id, order_number }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/v1/order/application/status`, {
        params: { application_id, order_number },
        headers: { token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: application status received', application_id, order_number, status: response || response.data?.status }, 'VENDOR');
    return res.status(200).json({ status: true, data: response.data?.data || response.data });
});

// ─── Order Status ─────────────────────────────────────────────────────────────

exports.getOrderStatus = asyncHandler(async (req, res, next) => {
    const service = await checkService(req);

    const { orderNumber } = req.params;
    if (!orderNumber) return next(new ErrorResponse('orderNumber is required', 400));

    if (!(await isOwnVisaOrder(req, orderNumber))) {
        return next(new ErrorResponse('Visa order not found', 404));
    }

    if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

    customLog(req?.LogTraceId, 'info', { message: 'Visa: fetching order status from vendor', orderNumber }, 'VENDOR');
    const response = await axios.get(`${service.API_URL}/api/order/status/${orderNumber}`, {
        headers: { token: service.API_KEY },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Visa: order status received', orderNumber, status: response || response.data?.status }, 'VENDOR');
    return res.status(200).json({ status: true, data: response.data?.data || response.data });
});

// ─── Order Details ────────────────────────────────────────────────────────────

const DOCUMENT_DISPLAY_NAMES = {
    PASSPORT_FRONT:   'Passport Copy (Front)',
    PASSPORT_BACK:    'Passport Copy (Back)',
    PHOTOGRAPH:       'Photograph',
    AADHAR_CARD:      'Aadhaar Card',
    COVERING_LETTER:  'Covering Letter',
    BANK_STATEMENT:   'Bank Statement',
    FLIGHT_TICKET:    'Flight Ticket',
    HOTEL_BOOKING:    'Hotel Booking',
    ITR:              'Income Tax Return',
    PAYSLIP:          'Pay Slip',
    // Vendor-side documents (sent via Upload Document Webhook)
    VISA_COPY:        'Visa Copy',
    INVOICE:          'Invoice',
    REJECTION_LETTER: 'Rejection Letter',
    VISA:             'Visa',
};

const FRONTEND_STATUS_LABELS = {
    // ── Active flow statuses ──────────────────────────────────────────────────
    NEW:                  'New',
    APPLICATION_CREATED:  'Application Created',
    DOCUMENTS_PENDING:    'Documents Pending',
    DOCS_UNDER_REVIEW:    'Documents Under Review',
    DOCS_REJECTED:        'Documents Rejected',
    // E-Visa flow
    PROCESSING:           'Processing',
    // Representative Submission flow
    PICKUP_SCHEDULED:     'Pickup Scheduled',
    EMBASSY_SUBMISSION:   'Embassy Submission',
    DOCUMENTS_RETURNED:   'Documents Returned',
    // Embassy Visit flow
    APPOINTMENT_BOOKED:   'Appointment Booked',
    EMBASSY_VISIT:        'Embassy Visit',
    // Shared terminal
    VISA_ISSUED:          'Visa Issued',
    VISA_REJECTED:        'Visa Rejected',
    // ── Legacy statuses (historical orders) ──────────────────────────────────
    DOCUMENTS_VERIFIED:   'Documents Verified',
    UNDER_REVIEW:         'Under Review',
    VISA_STAMPED:         'Visa Stamped',
    DELIVERED:            'Delivered',
    VISA_DELIVERED:       'Visa Delivered',
};

function formatStepDate(isoString) {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

exports.getOrderDetails = asyncHandler(async (req, res, next) => {
    const { order_number } = req.query;

    const order = await findVisaOrderByOrderNumber(order_number);
    if (!order) return next(new ErrorResponse('Visa order not found', 404));
    if (String(order.credentialId) !== String(req.user.id)) {
        return next(new ErrorResponse('Access denied', 403));
    }

    // Parse applicants JSON
    const applicants = (() => {
        try {
            return Array.isArray(order.applicants)
                ? order.applicants
                : JSON.parse(order.applicants || '[]');
        } catch { return []; }
    })();

    // Build map of uploaded doc info (code → { file_name, application_id }) from applicants
    const uploadedDocInfo = {};
    for (const applicant of applicants) {
        for (const [code, info] of Object.entries(applicant.documents || {})) {
            if (!uploadedDocInfo[code]) {
                uploadedDocInfo[code] = {
                    file_name: info.key ? info.key.split('/').pop() : null,
                    application_id: applicant.id || null,
                };
            }
        }
    }

    // Parse webhook document statuses — stored as array or object in order.documents
    const webhookDocs = (() => {
        try {
            if (!order.documents) return {};
            const raw = typeof order.documents === 'string'
                ? JSON.parse(order.documents)
                : order.documents;
            if (Array.isArray(raw)) {
                return raw.reduce((acc, d) => {
                    if (d.document_code) acc[d.document_code] = d;
                    return acc;
                }, {});
            }
            return raw;
        } catch { return {}; }
    })();

    // Merge uploaded documents with webhook statuses
    const allCodes = new Set([...Object.keys(uploadedDocInfo), ...Object.keys(webhookDocs)]);
    const documents = Array.from(allCodes).map(code => {
        const wh = webhookDocs[code] || {};
        const rawStatus = (wh.status || 'PENDING').toUpperCase();
        const status = ['APPROVED', 'REJECTED', 'PENDING', 'UPLOADED'].includes(rawStatus) ? rawStatus : 'PENDING';
        return {
            document_code:    code,
            display_value:    DOCUMENT_DISPLAY_NAMES[code] || code,
            status,
            rejection_reason: wh.rejection_reason
                || (Array.isArray(wh.document_rejection_reasons) && wh.document_rejection_reasons.length
                    ? wh.document_rejection_reasons.join(', ')
                    : null),
            file_name:        uploadedDocInfo[code]?.file_name || null,
            s3Url:            wh.s3Url || null,
            application_id:   wh.application_id || uploadedDocInfo[code]?.application_id || null,
        };
    });

    // Build step_dates from persisted status_log
    const rawLog = (order.statusLog && typeof order.statusLog === 'object') ? order.statusLog : {};
    const step_dates = {};
    for (const [key, iso] of Object.entries(rawLog)) {
        const formatted = formatStepDate(iso);
        if (formatted) step_dates[key] = formatted;
    }

    const statusCode = order.applicationStatus || null;
    const frontendStatus = order.stageLabel || FRONTEND_STATUS_LABELS[statusCode] || statusCode;

    return res.status(200).json({
        status: true,
        data: {
            order_number:      order.orderNumber,
            destination:       order.destination || null,
            visa_name:         order.productName || null,
            visa_type:         order.visaType || order.visaFormat || null,
            visa_format:       order.visaFormat || null,
            visa_duration:     null,
            entries_allowed:   null,
            travel_date:       order.travelDate || null,
            applicants_count:  applicants.length,
            frontend_status:   frontendStatus,
            status_code:       statusCode,
            documents,
            add_ons:           Array.isArray(order.addOns) ? order.addOns : [],
            step_dates,
        },
    });
});

// ─── List User's Visa Applications ────────────────────────────────────────────

exports.listApplications = asyncHandler(async (req, res) => {
    const { limit = 10, page = 1 } = req.query;

    const result = await findVisaOrders({
        credentialId: req.user.id,
        limit: parseInt(limit),
        page: parseInt(page),
    });

    return res.status(200).json({
        status: true,
        data: result.rows,
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
    });
});

// ─── Wallet Payment ───────────────────────────────────────────────────────────

exports.processWalletPayment = asyncHandler(async (req, res, next) => {
    const {
        orderNumber: existingOrderNumber,
        amount, totalAmount, payCashback, addOns, visa_type, visa_name, destination_name, category,
        product_id, applicants, travel_date, product_breakup, visa_amount,
        customer_email, customer_first_name, customer_last_name, customer_mobile,
        customer_billing_address_line_1, customer_billing_address_line_2,
        customer_billing_pincode, customer_billing_state, customer_billing_state_tax_code,
        customer_billing_country, customer_billing_city, group_name,
        adult, child, infant, residency, nationality, unique_identifier, partner, base_currency,
    } = req.body;
    if (!amount) return next(new ErrorResponse('amount is required', 400));

    // `amount`/`totalAmount` are the WALLET debit amounts (visa cost + add-ons).
    // `visa_amount` is the vendor's own order amount (visa cost only, no add-ons)
    // — these were two separate fields sent in two separate requests before the
    // order-creation and payment steps were merged, so they can't share a key.
    let vendorAmount = visa_amount !== undefined ? parseFloat(visa_amount) : parseFloat(amount);

    const credentialId  = req.user.id;
    const corporateTxnId = new Date().valueOf();
    const transactionCategory = 'Travel';

    // The vendor is sent its own price and breakup, not the marked-up ones the customer paid for: from the prices saved at the search.
    // A retry of an existing order has no vendor order to create, so nothing to look up.
    let vendorBreakup = product_breakup;
    if (!existingOrderNumber) {
        const visaQuote = await getVendorQuote(vendorAmount, accessKey, {
            credentialId,
            scope: getQuoteScope(req),
            match: (item) => String(item.product_id) === String(product_id),
        });
        if (!visaQuote) return next(new ErrorResponse('Visa price has changed. Please search again.', 400));
        vendorAmount = visaQuote.real;
        vendorBreakup = { breakup: visaQuote.item.breakup, age_cost_breakup: visaQuote.item.age_cost_breakup };
    }

    // Try to fetch live service details; fall back to safe defaults when
    // vendor credentials are not yet configured in the DB.
    const service = await checkService(req);
    const serviceOperatorId  = service.serviceOperatorId ?? null;
    const corporateCashback  = service.useFallback ? 0     : (service.cashback  ?? 0);
    const commissionType     = service.useFallback ? 'PERCENTAGE' : (service.commissionType  ?? 'PERCENTAGE');
    const cashbackType       = service.useFallback ? 'PERCENTAGE' : (service.cashbackType    ?? 'PERCENTAGE');
    const providerCommission = service.useFallback ? 0     : (service.providerCommission ?? 0);

    // Use the actual amount the frontend deducted (totalAmount includes platform fee).
    // Derive surcharge from the difference so the order record stores both correctly.
    // Fall back to DB surcharge config when totalAmount is not provided by the frontend.
    const dbSurcharge    = service.useFallback ? 0 : parseFloat(service.surcharge ?? 0);
    const baseAmount     = parseFloat(amount);
    const actualSurcharge = totalAmount
        ? parseFloat((parseFloat(totalAmount) - baseAmount).toFixed(2))
        : dbSurcharge;
    const actualTotal    = parseFloat((baseAmount + actualSurcharge).toFixed(2));

    // ── Resolve the order: either it's a retry of a previously-FAILED payment
    // (vendor order + documents already exist), or this is the first attempt,
    // in which case the vendor order + documents are created right now.
    let orderNumber = existingOrderNumber;
    let orderData = null;
    let applicantsWithDocs = null;
    let existingOrder = null;

    if (orderNumber) {
        existingOrder = await findVisaOrderByOrderNumber(orderNumber);
        if (!existingOrder || existingOrder.credentialId !== credentialId) {
            return next(new ErrorResponse('Order not found', 404));
        }
        if (existingOrder.paymentStatus === 'PAID') {
            return next(new ErrorResponse('This order has already been paid for', 409));
        }
    } else {
        if (!product_id || !applicants?.length) {
            return next(new ErrorResponse('product_id and applicants are required', 400));
        }
        if (service.useFallback) return next(new ErrorResponse('Visa service is not configured', 503));

        try {
            orderData = await createVendorOrder({
                product_id, applicants, travel_date, product_breakup: vendorBreakup,
                customer_email, customer_first_name, customer_last_name, customer_mobile,
                customer_billing_address_line_1, customer_billing_address_line_2,
                customer_billing_pincode, customer_billing_state, customer_billing_state_tax_code,
                customer_billing_country, customer_billing_city, group_name,
                adult, child, infant, residency, nationality, unique_identifier, partner, base_currency,
                amount: vendorAmount,
            }, service, req);
            orderNumber = orderData.order_number;

            applicantsWithDocs = await Promise.all(orderData.applications.map(async (vendorApp, idx) => {
                const stagedDocs = applicants[idx]?.documents || [];
                const documents = {};
                for (const doc of stagedDocs) {
                    if (!doc?.s3Key || !doc?.document_code) continue;
                    const buffer = await getFileBufferFromS3(doc.s3Key);
                    const ext = (doc.s3Key.split('.').pop() || 'jpg').toLowerCase();
                    const result = await submitVendorDocumentBuffer({
                        service,
                        req,
                        buffer,
                        filename: `${doc.document_code}.${ext}`,
                        mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        documentCode: doc.document_code,
                        applicationId: vendorApp.id,
                        orderNumber,
                    });
                    documents[doc.document_code] = { key: result.key, url: result.url, uploadedAt: new Date().toISOString() };
                }
                return { ...vendorApp, documents };
            }));
        } catch (err) {
            return next(err instanceof ErrorResponse ? err : new ErrorResponse(err.message || 'Failed to create visa order', 502));
        }
    }

    const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
    const reportData = service.serviceDetails
        ? await computeJournalData({
            serviceDetails: service.serviceDetails,
            amount: baseAmount,
            paymentMethod: 'WALLET',
            partnerDetails,
            paymentGatewayName: 'WALLET',
            couponTotalDiscount: req.body.couponTotalDiscount,
            corporateState: req.user.state,
            credentialId,
        })
        : undefined;

    const txnResult = await createWalletTransaction({
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        transactionCategory,
        amount: baseAmount,
        surcharge: actualSurcharge,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback: payCashback ?? false,
        reportData,
    });

    const txnId = String(corporateTxnId);

    if (txnResult.error) {
        // Vendor order + documents already exist (or existed) at this point —
        // persist the order as FAILED so a retry can reuse it instead of
        // creating a duplicate order at the vendor.
        if (existingOrder) {
            await updateVisaOrderPaymentStatus({ orderNumber, paymentStatus: 'FAILED', corporateTxnId: txnId });
        } else {
            await saveVisaOrder({
                credentialId,
                serviceOperatorId,
                orderNumber,
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
                orderResponse: orderData,
                product_breakup: vendorBreakup || null,
                paymentStatus: 'FAILED',
                corporateTxnId: txnId,
                statusLog: { application_created: new Date().toISOString() },
            });
        }
        return res.status(400).json({ status: false, message: txnResult.error, orderNumber });
    }

    await updateWalletTransaction({
        corporateTxnId: txnId,
        status: 'SUCCESS',
        message: 'Payment Successful',
        providerId: orderNumber,
    });

    if (reportData) {
        publishJournalEvent(
            {
                transactionRef: txnId,
                type: 'payment',
                contextSnapshot: {
                    credentialId,
                    vendor: service.serviceDetails?.vendor || null,
                    registeredBy: req.user.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    }

    if (existingOrder) {
        await updateVisaOrderPaymentStatus({
            orderNumber,
            paymentStatus: 'PAID',
            corporateTxnId: txnId,
            actualAmountPaid: actualTotal,
            addOns: addOns || null,
            visaType: visa_type || null,
        });
    } else {
        await saveVisaOrder({
            credentialId,
            serviceOperatorId,
            orderNumber,
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
            orderResponse: orderData,
            product_breakup: vendorBreakup || null,
            paymentStatus: 'PAID',
            corporateTxnId: txnId,
            actualAmountPaid: actualTotal,
            addOns: addOns || null,
            statusLog: { application_created: new Date().toISOString(), application_submitted: new Date().toISOString() },
        });
    }

    createNotification({
        notificationTitle: 'Visa Application - Payment Successful',
        notificationBrief: `Payment of ₹ ${actualTotal} for Visa Application was successful. Transaction ID: ${txnId}.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });

    const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: baseAmount,
        surcharge: actualSurcharge,
        corporateTxnId: txnId,
        orderId: txnResult.orderId,
        paymentType: 'Visa Application',
        credentialId,
        traceId: req?.LogTraceId,
    });

    // Send confirmation email fire-and-forget
    (async () => {
        try {
            const visaOrder = await findVisaOrderByOrderNumber(orderNumber);
            customLog(req?.LogTraceId, 'info', { message: 'Visa: sending confirmation email', orderId: visaOrder?.id, destination: visaOrder?.destination, productName: visaOrder?.productName });
            const to = req.user.email || visaOrder?.credential?.email;
            customLog(req?.LogTraceId, 'info', { message: 'Visa: confirmation email recipient', to, userName: req.user?.name, orderNumber });
            if (!to) { customLog(req?.LogTraceId, 'warn', { message: 'Visa: no email found for confirmation, skipping' }); return; }
            const templateDetails = partnerDetails;
            const rawApplicants = visaOrder?.applicants;
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
            const body = visaConfirmationTemplate({
                userName: req.user.name || req.user.username,
                destination: visaOrder?.destination,
                visaType: visaOrder?.visaFormat,
                processingType: visaOrder?.visaCategory,
                productName: visaOrder?.productName,
                travellers,
                priceBreakdown: { total: parseFloat(visaOrder?.actualAmountPaid ?? actualTotal) },
                orderNumber,
            }, templateDetails);
            customLog(req?.LogTraceId, 'info', { message: 'Visa: dispatching confirmation email', to });
            emailer.emailWithMultipleAttachment(to, 'Your Visa Application Has Been Submitted – Peko', body, invoiceAttachments, undefined, () => {
                customLog(req?.LogTraceId, 'info', { message: 'Visa: confirmation email sent successfully', to });
            });
        } catch (emailErr) {
            customLog(req?.LogTraceId, 'error', { message: 'Visa: confirmation email send failed', error: emailErr?.message });
        }
    })();

    return res.status(200).json({
        status: true,
        corporateTxnId: txnId,
        corporateFinalBalance: txnResult.corporateFinalBalance,
        message: 'Payment processed successfully',
        orderNumber,
    });
});

// ─── Manage Bookings ──────────────────────────────────────────────────────────

exports.listBookings = asyncHandler(async (req, res) => {
    const { from, to, paymentStatus, applicationStatus, limit = 10, page = 1 } = req.query;

    const result = await findAllVisaOrders({
        credentialId: req.user.id,
        from,
        to,
        paymentStatus,
        applicationStatus,
        limit: parseInt(limit),
        page: parseInt(page),
    });

    const rows = result.rows.map(order => {
        const applicants = Array.isArray(order.applicants)
            ? order.applicants
            : (() => { try { return JSON.parse(order.applicants || '[]'); } catch { return []; } })();

        const primary = applicants[0] || {};
        const employeeName = [primary.first_name, primary.last_name].filter(Boolean).join(' ') || null;

        const statusCode = order.applicationStatus || null;

        return {
            id: order.id,
            order_number: order.orderNumber,
            orderNumber: order.orderNumber,
            corporateTxnId: order.corporateTxnId,
            productId: order.productId,
            visaType: order.productName,
            visaFormat: order.visaFormat,
            visa_format: order.visaFormat,
            visa_type: order.visaType || order.visaFormat || null,
            visaCategory: order.visaCategory,
            destination: order.destination,
            amountInINR: order.amountInINR,
            travel_date: order.travelDate,
            travelDate: order.travelDate,
            adult: order.adult,
            child: order.child,
            infant: order.infant,
            paymentStatus: order.paymentStatus,
            applicationStatus: statusCode,
            frontend_status: order.stageLabel || FRONTEND_STATUS_LABELS[statusCode] || statusCode,
            transactionDate: order.transactionDate,
            employee: employeeName,
            applicants,
            credential: order.credential,
        };
    });

    return res.status(200).json({
        status: true,
        data: rows,
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
    });
});
