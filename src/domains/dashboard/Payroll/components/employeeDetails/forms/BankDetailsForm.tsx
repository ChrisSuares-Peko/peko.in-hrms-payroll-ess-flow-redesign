import React from 'react';

import { Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import TextInput from '@components/atomic/inputs/TextInput';

interface BankDetailsFormProps {
    selectedRecordData?: null;
    employeeIdFromProfile?: string;
}

const BankDetailsForm = ({ selectedRecordData, employeeIdFromProfile }: BankDetailsFormProps) => {
    const { values, setFieldValue } = useFormikContext<any>();
    // const [checked, setChecked] = useState(true);
    const handleCheckboxChange = (e: any) => {
        const newChecked = e.target.checked;
        // setChecked(newChecked);
        setFieldValue('isDefaultAccount', newChecked);
    };
    return (
        <Form layout="vertical">
            <TextInput
                name="accountName"
                type="text"
                placeholder="Enter account holder name"
                label="Account Holder Name"
                isRequired
                maxLength={50}
                allowAlphabetsAndSpaceOnly
            />
            <TextInput
                name="accountNumber"
                type="text"
                placeholder="Enter account number"
                label="Account Number"
                isRequired
                allowNumbersOnly
                maxLength={25}
            />
            <TextInput
                name="bankName"
                type="text"
                placeholder="Enter bank name"
                label="Bank Name"
                isRequired
                allowAlphabetsAndSpaceOnly
                maxLength={50}
            />
            <TextInput
                name="ifscCode"
                type="text"
                placeholder="Enter IFSC code"
                label="IFSC Code"
                isRequired
                handleChange={(value: string) => {
                    const formattedValue = value
                        .replace(/[^a-zA-Z0-9]/g, '') // remove special chars & spaces
                        .toUpperCase() // force uppercase
                        .slice(0, 11); // max length

                    setFieldValue('ifscCode', formattedValue);
                }}
                maxLength={11}
            />
            <Flex vertical className="">
                <Typography.Text className="font-medium ">Default Bank Account</Typography.Text>
                <CheckboxInput
                    onChange={handleCheckboxChange}
                    name="isDefaultAccount"
                    checked={values.isDefaultAccount}
                />
            </Flex>
        </Form>
    );
};

export default BankDetailsForm;
