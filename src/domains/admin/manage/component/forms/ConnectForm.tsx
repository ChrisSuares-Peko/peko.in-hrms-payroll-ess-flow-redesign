import React from 'react';

import { Flex, Form, Space, Typography } from 'antd';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import { commonSelectType } from '@customtypes/general';

type Props = {
    categories: commonSelectType[];
};

const ConnectForm = ({ categories }: Props) => (
    <Flex vertical className="w-full ">
        <Form layout="vertical">
            <TextInput
                name="serviceProvider"
                label="Service Provider"
                type="text"
                placeholder="Enter Service Provider"
                isRequired
                classes=" rounded-sm"
                maxLength={30}
            />
            <TextInput
                name="tagline"
                label="Tagline"
                type="text"
                placeholder="Enter Tagline"
                isRequired
                classes="rounded-sm"
                maxLength={100}
            />

            <TextInput
                name="mobileNo"
                label="Mobile Number"
                type="text"
                placeholder="Enter Mobile Number"
                classes="rounded-sm"
                maxLength={10}
            />
            <TextInput
                name="email"
                label="Email ID"
                type="text"
                placeholder="Enter email ID"
                classes="rounded-sm"
                maxLength={50}
            />
            <TextInput
                name="website"
                label="Website"
                type="text"
                placeholder="Enter Website"
                classes="rounded-sm"
                maxLength={50}
            />
            <TextInput
                name="address"
                label="Address"
                type="text"
                placeholder="Enter address"
                isRequired
                classes="rounded-sm"
                maxLength={200}
            />

            <CustomSelectSearch
                name="category"
                label="Category"
                options={categories}
                isRequired
                placeholder="Select Category"
            />

            <InputTextArea
                name="description"
                label="Description"
                placeholder="Enter Description"
                isRequired
                maxLength={700}
            />
            <InputTextArea
                name="offerings"
                label="Offerings"
                placeholder="Enter Offerings"
                isRequired
                maxLength={200}
            />
            <TextInput
                name="rewards"
                label="Rewards"
                type="text"
                placeholder="Enter Rewards"
                isRequired
                classes="rounded-sm"
                maxLength={100}
            />
            {/* <CustomFileUploadInput
                label="Logo"
                name="logo"
                format="format"
                showFileName
                showNotification
            /> */}
            <Flex vertical>
                <Space direction="vertical" size={0}>
                    <Typography.Text>Logo</Typography.Text>

                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        (File Formats Supported: JPG, JPEG, PNG. Max. size: 2 MB)
                    </Typography.Text>
                </Space>
                <FileUploadInput
                    name="logo"
                    label=""
                    format="format"
                    showFileName
                    allowedFileTypes={['image/jpeg', 'image/png']}
                    maxFileSize={2048}
                />
            </Flex>
        </Form>
    </Flex>
);

export default ConnectForm;
