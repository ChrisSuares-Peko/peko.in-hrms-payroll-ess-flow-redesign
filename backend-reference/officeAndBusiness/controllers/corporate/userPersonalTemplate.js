'use strict';

const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { create, findAll, findById } = require('../../models/use-cases/userPersonalTemplate');
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails');
const operatorsData = require('../../utils/operatorsData.json');

exports.savePersonalTemplate = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await fetchServiceDetails({
            credentialId: req.user.id,
            corporateUserId: req.user.corporateId,
            packageId: req.user.packageId,
            accessKey: operatorsData.legalService.accessKey,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails.error, 402));
        }

        const corporateUserId = req.user.corporateId;
        const subCorporateUserId = req.user.subCorporateId || null;
        const { title, iconKey, category, timeEstimate, html } = req.body;

        const template = await create({
            corporateUserId,
            subCorporateUserId,
            title,
            iconKey: iconKey || null,
            category: category || null,
            timeEstimate: timeEstimate || null,
            html,
        });

        return res.status(201).json({
            status: true,
            data: template,
            message: 'Personal template saved successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getPersonalTemplates = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const offset = limit ? (page - 1) * limit : undefined;
        const searchText = req.query.searchText || undefined;

        const params = { corporateUserId, limit, offset, searchText };
        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const result = await findAll({ ...params, logTraceId: req?.LogTraceId });

        return res.status(200).json({
            status: true,
            data: { data: result.rows, count: result.count },
            message: 'Personal templates fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getPersonalTemplateById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const template = await findById(id, req.user.corporateId);

        if (!template) {
            return res.status(404).json({ status: false, message: 'Personal template not found', responseCode: '404' });
        }

        return res.status(200).json({
            status: true,
            data: template,
            message: 'Personal template fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});



