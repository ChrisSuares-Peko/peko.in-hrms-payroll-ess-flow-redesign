import { useCallback, useMemo } from 'react';

import { Flex, Form, Typography } from 'antd';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';

import { useCustomerDropdown } from '../../hooks/useCustomerDropdown';
import CustomDropDown from '../CustomDropDown';
import CustomTextArea from '../CustomTextArea';

interface CustomerProps {
    onCustomerSelect: any;
}

const { Text } = Typography;

const CustomerDetailsFormCreate = ({ onCustomerSelect }: CustomerProps) => {
    const { tableData } = useCustomerDropdown('');

    const customerOptions = useMemo(
        () =>
            tableData?.map(customer => ({
                value: customer.value,
                label: customer.label,
                customer,
            })),
        [tableData]
    );

    const handleChange = useCallback(
        (option: any) => {
            onCustomerSelect(option?.customer);
        },
        [onCustomerSelect]
    );
    return (
        <Flex vertical gap={18} className="w-full pt-0">
            <Text className="font-semibold">Billed to</Text>
            <Form layout="vertical" className="flex flex-col w-full gap-4">
                <CustomDropDown
                    showSearch
                    options={customerOptions}
                    label="Select saved customer"
                    handleChange={handleChange}
                />
                <CustomTextArea
                    name="customerName"
                    placeholder="Enter Customer Name"
                    label="Customer Name"
                    type="text"
                    isRequired
                    maxLength={50}
                />
                <CustomTextArea
                    name="customerEmail"
                    placeholder="Enter Email ID"
                    label="Email ID"
                    type="text"
                    isRequired
                    maxLength={50}
                />
                <CustomTextArea
                    name="customerAddress"
                    placeholder="Enter Customer Address"
                    label="Customer Address"
                    type="text"
                    isRequired
                    maxLength={100}
                />
                <CustomTextArea
                    name="customerPhone"
                    placeholder="Enter Mobile Number"
                    label="Mobile Number"
                    type="text"
                    allowNumbersOnly
                    maxLength={10}
                    minLength={10}
                    isRequired
                />
                <CustomTextArea
                    name="customerTRNNumber"
                    placeholder="Enter Customer TRN (If any)"
                    label="Customer TRN (Optional)"
                    type="text"
                    allowNumbersOnly
                    maxLength={15}
                    minLength={10}
                />
                <CheckboxInput name="saveCustomerDetails">Save this customer</CheckboxInput>
            </Form>
        </Flex>
    );
};

export default CustomerDetailsFormCreate;
