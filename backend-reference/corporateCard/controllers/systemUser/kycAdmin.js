const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { KYC_STATUS, kycStatusThrottleKey } = require('../../constants/kyc')
const { AUDIT_CATEGORY } = require('../../constants/cardLimits')
const { findAndCountByStatus, findById, deleteById } = require('../../models/use-cases/cardholderKyc')
const { getSubCorporatesByIds } = require('../../utils/sharedDirectory')
const { deleteValue } = require('../../utils/cacheDataMethods')
const { parsePaging, safeAudit } = require('../../utils/cardHelpers')

// ============================== TEMPORARY — MASTER-ADMIN KYC RESET TOOL ==============================
// Lets a system user list KYC-COMPLETED members and hard-delete their KYC rows one by one, so the
// matching data can be reset on the Pine Labs side and the member can re-run KYC. Remove this
// controller, its routes (routes/API/v1/systemUser/index.js /kyc-admin block), and the cardholderKyc
// use-cases findAndCountByStatus/findById/deleteById when the reset tooling is no longer needed.
// =====================================================================================================

// GET …/system_user/:userId/corporate-cards/kyc-admin/completed?page&itemsPerPage&searchText(mobile)
exports.listCompletedKyc = asyncHandler(async (req, res) => {
    const searchText = typeof req.query.searchText === 'string' ? req.query.searchText : undefined
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAndCountByStatus({ kycStatus: KYC_STATUS.COMPLETED, searchText, limit, offset })

    // Best-effort name enrichment via the admin directory batch (shared DB through the gateway on the
    // system-user tree) — the list still renders with mobile numbers when the directory is unreachable.
    let members = new Map()
    try {
        members = await getSubCorporatesByIds(rows.map((r) => r.subCorporateId), req)
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[KycAdmin] member-name enrichment failed — listing with mobile numbers only',
            error: err?.message,
        }, 'INTERNAL')
    }

    const data = rows.map((r) => {
        const member = r.subCorporateId ? members.get(String(r.subCorporateId)) : null
        return {
            id: r.id,
            subCorporateId: r.subCorporateId,
            corporateId: r.corporateId,
            name: member?.name || null,
            email: member?.email || null,
            mobileNumber: r.mobileNumber,
            kycStatus: r.kycStatus,
            provider: r.provider || null,
            completedAt: r.updatedAt,
        }
    })

    return res.status(200).json({
        status: true,
        message: 'Completed KYC records fetched.',
        data: { count, rows: data },
        responseCode: '000',
    })
})

// DELETE …/system_user/:userId/corporate-cards/kyc-admin/:id — hard-delete ONE KYC row + its status
// throttle, so the member re-runs KYC from scratch once Pine Labs resets their data.
exports.deleteKycRecord = asyncHandler(async (req, res, next) => {
    const { id } = req.params
    if (!/^\d+$/.test(String(id))) return next(new ErrorResponse('A valid KYC record id is required.', 400))

    const record = await findById(id)
    if (!record) return next(new ErrorResponse('KYC record not found.', 404))

    await deleteById(id)
    // Clear the 5-minute status-poll cooldown so the member's next status check hits the vendor fresh.
    await deleteValue(kycStatusThrottleKey(record.mobileNumber))

    await safeAudit(req?.LogTraceId, {
        corporateId: record.corporateId,
        subCorporateId: record.subCorporateId,
        action: 'KYC_DATA_DELETED',
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: req.user?.id,
        actorDisplay: `${req.user?.name || 'System user'} (System Admin)`,
        title: 'KYC record deleted (admin reset)',
        description: `KYC record for mobile ending ${String(record.mobileNumber).slice(-4)} deleted via the temporary master-admin reset tool.`,
        oldValue: { kycStatus: record.kycStatus, kycType: record.kycType },
        metadata: { kycRecordId: Number(id) },
    })

    return res.status(200).json({
        status: true,
        message: 'KYC record deleted.',
        data: { id: Number(id), subCorporateId: record.subCorporateId },
        responseCode: '000',
    })
})
