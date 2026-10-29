const { Op } = require('sequelize');

const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { findAllApplications } = require('../../models/use-cases/businessRegistration');
const { runVendorChain, shouldRunVendorChain } = require('../../utils/businessRegistrationVendorChain');
const { customLog } = require('../../utils/loggerHelper');

// Admin tracking list — mirrors controllers/admin/companyIncorporation.getAllApplications,
// with the extra paymentStatus filter the businessRegistration use-case supports.
exports.getAllApplications = asyncHandler(async (req, res, next) => {
    try {
        const {
            page = 1,
            itemsPerPage = 20,
            status,
            entityType,
            paymentStatus,
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
            paymentStatus,
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

// POST /applications/:applicationId/send-to-vendor — admin retry of the vendor
// chain (vendor failures are only visible on the admin side). Same guards as the
// corporate route plus a paid-only check; the chain itself skips done stages.
exports.retryVendorChain = asyncHandler(async (req, res, next) => {
    try {
        const businessRegistration = require('../../models/entities/businessRegistration');
        const { applicationId } = req.params;

        // forceSmartForm2: file Smart Form 2 even if documents aren't uploaded —
        // the RM collects any missing docs separately (docs are deferred, not failed).
        const forceSmartForm2 = Boolean(req.body?.forceSmartForm2);

        const application = await businessRegistration.findOne({ where: { applicationId } });
        if (!application) return next(new ErrorResponse('Application not found', 404));
        if (!shouldRunVendorChain(application.entityType)) {
            return next(new ErrorResponse('Vendor filing is not enabled for this entity type', 400));
        }
        if (application.paymentStatus !== 'COMPLETED') {
            return next(new ErrorResponse('Payment is not completed for this application', 400));
        }
        if (application.vendorStatus === 'SENT') {
            return next(new ErrorResponse('Application has already been filed with the vendor', 400));
        }

        // Atomic claim — a concurrent trigger (second admin, corporate submit in
        // flight) loses the conditional update and gets a clean 400.
        const [claimed] = await businessRegistration.update(
            { vendorStatus: 'SENDING' },
            { where: { applicationId, vendorStatus: { [Op.notIn]: ['SENDING', 'SENT'] } } }
        );
        if (!claimed) return next(new ErrorResponse('Vendor filing is already in progress', 400));

        const logTraceId = req?.LogTraceId;
        setImmediate(() =>
            runVendorChain(application, { logTraceId, forceSmartForm2 }).catch(err =>
                customLog(logTraceId, 'error', {
                    message: '[brVendorChain] unhandled chain error (admin retry)',
                    applicationId: application.applicationId,
                    err: err.message,
                })
            )
        );

        return res.status(200).json({
            status: true,
            message: 'Vendor filing restarted',
            data: { applicationId: application.applicationId, vendorStatus: 'SENDING' },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Error restarting vendor filing', error });
        return next(new ErrorResponse('Error restarting vendor filing', 500));
    }
});

exports.getApplicationDetail = asyncHandler(async (req, res, next) => {
    try {
        const businessRegistration = require('../../models/entities/businessRegistration');
        const { applicationId } = req.params;

        const application = await businessRegistration.findOne({ where: { applicationId } });

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
