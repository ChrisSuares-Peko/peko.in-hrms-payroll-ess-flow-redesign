import React from 'react';

import { Flex, Form } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { commonSelectType } from '@customtypes/general';

import { WorkspaceBody } from '../../types/workspace';

type Props = {
    plans: commonSelectType[];
    record?: WorkspaceBody;
};

const WorkspaceForm = ({ plans, record }: Props) => (
    <Flex vertical className="w-full ">
        <Form layout="vertical">
            <TextInput
                name="name"
                label="Workspace Name"
                type="text"
                placeholder="Enter Workspace Name"
                isRequired
                classes=" rounded-sm"
                maxLength={30}
            />
            <TextInput
                name="address"
                label="Workspace Address"
                type="text"
                placeholder="Enter Workspace Address"
                isRequired
                classes="rounded-sm"
                maxLength={80}
            />

            <TextInput
                name="monthlyPrice"
                label="Monthly Price"
                type="text"
                placeholder="Enter Monthly Price"
                isRequired
                classes="rounded-sm"
                maxLength={15}
                allowDecimalsOnly
            />
            <TextInput
                name="yearlyPrice"
                label="Yearly Price"
                type="text"
                placeholder="Enter Yearly Price"
                isRequired
                classes="rounded-sm"
                maxLength={15}
                allowDecimalsOnly
            />

            <TextInput
                name="latLng"
                label="Lat/Long"
                type="text"
                placeholder="Enter Lat/Long"
                isRequired
                classes="rounded-sm"
                maxLength={15}
            />
            <CustomSelectSearch
                isRequired
                placeholder="Select Plan"
                name="planId"
                label="Plan Type"
                options={plans}
            />

            <CustomFileUploadInput
                existingFileUrl={record?.logo}
                name="logo"
                label="Choose logo"
                showFileName
                showNotification
                format="logoFormat"
            />
        </Form>
    </Flex>
);

export default WorkspaceForm;
