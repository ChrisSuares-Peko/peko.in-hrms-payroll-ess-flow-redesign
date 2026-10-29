import adhar from '@domains/dashboard/verificationSuite/assets/aadhaar.png';
import cin from '@domains/dashboard/verificationSuite/assets/cin.svg';
import creditCard from '@domains/dashboard/verificationSuite/assets/credit-card.svg';
import gst from '@domains/dashboard/verificationSuite/assets/gst.png';
import pan from '@domains/dashboard/verificationSuite/assets/PAN.png';

import { gstStateCodeOptions } from './gstStateCodes';

export const identityVerification = [
    {
        title: 'PAN Verification',
        desc: 'Quickly verify if the provided PAN belongs to the stated holder.',
        logo: pan,
        accessKey: 'pan_verify',
        serviceName: 'PAN',
        inputComponents: [
            {
                type: 'input',
                name: 'pan',
                label: 'PAN ',
                placeholder: 'Enter PAN ',
                min: 10,
                max: 10,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
                allowUpperCaseOnly: true,
            },
            {
                type: 'input',
                name: 'name',
                label: 'Name',
                placeholder: 'Enter name',
                min: 3,
                max: 50,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: true,
                allowNumbersOnly: false,
            },
            {
                type: 'date',
                name: 'date_of_birth',
                label: 'Date of Birth',
                placeholder: 'Enter Date of Birth',
                required: true,
            },
        ],
        serviceValue: 'a PAN',
    },
    // {
    //     title: 'PAN Advance Verification',
    //     desc: 'Retrieve additional PAN details, including first/last name and Aadhaar number.',
    //     logo: pan,
    //     accessKey: 'advance_pan_verify',
    //     serviceName: 'PAN',
    //     inputComponents: [
    //         {
    //             type: 'input',
    //             name: 'pan',
    //             label: 'PAN ',
    //             placeholder: 'Enter PAN ',
    //             min: 10,
    //             max: 10,
    //             required: true,
    //             allowAlphabetsAndNumbersOnly: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //             allowNumbersOnly: false,
    //             allowUpperCaseOnly: true,
    //         },
    //         {
    //             type: 'input',
    //             name: 'name',
    //             label: 'Name',
    //             placeholder: 'Enter name',
    //             min: 3,
    //             max: 50,
    //             required: false,
    //             allowAlphabetsAndNumbersOnly: false,
    //             allowAlphabetsAndSpaceOnly: true,
    //             allowNumbersOnly: false,
    //         },
    //     ],
    //     serviceValue: 'a PAN using advanced verification',
    // },
    // {
    //     title: 'PAN Verification with name match',
    //     desc: 'Quickly verify if the provided PAN belongs to the stated holder.',
    //     logo: pan,
    // },
    {
        title: 'Aadhaar OKYC Verification',
        desc: 'Verify Aadhaar details via secure DigiLocker consent.',
        logo: adhar,
        serviceName: 'Aadhaar',
        accessKey: 'aadhar_verify',
        inputComponents: [
            {
                type: 'input',
                name: 'name',
                label: 'Name',
                placeholder: 'Enter name',
                min: 3,
                max: 60,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: true,
                allowNumbersOnly: false,
            },
            {
                type: 'input',
                name: 'email',
                label: 'Email',
                placeholder: 'Enter email',
                min: 5,
                max: 100,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
            },
            {
                type: 'input',
                name: 'mobile',
                label: 'Mobile Number',
                placeholder: 'Enter mobile number',
                min: 10,
                max: 10,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: true,
            },
        ],
        serviceValue: 'an Aadhaar',
    },
    // {
    //     title: 'Aadhaar OCR',
    //     desc: 'Verify individual identity swiftly using India’s trusted biometric system.',
    //     logo: adhar,
    //     serviceName: 'Aadhaar',
    //     accessKey: 'aadhar_ocr_verify',
    //     inputComponents: [
    //         {
    //             type: 'fileUpload',
    //             name: 'image',
    //             label: 'Upload Image',
    //             placeholder: 'Upload Image',
    //             // min: 11,
    //             // max: 11,
    //         },
    //     ],
    //     serviceValue: 'an Aadhaar details using OCR',
    // },
    {
        title: 'Bank Account',
        desc: 'Confirm individual bank account ownership and ensure correct name/IFSC.',
        logo: creditCard,
        accessKey: 'bank_account_verify',
        serviceName: 'Bank Account',
        inputComponents: [
            {
                type: 'input',
                name: 'bank_account',
                label: 'Account Number',
                placeholder: 'Enter account number',
                min: 9,
                max: 18,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: true,
            },
            {
                type: 'input',
                name: 'ifsc',
                label: 'IFSC Code',
                placeholder: 'Enter IFSC code',
                min: 11,
                max: 11,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
                allowUpperCaseOnly: true,
            },
            {
                type: 'input',
                name: 'name',
                label: 'Name',
                placeholder: 'Enter name',
                min: 3,
                max: 50,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: true,
                allowNumbersOnly: false,
            },
        ],
        serviceValue: 'a Bank account',
    },
    // {
    //     title: 'Bank Account With Name Match',
    //     desc: 'Confirm individual bank account ownership with name match score.',
    //     logo: creditCard,
    // },
    // {
    //     title: 'Bank Branch (IFSC)',
    //     desc: 'Verify IFSC and obtain branch details such as bank name, branch, address, etc.',
    //     logo: creditCard,
    //     accessKey: 'ifsc_verify',
    //     serviceName: 'IFSC',
    //     inputComponents: [
    //         {
    //             type: 'input',
    //             name: 'ifsc',
    //             label: 'IFSC Code',
    //             placeholder: 'Enter IFSC code',
    //             min: 11,
    //             max: 11,
    //             required: true,
    //             allowAlphabetsAndNumbersOnly: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //             allowNumbersOnly: false,
    //             allowUpperCaseOnly: true,
    //         },
    //     ],
    //     serviceValue: 'an IFSC code',
    // },
    // {
    //     title: 'Driving License',
    //     desc: 'Verify driving license details, useful for employee or customer KYC.',
    //     logo: license,
    //     accessKey: 'dl_verify',
    //     serviceName: 'Driving License',
    //     inputComponents: [
    //         {
    //             type: 'input',
    //             name: 'dl_number',
    //             label: 'License Number',
    //             placeholder: 'Enter license number',
    //             min: 15,
    //             max: 15,
    //             required: true,
    //             allowAlphabetsAndNumbersOnly: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //             allowNumbersOnly: false,
    //             allowUpperCaseOnly: true,
    //         },
    //         {
    //             type: 'date',
    //             name: 'dob',
    //             label: 'DOB',
    //             placeholder: 'Enter DOB',
    //             required: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //         },
    //     ],
    //     serviceValue: 'a Driving License',
    // },
    // {
    //     title: 'Voter ID',
    //     desc: 'Confirm voter ID information, useful for additional identity proof.',
    //     logo: voterId,
    //     accessKey: 'voter_id_verify',
    //     serviceName: 'Voter ID',
    //     inputComponents: [
    //         {
    //             type: 'input',
    //             name: 'epic_number',
    //             label: 'Voter ID Number / EPIC Number (Electors Photo Identity Card)',
    //             placeholder: 'Enter voter ID/EPIC Number',
    //             min: 10,
    //             max: 10,
    //             required: true,
    //             allowAlphabetsAndNumbersOnly: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //             allowNumbersOnly: false,
    //             allowUpperCaseOnly: true,
    //         },
    //         {
    //             type: 'input',
    //             name: 'name',
    //             label: 'Name',
    //             placeholder: 'Enter name',
    //             min: 3,
    //             max: 50,
    //             allowAlphabetsAndNumbersOnly: false,
    //             allowAlphabetsAndSpaceOnly: true,
    //             allowNumbersOnly: false,
    //         },
    //     ],
    //     serviceValue: 'a Voter ID ',
    // },
    // {
    //     title: 'Passport Verification',
    //     desc: 'Validate passport details as an identity document.',
    //     logo: passPort,
    //     accessKey: 'passport_verify',
    //     serviceName: 'Passport',
    //     inputComponents: [
    //         {
    //             type: 'input',
    //             name: 'file_number',
    //             label: 'File Number',
    //             placeholder: 'Enter file number',
    //             min: 15,
    //             max: 17,
    //             required: true,
    //             allowAlphabetsAndNumbersOnly: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //             allowNumbersOnly: false,
    //             allowUpperCaseOnly: true,
    //         },

    //         {
    //             type: 'date',
    //             name: 'dob',
    //             label: 'DOB',
    //             placeholder: 'Enter DOB',
    //             required: true,
    //         },
    //         {
    //             type: 'input',
    //             name: 'name',
    //             label: 'Name',
    //             placeholder: 'Enter name',
    //             min: 3,
    //             max: 50,
    //             allowAlphabetsAndNumbersOnly: false,
    //             allowAlphabetsAndSpaceOnly: true,
    //             allowNumbersOnly: false,
    //         },
    //     ],
    //     serviceValue: 'a Passport',
    // },
];

export const businessVerification = [
    {
        title: 'GST Return Compliance Check',
        desc: 'Check GST return filing history for a business, including return type, filing status, and submission dates.',
        logo: gst,
        accessKey: 'gst_return_check',
        serviceName: 'GSTIN',
        inputComponents: [
            {
                type: 'input',
                name: 'GSTIN',
                label: 'GSTIN',
                placeholder: 'Enter GSTIN',
                min: 15,
                max: 15,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
                allowUpperCaseOnly: true,
            },
            {
                type: 'dropdown',
                name: 'fy',
                label: 'Financial year',
                placeholder: 'select year',
                required: true,
            },
        ],
        serviceValue: 'GSTIN Return Compliance',
    },
    {
        title: 'GSTIN Verification',
        desc: 'Validate a business’s GSTIN and confirm whether it is active.',
        logo: gst,
        accessKey: 'gstin_verify',
        serviceName: 'GSTIN',
        inputComponents: [
            {
                type: 'input',
                name: 'GSTIN',
                label: 'GSTIN ',
                placeholder: 'Enter GSTIN ',
                min: 15,
                max: 15,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
                allowUpperCaseOnly: true,
            },
        ],
        serviceValue: 'a GSTIN',
    },
    {
        title: 'Fetch GSTIN from PAN',
        desc: 'Fetch GSTINs associated with a PAN to validate linked businesses.',
        logo: gst,
        accessKey: 'gstin_pan',
        serviceName: 'GSTIN',
        inputComponents: [
            {
                type: 'input',
                name: 'pan_no',
                label: 'PAN ',
                placeholder: 'Enter PAN ',
                min: 10,
                max: 10,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
                allowUpperCaseOnly: true,
            },
            {
                type: 'select',
                name: 'state_code',
                label: 'State',
                placeholder: 'Select state',
                required: true,
                options: gstStateCodeOptions,
            },
        ],
        serviceValue: 'GSTIN(s) retrieved from a PAN',
    },
    {
        title: 'GST Business Verification',
        desc: 'Verify GST registration details of vendors, customers, or partners.',
        logo: gst,
        accessKey: 'gst_business_verify',
        serviceName: 'GSTIN',
        inputComponents: [
            {
                type: 'input',
                name: 'GSTIN',
                label: 'GSTIN Number',
                placeholder: 'Enter GSTIN number',
                min: 15,
                max: 15,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
            },
        ],
    },
    // {
    //     title: 'CIN Verification',
    //     desc: 'Check a company’s registration status via its Corporate Identification Number.',
    //     logo: cin,
    //     accessKey: 'cin_verify',
    //     serviceName: 'CIN',
    //     inputComponents: [
    //         {
    //             type: 'input',
    //             name: 'cin',
    //             label: 'Corporate Identification Number (CIN)',
    //             placeholder: 'Enter CIN',
    //             min: 21,
    //             max: 21,
    //             required: true,
    //             allowAlphabetsAndNumbersOnly: true,
    //             allowAlphabetsAndSpaceOnly: false,
    //             allowNumbersOnly: false,
    //             allowUpperCaseOnly: true,
    //         },
    //     ],
    //     serviceValue: 'a CIN',
    // },
    {
        title: 'Corporate Entity Verification',
        desc: 'Verify company details using CIN, including company name, status, incorporation date, and ROC jurisdiction.',
        logo: cin,
        accessKey: 'corporate_verify',
        serviceName: 'Corporate Entity',
        inputComponents: [
            {
                type: 'input',
                name: 'cin',
                label: 'CIN ',
                placeholder: 'Enter CIN ',
                min: 21,
                max: 21,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
            },
        ],
        serviceValue: 'a Corporate Entity',
    },
    {
        title: 'Director Verification (CIN-based)',
        desc: 'Retrieve details of directors associated with a company using CIN.',
        logo: cin,
        accessKey: 'director_verify_cin',
        serviceName: "Director's CIN",
        inputComponents: [
            {
                type: 'input',
                name: 'cin',
                label: 'CIN ',
                placeholder: 'Enter CIN ',
                min: 21,
                max: 21,
                required: true,
                allowAlphabetsAndNumbersOnly: true,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: false,
            },
        ],
        serviceValue: "Director's CIN",
    },
    {
        title: 'Director Verification (DIN-based)',
        desc: 'Fetch details of a specific director based on their DIN.',
        logo: cin,
        accessKey: 'director_verify_din',
        serviceName: "Director's DIN",
        inputComponents: [
            {
                type: 'input',
                name: 'din',
                label: 'DIN',
                placeholder: 'Enter DIN',
                min: 8,
                max: 8,
                required: true,
                allowAlphabetsAndNumbersOnly: false,
                allowAlphabetsAndSpaceOnly: false,
                allowNumbersOnly: true,
            },
        ],
        serviceValue: "Director's DIN",
    },
];
function getUnifiedSource(responseData: any) {
    return responseData?.orderResponse?.Result;
}

export const verificationConfigs: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (responseData: any) => any;
        getValidityStatus?: (responseData: any) => string;
    }
> = {
    cin_verify: {
        fields: [
            { label: 'Company Name', key: 'company_name' },
            { label: 'Incorporation Date', key: 'incorporation_date' },
            { label: 'Registration Number', key: 'registration_number' },
            {
                label: 'Name',
                key: 'director_details[0].name',
            },
            {
                label: 'Address',
                key: 'director_details[0].address',
            },
            {
                label: 'Date Of Birth',
                key: 'director_details[0].dob',
            },
            {
                label: 'Email ID',
                key: 'email',
            },
            {
                label: 'Incorporation Country',
                key: 'incorporation_country',
            },
            {
                label: 'DIN',
                key: 'director_details[0].din',
            },
            {
                label: 'Designation',
                key: 'director_details[0].designation',
            },
            { label: 'Company Status', key: 'status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    bank_account_verify: {
        fields: [
            { label: 'Name at Bank', key: 'name_at_bank' },
            { label: 'Account Status', key: 'account_status' },
            { label: 'Bank Name', key: 'bank_name' },
            { label: 'Branch', key: 'ifsc_details.branch' },
            { label: 'City', key: 'ifsc_details.city' },
            { label: 'Name Match Result', key: '"name_match_result' },
            { label: 'Account Status Code', key: 'account_status_code' },
            { label: 'UTR', key: 'utr' },
            { label: 'MICR', key: 'micr' },
            // { label: 'IFSC Validity', key: 'account_status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'ACCOUNT_IS_VALID'].includes(
                src?.account_status || src?.account_status_code
            )
                ? 'VALID'
                : 'INVALID';
        },
    },
    pan_verify: {
        fields: [
            { label: 'Registered Name', key: 'registered_name' },
            { label: "Father's Name", key: 'father_name' },
            { label: 'PAN Type', key: 'type' },
            { label: 'Name Match Score', key: 'name_match_score' },
            { label: 'PAN Validity', key: 'valid' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return src?.valid === true ? 'VALID' : 'INVALID';
        },
    },
    advance_pan_verify: {
        fields: [
            { label: 'Registered Name', key: 'registered_name' },
            { label: "Father's Name", key: 'father_name' },
            { label: 'PAN Type', key: 'type' },
            { label: 'Name Match Score', key: 'name_match_score' },
            { label: 'PAN Validity', key: 'status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'ACCOUNT_IS_VALID'].includes(src?.status || src?.status)
                ? 'VALID'
                : 'INVALID';
        },
    },
    ifsc_verify: {
        fields: [
            { label: 'Bank Name', key: 'bank' },
            { label: 'Branch Name', key: 'branch' },
            { label: 'Bank Address', key: 'address' },
            { label: 'City', key: 'city' },
            { label: 'State', key: 'state' },
            { label: 'MICR', key: 'micr' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'ACCOUNT_IS_VALID'].includes(src?.status || src?.status)
                ? 'VALID'
                : 'INVALID';
        },
    },
    voter_id_verify: {
        fields: [
            { label: 'Name', key: 'name' },
            { label: 'Name in Regional Language', key: 'name_in_regional_lang' },

            { label: "Father's Name", key: 'father_name' },
            { label: 'Age', key: 'age' },
            { label: 'Gender', key: 'gender' },
            { label: 'Address', key: 'address' },
            { label: 'State', key: 'state' },
            { label: 'City', key: 'split_address.city[0]' },
            { label: 'PIN Code', key: 'split_address.pincode[0]' },
            { label: 'Country', key: 'split_address.country[2]' },
            { label: 'DOB', key: 'dob' },
            { label: 'Image Link', key: 'photo' },
            { label: 'Assembly Constituency No.', key: 'assembly_constituency_number' },
            { label: 'Assembly Constituency', key: 'assembly_constituency' },
            { label: 'Parliamentary Constituency No.', key: 'parliamentary_constituency_number' },
            { label: 'Parliamentary Constituency', key: 'parliamentary_constituency' },
            { label: 'Part No.', key: 'part_number' },
            { label: 'Part Name', key: 'part_name' },
            { label: 'Polling Station', key: 'polling_station' },

            // { label: 'Validity', key: 'status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    passport_verify: {
        fields: [
            { label: 'Name on Passport', key: 'name' },
            { label: 'Type', key: 'application_type' },
            { label: 'Application Received Date', key: 'application_received_date' },

            { label: 'Passport Status', key: 'status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    gstin_verify: {
        fields: [
            { label: 'Legal Name of Business', key: 'legal_name_of_business' },
            { label: 'Trade Name of Business', key: 'trade_name_of_business' },
            { label: 'Date of Registration', key: 'date_of_registration' },
            { label: 'State Jurisdiction', key: 'state_jurisdiction' },
            { label: 'Additional Place Address 1', key: 'additional_address_array[0].address' },
            { label: 'Constitution of Business', key: 'constitution_of_business' },
            { label: 'Centre Jurisdiction', key: 'center_jurisdiction' },
            { label: 'Tax Payer Type', key: 'taxpayer_type' },
            { label: 'GSTIN Status', key: 'gst_in_status' },
            { label: 'Principal Place Address', key: 'principal_place_address' },
            { label: 'Additional Place Address 2', key: 'additional_address_array[1].address' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return src?.valid === true ? 'VALID' : 'INVALID';
        },
    },
    gstin_pan: {
        fields: [{ label: 'Status', key: 'status' }],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    aadhar_verify: {
        fields: [
            { label: 'Full Name', key: 'name' },
            { label: 'DOB', key: 'dob' },
            { label: 'Address', key: 'address' },
            { label: 'Gender', key: 'gender' },
            { label: 'Email', key: 'email' },
            { label: "Guardian's Name", key: 'care_of' },
            { label: 'Image Link', key: 'photo_link' },
            { label: 'State', key: 'split_address.state' },
            { label: 'PIN Code', key: 'split_address.pincode' },
            { label: 'Locality', key: 'split_address.locality' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    dl_verify: {
        fields: [
            { label: ' Driving License Number', key: 'dl_number' },
            { label: 'Date of Issue', key: 'details_of_driving_licence.date_of_issue' },
            { label: 'Full Name', key: 'details_of_driving_licence.name' },
            {
                label: 'Permanent Address',
                key: 'details_of_driving_licence.address_list[0].complete_address',
            },
            {
                label: 'Temporary Address',
                key: 'details_of_driving_licence.address_list[1].complete_address',
            },
            {
                label: 'Father’s / Husband’s Name',
                key: 'details_of_driving_licence.father_or_husband_name',
            },

            {
                label: 'Country',
                key: 'details_of_driving_licence.address_list[1].split_address.country[1]',
            },

            { label: 'License Status', key: 'status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    aadhar_ocr_verify: {
        fields: [
            { label: 'Image Link', key: 'image_link' },
            { label: 'Aadhaar Verification Status', key: 'status' },
        ],
        getData: responseData => responseData?.orderResponse?.Result,
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    corporate_verify: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: responseData => responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);

            return src?.response[0]?.responseStatus === 'SUCCESS' ? 'VALID' : 'INVALID';
        },
    },
    director_verify_cin: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: responseData => responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);

            return src?.response[0]?.responseStatus === 'SUCCESS' ? 'VALID' : 'INVALID';
        },
    },
    director_verify_din: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: responseData => responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: responseData => {
            const src = getUnifiedSource(responseData);

            return src?.response[0]?.responseStatus === 'SUCCESS' ? 'VALID' : 'INVALID';
        },
    },
    gst_return_check: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: responseData => responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: responseData => {
         
            const src = getUnifiedSource(responseData);

            return src?.status === true ? 'VALID' : 'INVALID';
        },
    },
    // Add more configs for other services if needed...
};

export const InputConfigs: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (responseData: any) => any;
    }
> = {
    bank_account_verify: {
        fields: [
            { label: 'Bank Account Number', key: 'bank_account' },
            { label: 'Name Provided', key: 'name' },
            { label: 'IFSC Code', key: 'ifsc' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    pan_verify: {
        fields: [
            { label: 'PAN ', key: 'pan' },
            { label: 'Name Provided', key: 'name' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    advance_pan_verify: {
        fields: [
            { label: 'PAN ', key: 'pan' },
            { label: 'Name Provided', key: 'name' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    ifsc_verify: {
        fields: [{ label: 'IFSC Code', key: 'ifsc' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    voter_id_verify: {
        fields: [
            { label: 'Voter ID Number', key: 'epic_number' },
            { label: 'Name Provided', key: 'name' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    dl_verify: {
        fields: [
            { label: ' Driving License Number', key: 'dl_number' },
            { label: 'DOB', key: 'dob' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    passport_verify: {
        fields: [
            { label: 'File Number', key: 'file_number' },
            { label: 'DOB', key: 'dob' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    gstin_verify: {
        fields: [
            { label: 'GSTIN', key: 'GSTIN' },
            { label: 'Name of Business', key: 'business_name' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    gstin_pan: {
        fields: [{ label: 'PAN ', key: 'pan' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    aadhar_verify: {
        fields: [{ label: 'Aadhaar Number', key: 'aadhaar_number' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    cin_verify: {
        fields: [{ label: 'CIN', key: 'cin' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    corporate_verify: {
        fields: [{ label: 'CIN', key: 'CIN' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    director_verify_cin: {
        fields: [{ label: 'CIN', key: 'CIN' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    director_verify_din: {
        fields: [{ label: 'DIN', key: 'DIN' }],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    gst_return_check: {
        fields: [
            { label: 'GSTIN', key: 'gstin' },
            { label: 'Financial Year', key: 'fy' },
        ],
        getData: responseData => responseData?.orderResponse?.InputDetails,
    },
    // Add more configs for other services if needed...
};

function getUnifiedSources(data: any, responseData: any) {
    return data || responseData?.orderResponse?.Result;
}

export const verificationConfigNew: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (data: any, responseData: any) => any;
        getValidityStatus?: (data: any, responseData: any) => string;
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
        getData: (data, responseData) => data || responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    bank_account_verify: {
        fields: [
            { label: 'Account Holder Name', key: 'accountHolderName' },
            { label: 'Name Match', key: 'isNameMatched' },
            { label: 'Match Percentage', key: 'matchPercentage' },
        ],
        getData: (data, responseData) => {
            const src = data || responseData?.orderResponse?.Result;
            return {
                ...src,
                isNameMatched: src?.isNameMatched ? 'Yes' : 'No',
                matchPercentage:
                    src?.matchPercentage !== undefined ? `${src.matchPercentage}%` : undefined,
            };
        },
        getValidityStatus: (data, responseData) => {
            // The account itself being resolved (accountHolderName present) means the
            // overall status is Valid, even when the provided name doesn't match —
            // the mismatch is surfaced separately via an amber warning icon/message,
            // not by downgrading the overall Valid/Invalid status.
            const src = getUnifiedSources(data, responseData);
            return src?.accountHolderName ? 'VALID' : 'INVALID';
        },
    },
    pan_verify: {
        fields: [
            { label: 'Remarks', key: 'remarks' },
            { label: 'Name Match', key: 'nameMatch' },
            { label: 'Date of Birth Match', key: 'dateOfBirthMatch' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            const panStatus = (src?.panStatus || '').toString().toUpperCase();
            if (panStatus) {
                return panStatus === 'VALID' ? 'VALID' : 'INVALID';
            }

            // Some responses leave panStatus empty and only describe the result in remarks
            // (e.g. remarks: "PAN is valid"), so fall back to that text.
            const remarks = (src?.remarks || '').toString().toLowerCase();
            if (remarks.includes('invalid')) return 'INVALID';
            if (remarks.includes('valid')) return 'VALID';
            return 'INVALID';
        },
    },
    advance_pan_verify: {
        fields: [
            { label: 'Registered Name', key: 'registered_name' },
            { label: "Father's Name", key: 'father_name' },
            { label: 'PAN Type', key: 'type' },
            { label: 'Mobile Number', key: 'mobile_number' },
            { label: 'Email ID', key: 'email' },
            { label: 'Masked Aadhaar Number', key: 'masked_aadhaar_number' },
            { label: 'PAN Validity', key: 'status' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'ACCOUNT_IS_VALID'].includes(src?.status || src?.status)
                ? 'VALID'
                : 'INVALID';
        },
    },
    ifsc_verify: {
        fields: [
            { label: 'Bank Name', key: 'bank' },
            { label: 'Branch Name', key: 'branch' },
            { label: 'Bank Address', key: 'address' },
            { label: 'City', key: 'city' },
            // { label: 'State', key: 'state' },
            // { label: 'Validity', key: 'status' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'ACCOUNT_IS_VALID'].includes(src?.status || src?.status)
                ? 'VALID'
                : 'INVALID';
        },
    },
    voter_id_verify: {
        fields: [
            { label: 'Name', key: 'name' },
            { label: 'Name in Regional Language', key: 'name_in_regional_lang' },

            { label: "Father's Name", key: 'father_name' },
            { label: "Father's Name in Regional Language", key: 'relation_name_in_regional_lang' },

            { label: 'Age', key: 'age' },
            { label: 'Gender', key: 'gender' },
            { label: 'Address', key: 'address' },
            { label: 'State', key: 'state' },
            { label: 'DOB', key: 'dob' },
            { label: 'Assembly Constituency No.', key: 'assembly_constituency_number' },
            { label: 'Assembly Constituency', key: 'assembly_constituency' },
            { label: 'Parliamentary Constituency No.', key: 'parliamentary_constituency_number' },
            { label: 'Parliamentary Constituency', key: 'parliamentary_constituency' },
            { label: 'Part No.', key: 'part_number' },
            { label: 'Part Name', key: 'part_name' },
            { label: 'Polling Station', key: 'polling_station' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    passport_verify: {
        fields: [
            { label: 'Name on Passport', key: 'name' },
            { label: 'Type', key: 'application_type' },
            { label: 'Application Received Date', key: 'application_received_date' },

            // { label: 'Passport Status', key: 'status' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    gstin_verify: {
        fields: [
            { label: 'Legal Name', key: 'lgnm' },
            { label: 'Trade Name', key: 'tradeNam' },
            { label: 'GSTIN Status', key: 'sts' },
            { label: 'Constitution of Business', key: 'ctb' },
            { label: 'Registration Date', key: 'rgdt' },
            { label: 'Cancellation Date', key: 'cxdt' },
            { label: 'Last Updated', key: 'lstupdt' },
            { label: 'Nature of Business', key: 'nature_of_business' },
            { label: 'Principal Place of Business', key: 'address' },
            { label: 'e-Invoice Applicable', key: 'einvoiceStatus' },
        ],
        getData: (data, responseData) => {
            const src = data || responseData?.orderResponse?.Result;
            const addr = src?.pradr?.addr;
            const address = addr
                ? [
                      addr.bno,
                      addr.bnm,
                      addr.flno,
                      addr.st,
                      addr.loc,
                      addr.locality,
                      addr.landMark,
                      addr.dst,
                      addr.stcd,
                      addr.pncd,
                  ]
                      .filter(Boolean)
                      .join(', ')
                : undefined;

            return {
                ...src,
                address,
                nature_of_business: Array.isArray(src?.nba) ? src.nba.join('\n') : undefined,
            };
        },
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return src?.gstin ? 'VALID' : 'INVALID';
        },
    },
    gst_business_verify: {
        fields: [
            { label: 'GSTIN', key: 'gstin' },
            { label: 'Legal Name', key: 'lgnm' },
            { label: 'Trade Name', key: 'tradeNam' },
            { label: 'GSTIN Status', key: 'sts' },
            { label: 'Taxpayer Type', key: 'dty' },
            { label: 'Constitution of Business', key: 'ctb' },
            { label: 'Registration Date', key: 'rgdt' },
            { label: 'Cancellation Date', key: 'cxdt' },
            { label: 'Last Updated', key: 'lstupdt' },
            { label: 'Nature of Business', key: 'nature_of_business' },
            { label: 'Principal Place of Business', key: 'address' },
            { label: 'State Jurisdiction', key: 'stj' },
            { label: 'Centre Jurisdiction', key: 'ctj' },
            { label: 'e-Invoice Applicable', key: 'einvoiceStatus' },
        ],
        getData: (data, responseData) => {
            const src = data || responseData?.orderResponse?.Result;
            const addr = src?.pradr?.addr;
            const address = addr
                ? [
                      [addr.bno, addr.bnm, addr.flno].filter(Boolean).join(', '),
                      addr.st,
                      [addr.loc, addr.locality, addr.landMark, addr.dst, addr.stcd, addr.pncd]
                          .filter(Boolean)
                          .join(', '),
                  ]
                      .filter(Boolean)
                      .join('\n')
                : undefined;

            return {
                ...src,
                address,
                nature_of_business: Array.isArray(src?.nba) ? src.nba.join('\n') : undefined,
            };
        },
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return src?.gstin ? 'VALID' : 'INVALID';
        },
    },
    gstin_pan: {
        fields: [
            { label: 'GSTIN', key: 'gstin' },
            { label: 'Legal Name', key: 'lgnm' },
            { label: 'Trade Name', key: 'tradeNam' },
            { label: 'GSTIN Status', key: 'sts' },
            { label: 'Taxpayer Type', key: 'dty' },
            { label: 'Constitution of Business', key: 'ctb' },
            { label: 'Registration Date', key: 'rgdt' },
            { label: 'Last Updated', key: 'lstupdt' },
            { label: 'Nature of Business', key: 'nature_of_business' },
            { label: 'Principal Place of Business', key: 'address' },
            { label: 'State Jurisdiction', key: 'stj' },
            { label: 'Centre Jurisdiction', key: 'ctj' },
        ],
        getData: (data, responseData) => {
            const src = data || responseData?.orderResponse?.Result;
            const addr = src?.pradr?.addr;
            const address = addr
                ? [
                      [addr.bno, addr.bnm, addr.flno].filter(Boolean).join(', '),
                      addr.st,
                      [addr.loc, addr.locality, addr.landMark, addr.dst, addr.stcd, addr.pncd]
                          .filter(Boolean)
                          .join(', '),
                  ]
                      .filter(Boolean)
                      .join('\n')
                : undefined;

            return {
                ...src,
                address,
                nature_of_business: Array.isArray(src?.nba) ? src.nba.join('\n') : undefined,
            };
        },
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return src?.gstin ? 'VALID' : 'INVALID';
        },
    },
    aadhar_verify: {
        fields: [
            { label: 'Full Name', key: 'name' },
            { label: 'Date of Birth', key: 'dob' },
            { label: 'Gender', key: 'gender' },
            { label: 'Care Of', key: 'care_of' },
            { label: 'Address', key: 'address' },
            { label: 'Pincode', key: 'pincode' },
            { label: 'Ref.ID', key: 'reference_id' },
            { label: 'Photo', key: 'photoBase64' },
            { label: 'e-Aadhaar PDF', key: 'pdfUrl' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    dl_verify: {
        fields: [
            { label: ' Driving License Number', key: 'dl_number' },
            { label: 'Date of Issue', key: 'details_of_driving_licence.date_of_issue' },
            { label: 'Full Name', key: 'details_of_driving_licence.name' },
            {
                label: 'Father’s / Husband’s Name',
                key: 'details_of_driving_licence.father_or_husband_name',
            },
            {
                label: 'Permanent Address',
                key: 'details_of_driving_licence.address_list[0].complete_address',
            },
            // {
            //     label: 'Temporary Address',
            //     key: 'details_of_driving_licence.address_list[1].complete_address',
            // },
            {
                label: 'Driving License Validity',
                key: 'dl_validity', // A new key for holding combined validity data
            },

            { label: 'License Status', key: 'status' },
        ],
        getData: (data, responseData) => {
            const validityData =
                responseData?.orderResponse?.Result?.details_of_driving_licence?.validity || {};

            // Construct validity info for transport and non_transport
            const validity = {
                non_transport: validityData?.non_transport
                    ? {
                          from: validityData?.non_transport?.from || 'N/A',
                          to: validityData?.non_transport?.to || 'N/A',
                      }
                    : null, // Use null if there's no validity data for non_transport
                transport: validityData?.transport
                    ? {
                          from: validityData?.transport?.from || 'N/A',
                          to: validityData?.transport?.to || 'N/A',
                      }
                    : null, // Use null if there's no validity data for transport
            };
         
            return {
                ...data,
                details_of_driving_licence: {
                    ...data.details_of_driving_licence,
                    validity, // Add combined validity information to the response
                },
            };
        },
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    aadhar_ocr_verify: {
        fields: [
            { label: ' Image', key: 'image_link' },
            { label: 'Ref.ID', key: 'reference_id' },
            // { label: 'Aadhar Verification Status', key: 'status' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result,
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);
            return ['VALID', 'SUCCESS'].includes((src?.status || '').toUpperCase())
                ? 'VALID'
                : 'INVALID';
        },
    },
    corporate_verify: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);

            return src?.response[0]?.responseStatus === 'SUCCESS' ? 'VALID' : 'INVALID';
        },
    },
    director_verify_cin: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);

            return src?.response[0]?.responseStatus === 'SUCCESS' ? 'VALID' : 'INVALID';
        },
    },
    director_verify_din: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.Result, // Choose data or responseData
        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);

            return src?.response[0]?.responseStatus === 'SUCCESS' ? 'VALID' : 'INVALID';
        },
    },
    gst_return_check: {
        fields: [
            // { label: 'Company Name', key: 'company_name' },
            // { label: 'Address Type', key: 'addressType' },
        ],
        getData: (data, responseData) => data || responseData, // Choose data or responseData

        getValidityStatus: (data, responseData) => {
            const src = getUnifiedSources(data, responseData);

            // Safely get EFiledlist
            const filedList = src?.EFiledlist;

            if (!Array.isArray(filedList) || filedList.length === 0) {
                return 'UNKNOWN'; // no filings found
            }

            // Check if any filing has valid === 'Y'
            const hasValid = filedList.some(item => item.valid === 'Y');

            return hasValid ? 'VALID' : 'INVALID';
        },
    },

    // Add more configs for other services if needed...
};

export const InputConfigNew: Record<
    string,
    {
        fields: { label: string; key: string }[];
        getData: (data: any, responseData: any) => any;
    }
> = {
    bank_account_verify: {
        fields: [
            { label: 'Bank Account Number', key: 'bank_account' },
            { label: 'IFSC Code', key: 'ifsc' },
            { label: 'Name Provided', key: 'name' },
        ],
        getData: (data, responseData) => {
            const src = data || responseData?.orderResponse?.InputDetails;
            // History stores the raw gateway request keys (accounts/ifsc_code/account_name)
            // while the live verify form uses bank_account/ifsc/name — normalize both.
            return {
                bank_account: src?.bank_account ?? src?.accounts,
                ifsc: src?.ifsc ?? src?.ifsc_code,
                name: src?.name ?? src?.account_name,
            };
        },
    },
    pan_verify: {
        fields: [
            { label: 'PAN ', key: 'pan' },
            { label: 'Name Provided', key: 'name' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    advance_pan_verify: {
        fields: [
            { label: 'PAN ', key: 'pan' },
            { label: 'Name Provided', key: 'name' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    ifsc_verify: {
        fields: [{ label: 'IFSC Code', key: 'ifsc' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    voter_id_verify: {
        fields: [
            { label: 'Voter ID Number', key: 'epic_number' },
            { label: 'Provided Name', key: 'name' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    dl_verify: {
        fields: [
            { label: ' Driving License Number', key: 'dl_number' },
            { label: 'DOB', key: 'dob' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    passport_verify: {
        fields: [
            { label: 'File Number', key: 'file_number' },
            { label: 'Name Provided', key: 'name' },
            { label: 'DOB', key: 'dob' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    gstin_verify: {
        fields: [{ label: 'GSTIN', key: 'GSTIN' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    gst_business_verify: {
        fields: [{ label: 'GSTIN', key: 'GSTIN' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    gstin_pan: {
        fields: [
            { label: 'PAN ', key: 'pan_no' },
            { label: 'State Code', key: 'state_code' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    aadhar_verify: {
        fields: [
            { label: 'Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Mobile Number', key: 'mobile' },
        ],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    cin_verify: {
        fields: [{ label: 'CIN', key: 'cin' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    corporate_verify: {
        fields: [{ label: 'CIN', key: 'cin' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    director_verify_cin: {
        fields: [{ label: 'CIN', key: 'cin' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },
    director_verify_din: {
        fields: [{ label: 'DIN', key: 'din' }],
        getData: (data, responseData) => data || responseData?.orderResponse?.InputDetails,
    },

    // Add more configs for other services if needed...
};
