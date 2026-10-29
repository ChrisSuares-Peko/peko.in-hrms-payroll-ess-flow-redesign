const axios = require('axios');

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

// Promote an existing draft to status='saved' with the final PDF. This is the
// billable trigger that hands the application to the vendor's filing pipeline.
exports.promoteApplicationToSaved = async (apiUrl, apiKey, vendorSetupId, pdfBuffer, application) => {
    const formData = new FormData();
    const pdfFilename = `application-${application.applicationId.replace(/\//g, '-')}.pdf`;

    formData.append('status', 'saved');
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), pdfFilename);

    const response = await axios.patch(
        `${apiUrl}/api/v1/user/external/agent/direct-apps/${vendorSetupId}`,
        formData,
        { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!response.data?.status) {
        throw new Error(`Vendor promotion to saved failed: ${JSON.stringify(response.data)}`);
    }

    return response.data;
};
