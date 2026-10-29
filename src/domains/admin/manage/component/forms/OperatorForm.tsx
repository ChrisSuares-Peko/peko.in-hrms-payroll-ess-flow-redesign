import React from 'react';

import { Form, Flex } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { commonSelectType } from '@customtypes/general';

interface OperatorFormProps {
    serviceCategories: commonSelectType[];
    commissionTypes: commonSelectType[];
    balanceMethods: commonSelectType[];
    serviceTypes: commonSelectType[];
    vendors: commonSelectType[];
    dropdownsLoading: boolean;
}

const OperatorForm: React.FC<OperatorFormProps> = ({
    serviceCategories,
    commissionTypes,
    balanceMethods,
    serviceTypes,
    vendors,
    dropdownsLoading,
}) => (
    <Flex vertical className="w-full">
        <Form layout="vertical">
            <TextInput
                name="serviceProvider"
                label="Service Provider Name"
                type="text"
                placeholder="Enter Service Provider Name"
                isRequired
                classes=" rounded-sm"
                maxLength={50}
            />
            <TextInput
                name="accessKey"
                label="Access Key"
                type="text"
                placeholder="Enter Access Key"
                isRequired
                classes="rounded-sm"
                maxLength={20}
            />
            <CustomSelectSearch
                name="serviceCategory"
                label="Service Category"
                options={serviceCategories}
                placeholder="Select Service Category"
                classes="rounded-sm"
                isRequired
            />
            <CustomSelectSearch
                name="commissionType"
                label="Commission Type"
                placeholder="Select a Commission Type"
                classes="rounded-sm"
                options={commissionTypes}
            />
            <TextInput
                name="providerCommission"
                label="Provider Commission"
                type="text"
                classes="rounded-sm"
            />
            <CustomSelectSearch
                isRequired
                loading={dropdownsLoading}
                name="vendorId"
                label="Vendor"
                placeholder="Select a Vendor"
                options={vendors}
            />

            <CustomSelectSearch
                name="balanceMethod"
                label="Balance Method"
                placeholder="Select Balance Method"
                options={balanceMethods}
                classes="rounded-sm"
            />
            <CustomSelectSearch
                name="serviceType"
                label="Service Type"
                placeholder="Select Service Type"
                isRequired
                options={serviceTypes}
                classes="rounded-sm"
            />

            <SwitchInput name="isDynamicUnitPricing" label="Dynamic unit pricing" />

            <CustomFileUploadInput
                name="serviceImage"
                label="Service Image"
                classes="rounded-sm"
                format="imageFormat"
                showFileName
                showNotification
            />
        </Form>
    </Flex>
);

export default OperatorForm;
