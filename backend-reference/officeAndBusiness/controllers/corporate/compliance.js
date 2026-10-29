const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { uploadFileToS3, getFileFromS3 } = require('../../utils/s3');
const { createNotification } = require('../../models/use-cases/notification');
const emailer = require('../../utils/emailer');
const { resolveComplianceApplicationCreatedEmail, resolveComplianceDocumentsSubmittedEmail } = require('../../utils/emailTemplates/compliance');
const { partnerLogos } = require('../../utils/partnerLogos');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { v4: uuidv4 } = require('uuid');
const {
    findAllCompliance,
    findComplianceById,
    findComplianceByComplianceId,
    createCompliance,
    submitDocuments,
    getDashboardSummary,
} = require('../../models/use-cases/compliance');

// GET /compliance/find-all
exports.getAllCompliance = asyncHandler(async (req, res, next) => {
    try {
        const corporateId = req.user.corporateId;
        const { searchText, page, pageSize, from, to, status, category } = req.query;

        const result = await findAllCompliance(corporateId, {
            page,
            pageSize,
            searchText,
            from,
            to,
            status,
            category,
        });

        return res.status(200).json({
            status: true,
            message: 'Compliance records fetched successfully',
            data: {
                rows: result.rows,
                recordsTotal: result.count,
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// GET /compliance/find?id=
exports.getComplianceDetail = asyncHandler(async (req, res, next) => {
    try {
        const corporateId = req.user.corporateId;
        const { id } = req.query;

        if (!id) {
            return next(new ErrorResponse('id is required', 400));
        }

        const record = await findComplianceById(id, corporateId);

        if (!record) {
            return next(new ErrorResponse('Compliance record not found', 404));
        }

        return res.status(200).json({
            status: true,
            message: 'Compliance record fetched successfully',
            data: record,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// GET /compliance/dashboard/summary
exports.getDashboardSummary = asyncHandler(async (req, res, next) => {
    try {
        const corporateId = req.user.corporateId;

        const summary = await getDashboardSummary(corporateId);

        return res.status(200).json({
            status: true,
            message: 'Dashboard summary fetched successfully',
            data: summary,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// POST /compliance/
exports.createCompliance = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id;
        const corporateId = req.user.corporateId;
        const { title, description, complianceType, category, section, dueDate, companyInfo, formData } = req.validatedBody;

        const record = await createCompliance(credentialId, corporateId, {
            title,
            description,
            complianceType,
            category,
            section,
            dueDate: dueDate || null,
            companyInfo: companyInfo || {},
            formData: formData || {},
        });

        if (!record) {
            return next(new ErrorResponse('Failed to create compliance record', 500));
        }

        customLog(req?.LogTraceId, 'info', { message: 'Compliance record created', complianceId: record.complianceId });

        const createUserName = req.user?.name || req.user?.username || 'User';
        const createUserEmail = req.user?.email;

        try {
            await createNotification({
                notificationTitle: 'Compliance Application Received',
                notificationBrief: `Your compliance application for ${record.title} (${record.complianceType} - ${record.complianceId}) has been received. Please upload your documents to proceed.`,
                notificationTo: req.user?.username,
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });
        } catch (notifErr) {
            customLog(req?.LogTraceId, 'error', { action: 'createCompliance:notification', error: notifErr.message });
        }

        if (createUserEmail) {
            try {
                const partnerDetails = req.user?.registeredBy
                    ? await fetchPartnerDetails(req.user.registeredBy)
                    : await partnerLogos();
                const { subject, html, sender } = await resolveComplianceApplicationCreatedEmail({
                    name: createUserName,
                    complianceId: record.complianceId,
                    complianceType: record.complianceType,
                    title: record.title,
                    partnerDetails,
                    partnerId: req.user?.registeredBy || null,
                    logTraceId: req?.LogTraceId,
                    fallbackSubject: `Compliance Application Received - ${record.complianceType}`,
                });
                emailer.email(createUserEmail, subject, html, () => {
                    customLog(req?.LogTraceId, 'info', { action: 'createCompliance:email', createUserEmail });
                }, sender);
            } catch (emailErr) {
                customLog(req?.LogTraceId, 'error', { action: 'createCompliance:email:error', error: emailErr.message });
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Compliance record created successfully',
            data: { complianceId: record.complianceId, id: record.id },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// GET /compliance/document/download?url=
exports.downloadComplianceDocument = asyncHandler(async (req, res, next) => {
    try {
        const { url } = req.query;
        if (!url) return next(new ErrorResponse('url is required', 400));

        const { pathname } = new URL(url);
        const key = decodeURIComponent(pathname.replace(/^\//, ''));

        // Only serve files from the caller's own compliance namespace — the arbitrary
        // S3 key in ?url= must never reach another tenant's objects. Compliance docs are
        // stored under compliance/{corporateId}/ (see submitDocuments).
        if (!key.startsWith(`compliance/${req.user.corporateId}/`)) {
            return next(new ErrorResponse('Document not found', 404));
        }

        const { buffer, contentType } = await getFileFromS3(key);
        const filename = key.split('/').pop() || 'document';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// PUT /compliance/:complianceId/submit-documents
exports.submitDocuments = asyncHandler(async (req, res, next) => {
    try {
        const corporateId = req.user.corporateId;
        const { complianceId } = req.params;
        const { documents, notes, formData } = req.validatedBody;

        const existing = await findComplianceByComplianceId(complianceId, corporateId);

        if (!existing) {
            return next(new ErrorResponse('Compliance record not found', 404));
        }

        const uploadedDocs = await Promise.all(
            documents.map(async (doc) => {
                const base64Clean = doc.base64.replace(/^data:[^;]+;base64,/, '');
                const ext = doc.mimeType === 'application/pdf' ? 'pdf'
                    : doc.mimeType === 'image/png' ? 'png' : 'jpg';
                const filePath = `compliance/${corporateId}/${complianceId}`;
                const url = await uploadFileToS3(base64Clean, filePath, ext);
                return { id: uuidv4(), key: doc.key, name: doc.name, url, uploadedAt: new Date().toISOString() };
            })
        );

        const updated = await submitDocuments(existing.id, corporateId, uploadedDocs, notes, formData);

        if (!updated) {
            return next(new ErrorResponse('Failed to submit documents', 500));
        }

        customLog(req?.LogTraceId, 'info', { message: 'Compliance documents submitted', complianceId, count: uploadedDocs.length });

        const submitUserName = req.user?.name || req.user?.username || 'User';
        const submitUserEmail = req.user?.email;

        try {
            await createNotification({
                notificationTitle: 'Compliance Documents Submitted',
                notificationBrief: `Your documents for ${existing.title} (${existing.complianceType} - ${complianceId}) have been received and are under review.`,
                notificationTo: req.user?.username,
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });
        } catch (notifErr) {
            customLog(req?.LogTraceId, 'error', { action: 'submitDocuments:notification', error: notifErr.message });
        }

        if (submitUserEmail) {
            try {
                const partnerDetails = req.user?.registeredBy
                    ? await fetchPartnerDetails(req.user.registeredBy)
                    : await partnerLogos();
                const { subject, html, sender } = await resolveComplianceDocumentsSubmittedEmail({
                    name: submitUserName,
                    complianceId,
                    complianceType: existing.complianceType,
                    title: existing.title,
                    partnerDetails,
                    partnerId: req.user?.registeredBy || null,
                    logTraceId: req?.LogTraceId,
                    fallbackSubject: `Compliance Documents Submitted - ${existing.complianceType}`,
                });
                emailer.email(submitUserEmail, subject, html, () => {
                    customLog(req?.LogTraceId, 'info', { action: 'submitDocuments:email', submitUserEmail });
                }, sender);
            } catch (emailErr) {
                customLog(req?.LogTraceId, 'error', { action: 'submitDocuments:email:error', error: emailErr.message });
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Documents submitted successfully',
            data: { documents: uploadedDocs },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});
