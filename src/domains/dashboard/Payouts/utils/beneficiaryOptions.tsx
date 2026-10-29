import React from 'react';

import { BankOutlined, UserOutlined } from '@ant-design/icons';

import { BeneficiaryPaymentCategory } from '../types';

export type BeneficiaryType = 'individual' | 'business';

export const typeOptions: { key: BeneficiaryType; label: string; icon: React.ReactNode }[] = [
    { key: 'individual', label: 'Individual', icon: <UserOutlined /> },
    { key: 'business', label: 'Business', icon: <BankOutlined /> },
];

export const paymentCategoryOptions: { value: BeneficiaryPaymentCategory; label: string }[] = [
    { value: 'RENT', label: 'Rent' },
    { value: 'VENDOR_PAYMENT', label: 'Vendor Payment' },
    { value: 'SALARY', label: 'Salary' },
    { value: 'OTHER', label: 'Other' },
];

export const paymentCategoryColorMap: Record<BeneficiaryPaymentCategory, string> = {
    RENT: 'orange',
    VENDOR_PAYMENT: 'cyan',
    SALARY: 'geekblue',
    UTILITY: 'volcano',
    OTHER: 'default',
};
