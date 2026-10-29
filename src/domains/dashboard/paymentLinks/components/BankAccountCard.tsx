import { useState } from 'react';

import { BankOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyBankDetails } from '../api';
import { bankDetailsSchema } from '../schema/onboardingSchema';

interface Props {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    onBankNameChange: (val: string) => void;
    onAccountNumberChange: (val: string) => void;
    onIfscChange: (val: string) => void;
}

const BankAccountCard = ({
    bankName,
    accountNumber,
    ifsc,
    onBankNameChange,
    onAccountNumberChange,
    onIfscChange,
}: Props) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [editing, setEditing] = useState(false);
    const [verifying, setVerifying] = useState(false);

    return (
        <Card
            bordered={false}
            className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)] overflow-hidden"
            styles={{ body: { padding: '12px 16px', background: '#F9FBFF' } }}
        >
            {editing ? (
                <Formik
                    initialValues={{ bankName, accountNumber, ifsc }}
                    validationSchema={bankDetailsSchema}
                    onSubmit={async values => {
                        const trimmedBankName = values.bankName.trim();
                        const trimmedAccount = values.accountNumber.trim();
                        const upperIfsc = values.ifsc.trim().toUpperCase();

                        setVerifying(true);
                        const result = await verifyBankDetails({
                            userId: id,
                            userType: role,
                            bankName: trimmedBankName,
                            accountNumber: trimmedAccount,
                            ifsc: upperIfsc,
                        });
                        setVerifying(false);

                        if (result === false) {
                            // dispatch(showToast({ description: 'Unable to verify bank details. Please try again.', variant: 'error' }));
                            return;
                        }

                        if (!result.match) {
                            dispatch(showToast({
                                description: result.bankNameFromIfsc
                                    ? `Bank name does not match IFSC. Expected: ${result.bankNameFromIfsc}`
                                    : 'Bank name and IFSC code do not match.',
                                variant: 'error',
                            }));
                            return;
                        }

                        onBankNameChange(trimmedBankName);
                        onAccountNumberChange(trimmedAccount);
                        onIfscChange(upperIfsc);
                        setEditing(false);
                        dispatch(showToast({ description: 'Bank details verified and saved.', variant: 'success' }));
                    }}
                    enableReinitialize
                >
                    {({ values, handleSubmit }) => (
                        <Flex vertical gap={12}>
                            <Flex align="center" gap={12}>
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="rounded-lg"
                                    style={{ width: 32, height: 32, background: '#EFF4FA', flexShrink: 0 }}
                                >
                                    <BankOutlined style={{ fontSize: 18 }} />
                                </Flex>
                                <Typography.Text className="text-[13px] font-semibold">
                                    Settlement Bank Account
                                </Typography.Text>
                            </Flex>

                            <Flex gap={12}>
                                <Flex vertical gap={4} className="flex-1">
                                    <Typography.Text className="text-[11px] text-[#98A2B3]">Bank Name</Typography.Text>
                                    <TextInput
                                        name="bankName"
                                        type="text"
                                        placeholder="e.g. HDFC Bank"
                                        values={values.bankName}
                                        allowAlphabetsAndSpaceOnly
                                        formItemClass="!mb-0"
                                        maxLength={50}
                                        classes="rounded-lg !text-[13px]"
                                    />
                                </Flex>
                                <Flex vertical gap={4} className="flex-1">
                                    <Typography.Text className="text-[11px] text-[#98A2B3]">Account Number</Typography.Text>
                                    <TextInput
                                        name="accountNumber"
                                        type="text"
                                        maxLength={18}
                                        minLength={9}
                                        placeholder="e.g. 1234567890"
                                        values={values.accountNumber}
                                        allowNumbersOnly
                                        formItemClass="!mb-0"
                                        classes="rounded-lg !text-[13px]"
                                    />
                                </Flex>
                            </Flex>

                            <Flex vertical gap={4}>
                                <Typography.Text className="text-[11px] text-[#98A2B3]">IFSC Code</Typography.Text>
                                <TextInput
                                    name="ifsc"
                                    type="text"
                                    placeholder="e.g. HDFC0001234"
                                    values={values.ifsc}
                                    allowAlphabetsAndNumbersOnly
                                    convertToUppercase
                                    maxLength={11}
                                    formItemClass="!mb-0"
                                    classes="rounded-lg !text-[13px]"
                                />
                            </Flex>

                            <Flex gap={8}>
                                <Button
                                    type="primary"
                                    danger
                                    className="!h-8 !text-[12px]"
                                    loading={verifying}
                                    onClick={() => handleSubmit()}
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    className="!h-8 !text-[12px]"
                                    disabled={verifying}
                                    onClick={() => setEditing(false)}
                                >
                                    Cancel
                                </Button>
                            </Flex>
                        </Flex>
                    )}
                </Formik>
            ) : (
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={12}>
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-lg"
                            style={{ width: 32, height: 32, background: '#EFF4FA', flexShrink: 0 }}
                        >
                            <BankOutlined style={{ fontSize: 18 }} />
                        </Flex>
                        <Flex vertical gap={1}>
                            <Typography.Text className="text-[11px] leading-[1.35]">
                                Settlement Bank Account
                            </Typography.Text>
                            <Typography.Text className="text-[14px] font-semibold leading-[1.35] text-[#1F2A44]">
                                {bankName || '–'} – {accountNumber
                                    ? `${'*'.repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`
                                    : '–'}
                            </Typography.Text>
                            <Typography.Text className="text-[11px] leading-[1.35] text-[#98A2B3]">
                                IFSC: {ifsc || '–'}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#FF4D4F', fontSize: 11 }} />}
                        style={{ color: '#FF4D4F' }}
                        className="!h-auto !px-1 !text-[12px] !font-medium"
                        onClick={() => setEditing(true)}
                    >
                        Edit
                    </Button>
                </Flex>
            )}
        </Card>
    );
};

export default BankAccountCard;
