import React from 'react';

import { Flex, Select, Spin, Typography } from 'antd';
import { useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import TextInput from '@components/atomic/inputs/TextInput';

import SelectAddress from './SelectAddress';
import { useFetchAddressApi } from '../../hooks/details/useAddressApi';
import { useGetPhoneCodes } from '../../hooks/details/useGetPhoneCodes';
import { usePostcodeLookup } from '../../hooks/details/usePostcodeLookup';
import { ShipmentFormValues } from '../../types';
import '../../assets/style.css';

const { Text } = Typography;

const ReceiverForm = () => {
    const { phoneCodes } = useGetPhoneCodes();
    const { values, setFieldValue } = useFormikContext<ShipmentFormValues>();
    const { city, state, isLookingUp, isInvalid } = usePostcodeLookup(values.receiverZipCode, true);
    const {
        addressOptions,
        handleOnClearAddress,
        searchKey,
        setSearchKey,
        selectedIndex,
        setSelectedIndex,
        handleOnSelectAddress,
    } = useFetchAddressApi(true);

    return (
        <Flex vertical className="xs:w-full sm:w-[40%]">
            <Flex className="mb-5">
                <Text className="text-base font-medium">Send To</Text>
            </Flex>
            <Flex vertical className="mb-4 gap-2">
                <Typography.Text>Saved Address</Typography.Text>
                <SelectAddress
                    options={addressOptions}
                    onSelect={handleOnSelectAddress}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    defaultvalue={
                        values.receiverAddressId ? values.receiverAddressId.toString() : ''
                    }
                    textSize="text-sm"
                    onClear={handleOnClearAddress}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                />
            </Flex>
            <TextInput
                label="Receiver Full Name"
                name="receiverName"
                placeholder="Enter Full Name"
                type="text"
                isRequired
                allowAlphabetsAndSpaceOnly
                maxLength={100}
            />
            <TextInput
                label="Receiver Email"
                name="receiverEmail"
                placeholder="Enter Email ID"
                type="email"
                isRequired
            />
            <TextInput
                label="Receiver Mobile Number"
                name="receiverPhone"
                placeholder="Enter Mobile Number"
                classes="w-full reciver-phone-input"
                type="text"
                maxLength={15}
                isRequired
                allowNumbersOnly
                addonBefore={
                    <div className="country-code-select w-28 p-0">
                        <Select
                            className="text-black-select w-full p-0"
                            showSearch
                            options={
                                phoneCodes &&
                                phoneCodes.map((code, index) => ({
                                    label: code.label,
                                    value: code.value,
                                    key: index,
                                }))
                            }
                            placeholder="Country Code"
                            value={values.receiverPhoneCode}
                            onChange={e => setFieldValue('receiverPhoneCode', e)}
                            filterOption={(input: string, option) =>
                                (
                                    (option &&
                                        // @ts-ignore
                                        option?.label.toLowerCase()) ??
                                    ''
                                ).includes(input.toLowerCase())
                            }
                            optionLabelProp="label"
                        />
                    </div>
                }
            />
            <TextInput
                label="Address Line 1"
                name="receiverAddressLine"
                placeholder="Enter Address Line 1"
                type="text"
                isRequired
                allowedInputKeys={input => input.replace(/[^a-zA-Z0-9 :()&/.,#-]/g, '')}
                maxLength={100}
            />
            <TextInput
                label="Address Line 2"
                name="receiverAddressLine2"
                placeholder="Enter Address Line 2 (optional)"
                type="text"
                allowedInputKeys={input => input.replace(/[^a-zA-Z0-9 :()&/.,#-]/g, '')}
                maxLength={100}
            />
            <TextInput
                label="P.O. Box or PIN/ZIP Code"
                name="receiverZipCode"
                placeholder="Enter ZIP Code"
                type="text"
                isRequired
                allowedInputKeys={input => input.replace(/[^a-zA-Z0-9 -]/g, '')}
                maxLength={20}
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
            <CheckboxInput name="recieverSaveAddress"> Save this address</CheckboxInput>
        </Flex>
    );
};

export default ReceiverForm;
