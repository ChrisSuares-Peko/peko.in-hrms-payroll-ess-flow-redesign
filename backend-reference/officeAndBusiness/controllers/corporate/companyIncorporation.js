const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { createNotification } = require('../../models/use-cases/notification');
const {
    createApplication,
    findActiveApplicationByCorporate,
    findApplicationById,
    findApplicationsByCredential,
    appendDocumentToApplication,
    updateVendorStages,
    updateVendorDocuments,
    updatePendingApplication,
} = require('../../models/use-cases/companyIncorporation');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const {
    uploadDocumentToVendor,
    getVendorApplicationStatus,
    getVendorDocuments,
    fetchVendorFileStream,
    createDraftApplication,
} = require('../../utils/vendorGateway');
const withRetry = require('../../utils/withRetry');
const { customLog } = require('../../utils/loggerHelper');
const getNicList = require('../../models/use-cases/nicCodes');
const setting = require('../../models/entities/setting');

const SETTING_KEY = 'company_incorporation_config';

const MCA_FEE_SLABS = [
    { max: 1500000,  fee: 0 },
    { max: 2500000,  fee: 2000 },
    { max: 5000000,  fee: 5000 },
    { max: 10000000, fee: 10000 },
    { max: 50000000, fee: 25000 },
    { max: Infinity, fee: 50000 },
];

function getMcaFilingFee(entityType, authorizedCapital) {
    if (entityType === 'llp') return 0;
    const capital = Number(authorizedCapital) || 0;
    const slab = MCA_FEE_SLABS.find(s => capital <= s.max);
    return slab ? slab.fee : 50000;
}

const POST_INCORPORATION_SERVICES = [
    { id: 'open_bank_account', name: 'Open Bank Account', description: 'Get assistance in opening a current account for your company', price: 5000 },
    { id: 'commencement_of_business', name: 'Commencement of Business', description: 'File commencement of business certificate', price: 3000 },
    { id: 'gst_registration', name: 'GST Registration', description: 'Register for Goods and Services Tax (GST)', price: 7000 },
];

// KYC and office documents required from the user in the Documents step
const REQUIRED_DOCUMENTS = {
    private_limited: ['registeredOfficeProof', 'rentLeaseAgreement', 'nocFromOwner', 'utilityBill', 'nameAvailabilityCertificate'],
    public_limited: ['registeredOfficeProof', 'rentLeaseAgreement', 'nocFromOwner', 'utilityBill', 'nameAvailabilityCertificate'],
    opc: ['registeredOfficeProof', 'rentLeaseAgreement', 'nocFromOwner', 'utilityBill', 'nameAvailabilityCertificate'],
    llp: ['registeredOfficeProof', 'rentLeaseAgreement', 'nocFromOwner', 'utilityBill', 'nameAvailabilityCertificate'],
};

// All valid docType values accepted by the upload-document endpoint
// Director KYC docs follow the pattern: director_{index}_{type} — validated by regex below
const STATIC_DOC_TYPES = new Set([
    // Office & KYC documents (user-uploaded in Documents step)
    'registered_office_proof',
    'rent_lease_agreement',
    'rent_or_lease_deed',
    'noc_from_owner',
    'utility_bill',
    'title_or_utility_doc',
    'name_availability_certificate',
    'trademark_certificate',
    // MOA/AOA — auto-generated (standard) or user-uploaded (custom)
    'moa_draft',
    'aoa_draft',
    'moa_custom',
    'aoa_custom',
    // LLP agreement — auto-generated standard or user-uploaded custom
    'llp_agreement_draft',
    'llp_agreement_custom',
]);

// Matches dynamic director KYC docTypes: director_0_photo, director_1_pan, etc.
const DIRECTOR_DOC_PATTERN = /^director_\d+_(photo|aadhaar|pan|phone_bill|bank_statement|din_certificate|dsc_proof|signature|proof_of_identity|proof_of_address|passport)$/;

const isValidDocType = (docType) =>
    STATIC_DOC_TYPES.has(docType) || DIRECTOR_DOC_PATTERN.test(docType);


exports.getLandingConfig = asyncHandler(async (req, res, next) => {
    try {
        const record = await setting.findOne({ where: { name: SETTING_KEY } });
        const db = record ? record.dataValues.details : null;

        const rawServices = db?.services ?? POST_INCORPORATION_SERVICES;
        const activeServices = rawServices
            .filter(s => s.isActive !== false)
            .map(s => { const r = { ...s }; delete r.isActive; return r; });

        return res.status(200).json({
            status: true,
            message: 'Configuration fetched successfully',
            data: {
                incorporationFee: db?.incorporationFee ?? 10000,
                estimatedTime: db?.estimatedTime ?? '15-25 min',
                steps: db?.steps ?? ['Basic Details', 'Directors', 'Capital', 'Business Activity', 'MOA & AOA / LLP Agreement', 'Documents', 'Review'],
                services: activeServices,
                requiredDocuments: REQUIRED_DOCUMENTS,
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error fetching config', error });
        return next(new ErrorResponse('Error fetching configuration', 500));
    }
});

exports.submitApplication = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const corporateId = req.user.corporateId;
        const { entityType, applicantDetails, proposedNames, registeredOffice, directors, additionalShareholders, nominee, llpNicCodes, llpTotalCapital, capital, businessActivity, moaAoa, llpAgreement, selectedServices } = req.validatedBody;

        // Pricing is computed against the *current* admin config for both
        // create-new and update-existing paths so admin price changes propagate.
        const configRecord = await setting.findOne({ where: { name: SETTING_KEY } });
        const dbConfig = configRecord ? configRecord.dataValues.details : null;
        const activeServices = (dbConfig?.services ?? POST_INCORPORATION_SERVICES).filter(s => s.isActive !== false);
        const baseIncorporationFee = dbConfig?.incorporationFee ?? 10000;

        const normalizedServices = Array.isArray(selectedServices) ? selectedServices : [];
        const additionalFee = activeServices
            .filter(s => normalizedServices.includes(s.id))
            .reduce((sum, svc) => sum + svc.price, 0);
        const mcaFilingFee = getMcaFilingFee(entityType, capital?.authorizedCapital);
        const totalAmount = baseIncorporationFee + additionalFee + mcaFilingFee;

        // Fields shared between create + update (everything except applicationId,
        // documents, and status — those are managed separately).
        const applicationFields = {
            entityType,
            applicantDetails,
            proposedNames,
            registeredOffice,
            directors,
            additionalShareholders: additionalShareholders || [],
            nominee: nominee || null,
            llpNicCodes: llpNicCodes || null,
            llpTotalCapital: llpTotalCapital || null,
            capital,
            businessActivity,
            moaAoa: moaAoa || null,
            llpAgreement: llpAgreement || null,
            selectedServices: normalizedServices,
            incorporationFee: baseIncorporationFee,
            additionalServicesFee: additionalFee,
            mcaFilingFee,
            totalAmount,
        };

        const existingApplication = await findActiveApplicationByCorporate(corporateId);

        if (existingApplication) {
            // Real duplicate — already past PENDING. Still block.
            if (existingApplication.status !== 'PENDING') {
                return res.status(400).json({
                    status: false,
                    message: 'An application already exists for this corporate. Only one application is allowed per corporate.',
                    data: { applicationId: existingApplication.applicationId, status: existingApplication.status },
                    responseCode: '001',
                });
            }

            // PENDING — idempotent re-submit. Update fields + pricing in place,
            // reuse the same applicationId. Documents are preserved.
            const updated = await updatePendingApplication(existingApplication.applicationId, applicationFields);

            customLog(req?.LogTraceId, 'info', { message: 'Pending application updated on re-submit', applicationId: updated.applicationId, credentialId });

            // Ensure a vendor draft exists so document uploads can attach against it.
            // Idempotent: if vendorSetupId is already set, skip the call.
            if (!updated.vendorSetupId) {
                const serviceDetails = await findServiceOperatorByAccessKey('company_incorporation');
                if (serviceDetails?.error) return next(new ErrorResponse('Vendor service unavailable', 503));
                const apiUrl = serviceDetails.vendor?.apiUrl;
                const apiKey = serviceDetails.vendor?.optional1;
                if (!apiUrl || !apiKey) return next(new ErrorResponse('Vendor configuration missing', 503));
                try {
                    const vendorDraft = await withRetry(() => createDraftApplication(apiUrl, apiKey, updated));
                    await updated.update({
                        vendorSetupId: vendorDraft._id,
                        vendorApplicationId: vendorDraft.application_id,
                        vendorTrackingId: vendorDraft.tracking_id || null,
                    });
                } catch (vendorErr) {
                    customLog(req?.LogTraceId, 'error', { message: 'Vendor draft creation failed (re-submit path)', applicationId: updated.applicationId, err: vendorErr.message });
                    return next(new ErrorResponse('Could not register application with provider. Please try again.', 502));
                }
            }

            return res.status(200).json({
                status: true,
                message: 'Application updated successfully',
                data: { applicationId: updated.applicationId, totalAmount, mcaFilingFee, status: updated.status, createdAt: updated.createdAt },
                responseCode: '000',
            });
        }

        // No existing application — create new.
        const applicationId = `INC/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

        const application = await createApplication(credentialId, corporateId, {
            applicationId,
            ...applicationFields,
            documents: [],
            status: 'PENDING',
        });

        // Register a draft on the vendor so document uploads can attach against it.
        // If this fails the row is left without a vendorSetupId; the user retries via
        // the PENDING re-submit branch which will then create the draft.
        {
            const serviceDetails = await findServiceOperatorByAccessKey('company_incorporation');
            if (serviceDetails?.error) return next(new ErrorResponse('Vendor service unavailable', 503));
            const apiUrl = serviceDetails.vendor?.apiUrl;
            const apiKey = serviceDetails.vendor?.optional1;
            if (!apiUrl || !apiKey) return next(new ErrorResponse('Vendor configuration missing', 503));
            try {
                const vendorDraft = await withRetry(() => createDraftApplication(apiUrl, apiKey, application));
                await application.update({
                    vendorSetupId: vendorDraft._id,
                    vendorApplicationId: vendorDraft.application_id,
                    vendorTrackingId: vendorDraft.tracking_id || null,
                });
            } catch (vendorErr) {
                customLog(req?.LogTraceId, 'error', { message: 'Vendor draft creation failed (new application)', applicationId, err: vendorErr.message });
                return next(new ErrorResponse('Could not register application with provider. Please try again.', 502));
            }
        }

        await createNotification({
            notificationTitle: 'Company Incorporation Application Created',
            notificationBrief: `Your application ${applicationId} has been created and is pending payment.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        customLog(req?.LogTraceId, 'info', { message: 'Application created', applicationId, credentialId });

        return res.status(201).json({
            status: true,
            message: 'Application created successfully',
            data: { applicationId: application.applicationId, totalAmount, mcaFilingFee, status: application.status, createdAt: application.createdAt },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error submitting application', error });
        return next(new ErrorResponse('Error submitting application', 500));
    }
});

exports.uploadDocument = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const { applicationId, docType, fileBase64, fileName, mimeType } = req.body;

        if (!applicationId || !docType || !fileBase64 || !fileName || !mimeType) {
            return next(new ErrorResponse('applicationId, docType, fileBase64, fileName and mimeType are required', 400));
        }

        if (!isValidDocType(docType)) {
            return next(new ErrorResponse(`Invalid docType: '${docType}'`, 400));
        }

        const application = await findApplicationById(applicationId, credentialId, req.user.corporateId);
        if (!application) return next(new ErrorResponse('Application not found', 404));

        const serviceDetails = await findServiceOperatorByAccessKey('company_incorporation');
        if (serviceDetails?.error) return next(new ErrorResponse('Vendor service unavailable', 503));

        const apiUrl = serviceDetails.vendor?.apiUrl;
        const apiKey = serviceDetails.vendor?.optional1;
        if (!apiUrl || !apiKey) return next(new ErrorResponse('Vendor configuration missing', 503));

        // Strip data URL prefix if present (e.g. "data:application/pdf;base64,")
        const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;

        if (!application.vendorSetupId) {
            return next(new ErrorResponse('Application is not registered with the vendor yet. Please re-submit the application.', 409));
        }

        const { vendorUrl, vendorFileRefUrl } = await withRetry(() =>
            uploadDocumentToVendor(apiUrl, apiKey, base64Data, fileName, application.vendorSetupId)
        );

        const document = await appendDocumentToApplication(applicationId, credentialId, req.user.corporateId, {
            docType,
            fileName,
            vendorUrl,
            vendorFileRefUrl,
            mimeType,
        });

        customLog(req?.LogTraceId, 'info', { message: 'Document uploaded to vendor', applicationId, docType });

        return res.status(200).json({
            status: true,
            message: 'Document uploaded successfully',
            data: document,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error uploading document',error: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Error uploading document', 500));
    }
});

exports.getApplications = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const corporateId = req.user.corporateId;
        const { page = 1, limit = 10, status } = req.query;
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);

        const result = await findApplicationsByCredential(credentialId, corporateId, {
            offset: (parsedPage - 1) * parsedLimit,
            limit: parsedLimit,
            status,
        });

        return res.status(200).json({
            status: true,
            message: 'Applications fetched successfully',
            data: {
                applications: result.rows,
                total: result.count,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(result.count / parsedLimit),
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error fetching applications', error });
        return next(new ErrorResponse('Error fetching applications', 500));
    }
});

const REGISTERED_RE = /success|registered|approved|incorporat/i;
const isRegisteredFromStages = (stages) => {
    if (!Array.isArray(stages) || stages.length === 0) return false;
    const last = stages[stages.length - 1];
    return last?.state === 'completed' && REGISTERED_RE.test(`${last.title || ''} ${last.description || ''}`);
};

exports.getApplicationDetail = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const corporateId = req.user.corporateId;
        const { applicationId } = req.params;

        const application = await findApplicationById(applicationId, credentialId, corporateId);
        if (!application) return next(new ErrorResponse('Application not found', 404));

        const setupId = application.vendorSetupId;
        if (setupId) {
            try {
                const serviceDetails = await findServiceOperatorByAccessKey('company_incorporation');
                const apiUrl = serviceDetails.vendor?.apiUrl;
                const apiKey = serviceDetails.vendor?.optional1;
                if (apiUrl && apiKey) {
                    const stages = await getVendorApplicationStatus(apiUrl, apiKey, setupId);
                    await updateVendorStages(applicationId, stages);
                    application.vendorStages = stages;

                    const registered = application.status === 'APPROVED' || isRegisteredFromStages(stages);
                    if (registered && application.vendorDocuments == null) {
                        customLog(req?.LogTraceId, 'info', {
                            message: 'Fetching vendor documents for registered application',
                            applicationId,
                            setupId,
                        });
                        try {
                            const documents = await getVendorDocuments(apiUrl, apiKey, setupId);
                            await updateVendorDocuments(applicationId, documents);
                            application.vendorDocuments = documents;
                            customLog(req?.LogTraceId, 'info', {
                                message: 'Vendor documents fetched and stored',
                                applicationId,
                                sectionCount: Array.isArray(documents?.sections) ? documents.sections.length : 0,
                            });
                        } catch (docErr) {
                            customLog(req?.LogTraceId, 'error', {
                                message: 'Failed to fetch vendor documents (non-fatal)',
                                applicationId,
                                error: docErr.message,
                            });
                        }
                    }
                }
            } catch (stageErr) {
                customLog(req?.LogTraceId, 'info', {
                    message: 'Failed to fetch vendor stages (non-fatal)',
                    error: stageErr.message,
                });
            }
        }

        const appData = application.toJSON();

        return res.status(200).json({
            status: true,
            message: 'Application fetched successfully',
            data: appData,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error fetching application', error });
        return next(new ErrorResponse('Error fetching application', 500));
    }
});


exports.getApplicationDocuments = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const { applicationId } = req.params;

        const application = await findApplicationById(applicationId, credentialId, req.user.corporateId);
        if (!application) return next(new ErrorResponse('Application not found', 404));

        return res.status(200).json({
            status: true,
            message: 'Documents fetched successfully',
            data: application.documents || [],
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error fetching documents', error });
        return next(new ErrorResponse('Error fetching documents', 500));
    }
});

exports.downloadVendorDocument = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const corporateId = req.user.corporateId;
        const { applicationId } = req.params;
        const { fieldId } = req.query;

        if (!fieldId) return next(new ErrorResponse('fieldId is required', 400));

        const application = await findApplicationById(applicationId, credentialId, corporateId);
        if (!application) return next(new ErrorResponse('Application not found', 404));

        // Look up the file in the app's own vendorDocuments only (never a client URL).
        const sections = Array.isArray(application.vendorDocuments?.sections)
            ? application.vendorDocuments.sections
            : [];
        let file = null;
        sections.forEach((section) => {
            (section.instances || []).forEach((instance) => {
                (instance.fields || []).forEach((f) => {
                    if (!file && f.type === 'file' && (f.field === fieldId || f.name === fieldId) && f.value?.url) {
                        file = f.value;
                    }
                });
            });
        });

        if (!file) return next(new ErrorResponse('Document not found', 404));

        const vendorResp = await fetchVendorFileStream(file.url);
        const fileName = String(file.name || 'document').replace(/"/g, '');
        res.setHeader('Content-Type', file.type || vendorResp.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        if (vendorResp.headers['content-length']) {
            res.setHeader('Content-Length', vendorResp.headers['content-length']);
        }

        vendorResp.data.on('error', (streamErr) => {
            customLog(req?.LogTraceId, 'error', { message: 'Vendor document stream error', applicationId, error: streamErr.message });
            if (!res.headersSent) next(new ErrorResponse('Failed to download document', 502));
        });
        vendorResp.data.pipe(res);
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error downloading vendor document', error: error.message });
        if (!res.headersSent) return next(new ErrorResponse('Error downloading document', 500));
    }
});

exports.getNIC = asyncHandler(async (req, res, next) => {
    try {
        const { parent } = req.query;

        const data = await getNicList({ parent });

        return res.json({
            status: true,
            message: 'Documents fetched successfully',
            data,
            responseCode: '000',
        });
    } catch (error) {
        console.error("NIC Controller Error:", error);
        return next(new ErrorResponse('Error fetching documents', 500));
    }
})