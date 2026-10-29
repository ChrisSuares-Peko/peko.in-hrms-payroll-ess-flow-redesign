/* eslint-disable no-prototype-builtins */
const moment = require('moment');
const emailer = require('../utils/emailer');
const { fetchServiceDetails, findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails")
const { findESignDoc, findDocToUpdate } = require('../models/use-cases/eSign');


const axios = require('axios')
const { Readable } = require('stream');
const FormData = require('form-data');
const { findESignDocById } = require('../models/use-cases/eSign');
const sequelize = require('../configs/database/index');
const eSign = require('../models/entities/eSign');
const credential = require('../models/entities/credential');
const { resolveESignCompletedEmail } = require('../utils/eSignCompletedTemplate');
const { partnerLogos } = require('../utils/partnerLogos');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { uploadFileToS3, uploadFileEncryptedToS3 } = require('../utils/s3');
const { findAgreementToUpdate } = require('../models/use-cases/invoiceSupplier');
const { updateAgreement, pushAgreementTimeline } = require('../models/use-cases/agreement');
const { updateById: updateLegalDocument } = require('../models/use-cases/legalDocument');
const { kybSubmissionToVendor } = require('../utils/emailTemplates/KYBTemplate');
const { customLog } = require('../utils/loggerHelper');
const { uploadFile } = require('../utils/commonUploadFile');
const { ESIGN_SOURCE_TYPES } = require('../constants/eSignSourceTypes');
const { NODE_ENV } = process.env;

// Tags a vendor call failure with which AuthBridge API it came from, so the
// response/logs make it obvious whether the token, upload, compose, etc. step failed.
function vendorError(step, error, fallback) {
    const status = error?.response?.status;
    const detail = error?.response?.data?.message || error?.response?.data || error.message || fallback;
    const detailStr = typeof detail === 'string' ? detail : JSON.stringify(detail);
    return new Error(`[AuthBridge:${step}]${status ? ` (HTTP ${status})` : ''} ${detailStr}`);
}

const PAYROLL_SERVICE_URL = (NODE_ENV === 'production' ? process.env.PRODUCTION_URL : process.env.STAGING_URL).replace(/\/+$/, '');

exports.notifyPayrollOfferLetterStatus = async (employeeId, payload) => {
    try {
        await axios.put(
            `${PAYROLL_SERVICE_URL}/api/v1/payroll/esign-callback/employee/${employeeId}/offer-letter-status`,
            payload,
            { headers: { 'x-esign-callback-secret': process.env.ESIGN_CALLBACK_SECRET } }
        );
    } catch (error) {
        customLog(null, 'error', { message: '[notifyPayrollOfferLetterStatus] Failed to notify payroll', employeeId, error: error.message });
    }
};

const CORPORATE_CARD_CALLBACK_URL = `${PAYROLL_SERVICE_URL}/api/v1/webhook/officeandbusiness/corporate-cards/e-sign/status`;

exports.notifyCorporateCardAgreementStatus = async (payload) => {
    if (!process.env.ESIGN_CALLBACK_SECRET) {
        customLog(null, 'error', {
            message: '[notifyCorporateCardAgreementStatus] ESIGN_CALLBACK_SECRET is not configured',
            corporateId: payload?.corporateId,
        });
        return;
    }
    try {
        await axios.put(
            CORPORATE_CARD_CALLBACK_URL,
            payload,
            {
                headers: { 'x-esign-callback-secret': process.env.ESIGN_CALLBACK_SECRET },
                timeout: 30000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );
    } catch (error) {
        customLog(null, 'error', {
            message: '[notifyCorporateCardAgreementStatus] Failed to notify corporateCard',
            corporateId: payload?.corporateId,
            epakId: payload?.epakId,
            status: payload?.status,
            error: error.message,
        });
    }
};

const ESIGN_DOC_TYPE = exports.ESIGN_DOC_TYPE = {
    FLAT: 'Flat',
    AUDIT_TRAIL: 'ephotocopy',
};

const fetchSignedPdfBase64 = exports.fetchSignedPdfBase64 = async (documentId, logTraceId, docType = ESIGN_DOC_TYPE.FLAT) => {
    try {
        if (!documentId) return null;
        const serviceOperator = await findServiceOperatorByAccessKey('signDrive_eSign');
        const vendor = serviceOperator?.vendor;
        if (!vendor?.apiUrl) return null;
        const msbToken = await exports.getAuthBridgeAccessToken(vendor.apiUrl, {
            client_id: vendor.optional1,
            client_secret: vendor.optional2,
            username: vendor.optional3,
            password: vendor.optional4,
        });
        const response = await exports.downloadDocumentAuthBridge({
            apiUrl: vendor.apiUrl,
            msbToken,
            tenantId: vendor.optional5,
            docId: documentId,
            docType,
        });
        const contentType = response?.headers?.['content-type'] || '';
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
            customLog(logTraceId, 'error', {
                message: '[fetchSignedPdfBase64] Vendor returned an error body instead of the document',
                documentId,
                docType,
            });
            return null;
        }
        return Buffer.from(response.data).toString('base64');
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[fetchSignedPdfBase64] Could not download the signed document',
            documentId,
            docType,
            error: error.message,
        });
        return null;
    }
};

const formatDate = (date) => {
    try {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (error) {
        return undefined
    }
};
// exports.coordinates = {
//     "top-left": {
//         "x1": 20,
//         "x2": 130,
//         "y1": 740,
//         "y2": 780
//     },
//     "top-mid-left": {
//         "x1": 160,
//         "x2": 270,
//         "y1": 740,
//         "y2": 780
//     },
//     "top-mid-right": {
//         "x1": 300,
//         "x2": 410,
//         "y1": 740,
//         "y2": 780
//     },
//     "top-right": {
//         "x1": 440,
//         "x2": 550,
//         "y1": 740,
//         "y2": 780
//     },
//     "bottom-left": {
//         "x1": 20,
//         "x2": 130,
//         "y1": 20,
//         "y2": 60
//     },
//     "bottom-mid-left": {
//         "x1": 150,
//         "x2": 260,
//         "y1": 20,
//         "y2": 60
//     },
//     "bottom-mid-right": {
//         "x1": 280,
//         "x2": 390,
//         "y1": 20,
//         "y2": 60
//     },
//     "bottom-right": {
//         "x1": 410,
//         "x2": 520,
//         "y1": 20,
//         "y2": 60
//     }
// }


exports.getESignRequestData = async (body, accessKey) => {
    try {
        let { docket_title, docket_description, expiry_date, documentBase64, initiator_email,
            sequentialSignature, signers_info, initiator_name } = body
        if (expiry_date) {
            let expiryDateEOD = moment(expiry_date).set({ hour: 23, minute: 59, second: 59 }).format('YYYY-MM-DDTHH:mm:ss');
            body.expiry_date = expiryDateEOD
            expiry_date = formatDate(new Date(expiryDateEOD)) || undefined
        } else {
            expiry_date = undefined
        }
        const base64String = documentBase64.replace(/^data:application\/pdf;base64,/, '');
        const reference_id = new Date().valueOf()
        const reference_doc_id = reference_id + 1 // Unique for every uploaded file.
        let signer_ref_id = reference_id + 2 // Unique for every user

        const requestData = {
            "reference_id": reference_id.toString(),
            "docket_title": docket_title,
            "enable_email_notification": true, // completion email functionality
            "description_in_invitation": true,
            "docket_description": docket_description,
            "final_copy_recipients": initiator_email,
            "expiry_date": expiry_date,
            "documents": [
                {
                    "reference_doc_id": reference_doc_id.toString(),
                    "content_type": "pdf",
                    "content": base64String, // base64 encoded content
                    "signature_sequence": sequentialSignature == true ? 'sequential' : 'parallel', // sequential OR parallel
                    "custom": {
                        "access_key": accessKey,
                        "initiator_name": initiator_name,
                        "initiator_email": initiator_email,
                    }
                }
            ],
            "signers_info": signers_info.map((element, index) => {
                const { signer_position, signer_name, signer_email, sequence, page_number } = element;
                let newId = signer_ref_id + index
                const pageNumberString = page_number.join(',');
                return {
                    "document_to_be_signed": reference_doc_id.toString(),  // corresponding reference_doc_id.
                    "signer_position": {
                        "page": page_number,
                        "appearance": signer_position
                    },
                    "signer_ref_id": newId.toString(),  //unique reference ID to identify each signer
                    "signer_name": signer_name,
                    "signer_email": signer_email,
                    //"signer_mobile": '', //req if "signature_type": "electronic"
                    "sequence": sequence, // order
                    "page_number": pageNumberString,
                    "signature_type": "electronic",
                    "esign_type": "otp",
                    "authentication_mode": "email", // email,mobile,both,none
                    "trigger_esign_request": true, // email notification to sign the document.
                    "trigger_esign_request_invitation": "email" // email,mobile
                }
            })
        };

        return requestData
    } catch (error) {
        customLog(null, 'error', { error: error.message });

        throw new Error('Something went wrong')
    }
}

exports.getAuthBridgeAccessToken = async (apiUrl, authConfig) => {
     try {
        const { client_id, client_secret, username, password } = authConfig;
        const tokenUrl = `${apiUrl}/public/access_token`;
        const response = await axios.get(tokenUrl, {
            params: { client_id, client_secret, grant_type: 'password', username, password }
        });
        if (!response.data?.msb_token) {
            customLog(null, 'error', { message: '[AuthBridge] Token response missing msb_token', tokenUrl, responseData: response.data });
            throw new Error(`Failed to get access token: ${JSON.stringify(response.data)}`);
        }
        return response.data.msb_token;
    } catch (error) {
        customLog(null, 'error', { step: 'GetAccessToken', error: error?.response?.data || error.message });
        throw vendorError('GetAccessToken', error, 'Failed to authenticate with AuthBridge');
    }
};

exports.uploadDocumentAuthBridge = async ({ apiUrl, msbToken, tenantId, base64Pdf, fileName }) => {
    try {
        // console.log('[AuthBridge] Upload - msbToken present:', !!msbToken, '| tenantId:', tenantId);
        const cleanBase64 = base64Pdf.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        // console.log('[AuthBridge] Upload - buffer size (bytes):', buffer.length, '| fileName:', fileName);
        const form = new FormData();
        form.append('file', buffer, { filename: fileName || 'document.pdf', contentType: 'application/pdf', knownLength: buffer.length });
        // mergePDF=true matches the Postman request that's known to work — without it AuthBridge
        // may store the document differently, which can be why compose later fails to load it.
        const response = await axios.post(
            `${apiUrl}/v1/documents?uploadType=custodian&mergePDF=true`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    access_token: msbToken,
                    tenant_id: tenantId,
                    ignoreContentType: 'true',
                    client_details: JSON.stringify({ platform: 'Windows', browser: 'Chrome', device: 'Desktop' })
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        // console.log('[AuthBridge] Upload response:', JSON.stringify(response.data));
        const data = response.data;
        if (!data || data.code !== 1) throw new Error(data?.message || 'Document upload failed');
        const docId = data.data?.documentList?.[0]?.docId
            || data.data?.docInfoList?.[0]?.docId
            || data.data?.docInfoList?.[0]?.id
            || data.data?.docId;
        // console.log('[AuthBridge] Upload data keys:', JSON.stringify(Object.keys(data.data || {})));
        // console.log('[AuthBridge] Extracted docId:', docId);
        if (!docId) throw new Error('Document ID not found in upload response');
        return docId;
    } catch (error) {
        customLog(null, 'error', { step: 'UploadDocument', error: error?.response?.data || error.message });
        throw vendorError('UploadDocument', error, 'Failed to upload document to AuthBridge');
    }
};

exports.composeEPakAuthBridge = async ({ apiUrl, msbToken, tenantId, docId, signersInfo, sequentialSignature, signingPolicy = 'QUICKSIGN', expiryDuration, ownerEmail, ownerFirstName, ownerLastName }) => {
    try {
        let workflowData;
        const buildTagLocation = (signer) => {
            // signer_position can be an array of positions [{x1,x2,y1,y2,page,...}] or a single object {x,y,height,width}
            let rawPos = signer.signer_position;

            const mapPosition = (pos) => {
                let x, y, width, height, pageNumber;
                if (pos && pos.x1 !== undefined) {
                    // Frontend format: x1,x2,y1,y2 in PDF points (origin top-left)
                    x = pos.x1;
                    y = pos.y1;
                    width = 130;
                    height = 7;
                    pageNumber = pos.page || 1;
                } else if (pos && pos.x !== undefined) {
                    // AuthBridge format already
                    x = pos.x;
                    y = pos.y;
                    width = pos.width;
                    height = pos.height;
                    pageNumber = pos.pageNumber || (Array.isArray(signer.page_number) ? signer.page_number[0] : (signer.page_number || 1));
                } else {
                    // Fallback defaults (matching Postman working values)
                    x = 368; y = 611; height = 7; width = 130;
                    pageNumber = 1;
                }
                return {
                    pageNumber: String(pageNumber),
                    x: String(x),
                    y: String(y),
                    height: String(height),
                    width: String(width)
                };
            };

            if (Array.isArray(rawPos) && rawPos.length > 0) {
                return rawPos.map(mapPosition);
            }
            return [mapPosition(rawPos)];
        };

        const buildSignerTag = (signer) => {
            const nameParts = (signer.signer_name || 'Signer User').trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';
            const mobile = signer.signer_phone || signer.mobile || null;
            // console.log('[AuthBridge] buildSignerTag - email:', signer.signer_email, '| mobile:', mobile);
            const tag = {
                email: signer.signer_email,
                firstName,
                lastName,
                tagLocationData: buildTagLocation(signer)
            };
            if (mobile) tag.mobile = String(mobile);
            return tag;
        };

        const resolvedSigningPolicy = signingPolicy === 'AADHAAR' ? 'AADHAAR' : 'QUICKSIGN';

        if (sequentialSignature) {
            const sorted = [...signersInfo].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
            workflowData = sorted.map((signer, idx) => ({
                wfStateOrder: idx + 1,
                action: 'SIGN',
                signingPolicy: resolvedSigningPolicy,
                docTagsData: [{
                    docUuid: docId,
                    signatureTagData: [buildSignerTag(signer)]
                }]
            }));
        } else {
            // All signers now share a single document-wide policy, so they fit in one workflow state.
            workflowData = [{
                wfStateOrder: 1,
                action: 'SIGN',
                signingPolicy: resolvedSigningPolicy,
                docTagsData: [{
                    docUuid: docId,
                    signatureTagData: signersInfo.map(buildSignerTag)
                }]
            }];
        }
        const epakBody = {
            docUuid: [docId],
            workflowData,
            ...(expiryDuration !== undefined && { expiryDuration }),
            useAutoAppend: false,
            sendEmail: true,
            ...(ownerEmail && {
                customFields: {
                    autoEnrollOwner: true,
                    owner_email: ownerEmail,
                    owner_firstname: ownerFirstName,
                    owner_lastname: ownerLastName,
                }
            }),
        };
        customLog(null, 'info', { message: '[AuthBridge] Compose ePak body', epakBody });

        // Small delay to allow AuthBridge to finish processing the uploaded document
        await new Promise(resolve => setTimeout(resolve, 2000));

        const epakForm = new FormData();
        const epakJson = JSON.stringify(epakBody);
        epakForm.append('epakData', epakJson, { contentType: 'application/json', knownLength: Buffer.byteLength(epakJson) });
        const response = await axios.post(
            `${apiUrl}/v2/compose/epak`,
            epakForm,
            {
                headers: {
                    ...epakForm.getHeaders(),
                    access_token: msbToken,
                    tenant_id: tenantId
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        customLog(null, 'info', { message: '[AuthBridge] Compose ePak response', data: response.data });
        const data = response.data;
        if (!data || data.code !== 1) throw new Error(data?.message || 'ePak composition failed');
        const epakId = typeof data.data === 'string' ? data.data : (data.data?.epakUuid || data.data?.epakId || data.data);
        return epakId;
    } catch (error) {
        customLog(null, 'error', { step: 'ComposeEPak', error: error?.response?.data || error.message });
        throw vendorError('ComposeEPak', error, 'Failed to compose ePak');
    }
};

exports.downloadDocumentAuthBridge = async ({ apiUrl, msbToken, tenantId, docId, docType }) => {
    try {
        const response = await axios.get(`${apiUrl}/v1/document/download`, {
            params: { docId, docType },
            headers: {
                access_token: msbToken,
                tenant_id: tenantId
            },
            responseType: 'arraybuffer'
        });
        return response;
    } catch (error) {
        // arraybuffer errors come back as a Buffer — parse it to get the actual message
        if (error?.response?.data) {
            try {
                const errJson = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
                throw new Error(errJson?.message || 'Failed to download document');
            } catch (parseErr) {
                if (parseErr.message !== 'Failed to download document') throw parseErr;
            }
        }
        throw new Error(error?.message || 'Failed to download document');
    }
};

exports.getEasySignLinks = async ({ apiUrl, msbToken, tenantId, epakId }) => {
    try {
        const response = await axios.get(`${apiUrl}/v2/epaks/easysignlinks/${epakId}`, {
            headers: {
                access_token: msbToken,
                tenant_id: tenantId
            }
        });
        // console.log('[AuthBridge] EasySignLinks response:', JSON.stringify(response.data));
        const data = response.data;
        if (!data || data.code !== 1) throw new Error(data?.message || 'Failed to get sign links');
        // AuthBridge response: { data: [{ epakId, easySignInfo: [{ userEmail, easySignLink, ... }], code, message }] }
        if (Array.isArray(data.easySignInfo)) return data.easySignInfo;
        if (Array.isArray(data.data) && data.data[0]?.easySignInfo) return data.data[0].easySignInfo;
        return data.signers || [];
    } catch (error) {
        customLog(null, 'error', { step: 'GetSignLinks', error: error?.response?.data || error.message });
        throw vendorError('GetSignLinks', error, 'Failed to get signing links');
    }
};

exports.getEpakDetails = async ({ apiUrl, msbToken, tenantId, epakId, frontendUrl }) => {
    try {
        const response = await axios.get(`${apiUrl}/v2/epaks/${epakId}`, {
            headers: {
                access_token: msbToken,
                tenant_id: tenantId,
                ...(frontendUrl && { Referer: frontendUrl, Origin: frontendUrl })
            }
        });
        const data = response.data;
        if (!data || data.code !== 1) throw new Error(data?.message || 'Failed to get ePak details');
        return data.data;
    } catch (error) {
        customLog(null, 'error', { error: error?.response?.data || error.message });
        throw new Error(error?.response?.data?.message || error.message || 'Failed to get ePak details');
    }
};

exports.sendBulkReminder = async ({ apiUrl, msbToken, tenantId, epakIds, frontendUrl }) => {
    try {
        const response = await axios.post(
            `${apiUrl}/v2/epaks/bulk/reminder`,
            { ePakId: epakIds },
            {
                headers: {
                    access_token: msbToken,
                    tenant_id: tenantId,
                    'Content-Type': 'application/json',
                    ...(frontendUrl && { Referer: frontendUrl, Origin: frontendUrl })
                }
            }
        );
        const data = response.data;
        if (!data || data.code !== 1) throw new Error(data?.message || 'Failed to send bulk reminder');
        return data;
    } catch (error) {
        customLog(null, 'error', { error: error?.response?.data || error.message });
        throw new Error(error?.response?.data?.message || error.message || 'Failed to send bulk reminder');
    }
};

exports.sendIndividualReminder = async ({ apiUrl, msbToken, tenantId, epakId, userId, stateId, wfOrder, frontendUrl }) => {
    try {
        const response = await axios.post(
            `${apiUrl}/v2/epaks/${epakId}/user/${userId}/state/${stateId}/wforder/${wfOrder}/reminder`,
            {},
            {
                headers: {
                    access_token: msbToken,
                    tenant_id: tenantId,
                    'Content-Type': 'application/json',
                    client_details: JSON.stringify({ platform: 'Windows 10', browser: 'Chrome', device: 'Desktop' }),
                    ...(frontendUrl && { Referer: frontendUrl, Origin: frontendUrl })
                }
            }
        );
        const data = response.data;
        if (!data || data.code !== 1) throw new Error(data?.message || 'Failed to send reminder');
        return data;
    } catch (error) {
        customLog(null, 'error', { error: error?.response?.data || error.message });
        throw new Error(error?.response?.data?.message || error.message || 'Failed to send reminder');
    }
};

exports.fetchVendorDetails = async (user, accessKey) => {
    try {

        const credentialId = user.id //will come from userObject
        const packageId = user.packageId //will come from userObject
        const corporateUserId = user.corporateId
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId
        })
        if (serviceDetails.hasOwnProperty('error')) {
            await customLog(
                null,
                "error",
                {
                  message: "Error fetching service details",
                  error: serviceDetails.error,
                  serviceDetails,
                }
        
              );
            throw new Error('Service unavailable');
        }
        
        return serviceDetails.vendor
    } catch (error) {
        customLog(null, 'error', { error: error.message });

        throw new Error('Apologies, the service you are trying to access is currently unavailable.')
    }
}
exports.updateSignerDetails = async (req) => {
    const transaction = await sequelize.transaction();
    let result;
    try {
        let { id, signer_id } = req.query
        let { email, name } = req.body
        // find the saved doc 
        let { status, message, data: eSignDoc } = await findESignDocById(id)
        if (!status) {
            await transaction.rollback();
            return { status: false, message: message }
        }
        // Update signers_info
        const updatedSignersInfo = eSignDoc.signers_info.map(signer => {
            if (signer.signer_id === signer_id) {
                const updatedSigner = { ...signer };
                if (signer.signer_name !== name) updatedSigner.signer_name = name;
                if (signer.signer_email !== email) updatedSigner.signer_email = email;
                return updatedSigner;
            }
            return signer;
        });

        // Perform the update
        await eSign.update(
            { signers_info: updatedSignersInfo },
            { where: { id }, transaction }
        );
        await transaction.commit();
        return { status: true, message: 'success', data: {} }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        let data = result?.data
        await transaction.rollback();
        return { status: false, message: 'Something went wrong. Please try again later.', data: data }
    }
};

exports.eSignReminders = async () => {
    try {
        const { data } = await findESignDoc();
        if (!data.length) {
            return;
        }

        const checkInterval = (createdAt, interval) => {
            const createdDate = new Date(createdAt);
            const currentDate = new Date();
            const dayDiff = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
            return dayDiff % interval === 0;
        };

        // Group docs that are due for a reminder today by their docket_id
        const epakIdsDue = [];
        for (const doc of data) {
            if (checkInterval(doc.createdAt, doc.reminder_interval)) {
                epakIdsDue.push(doc.docket_id);
            }
        }

        if (!epakIdsDue.length) return;

        const operator = await findServiceOperatorByAccessKey('signDrive_eSign');
        if (!operator || operator.error) {
            customLog(null, 'error', { message: 'eSignReminders: vendor config not found for signDrive_eSign' });
            return;
        }
        const { apiUrl, optional1: client_id, optional2: client_secret, optional3: username, optional4: password, optional5: tenantId, optional6: frontendUrl } = operator;

        const msbToken = await exports.getAuthBridgeAccessToken(apiUrl, { client_id, client_secret, username, password });
        await exports.sendBulkReminder({ apiUrl, msbToken, tenantId, epakIds: epakIdsDue, frontendUrl });

        customLog(null, 'info', { message: 'eSignReminders: bulk reminder sent', epakIds: epakIdsDue });
    } catch (error) {
        customLog(null, 'error', { error: error.message });
        return false;
    }
};

exports.emailEsignComplete = async (data) => {
    try {

        const { document_url, docket_title, signers_info, credentialId } = data;

        // Resolve the actual corporate's white-label partner via the eSign doc's own
        // credential, so a reseller's corporates see their partner's branding instead
        // of always defaulting to generic Peko details.
        const cred = credentialId ? await credential.findOne({ where: { id: credentialId }, attributes: ['registeredBy'] }) : null;
        const registeredBy = cred?.registeredBy || null;
        const partnerDetails = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
        const { subject, html, sender } = await resolveESignCompletedEmail(docket_title, document_url, partnerDetails, {
            partnerId: registeredBy,
        });
        const emailPromises = signers_info.map(signer => {
            const emailId = signer.signer_email;
            return emailer.email(emailId, subject, html, undefined, sender);
        });

        await Promise.all(emailPromises);
        return true;

    } catch (error) {
        customLog(null, 'error', { error: error.message });
        return false;
    }
};

exports.findWebHookService = async (req) => {
    try {
        // AuthBridge sends an array or object with numeric keys, with epakId in first entry
        const firstEntry = Array.isArray(req.body) ? req.body[0] : req.body?.['0'];
        if (firstEntry?.epakId) {
            return { status: true, message: 'Success', serviceAccessKey: 'authbridge_esign' };
        }

        const { document_id, docket_id, custom_parameter } = req.body;
        //check eSign doc
        const { status } = await findDocToUpdate({ document_id, docket_id });
        if (status) return { status: true, message: 'Success', serviceAccessKey: 'REDACTED' };

        // check collector doc
        let agreementData = await findAgreementToUpdate({ document_id, docket_id })
        if (agreementData.status) return { status: true, message: 'Success', serviceAccessKey: 'quick_links' };

        if (custom_parameter && custom_parameter?.access_key) {
            return { status: true, message: 'Success', serviceAccessKey: custom_parameter?.access_key };
        }

        // if not able to find it's service returns false
        return { status: false, message: 'Service not found' };
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
       return { status: false, message: 'Service not found due to an error' };
    }
};

exports.handleAuthBridgeESignUpdate = async (req) => {
    try {
        const payload = Array.isArray(req.body) ? req.body[0] : req.body?.['0']; // AuthBridge sends array or object with numeric keys
        const { epakId, document_id, eventType, overall_status, documentUrl, signers } = payload;

        // console.log('[AuthBridge Webhook] Received:', JSON.stringify({ epakId, document_id, eventType, overall_status }));
        customLog(req?.LogTraceId, 'info', { message: '[AuthBridge Webhook]', epakId, document_id, eventType, overall_status });

        // Search by docket_id (epakId) only — using entity directly to avoid undefined document_id issue
        const eSignDoc = await eSign.findOne({ where: { docket_id: epakId } });
        if (!eSignDoc) {
            // console.log('[AuthBridge Webhook] Doc not found for epakId:', epakId);
            customLog(req?.LogTraceId, 'error', { message: '[AuthBridge Webhook] Doc not found', epakId });
            return { status: false, message: 'eSign document not found' };
        }
        // console.log('[AuthBridge Webhook] Doc found, id:', eSignDoc.id, '| current status:', eSignDoc.status);
        const data = eSignDoc;

        if (eventType === 'SIGNCOMPLETED' || overall_status?.toLowerCase() === 'completed') {
            // AuthBridge fires a per-signer SIGNCOMPLETED event for the final signer AND a
            // separate overall_status=completed event for the same envelope (plus possible
            // webhook retries). Without this guard both hit emailEsignComplete and every
            // signer gets the "document completed" email twice.
            if (data.status === 'COMPLETED') {
                customLog(req?.LogTraceId, 'info', { message: '[AuthBridge Webhook] Already COMPLETED, skipping duplicate', epakId });
                return { status: true, message: 'Success' };
            }
            // Save signed document URL directly from webhook payload
            if (documentUrl) {
                data.document_url = documentUrl;
                data.changed('document_url', true);
            }
            // Update signers info
            const existingSigners = JSON.parse(JSON.stringify(data.signers_info || []));
            if (Array.isArray(signers)) {
                signers.forEach(s => {
                    const match = existingSigners.find(e => e.signer_email === s.email);
                    if (match) match.status = s.signing_status === 'Signed' ? 'signed' : s.signing_status?.toLowerCase() || 'signed';
                });
            }
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            data.status = 'COMPLETED';
            data.doc_expiry_date = expiry;
            data.signers_info = existingSigners;
            data.changed('signers_info', true);
            data.changed('status', true);
            await data.save();
            await exports.emailEsignComplete(data);

            if (data.sourceType === ESIGN_SOURCE_TYPES.AGREEMENT && data.sourceId) {
                const agreementUpdate = { status: 'SIGNED' };
                if (documentUrl) {
                    try {
                        const docResponse = await axios.get(documentUrl, { responseType: 'arraybuffer' });
                        const base64String = Buffer.from(docResponse.data).toString('base64');
                        const filePath = `${NODE_ENV || 'staging'}/esign-agreements`;
                        const s3Url = await uploadFile(base64String, filePath, 'pdf');
                        agreementUpdate.documentUrl = s3Url;
                    } catch (uploadErr) {
                        customLog(req?.LogTraceId, 'error', { message: '[handleAuthBridgeESignUpdate] S3 upload failed', error: uploadErr.message });
                        agreementUpdate.documentUrl = documentUrl;
                    }
                }
                await updateAgreement({ id: data.sourceId }, agreementUpdate);
                await pushAgreementTimeline(data.sourceId, "Agreement signed");
            }

            if (data.sourceType === ESIGN_SOURCE_TYPES.LEGAL_DOCUMENT && data.sourceId) {
                const legalDocUpdate = { status: 'SIGNED' };
                if (documentUrl) {
                    try {
                        const docResponse = await axios.get(documentUrl, { responseType: 'arraybuffer' });
                        const base64String = Buffer.from(docResponse.data).toString('base64');
                        const filePath = `${NODE_ENV || 'staging'}/esign-legalDocuments`;
                        const signedUrl = await uploadFile(base64String, filePath, 'pdf');
                        legalDocUpdate.documentUrl = signedUrl;
                    } catch (uploadErr) {
                        customLog(req?.LogTraceId, 'error', { message: '[handleAuthBridgeESignUpdate] legal doc upload failed', error: uploadErr.message });
                        legalDocUpdate.documentUrl = documentUrl;
                    }
                }
                await updateLegalDocument(data.sourceId, legalDocUpdate);
            }

            if (data.sourceType === ESIGN_SOURCE_TYPES.OFFER_LETTER && data.sourceId) {
                let signedDocumentUrl = documentUrl;
                if (documentUrl) {
                    try {
                        const docResponse = await axios.get(documentUrl, { responseType: 'arraybuffer' });
                        const base64String = Buffer.from(docResponse.data).toString('base64');
                        const filePath = `${NODE_ENV || 'staging'}/esign-offerLetters`;
                        signedDocumentUrl = await uploadFile(base64String, filePath, 'pdf');
                    } catch (uploadErr) {
                        customLog(req?.LogTraceId, 'error', { message: '[handleAuthBridgeESignUpdate] offer letter upload failed', error: uploadErr.message });
                    }
                }
                await exports.notifyPayrollOfferLetterStatus(data.sourceId, {
                    status: 'SIGNED',
                    signedDocumentUrl,
                    eSignId: String(data.id),
                });
            }

            if (data.sourceType === ESIGN_SOURCE_TYPES.CORPORATE_CARD_AGREEMENT && data.sourceId) {
                const signedPdfBase64 = await fetchSignedPdfBase64(
                    data.document_id,
                    req?.LogTraceId,
                    ESIGN_DOC_TYPE.AUDIT_TRAIL
                );
                if (!signedPdfBase64) {
                    customLog(req?.LogTraceId, 'error', {
                        action: 'esign:corporateCard:auditTrailUnavailable',
                        message: '[handleAuthBridgeESignUpdate] Audit-trail copy could not be fetched; no agreement will be stored',
                        corporateId: data.sourceId,
                        epakId,
                        documentId: data.document_id,
                        docType: ESIGN_DOC_TYPE.AUDIT_TRAIL,
                    });
                }
                await exports.notifyCorporateCardAgreementStatus({
                    corporateId: data.sourceId,
                    epakId,
                    status: 'SIGNED',
                    signedPdfBase64,
                    signedAt: new Date().toISOString(),
                    signerEmail: Array.isArray(signers) ? signers[0]?.email || null : null,
                    eSignId: String(data.id),
                });
            }

        } else if (eventType === 'DOCUMENTSIGNED') {
            const existingSigners = JSON.parse(JSON.stringify(data.signers_info || []));
            if (Array.isArray(signers)) {
                signers.forEach(s => {
                    const match = existingSigners.find(e => e.signer_email === s.email);
                    if (match) match.status = s.signing_status === 'Signed' ? 'signed' : s.signing_status?.toLowerCase() || match.status;
                });
            }
            data.signers_info = existingSigners;
            data.changed('signers_info', true);
            await data.save();

        } else if (eventType === 'SIGNDECLINED') {
            const existingSigners = JSON.parse(JSON.stringify(data.signers_info || []));
            if (Array.isArray(signers)) {
                signers.forEach(s => {
                    if (s.signing_status === 'Declined') {
                        const match = existingSigners.find(e => e.signer_email === s.email);
                        if (match) match.status = 'declined';
                    }
                });
            }
            data.signers_info = existingSigners;
            data.status = 'REJECTED';
            data.changed('signers_info', true);
            data.changed('status', true);
            await data.save();

            if (data.sourceType === ESIGN_SOURCE_TYPES.OFFER_LETTER && data.sourceId) {
                await exports.notifyPayrollOfferLetterStatus(data.sourceId, { status: 'REJECTED', eSignId: String(data.id) });
            }

            if (data.sourceType === ESIGN_SOURCE_TYPES.CORPORATE_CARD_AGREEMENT && data.sourceId) {
                await exports.notifyCorporateCardAgreementStatus({
                    corporateId: data.sourceId,
                    epakId,
                    status: 'FAILED',
                    reason: 'DECLINED',
                    eSignId: String(data.id),
                });
            }

        } else if (eventType === 'EPAKEXPIRED') {
            data.status = 'EXPIRED';
            data.changed('status', true);
            await data.save();

            if (data.sourceType === ESIGN_SOURCE_TYPES.CORPORATE_CARD_AGREEMENT && data.sourceId) {
                await exports.notifyCorporateCardAgreementStatus({
                    corporateId: data.sourceId,
                    epakId,
                    status: 'FAILED',
                    reason: 'EXPIRED',
                    eSignId: String(data.id),
                });
            }
        }
        // DOCUMENTVIEWED — no action needed, just acknowledge

        return { status: true, message: 'Success' };
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: '[AuthBridge Webhook] Error', error: error.message });
        return { status: false, message: error.message || 'Something went wrong' };
    }
};

exports.handlePekoESignUpdate = async (req) => {
    try {
        const user = req.user;
        let { document_id, docket_id, signer_info: signer_info_body, file_content } = req.body

        // find the saved docs
        let { status, message, data } = await findDocToUpdate({ document_id, docket_id })
        if (!status) return { status: false, message: message }


        let existingSignersInfo = JSON.parse(JSON.stringify(data.signers_info)) || []

        if (Array.isArray(signer_info_body)) {     // Fully completed state
            // we receive signer_info_body as an  array once the whole signer is signed successfully also we get file_content
            const today = new Date();
            today.setDate(today.getDate() + 30);

            if (file_content) {
                const base64String = file_content.replace(/^data:application\/pdf;base64,/, '');
                const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/eSignDocs`
                let updatedUrl = await uploadFileToS3(base64String, filePath, 'pdf'); //need to update with new doc 
                data.document_url = updatedUrl
            }
            data.status = 'COMPLETED'
            data.doc_expiry_date = today

            if (data.sourceType === ESIGN_SOURCE_TYPES.AGREEMENT && data.sourceId) {
                const agreementUpdate = { status: 'SIGNED' };
                if (file_content) {
                    const base64String = file_content.replace(/^data:application\/pdf;base64,/, '');
                    const filePath = `${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/eSignDocs`;
                    let url = await uploadFile(base64String, filePath, 'pdf');
                    agreementUpdate.documentUrl = url;
                }
                await updateAgreement({ id: data.sourceId }, agreementUpdate);
                await pushAgreementTimeline(data.sourceId, "Agreement signed");
            }

            if (data.sourceType === ESIGN_SOURCE_TYPES.LEGAL_DOCUMENT && data.sourceId) {
                const legalDocUpdate = { status: 'SIGNED' };
                if (file_content) {
                    try {
                        const base64String = file_content.replace(/^data:application\/pdf;base64,/, '');
                        const filePath = `${NODE_ENV || 'staging'}/esign-legalDocuments`;
                        let signedUrl = await uploadFile(base64String, filePath, 'pdf');
                        legalDocUpdate.documentUrl = signedUrl;
                    } catch (uploadErr) {
                        customLog(req?.LogTraceId, 'error', { message: '[handlePekoESignUpdate] legal doc upload failed', error: uploadErr.message });
                    }
                }
                await updateLegalDocument(data.sourceId, legalDocUpdate);
            }

            // to delay db operation to 3 sec to avoid conflicts b/w partial completion webhook call
            // we receive 2 webhook call at same time for last item
            await new Promise(resolve => setTimeout(resolve, 3000));
            await data.save()

            // Successfully completed updating
            return { status: true, message: "Success" }

        } else if (typeof signer_info_body === 'object' && signer_info_body !== null) {  // Partial completed state
            const { email } = signer_info_body
            const signer = existingSignersInfo.find(signer => signer.signer_email === email);
            if (signer) signer.status = 'signed'
            data.signers_info = existingSignersInfo

            await data.save()

            // Successfully completed updating 
            return { status: true, message: "Success" }
        } else {
            return { status: false, message: 'Invalid signers_info' }
        }

    } catch (error) {
        return { status: false, message: 'Something went wrong while updating eSign status' }
    }
};
exports.handlePekoESignAuditTrailUpdate = async (req) => {
    try {
        const user = req.user;
        let { document_id, docket_id, content } = req.body

        // find the saved docs
        let { status, message, data } = await findDocToUpdate({ document_id, docket_id })
        if (!status) return { status: false, message: message }

        if (content) {
            const base64String = content.replace(/^data:application\/pdf;base64,/, '');
            const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${user?.role ? user?.role.toLowerCase() : "unknown-role"}/${user?.username ? user?.username : "unknown-user"}/eSignDocs`
            data.audit_trail_url = await uploadFileToS3(base64String, filePath, 'pdf'); //need to update with new doc 
        }
        await data.save()

        return { status: true, message: "Success" }
    } catch (error) {
        return { status: false, message: 'Something went wrong while updating eSign audit trail' }
    }
};

exports.handleCollectorAgreementUpdate = async (req) => {
    const LogTraceId = req?.LogTraceId || new Date().getTime();
    try {
        let { document_id, docket_id, signer_info: signer_info_body, file_content } = req.body
        customLog(LogTraceId, 'info', { message: "✅✅✅✅E-SIGN WEBHOOK RESPONSE✅✅✅✅✅", document_id, file_content, docket_id, signer_info_body: Array.isArray(signer_info_body) ? 'array' : 'invalid' }, "VENDOR");

        // find the saved docs
        let { status, message, supplierData } = await findAgreementToUpdate({ document_id, docket_id })
        if (!status) return { status: false, message: message }

        const agreementDetails = supplierData.agreementDetails
        const userData = supplierData.corporateUser.credential

        if (Array.isArray(signer_info_body)) {     // Fully completed state
            // we receive signer_info_body as an  array once the whole signer is signed successfully also we get file_content

            supplierData.kybStatus = 'PENDING REVIEW'
            supplierData.agreementDetails = {
                ...agreementDetails,
                status: 'AGREEMENT SIGNED',
                agreement_signed_date: new Date()
            }

            const serviceDetails = await findServiceOperatorByAccessKey('quick_links')

            if (file_content) {
                const base64String = file_content.replace(/^data:application\/pdf;base64,/, '');
                const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/${userData?.role ? userData?.role.toLowerCase() : "unknown-role"}/${userData?.username ? userData?.username : "unknown-user"}/eSignDocs`
                let updatedUrl = await uploadFileEncryptedToS3(base64String, filePath, 'pdf'); //need to update with new doc 

                supplierData.agreementDetails = {
                    ...agreementDetails,
                    status: 'AGREEMENT SIGNED',
                    agreement_signed_date: new Date(),
                    agreement_url: updatedUrl
                }
                await supplierData.save()

                const apiUrl = serviceDetails.vendor.apiUrl
                const authKey = serviceDetails.vendor.optional1
                const formData = new FormData();
                formData.append("FileUpload", base64ToStream(base64String), {
                    filename: 'Tripartite Agreement.pdf',
                    contentType: 'application/pdf'
                });
                formData.append('FileType', '4');
                formData.append('SupplierCode', supplierData.supplierCode);

                const apiResponse = await axios.put(`${apiUrl}/v2/UploadSupplierDocument`, formData, {
                    headers: {
                        'Authorization': `Bearer ${authKey}`,
                        ...formData.getHeaders()
                    }
                });

                customLog(LogTraceId, 'info', { apiResponse: apiResponse?.data, message: "API response for uploading supplier document" }, "VENDOR");

                if (apiResponse?.data && apiResponse?.data.IsSuccess) {
                    // send an email to the vendor

                    const supplierName = supplierData.corporateUser.name.replace(/[^a-zA-Z0-9]/g, ' ');
                    const vendorEmails = serviceDetails.vendor.vendorEmail
                    // optional 6 hold CC email address
                    const emailCC = serviceDetails.vendor.optional6
                        ? serviceDetails.vendor.optional6.split(',').map(email => email.trim())
                        : [];

                    const vendorSubject = `23342-Peko ${supplierName} - Activation Request`
                    const body = kybSubmissionToVendor(supplierData, supplierName)
                    emailer.sendEmailWithCC(vendorEmails, emailCC, vendorSubject, body)
                    customLog(LogTraceId, 'info', { emailSentTo: vendorEmails, emailCC }, "VENDOR");
                }
            }

            // we receive 2 webhook call at same time for last item
            customLog(LogTraceId, 'info', { message: 'Supplier data saved successfully' }, "VENDOR");

            // Successfully completed updating 
            return { status: true, message: "Success" }
        } else if (typeof signer_info_body === 'object' && signer_info_body !== null) {
            return { status: true, message: 'Success' }
        } else {
            customLog(LogTraceId, 'error', { signer_info_body }, "VENDOR");
            return { status: false, message: 'Invalid signers_info' }
        }

    } catch (error) {
        customLog(LogTraceId, 'error', { error: error?.response?.data || error, message: "ERROR from handleCollectorAgreementUpdate" }, "VENDOR");
        return { status: false, message: 'Something went wrong while updating eSign status' }
    }
};

function base64ToStream(base64String) {
    // Remove the prefix if the Base64 string has a data URI scheme
    const base64Data = base64String.split(',')[1] || base64String;

    // Convert Base64 string to a Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a readable stream from the Buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // Indicate end of the stream

    return stream;
}