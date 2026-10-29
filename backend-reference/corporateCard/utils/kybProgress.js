const { AGREEMENT_SIGN_METHOD, ESIGN_STATUS } = require('../constants/corporateAgreement')
const { KYB_STATUS } = require('../constants/corporateCardApplication')
const { DOC, SYSTEM_DOCUMENT_NAMES } = require('../constants/kybDocuments')

/** The agreement has its own step, so it must not also be counted as a business document. */
const AGREEMENT_OWNED = new Set([DOC.CORPORATE_AGREEMENT.documentName, ...SYSTEM_DOCUMENT_NAMES])

const STEP_STATE = {
    DONE: 'done',
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
    NOT_APPLICABLE: 'not_applicable',
}

const step = (key, label, state, detail = null) => ({ key, label, state, detail })

/**
 * Counted from the very list the reviewer's screen renders, so the step can never read Completed while
 * a row beside it reads Missing.
 */
const countableDocuments = (expected) =>
    expected.filter((doc) => doc.required && !AGREEMENT_OWNED.has(doc.documentName))

const businessTypeStep = (application) =>
    application?.businessType
        ? step('business_type', 'Business type selected', STEP_STATE.DONE, application.businessType)
        : step('business_type', 'Business type selected', STEP_STATE.PENDING)

const documentsStep = (application, expected, uploadedNames) => {
    const required = countableDocuments(expected)
    if (!application?.businessType || !required.length) {
        return step(
            'documents',
            'Business documents uploaded',
            STEP_STATE.PENDING,
            'Waiting for a business type before the checklist is known'
        )
    }

    const uploaded = required.filter((doc) => uploadedNames.has(doc.documentName))
    const detail = `${uploaded.length} of ${required.length} required documents uploaded`
    if (uploaded.length === required.length) {
        return step('documents', 'Business documents uploaded', STEP_STATE.DONE, detail)
    }
    return step(
        'documents',
        'Business documents uploaded',
        uploaded.length ? STEP_STATE.IN_PROGRESS : STEP_STATE.PENDING,
        detail
    )
}

const signMethodStep = (application) => {
    const method = application?.agreementSignMethod || null
    if (!method) return step('sign_method', 'Signing method chosen', STEP_STATE.PENDING)
    const label = method === AGREEMENT_SIGN_METHOD.UPLOAD ? 'Upload signed copy' : 'e-Sign with Aadhaar'
    return step('sign_method', 'Signing method chosen', STEP_STATE.DONE, label)
}

/**
 * Branches on the stored evidence rather than on agreementSignMethod, which sendAgreementForEsign
 * overwrites and which is NULL for anyone who never chose — a filled form is a filled form.
 */
const agreementDetailsStep = (application, agreement, missingRequired) => {
    const method = application?.agreementSignMethod || null
    const label = 'Agreement details filled in'

    if (!agreement) {
        return method === AGREEMENT_SIGN_METHOD.UPLOAD
            ? step('agreement_details', label, STEP_STATE.NOT_APPLICABLE, 'Not collected on the upload-signed-copy route')
            : step('agreement_details', label, STEP_STATE.PENDING)
    }

    const missing = missingRequired(agreement)
    if (!missing.length) {
        return step(
            'agreement_details',
            label,
            STEP_STATE.DONE,
            method === AGREEMENT_SIGN_METHOD.UPLOAD ? 'Filled in before the upload route was chosen' : null
        )
    }
    return step(
        'agreement_details',
        label,
        STEP_STATE.IN_PROGRESS,
        `${missing.length} field${missing.length === 1 ? '' : 's'} still empty`
    )
}

/**
 * PENDING_DISPATCH and SENT both mean the filled agreement exists and is waiting to go out — no
 * provider is wired, so this must never be reported to a reviewer as signed.
 */
const agreementSignedStep = (application, uploadedNames) => {
    const method = application?.agreementSignMethod || null
    const label = 'Agreement signed'
    const hasSignedUpload = uploadedNames.has(DOC.CORPORATE_AGREEMENT.documentName)

    // A signed copy on file is the strongest evidence there is, whatever the route now says.
    if (hasSignedUpload) {
        return step(
            'agreement_signed',
            label,
            STEP_STATE.DONE,
            method === AGREEMENT_SIGN_METHOD.E_SIGN
                ? 'Signed copy uploaded, though the route is currently e-Sign'
                : 'Signed copy uploaded by the corporate'
        )
    }

    if (method === AGREEMENT_SIGN_METHOD.UPLOAD) {
        return step('agreement_signed', label, STEP_STATE.PENDING, 'Signed copy not uploaded yet')
    }

    switch (application?.esignStatus) {
        case ESIGN_STATUS.SIGNED:
            return step('agreement_signed', label, STEP_STATE.DONE, 'Aadhaar e-signature completed')
        case ESIGN_STATUS.SENT:
            return step('agreement_signed', label, STEP_STATE.IN_PROGRESS, 'Sent for e-signature, awaiting the signature')
        case ESIGN_STATUS.PENDING_DISPATCH:
            return step('agreement_signed', label, STEP_STATE.IN_PROGRESS, 'Agreement generated, not yet sent for e-signature')
        case ESIGN_STATUS.FAILED:
            return step('agreement_signed', label, STEP_STATE.PENDING, 'e-Signature failed, the corporate has to try again')
        default:
            return step('agreement_signed', label, STEP_STATE.PENDING)
    }
}

/** Keyed on kybReference, not kybStatus: a reference marks a submitted or resubmitted application. */
const submittedStep = (application) => {
    const label = 'Submitted for verification'
    if (!application?.kybReference) return step('submitted', label, STEP_STATE.PENDING)

    // A rejected application is back in the corporate's hands, so the journey is not finished. Whether they
    // have actually picked it up is a different thing: until they open the rejection and choose to resubmit,
    // nothing is in progress and a reviewer chasing them needs to see that.
    if (application.kybStatus === KYB_STATUS.REJECTED) {
        const detail = application.metadata?.rejectionAcknowledgedAt
            ? `Rejected — resubmission in progress (${application.kybReference})`
            : `Rejected — waiting for the corporate to start again (${application.kybReference})`
        return step('submitted', label, STEP_STATE.IN_PROGRESS, detail)
    }
    return step('submitted', label, STEP_STATE.DONE, application.kybReference)
}

const deriveKybProgress = ({
    application,
    agreement,
    expected = [],
    uploadedDocumentNames = [],
    missingRequired,
}) => {
    const uploadedNames = new Set(uploadedDocumentNames)

    return [
        businessTypeStep(application),
        documentsStep(application, expected, uploadedNames),
        signMethodStep(application),
        agreementDetailsStep(application, agreement, missingRequired),
        agreementSignedStep(application, uploadedNames),
        submittedStep(application),
    ]
}

module.exports = { STEP_STATE, deriveKybProgress }
