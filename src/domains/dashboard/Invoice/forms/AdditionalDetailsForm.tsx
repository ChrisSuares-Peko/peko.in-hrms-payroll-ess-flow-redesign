import React from 'react';

import { Flex, Form, Typography } from 'antd';

import TextAreaComponent from './TextAreaComponent';

const { Text } = Typography;

const AdditionalDetailsForm = () => (
    <Flex vertical className="w-full" gap={16}>
        <Text className="text-lg font-medium">Additional Details:</Text>

        <Form layout="vertical" className="w-full ">
            <Flex vertical>
                <TextAreaComponent
                    name="comments"
                    placeholder="Enter Notes"
                    label="Notes"
                    maxLength={200}
                />
                <TextAreaComponent
                    name="termsConditions"
                    placeholder="Enter Terms & Conditions"
                    label="Terms & Conditions"
                    maxLength={100}
                />
            </Flex>
        </Form>
    </Flex>
);

export default AdditionalDetailsForm;
