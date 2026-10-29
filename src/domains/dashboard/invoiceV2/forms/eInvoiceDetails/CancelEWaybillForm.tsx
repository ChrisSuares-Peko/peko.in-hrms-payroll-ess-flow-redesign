import React from 'react';

import { Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';

import { CANCEL_REASONS } from '../../constants/eInvoiceDetails';

const CancelEWaybillForm: React.FC = () => (
    <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
        <SelectInput
            name="cancelReason"
            label="Cancel Reason"
            placeholder="Select Cancel Reason"
            options={CANCEL_REASONS}
            isRequired
        />
    </Form>
);

export default CancelEWaybillForm;
