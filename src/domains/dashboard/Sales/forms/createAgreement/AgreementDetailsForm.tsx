import React from 'react';

import { Form } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import LeftHeader from '../../components/shared/LeftHeader';
import { CURRENCY_OPTIONS } from '../../constants/createDocument';

const CONTRACT_TYPE_OPTIONS = [
    { label: 'Service Agreement', value: 'Service Agreement' },
    { label: 'Product Supply', value: 'Product Supply' },
    { label: 'Retainer', value: 'Retainer' },
    { label: 'NDA', value: 'NDA' },
    { label: 'Custom', value: 'Custom' },
];

const PAYMENT_TERMS_OPTIONS = [
    { label: 'Net 30', value: 'Net 30' },
    { label: 'Net 15', value: 'Net 15' },
    { label: 'Net 7', value: 'Net 7' },
    { label: 'Immediate', value: 'Immediate' },
    { label: 'Custom', value: 'Custom' },
];

// const BILLING_FREQUENCY_OPTIONS = [
//     { label: 'One-time', value: 'One-time' },
//     { label: 'Monthly', value: 'Monthly' },
//     { label: 'Quarterly', value: 'Quarterly' },
//     { label: 'Annually', value: 'Annually' },
// ];

const AgreementDetailsForm: React.FC = () => (
    <Form layout="vertical">
        <LeftHeader
            title="Agreement Details"
            description="Fill in the contract terms and conditions"
            descriptionClass="pb-2"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
            <TextInput
                name="title"
                label="Agreement Title"
                placeholder="Enter agreement title"
                type="text"
                isRequired
                maxLength={100}
            />

            {/* <TextInput
                name="contractValue"
                label="Contract Value"
                placeholder="Enter contract value"
                type="text"
                allowDecimalsOnly
                isRequired
            /> */}

            <SelectInput
                name="contractType"
                label="Contract Type"
                placeholder="Select contract type"
                options={CONTRACT_TYPE_OPTIONS}
                isRequired
            />

            <DatePickerInput
                name="startDate"
                label="Start Date"
                placeholder="Choose start date"
                classes="w-full"
                formItemClass="mb-4"
                needConfirm={false}
                isRequired
            />

            <SelectInputWithSearch
                name="currency"
                label="Currency"
                placeholder="Select currency"
                options={[{ value: 'INR', label: 'INR - Indian Rupee' }, ...CURRENCY_OPTIONS]}
                isRequired
            />

            <SelectInput
                name="paymentTerms"
                label="Payment Terms"
                placeholder="Select payment terms"
                options={PAYMENT_TERMS_OPTIONS}
            />

            {/* <DatePickerInput
                name="endDate"
                label="End Date"
                placeholder="Choose end date"
                classes="w-full"
                formItemClass="mb-4"
                needConfirm={false}
                isRequired
            /> */}

            {/* <SelectInput
                name="billingFrequency"
                label="Billing Frequency"
                placeholder="Select billing frequency"
                options={BILLING_FREQUENCY_OPTIONS}
                isRequired
            /> */}

            <div className="lg:col-span-2">
                <InputTextArea
                    name="description"
                    label="Description / Scope of Work"
                    placeholder="Enter description"
                    autoSize={{ minRows: 3, maxRows: 6 }}
                />
            </div>

            {/* <div className="lg:col-span-2">
                <InputTextArea
                    name="specialTerms"
                    label="Special Terms & Conditions"
                    placeholder="Enter special terms"
                    autoSize={{ minRows: 3, maxRows: 6 }}
                />
            </div> */}
        </div>
    </Form>
);

export default React.memo(AgreementDetailsForm);
