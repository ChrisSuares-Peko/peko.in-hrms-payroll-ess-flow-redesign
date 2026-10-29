import React from 'react';

import { Flex, Form } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { DropDown, SubscriptionBody } from '../../types/subscription';

interface SubscriptionFormProps {
    vendorData: DropDown;
    subscriptionCategories: DropDown;
    hideImageField?: boolean;
    records?: SubscriptionBody;
}

const SubscriptionForm = ({
    vendorData,
    subscriptionCategories,
    hideImageField = false,
    records,
}: SubscriptionFormProps) => (
    <Flex vertical className="w-full ">
        <Form layout="vertical">
            <TextInput
                name="productId"
                label="Product ID"
                type="text"
                placeholder="Enter Product ID"
                isRequired
                classes="rounded-sm"
                maxLength={20}
            />
            <TextInput
                name="name"
                label="Software Name"
                type="text"
                placeholder="Enter Software Name"
                isRequired
                classes="rounded-sm"
                maxLength={255}
            />

            <InputTextArea
                name="description"
                label="Description"
                placeholder="Enter Description"
                isRequired
                maxLength={2000}
                autoSize={{ minRows: 3 }}
            />

            <InputTextArea
                name="features"
                label="Features"
                placeholder="Enter Features"
                isRequired
                autoSize={{ minRows: 3 }}
            />
            <SelectInput
                name="categoryId"
                isRequired
                options={subscriptionCategories}
                placeholder="Please select a category"
                label="Category"
                filterOption={false}
            />

            <SelectInput
                name="vendorId"
                isRequired
                options={vendorData}
                placeholder="Please select a vendor"
                label="Vendor"
                filterOption={false}
            />
            <TextInput
                name="discount"
                label="Discount"
                type="text"
                placeholder="Enter Discount"
                classes="rounded-sm"
                maxLength={255}
            />

            <InputTextArea
                name="pekoEmail"
                label="Peko Email ID"
                placeholder="Enter Peko Email ID"
                isRequired
                showToolTip
                tooltipText="Multiple Email IDs are seperated by commas"
            />

            <SelectInput
                name="typeOfOrder"
                isRequired
                options={[
                    {
                        label: 'Manual',
                        value: 'MANUAL',
                    },
                    {
                        label: 'API',
                        value: 'API',
                    },
                ]}
                placeholder="Please select a type"
                label="Type "
                filterOption={false}
            />

            <SwitchInput name="sendMail" label="Send Email Internally" />
            <SwitchInput name="sendVendorMail" label="Send Email to Vendor" />

            {!hideImageField && (
                <CustomFileUploadInput
                    existingFileUrl={records?.image}
                    label="Image"
                    name="image"
                    format="imageFormat"
                    showFileName
                    showNotification
                />
            )}
        </Form>
    </Flex>
);

export default SubscriptionForm;
