import type { Dayjs } from 'dayjs';

import type { ENachCategoryCode, ENachFrequency } from '../types/paymentLinkTypes';

export interface ENachFormValues {
    customerName: string;
    email: string;
    mobile: string;
    accountNumber: string;
    accountType: 'SAVINGS' | 'CURRENT' | '';
    bankCode: string;
    authenticationMode: 'DebitCard' | 'NetBanking' | 'Aadhar' | 'PAN' | 'CustomerID' | '';
    amountRule: 'fixed' | 'max' | '';
    categoryCode: ENachCategoryCode | '';
    amount: string;
    frequency: ENachFrequency | '';
    startDate: Dayjs | null;
    endDate: Dayjs | null;
}

export const ENACH_INITIAL_VALUES: ENachFormValues = {
    customerName: '',
    email: '',
    mobile: '',
    accountNumber: '',
    accountType: '',
    bankCode: '',
    authenticationMode: '',
    amountRule: 'max',
    categoryCode: 'OTH',
    amount: '',
    frequency: 'Monthly',
    startDate: null,
    endDate: null,
};

export const AUTHENTICATION_MODE_OPTIONS = [
    { label: 'Debit Card', value: 'DebitCard' },
    { label: 'Net Banking', value: 'NetBanking' },
    { label: 'Aadhaar', value: 'Aadhaar' },
    { label: 'PAN', value: 'PAN' },
    { label: 'Customer ID', value: 'CustomerID' },
];

export const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Savings', value: 'SAVINGS' },
    { label: 'Current', value: 'CURRENT' },
];

export const AMOUNT_RULE_OPTIONS = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Max', value: 'max' },
];

export const ENACH_FREQUENCY_OPTIONS = [
    { label: 'Adhoc', value: 'Adhoc' },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Semi-Annually', value: 'Semi-Annually' },
    { label: 'Yearly', value: 'Yearly' },
    { label: 'Bi-Monthly', value: 'Bi-Monthly' },
];

export const ENACH_CATEGORY_OPTIONS = [
    { label: 'API Mandate', value: 'API' },
    { label: 'B2B Corporate', value: 'B2B' },
    { label: 'Credit Card Bill Payment', value: 'CRED' },
    { label: 'Destination Bank Mandate', value: 'MAND' },
    { label: 'Education Fees', value: 'EDU' },
    { label: 'Insurance Premium', value: 'PREM' },
    { label: 'Insurance Other Payment', value: 'PAYM' },
    { label: 'Loan Amount Security', value: 'LONS' },
    { label: 'Loan Instalment Payment', value: 'LONP' },
    { label: 'Mutual Fund Payment', value: 'MF' },
    { label: 'Others', value: 'OTH' },
    { label: 'Subscription Fees', value: 'SUB' },
    { label: 'TReDS', value: 'TRE' },
    { label: 'Tax Payment', value: 'TAX' },
    { label: 'Utility Bill Payment - Electricity', value: 'ELEC' },
    { label: 'Utility Bill Payment - Gas', value: 'GAS' },
    { label: 'Utility Bill Payment - Telecom/Broadband', value: 'TELE' },
    { label: 'Utility Bill Payment - Water', value: 'WAT' },
];
