'use strict';
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { findServiceByKey } = require('../../models/use-cases/emailTemplateService');
const {
    findKeys,
    findKeyById,
    findKeyByServiceIdAndKey,
    createKey,
    setKeyActiveStatus,
    setKeyVariables,
} = require('../../models/use-cases/emailTemplateKey');

const actor = (req) => {
    const name = req.user?.username || req.user?.name || req.user?.email;
    return name ? String(name).slice(0, 100) : null;
};

const notFound = () => new ErrorResponse('Email template key not found', 404);

const serviceNotFound = (service) => new ErrorResponse(`Unknown email template service "${service}"`, 404);

/**
 * GET /email-template-keys — admin registry list, filterable by search/service/isActive,
 * paginated the same way as GET /email-templates. findKeys stays unpaginated (the
 * editor's Key dropdown needs every active row for the selected service) — sliced
 * here instead, which is cheap at this registry's scale (hundreds of rows, not
 * thousands).
 */
exports.listEmailTemplateKeys = asyncHandler(async (req, res, next) => {
    let service;
    if (req.query.service) {
        service = String(req.query.service).trim().toUpperCase();
        const serviceRow = await findServiceByKey(service);
        if (!serviceRow) {
            return next(new ErrorResponse(`No email template service with key "${service}" exists`, 400));
        }
    }

    const allKeys = await findKeys({
        search: req.query.search || '',
        service,
        isActive: req.query.isActive,
    });

    const page = parseInt(req.query.page, 10) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage || req.query.pageSize, 10) || 10;
    const start = (page - 1) * itemsPerPage;

    return res.status(200).json({
        status: true,
        message: 'Email template keys fetched successfully',
        data: {
            recordsTotal: allKeys.length,
            rows: allKeys.slice(start, start + itemsPerPage),
        },
        responseCode: '000',
    });
});

/** GET /email-template-keys/:id */
exports.getEmailTemplateKey = asyncHandler(async (req, res, next) => {
    const key = await findKeyById(req.params.id);
    if (!key) return next(notFound());

    return res.status(200).json({
        status: true,
        message: 'Email template key fetched successfully',
        data: key,
        responseCode: '000',
    });
});

/** POST /email-template-keys — resolves the service string to its FK id. */
exports.createEmailTemplateKey = asyncHandler(async (req, res, next) => {
    const { key, service, isActive } = req.body;

    const serviceRow = await findServiceByKey(service);
    if (!serviceRow) return next(serviceNotFound(service));

    const existing = await findKeyByServiceIdAndKey(serviceRow.id, key);
    if (existing) return next(new ErrorResponse(`Email template key "${key}" already exists for service "${service}"`, 409));

    const created = await createKey({
        key,
        serviceId: serviceRow.id,
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: actor(req),
    });

    return res.status(201).json({
        status: true,
        message: 'Email template key created successfully',
        data: created,
        responseCode: '000',
    });
});

/** PATCH /email-template-keys/:id/active */
exports.updateEmailTemplateKeyActiveStatus = asyncHandler(async (req, res, next) => {
    const existing = await findKeyById(req.params.id);
    if (!existing) return next(notFound());

    const updated = await setKeyActiveStatus(req.params.id, req.body.isActive, actor(req));
    return res.status(200).json({
        status: true,
        message: `Email template key ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
        responseCode: '000',
    });
});

/**
 * PUT /email-template-keys/variables — identified by (service, key) text, not
 * numeric id, matching the AE reference implementation's convention. Full replace:
 * a variable name omitted from the payload is removed from the row.
 */
exports.updateEmailTemplateKeyVariables = asyncHandler(async (req, res, next) => {
    const { service, key, variables } = req.body;

    const serviceRow = await findServiceByKey(service);
    if (!serviceRow) return next(serviceNotFound(service));

    const keyRow = await findKeyByServiceIdAndKey(serviceRow.id, key);
    if (!keyRow) return next(new ErrorResponse(`Unknown email template key "${key}" for service "${service}"`, 404));

    const updated = await setKeyVariables(keyRow.id, variables, actor(req));
    return res.status(200).json({
        status: true,
        message: 'Email template key variables updated successfully',
        data: updated,
        responseCode: '000',
    });
});
