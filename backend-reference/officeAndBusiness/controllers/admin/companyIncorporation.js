const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { findAllApplications } = require('../../models/use-cases/companyIncorporation');
const { customLog } = require('../../utils/loggerHelper');
const setting = require('../../models/entities/setting');

const SETTING_KEY = 'company_incorporation_config';

const DEFAULT_CONFIG = {
    incorporationFee: 10000,
    estimatedTime: '15-25 min',
    steps: ['Basic Details', 'Directors', 'Capital', 'Business Activity', 'MOA & AOA / LLP Agreement', 'Documents', 'Review'],
    services: [
        { id: 'open_bank_account', name: 'Open Bank Account', description: 'Get assistance in opening a current account for your company', price: 5000, isActive: true },
        { id: 'commencement_of_business', name: 'Commencement of Business', description: 'File commencement of business certificate', price: 3000, isActive: true },
        { id: 'gst_registration', name: 'GST Registration', description: 'Register for Goods and Services Tax (GST)', price: 7000, isActive: true },
    ],
};

exports.getAllApplications = asyncHandler(async (req, res, next) => {
    try {
        const {
            page = 1,
            itemsPerPage = 20,
            status,
            entityType,
            searchText,
            from,
            to,
            sort,
            sortField,
            corporateId,
        } = req.query;
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(itemsPerPage, 10);

        const result = await findAllApplications({
            offset: (parsedPage - 1) * parsedLimit,
            limit: parsedLimit,
            status,
            entityType,
            searchText,
            from,
            to,
            sort,
            sortField,
            corporateId,
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

exports.getApplicationDetail = asyncHandler(async (req, res, next) => {
    try {
        const companyIncorporation = require('../../models/entities/companyIncorporation');
        const { applicationId } = req.params;

        const application = await companyIncorporation.findOne({ where: { applicationId } });

        if (!application) return next(new ErrorResponse('Application not found', 404));

        return res.status(200).json({
            status: true,
            message: 'Application fetched successfully',
            data: application,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error fetching application', error });
        return next(new ErrorResponse('Error fetching application', 500));
    }
});

exports.getIncorporationConfig = asyncHandler(async (req, res, next) => {
    try {
        const record = await setting.findOne({ where: { name: SETTING_KEY } });
        const config = record ? record.dataValues.details : DEFAULT_CONFIG;

        return res.status(200).json({
            status: true,
            message: 'Configuration fetched successfully',
            data: config,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error fetching incorporation config', error });
        return next(new ErrorResponse('Error fetching configuration', 500));
    }
});

exports.updateIncorporationConfig = asyncHandler(async (req, res, next) => {
    try {
        const { incorporationFee, services } = req.body;

        const existing = await setting.findOne({ where: { name: SETTING_KEY } });
        const current = existing ? existing.dataValues.details : DEFAULT_CONFIG;

        const updated = {
            ...current,
            ...(incorporationFee !== undefined && { incorporationFee }),
            ...(services !== undefined && { services }),
        };

        if (existing) {
            await setting.update({ details: updated }, { where: { name: SETTING_KEY } });
        } else {
            await setting.create({ name: SETTING_KEY, details: updated });
        }

        return res.status(200).json({
            status: true,
            message: 'Configuration updated successfully',
            data: updated,
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error updating incorporation config', error });
        return next(new ErrorResponse('Error updating configuration', 500));
    }
});

exports.getApplicationDocuments = asyncHandler(async (req, res, next) => {
    try {
        const companyIncorporation = require('../../models/entities/companyIncorporation');
        const { applicationId } = req.params;

        const application = await companyIncorporation.findOne({ where: { applicationId } });
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

