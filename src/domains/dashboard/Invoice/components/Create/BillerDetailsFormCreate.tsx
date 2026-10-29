import React from 'react';

import { Flex, Form, Typography } from 'antd';

import CustomTextArea from '../CustomTextArea';

const { Text } = Typography;

const BillerDetailsFormCreate: React.FC = () => (
    <Flex vertical gap={18} className="w-full">
        <Text className="font-semibold">Billed by</Text>
        <Form layout="vertical" className="flex flex-col w-full gap-4">
            <CustomTextArea
                name="billerName"
                placeholder="Enter Biller Name"
                label="Biller Name"
                type="text"
                isRequired
                maxLength={50}
            />
            <CustomTextArea
                name="billerEmail"
                placeholder="Enter Email ID"
                label="Email ID"
                type="text"
                isRequired
                maxLength={50}
            />
            <CustomTextArea
                name="billerCompanyAddress"
                placeholder="Enter Company Address"
                label="Company Address"
                type="text"
                isRequired
                maxLength={100}
            />
            <CustomTextArea
                name="billerPhone"
                placeholder="Enter Mobile Number"
                label="Mobile Number"
                type="text"
                allowNumbersOnly
                isRequired
                maxLength={10}
            />
            <CustomTextArea
                name="billerTRNNumber"
                placeholder="Enter TRN (If any)"
                label="TRN (Optional)"
                type="text"
                allowNumbersOnly
                maxLength={10}
                minLength={10}
            />
        </Form>
    </Flex>
);

export default BillerDetailsFormCreate;
