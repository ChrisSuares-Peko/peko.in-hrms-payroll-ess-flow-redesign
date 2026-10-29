import React from 'react';

import { Flex, Form, Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const { Text } = Typography;

const CustomerDetailsForm: React.FC = () => (
    <Flex vertical gap={18} className="pt-0">
        <Text className="text-lg font-semibold">Customer Details:</Text>
        <Form layout="vertical" className="w-full ">
            <TextInput
                name="customerName"
                placeholder="Customer Name"
                label="Customer Name"
                type="text"
                isRequired
                maxLength={50}
            />
            <TextInput
                name="customerEmail"
                placeholder="Customer Email ID"
                label="Email ID"
                type="text"
                isRequired
                maxLength={50}
            />
            <TextInput
                name="customerAddress"
                placeholder="Customer Address"
                label="Customer Address"
                type="text"
                isRequired
                maxLength={100}
            />
            <TextInput
                name="customerPhone"
                placeholder="Enter Mobile Number"
                label="Mobile Number"
                type="text"
                allowNumbersOnly
                maxLength={10}
                minLength={10}
                isRequired
            />
            <TextInput
                name="customerTRNNumber"
                placeholder="Enter Customer TRN"
                label="Customer TRN (Optional)"
                type="text"
                allowNumbersOnly
                maxLength={10}
                minLength={10}
            />
        </Form>
    </Flex>
);

export default CustomerDetailsForm;
