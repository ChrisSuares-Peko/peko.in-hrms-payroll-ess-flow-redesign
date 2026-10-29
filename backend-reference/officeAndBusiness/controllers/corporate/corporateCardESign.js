const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const { createESignDoc } = require('../../models/use-cases/eSign');
const eSign = require('../../models/entities/eSign');
const { ESIGN_SOURCE_TYPES } = require('../../constants/eSignSourceTypes');
const {
    getAuthBridgeAccessToken,
    uploadDocumentAuthBridge,
    composeEPakAuthBridge,
    getEasySignLinks,
    fetchSignedPdfBase64,
    ESIGN_DOC_TYPE,
} = require('../../services/eSign');

const ESIGN_ACCESS_KEY = 'REDACTED';
const SOURCE_TYPE = ESIGN_SOURCE_TYPES.CORPORATE_CARD_AGREEMENT;

const vendorConfig = async (logTraceId) => {
    const serviceOperator = await findServiceOperatorByAccessKey(ESIGN_ACCESS_KEY);
    const vendor = serviceOperator?.vendor;
    if (!serviceOperator || serviceOperator.error || !vendor?.apiUrl) {
        customLog(logTraceId, 'error', {
            message: '[CorporateCardESign] e-Sign vendor is not configured',
            accessKey: ESIGN_ACCESS_KEY,
        });
        throw new ErrorResponse('Service unavailable', 503);
    }
    return {
        apiUrl: vendor.apiUrl,
        tenantId: vendor.optional5,
        authConfig: {
            client_id: vendor.optional1,
            client_secret: vendor.optional2,
            username: vendor.optional3,
            password: vendor.optional4,
        },
    };
};

const expiryDurationFrom = (expiryDate) => {
    if (!expiryDate) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(expiryDate);
    if (Number.isNaN(target.getTime())) return undefined;
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
};

exports.dispatchCorporateCardAgreement = asyncHandler(async (req, res, next) => {
    const {
        corporateId,
        credentialId,
        initiatorName,
        initiatorEmail,
        docketTitle,
        expiryDate,
        signingPolicy,
        signer,
        signatureTag,
        documentBase64,
    } = req.body || {};

    if (!corporateId || !documentBase64 || !signer?.email || !signer?.name) {
        return next(new ErrorResponse('corporateId, documentBase64 and signer are required.', 400));
    }

    const { apiUrl, tenantId, authConfig } = await vendorConfig(req?.LogTraceId);

    const signersInfo = [{
        signer_email: signer.email,
        signer_name: signer.name,
        ...(signer.mobile ? { signer_phone: String(signer.mobile) } : {}),
        sequence: 1,
        signer_position: signatureTag ? {
            x: signatureTag.x,
            y: signatureTag.y,
            width: signatureTag.width,
            height: signatureTag.height,
            pageNumber: signatureTag.pageNumber,
        } : undefined,
    }];

    try {
        const msbToken = await getAuthBridgeAccessToken(apiUrl, authConfig);

        const docId = await uploadDocumentAuthBridge({
            apiUrl,
            msbToken,
            tenantId,
            base64Pdf: documentBase64,
            fileName: `${docketTitle || 'corporate-agreement'}.pdf`,
        });

        const ownerNameParts = (initiatorName || '').trim().split(' ');
        const epakId = await composeEPakAuthBridge({
            apiUrl,
            msbToken,
            tenantId,
            docId,
            signersInfo,
            sequentialSignature: false,
            signingPolicy: signingPolicy === 'AADHAAR' ? 'AADHAAR' : 'QUICKSIGN',
            expiryDuration: expiryDurationFrom(expiryDate),
            ownerEmail: initiatorEmail || null,
            ownerFirstName: ownerNameParts[0] || null,
            ownerLastName: ownerNameParts.slice(1).join(' ') || null,
        });

        let signLinks = [];
        try {
            signLinks = await getEasySignLinks({ apiUrl, msbToken, tenantId, epakId });
        } catch (linkError) {
            customLog(req?.LogTraceId, 'error', {
                message: '[CorporateCardESign] Failed to fetch signing links',
                epakId,
                error: linkError.message,
            });
        }

        const match = signLinks.find((link) => link.userEmail === signer.email);
        const signersWithLinks = signersInfo.map((entry) => (match
            ? { ...entry, signing_link: match.easySignLink, wfsOrderId: match.wfsOrderId }
            : entry));

        const persistRequest = {
            user: {
                id: credentialId,
                role: 'CORPORATE',
                username: `corporate-${corporateId}`,
            },
            body: {
                signers_info: signersWithLinks,
                docket_title: docketTitle || 'Corporate Agreement',
                expiry_date: expiryDate || null,
                sequentialSignature: false,
                documentBase64,
                reminder: false,
                reminder_interval: 0,
                initiator_name: initiatorName || null,
                initiator_email: initiatorEmail || null,
                termsofUse: null,
                eSignType: signingPolicy === 'AADHAAR' ? 'AADHAAR' : 'QUICKSIGN',
                sourceType: SOURCE_TYPE,
                sourceId: String(corporateId),
            },
        };

        const { status, data: savedData, message } = await createESignDoc(
            { docket_id: epakId, document_id: docId, signer_info: [] },
            persistRequest
        );
        if (!status) {
            customLog(req?.LogTraceId, 'error', {
                message: '[CorporateCardESign] Could not persist the eSign row',
                corporateId,
                epakId,
                upstreamMessage: message,
            });
            return next(new ErrorResponse('Could not record the e-signature request.', 500));
        }

        customLog(req?.LogTraceId, 'info', {
            message: '[CorporateCardESign] Agreement dispatched for e-signature',
            corporateId,
            epakId,
            docId,
            eSignId: savedData.id,
            hasSigningLink: Boolean(match?.easySignLink),
        });

        return res.status(200).json({
            status: true,
            message: 'Success',
            data: {
                epakId,
                docId,
                eSignId: String(savedData.id),
                signingLink: match?.easySignLink || null,
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCardESign] Dispatch failed',
            corporateId,
            error: error?.message,
            data: error?.response?.data,
        });
        return next(new ErrorResponse('Could not send the agreement for e-signature.', 502));
    }
});

exports.getCorporateCardAgreementStatus = asyncHandler(async (req, res, next) => {
    const epakId = req.query?.epakId ? String(req.query.epakId).trim() : '';
    if (!epakId) return next(new ErrorResponse('epakId is required.', 400));

    const row = await eSign.findOne({
        where: { docket_id: epakId, sourceType: SOURCE_TYPE },
        attributes: ['id', 'docket_id', 'document_id', 'status', 'signers_info', 'sourceId', 'updatedAt'],
    });

    if (!row) {
        return res.status(200).json({
            status: true,
            message: 'Success',
            data: { found: false },
            responseCode: '000',
        });
    }

    const wantsDocument = String(req.query?.includeDocument || '') === 'true';
    const signedPdfBase64 = wantsDocument && row.status === 'COMPLETED'
        ? await fetchSignedPdfBase64(row.document_id, req?.LogTraceId, ESIGN_DOC_TYPE.AUDIT_TRAIL)
        : null;
    if (wantsDocument && row.status === 'COMPLETED' && !signedPdfBase64) {
        customLog(req?.LogTraceId, 'error', {
            action: 'esign:corporateCard:auditTrailUnavailable',
            message: '[corporateCardESign] Audit-trail copy could not be fetched; no agreement will be returned',
            epakId: row.docket_id,
            documentId: row.document_id,
            docType: ESIGN_DOC_TYPE.AUDIT_TRAIL,
        });
    }

    return res.status(200).json({
        status: true,
        message: 'Success',
        data: {
            found: true,
            epakId: row.docket_id,
            documentId: row.document_id,
            corporateId: row.sourceId,
            status: row.status,
            signers: row.signers_info || [],
            updatedAt: row.updatedAt,
            signedPdfBase64,
        },
        responseCode: '000',
    });
});
