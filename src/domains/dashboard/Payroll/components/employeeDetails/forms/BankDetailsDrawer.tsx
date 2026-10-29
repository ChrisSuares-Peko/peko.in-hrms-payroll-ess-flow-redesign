import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateEmployeeApiNew } from '../../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { editBankSchema } from '../../../schema/employeeProfile';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    initialValues: {
        id: string;
        employeeId: string;
        name: string;
        bankName: string;
        accountNumber: string;
        iBan: string;
        swiftCode: string | undefined;
        accountType?: string | null;
        routingCode?: string | null;
    };
};

const BankDetailsDrawer = ({ handleCancel, open, initialValues, setRefState }: Props) => {
    const { updateBankDetails } = useUpdateEmployeeApiNew();
    return (
        <CustomModalWithForm
            modalTitle="Bank Details"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const bankDetails = {
                    id: initialValues.id,
                    bankDetails: values,
                };
                const res = await updateBankDetails(bankDetails);
                if (res) {
                    setRefState(new Date().valueOf());
                }
                handleCancel();
            }}
            validationSchema={editBankSchema}
            initialValues={{
                beneficiaryName: initialValues?.name ?? '',
                bankName: initialValues?.bankName ?? '',
                accountNumber: initialValues?.accountNumber ?? '',
                ibanNumber: initialValues?.iBan ?? '',
                swiftCode: initialValues?.swiftCode ?? '',
                // accountType: initialValues?.accountType ?? '',
                routingCode: initialValues?.routingCode ?? '',
            }}
        >
            <Form layout="vertical">
                <TextInput
                    name="beneficiaryName"
                    label="Account Holder Name"
                    type="text"
                    placeholder="Enter Account Holder Name"
                    classes="rounded-sm"
                    allowAlphabetsAndSpaceOnly
                    isRequired
                    maxLength={15}
                />
                <TextInput
                    name="bankName"
                    label="Bank Name"
                    type="text"
                    placeholder="Enter Bank Name"
                    classes="rounded-sm"
                    allowAlphabetsAndSpaceOnly
                    isRequired
                    maxLength={55}
                />
                <TextInput
                    name="accountNumber"
                    label="Account Number"
                    type="text"
                    placeholder="Enter Account Number"
                    classes="rounded-sm"
                    allowNumbersOnly
                    isRequired
                    maxLength={16}
                />
                <TextInput
                    name="ibanNumber"
                    label="IBAN Number"
                    type="text"
                    placeholder="Enter IBAN Number"
                    classes="rounded-sm"
                    allowAlphabetsAndNumbersOnly
                    isRequired
                    maxLength={23}
                    tooltipText="23 character code starting with 'AE'"
                    showToolTip
                />
                <TextInput
                    name="swiftCode"
                    label="Swift Code"
                    type="text"
                    placeholder="Enter Swift Code"
                    classes="rounded-sm"
                    allowAlphabetsAndNumbersOnly
                    maxLength={6}
                />
                <TextInput
                    label="Routing Code"
                    name="routingCode"
                    placeholder="Routing Code"
                    type="text"
                    maxLength={10}
                    allowNumbersOnly
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default BankDetailsDrawer;
