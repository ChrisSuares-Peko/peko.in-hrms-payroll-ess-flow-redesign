import React from 'react';

import { Flex, Form, Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const { Text } = Typography;

const BillerDetailsForm: React.FC = () => (
    <Flex vertical gap={18}>
        <Text className="text-lg font-semibold">Biller Details:</Text>
        <Form layout="vertical" className="w-full ">
            <TextInput
                name="billerName"
                placeholder="Biller Name"
                label="Biller Name"
                type="text"
                isRequired
                maxLength={50}
            />
            <TextInput
                name="billerEmail"
                placeholder="Biller Email ID"
                label="Email ID"
                type="text"
                isRequired
                maxLength={50}
            />
            <TextInput
                name="billerCompanyAddress"
                placeholder="Company Address"
                label="Company Address"
                type="text"
                isRequired
                maxLength={100}
            />
            <TextInput
                name="billerPhone"
                placeholder="Enter Mobile Number"
                label="Mobile Number"
                type="text"
                allowNumbersOnly
                isRequired
                maxLength={10}
            />
            <TextInput
                name="billerTRNNumber"
                placeholder="Enter TRN"
                label="TRN (Optional)"
                type="text"
                allowNumbersOnly
                maxLength={10}
                minLength={10}
            />
        </Form>
    </Flex>
);

export default BillerDetailsForm;
