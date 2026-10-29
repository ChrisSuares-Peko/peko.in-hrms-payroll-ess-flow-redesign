const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { pickControls, withDefaults } = require('../../constants/corporateSettings')
const { AUDIT_CATEGORY } = require('../../constants/cardLimits')
const {
    findByCorporate,
    upsertByCorporate,
} = require('../../models/use-cases/corporateCardAdminApplication')
const { actorCredentialId, adminActor, safeAudit } = require('../../utils/cardHelpers')

exports.getNotificationControls = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const application = await findByCorporate(corporateId)

    return res.status(200).json({
        status: true,
        message: 'Notification controls fetched.',
        data: { notificationControls: withDefaults(application?.notificationControls) },
        responseCode: '000',
    })
})

exports.updateNotificationControls = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const { controls, error } = pickControls(req.body)
    if (error) return next(new ErrorResponse(error, 400))

    const application = await findByCorporate(corporateId)
    if (!application) {
        return next(new ErrorResponse('Complete your KYB before changing these settings.', 403))
    }

    const merged = withDefaults({ ...withDefaults(application.notificationControls), ...controls })
    await upsertByCorporate(corporateId, { notificationControls: merged })

    customLog(req?.LogTraceId, 'info', {
        message: '[CorporateSettings] Notification controls updated',
        corporateId,
        changed: Object.keys(controls),
    }, 'CONSOLE')

    await safeAudit(req?.LogTraceId, {
        corporateId,
        action: 'SETTINGS_UPDATED',
        category: AUDIT_CATEGORY.CONTROLS,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: adminActor(req),
        title: 'Notification controls updated',
        description: `Updated ${Object.keys(controls).join(', ')}.`,
        metadata: { changed: controls },
    })

    return res.status(200).json({
        status: true,
        message: 'Settings saved.',
        data: { notificationControls: merged },
        responseCode: '000',
    })
})
