import React from 'react';

import { Form } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { PAYMENT_METHODS } from '../../constants';

const RecordManuallyForm: React.FC = () => (
        <Form layout="vertical">
            <TextInput
                name="amountPaid"
                label="Amount Paid"
                placeholder="Enter amount"
                type="text"
                allowDecimalsOnly
                isRequired
                isDisabled
            />

            <SelectInput
                name="paymentMethod"
                label="Payment Method"
                placeholder="Select Payment Method"
                options={PAYMENT_METHODS}
                isRequired
            />

            <DatePickerInput
                name="paymentDate"
                label="Payment Date"
                placeholder="Select Date"
                classes="w-full"
                needConfirm={false}
                isRequired
            />

            <TextInput
                name="referenceId"
                label="Reference / Transaction ID"
                placeholder="Enter Reference / Transaction ID"
                type="text"
            />

            <InputTextArea
                name="notes"
                label="Notes"
                placeholder="Enter Notes"
                autoSize={{ minRows: 3, maxRows: 5 }}
            />
        </Form>
    );

export default React.memo(RecordManuallyForm);
