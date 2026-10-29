'use strict';
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const {
    findServices,
    findServiceById,
    findServiceByKey,
    createService,
    setServiceActiveStatus,
} = require('../../models/use-cases/emailTemplateService');

// Who the audit columns record. verifyToken puts the admin's session on req.user.
const actor = (req) => {
    const name = req.user?.username || req.user?.name || req.user?.email;
    return name ? String(name).slice(0, 100) : null;
};

const notFound = () => new ErrorResponse('Email template service not found', 404);

/**
 * GET /email-template-services — admin registry list, filterable by search/isActive,
 * paginated the same way as GET /email-templates. findServices stays unpaginated
 * (the Email Template editor's Service dropdown needs every active row, not a page
 * of them) — sliced here instead, which is cheap at this registry's scale (tens of
 * rows, not thousands).
 */
exports.listEmailTemplateServices = asyncHandler(async (req, res) => {
    const allServices = await findServices({
        search: req.query.search || '',
        isActive: req.query.isActive,
    });

    const page = parseInt(req.query.page, 10) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage || req.query.pageSize, 10) || 10;
    const start = (page - 1) * itemsPerPage;

    return res.status(200).json({
        status: true,
        message: 'Email template services fetched successfully',
        data: {
            recordsTotal: allServices.length,
            rows: allServices.slice(start, start + itemsPerPage),
        },
        responseCode: '000',
    });
});

/** GET /email-template-services/:id */
exports.getEmailTemplateService = asyncHandler(async (req, res, next) => {
    const service = await findServiceById(req.params.id);
    if (!service) return next(notFound());

    return res.status(200).json({
        status: true,
        message: 'Email template service fetched successfully',
        data: service,
        responseCode: '000',
    });
});

/** POST /email-template-services — always starts active unless isActive is explicitly false. */
exports.createEmailTemplateService = asyncHandler(async (req, res, next) => {
    const { key, isActive } = req.body;

    const existing = await findServiceByKey(key);
    if (existing) return next(new ErrorResponse(`Email template service "${key}" already exists`, 409));

    const created = await createService({
        key,
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: actor(req),
    });

    return res.status(201).json({
        status: true,
        message: 'Email template service created successfully',
        data: created,
        responseCode: '000',
    });
});

/** PATCH /email-template-services/:id/active — operational kill switch; never hard-deleted. */
exports.updateEmailTemplateServiceActiveStatus = asyncHandler(async (req, res, next) => {
    const existing = await findServiceById(req.params.id);
    if (!existing) return next(notFound());

    const updated = await setServiceActiveStatus(req.params.id, req.body.isActive, actor(req));
    return res.status(200).json({
        status: true,
        message: `Email template service ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
        responseCode: '000',
    });
});
