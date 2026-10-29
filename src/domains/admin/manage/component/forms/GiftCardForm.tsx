import React, { RefObject } from 'react';

import { Form, Flex } from 'antd';
import { FormikProps } from 'formik';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
// import InputTextArea from '@components/atomic/inputs/InputTextArea';
import MultiTextInput from '@components/atomic/inputs/MultiTextInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
// import { commonSelectType } from '@customtypes/general';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import { GiftCardsFormValues } from '../../types/giftCards';
import { usageTypes, priceTypes } from '../../utils/giftCards';

interface GiftCardFormProps {
    selectedGVType: any;
    selectedDenominationType: any;
    handleGVTypeChange: (GVType: any) => void;
    handleDenominationTypeChange: (isOpenOrFixed: any) => void;
    GiftCardsFormRef: RefObject<FormikProps<GiftCardsFormValues>>;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}

const GiftCardForm: React.FC<GiftCardFormProps> = ({
    selectedGVType,
    selectedDenominationType,
    handleGVTypeChange,
    handleDenominationTypeChange,
    GiftCardsFormRef,
    setFieldValue,
}) => (
    <Flex vertical className="w-full ">
        <Form layout="vertical">
            <TextInput
                name="product_name"
                label="Gift Card Name"
                type="text"
                placeholder="Enter Gift Card Name"
                isRequired
                classes=" rounded-sm"
                maxLength={30}
            />
            <TextInput
                name="product_id"
                label="Product Id"
                type="text"
                placeholder="Enter Product Id"
                isRequired
                classes=" rounded-sm"
                maxLength={50}
            />
            <CustomSelectSearch
                name="priceType"
                label="Price type"
                placeholder="Select Price Type"
                classes="rounded-sm"
                options={priceTypes}
                onChange={(value, name) => {
                    setFieldValue('priceType', value);
                }}
            />
            <CustomSelectSearch
                name="usageType"
                label="Usage Type"
                placeholder="Select Usage Type"
                isRequired
                classes="rounded-sm"
                options={usageTypes}
                onChange={handleGVTypeChange}
            />

            {GiftCardsFormRef.current?.values.priceType === 'FLEXI' ? (
                <>
                    <TextInput
                        name="min_price"
                        label="Min Denomination"
                        placeholder="Enter Min Denomination"
                        type="text"
                        isRequired
                        classes="rounded-sm"
                        maxLength={20}
                        allowDecimalsOnly
                    />
                    <TextInput
                        name="max_price"
                        label="Max Denomination"
                        type="text"
                        isRequired
                        placeholder="Enter Max Denomination"
                        classes="rounded-sm"
                        maxLength={20}
                        allowDecimalsOnly
                    />
                </>
            ) : (
                <MultiTextInput
                    name="denominations"
                    label="Denominations"
                    type="text"
                    isRequired
                    placeholder="Enter Denominations"
                    classes="rounded-sm"
                    maxLength={20}
                    allowDecimalsOnly
                />
                // <>
                //     <TextInput
                //         name="mrp"
                //         label="MRP"
                //         placeholder="Enter MRP"
                //         type="text"
                //         isRequired
                //         classes="rounded-sm"
                //         maxLength={20}
                //         allowDecimalsOnly
                //     />
                //     <TextInput
                //         name="selling_price"
                //         label="Selling Price"
                //         type="text"
                //         isRequired
                //         placeholder="Enter Selling Price"
                //         classes="rounded-sm"
                //         maxLength={20}
                //         allowDecimalsOnly
                //     />
                // </>
            )}
            <SelectInput
                name="commissionMode"
                isRequired
                options={[
                    { value: 'MARGIN', label: 'Margin' },
                    { value: 'AGENT_MARKUP', label: 'Agent Markup' },
                    { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
                ]}
                placeholder="Please select commission mode"
                label="Commission Mode"
                isDisabled
                showToolTip
                tooltipText={ACCOUNTING_PORTAL_ONLY}
            />
            <SelectInput
                name="commissionType"
                isRequired
                options={[
                    { value: 'PERCENTAGE', label: 'Percentage' },
                    { value: 'FLAT', label: 'Flat' },
                ]}
                placeholder="Please select commission type"
                label="Commission Type"
                isDisabled
                showToolTip
                tooltipText={ACCOUNTING_PORTAL_ONLY}
            />
            <TextInput
                name="commission"
                label="Commission"
                type="text"
                placeholder="Enter Commission"
                isRequired
                classes="rounded-sm"
                allowTwoDecimalsOnly
                isDisabled
                showToolTip
                tooltipText={ACCOUNTING_PORTAL_ONLY}
            />
            <TextInput
                name="fixedCommissionPerTransaction"
                label="Fixed Commission Per Transaction"
                type="text"
                placeholder="Enter Fixed Commission Per Transaction"
                classes="rounded-sm"
                allowTwoDecimalsOnly
                isDisabled
                showToolTip
                tooltipText={ACCOUNTING_PORTAL_ONLY}
            />
            <SwitchInput
                name="isCommissionInclGST"
                label="Commission Includes VAT"
                isDisabled
                showToolTip
                tooltipText={ACCOUNTING_PORTAL_ONLY}
            />

            <SelectInput
                name="commissionMode"
                isRequired
                options={[
                    { value: 'MARGIN', label: 'Margin' },
                    { value: 'AGENT_MARKUP', label: 'Agent Markup' },
                    { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
                ]}
                placeholder="Please select commission mode"
                label="Commission Mode"
            />
            <SelectInput
                name="commissionType"
                isRequired
                options={[
                    { value: 'PERCENTAGE', label: 'Percentage' },
                    { value: 'FLAT', label: 'Flat' },
                ]}
                placeholder="Please select commission type"
                label="Commission Type"
            />
            <TextInput
                name="commission"
                label="Commission"
                type="text"
                placeholder="Enter Commission"
                isRequired
                classes="rounded-sm"
                allowTwoDecimalsOnly
            />
            <TextInput
                name="fixedCommissionPerTransaction"
                label="Fixed Commission Per Transaction"
                type="text"
                placeholder="Enter Fixed Commission Per Transaction"
                classes="rounded-sm"
                allowTwoDecimalsOnly
            />
            <SwitchInput name="isCommissionInclGST" label="Commission Includes VAT" />

            {/* <InputTextArea
                name="terms_and_condition"
                label="Terms And Condtions"
                placeholder="Enter Terms And Condtions"
                isRequired
                maxLength={300}
            />
            <InputTextArea
                name="how_to_redeem"
                label="Redemption instructions"
                placeholder="Enter Redemption instructions"
                isRequired
                maxLength={300}
            /> */}
        </Form>
    </Flex>
);

export default GiftCardForm;
