import React, { useState } from 'react';

import { Flex, Form, Select } from 'antd';

import indianFlag from '@assets/svg/indianFlag.svg';
import UAEFlag from '@assets/svg/uaeflag.svg';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useAddNumber from '../../hooks/whatsappNotification/useAddNumber'; // Import the add number hook
import useEditNumber from '../../hooks/whatsappNotification/useEditNumber'; // Import the custom hook
import whatsappNumberShema from '../../schema/whatsAppNumnber';

const { Option } = Select; // Destructure Option from Select

type WhatsAppNumberModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: {
        id?: string;
        whatsappNumber?: string;
        name?: string;
    };
    setRefresh: (value: boolean) => void; // Dummy setter for refresh
};

function removeInUAECountryCodes(number: string) {
    number = number.replace(/^(971|91)/, '');
    return number;
}

function getCountryCode(number: string | undefined) {
    if (number && number.startsWith('91')) return '91';
    return '971';
}

const WhatsAppNumberModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: WhatsAppNumberModalProps) => {
    const { handleEditNumber, loading: editLoading } = useEditNumber(); // Use the edit hook
    const { handleAddNumber, loading: addLoading } = useAddNumber(); // Use the add hook

    const loading = editLoading || addLoading; // Combined loading state
    const [countryCode, setCountryCode] = useState(getCountryCode(data?.whatsappNumber)); // Default to UAE code

    const handleFormSubmit = async (values: any) => {
        const { whatsappNumber } = values;
        const fullNumber = `${countryCode}${whatsappNumber}`; // Combine country code with number

        const details = {
            whatsappNumber: fullNumber,
            name: values.name,
        };

        // If data exists, we're updating, otherwise we're creating a new WhatsApp number
        const res = data
            ? await handleEditNumber(data.whatsappNumber || '', details) // Update existing number
            : await handleAddNumber(details); // Create new number

        if (res) {
            setRefresh(true);
            handleCancel();
        }
    };

    return (
        <CustomModalWithForm
            isLoading={loading} // Use combined loading from hooks
            modalTitle="WhatsApp Number Management"
            open={open}
            validationSchema={whatsappNumberShema}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                id: data?.id || '',
                whatsappNumber: data?.whatsappNumber
                    ? removeInUAECountryCodes(data.whatsappNumber)
                    : '',
                name: data?.name || '',
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <TextInput
                        name="name"
                        label="Name"
                        type="text"
                        placeholder="Please enter the name"
                        isRequired
                        maxLength={50}
                        classes="rounded-sm"
                        allowAlphabetsAndSpaceOnly
                    />
                    <TextInput
                        allowNumbersOnly
                        name="whatsappNumber"
                        label="WhatsApp Number"
                        type="text"
                        placeholder="Please enter WhatsApp number"
                        isRequired
                        maxLength={10}
                        prefix={
                            <Flex className="border-e-2" onClick={e => e.stopPropagation()}>
                                <Select
                                    value={countryCode}
                                    onChange={value => setCountryCode(value)}
                                    variant="borderless"
                                    popupMatchSelectWidth={false}
                                    style={{ width: 'auto' }} // Adjust to make it fit in the prefix
                                    styles={{ popup: { root: { minWidth: '150px' } } }}
                                    getPopupContainer={trigger => trigger.parentElement} // Ensure dropdown stays in input
                                >
                                    <Option value="971" className="flex items-center">
                                        <Flex justify="center" align="center">
                                            <img
                                                src={UAEFlag}
                                                alt="UAE Flag"
                                                className="h-4 w-4 mr-2"
                                            />
                                            +971 (UAE)
                                        </Flex>
                                    </Option>
                                    <Option value="91" className="flex items-center">
                                        <Flex justify="center" align="center">
                                            <img
                                                src={indianFlag}
                                                alt="India Flag"
                                                className="h-4 w-4 mr-2"
                                            />
                                            +91 (India)
                                        </Flex>
                                    </Option>
                                </Select>
                            </Flex>
                        }
                        classes="rounded-sm"
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default WhatsAppNumberModal;
