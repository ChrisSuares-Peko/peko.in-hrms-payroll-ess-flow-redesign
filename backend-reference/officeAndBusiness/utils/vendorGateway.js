const axios = require('axios');
const { customLog } = require('./loggerHelper');

const VENDOR_COUNTRY_ID = '68c00973d23bcd3a5d9e4bf9';

const ENTITY_TYPE_MAP = {
    private_limited: 'private_limited_company',
    public_limited: 'public_limited_company',
    opc: 'one_person_company',
    llp: 'limited_liability_partnership',
};

// Create a draft application on the vendor. No PDF required at this stage.
// Free for the agent; the company shell is required so document uploads can
// attach against it. Returns { _id, application_id, tracking_id, ... }.
//
// NOTE: this helper is intentionally duplicated from paymentGateway's vendorGateway.
// Each service ships as its own container in deploy, so cross-package require()
// breaks the pipeline. Keep the two copies in sync if vendor payload changes.
exports.createDraftApplication = async (apiUrl, apiKey, application) => {
    const formData = new FormData();
    const companyType = ENTITY_TYPE_MAP[application.entityType] || application.entityType;

    formData.append('reference_id', application.applicationId);
    formData.append('client_name', application.applicantDetails?.fullName || '');
    formData.append('client_email', application.applicantDetails?.email || '');
    formData.append('proposed_name', application.proposedNames?.firstChoice || '');
    formData.append('country', VENDOR_COUNTRY_ID);
    formData.append('company_type', companyType);
    formData.append('status', 'draft');

    const response = await axios.post(
        `${apiUrl}/api/v1/user/external/agent/direct-apps`,
        formData,
        { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!response.data?.status || !response.data?.data?._id) {
        throw new Error(`Vendor draft creation failed: ${JSON.stringify(response.data)}`);
    }

    return response.data.data;
};

exports.getVendorApplicationStatus = async (apiUrl, apiKey, vendorApplicationId) => {
    try {
        const response = await axios.get(
            `${apiUrl}/api/v1/user/external/agent/companies/${vendorApplicationId}/application-status`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        if (!response.data?.status || !Array.isArray(response.data?.data?.entries)) {
            throw new Error(`Vendor status fetch failed: ${JSON.stringify(response.data)}`);
        }
        return response.data.data.entries;
    } catch (err) {
        console.error('getVendorApplicationStatus error:', err?.response?.status, err?.response?.data || err?.message);
        throw err;
    }
};


// Fetches the vendor's registered-company setup data (a sections → instances →
// fields tree), returned verbatim for the frontend to shape.
exports.getVendorDocuments = async (apiUrl, apiKey, vendorApplicationId) => {
    try {
        const response = await axios.get(
            `${apiUrl}/api/v1/user/external/agent/companies/${vendorApplicationId}/documents`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        customLog(null, 'info', {
            message: 'Vendor documents raw response',
            vendorApplicationId,
            response: response.data,
        });
        if (!response.data?.status || !response.data?.data) {
            throw new Error(`Vendor documents fetch failed: ${JSON.stringify(response.data)}`);
        }
        return response.data.data;
    } catch (err) {
        customLog(null, 'error', {
            message: 'getVendorDocuments error',
            vendorApplicationId,
            status: err?.response?.status,
            response: err?.response?.data || err?.message,
        });
        throw err;
    }
};

exports.fetchVendorFileStream = async (fileUrl) => axios.get(fileUrl, { responseType: 'stream' });

// Uploads a base64 file to the vendor and attaches it to the company shell
// identified by `company` (the vendor's Mongo ObjectId, our vendorSetupId).
// Returns { vendorUrl, vendorFileRefUrl }:
//   - vendorUrl     : permanent Azure blob URL — stored on the document row,
//                     used by admin to view the file directly.
//   - vendorFileRefUrl : vendor's frontend viewer URL — embedded in the PDF
//                     sent to the vendor on promote-to-saved.
exports.uploadDocumentToVendor = async (apiUrl, apiKey, base64String, filename, company) => {
    const response = await axios.post(
        `${apiUrl}/api/v1/user/external/agent/direct-apps/upload-file`,
        { file: base64String, filename, company },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.data?.status || !response.data?.data?.url) {
        throw new Error(`Vendor file upload failed for ${filename}: ${JSON.stringify(response.data)}`);
    }

    const { url, file_ref_url: fileRefUrl } = response.data.data;
    return { vendorUrl: url, vendorFileRefUrl: fileRefUrl };
};
