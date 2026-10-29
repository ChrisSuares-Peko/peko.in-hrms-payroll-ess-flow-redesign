import React from 'react';

import { Form } from 'antd';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { UserInfoSchema } from '../../schema';

type Props = {
    open: boolean;
    isLoading?: boolean;
    handleCancel: () => void;
    setRefState?: (num: number) => void;
    initialValues: {
        id: string;
        usedBy: string;
        department: string;
        employeeId: string;
        joiningDate: string;
        assignDate: string;
        usingFor: string;
    } | null;
};

const UserInformationModal = ({
    handleCancel,
    open,
    initialValues,
    setRefState,
    isLoading,
}: Props) => (
    <CustomModalWithForm
        modalTitle="User Information"
        open={open}
        handleCancel={handleCancel}
        handleFormSubmit={async values => {
            handleCancel();
        }}
        initialValues={{
            usedBy: '',
            department: '',
            employeeId: '',
            joiningDate: '',
            assignDate: '',
            usingFor: '',
        }}
        validationSchema={UserInfoSchema}
        reinitialise
    >
        <Form layout="vertical" className="">
            <TextInput
                name="usedBy"
                type="text"
                placeholder="Enter user name"
                label="Used by"
                isRequired
                allowAlphabetsSpaceAndNumbersOnly
                maxLength={50}
            />
            <CustomSelectSearch
                name="department"
                placeholder="Select department"
                label="Department"
                isRequired
                options={[
                    { oName: 'Development', oValue: 'DEV' },
                    { oName: 'Accounts', oValue: 'ACCOUNTS' },
                ]}
            />
            <TextInput
                name="employeeId"
                type="text"
                placeholder="Enter employee id"
                label="Employee Id"
                isRequired
                allowAlphabetsAndNumbersOnly
                maxLength={50}
            />
            <DatePickerInput
                name="joiningDate"
                label="Joining Date"
                placeholder="Select joining date"
                classes="w-full"
                needConfirm={false}
                isRequired
            />
            <DatePickerInput
                name="assignDate"
                label="Assign Date"
                placeholder="Select assign date"
                classes="w-full"
                needConfirm={false}
                isRequired
            />
            <TextInput
                name="usingFor"
                type="text"
                placeholder="Enter using for"
                label="Using For"
                isRequired
                allowAlphabetsAndSpaceOnly
                maxLength={50}
            />
        </Form>
    </CustomModalWithForm>
);

export default UserInformationModal;
