import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import AddBankAccountModal from '../../components/customers/AddBankAccountModal';
import BankAccountCard from '../../components/customers/BankAccountCard';
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from '../../constants/createInvoice';
import useIndianStates from '../../hooks/useIndianStates';
import { AddCustomerFormValues } from '../../types/customer';

const AddCustomerForm: React.FC = () => {
    const { handleSubmit, values, setFieldValue } = useFormikContext<AddCustomerFormValues>();
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const bankAccounts = useMemo(() => values.bankAccounts ?? [], [values.bankAccounts]);
    const { stateOptions, isLoading } = useIndianStates();

    const isPrimaryIndia = !values.primaryCountry || values.primaryCountry === 'India';
    const isShippingIndia = !values.shippingCountry || values.shippingCountry === 'India';

    // COUNTRY_OPTIONS deliberately excludes India (it's used in the invoice Buyer form,
    // which handles India via a separate Domestic/International toggle) — this form
    // needs India selectable too, since it's the default for existing customers.
    const customerCountryOptions = useMemo(
        () => [{ value: 'India', label: 'India' }, ...COUNTRY_OPTIONS],
        []
    );

    // Sync shipping address when "Same as primary" is checked and primary changes
    useEffect(() => {
        if (values.shippingSameAsPrimary) {
            setFieldValue('shippingAddress', values.primaryAddress || '');
            setFieldValue('shippingCity', values.primaryCity || '');
            setFieldValue('shippingState', values.primaryState || '');
            setFieldValue('shippingPincode', values.primaryPincode || '');
            setFieldValue('shippingCountry', values.primaryCountry || 'India');
        }
    }, [
        values.shippingSameAsPrimary,
        values.primaryAddress,
        values.primaryCity,
        values.primaryState,
        values.primaryPincode,
        values.primaryCountry,
        setFieldValue,
    ]);

    const handleRemoveBank = useCallback(
        (index: number) => {
            setFieldValue(
                'bankAccounts',
                bankAccounts.filter((_, i) => i !== index)
            );
        },
        [bankAccounts, setFieldValue]
    );

    return (
        <Form layout="vertical" onFinish={handleSubmit}>
            {/* Basic Information */}
            <Typography.Text strong className="block text-sm text-[#101828] mb-2.5">
                Basic Information
            </Typography.Text>

            <TextInput
                name="name"
                label="Customer/Business Name"
                placeholder="Enter Customer/Business Name"
                type="text"
                isRequired
                maxLength={50}
            />

            <TextInput
                name="gstin"
                label={isPrimaryIndia ? 'GSTIN' : 'Tax ID / VAT Number'}
                placeholder={isPrimaryIndia ? 'Enter GSTIN' : 'Enter Tax ID / VAT Number'}
                type="text"
                convertToUppercase
                maxLength={15}
            />

            {isPrimaryIndia ? (
                <TextInput
                    name="phoneNumber"
                    label="Phone Number"
                    placeholder="Enter Mobile Number"
                    type="text"
                    isRequired
                    allowNumbersOnly
                    maxLength={10}
                />
            ) : (
                <TextInput
                    name="phoneNumber"
                    label="Phone Number"
                    placeholder="Enter Mobile Number"
                    type="text"
                    isRequired
                    allowedCharacters="0-9+\-\s"
                    maxLength={15}
                />
            )}

            <TextInput name="email" label="Email" placeholder="Enter Email" type="email" />

            <SelectInputWithSearch
                name="currency"
                label="Currency"
                placeholder="Select Currency"
                options={CURRENCY_OPTIONS}
                isRequired
            />

            <SelectInputWithSearch
                name="primaryCountry"
                label="Country"
                placeholder="Select Country"
                options={customerCountryOptions}
                isRequired
            />

            {isPrimaryIndia && (
                <TextInput name="upiId" label="UPI ID" placeholder="Enter UPI ID" type="text" />
            )}

            {/* Bank Details (Optional) */}
            <Flex
                vertical
                justify="space-between"
                className="mb-3 border border-[#E4E4E7] rounded-xl p-3.5 min-h-[96px]"
            >
                <Flex justify="space-between" align="center">
                    <Typography.Text strong className="text-sm text-[#101828]">
                        Bank Details (Optional)
                    </Typography.Text>
                    <Button
                        size="small"
                        icon={<PlusOutlined className="text-[10px]" />}
                        className="border-[#FF4F4F] text-[#FF4F4F] rounded-md text-[11px] h-6 px-2"
                        onClick={() => setIsBankModalOpen(true)}
                    >
                        Add Bank Detail
                    </Button>
                </Flex>
                {bankAccounts.length === 0 ? (
                    <Typography.Text className="text-xs text-[#A1A1AA] text-center block">
                        No bank accounts added yet
                    </Typography.Text>
                ) : (
                    <Flex vertical gap={8} className="mt-2">
                        {bankAccounts.map((account, index) => (
                            <BankAccountCard
                                key={index}
                                account={account}
                                onEdit={() => {
                                    setEditingIndex(index);
                                    setIsBankModalOpen(true);
                                }}
                                onRemove={() => handleRemoveBank(index)}
                            />
                        ))}
                    </Flex>
                )}
            </Flex>

            {/* Primary Address */}
            <Typography.Text strong className="block text-sm text-[#101828] mb-2.5">
                Primary Address
            </Typography.Text>

            <InputTextArea
                name="primaryAddress"
                label="Address"
                placeholder="Enter Customer Address"
                isRequired
                autoSize={{ minRows: 3, maxRows: 5 }}
            />

            <TextInput
                name="primaryCity"
                label="City"
                placeholder="Enter City"
                type="text"
                isRequired
                allowAlphabetsAndSpaceOnly
                maxLength={50}
            />

            {isPrimaryIndia ? (
                <SelectInputWithSearch
                    name="primaryState"
                    label="State"
                    placeholder="Select State"
                    options={stateOptions}
                    isRequired
                    loading={isLoading}
                    isDisabled={isLoading}
                />
            ) : (
                <TextInput
                    name="primaryState"
                    label="State / Region"
                    placeholder="Enter State / Region"
                    type="text"
                    isRequired
                    maxLength={50}
                />
            )}

            <TextInput
                name="primaryPincode"
                label={isPrimaryIndia ? 'Pincode' : 'Postal Code / ZIP Code'}
                placeholder={isPrimaryIndia ? 'Enter Pincode' : 'Enter Postal / ZIP Code'}
                type="text"
                allowNumbersOnly
                maxLength={isPrimaryIndia ? 6 : 12}
                isRequired
            />

            {/* Shipping Address (Optional) */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={8} className="mb-2.5">
                <Typography.Text strong className="text-sm text-[#101828]">
                    Shipping Address (Optional)
                </Typography.Text>
                <Checkbox
                    checked={!!values.shippingSameAsPrimary}
                    onChange={e => {
                        const isChecked = e.target.checked;
                        setFieldValue('shippingSameAsPrimary', isChecked);
                        if (isChecked) {
                            setFieldValue('shippingAddress', values.primaryAddress);
                            setFieldValue('shippingCity', values.primaryCity);
                            setFieldValue('shippingState', values.primaryState);
                            setFieldValue('shippingPincode', values.primaryPincode);
                            setFieldValue('shippingCountry', values.primaryCountry || 'India');
                        } else {
                            setFieldValue('shippingAddress', '');
                            setFieldValue('shippingCity', '');
                            setFieldValue('shippingState', '');
                            setFieldValue('shippingPincode', '');
                            setFieldValue('shippingCountry', 'India');
                        }
                    }}
                >
                    <Typography.Text className="text-xs text-[#475569]">
                        Same as primary
                    </Typography.Text>
                </Checkbox>
            </Flex>

            <InputTextArea
                name="shippingAddress"
                label="Address"
                placeholder="Enter Customer Address"
                autoSize={{ minRows: 3, maxRows: 5 }}
            />

            <TextInput
                name="shippingCity"
                label="City"
                placeholder="Enter City"
                type="text"
                allowAlphabetsAndSpaceOnly
                maxLength={50}
            />

            {isShippingIndia ? (
                <SelectInputWithSearch
                    name="shippingState"
                    label="State"
                    placeholder="Select State"
                    options={stateOptions}
                    loading={isLoading}
                    isDisabled={isLoading}
                />
            ) : (
                <TextInput
                    name="shippingState"
                    label="State / Region"
                    placeholder="Enter State / Region"
                    type="text"
                    maxLength={50}
                />
            )}

            <TextInput
                name="shippingPincode"
                label={isShippingIndia ? 'Pincode' : 'Postal Code / ZIP Code'}
                placeholder={isShippingIndia ? 'Enter Pincode' : 'Enter Postal / ZIP Code'}
                type="text"
                allowNumbersOnly
                maxLength={isShippingIndia ? 6 : 12}
            />

            <SelectInputWithSearch
                name="shippingCountry"
                label="Country"
                placeholder="Select Country"
                options={customerCountryOptions}
            />

            <AddBankAccountModal
                open={isBankModalOpen}
                editingAccount={editingIndex !== null ? bankAccounts[editingIndex] : undefined}
                onClose={() => {
                    setIsBankModalOpen(false);
                    setEditingIndex(null);
                }}
                onAdd={account => {
                    if (editingIndex !== null) {
                        setFieldValue(
                            'bankAccounts',
                            bankAccounts.map((a, i) => (i === editingIndex ? account : a))
                        );
                    } else {
                        setFieldValue('bankAccounts', [...bankAccounts, account]);
                    }
                }}
            />
        </Form>
    );
};

export default React.memo(AddCustomerForm);
