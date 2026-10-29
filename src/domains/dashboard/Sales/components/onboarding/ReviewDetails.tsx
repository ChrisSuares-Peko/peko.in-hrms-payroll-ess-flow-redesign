import { useState } from 'react';

import { BankOutlined, EditOutlined, ShopOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';
import { Formik } from 'formik';

import DetailCard from './DetailCard';
import BankAccountForm from '../../forms/onboarding/BankAccountForm';
import { bankAccountSchema } from '../../schema/onboarding/bankAccountSchema';
import { BankAccountFormValues, CurrencyAccountBusinessData } from '../../types/onboarding';
import LeftHeader from '../shared/LeftHeader';

type Props = {
    data: CurrencyAccountBusinessData;
    isEditingBank: boolean;
    onEditBank: () => void;
    onSaveBank: (values: BankAccountFormValues) => void;
    onCancelEditBank: () => void;
    onSaveBusiness: (name: string) => void;
};

const validateBusinessName = (v: string): string => {
    if (!v.trim()) return 'Please enter the business name';
    if (/^\s/.test(v)) return 'Business name cannot start with a blank space';
    if (/\s{2,}/.test(v)) return 'Business name cannot contain consecutive blank spaces';
    if (!/^[a-zA-Z0-9&.\- ]*$/.test(v))
        return 'Business name can only contain letters, numbers, spaces, &, ., - characters';
    if (v.trim().length < 3) return 'Business name must be at least 3 characters';
    if (v.length > 100) return 'Business name cannot exceed 100 characters';
    return '';
};

const ReviewDetails = ({
    data,
    isEditingBank,
    onEditBank,
    onSaveBank,
    onCancelEditBank,
    onSaveBusiness,
}: Props) => {
    const [isEditingBusiness, setIsEditingBusiness] = useState(false);
    const [businessNameInput, setBusinessNameInput] = useState(data.businessName);
    const [businessNameError, setBusinessNameError] = useState('');

    const handleSaveBusiness = () => {
        const error = validateBusinessName(businessNameInput);
        if (error) {
            setBusinessNameError(error);
            return;
        }
        onSaveBusiness(businessNameInput.trim());
        setIsEditingBusiness(false);
        setBusinessNameError('');
    };

    return (
        <Flex vertical gap={24}>
            <LeftHeader
                title="Review Business Details"
                description="Confirm your business details before activating payment collections. You can edit any field"
                titleClass="text-base"
            />

            {isEditingBusiness ? (
                <DetailCard
                    icon={<ShopOutlined className="text-gray-600 text-lg" />}
                    label="Business Name"
                >
                    <Flex vertical gap={4}>
                        <Input
                            value={businessNameInput}
                            onChange={e => {
                                const val = e.target.value.replace(
                                    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
                                    ''
                                );
                                setBusinessNameInput(val);
                                setBusinessNameError(validateBusinessName(val));
                            }}
                            placeholder="Enter business name"
                            className="rounded-lg"
                            maxLength={100}
                            status={businessNameError ? 'error' : ''}
                        />
                        {businessNameError && (
                            <span className="text-xs text-red-500">{businessNameError}</span>
                        )}
                    </Flex>
                    <Flex gap={8}>
                        <Button type="primary" danger onClick={handleSaveBusiness}>
                            Save Changes
                        </Button>
                        <Button
                            onClick={() => {
                                setBusinessNameInput(data.businessName);
                                setBusinessNameError('');
                                setIsEditingBusiness(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </Flex>
                </DetailCard>
            ) : (
                <DetailCard
                    icon={<ShopOutlined className="text-gray-600 text-lg" />}
                    label="Business Name"
                    title={data.businessName || undefined}
                    action={
                        <Button
                            type="link"
                            danger
                            icon={<EditOutlined />}
                            onClick={() => {
                                setBusinessNameInput(data.businessName);
                                setIsEditingBusiness(true);
                            }}
                        />
                    }
                />
            )}

            {isEditingBank ? (
                <Formik<BankAccountFormValues>
                    initialValues={{
                        bankName: data.bankName ?? '',
                        accountNumber: data.accountNumber ?? '',
                        ifsc: data.ifsc ?? '',
                    }}
                    validationSchema={bankAccountSchema}
                    onSubmit={onSaveBank}
                >
                    {({ handleSubmit, isSubmitting }) => (
                        <DetailCard
                            icon={<BankOutlined className="text-gray-600 text-lg" />}
                            label="Settlement Bank Account"
                        >
                            <BankAccountForm />
                            <Flex gap={8}>
                                <Button
                                    type="primary"
                                    danger
                                    loading={isSubmitting}
                                    onClick={() => handleSubmit()}
                                >
                                    Save Changes
                                </Button>
                                <Button onClick={onCancelEditBank}>Cancel</Button>
                            </Flex>
                        </DetailCard>
                    )}
                </Formik>
            ) : (
                <DetailCard
                    icon={<BankOutlined className="text-gray-600 text-lg" />}
                    label="Settlement Bank Account"
                    title={
                        data.bankName && data.accountNumber
                            ? `${data.bankName} - ${data.accountNumber}`
                            : undefined
                    }
                    subText={data.ifsc ? `IFSC: ${data.ifsc}` : undefined}
                    action={
                        <Button type="link" danger icon={<EditOutlined />} onClick={onEditBank} />
                    }
                />
            )}
        </Flex>
    );
};

export default ReviewDetails;
