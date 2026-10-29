const ErrorResponse = require('../utils/error-response')
const { customLog } = require('../utils/loggerHelper')
const { GENERIC_ERROR } = require('../constants/messages')
const { ESIGN_STATUS } = require('../constants/corporateAgreement')
const { DOC } = require('../constants/kybDocuments')
const {
    DISPATCH_LOCK_TTL_SECONDS,
    DISPATCH_PDF_NAME,
    TERMINAL_LOCK_TTL_SECONDS,
    DOCKET_TITLE,
    EXPIRY_DAYS,
    REFRESH_THROTTLE_SECONDS,
    SIGNATURE_TAG,
    SIGNED_PDF_NAME,
    SIGNING_POLICY,
    UPSTREAM_STATUS,
    dispatchLockKey,
    refreshThrottleKey,
    terminalLockKey,
} = require('../constants/corporateAgreementEsign')
const { client } = require('../utils/cacheDataMethods')
const { getDocumentDecrypted, uploadFileEncryptedToS3 } = require('../utils/s3')
const { createCorporateDocument } = require('../models/use-cases/corporateDocuments')
const { dispatchAgreement: dispatchUpstream, fetchAgreementStatus } = require('../utils/esignClient')
const {
    findByCorporate: findApplication,
    upsertByCorporate: upsertApplication,
} = require('../models/use-cases/corporateCardAdminApplication')
const { upsertByCorporate: upsertAgreement } = require('../models/use-cases/corporateCardAgreement')

const { NODE_ENV } = process.env

const signedFolderFor = (corporateId) => `${NODE_ENV || 'staging'}/corporate/${corporateId}/KYB-Documents`

const expiryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + EXPIRY_DAYS)
    return date.toISOString().slice(0, 10)
}

const acquireLock = async (key, ttl = DISPATCH_LOCK_TTL_SECONDS) => {
    try {
        const result = await client.set(key, '1', { NX: true, EX: ttl })
        return result === 'OK'
    } catch (error) {
        customLog(null, 'error', {
            message: '[AgreementEsign] Could not acquire the dispatch lock',
            key,
            error: error?.message,
        }, 'CONSOLE')
        return true
    }
}

const releaseLock = async (key) => {
    try {
        await client.del(key)
    } catch (error) {
        customLog(null, 'error', {
            message: '[AgreementEsign] Could not release the dispatch lock',
            key,
            error: error?.message,
        }, 'CONSOLE')
    }
}

/**
 * Hands the attempt back to the corporate.
 *
 * The caller stamps PENDING_DISPATCH before calling in, and the upload screen hides the agreement form for
 * as long as esignStatus is set and not FAILED — so a refusal that leaves the status alone strands them on
 * "Preparing Your Agreement" with no form to correct and no way to try again. FAILED is the one status that
 * reopens the form.
 */
const failDispatch = async (corporateId, reason) => {
    await upsertApplication(corporateId, {
        esignStatus: ESIGN_STATUS.FAILED,
        esignFailureReason: String(reason || 'Dispatch failed').slice(0, 500),
    })
}

const dispatch = async ({ corporateId, application, agreement, req }) => {
    if (!agreement?.generatedPdfKey) {
        customLog(req?.LogTraceId, 'error', {
            message: '[AgreementEsign] Refusing to dispatch — the agreement has no PDF',
            corporateId,
            hasDocx: Boolean(agreement?.generatedDocumentKey),
        }, 'CONSOLE')
        const message = 'The agreement could not be prepared for signature. Please try again in a few minutes.'
        await failDispatch(corporateId, message)
        throw new ErrorResponse(message, 503)
    }

    if (!agreement.signatoryEmail || !agreement.signatoryName) {
        const message = 'Add the authorised signatory details before sending for e-signature.'
        await failDispatch(corporateId, message)
        throw new ErrorResponse(message, 400)
    }

    // Deliberately NOT marked FAILED: another request holds the lock and is dispatching right now, so its
    // PENDING_DISPATCH is accurate and overwriting it would report a failure that is not happening.
    const lockKey = dispatchLockKey(corporateId)
    if (!await acquireLock(lockKey)) {
        throw new ErrorResponse('This agreement is already being sent for e-signature.', 409)
    }

    try {
        const { buffer } = await getDocumentDecrypted(agreement.generatedPdfKey)

        const result = await dispatchUpstream({
            corporateId: String(corporateId),
            credentialId: application?.createdByCredentialId || null,
            initiatorName: agreement.officialContactName || agreement.entityName || null,
            initiatorEmail: agreement.officialContactEmail || null,
            docketTitle: DOCKET_TITLE,
            expiryDate: expiryDate(),
            signingPolicy: SIGNING_POLICY,
            signer: {
                name: agreement.signatoryName,
                email: agreement.signatoryEmail,
                mobile: agreement.signatoryContact || null,
            },
            signatureTag: SIGNATURE_TAG,
            documentBase64: buffer.toString('base64'),
            fileName: DISPATCH_PDF_NAME,
        }, { logTraceId: req?.LogTraceId })

        if (!result?.epakId) {
            throw new ErrorResponse(GENERIC_ERROR, 502)
        }

        await upsertApplication(corporateId, {
            esignStatus: ESIGN_STATUS.SENT,
            esignReference: String(result.epakId),
            esignSigningLink: result.signingLink || null,
            esignSentAt: new Date(),
            esignSignedAt: null,
            esignFailureReason: null,
        })

        customLog(req?.LogTraceId, 'info', {
            message: '[AgreementEsign] Agreement sent for e-signature',
            corporateId,
            epakId: result.epakId,
            hasSigningLink: Boolean(result.signingLink),
        }, 'CONSOLE')

        return { epakId: String(result.epakId), signingLink: result.signingLink || null }
    } catch (error) {
        await upsertApplication(corporateId, {
            esignStatus: ESIGN_STATUS.FAILED,
            esignFailureReason: String(error?.message || 'Dispatch failed').slice(0, 500),
        })
        customLog(req?.LogTraceId, 'error', {
            message: '[AgreementEsign] Dispatch failed',
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
        throw error
    } finally {
        await releaseLock(lockKey)
    }
}

const storeSignedPdf = async ({ corporateId, signedPdfBase64, req }) => {
    if (!signedPdfBase64) {
        customLog(req?.LogTraceId, 'error', {
            action: 'corporateCard:esign:signedCopyMissing',
            message: '[AgreementEsign] Agreement signed but no document was returned; nothing stored',
            corporateId,
        }, 'CONSOLE')
        return null
    }
    try {
        const key = await uploadFileEncryptedToS3(signedPdfBase64, signedFolderFor(corporateId), 'pdf')
        await createCorporateDocument({
            documentName: DOC.CORPORATE_AGREEMENT_SIGNED.documentName,
            document: key,
            documentType: 'pdf',
            fileName: SIGNED_PDF_NAME,
            corporateUserId: corporateId,
            expiryDate: null,
            sizeBytes: Buffer.from(signedPdfBase64, 'base64').length,
        })
        return key
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[AgreementEsign] Could not store the signed agreement',
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

const applyTerminalStatus = async (args) => {
    const lockKey = terminalLockKey(args.corporateId)
    if (!await acquireLock(lockKey, TERMINAL_LOCK_TTL_SECONDS)) {
        customLog(args.req?.LogTraceId, 'info', {
            message: '[AgreementEsign] A terminal write is already in flight for this agreement',
            corporateId: args.corporateId,
            epakId: args.epakId,
        }, 'CONSOLE')
        return { applied: false, ignored: 'in-flight' }
    }
    try {
        return await writeTerminalStatus(args)
    } finally {
        await releaseLock(lockKey)
    }
}

const writeTerminalStatus = async ({ corporateId, epakId, status, signedPdfBase64, signedAt, reason, req }) => {
    const application = await findApplication(corporateId)
    if (!application) return { applied: false, ignored: 'no-application' }

    if (!application.esignReference || String(application.esignReference) !== String(epakId)) {
        customLog(req?.LogTraceId, 'info', {
            message: '[AgreementEsign] Ignoring a status for a superseded envelope',
            corporateId,
            epakId,
            current: application.esignReference,
        }, 'CONSOLE')
        return { applied: false, ignored: 'stale-envelope' }
    }

    if (application.esignStatus === ESIGN_STATUS.SIGNED) {
        return { applied: false, ignored: 'already-signed' }
    }

    if (status !== ESIGN_STATUS.SIGNED) {
        await upsertApplication(corporateId, {
            esignStatus: ESIGN_STATUS.FAILED,
            esignFailureReason: String(reason || 'The e-signature was not completed.').slice(0, 500),
        })
        customLog(req?.LogTraceId, 'info', {
            message: '[AgreementEsign] Agreement e-signature failed',
            corporateId,
            epakId,
            reason,
        }, 'CONSOLE')
        return { applied: true, status: ESIGN_STATUS.FAILED }
    }

    const signedPdfKey = await storeSignedPdf({ corporateId, signedPdfBase64, req })
    if (signedPdfKey) {
        await upsertAgreement(corporateId, { signedPdfKey })
    }

    await upsertApplication(corporateId, {
        esignStatus: ESIGN_STATUS.SIGNED,
        esignSignedAt: signedAt ? new Date(signedAt) : new Date(),
        esignFailureReason: null,
    })

    customLog(req?.LogTraceId, 'info', {
        message: '[AgreementEsign] Agreement e-signature completed',
        corporateId,
        epakId,
        storedSignedPdf: Boolean(signedPdfKey),
    }, 'CONSOLE')

    return { applied: true, status: ESIGN_STATUS.SIGNED, signedPdfKey }
}

const shouldRefresh = async (corporateId) => {
    try {
        const result = await client.set(
            refreshThrottleKey(corporateId),
            '1',
            { NX: true, EX: REFRESH_THROTTLE_SECONDS }
        )
        return result === 'OK'
    } catch (error) {
        return false
    }
}

const refreshEsignStatus = async ({ application, req }) => {
    if (!application || application.esignStatus !== ESIGN_STATUS.SENT || !application.esignReference) {
        return application
    }
    if (!await shouldRefresh(application.corporateId)) return application

    try {
        const upstream = await fetchAgreementStatus(application.esignReference, {
            logTraceId: req?.LogTraceId,
            includeDocument: true,
        })
        if (!upstream?.found) return application

        if (upstream.status === UPSTREAM_STATUS.COMPLETED) {
            await applyTerminalStatus({
                corporateId: application.corporateId,
                epakId: application.esignReference,
                status: ESIGN_STATUS.SIGNED,
                signedPdfBase64: upstream.signedPdfBase64 || null,
                signedAt: upstream.updatedAt,
                req,
            })
            return findApplication(application.corporateId)
        }

        if (upstream.status === UPSTREAM_STATUS.REJECTED || upstream.status === UPSTREAM_STATUS.EXPIRED) {
            await applyTerminalStatus({
                corporateId: application.corporateId,
                epakId: application.esignReference,
                status: ESIGN_STATUS.FAILED,
                reason: upstream.status === UPSTREAM_STATUS.REJECTED
                    ? 'The authorised signatory declined the agreement.'
                    : 'The e-signature request expired before it was signed.',
                req,
            })
            return findApplication(application.corporateId)
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[AgreementEsign] Read-through refresh failed',
            corporateId: application.corporateId,
            error: error?.message,
        }, 'CONSOLE')
    }

    return application
}

module.exports = {
    dispatch,
    applyTerminalStatus,
    refreshEsignStatus,
    signedFolderFor,
}
