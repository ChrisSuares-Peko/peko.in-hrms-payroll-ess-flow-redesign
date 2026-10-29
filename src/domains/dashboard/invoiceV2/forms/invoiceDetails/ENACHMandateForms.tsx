import React from 'react';

import { Flex, Form } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { FREQUENCY_OPTIONS } from '../../constants/invoiceDetails';
import { ENACHMandateFormValues } from '../../types/invoiceDetails';

// --- 1. Customer Details ---
export const CustomerDetailsForm: React.FC = React.memo(() => (
    <Form layout="vertical">
        <TextInput
            name="customer.name"
            label="Customer Name"
            placeholder="Customer Name"
            type="text"
        />
        <Flex gap={16}>
            <TextInput
                name="customer.email"
                label="Email Address"
                placeholder="Enter email address"
                type="email"
                isRequired
                formItemClass="flex-1"
            />
            <TextInput
                name="customer.mobile"
                label="Mobile Number"
                placeholder="Mobile Number"
                type="text"
                isRequired
                allowNumbersOnly
                maxLength={10}
                addonBefore="+91"
                formItemClass="flex-1"
            />
        </Flex>
    </Form>
));

// --- 2. Mandate Configuration ---
export const MandateConfigForm: React.FC = React.memo(() => {
    const { values } = useFormikContext<ENACHMandateFormValues>();
    const startDate = values.mandate.startDate ? dayjs(values.mandate.startDate) : undefined;

    return (
        <Form layout="vertical">
            <TextInput
                name="mandate.maxAmount"
                label="Maximum Debit Amount"
                placeholder="Enter amount"
                type="text"
                isRequired
                allowDecimalsOnly
            />
            <RadioGroupInput
                name="mandate.frequency"
                label="Frequency"
                options={FREQUENCY_OPTIONS}
                isRequired
            />
            <Flex gap={16}>
                <DatePickerInput
                    name="mandate.startDate"
                    label="Mandate Start Date"
                    placeholder="Choose Date"
                    isRequired
                    minDate={dayjs()}
                    classes="w-full"
                    formItemClass="flex-1"
                    needConfirm={false}
                />
                <DatePickerInput
                    name="mandate.endDate"
                    label="Mandate End Date"
                    placeholder="Choose Date"
                    isDisabled={values.mandate.untilCancelled}
                    minDate={startDate ?? dayjs()}
                    classes="w-full"
                    formItemClass="flex-1"
                    needConfirm={false}
                />
            </Flex>
            <CheckboxInput name="mandate.untilCancelled">Until cancelled</CheckboxInput>
        </Form>
    );
});

// --- 3. Purpose ---
export const PurposeForm: React.FC = React.memo(() => (
    <Form layout="vertical">
        <TextAreaInput
            name="purpose.description"
            label="Mandate Description"
            placeholder="Enter Mandate Description"
            minRows={2}
        />
    </Form>
));
