/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
const asyncHandler = require("../../middlewares/async");

const ErrorResponse = require('../../utils/error-response');
const { fetchVendorDetails, updateSignerDetails, getAuthBridgeAccessToken, uploadDocumentAuthBridge, composeEPakAuthBridge, getEasySignLinks, downloadDocumentAuthBridge, getEpakDetails, sendIndividualReminder } = require("../../services/eSign");
const { createESignDoc, findAllESignDocs, findESignDocById, findDocToUpdate, countESignDocs, countESignDocsInBillingCycle } = require("../../models/use-cases/eSign");
const accessKey = "REDACTED"
const { default: Axios } = require('axios');
const { findMaximumUsageLimit, findMaximumUsageLimitForAccessKey, findUserSubscriptionsByService } = require("../../models/use-cases/subscription");
const { customLog } = require("../../utils/loggerHelper");
const { updateAgreement, pushAgreementTimeline } = require("../../models/use-cases/agreement");
const { updateById: updateLegalDocument } = require("../../models/use-cases/legalDocument");
const { ESIGN_SOURCE_TYPES } = require("../../constants/eSignSourceTypes");

// Function to convert downloadable link to Base64 and format
async function convertLinkToBase64(link) {
    try {
        const response = await Axios.get(link, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(response.data).toString('base64');
        return base64Data;
    } catch (error) {
        customLog(null, 'error', { error: error.message });

        return null;
    }
}


exports.getCountESignDocs = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    let params = {
        accessCode: accessKey,
        corporateId: req.user.corporateId,
         checkIsExpired:true
    }
    // this query will return e sign subscription or the main group package 
    const userEsignSubsription = await findUserSubscriptionsByService(params)
    if(!userEsignSubsription){
        return next(new ErrorResponse(`Your eSign subscription has been expired. Please upgrade your plan`, 400));
    }

    const subCorporateUserId = (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) ? req.user.subCorporateId : undefined;

    const countResult = await countESignDocs(userId, subCorporateUserId);

    if (countResult === false) {
        return next(new ErrorResponse(`Something went wrong while getting the count of eSign documents`, 400));
    }

    const cycleResult = await countESignDocsInBillingCycle(userId, userEsignSubsription);
    const usedThisCycle = cycleResult && Number.isFinite(cycleResult.count) ? cycleResult.count : countResult.count;

    const { completedCount, pendingCount, lastESignAddedDate } = countResult;
    return res.status(200).json({
        status: true,
        data: { count: usedThisCycle, completedCount, pendingCount, lastESignAddedDate },
        message: 'Count and last e-sign added date fetched successfully',
        responseCode: '000'
    });
});

exports.eSignRequest = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const partnerId = req.user.registeredBy;
    
    let params = {
        accessCode: accessKey,
        corporateId: req.user.corporateId,
        checkIsExpired: false
    };
    const userEsignSubsription = await findUserSubscriptionsByService(params);
    if (!userEsignSubsription) {
        return next(new ErrorResponse(`Your eSign subscription has been expired. Please upgrade your plan`, 400));
    }

    const { count } = await countESignDocsInBillingCycle(userId, userEsignSubsription);
    // eSign is addon-only — its baseLimit lives on the active GROUP plan's Cashback row, not on
    // an INDIVIDUAL package. Use the helper that handles that case correctly.
    const maximumSignLimit = await findMaximumUsageLimitForAccessKey({
        corporateId: req.user.corporateId,
        accessKey,
    });
    if (!Number.isFinite(count)) {
        return next(new ErrorResponse(`Something went wrong`, 400));
    }
    // `count >= maximumSignLimit` — no `> 0` guard. A maximumSignLimit of 0 means the user has
    // no eSign quota (no GROUP plan, or plan with zero baseLimit and no addon) and must be blocked.
    if (count >= maximumSignLimit) {
        const msg = maximumSignLimit === 0
            ? "Your plan doesn't include eSign. Upgrade or purchase an add-on to continue."
            : `You've used all ${maximumSignLimit} eSign requests on your plan. Purchase an add-on to continue.`;
        return next(new ErrorResponse(msg, 400));
    }

    const { documentBase64, docket_title, signers_info, sequentialSignature, expiry_date, initiator_name, initiator_email, termsofUse, signingPolicy = 'QUICKSIGN' } = req.body;

    if (!termsofUse) {
        return next(new ErrorResponse('You must agree to the consent before proceeding.', 400));
    }

    try {

        let vendorDetails = await fetchVendorDetails(req.user, 'signDrive_eSign');
        let { apiUrl, optional1: client_id, optional2: client_secret, optional3: username, optional4: password, optional5: tenantId } = vendorDetails;
        const authConfig = { client_id, client_secret, username, password };

        // Step 1: Get access token
        const msbToken = await getAuthBridgeAccessToken(apiUrl, authConfig);

        // Step 2: Upload document
        let expiryDuration;
        if (expiry_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(expiry_date);
            expiryDate.setHours(0, 0, 0, 0);
            const diffDays = Math.round((expiryDate - today) / (1000 * 60 * 60 * 24));
            expiryDuration = Math.max(1, diffDays + 1);
        }
        // console.log('[AuthBridge] signers_info from frontend:', JSON.stringify(signers_info));
        const docId = await uploadDocumentAuthBridge({
            apiUrl,
            msbToken,
            tenantId,
            base64Pdf: documentBase64,
            fileName: `${docket_title || 'document'}.pdf`
        });

        // Step 3: Compose ePak
        const ownerNameParts = (initiator_name || '').trim().split(' ');
        const epakId = await composeEPakAuthBridge({
            apiUrl,
            msbToken,
            tenantId,
            docId,
            signersInfo: signers_info,
            sequentialSignature,
            signingPolicy,
            expiryDuration,
            ownerEmail: initiator_email || null,
            ownerFirstName: ownerNameParts[0] || null,
            ownerLastName: ownerNameParts.slice(1).join(' ') || null,
        });
        
        // Step 4: Get signing links for each signer
        let signLinks = [];
        try {
            signLinks = await getEasySignLinks({ apiUrl, msbToken, tenantId, epakId });
        } catch (linkErr) {
            customLog(req?.LogTraceId, 'error', { message: 'Failed to fetch sign links', error: linkErr.message });
        }

        // Attach signing link to each signer by email
        const signersWithLinks = (signers_info || []).map(signer => {
            const match = signLinks.find(l => l.userEmail === signer.signer_email);
            return match ? { ...signer, signing_link: match.easySignLink, wfsOrderId: match.wfsOrderId } : signer;
        });

        // Build apiRes compatible with createESignDoc
        let data = {
            docket_id: epakId,
            document_id: docId,
            signer_info: [],
            signers_with_links: signersWithLinks
        };

        if (req.user.role === 'CORPORATE_SUB_USER') {
            data.subCorporateUserId = req.user.subCorporateId;
        }

        // Inject enriched signers_info (with signing links) into req.body before saving
        req.body.signers_info = signersWithLinks;
        // Persist the single, document-wide eSign type via the existing eSignType column
        req.body.eSignType = signingPolicy === 'AADHAAR' ? 'AADHAAR' : 'QUICKSIGN';


        let { status, data: savedData, message } = await createESignDoc(data, req);
        if (!status) {
            return next(new ErrorResponse(message, 400));
        }

        if (req.body.sourceType === ESIGN_SOURCE_TYPES.AGREEMENT && req.body.sourceId) {
            await updateAgreement({ id: req.body.sourceId }, { status: 'SENT', eSignId: savedData.id });
            await pushAgreementTimeline(req.body.sourceId, "Agreement sent");
        }

        if (req.body.sourceType === ESIGN_SOURCE_TYPES.LEGAL_DOCUMENT && req.body.sourceId) {
            await updateLegalDocument(req.body.sourceId, { status: 'SENT', eSignId: savedData.id });
        }

        return res.status(200).json({
            status: true,
            message: 'Success',
            responseCode: '000',
            data: savedData
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message, data: error?.response?.data });
        return res.status(400).json({
            status: false,
            message: error?.message || 'Apologies, the service you are trying to access is currently unavailable.',
            responseCode: '001',
            data: {}
        });
    }
});
exports.resendIndividualInvitationWithUpdateEmail = asyncHandler(async (req, res, next) => {
    let { id, signer_id } = req.query
    let { email, name } = req.body

    //1. find one doc with the doc id
    let { status, message, data: eSignDoc } = await findESignDocById(id, ['id', 'signers_info', 'status'], req.user.id)
    const { signers_info } = eSignDoc
    const signed = signers_info.filter(signer => (signer.status === 'pending' || signer.status === 'unsigned') && signer_id == signer.signer_id);

    if (signed.length == 0) {
        return next(new ErrorResponse('This recipient has signed the document. Please refresh the page to view the latest status', 400));
    }

    if (!status) return next(new ErrorResponse(message, 400))
    if (eSignDoc.status === 'COMPLETED') {
        return next(new ErrorResponse('This recipient has signed the document. Please refresh the page to view the latest status', 400))
    }
    // Check if any other signer is already using this email
    const isDuplicate = signers_info.some(signer =>
        signer.signer_id !== signer_id &&
        signer.signer_email.toLowerCase() === email.toLowerCase()
    );
    if (isDuplicate) {
        return next(new ErrorResponse('This email is already used by another signer.', 400))
    }

    const doUpdate = eSignDoc.email !== email || eSignDoc.name !== name;
    if (doUpdate) {
        const { status, message = '', data = {} } = await updateSignerDetails(req)
        if (!status) {
            return res.status(400).json({
                status: true,
                message: message,
                responseCode: '001',
                data: data
            })
        }
    }
    return exports.resendIndividualInvitation(req, res, next);
})
exports.resendIndividualInvitation = asyncHandler(async (req, res, next) => {
    const { id } = req.query;
    try {
        const { status, message, data: eSignDoc } = await findESignDocById(id, ['id', 'docket_id', 'docket_title', 'signers_info'], req.user.id);
        if (!status) return next(new ErrorResponse(message, 400));

        const { docket_id: epakId } = eSignDoc;

        const vendorDetails = await fetchVendorDetails(req.user, 'signDrive_eSign');
        const { apiUrl, optional1: client_id, optional2: client_secret, optional3: username, optional4: password, optional5: tenantId, optional6: frontendUrl } = vendorDetails;
        const authConfig = { client_id, client_secret, username, password };

        const msbToken = await getAuthBridgeAccessToken(apiUrl, authConfig);

        // Fetch ePak details to get userId, stateId, wfOrder for the specific signer
        const signerEmail = req.body?.email;
        const epakDetails = await getEpakDetails({ apiUrl, msbToken, tenantId, epakId, frontendUrl });

        // AuthBridge ePak details: find the pending signer by email across workflowStates
        let userId, stateId, wfOrder;
        const workflowStates = epakDetails?.workflowInfo?.workflowStates || [];
        for (const state of workflowStates) {
            const signers = state.signersInfo || [];
            const match = signers.find(s => s.signerEmail === signerEmail);
            if (match) {
                userId = match.signerId;
                stateId = state.id;
                wfOrder = state.workflowStateOrderId;
                break;
            }
        }

        if (!userId || !stateId || !wfOrder) {
            return res.status(400).json({
                status: false,
                message: 'Could not find signer details in ePak for the given email',
                responseCode: '001',
                data: {}
            });
        }

        await sendIndividualReminder({ apiUrl, msbToken, tenantId, epakId, userId, stateId, wfOrder, frontendUrl });

        customLog(req?.LogTraceId, 'info', { message: 'Resend invitation sent via vendor', epakId }, 'VENDOR');
        return res.status(200).json({
            status: true,
            message: 'Invitation resent successfully',
            responseCode: '000',
            data: {}
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return res.status(400).json({
            status: false,
            message: error?.message || 'Something went wrong',
            responseCode: '001',
            data: {}
        });
    }
});

exports.findAllESignDocsAndCount = asyncHandler(async (req, res, next) => {
    const from = req.query.from
    const to = req.query.to
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    let searchText = req.query.searchText || '';
    let order = req.query.orderCol || 'DESC';
    let column = parseInt(req.query.column) || 0;

    let params = {
        page,
        pageSize,
        searchText,
        order,
        column,
        from,
        to,
    };

    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
        params.subCorporateUserId = req.user.subCorporateId;
    }

    let userId = req.user.id

    const registrationData = await findAllESignDocs(params, userId, ['id', 'status', 'createdAt', 'docket_title', 'signers_info', 'status', 'document_url', 'audit_trail_url', 'doc_expiry_date', ['eSignType', 'signingPolicy']]);

    if (!registrationData) {
        return next(new ErrorResponse(`Something went wrong while getting all details`, 400))
    } else {
        return res.status(200).json({
            status: true,
            data: {
                recordsTotal: registrationData ? registrationData.count : 0,
                rows: registrationData ? registrationData.rows : []
            },
            message: 'Fetched Successfully',
            responseCode: '000'
        });
    }

});
exports.findOneESignDetails = asyncHandler(async (req, res, next) => {

    const id = parseInt(req.query.id);
    let { status, message, data: eSignDoc } = await findESignDocById(id, ['id', 'createdAt', 'docket_title', 'signers_info', 'initiator_name', 'document_url', 'audit_trail_url', 'sequentialSignature', 'initiator_email', 'reminder', 'reminder_interval', 'termsofUse', 'status', 'doc_expiry_date', 'expiry_date', ['eSignType', 'signingPolicy']], req.user.id)
    if (!status) {
        return next(new ErrorResponse(message, 400))
    }
    if (eSignDoc?.document_url) {
        let documentBase64 = await convertLinkToBase64(eSignDoc.document_url)
        eSignDoc.documentBase64 = documentBase64

    }
    return res.status(200).json({
        status: true,
        data: eSignDoc,
        message: 'Fetched Successfully',
        responseCode: '000'
    });
});

exports.downloadESignDocument = asyncHandler(async (req, res, next) => {
    const { id, docType } = req.query;
    if (!id || !docType) {
        return next(new ErrorResponse('id and docType are required', 400));
    }
    try {
        const { status, message, data: eSignDoc } = await findESignDocById(parseInt(id), ['id', 'document_id', 'docket_title'], req.user.id);
        if (!status) return next(new ErrorResponse(message, 400));

        const vendorDetails = await fetchVendorDetails(req.user, 'signDrive_eSign');
        const { apiUrl, optional1: client_id, optional2: client_secret, optional3: username, optional4: password, optional5: tenantId } = vendorDetails;
        const msbToken = await getAuthBridgeAccessToken(apiUrl, { client_id, client_secret, username, password });

        const response = await downloadDocumentAuthBridge({ apiUrl, msbToken, tenantId, docId: eSignDoc.document_id, docType });

        const contentType = response.headers['content-type'] || '';
        // AuthBridge returns 200 with JSON error body when something goes wrong
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
            const errJson = JSON.parse(Buffer.from(response.data).toString('utf8'));
            return res.status(400).json({
                status: false,
                message: errJson?.message || 'Failed to download document',
                responseCode: '001',
                data: {}
            });
        }
        res.setHeader('Content-Type', contentType || 'application/pdf');
        // docket_title is free-text user input and can contain quotes/control chars/unicode
        // (emoji, accented characters, smart quotes pasted from Word, etc.) that Node's HTTP
        // header validator rejects outright with ERR_INVALID_CHAR. Strip to a safe printable
        // ASCII filename, falling back to document_id if nothing usable remains.
        const safeTitle = String(eSignDoc.docket_title || '').replace(/[^\x20-\x7E]/g, '').replace(/["\\]/g, '').trim();
        res.setHeader('Content-Disposition', `inline; filename="${safeTitle || eSignDoc.document_id}.pdf"`);
        return res.send(Buffer.from(response.data));
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return res.status(400).json({
            status: false,
            message: error?.message || 'Failed to download document',
            responseCode: '001',
            data: {}
        });
    }
});

