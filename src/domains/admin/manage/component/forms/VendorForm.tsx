import React from 'react';

import { Flex, Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { vendorTypes } from '../../utils/vendorsType';

type Props = {};

const VendorForm = (props: Props) => (
    <Flex vertical className="w-full ">
        <Form layout="vertical">
            <TextInput
                name="vendorName"
                label="Vendor Name"
                type="text"
                placeholder="Enter Vendor Name"
                isRequired
                classes=" rounded-sm"
                maxLength={50}
            />
            <SelectInput
                name="type"
                label="Type"
                placeholder="Please select type"
                isRequired
                classes="rounded-sm"
                options={vendorTypes}
                showSearch
            />
            <TextInput
                name="apiUrl"
                label="API URL"
                type="text"
                placeholder="https://www.example.com"
                classes="rounded-sm"
                isRequired
            />
            <TextInput
                name="healthUrl"
                label="Health URL"
                type="text"
                placeholder="Enter Health URL"
                classes="rounded-sm"
            />
            <TextInput name="optional1" label="Optional 1" type="text" classes="rounded-sm" />
            <TextInput name="optional2" label="Optional 2" type="text" classes="rounded-sm" />
            <TextInput name="optional3" label="Optional 3" type="text" classes="rounded-sm" />
            <TextInput name="optional4" label="Optional 4" type="text" classes="rounded-sm" />
            <TextInput name="optional5" label="Optional 5" type="text" classes="rounded-sm" />
            <TextInput name="optional6" label="Optional 6" type="text" classes="rounded-sm" />
        </Form>
    </Flex>
);

export default VendorForm;
