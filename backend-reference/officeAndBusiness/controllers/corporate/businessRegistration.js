const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const withRetry = require('../../utils/withRetry');
const gateway = require('../../utils/indiaFilingsGateway');
const {
    createApplication,
    findApplicationById,
    findApplicationsByCredential,
    findVendorPersonByRole,
} = require('../../models/use-cases/businessRegistration');
const { findByVendorEngagementId: findGovServiceApplicationByEngagementId } = require('../../models/use-cases/governmentServicesApplication');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { getActiveCatalog, getCatalogRows } = require('../../models/use-cases/businessRegistrationCatalog');
const {
    runVendorChain,
    runVendorPaymentPhase,
    shouldRunVendorChain,
    resolveCatalogRow,
    resolveCatalogRows,
    ENTITY_LABEL,
} = require('../../utils/businessRegistrationVendorChain');
const { customLog } = require('../../utils/loggerHelper');
const {
    createWalletTransaction,
    updateWalletTransaction,
    refundWalletTransaction,
} = require('../../utils/walletTransaction');
const {
    createPGTransaction,
    createPaytmTransaction,
} = require('../../utils/pamentGatewayTransaction');
const {
    fetchServiceDetails,
    calculateSurcharge,
    calculateAmountWithTax,
} = require('../../utils/checkAndFetchServiceDetails');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { findOneOrder } = require('../../models/use-cases/order');
const { createNotification } = require('../../models/use-cases/notification');
const emailer = require('../../utils/emailer');
const { resolveApplicationSubmittedEmail } = require('../../utils/emailTemplates/businessRegistration');
const exotel = require('../../utils/exotelGateway');
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup');

const BR_ACCESS_KEY = 'business_registration';

// Normalize an Indian number to E.164 for Exotel (10-digit -> +91XXXXXXXXXX).
const toE164India = num => {
    const raw = String(num ?? '').trim();
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (raw.startsWith('+')) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return `+${digits}`;
};

// Map a persisted catalog row to the vendor-compatible shape the FE already parses.
// Displayed price = admin's custom `amount`; when none is set, default to the
// vendor's price. `status` travels so the FE can hide deactivated services.
const toCatalogItem = row => ({
    id: row.vendorCatalogId,
    service_id: row.serviceId,
    service_name: row.serviceName,
    variant_name: row.variantName,
    description: row.description,
    price: row.amount != null ? Number(row.amount) : Number(row.vendorPrice) || 0,
    government_fee_amount: Number(row.governmentFeeAmount) || 0,
    unit: row.unit,
    currency: row.currency,
    about: row.about,
    sortOrder: row.sortOrder,
    status: Boolean(row.status),
});

// Business Registration — IndiaFilings vendor proxy.
// Phase 1: lookup endpoints (no application persistence yet). The FE calls these
// for name availability, NIC activities, pincode lookup, PAN verify, etc.

const ok = (res, data, message = 'Success') =>
    res.status(200).json({ status: true, message, data, responseCode: '000' });

// Resolve vendor config or send a 503 — returns null when unavailable.
const resolveConfig = async next => {
    const cfg = await gateway.getConfig();
    if (cfg.error) {
        next(new ErrorResponse(cfg.error, 503));
        return null;
    }
    return cfg;
};

// POST /name-check  { name } -> MCA business-name availability
exports.checkBusinessName = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { name, searchType = 'COMPANY NAME' } = req.body;
    if (!name) return next(new ErrorResponse('name is required', 400));
    try {
        const data = await withRetry(() =>
            gateway.mcaSearch(cfg, { search_type: searchType, search_term: name })
        );
        return ok(res, data, 'Name availability fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to check name availability', 502));
    }
});

// GET /business-activities?level=4 -> NIC activity list
exports.getBusinessActivities = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    try {
        const data = await withRetry(() => gateway.getBusinessActivities(cfg, req.query.level || 4));
        return ok(res, data, 'Business activities fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to fetch business activities', 502));
    }
});

// POST /location  { pincode } -> state/district/serviceability
exports.locationLookup = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { pincode } = req.body;
    if (!pincode) return next(new ErrorResponse('pincode is required', 400));
    try {
        const data = await withRetry(() => gateway.locationLookup(cfg, pincode));
        return ok(res, data, 'Location fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to look up pincode', 502));
    }
});

// POST /jurisdiction  { pincode } -> GST Commissionerate/Circle/Division/Range (doc §E6)
exports.jurisdictionLookup = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { pincode } = req.body;
    if (!pincode) return next(new ErrorResponse('pincode is required', 400));
    try {
        const data = await withRetry(() => gateway.jurisdictionLookup(cfg, pincode));
        return ok(res, data, 'Jurisdiction fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to look up GST jurisdiction', 502));
    }
});

// POST /hsn-code  { hsncode } -> HSN/SAC codes for the GST Top-5 Goods & Services picker.
// The vendor requires a non-empty hsncode (search by code prefix — no "list all").
exports.searchHsnCode = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { hsncode } = req.body;
    if (!hsncode) return next(new ErrorResponse('hsncode is required', 400));
    try {
        const data = await withRetry(() => gateway.searchHsnCode(cfg, String(hsncode)));
        return ok(res, data, 'HSN codes fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to search HSN codes', 502));
    }
});

// POST /verify-pan  { pan } -> holder details
exports.verifyPan = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { pan } = req.body;
    if (!pan) return next(new ErrorResponse('pan is required', 400));
    try {
        const data = await withRetry(() => gateway.verifyPan(cfg, pan));
        return ok(res, data, 'PAN verified');
    } catch (error) {
        return next(new ErrorResponse('Unable to verify PAN', 502));
    }
});

// POST /verify-din  { din } -> MCA director data + related companies (doc v1.1 §13)
exports.verifyDin = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { din } = req.body;
    if (!din) return next(new ErrorResponse('din is required', 400));
    try {
        const data = await withRetry(() => gateway.mcaDirector(cfg, { search_term: din }));
        return ok(res, data, 'DIN verified');
    } catch (error) {
        return next(new ErrorResponse('Unable to verify DIN', 502));
    }
});

// Known People checklist (sandbox kyc-status response 13-07) — served until a
// synced person of the requested role exists to fetch the live list with.
const FALLBACK_PEOPLE_CHECKLIST = [
    { document_type: 'PAN', mandatory: 1, document_Nid: 1 },
    { document_type: 'Passport', mandatory: 1, document_Nid: 3 },
    { document_type: 'Passport Photo', mandatory: 1, document_Nid: 7 },
    { document_type: 'Aadhaar', mandatory: 2, document_Nid: 2 },
    { document_type: 'Voters ID', mandatory: 2, document_Nid: 4 },
    { document_type: 'Drivers License', mandatory: 2, document_Nid: 5 },
    { document_type: 'Bank Statement', mandatory: 2, document_Nid: 826 },
];
// Vendor document lists are read live; Redis keeps only the last good answer as a fallback.
const CHECKLIST_CACHE_PREFIX = 'india_filings_doc_checklist_lastgood_';
const LAST_GOOD_TTL_SECONDS = 30 * 24 * 60 * 60;

const readLastGood = async (key) => {
    try {
        const raw = await getValue(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

// GET /document-checklist?role=director|shareholder|nominee
// The vendor's required-documents list is per ROLE, not per person — one
// kyc-status call for any director covers every director, seeded with any
// previously-synced person of that role (no vendor writes).
exports.getDocumentChecklist = asyncHandler(async (req, res) => {
    const role = ['director', 'shareholder', 'nominee'].includes(req.query.role)
        ? req.query.role
        : 'director';
    const lastGoodKey = `${CHECKLIST_CACHE_PREFIX}${role}`;

    try {
        const seed = await findVendorPersonByRole(role);
        if (seed?.peopleId) {
            const cfg = await gateway.getConfig();
            if (!cfg.error) {
                const data = await withRetry(() =>
                    gateway.kycStatus(cfg, { request_for: 'People', kycRequest: seed.peopleId })
                );
                const documents = (data?.KYC?.Documents || [])
                    .filter(d => d?.document_type && d?.document_Nid != null)
                    .map(d => ({
                        document_type: d.document_type,
                        mandatory: d.mandatory,
                        document_Nid: d.document_Nid,
                    }));
                if (documents.length) {
                    await setValue(lastGoodKey, LAST_GOOD_TTL_SECONDS, JSON.stringify(documents));
                    return ok(res, { role, source: 'vendor', documents }, 'Document checklist fetched');
                }
            }
        }
    } catch (error) {
        customLog('error', 'BR document checklist fetch failed', { role, error: error.message });
    }
    const lastGood = await readLastGood(lastGoodKey);
    if (lastGood) return ok(res, { role, source: 'last_good', documents: lastGood }, 'Document checklist fetched');
    return ok(res, { role, source: 'fallback', documents: FALLBACK_PEOPLE_CHECKLIST }, 'Document checklist fetched');
});

// v4: live-first with last-good fallback (old v3 snapshot keys are ignored).
const SERVICE_DOCS_CACHE_PREFIX = 'india_filings_service_docs_v4_lastgood_';

// Documents the applicant CANNOT have upfront — the vendor/MCA generates them
// during or after the filing (SPICe forms, declarations, certificates, and
// contingency letters). Never shown as upload fields; the vendor has been asked
// to confirm the true customer-supplied subset. Matching strips ALL
// non-alphanumerics ("Form INC 32", "INC-32", nbsp variants all → "inc32").
const VENDOR_GENERATED_DOCS = [
    'inc32', 'inc33', 'inc34', 'inc9', 'agilepro', 'incorporationcertificate',
    'nameapproval', 'namerejection', 'rule8', 'rule12', 'promoterdeclaration',
    'boardresolution',
];
const isVendorGeneratedDoc = name => {
    const n = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return VENDOR_GENERATED_DOCS.some(keyword => n.includes(keyword));
};

// GET /service-documents?entityType= — business-level documents required for the
// entity's catalog service (/v4/docs/Service). Required = smartservice === 1 &&
// status === 1; upload Nid = ledgers_document_id. Read live per request.
exports.getServiceDocuments = asyncHandler(async (req, res) => {
    const row = await resolveCatalogRow(req.query.entityType);
    const serviceId = row?.serviceId;
    if (!serviceId) return ok(res, { serviceId: null, source: 'none', documents: [] }, 'Service documents fetched');
    const lastGoodKey = `${SERVICE_DOCS_CACHE_PREFIX}${serviceId}`;

    try {
        const cfg = await gateway.getConfig();
        if (!cfg.error) {
            const data = await withRetry(() => gateway.getServiceDocumentTypes(cfg, serviceId));
            const documents = (data?.Document_types || [])
                .filter(d => Number(d?.smartservice) === 1 && Number(d?.status) === 1)
                .filter(d => !isVendorGeneratedDoc(d.doc_name))
                .map(d => ({ doc_name: d.doc_name, ledgers_document_id: d.ledgers_document_id, doc_type: d.doc_type, doc_group: d.doc_group }));
            await setValue(lastGoodKey, LAST_GOOD_TTL_SECONDS, JSON.stringify(documents));
            return ok(res, { serviceId, source: 'vendor', documents }, 'Service documents fetched');
        }
    } catch (error) {
        customLog('error', 'BR service documents fetch failed', { serviceId, error: error.message });
    }
    const lastGood = await readLastGood(lastGoodKey);
    if (lastGood) return ok(res, { serviceId, source: 'last_good', documents: lastGood }, 'Service documents fetched');
    return ok(res, { serviceId, source: 'fallback', documents: [] }, 'Service documents fetched');
});

// GET /catalog -> entity catalog & pricing. Served from our saved catalog (active
// rows, ordered, with admin custom pricing). Falls back to the live vendor catalog
// only when nothing has been synced/published yet.
exports.getCatalog = asyncHandler(async (req, res, next) => {
    // With service_id (payment path): active rows only — a deactivated service is
    // simply unavailable. Without (structure-cards list): ALL rows including
    // inactive, so the FE can hide deactivated services via the status flag.
    const rows = req.query.service_id
        ? await getActiveCatalog({ serviceId: req.query.service_id })
        : await getCatalogRows();
    await applyCommissionMarkup(rows, ['amount', 'vendorPrice'], req.user.id);
    if (rows && rows.length) {
        const items = rows.map(toCatalogItem);
        return ok(res, { status: 200, total: items.length, data: items }, 'Catalog fetched');
    }

    // Fallback: no published catalog yet — proxy the vendor directly.
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    try {
        const data = await withRetry(() =>
            gateway.getCatalog(cfg, {
                operation_type: 'getServiceIDbyData',
                status: '1',
                service_id: req.query.service_id || '1',
            })
        );
        return ok(res, data, 'Catalog fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to fetch catalog', 502));
    }
});

// GET /customer?email=|customer_id= -> account info (for contact prefill)
exports.getCustomer = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { email, customerId } = req.query;
    if (!email && !customerId) return next(new ErrorResponse('email or customerId is required', 400));

    // F-OAB-28: this proxies the vendor's customer record, so only let the caller fetch their
    // OWN — the requested id/email must match one of the caller's business-registration records,
    // otherwise any authenticated user could read another tenant's customer by id or email.
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const owned = await findApplicationsByCredential(credentialId, corporateId, { limit: 1000 });
    const ownApps = owned?.rows || [];
    const ownedGids = ownApps.map(a => a.vendorGid).filter(Boolean);
    const ownedEmails = ownApps.map(a => (a.contactEmail || '').toLowerCase()).filter(Boolean);

    let params;
    if (customerId) {
        if (!ownedGids.includes(customerId)) return next(new ErrorResponse('Customer not found', 404));
        params = { customer_id: customerId };
    } else {
        if (!ownedEmails.includes(String(email).toLowerCase())) return next(new ErrorResponse('Customer not found', 404));
        params = { email };
    }

    try {
        const data = await withRetry(() => gateway.getCustomer(cfg, params));
        return ok(res, data, 'Customer fetched');
    } catch (error) {
        return next(new ErrorResponse('Unable to fetch customer', 502));
    }
});

// POST /lead  { name, email, mobile, source?, catalogId? } -> create CRM lead
exports.createLead = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { name, email, mobile, source = 'PEKO_PARTNER', catalogId } = req.body;
    if (!name) return next(new ErrorResponse('name is required', 400));
    try {
        const data = await withRetry(() =>
            gateway.createLead(cfg, {
                name,
                email,
                mobile,
                country_code: 91,
                lead_source: source,
                ...(catalogId ? { catalog_id: catalogId } : {}),
            })
        );
        return ok(res, data, 'Lead created');
    } catch (error) {
        return next(new ErrorResponse('Unable to create lead', 502));
    }
});

// POST /feedback  { engagementId, rating, feedback?, deviceType? } -> vendor
// google-reviews rating. deviceType 'mobile' -> status 2, else 1 (Desktop).
exports.submitFeedback = asyncHandler(async (req, res, next) => {
    const cfg = await resolveConfig(next);
    if (!cfg) return;
    const { applicationId, engagementId, rating, feedback = '', deviceType } = req.body;
    if (!engagementId || rating == null) {
        return next(new ErrorResponse('engagementId and rating are required', 400));
    }
    const clientIp =
        String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.ip ||
        req.socket?.remoteAddress ||
        '';
    try {
        const data = await withRetry(() =>
            gateway.submitFeedback(
                cfg,
                {
                    engagement_id: String(engagementId),
                    client_rating: String(rating),
                    client_feedback: feedback,
                    status: deviceType === 'mobile' ? 2 : 1,
                },
                clientIp
            )
        );
        // Record it so the FE never re-asks (across devices), keyed by application.
        if (applicationId) {
            const application = await findApplicationById(applicationId, req.user.id, req.user.corporateId);
            if (application) await application.update({ feedbackGiven: true });
        }
        return ok(res, data, 'Feedback submitted');
    } catch (error) {
        return next(new ErrorResponse('Unable to submit feedback', 502));
    }
});

// --- Application persistence + payment --------------------------------------
// Draft is created at "Proceed to payment" (status PENDING), the wallet debit
// happens on /payment (canonical works.js pattern), and the final submit flips
// the draft to SUBMITTED with the complete form data.

const ENTITY_TYPES = new Set(['proprietorship', 'partnership', 'private_limited', 'opc', 'llp']);

// Server-side pricing (mirrors the FE breakdown; catalog custom amount wins,
// else vendor market price, else the hardcoded structure fee).
const FALLBACK_FEES = {
    proprietorship: 2999,
    partnership: 5999,
    opc: 9999,
    private_limited: 12999,
    llp: 2999,
};
// GST on incorporation services is a flat 18%. (The old global "taxRate" setting
// helper was retired when invoicing moved to per-item tax rates, so we use the
// constant directly here instead of depending on that removed helper.)
const GST_RATE = 0.18;

// The displayed price (the vendor's price or our custom price) is what the
// customer pays and is GST-INCLUSIVE — the same model as every other Peko
// service. We carve the GST out of it for the breakdown/invoice instead of
// adding it on top. Government fees are handled internally by the vendor, so
// they're not charged to the customer here.
// Customer pricing reads these; the vendor chain keeps resolving the unmarked row.
const resolveMarkedUpCatalogRow = async (entityType, credentialId) => {
    const row = await resolveCatalogRow(entityType);
    await applyCommissionMarkup(row, ['amount', 'vendorPrice'], credentialId);
    return row;
};

const resolveMarkedUpCatalogRows = async (entityType, credentialId) => {
    const rows = await resolveCatalogRows(entityType);
    await applyCommissionMarkup(rows, ['amount', 'vendorPrice'], credentialId);
    return rows;
};

const computePricing = (entityType, catalogRow) => {
    const base = catalogRow
        ? Number(catalogRow.amount != null ? catalogRow.amount : catalogRow.vendorPrice) || 0
        : FALLBACK_FEES[entityType] || 0;
    const taxable = Math.round(base / (1 + GST_RATE));
    return { incorporationFee: taxable, gstAmount: base - taxable, totalAmount: base };
};

// A selectable variant for the payment page. price is GST-inclusive (what the
// customer pays); the FE splits GST/surcharge per option. Only shown when the
// entity has more than one active variant.
const toVariantOption = row => ({
    vendorCatalogId: row.vendorCatalogId,
    variantName: row.variantName || row.serviceName || '',
    price: Number(row.amount != null ? row.amount : row.vendorPrice) || 0,
    description: row.description || null,
    about: row.about || null,
});

const extractContactFields = applicationData => {
    const contact = applicationData.primaryContact || {};
    return {
        businessName: applicationData.proposedNames?.first || null,
        contactPerson: contact.fullName || null,
        contactEmail: contact.email || null,
        contactMobile: contact.mobile || null,
    };
};

// Steps pushed to the vendor when a draft save carries vendorSync (leaving the
// Directors KYC step): business creation + director/nominee records + Smart
// Form 1 (the NAME APPLICATION — vendor 21-07: filed alongside application
// creation, not at final submit). Earlier stages (lead/customer/payment) are
// already done from the payment phase and skip.
// smartform1 (name application) moved to the payment phase (filed at payment,
// per the vendor). The director sync now only pushes the business + directors.
const DIRECTOR_SYNC_PHASE = ['lead', 'customer', 'startup', 'people'];

// Per-step SYNCHRONOUS vendor sync (the FE awaits these on each step's Next and
// blocks the step on failure). Keys are idempotent — lead/customer/startup are
// skipped when already done by the payment phase, so re-running (back-nav /
// resume) never duplicates. 'directors' pushes the directors; 'shareholders'
// creates any shareholders added on the shareholding step and their holdings.
const SYNC_PHASES = {
    directors: ['lead', 'customer', 'startup', 'people'],
    shareholders: ['lead', 'customer', 'startup', 'people', 'shareholdings'],
};

// Runs a sync phase and returns { ok, failedStage?, error? } for the FE to gate
// on. No-op (ok) before payment or for non-vendor entities.
const runSyncPhase = async (application, phase, logTraceId) => {
    if (!phase || !SYNC_PHASES[phase]) return { ok: true };
    if (application.paymentStatus !== 'COMPLETED') return { ok: true };
    if (!shouldRunVendorChain(application.entityType)) return { ok: true };
    try {
        return await runVendorChain(application, { logTraceId, phaseKeys: SYNC_PHASES[phase] });
    } catch (err) {
        return { ok: false, error: err.message };
    }
};

// On successful submission, email the corporate, the primary contact (lead) and
// every director, and drop an in-app notification for the corporate. Best-effort
// — wrapped so a mail/notification failure never blocks the submit response.
const sendSubmissionNotifications = async (application, req) => {
    const logTraceId = req?.LogTraceId;
    try {
        const data = application.applicationData || {};
        const contact = data.primaryContact || {};
        const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
        const details = {
            applicationId: application.applicationId,
            entityLabel: ENTITY_LABEL[application.entityType] || application.entityType,
            proposedName: data.proposedNames?.first || application.businessName || '',
            // Partner users track the application on their own portal (Admin → Branding → Portal URL).
            portalUrl: req.user.registeredBy ? partnerDetails?.baseUrl : null,
        };
        // Director/partner people for the entity type.
        let people;
        if (application.entityType === 'opc') people = [data.director];
        else if (application.entityType === 'partnership') people = data.partners || [];
        else if (Array.isArray(data.directors) && data.directors.length) people = data.directors;
        else people = [data.director];

        const recipients = [];
        const addRecipient = (mail, name) => {
            const e = String(mail || '').trim();
            if (e && /.+@.+\..+/.test(e) && !recipients.some(r => r.email.toLowerCase() === e.toLowerCase())) {
                recipients.push({ email: e, name });
            }
        };
        addRecipient(req?.user?.username, contact.fullName); // corporate (login email)
        addRecipient(contact.email, contact.fullName); // lead / primary contact
        (people || []).forEach(p =>
            addRecipient(p?.email, [p?.firstName, p?.lastName].filter(Boolean).join(' '))
        );

        const partnerId = req?.user?.registeredBy || null;
        // Resolved per recipient since the greeting name differs.
        for (const { email, name } of recipients) {
            const { subject, html, sender } = await resolveApplicationSubmittedEmail(name, details, partnerDetails, {
                partnerId,
                logTraceId,
            });
            emailer.email(email, subject, html, () => {}, sender);
        }

        if (req?.user?.username) {
            createNotification({
                notificationTitle: 'Business Registration - Application Submitted',
                notificationBrief: `Your business registration application ${application.applicationId} has been submitted successfully and is being processed.`,
                notificationTo: [req.user.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });
        }
    } catch (err) {
        customLog(logTraceId, 'error', {
            message: '[brSubmit] submission notification/email error',
            applicationId: application?.applicationId,
            err: err.message,
        });
    }
};

const startDirectorSync = (application, logTraceId) => {
    if (application.paymentStatus !== 'COMPLETED') return;
    if (!shouldRunVendorChain(application.entityType)) return;
    setImmediate(() =>
        runVendorChain(application, { logTraceId, phaseKeys: DIRECTOR_SYNC_PHASE }).catch(err =>
            customLog(logTraceId, 'error', {
                message: '[brVendorChain] director sync error',
                applicationId: application.applicationId,
                err: err.message,
            })
        )
    );
};

// POST /applications/draft  { applicationId?, entityType, applicationData, vendorSync? }
// Creates (or updates, while still PENDING) the draft. Called at "Proceed to
// payment" and on every later step's Next. vendorSync=true (leaving Directors
// KYC) additionally pushes business + directors to the vendor in the background.
// Pricing is computed server-side and frozen once payment completes.
exports.saveDraft = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { applicationId, entityType, applicationData, vendorSync, syncPhase } = req.body;

    if (!entityType || !ENTITY_TYPES.has(entityType)) {
        return next(new ErrorResponse('A valid entityType is required', 400));
    }
    if (!applicationData || typeof applicationData !== 'object') {
        return next(new ErrorResponse('applicationData is required', 400));
    }

    const catalogRows = await resolveMarkedUpCatalogRows(entityType, credentialId);
    const catalogRow = catalogRows[0] || null;
    const variants = catalogRows.map(toVariantOption);
    const pricing = computePricing(entityType, catalogRow);

    if (applicationId) {
        const application = await findApplicationById(applicationId, credentialId, corporateId);
        if (application && application.status === 'PENDING') {
            await application.update({
                entityType,
                applicationData,
                ...extractContactFields(applicationData),
                // Never reprice after the corporate has paid.
                ...(application.paymentStatus !== 'COMPLETED' ? pricing : {}),
            });
            // Synchronous per-step sync (FE blocks the step on failure). Falls
            // back to the legacy background director sync if only vendorSync set.
            let sync = { ok: true };
            if (syncPhase) {
                sync = await runSyncPhase(application, syncPhase, req?.LogTraceId);
            } else if (vendorSync) {
                startDirectorSync(application, req?.LogTraceId);
            }
            return ok(
                res,
                {
                    applicationId: application.applicationId,
                    totalAmount: Number(application.totalAmount),
                    incorporationFee: Number(application.incorporationFee),
                    gstAmount: Number(application.gstAmount),
                    paymentStatus: application.paymentStatus,
                    // Service copy for the payment summary — straight from the catalog.
                    serviceName: catalogRow?.serviceName || null,
                    description: catalogRow?.description || null,
                    about: catalogRow?.about || null,
                    variants,
                    catalogId: catalogRow?.vendorCatalogId || null,
                    sync,
                },
                'Draft updated'
            );
        }
    }

    const newApplicationId = `BR/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const application = await createApplication(credentialId, corporateId, {
        applicationId: newApplicationId,
        entityType,
        applicationData,
        ...extractContactFields(applicationData),
        ...pricing,
        status: 'PENDING',
    });

    return res.status(201).json({
        status: true,
        message: 'Draft created',
        data: {
            applicationId: application.applicationId,
            totalAmount: Number(application.totalAmount),
            incorporationFee: Number(application.incorporationFee),
            gstAmount: Number(application.gstAmount),
            paymentStatus: application.paymentStatus,
            // Service copy for the payment summary — straight from the catalog.
            serviceName: catalogRow?.serviceName || null,
            description: catalogRow?.description || null,
            about: catalogRow?.about || null,
            variants,
            catalogId: catalogRow?.vendorCatalogId || null,
        },
        responseCode: '000',
    });
});

// POST /payment  { applicationId, ... } — the canonical wallet/PG debit
// (works.js pattern). Amount always comes from the draft row, never the client.
// On success the row is marked paid and the vendor payment phase (lead → gid →
// vendor order → engagement) runs in the background.
exports.payForApplication = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { applicationId, vendorCatalogId } = req.body;
    if (!applicationId) return next(new ErrorResponse('applicationId is required', 400));

    const application = await findApplicationById(applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));
    if (application.paymentStatus === 'COMPLETED') {
        return next(new ErrorResponse('This application is already paid', 400));
    }

    // A selected variant re-prices the draft here — the price comes from our
    // catalog row, never the client. Must be an active variant of this entity.
    let selectedRow = null;
    if (vendorCatalogId) {
        const rows = await resolveMarkedUpCatalogRows(application.entityType, credentialId);
        const selected = rows.find(r => String(r.vendorCatalogId) === String(vendorCatalogId));
        if (!selected) return next(new ErrorResponse('Invalid selected variant', 400));
        selectedRow = selected;
        await application.update(computePricing(application.entityType, selected));
    }

    const amount = Number(application.totalAmount) || 0;
    if (amount <= 0) return next(new ErrorResponse('Invalid application amount', 400));

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey: BR_ACCESS_KEY,
        packageId: req.user.packageId,
        corporateUserId: corporateId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 200));
    }

    const surchargeWithoutTax = await calculateSurcharge(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );
    const surcharge = await calculateAmountWithTax(surchargeWithoutTax);

    const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
    const catalogRow = selectedRow || (await resolveMarkedUpCatalogRow(application.entityType, credentialId));
    const journalPlanDetails = catalogRow ? [{
        name: catalogRow.serviceName || 'Business Registration',
        commissionMode: catalogRow.commissionMode,
        commissionType: catalogRow.commissionType,
        commission: catalogRow.commission,
        fixedCommissionPerTransaction: catalogRow.fixedCommissionPerTransaction,
        isCommissionInclGST: catalogRow.isCommissionInclGST,
        amount: catalogRow.amount != null ? Number(catalogRow.amount) : Number(catalogRow.vendorPrice) || 0,
    }] : [];

    const reportData = await computeJournalData({
        serviceDetails,
        amount,
        paymentMethod: 'WALLET',
        partnerDetails,
        paymentGatewayName: 'WALLET',
        couponTotalDiscount: req.body.couponTotalDiscount,
        planDetails: journalPlanDetails,
        corporateState: req.user.state || '',
        credentialId,
    });

    const corporateTxnId = new Date().valueOf();
    const publishJournal = type =>
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type,
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    const commonParams = {
        providerId: corporateTxnId,
        corporateTxnId,
        credentialId,
        serviceOperatorId: serviceDetails.id,
        corporateCashback: serviceDetails.cashback,
        accountNo: applicationId,
        transactionCategory: 'Other',
        orderAmount: amount,
        commissionType: serviceDetails.commissionType,
        cashbackType: serviceDetails.cashbackType,
        providerCommission: serviceDetails.providerCommission,
        payCashback: false,
        surcharge,
        reportData,
    };

    let transactionResponse;
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
        });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'paytmResponse')) {
        transactionResponse = await createPaytmTransaction({
            ...commonParams,
            paytmAmount: req.body.paytmAmount,
            paytmResponse: req.body.paytmResponse,
        });
    } else {
        transactionResponse = await createWalletTransaction({
            ...commonParams,
            amount,
        });
    }

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse.error, 500));
    }

    publishJournal('payment');

    // Money is taken — mark the application paid; refund if we can't record it.
    try {
        await application.update({
            paymentStatus: 'COMPLETED',
            corporateTxnId: String(corporateTxnId),
            paidAt: new Date(),
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[brPayment] application update failed after debit — refunding',
            applicationId,
            err: err.message,
        });
        await refundWalletTransaction({
            corporateTxnId,
            status: 'FAILURE',
            message: 'Business Registration application update failed',
            registeredById: req.user.registeredBy,
        });
        publishJournal('refund');
        return next(new ErrorResponse('Payment could not be recorded — amount refunded', 500));
    }

    await updateWalletTransaction({
        corporateTxnId,
        providerId: 'Not Available',
        status: 'SUCCESS',
        message: 'Payment Successful',
        orderResponse: JSON.stringify({
            applicationId,
            entityType: application.entityType,
            amount,
        }),
    });

    await generateOrderInvoiceAttachments({
        amount,
        surcharge,
        corporateTxnId,
        orderId: transactionResponse?.orderId ?? (await findOneOrder({ corporateTxnId }))?.id,
        paymentType: 'Business Registration',
        credentialId,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
        planDetails: journalPlanDetails,
        traceId: req?.LogTraceId,
    });

    // Payment notification disabled for now — re-enable when notifications/emails
    // are finalised for Business Registration.
    // createNotification({
    //     notificationTitle: 'Business Registration - Payment successful',
    //     notificationBrief: `The payment of ₹ ${(Number(amount) + Number(surcharge)).toFixed(2)} for Business Registration was successful. Transaction ID: ${corporateTxnId}.`,
    //     notificationTo: [req.user.username],
    //     notificationCategory: 'CORPORATE',
    //     notificationBy: 'ADMIN',
    // });

    // Vendor CRM lead + payment order (engagement), in the background — fail-soft,
    // stages recorded; the full chain at final submit resumes anything failed.
    if (shouldRunVendorChain(application.entityType)) {
        const logTraceId = req?.LogTraceId;
        setImmediate(() =>
            runVendorPaymentPhase(application, { logTraceId }).catch(err =>
                customLog(logTraceId, 'error', {
                    message: '[brVendorChain] payment phase error',
                    applicationId,
                    err: err.message,
                })
            )
        );
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        return res.redirect(
            `${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`
        );
    }
    return res.status(200).json({
        status: true,
        data: { ...transactionResponse, corporateTxnId },
        message: 'payment successfull',
        responseCode: '000',
    });
});

// POST /applications  { applicationId?, entityType, applicationData } -> final submit.
// Updates the paid PENDING draft to SUBMITTED with the full form data; creates a
// fresh row only when no draft exists (fallback).
exports.submitApplication = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { applicationId, entityType, applicationData } = req.body;

    if (!entityType || !ENTITY_TYPES.has(entityType)) {
        return next(new ErrorResponse('A valid entityType is required', 400));
    }
    if (!applicationData || typeof applicationData !== 'object') {
        return next(new ErrorResponse('applicationData is required', 400));
    }

    if (applicationId) {
        const application = await findApplicationById(applicationId, credentialId, corporateId);
        if (application) {
            // Only a PENDING draft (first submit) or a SUBMITTED app (re-upload +
            // re-file after a vendor doc failure) can be (re)submitted — never a
            // terminal one. Never create a duplicate for an existing id; keep the
            // original submit date and notify only on the first submit.
            if (!['PENDING', 'SUBMITTED'].includes(application.status)) {
                return next(new ErrorResponse('This application can no longer be submitted', 400));
            }
            const wasPending = application.status === 'PENDING';
            await application.update({
                entityType,
                applicationData,
                ...extractContactFields(applicationData),
                status: 'SUBMITTED',
                submittedAt: application.submittedAt ?? new Date(),
            });
            if (wasPending) sendSubmissionNotifications(application, req);
            return ok(
                res,
                {
                    applicationId: application.applicationId,
                    status: application.status,
                    paymentStatus: application.paymentStatus,
                    vendorStatus: application.vendorStatus,
                    createdAt: application.createdAt,
                },
                'Application submitted successfully'
            );
        }
    }

    // Fallback: no draft — create directly (payment state stays PENDING).
    const newApplicationId = `BR/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const application = await createApplication(credentialId, corporateId, {
        applicationId: newApplicationId,
        entityType,
        applicationData,
        ...extractContactFields(applicationData),
        ...(computePricing(entityType, await resolveMarkedUpCatalogRow(entityType, credentialId))),
        status: 'SUBMITTED',
        submittedAt: new Date(),
    });
    sendSubmissionNotifications(application, req);

    return res.status(201).json({
        status: true,
        message: 'Application submitted successfully',
        data: {
            applicationId: application.applicationId,
            status: application.status,
            paymentStatus: application.paymentStatus,
            vendorStatus: application.vendorStatus,
            createdAt: application.createdAt,
        },
        responseCode: '000',
    });
});

// Base64 payload cap for a single document (~10 MB binary ≈ 13.4 MB base64).
const MAX_DOC_BASE64_LENGTH = 14 * 1024 * 1024;

// POST /applications/:applicationId/documents  { docType, personKey?, fileName, fileString }
// One document per request (CI upload-document pattern); replaces by docType.
exports.uploadApplicationDocument = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { docType, personKey, fileName, fileString, documentNid } = req.body;

    if (!docType || !fileName || !fileString) {
        return next(new ErrorResponse('docType, fileName and fileString are required', 400));
    }
    if (String(fileString).length > MAX_DOC_BASE64_LENGTH) {
        return next(new ErrorResponse('Document exceeds the 10 MB limit', 400));
    }

    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));

    const documents = Array.isArray(application.documents) ? [...application.documents] : [];
    const existingIndex = documents.findIndex(d => d.docType === docType);
    const previous = existingIndex >= 0 ? documents[existingIndex] : null;
    // documentNid rides along for business-level (service) docs — the FE captures
    // it from the same vendor list it rendered the field from. Re-uploads (e.g.
    // fixing a vendor-rejected PAN from tracking) may omit personKey/documentNid —
    // carry them over from the entry being replaced.
    const docData = {
        docType,
        personKey: personKey ?? previous?.personKey ?? null,
        fileName,
        fileString,
        documentNid: documentNid ?? previous?.documentNid ?? null,
    };
    if (existingIndex >= 0) documents[existingIndex] = docData;
    else documents.push(docData);

    await application.update({ documents });
    return ok(res, { docType, fileName }, 'Document uploaded');
});

// POST /applications/:applicationId/documents/sync  { documents: [{ docType, personKey?, fileName, fileString, documentNid? }] }
// Per-step documents upload (Documents-step Next): merges the files into the
// draft and pushes them STRAIGHT to the vendor (the documents chain phase), then
// reports whether everything uploaded so the FE can block the step on failure.
// On success the base64 is dropped by the phase and only vendor refs remain —
// nothing base64 is persisted long-term.
exports.syncDocuments = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const incoming = Array.isArray(req.body.documents) ? req.body.documents : [];

    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));

    // Merge incoming files into the draft (upsert by docType).
    const documents = Array.isArray(application.documents) ? [...application.documents] : [];
    for (const doc of incoming) {
        if (!doc?.docType || !doc?.fileName || !doc?.fileString) continue;
        if (String(doc.fileString).length > MAX_DOC_BASE64_LENGTH) {
            return next(new ErrorResponse(`Document ${doc.fileName} exceeds the 10 MB limit`, 400));
        }
        const idx = documents.findIndex(d => d.docType === doc.docType);
        const previous = idx >= 0 ? documents[idx] : null;
        const docData = {
            docType: doc.docType,
            personKey: doc.personKey ?? previous?.personKey ?? null,
            fileName: doc.fileName,
            fileString: doc.fileString,
            documentNid: doc.documentNid ?? previous?.documentNid ?? null,
        };
        if (idx >= 0) documents[idx] = docData;
        else documents.push(docData);
    }
    await application.update({ documents });

    // Push to the vendor now — the documents phase uploads each file and drops the
    // base64, leaving only the vendor refs. Block the step if anything failed.
    if (application.paymentStatus === 'COMPLETED' && shouldRunVendorChain(application.entityType)) {
        // Only upload the doc(s) in THIS request — never re-attempt other pending
        // or previously-failed documents on a single upload.
        const onlyDocTypes = incoming.map(d => d.docType).filter(Boolean);
        await runVendorChain(application, { logTraceId: req?.LogTraceId, phaseKeys: ['documents'], onlyDocTypes });
        await application.reload();
        // Judge this request's docs by vendor ref, not the shared stage flag (sibling uploads race).
        const stored = Array.isArray(application.documents) ? application.documents : [];
        const results = application.vendorStages?.documents?.meta?.results || [];
        const missing = onlyDocTypes.filter(docType => !stored.find(d => d.docType === docType)?.vendorDocId);
        if (missing.length) {
            // Forward the vendor's reason so the FE can show a per-document error.
            const reasons = missing.map(
                docType =>
                    results.find(r => r.docType === docType && r.status === 'failed')?.reason ||
                    'Some documents could not be uploaded'
            );
            return next(new ErrorResponse([...new Set(reasons)].join('; '), 502));
        }
    }
    return ok(res, { count: incoming.length }, 'Documents uploaded');
});

// POST /applications/:applicationId/documents/view  { docId }
// Exchanges a vendor doc id — our uploads' `u` ref, or an engagement
// deliverable's doc id (COI etc. once registration completes) — for a
// short-lived signed URL (/v4/docs/view, ~10 min). The id must belong to this
// application: one of its own uploads or its engagement's documents.
exports.viewApplicationDocument = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { docId } = req.body;
    if (!docId) return next(new ErrorResponse('docId is required', 400));

    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));

    const cfg = await resolveConfig(next);
    if (!cfg) return;

    let allowed = (application.documents || []).some(d => d.vendorDocId === docId);
    if (!allowed && application.vendorEngagementId) {
        try {
            const eid = Number(String(application.vendorEngagementId).replace(/\D/g, '')) || null;
            const resp = await withRetry(() => gateway.getEngagement(cfg, { engagement_id: eid }));
            const engagement = (Array.isArray(resp?.data) ? resp.data[0] : resp?.data) || null;
            // Engagement document entry shape is unconfirmed (list empty on
            // sandbox so far) — match the likely id keys defensively.
            allowed = (engagement?.documents || []).some(entry => {
                if (typeof entry === 'string') return entry === docId;
                return [entry?.doc_id, entry?.docs_id, entry?.id, entry?.u]
                    .filter(v => v != null)
                    .map(String)
                    .includes(String(docId));
            });
        } catch (error) {
            allowed = false;
        }
    }
    if (!allowed) return next(new ErrorResponse('Document does not belong to this application', 404));

    try {
        const view = await withRetry(() =>
            gateway.docsView(cfg, { Request_Document: 'SignedURL', target_link: [docId] })
        );
        const entry = (Array.isArray(view?.redirect_uri) ? view.redirect_uri : []).find(r => r?.signed_url);
        if (!entry) return next(new ErrorResponse('Unable to generate the document link', 502));
        return ok(res, { docId, signedUrl: entry.signed_url }, 'Document link generated');
    } catch (error) {
        return next(new ErrorResponse('Unable to generate the document link', 502));
    }
});

// POST /applications/:applicationId/send-to-vendor — start (or resume) the
// IndiaFilings create-chain in the background. Idempotent: completed steps are
// skipped, so a retry after FAILED never duplicates vendor records.
exports.sendToVendor = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;

    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));
    if (!shouldRunVendorChain(application.entityType)) {
        return next(new ErrorResponse('Vendor filing is not enabled for this entity type yet', 400));
    }
    if (application.vendorStatus === 'SENDING') {
        return next(new ErrorResponse('Vendor filing is already in progress', 400));
    }
    if (application.vendorStatus === 'SENT') {
        return next(new ErrorResponse('Application has already been filed with the vendor', 400));
    }

    const logTraceId = req?.LogTraceId;
    // Run the chain and WAIT for the outcome so the final-submit step can block on
    // a real result — by final submit only the smart/GST form is left (resume
    // mode skips the done steps), so the wait is short. The FE marks the
    // application "submitted" only when this comes back ok.
    const result = await runVendorChain(application, { logTraceId }).catch(err => {
        customLog(logTraceId, 'error', {
            message: '[brVendorChain] unhandled chain error',
            applicationId: application.applicationId,
            err: err.message,
        });
        return { ok: false, error: err.message };
    });
    await application.reload();

    return ok(
        res,
        {
            applicationId: application.applicationId,
            vendorStatus: application.vendorStatus,
            failedStage: result?.failedStage,
            error: result?.error,
        },
        result && result.ok === false ? 'Vendor filing could not be completed' : 'Application filed with the vendor'
    );
});

// POST /applications/:applicationId/vendor-payment-phase — run the payment-phase
// vendor steps (lead → customer → payment → engagement → smartform1) in the
// background, right after the payment succeeds. Called by the FE the moment it
// returns from the gateway, since payments now go through Cashfree (a separate
// microservice that can't invoke this chain directly). Idempotent — completed
// steps are skipped — and the full chain at final submit backstops anything missed.
exports.runPaymentPhase = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;

    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));
    if (application.paymentStatus !== 'COMPLETED') {
        return next(new ErrorResponse('Application is not paid yet', 400));
    }
    // No-op for entity types not filed with the vendor — not an error.
    if (!shouldRunVendorChain(application.entityType)) {
        return ok(res, { applicationId: application.applicationId }, 'No vendor filing for this entity type');
    }

    const logTraceId = req?.LogTraceId;
    setImmediate(() =>
        runVendorPaymentPhase(application, { logTraceId }).catch(err =>
            customLog(logTraceId, 'error', {
                message: '[brVendorChain] payment phase error',
                applicationId: application.applicationId,
                err: err.message,
            })
        )
    );

    return ok(res, { applicationId: application.applicationId }, 'Vendor payment phase started');
});

// GET /applications/:applicationId/status — local row + best-effort live engagement.
exports.getApplicationStatus = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;

    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));

    let engagement = null;
    let peopleDocuments = [];
    const vendorPeople = application.vendorPeople || [];
    if (application.vendorGid || application.vendorEngagementId || vendorPeople.length) {
        try {
            const cfg = await gateway.getConfig();
            if (!cfg.error) {
                // VERIFIED: /payment returns display ids ('E2170004'); the lookup wants
                // the numeric eid — strip non-digits.
                const numericId = value => Number(String(value ?? '').replace(/\D/g, '')) || null;
                if (application.vendorGid || application.vendorEngagementId) {
                    const body = application.vendorEngagementId
                        ? { engagement_id: numericId(application.vendorEngagementId) }
                        : { gid: numericId(application.vendorGid) };
                    const resp = await withRetry(() => gateway.getEngagement(cfg, body));
                    engagement = (Array.isArray(resp?.data) ? resp.data[0] : resp?.data) || null;
                }
                // KYC documents per vendor person (kyc-status) — best-effort, parallel.
                if (vendorPeople.length) {
                    // Skip docs already in the engagement list (by doc_id) to avoid duplicates.
                    const engagementDocIds = new Set(
                        (engagement?.documents || [])
                            .map(d => d?.doc_id ?? d?.docs_id ?? d?.id ?? d?.u)
                            .filter(Boolean)
                            .map(String)
                    );
                    // LLP/Partnership don't collect a passport photo — one returned by
                    // person KYC is a stale leftover from an earlier app that reused this
                    // person (vendor dedupes by PAN), so drop it.
                    const dropPhoto = ['llp', 'partnership'].includes(application.entityType);
                    const results = await Promise.all(
                        vendorPeople.map(async person => {
                            try {
                                const resp = await withRetry(() =>
                                    gateway.kycStatus(cfg, {
                                        request_for: 'People',
                                        kycRequest: numericId(person.peopleId) || person.peopleId,
                                    })
                                );
                                const kyc = resp?.KYC || null;
                                const documents = (kyc?.Documents || [])
                                    .map(d => ({
                                        documentType: d?.document_type || d?.doc_info?.document_type || null,
                                        fileName: d?.file_info?.original_filename || null,
                                        docLink: d?.doc_link || null,
                                        docId: d?.doc_id || null,
                                        uploadedAt: d?.upload_info?.upload_time || null,
                                    }))
                                    .filter(
                                        d =>
                                            (d.docLink || d.docId) &&
                                            !engagementDocIds.has(String(d.docId)) &&
                                            !(dropPhoto && /photo/i.test(String(d.documentType || '')))
                                    );
                                return documents.length
                                    ? {
                                          peopleId: person.peopleId,
                                          name: kyc?.name || null,
                                          role: person.role || null,
                                          documents,
                                      }
                                    : null;
                            } catch (err) {
                                return null;
                            }
                        })
                    );
                    peopleDocuments = results.filter(Boolean);
                }
            }
        } catch (error) {
            // Live enrich is best-effort — the local row is always returned.
        }
    }

    // Keep the RM's real number (rmsim) server-side — the FE shows our masked
    // call number and reaches the RM via the call-rm endpoint (Exotel bridge).
    if (engagement && typeof engagement === 'object') {
        delete engagement.rmsim;
    }

    return ok(
        res,
        {
            applicationId: application.applicationId,
            entityType: application.entityType,
            status: application.status,
            paymentStatus: application.paymentStatus,
            vendorStatus: application.vendorStatus,
            vendorApplicationId: application.vendorApplicationId,
            vendorStages: application.vendorStages,
            vendorError: application.vendorError,
            srn: application.srn,
            feedbackGiven: application.feedbackGiven,
            createdAt: application.createdAt,
            submittedAt: application.submittedAt,
            engagement,
            peopleDocuments,
        },
        'Application status fetched'
    );
});

// POST /applications/:applicationId/call-rm (Business Registration, unique
// applicationId) or POST /call-rm { engagement_id } (any other vertical sharing
// this IndiaFiling vendor/Exotel account, e.g. Government Services — no
// application here to scope by, and its own applicationId isn't unique per
// corporate, so it's resolved by engagement_id instead, which is) — connect the
// customer to their RM through Exotel. The RM number (engagement.rmsim) never
// leaves the server; the customer only sees our ExoPhone. Exotel dials the
// customer first, then bridges the RM into the same call.
exports.callRm = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { applicationId } = req.params;
    const { engagement_id: bodyEngagementId } = req.body;

    if (!exotel.isConfigured()) {
        return next(new ErrorResponse('Calling is not available right now', 503));
    }

    let leadNumber = '';
    let engagementLookupBody = null;
    let logRef = applicationId;

    if (applicationId) {
        const application = await findApplicationById(applicationId, credentialId, corporateId);
        if (!application) return next(new ErrorResponse('Application not found', 404));

        leadNumber = toE164India(application.contactMobile);
        const numericId = value => Number(String(value ?? '').replace(/\D/g, '')) || null;
        if (application.vendorEngagementId) {
            engagementLookupBody = { engagement_id: numericId(application.vendorEngagementId) };
        } else if (application.vendorGid) {
            engagementLookupBody = { gid: numericId(application.vendorGid) };
        }
    } else {
        if (!bodyEngagementId) return next(new ErrorResponse('engagement_id is required', 400));
        logRef = bodyEngagementId;

        const govApplication = await findGovServiceApplicationByEngagementId(credentialId, bodyEngagementId);
        if (!govApplication) return next(new ErrorResponse('Application not found', 404));

        leadNumber = toE164India(govApplication.phoneNumber);
        const numericId = value => Number(String(value ?? '').replace(/\D/g, '')) || null;
        engagementLookupBody = { engagement_id: numericId(bodyEngagementId) };
    }

    if (!leadNumber) return next(new ErrorResponse('Your contact number is missing', 400));

    // RM number comes from the engagement (rmsim), resolved server-side only.
    let rmNumber = '';
    if (engagementLookupBody) {
        const cfg = await gateway.getConfig();
        if (!cfg.error) {
            try {
                const resp = await withRetry(() => gateway.getEngagement(cfg, engagementLookupBody));
                const engagement = (Array.isArray(resp?.data) ? resp.data[0] : resp?.data) || null;
                rmNumber = toE164India(engagement?.rmsim);
            } catch (error) {
                customLog(req?.LogTraceId, 'error', {
                    message: '[callRm] engagement lookup failed',
                    ref: logRef,
                    err: error.message,
                });
            }
        }
    }
    // UAT/testing: the sandbox engagement has no rmsim — fall back to a configured
    // test number so the call flow can be exercised. Unset in production, where a
    // missing RM number means the RM genuinely isn't assigned yet.
    if (!rmNumber) rmNumber = toE164India(process.env.EXOTEL_FALLBACK_RM_NUMBER);
    if (!rmNumber) return next(new ErrorResponse('Your relationship manager is not assigned yet', 409));

    try {
        const call = await exotel.connectCall({ from: leadNumber, to: rmNumber });
        return ok(res, { status: call?.Status || 'initiated' }, 'Connecting your call — your phone will ring shortly');
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[callRm] exotel connect failed',
            ref: logRef,
            status: error.response?.status,
            err: error.response?.data ? JSON.stringify(error.response.data) : error.message,
        });
        return next(new ErrorResponse('Could not connect the call. Please try again.', 502));
    }
});

// GET /applications -> the corporate's own submissions
exports.getApplications = asyncHandler(async (req, res) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await findApplicationsByCredential(credentialId, corporateId, {
        offset,
        limit: Number(limit),
        status,
    });

    return ok(res, { total: count, page: Number(page), limit: Number(limit), applications: rows }, 'Applications fetched');
});

// GET /applications/:applicationId -> full detail for one submission
exports.getApplicationDetail = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateId = req.user.corporateId;
    const application = await findApplicationById(req.params.applicationId, credentialId, corporateId);
    if (!application) return next(new ErrorResponse('Application not found', 404));
    return ok(res, application, 'Application fetched');
});
