'use strict';
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { validateTemplateContent } = require('../../utils/emailTemplatePlaceholders');
const { createEmailTemplateSchema } = require('../../validations/emailTemplate');
const { findServices, findServiceByKey } = require('../../models/use-cases/emailTemplateService');
const { findKeys, findKeyByServiceIdAndKey } = require('../../models/use-cases/emailTemplateKey');
const {
    findTemplates,
    findTemplateById,
    findTemplateByServiceAndKey,
    createTemplate,
    updateTemplate,
    publishTemplate,
    setTemplateActiveStatus,
    DRAFT_EDITABLE_FIELDS,
} = require('../../models/use-cases/emailTemplate');

// Who the audit columns record. verifyToken puts the admin's session on req.user.
const actor = (req) => {
    const name = req.user?.username || req.user?.name || req.user?.email;
    return name ? String(name).slice(0, 100) : null;
};

const notFound = () => new ErrorResponse('Email template not found', 404);

const contentError = (errors) => new ErrorResponse(errors.join('; '), 400);

// Bulk import guardrail — item-level HTML is already capped by
// createEmailTemplateSchema (5 MB each); this bounds the batch as a whole.
const MAX_IMPORT_ITEMS = 500;

const serviceNotFound = (service) => new ErrorResponse(`Unknown email template service "${service}"`, 404);

/**
 * GET /email-templates/services — active services from the admin-managed registry
 * (adminEmailTemplateServices), for the admin panel's Service dropdown. Previously
 * read from the hardcoded EMAIL_TEMPLATE_KEYS_BY_SERVICE file; that file still backs
 * nothing now and can be retired once nothing else references it.
 */
exports.listEmailTemplateServices = asyncHandler(async (req, res) => {
    const services = await findServices({ isActive: true });
    return res.status(200).json({
        status: true,
        message: 'Email template services fetched successfully',
        data: services.map((service) => service.key),
        responseCode: '000',
    });
});

/** GET /email-templates/services/:service/keys — active template keys owned by one service. */
exports.listEmailTemplateKeysForService = asyncHandler(async (req, res, next) => {
    const serviceKey = String(req.params.service || '').trim().toUpperCase();
    const serviceRow = await findServiceByKey(serviceKey);
    if (!serviceRow) return next(serviceNotFound(req.params.service));

    const keys = await findKeys({ service: serviceKey, isActive: true });
    return res.status(200).json({
        status: true,
        message: 'Email template keys fetched successfully',
        data: keys.map((keyRow) => keyRow.key),
        responseCode: '000',
    });
});

/**
 * GET /email-templates/services/:service/keys/:key/variables — documented placeholders
 * for one key, from the admin-managed registry (adminEmailTemplateKeys.variables).
 */
exports.listEmailTemplateKeyVariables = asyncHandler(async (req, res, next) => {
    const serviceKey = String(req.params.service || '').trim().toUpperCase();
    const serviceRow = await findServiceByKey(serviceKey);
    if (!serviceRow) return next(serviceNotFound(req.params.service));

    const key = String(req.params.key || '').trim().toUpperCase();
    const keyRow = await findKeyByServiceIdAndKey(serviceRow.id, key);
    if (!keyRow) {
        return next(new ErrorResponse(`Unknown email template key "${req.params.key}" for service "${req.params.service}"`, 404));
    }

    return res.status(200).json({
        status: true,
        message: 'Email template key variables fetched successfully',
        data: Object.keys(keyRow.variables || {}),
        responseCode: '000',
    });
});

/** GET /email-templates — list with pagination, filters, and sort. */
exports.listEmailTemplates = asyncHandler(async (req, res) => {
    const params = {
        page: parseInt(req.query.page, 10) || 1,
        itemsPerPage: parseInt(req.query.itemsPerPage || req.query.pageSize, 10) || 10,
        search: req.query.search || req.query.searchText || '',
        service: req.query.service ? String(req.query.service).trim().toUpperCase() : undefined,
        partnerId: req.query.partnerId ? String(req.query.partnerId).trim() : undefined,
        status: req.query.status ? String(req.query.status).trim().toUpperCase() : undefined,
        isActive: req.query.isActive,
        sortField: req.query.sortField || 'updatedAt',
        sort: req.query.sort || 'DESC',
    };

    const result = await findTemplates(params);
    return res.status(200).json({
        status: true,
        message: 'Email templates fetched successfully',
        data: {
            recordsTotal: result?.count || 0,
            rows: result?.rows || [],
        },
        responseCode: '000',
    });
});

/** GET /email-templates/:id — full record, draft and published side by side. */
exports.getEmailTemplate = asyncHandler(async (req, res, next) => {
    const template = await findTemplateById(req.params.id);
    if (!template) return next(notFound());

    return res.status(200).json({
        status: true,
        message: 'Email template fetched successfully',
        data: template,
        responseCode: '000',
    });
});

/** POST /email-templates — always lands as DRAFT, version 1, nothing published. */
exports.createEmailTemplate = asyncHandler(async (req, res, next) => {
    const { key, name, service, partnerId, sender, subject, draftHtmlBody, layout, isActive } = req.body;

    const duplicate = await findTemplateByServiceAndKey(service, key, partnerId);
    if (duplicate) {
        return next(new ErrorResponse(`An email template with key "${key}" already exists for service "${service}"${partnerId ? ` and this partner` : ''}`, 409));
    }

    const contentErrors = validateTemplateContent({ subject, htmlBody: draftHtmlBody });
    if (contentErrors.length) return next(contentError(contentErrors));

    const created = await createTemplate({
        key,
        name,
        service,
        partnerId: partnerId || null,
        sender: sender || null,
        subject: subject || null,
        draftHtmlBody: draftHtmlBody || null,
        layout: layout || null,
        status: 'DRAFT',
        isActive: isActive === undefined ? true : isActive,
        version: 1,
        updatedBy: actor(req),
    });

    if (!created) {
        customLog(req?.LogTraceId, 'error', { message: 'createEmailTemplate returned no row', key, service });
        return next(new ErrorResponse('Something went wrong while creating the email template', 500));
    }

    return res.status(201).json({
        status: true,
        message: 'Email template created successfully',
        data: created,
        responseCode: '000',
    });
});

/**
 * POST /email-templates/import — bulk-create from a JSON array (same shape as
 * createEmailTemplate). One bad row never aborts the batch; response reports
 * created/updated/skipped/failed counts plus a per-row result.
 */
exports.importEmailTemplates = asyncHandler(async (req, res, next) => {
    const templates = req.body?.templates;

    if (!Array.isArray(templates)) {
        return next(new ErrorResponse('"templates" must be an array of email template objects', 400));
    }
    if (!templates.length) {
        return next(new ErrorResponse('"templates" array is empty', 400));
    }
    if (templates.length > MAX_IMPORT_ITEMS) {
        return next(new ErrorResponse(`Exceeded maximum of ${MAX_IMPORT_ITEMS} templates per import`, 400));
    }

    const overwrite = req.body?.overwrite === true;
    const updatedBy = actor(req);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const results = [];

    for (let index = 0; index < templates.length; index++) {
        const raw = templates[index];

        const { error, value } = createEmailTemplateSchema.validate(raw, { abortEarly: false, allowUnknown: false });
        if (error) {
            failed++;
            results.push({
                index, key: raw?.key, service: raw?.service, partnerId: raw?.partnerId || null,
                status: 'error', message: error.details.map((d) => d.message).join('; '),
            });
            continue;
        }

        const contentErrors = validateTemplateContent({ subject: value.subject, htmlBody: value.draftHtmlBody });
        if (contentErrors.length) {
            failed++;
            results.push({
                index, key: value.key, service: value.service, partnerId: value.partnerId || null,
                status: 'error', message: contentErrors.join('; '),
            });
            continue;
        }

        try {
            const existing = await findTemplateByServiceAndKey(value.service, value.key, value.partnerId || null);

            if (existing && !overwrite) {
                skipped++;
                results.push({
                    index, key: value.key, service: value.service, partnerId: value.partnerId || null,
                    status: 'skipped', id: existing.id,
                    message: 'A template with this service + key (+ partnerId) already exists. Resend with overwrite=true to update its draft instead.',
                });
                continue;
            }

            if (existing && overwrite) {
                const payload = { updatedBy };
                DRAFT_EDITABLE_FIELDS.forEach((field) => {
                    payload[field] = value[field] === undefined ? existing[field] : (value[field] || null);
                });
                const updatedRow = await updateTemplate(existing.id, payload);
                updated++;
                results.push({
                    index, key: value.key, service: value.service, partnerId: value.partnerId || null,
                    status: 'updated', id: updatedRow.id,
                });
                continue;
            }

            const createdRow = await createTemplate({
                key: value.key,
                name: value.name,
                service: value.service,
                partnerId: value.partnerId || null,
                sender: value.sender || null,
                subject: value.subject || null,
                draftHtmlBody: value.draftHtmlBody || null,
                layout: value.layout || null,
                status: 'DRAFT',
                isActive: value.isActive === undefined ? true : value.isActive,
                version: 1,
                updatedBy,
            });
            created++;
            results.push({
                index, key: value.key, service: value.service, partnerId: value.partnerId || null,
                status: 'created', id: createdRow.id,
            });
        } catch (rowError) {
            failed++;
            customLog(req?.LogTraceId, 'error', {
                message: 'importEmailTemplates: row failed',
                key: value.key,
                service: value.service,
                error: rowError.message,
            });
            results.push({
                index, key: value.key, service: value.service, partnerId: value.partnerId || null,
                status: 'error', message: 'Something went wrong while saving this template',
            });
        }
    }

    return res.status(200).json({
        status: true,
        message: `Import finished — ${created} created, ${updated} updated, ${skipped} skipped, ${failed} failed`,
        data: { total: templates.length, created, updated, skipped, failed, results },
        responseCode: '000',
    });
});

/** PUT /email-templates/:id — draft-only update; published fields untouched. */
exports.updateEmailTemplateDraft = asyncHandler(async (req, res, next) => {
    const existing = await findTemplateById(req.params.id);
    if (!existing) return next(notFound());

    const payload = {};
    DRAFT_EDITABLE_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    // service + partnerId are the rest of the template's identity — re-check uniqueness if either changes.
    const nextPartnerId = payload.partnerId !== undefined ? payload.partnerId : existing.partnerId;
    if ((payload.service && payload.service !== existing.service) || payload.partnerId !== undefined) {
        const duplicate = await findTemplateByServiceAndKey(
            payload.service || existing.service,
            existing.key,
            nextPartnerId,
            existing.id
        );
        if (duplicate) {
            return next(new ErrorResponse(
                `An email template with key "${existing.key}" already exists for service "${payload.service || existing.service}"${nextPartnerId ? ` and this partner` : ''}`,
                409
            ));
        }
    }

    // Validate the draft as it will look after the merge, not just the delta.
    const merged = { ...existing, ...payload };
    const contentErrors = validateTemplateContent({
        subject: merged.subject,
        htmlBody: merged.draftHtmlBody,
    });
    if (contentErrors.length) return next(contentError(contentErrors));

    if (payload.subject !== undefined) payload.subject = payload.subject || null;
    if (payload.draftHtmlBody !== undefined) payload.draftHtmlBody = payload.draftHtmlBody || null;
    if (payload.partnerId !== undefined) payload.partnerId = payload.partnerId || null;
    if (payload.sender !== undefined) payload.sender = payload.sender || null;
    payload.updatedBy = actor(req);

    const updated = await updateTemplate(existing.id, payload);
    return res.status(200).json({
        status: true,
        message: 'Email template draft updated successfully',
        data: updated,
        responseCode: '000',
    });
});

/** POST /email-templates/:id/publish — copies draft to published, bumps version. */
exports.publishEmailTemplate = asyncHandler(async (req, res, next) => {
    const existing = await findTemplateById(req.params.id);
    if (!existing) return next(notFound());

    if (!existing.draftHtmlBody || !String(existing.draftHtmlBody).trim()) {
        return next(new ErrorResponse('Cannot publish a template with an empty draft HTML body', 400));
    }
    if (!existing.subject || !String(existing.subject).trim()) {
        return next(new ErrorResponse('Cannot publish a template without a subject', 400));
    }

    const contentErrors = validateTemplateContent({
        subject: existing.subject,
        htmlBody: existing.draftHtmlBody,
    });
    if (contentErrors.length) return next(contentError(contentErrors));

    const published = await publishTemplate(existing, actor(req));
    return res.status(200).json({
        status: true,
        message: 'Email template published successfully',
        data: published,
        responseCode: '000',
    });
});

/** PATCH /email-templates/:id/active — kill switch; templates are never deleted. */
exports.updateEmailTemplateActiveStatus = asyncHandler(async (req, res, next) => {
    const existing = await findTemplateById(req.params.id);
    if (!existing) return next(notFound());

    const updated = await setTemplateActiveStatus(existing.id, req.body.isActive, actor(req));
    return res.status(200).json({
        status: true,
        message: `Email template ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
        responseCode: '000',
    });
});
