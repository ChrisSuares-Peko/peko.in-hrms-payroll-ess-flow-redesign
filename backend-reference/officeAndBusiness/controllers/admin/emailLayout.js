'use strict';
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { validateTemplateContent } = require('../../utils/emailTemplatePlaceholders');
const {
    findLayouts,
    findLayoutById,
    createLayout,
    updateLayout,
    publishLayout,
    setLayoutActiveStatus,
    DRAFT_EDITABLE_FIELDS,
} = require('../../models/use-cases/emailLayout');

// Who the audit columns record. verifyToken puts the admin's session on req.user.
const actor = (req) => {
    const name = req.user?.username || req.user?.name || req.user?.email;
    return name ? String(name).slice(0, 100) : null;
};

const notFound = () => new ErrorResponse('Email layout not found', 404);

const contentError = (errors) => new ErrorResponse(errors.join('; '), 400);

/** GET /email-layouts — list with pagination, filters, and sort. */
exports.listEmailLayouts = asyncHandler(async (req, res) => {
    const params = {
        page: parseInt(req.query.page, 10) || 1,
        itemsPerPage: parseInt(req.query.itemsPerPage || req.query.pageSize, 10) || 10,
        search: req.query.search || req.query.searchText || '',
        type: req.query.type ? String(req.query.type).trim().toUpperCase() : undefined,
        partnerId: req.query.partnerId ? String(req.query.partnerId).trim() : undefined,
        status: req.query.status ? String(req.query.status).trim().toUpperCase() : undefined,
        isActive: req.query.isActive,
        sortField: req.query.sortField || 'updatedAt',
        sort: req.query.sort || 'DESC',
    };

    const result = await findLayouts(params);
    return res.status(200).json({
        status: true,
        message: 'Email layouts fetched successfully',
        data: {
            recordsTotal: result?.count || 0,
            rows: result?.rows || [],
        },
        responseCode: '000',
    });
});

/** GET /email-layouts/:id — full record, draft and published side by side. */
exports.getEmailLayout = asyncHandler(async (req, res, next) => {
    const layout = await findLayoutById(req.params.id);
    if (!layout) return next(notFound());

    return res.status(200).json({
        status: true,
        message: 'Email layout fetched successfully',
        data: layout,
        responseCode: '000',
    });
});

/** POST /email-layouts — always lands as DRAFT, version 1, nothing published. */
exports.createEmailLayout = asyncHandler(async (req, res, next) => {
    const { name, type, partnerId, draftHtml, isActive } = req.body;

    const contentErrors = validateTemplateContent({ htmlBody: draftHtml });
    if (contentErrors.length) return next(contentError(contentErrors));

    const created = await createLayout({
        name,
        type,
        partnerId: partnerId || null,
        draftHtml: draftHtml || null,
        status: 'DRAFT',
        isActive: isActive === undefined ? true : isActive,
        version: 1,
        updatedBy: actor(req),
    });

    if (!created) {
        customLog(req?.LogTraceId, 'error', { message: 'createEmailLayout returned no row', name, type });
        return next(new ErrorResponse('Something went wrong while creating the email layout', 500));
    }

    return res.status(201).json({
        status: true,
        message: 'Email layout created successfully',
        data: created,
        responseCode: '000',
    });
});

/** PUT /email-layouts/:id — draft-only update; publishedHtml/status/version untouched. */
exports.updateEmailLayoutDraft = asyncHandler(async (req, res, next) => {
    const existing = await findLayoutById(req.params.id);
    if (!existing) return next(notFound());

    const payload = {};
    DRAFT_EDITABLE_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    // Validate the draft as it will look after the merge, not just the delta.
    const merged = { ...existing, ...payload };
    const contentErrors = validateTemplateContent({ htmlBody: merged.draftHtml });
    if (contentErrors.length) return next(contentError(contentErrors));

    if (payload.draftHtml !== undefined) payload.draftHtml = payload.draftHtml || null;
    if (payload.partnerId !== undefined) payload.partnerId = payload.partnerId || null;
    payload.updatedBy = actor(req);

    const updated = await updateLayout(existing.id, payload);
    return res.status(200).json({
        status: true,
        message: 'Email layout draft updated successfully',
        data: updated,
        responseCode: '000',
    });
});

/** POST /email-layouts/:id/publish — copies draft to published, bumps version. */
exports.publishEmailLayout = asyncHandler(async (req, res, next) => {
    const existing = await findLayoutById(req.params.id);
    if (!existing) return next(notFound());

    if (!existing.draftHtml || !String(existing.draftHtml).trim()) {
        return next(new ErrorResponse('Cannot publish a layout with an empty draft HTML body', 400));
    }

    const contentErrors = validateTemplateContent({ htmlBody: existing.draftHtml });
    if (contentErrors.length) return next(contentError(contentErrors));

    const published = await publishLayout(existing, actor(req));
    return res.status(200).json({
        status: true,
        message: 'Email layout published successfully',
        data: published,
        responseCode: '000',
    });
});

/** PATCH /email-layouts/:id/active — kill switch; layouts are never deleted. */
exports.updateEmailLayoutActiveStatus = asyncHandler(async (req, res, next) => {
    const existing = await findLayoutById(req.params.id);
    if (!existing) return next(notFound());

    const updated = await setLayoutActiveStatus(existing.id, req.body.isActive, actor(req));
    return res.status(200).json({
        status: true,
        message: `Email layout ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
        responseCode: '000',
    });
});
