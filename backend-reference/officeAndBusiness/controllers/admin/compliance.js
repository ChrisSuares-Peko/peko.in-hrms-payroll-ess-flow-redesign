const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { getFileFromS3 } = require('../../utils/s3');
const { createNotification } = require('../../models/use-cases/notification');
const emailer = require('../../utils/emailer');
const { resolveComplianceStatusUpdateEmail } = require('../../utils/emailTemplates/compliance');
const { partnerLogos } = require('../../utils/partnerLogos');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const {
    findAllComplianceAdmin,
    findComplianceByIdAdmin,
    updateComplianceStatus,
} = require('../../models/use-cases/compliance');

// GET /compliance/find-all
exports.getAllComplianceAdmin = asyncHandler(async (req, res, next) => {
    try {
        const { searchText, page, itemsPerPage, from, to, status, sort, sortField } = req.query;

        const result = await findAllComplianceAdmin({
            page,
            itemsPerPage,
            searchText,
            from,
            to,
            status,
            sort,
            sortField,
        });

        return res.status(200).json({
            status: true,
            message: 'Compliance records fetched successfully',
            data: {
                rows: result.rows,
                count: result.count,
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// GET /compliance/find?id=
exports.getComplianceDetailAdmin = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id) {
            return next(new ErrorResponse('id is required', 400));
        }

        const record = await findComplianceByIdAdmin(id);

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

// GET /compliance/:complianceId/documents
exports.getComplianceDocumentsAdmin = asyncHandler(async (req, res, next) => {
    try {
        const { complianceId } = req.params;

        const record = await findComplianceByIdAdmin(null, complianceId);

        if (!record) {
            return next(new ErrorResponse('Compliance record not found', 404));
        }

        return res.status(200).json({
            status: true,
            message: 'Documents fetched successfully',
            data: { documents: record.documents || [] },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// GET /compliance/document/download?url=&disposition=inline|attachment
exports.downloadComplianceDocument = asyncHandler(async (req, res, next) => {
    try {
        const { url, disposition = 'inline' } = req.query;
        if (!url) return next(new ErrorResponse('url is required', 400));

        const { pathname } = new URL(url);
        const key = decodeURIComponent(pathname.replace(/^\//, ''));

        const { buffer, contentType } = await getFileFromS3(key);
        const filename = key.split('/').pop() || 'document';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});

// PUT /compliance/update-status
exports.updateComplianceStatus = asyncHandler(async (req, res, next) => {
    try {
        const { id, status, adminStatus, remarks, adminRemarks, rejectedDocumentKeys, rejectedFormFields } = req.validatedBody;
        const resolvedStatus = status || adminStatus;
        const resolvedRemarks = remarks || adminRemarks;

        const record = await findComplianceByIdAdmin(id);

        if (!record) {
            return next(new ErrorResponse('Compliance record not found', 404));
        }

        const updated = await updateComplianceStatus(id, resolvedStatus, resolvedRemarks, rejectedDocumentKeys, rejectedFormFields);

        if (!updated) {
            return next(new ErrorResponse('Failed to update compliance status', 500));
        }

        customLog(req?.LogTraceId, 'info', { message: 'Compliance status updated', id, status });

        const customerName = record['corporateUser.name'] || record.corporateUser?.name || 'User';
        const customerEmail = record['corporateUser.email'] || record.corporateUser?.email;
        const customerUsername = record['credential.username'] || record.credential?.username;

        const notifTitles = {
            approved:     'Compliance Approved',
            rejected:     'Compliance Rejected',
            reopened:     'Compliance Reopened',
            under_review: 'Compliance Under Review',
        };
        const notifBriefs = {
            approved:     `Your ${record.complianceType} compliance application ${record.complianceId} (${record.title}) has been approved.`,
            rejected:     `Your ${record.complianceType} compliance application ${record.complianceId} (${record.title}) has been rejected.${resolvedRemarks ? ` Remarks: ${resolvedRemarks}` : ''}`,
            reopened:     `Your ${record.complianceType} compliance application ${record.complianceId} (${record.title}) has been reopened.${resolvedRemarks ? ` Remarks: ${resolvedRemarks}` : ''}`,
            under_review: `Your ${record.complianceType} compliance application ${record.complianceId} (${record.title}) is now under review.`,
        };

        if (customerUsername) {
            try {
                await createNotification({
                    notificationTitle: notifTitles[resolvedStatus] || `Compliance ${resolvedStatus}`,
                    notificationBrief: notifBriefs[resolvedStatus] || `Your compliance application ${record.complianceId} status has been updated to ${resolvedStatus}.`,
                    notificationTo: customerUsername,
                    notificationCategory: 'CORPORATE',
                    notificationBy: 'ADMIN',
                });
            } catch (notifErr) {
                customLog(req?.LogTraceId, 'error', { action: 'updateComplianceStatus:notification', error: notifErr.message });
            }
        }

        if (customerEmail) {
            try {
                const emailSubjects = {
                    approved:     `Compliance Approved - ${record.complianceType}`,
                    rejected:     `Compliance Rejected - ${record.complianceType}`,
                    reopened:     `Compliance Reopened - ${record.complianceType}`,
                    under_review: `Compliance Under Review - ${record.complianceType}`,
                };
                // corporateUser.registeredBy is only present if the use-case loads it
                const registeredBy = record['corporateUser.registeredBy'] || record.corporateUser?.registeredBy || null;
                const partnerDetails = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
                const { subject, html, sender } = await resolveComplianceStatusUpdateEmail({
                    name: customerName,
                    complianceId: record.complianceId,
                    complianceType: record.complianceType,
                    title: record.title,
                    status: resolvedStatus,
                    remarks: resolvedRemarks,
                    partnerDetails,
                    partnerId: registeredBy,
                    logTraceId: req?.LogTraceId,
                    fallbackSubject: emailSubjects[resolvedStatus] || `Compliance Application Update - ${record.complianceType}`,
                });
                emailer.email(customerEmail, subject, html, () => {
                    customLog(req?.LogTraceId, 'info', { action: 'updateComplianceStatus:email', customerEmail });
                }, sender);
            } catch (emailErr) {
                customLog(req?.LogTraceId, 'error', { action: 'updateComplianceStatus:email:error', error: emailErr.message });
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Compliance status updated successfully',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
});
