export const verificationConfigNew: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (data: any) => any;
        getValidityStatus?: (data: any) => string;
    }
> = {
    pan_verify: {
        fields: [
            { label: 'Registered Name', key: 'registered_name' },
            { label: 'PAN', key: 'pan' },
            { label: 'Name Match Score', key: 'name_match_score' },
        ],
        getData: data => data,
        getValidityStatus: data => {
            let statusValue: string | undefined;
            if (typeof data?.status === 'string') {
                statusValue = data.status;
            } else if (typeof data?.response?.status === 'string') {
                statusValue = data.response.status;
            }
            if (statusValue) {
                return statusValue.toUpperCase() === 'VALID' ? 'VALID' : 'INVALID';
            }
            return data?.valid === true ? 'VALID' : 'INVALID';
        },
    },
    gstin_verify: {
        fields: [
            { label: 'Legal Name', key: 'legal_name_of_business' },
            { label: 'Trade Name', key: 'trade_name_of_business' },
            { label: 'Registration Date', key: 'date_of_registration' },
            { label: 'Constitution of Business', key: 'constitution_of_business' },
            { label: 'GST Ref.ID', key: 'reference_id' },
            { label: 'GSTIN Status', key: 'gst_in_status' },
        ],
        getData: data => data,
        getValidityStatus: data => (data?.valid === true ? 'VALID' : 'INVALID'),
    },
};

export const InputConfigNew: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (data: any, responseData: any) => any;
    }
> = {
    pan_verify: {
        fields: [
            { label: 'PAN ', key: 'pan' },
            { label: 'Name Provided', key: 'name_provided' },
        ],
        getData: (responseData, data) => data || responseData,
    },
    gstin_verify: {
        fields: [
            { label: 'GSTIN', key: 'GSTIN' },
            { label: 'Name of Business', key: 'business_name' },
        ],
        getData: (responseData, data) => data || responseData,
    },
};
