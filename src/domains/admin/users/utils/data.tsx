export const verificationConfigNew: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (data: any) => any;
        getValidityStatus?: (data: any) => string;
    }
> = {
    cin_verify: {
        fields: [
            { label: 'Company Name', key: 'company_name' },
            { label: 'Incorporation Date', key: 'incorporation_date' },

            {
                label: 'Address',
                key: 'director_details[0].address',
            },
            {
                label: 'Name',
                key: 'director_details[0].name',
            },
            {
                label: 'DOB',
                key: 'director_details[0].dob',
            },
            {
                label: 'Designation',
                key: 'director_details[0].designation',
            },
            { label: 'Registration Number', key: 'registration_number' },
        ],
        getData: data => data, // Choose data or responseData
        getValidityStatus: data =>
            ['VALID', 'SUCCESS'].includes((data?.status || '').toUpperCase()) ? 'VALID' : 'INVALID',
    },
    pan_verify: {
        fields: [
            { label: 'Registered Name', key: 'registered_name' },
            { label: 'PAN', key: 'pan' },
            { label: 'Name Match Score', key: 'name_match_score' },
        ],
        getData: data => data,
        getValidityStatus: data => (data?.valid === true ? 'VALID' : 'INVALID'),
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
            { label: 'Name Provided', key: 'name' },
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
    cin_verify: {
        fields: [{ label: 'CIN', key: 'cin' }],
        getData: (responseData, data) => data || responseData,
    },
};

export const statusData = [
    {
        label: 'Pending',
        value: 'PENDING',
    },
    {
        label: 'Closed',
        value: 'CLOSED',
    },
];
