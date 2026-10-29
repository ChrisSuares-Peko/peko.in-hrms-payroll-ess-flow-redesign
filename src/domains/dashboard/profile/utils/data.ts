import clock from '../assets/icons/clock.svg';
import close from '../assets/icons/close.svg';
import document from '../assets/icons/document.svg';
import emirates from '../assets/icons/emirates.svg';
import license from '../assets/icons/license.svg';
import LinkedinLogo from '../assets/icons/LinkedIn - Negative.svg';
import nature from '../assets/icons/nature.svg';
import passport from '../assets/icons/passport.svg';
import proof from '../assets/icons/proof.svg';
import tick from '../assets/icons/tick.svg';
import FacebookLogo from '../assets/icons/Vector.svg';
import whatsappLogo from '../assets/icons/whatsapp.svg';
import XLogo from '../assets/icons/x-logo.svg';

export const socialPaths = [
    {
        icon: FacebookLogo,
        path: 'https://www.facebook.com/sharer/sharer.php?u=', // Facebook uses the URL, but we will include the message in the description
    },
    {
        icon: XLogo,
        path: 'https://twitter.com/intent/tweet?text=', // Twitter (X) uses the text parameter
    },
    {
        icon: LinkedinLogo,
        path: 'https://www.linkedin.com/shareArticle?mini=true&url=', // LinkedIn
    },
    {
        icon: whatsappLogo,
        path: 'https://wa.me/?text=', // WhatsApp uses the text parameter
    },
];

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

export const listData = [
    {
        title: 'Corporate Agreement',
        status: 'Rejected, Upload again',
        logo: document,
        icon: close,
        name: 'Corporate_Agreement',
    },
    {
        title: 'PAN Card',
        status: 'pending',
        logo: license,
        icon: tick,
        name: 'Pan_Card',
    },
    {
        title: 'Signing Authority Pan Card',
        status: 'pending',
        logo: license,
        icon: tick,
        name: 'Signing_Authority_Pan_Card',
    },
    {
        title: 'Aadhar Card',
        status: 'pending',
        logo: document,
        icon: clock,
        name: 'Aadhar_Card',
    },
    {
        title: 'GST Certificate',
        status: 'Rejected, Upload again',
        logo: emirates,
        icon: close,
        name: 'GST_Certificate',
    },
    {
        title: 'Bank Proof',
        status: 'Expiring Soon',
        logo: passport,
        icon: close,
        name: 'Bank_Proof',
    },

    {
        title: 'MOA/AOA',
        status: 'Rejected, Upload again',
        logo: emirates,
        icon: close,
        name: 'MOA_AOA',
    },
    {
        title: 'Certificate of Incorporation',
        status: 'Rejected, Upload again',
        logo: emirates,
        icon: close,
        name: 'Certificate_Of_Incorporation',
    },
    {
        title: 'Establishment License',
        status: 'Rejected, Upload again',
        logo: nature,
        icon: nature,
        name: 'Establishment_License',
    },
    {
        title: 'Nature of Business',
        status: 'Rejected, Upload again',
        logo: nature,
        icon: nature,
        name: 'Nature_Of_Business',
    },
    {
        title: 'Proof of Business',
        status: 'Rejected, Upload again',
        logo: proof,
        icon: proof,
        name: 'Proof_Of_Business',
    },
];
