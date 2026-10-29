import { useEffect } from 'react';

import { Flex, Form } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';

interface BankFormProps {
    refresh: boolean;
    isOtpOpen: boolean;
    accountTypesList: DropDown;
}

const BankForm = ({ refresh, isOtpOpen, accountTypesList }: BankFormProps) => {
    const { resetForm, setSubmitting } = useFormikContext();

    useEffect(() => {
        resetForm();
    }, [refresh, resetForm]);

    useEffect(() => {
        if (!isOtpOpen) setSubmitting(false);
    }, [isOtpOpen, setSubmitting]);

    return (
        <Flex vertical className="w-full mt-2">
            <Form layout="vertical">
                <TextInput
                    name="accountHolderName"
                    label="Account Holder Name"
                    type="text"
                    placeholder="Enter Account Holder Name"
                    classes=" rounded-sm "
                    allowAlphabetsAndSpaceOnly
                    maxLength={50}
                    isRequired
                />
                <TextInput
                    name="bankName"
                    label="Bank Name"
                    type="text"
                    placeholder="Enter Bank Name"
                    classes=" rounded-sm"
                    allowAlphabetsAndSpaceOnly
                    maxLength={50}
                    isRequired
                />
                <TextInput
                    name="accountNumber"
                    label="Account Number"
                    type="text"
                    placeholder="Enter Account Number"
                    classes=" rounded-sm"
                    allowNumbersOnly
                    maxLength={18}
                    isRequired
                />
                <TextInput
                    name="bankBranch"
                    label="Bank Branch"
                    type="text"
                    placeholder="Enter Bank Branch"
                    classes=" rounded-sm"
                    maxLength={50}
                />
                <TextInput
                    name="ifscCode"
                    label="IFSC Code"
                    type="text"
                    placeholder="Enter IFSC Code"
                    classes=" rounded-sm"
                    allowAlphabetsAndNumbersOnly
                    maxLength={11}
                    isRequired
                    allowUpperCaseOnly
                />
                <SelectInput
                    name="accountType"
                    label="Account Type"
                    placeholder="Select Account Type"
                    classes=" rounded-sm "
                    options={accountTypesList}
                    isRequired
                />
                <SwitchInput
                    name="default"
                    label="Primary Bank Account"
                    labelClasses="text-sm font-normal"
                />
            </Form>
        </Flex>
    );
};

export default BankForm;
