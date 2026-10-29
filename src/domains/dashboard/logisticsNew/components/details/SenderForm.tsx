import React from 'react';

import { Flex, Spin, Typography } from 'antd';
import { useFormikContext } from 'formik';

import IndiaFlag from '@assets/svg/indianFlag.svg';
import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import TextInput from '@components/atomic/inputs/TextInput';

import SelectAddress from './SelectAddress';
import { useFetchAddressApi } from '../../hooks/details/useAddressApi';
import { usePostcodeLookup } from '../../hooks/details/usePostcodeLookup';
import { ShipmentFormValues } from '../../types';

const { Text } = Typography;

const SenderForm = () => {
    const {
        addressOptions,
        handleOnClearAddress,
        searchKey,
        setSearchKey,
        selectedIndex,
        setSelectedIndex,
        handleOnSelectAddress,
    } = useFetchAddressApi(false);
    const { values } = useFormikContext<ShipmentFormValues>();
    const { city, state, isLookingUp, isInvalid } = usePostcodeLookup(values.senderZipCode, false);

    return (
        <Flex vertical className="xs:w-full  sm:w-[40%]">
            <Flex className="mb-5">
                <Text className="text-base font-medium">Send From</Text>
            </Flex>
            <Flex vertical className="mb-4 gap-2">
                <Typography.Text>Saved Address</Typography.Text>
                <SelectAddress
                    options={addressOptions}
                    onSelect={handleOnSelectAddress}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    defaultvalue={values.senderAddressId ? values.senderAddressId.toString() : ''}
                    textSize="text-sm"
                    onClear={handleOnClearAddress}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                />
            </Flex>
            <TextInput
                label="Sender Full Name"
                name="senderName"
                placeholder="Enter Full Name"
                type="text"
                isRequired
                allowAlphabetsAndSpaceOnly
                maxLength={100}
            />
            <TextInput
                label="Sender Email"
                name="senderEmail"
                placeholder="Enter Email ID"
                type="email"
                isRequired
            />
            <TextInput
                label="Sender Mobile Number"
                name="senderPhone"
                placeholder="Enter Mobile Number"
                classes="w-full"
                type="text"
                maxLength={10}
                isRequired
                allowNumbersOnly
                prefix={
                    <Flex
                        align="center"
                        gap={6}
                        className="h-full pr-2 cursor-not-allowed border-e me-2"
                    >
                        <img src={IndiaFlag} alt="India" />
                        <p>+91</p>
                    </Flex>
                }
            />
            <TextInput
                label="Address Line 1"
                name="senderAddressLine"
                placeholder="Enter Address Line 1"
                type="text"
                isRequired
                allowedInputKeys={input => input.replace(/[^a-zA-Z0-9 :()&/.,#-]/g, '')}
                maxLength={100}
            />
            <TextInput
                label="Address Line 2"
                name="senderAddressLine2"
                placeholder="Enter Address Line 2 (optional)"
                type="text"
                allowedInputKeys={input => input.replace(/[^a-zA-Z0-9 :()&/.,#-]/g, '')}
                maxLength={100}
            />
            <TextInput
                label="P.O. Box or PIN/ZIP Code"
                name="senderZipCode"
                placeholder="Enter ZIP Code"
                type="text"
                isRequired
                allowNumbersOnly
                maxLength={6}
                minLength={3}
            />
            {isLookingUp && (
                <Flex align="center" gap={6} className="mb-2 -mt-2">
                    <Spin size="small" />
                    <Typography.Text className="text-xs text-gray-400">
                        Fetching location...
                    </Typography.Text>
                </Flex>
            )}
            {!isLookingUp && city && (
                <Flex className="mb-2 -mt-2">
                    <Typography.Text className="text-xs text-gray-500">
                        {city}
                        {state ? `, ${state}` : ''}
                    </Typography.Text>
                </Flex>
            )}
            {!isLookingUp && isInvalid && (
                <Flex className="mb-2 -mt-2">
                    <Typography.Text className="text-xs text-red-500">
                        Invalid PIN code
                    </Typography.Text>
                </Flex>
            )}
            <CheckboxInput name="senderSaveAddress"> Save this address</CheckboxInput>
        </Flex>
    );
};

export default SenderForm;
