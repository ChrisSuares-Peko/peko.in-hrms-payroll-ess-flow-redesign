import React from 'react';

import { Flex, Form } from 'antd';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { SoftwaresDropDown } from '../../types/subscriptionPlans';

interface SubscriptionFormProps {
    allSoftwares: SoftwaresDropDown;
    handleSearch: (e: string) => void;
}
const SubscriptionForm = ({ allSoftwares, handleSearch }: SubscriptionFormProps) => (
    <Flex vertical className="w-full ">
        <Form layout="vertical">
            <SelectInput
                name="softwareId"
                isRequired
                options={allSoftwares}
                placeholder="Please select a software product"
                label="Software Name"
                filterOption={false}
                allowClear
                onSearch={handleSearch}
                showSearch
            />
            <TextInput
                name="planId"
                label="Plan ID"
                type="text"
                placeholder="Enter Plan ID"
                isRequired
                classes="rounded-sm"
                maxLength={20}
            />
            <TextInput
                name="name"
                label="Plan Name"
                type="text"
                placeholder="Enter Plan Name"
                isRequired
                classes="rounded-sm"
                maxLength={255}
            />
            <TextInput
                name="vendorPrice"
                label="Plan Vendor Price"
                type="text"
                placeholder="Enter Vendor Price"
                isRequired
                classes="rounded-sm"
                allowDecimalsOnly
                maxLength={20}
            />
            <TextInput
                name="price"
                label="Plan Customer Price"
                type="text"
                placeholder="Enter Customer Price"
                isRequired
                classes="rounded-sm"
                maxLength={20}
                allowDecimalsOnly
            />
            <SelectInput
                name="gstType"
                isRequired
                options={[
                    { value: 'PERCENTAGE', label: 'Percentage' },
                    { value: 'CUSTOM', label: 'Flat' },
                ]}
                placeholder="Please select a GST type"
                label="GST type"
            />
            <TextInput
                allowTwoDecimalsOnly
                name="GST"
                label="GST "
                type="text"
                placeholder="Please enter GST"
                isRequired
                maxLength={10}
            />
            <TextInput
                name="validity"
                label="Plan Validity"
                type="text"
                placeholder="Enter Plan Validity"
                isRequired
                classes="rounded-sm"
                maxLength={255}
            />
            <TextInput
                name="noOfUsers"
                label="No of Users"
                type="text"
                placeholder="Enter No of Users"
                isRequired
                classes="rounded-sm"
                maxLength={8}
                allowNumbersOnly
            />
            <InputTextArea
                name="features"
                label="Features"
                placeholder="Enter Features"
                isRequired
                autoSize={{ minRows: 3 }}
            />
        </Form>
    </Flex>
);

export default SubscriptionForm;
