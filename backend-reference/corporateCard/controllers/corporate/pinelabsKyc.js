const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { pinelabsRequest, isPinelabsSuccess, resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const {
    PINELABS_FULL_KYC_INITIATE_PATH,
    PINELABS_KYC_STATUS_PATH,
    PINELABS_KYC_ALREADY_COMPLETED_CODE,
} = require('../../constants/pinelabs')
const {
    KYC_STATUS,
    KYC_TYPE,
    KYC_REQUEST_STATUS_LABELS,
    FULL_KYC_REQUEST_STATUS_LABELS,
    FULL_KYC_MODE_LABELS,
    FULL_KYC_DOCUMENT_LABELS,
    VIDEO_KYC_STATUS_LABELS,
    KYC_STATUS_POLL_THROTTLE_SECONDS,
    KYC_STATUS_POLL_THROTTLE_ACTIVE_SECONDS,
    kycStatusThrottleKey,
} = require('../../constants/kyc')
const { GENERIC_ERROR } = require('../../constants/messages')
const { upsertByMobile, findByMobile } = require('../../models/use-cases/cardholderKyc')
const { getValue, setValue } = require('../../utils/cacheDataMethods')
const { MOBILE_REGEX, vendorResponseCode, cardholderColumnsForSession, actorCredentialId, cardholderProfile } = require('../../utils/cardHelpers')

const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/

const isLinkValid = (kycLink) => {
    const t = new Date(kycLink?.linkExpiryDateTime).getTime()
    return Number.isFinite(t) && t > Date.now() + 60_000
}

const FULL_KYC_COMPLETED_STATUS = 15
const FULL_KYC_COMPLIANCE_FAILED = 23
const VIDEO_KYC_IN_PROGRESS = 3
const VIDEO_KYC_IN_REVIEW = 4
const VIDEO_KYC_APPROVED = 5
const VIDEO_KYC_REJECTED = 6

const KYC_DERIVED_STATE = {
    COMPLETED: 'COMPLETED',
    IN_REVIEW: 'IN_REVIEW',
    IN_PROGRESS: 'IN_PROGRESS',
    REJECTED: 'REJECTED',
    ACTION_REQUIRED: 'ACTION_REQUIRED',
}

const deriveKycState = (kycData) => {
    const full = kycData?.fullKYCData
    const fullStatus = Number(full?.fullKYCRequestStatus)
    const videoStatus = Number(full?.videoKYCData?.videoKYCRequestStatus)
    if (fullStatus === FULL_KYC_COMPLETED_STATUS && videoStatus === VIDEO_KYC_APPROVED) return KYC_DERIVED_STATE.COMPLETED
    if (videoStatus === VIDEO_KYC_IN_REVIEW) return KYC_DERIVED_STATE.IN_REVIEW
    if (videoStatus === VIDEO_KYC_IN_PROGRESS) return KYC_DERIVED_STATE.IN_PROGRESS
    if (videoStatus === VIDEO_KYC_REJECTED || fullStatus === FULL_KYC_COMPLIANCE_FAILED) return KYC_DERIVED_STATE.REJECTED
    return KYC_DERIVED_STATE.ACTION_REQUIRED
}

const stateNeedsLink = (state) =>
    state === KYC_DERIVED_STATE.ACTION_REQUIRED ||
    state === KYC_DERIVED_STATE.REJECTED ||
    state === KYC_DERIVED_STATE.IN_PROGRESS

const stateToInternalStatus = (state) => {
    if (state === KYC_DERIVED_STATE.COMPLETED) return KYC_STATUS.COMPLETED
    if (state === KYC_DERIVED_STATE.REJECTED) return KYC_STATUS.REJECTED
    return KYC_STATUS.PENDING
}

const decode = (map, code) =>
    (code === null || code === undefined ? null : { code, label: map[code] || 'Unknown' })

const labelWithFallback = (description, map, code) =>
    description || decode(map, code)?.label || 'Unknown'

const buildFullKycStatusView = (kycData) => {
    if (!kycData) return null
    const full = kycData.fullKYCData || null
    const state = deriveKycState(kycData)

    return {
        state,
        requestStatus: decode(KYC_REQUEST_STATUS_LABELS, kycData.kycRequestStatus),
        isCompleted: state === KYC_DERIVED_STATE.COMPLETED,
        kycLink: stateNeedsLink(state) ? full?.kycLink || null : null,
        rejectionReason: full?.videoKYCData?.rejectionReason || null,
        fullKyc: full && {
            requestStatus: {
                code: full.fullKYCRequestStatus,
                label: labelWithFallback(
                    full.fullKYCRequestStatusDescription,
                    FULL_KYC_REQUEST_STATUS_LABELS,
                    full.fullKYCRequestStatus
                ),
            },
            mode: decode(FULL_KYC_MODE_LABELS, full.fullKYCMode),
            documentType: decode(FULL_KYC_DOCUMENT_LABELS, full.fullKYCDocumentType),
            documentCustomerName: full.fullKYCDocumentCustomerName || null,
            completedOn: full.fullKYCCompletedOn || null,
            expiresOn: full.fullKYCExpiresOn || null,
            kycLink: full.kycLink || null,
            videoKyc: full.videoKYCData && {
                requestStatus: {
                    code: full.videoKYCData.videoKYCRequestStatus,
                    label: labelWithFallback(
                        full.videoKYCData.videoKYCRequestStatusDescription,
                        VIDEO_KYC_STATUS_LABELS,
                        full.videoKYCData.videoKYCRequestStatus
                    ),
                },
                rejectionReason: full.videoKYCData.rejectionReason || null,
            },
        },
    }
}

const kycRefId = (record) => {
    if (!record?.id) return null
    const d = new Date(record.createdAt)
    if (Number.isNaN(d.getTime())) return `KYC-${record.id}`
    const yy = String(d.getUTCFullYear()).slice(-2)
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    return `KYC-${yy}${mm}${record.id}`
}

const viewFromRecord = (record) => {
    const view = buildFullKycStatusView(record?.statusSnapshot) || {
        state: KYC_DERIVED_STATE.ACTION_REQUIRED,
        requestStatus: null,
        isCompleted: false,
        kycLink: null,
        rejectionReason: null,
        fullKyc: null,
    }
    if (record?.kycStatus === KYC_STATUS.COMPLETED) {
        view.state = KYC_DERIVED_STATE.COMPLETED
        view.isCompleted = true
    } else if (record?.kycStatus === KYC_STATUS.REJECTED) {
        view.state = KYC_DERIVED_STATE.REJECTED
    }
    if (stateNeedsLink(view.state) && !view.kycLink && isLinkValid(record?.kycLink)) {
        view.kycLink = record.kycLink
    }
    view.refId = kycRefId(record)
    view.submittedOn = record?.createdAt ?? null
    return view
}

exports.initiateFullKyc = asyncHandler(async (req, res, next) => {
    const { dateOfBirth } = req.body || {}

    // Read from the session's own employee profile: submitting KYC with an empty name and mobile fails at
    // the vendor, far from where the blank came from.
    const self = cardholderProfile(req)
    const customerName = (self.name || '').trim()
    const mobile = String(self.mobileNo || '')
    const email = self.email
    if (!customerName || customerName.length > 50) {
        return next(new ErrorResponse('Your profile has no valid name for KYC. Please update your profile.', 400))
    }
    if (!MOBILE_REGEX.test(mobile)) {
        return next(new ErrorResponse('Your profile has no valid 10-digit mobile number for KYC. Please update your profile.', 400))
    }
    if (dateOfBirth && !DOB_REGEX.test(dateOfBirth)) {
        return next(new ErrorResponse('Date of birth must be in YYYY-MM-DD format.', 400))
    }

    const ownership = {
        corporateId: req.user?.corporateId,
        ...cardholderColumnsForSession(req),
        credentialId: actorCredentialId(req),
    }

    const existing = await findByMobile(mobile)
    if (existing?.kycStatus === KYC_STATUS.COMPLETED) {
        return res.status(200).json({
            status: true,
            message: 'KYC is already approved.',
            data: { state: KYC_DERIVED_STATE.COMPLETED, kycStatus: KYC_STATUS.COMPLETED, alreadyCompleted: true },
            responseCode: '000',
        })
    }

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const statusResult = await pinelabsRequest({
        method: 'post',
        path: PINELABS_KYC_STATUS_PATH,
        creds,
        body: { mobileNumber: Number(mobile) },
        logTraceId: req?.LogTraceId,
        label: 'KYC status (initiate)',
        suppressErrorLog: true,
    })

    const respondCompleted = async (snapshot) => {
        await upsertByMobile(mobile, {
            ...ownership,
            kycType: KYC_TYPE.FULL,
            kycStatus: KYC_STATUS.COMPLETED,
            ...(snapshot ? { statusSnapshot: snapshot } : {}),
            provider: 'ISSUANCE',
        })
        return res.status(200).json({
            status: true,
            message: 'KYC is already approved.',
            data: { state: KYC_DERIVED_STATE.COMPLETED, kycStatus: KYC_STATUS.COMPLETED, alreadyCompleted: true },
            responseCode: '000',
        })
    }

    if (vendorResponseCode(statusResult) === PINELABS_KYC_ALREADY_COMPLETED_CODE) {
        return respondCompleted(null)
    }

    const snapshot = isPinelabsSuccess(statusResult) ? statusResult.data?.kycData || null : null
    const state = snapshot ? deriveKycState(snapshot) : KYC_DERIVED_STATE.ACTION_REQUIRED

    if (state === KYC_DERIVED_STATE.COMPLETED) {
        return respondCompleted(snapshot)
    }

    if (state === KYC_DERIVED_STATE.IN_REVIEW) {
        await upsertByMobile(mobile, {
            ...ownership,
            kycType: KYC_TYPE.FULL,
            kycStatus: KYC_STATUS.PENDING,
            ...(snapshot ? { statusSnapshot: snapshot } : {}),
            provider: 'ISSUANCE',
        })
        return res.status(200).json({
            status: true,
            message: 'Your KYC is under review.',
            data: { state },
            responseCode: '000',
        })
    }

    const canResumeWithExistingLink =
        state === KYC_DERIVED_STATE.ACTION_REQUIRED || state === KYC_DERIVED_STATE.IN_PROGRESS

    if (canResumeWithExistingLink && isLinkValid(existing?.kycLink)) {
        await upsertByMobile(mobile, {
            ...ownership,
            kycType: KYC_TYPE.FULL,
            kycStatus: KYC_STATUS.PENDING,
            ...(snapshot ? { statusSnapshot: snapshot } : {}),
            provider: 'ISSUANCE',
        })
        return res.status(200).json({
            status: true,
            message: 'Full KYC already initiated. Complete verification using the link.',
            data: { state, kycLink: existing.kycLink, customerSignature: existing.customerSignature },
            responseCode: '000',
        })
    }

    const body = { customerName, mobileNumber: mobile }
    if (email) body.email = email
    if (dateOfBirth) body.dateOfBirth = dateOfBirth

    const result = await pinelabsRequest({
        method: 'post',
        path: PINELABS_FULL_KYC_INITIATE_PATH,
        body,
        creds,
        logTraceId: req?.LogTraceId,
        label: 'Full KYC initiate',
    })

    if (vendorResponseCode(result) === PINELABS_KYC_ALREADY_COMPLETED_CODE) {
        return respondCompleted(null)
    }

    if (!isPinelabsSuccess(result)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Pinelabs] Full KYC initiate failed',
            responseCode: result.data?.responseCode,
            responseMessage: result.data?.responseMessage,
            error: result.error,
        }, 'VENDOR')
        return next(new ErrorResponse(GENERIC_ERROR, 502))
    }

    const isRejectedRetry = state === KYC_DERIVED_STATE.REJECTED
    const customerSignature = result.data.additionalInfo?.customerSignature
    await upsertByMobile(mobile, {
        ...ownership,
        kycType: KYC_TYPE.FULL,
        kycStatus: stateToInternalStatus(state),
        kycLink: result.data.kycLink || null,
        customerSignature,
        ...(snapshot ? { statusSnapshot: snapshot } : {}),
        provider: 'ISSUANCE',
    })

    const data = { state, kycLink: result.data.kycLink, customerSignature }
    if (isRejectedRetry) data.rejectionReason = snapshot?.fullKYCData?.videoKYCData?.rejectionReason || null
    return res.status(200).json({
        status: true,
        message: isRejectedRetry
            ? 'Your previous KYC was rejected. Complete verification again using the link.'
            : 'Full KYC initiated. Complete verification using the link.',
        data,
        responseCode: '000',
    })
})

exports.kycStatus = asyncHandler(async (req, res, next) => {
    const mobile = String(cardholderProfile(req).mobileNo || '')

    if (!MOBILE_REGEX.test(mobile)) {
        return next(new ErrorResponse('Your profile has no valid 10-digit mobile number for KYC. Please update your profile.', 400))
    }

    const ownership = {
        corporateId: req.user?.corporateId,
        ...cardholderColumnsForSession(req),
        credentialId: actorCredentialId(req),
    }

    const record = await findByMobile(mobile)

    const isTerminal = record?.kycStatus === KYC_STATUS.COMPLETED
    const throttled = !isTerminal && Boolean(await getValue(kycStatusThrottleKey(mobile)))

    if (isTerminal || throttled) {
        return res.status(200).json({
            status: true,
            message: 'KYC status fetched.',
            data: { kyc: viewFromRecord(record) },
            responseCode: '000',
        })
    }

    const { error, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) {
        customLog(req?.LogTraceId, 'error', { message: '[CardKyc] Service/vendor unavailable for KYC status; serving not-started view', error }, 'CONSOLE')
        return res.status(200).json({
            status: true,
            message: 'KYC status fetched.',
            data: { kyc: viewFromRecord(record) },
            responseCode: '000',
        })
    }

    const result = await pinelabsRequest({
        method: 'post',
        path: PINELABS_KYC_STATUS_PATH,
        creds,
        body: { mobileNumber: Number(mobile) },
        logTraceId: req?.LogTraceId,
        label: 'KYC status',
        suppressErrorLog: true,
    })

    await setValue(kycStatusThrottleKey(mobile), KYC_STATUS_POLL_THROTTLE_ACTIVE_SECONDS, '1')

    if (vendorResponseCode(result) === PINELABS_KYC_ALREADY_COMPLETED_CODE) {
        await upsertByMobile(mobile, {
            ...ownership,
            kycType: KYC_TYPE.FULL,
            kycStatus: KYC_STATUS.COMPLETED,
            provider: 'ISSUANCE',
        })
        return res.status(200).json({
            status: true,
            message: 'KYC is already approved.',
            data: {
                kyc: {
                    state: KYC_DERIVED_STATE.COMPLETED,
                    requestStatus: null,
                    isCompleted: true,
                    kycLink: null,
                    rejectionReason: null,
                    fullKyc: null,
                    refId: kycRefId(record),
                    submittedOn: record?.createdAt ?? null,
                },
            },
            responseCode: '000',
        })
    }

    if (!isPinelabsSuccess(result)) {
        return res.status(200).json({
            status: true,
            message: 'KYC status fetched.',
            data: { kyc: viewFromRecord(record) },
            responseCode: '000',
        })
    }

    const snapshot = result.data?.kycData || null
    const kyc = buildFullKycStatusView(snapshot)
    if (kyc && stateNeedsLink(kyc.state) && !kyc.kycLink && isLinkValid(record?.kycLink)) {
        kyc.kycLink = record.kycLink
    }
    if (kyc) {
        kyc.refId = kycRefId(record)
        kyc.submittedOn = record?.createdAt ?? null
    }

    await upsertByMobile(mobile, {
        ...ownership,
        ...(kyc ? { kycType: KYC_TYPE.FULL, kycStatus: stateToInternalStatus(kyc.state) } : {}),
        ...(snapshot ? { statusSnapshot: snapshot } : {}),
        provider: 'ISSUANCE',
    })

    if (kyc?.state === KYC_DERIVED_STATE.IN_REVIEW) {
        await setValue(kycStatusThrottleKey(mobile), KYC_STATUS_POLL_THROTTLE_SECONDS, '1')
    }

    return res.status(200).json({
        status: true,
        message: 'KYC status fetched.',
        data: { kyc: kyc || viewFromRecord(record) },
        responseCode: '000',
    })
})
