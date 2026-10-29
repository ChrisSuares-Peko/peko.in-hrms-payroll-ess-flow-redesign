import React from 'react';

import { Flex, Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import { CANCEL_REASONS } from '../../constants/eInvoiceDetails';

const CancelIrnForm: React.FC = () => (
    <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
        <Flex vertical gap={16}>
            <SelectInput
                name="cancelReason"
                label="Cancel Reason"
                placeholder="Select Cancel Reason"
                options={CANCEL_REASONS}
                isRequired
            />
            <TextAreaInput
                name="remarks"
                label="Remarks"
                placeholder="Enter Remarks"
                minRows={3}
                isRequired
            />
        </Flex>
    </Form>
);

export default CancelIrnForm;
