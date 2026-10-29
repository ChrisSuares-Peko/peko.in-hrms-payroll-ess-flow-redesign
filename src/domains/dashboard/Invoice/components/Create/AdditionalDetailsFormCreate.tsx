import React from 'react';

import { Flex, Form, Typography } from 'antd';

import TextAreaComponentCreate from './TextAreaComponentCreate';

const { Text } = Typography;

const AdditionalDetailsFormCreate = () => (
    <Flex vertical className="w-full" gap={16}>
        <Text className="font-semibold">Additional Details</Text>

        <Form layout="vertical" className="w-full ">
            <Flex vertical>
                <TextAreaComponentCreate
                    name="termsConditions"
                    placeholder="Enter Terms & Conditions"
                    label="Terms & Conditions"
                    maxLength={100}
                />
                <TextAreaComponentCreate
                    name="comments"
                    placeholder="Enter Notes"
                    label="Notes"
                    maxLength={200}
                />
            </Flex>
        </Form>
    </Flex>
);

export default AdditionalDetailsFormCreate;
