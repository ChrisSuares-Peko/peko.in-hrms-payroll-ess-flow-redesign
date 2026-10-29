import React, { useEffect } from 'react';

import { Flex, Form } from 'antd';
import { useFormikContext } from 'formik';

import IndianFlag from '@assets/svg/indianFlag.svg';
import CityAutoCompleteInput from '@components/atomic/inputs/CityAutoCompleteInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';

import useGeneralApi from '../../hooks/useGeneralApi';

interface AddressFormProps {
    refresh: boolean;
    addressTypesList: DropDown;
}
const AddressForm = ({ refresh, addressTypesList }: AddressFormProps) => {
    const { resetForm } = useFormikContext();
    const { statesList } = useGeneralApi();
    useEffect(() => {
        resetForm();
    }, [refresh, resetForm]);

    return (
        <Flex vertical className="w-full mt-2">
            <Form layout="vertical">
                <SelectInput
                    name="addressType"
                    label="Type"
                    placeholder="Select Type"
                    classes=" rounded-sm "
                    options={addressTypesList}
                    isRequired
                />
                <TextInput
                    name="name"
                    label="Name"
                    type="text"
                    placeholder="Enter Name"
                    classes=" rounded-sm "
                    allowAlphabetsAndSpaceOnly
                    maxLength={50}
                    isRequired
                />
                <TextInput
                    name="addressLine1"
                    label="Address Line 1"
                    type="text"
                    placeholder="Enter Address Line 1"
                    classes=" rounded-sm"
                    maxLength={50}
                    isRequired
                    allowAddressFormat
                />
                <TextInput
                    name="addressLine2"
                    label="Address Line 2"
                    type="text"
                    placeholder="Enter Address Line 2"
                    classes=" rounded-sm"
                    maxLength={50}
                    isRequired
                    allowAddressFormat
                />
                <TextInput
                    name="phoneNumber"
                    label="Mobile Number"
                    type="text"
                    placeholder="Enter Mobile Number"
                    classes="p-0"
                    allowNumbersOnly
                    maxLength={10}
                    isRequired
                    prefix={
                        <Flex
                            align="center"
                            gap={6}
                            className="p-2 h-full border-e me-2 cursor-not-allowed"
                        >
                            <img src={IndianFlag} alt="" />
                            <p>+91</p>
                        </Flex>
                    }
                />
                <SelectInputWithSearch
                    name="state"
                    label="State"
                    placeholder="Select State"
                    classes=" rounded-sm "
                    options={statesList || []}
                    isRequired
                />
                <CityAutoCompleteInput
                    name="city"
                    stateFieldName="state"
                    label="City"
                    placeholder="Enter City"
                    isRequired
                    classes=" rounded-sm"
                />
                <TextInput
                    name="zipCode"
                    label="PIN Code"
                    type="text"
                    placeholder="Enter PIN Code"
                    classes=" rounded-sm"
                    maxLength={6}
                    isRequired
                    allowNumbersOnly
                />
                <SwitchInput
                    name="default"
                    label="Default Address"
                    labelClasses="text-sm font-normal"
                />
            </Form>
        </Flex>
    );
};
export default AddressForm;
