import React from 'react';

import { Flex, Form } from 'antd';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { refresh } from '@src/domains/admin/manage/types/edocTypes';

import { useCustomerAdd } from '../../hooks/useCustomerAdd';
import { customersSchema } from '../../schema/index';
import { RowData } from '../../types/customertypes';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: RowData;
};

const CustomerModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: DepartmentModalProps & refresh) => {
    const { customerAdd, customerUpdate, isLoading } = useCustomerAdd();

    return (
        <CustomModalWithForm
            modalTitle="Add Customer"
            open={open}
            handleCancel={handleCancel}
            validationSchema={customersSchema}
            reinitialise
            isLoading={isLoading}
            handleFormSubmit={async values => {
                if (data) {
                    const res = await customerUpdate({ id: data.id, ...values });
                    if (res) {
                        setRefresh(true);
                        handleCancel();
                    }
                } else {
                    const res = await customerAdd(values);
                    if (res) {
                        setRefresh(true);
                        handleCancel();
                    }
                }
            }}
            initialValues={{
                name: data?.name || '',
                email: data?.email || '',
                phoneNumber: data?.phoneNumber || '',
                address: data?.address || '',
                credentialId: data?.id,
                trnNo: data?.trnNo || undefined,
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <TextInput
                        name="name"
                        label="Customer Name"
                        type="text"
                        placeholder="Enter Customer Name"
                        classes=" rounded-sm"
                        isRequired
                        maxLength={50}
                    />
                    <TextInput
                        name="email"
                        label="Email ID"
                        type="text"
                        placeholder="Enter Email ID"
                        classes="rounded-sm"
                        isRequired
                        maxLength={50}
                    />
                    <TextInput
                        name="phoneNumber"
                        label="Mobile Number"
                        type="text"
                        placeholder="Enter Mobile Number"
                        classes="rounded-sm"
                        isRequired
                        allowNumbersOnly
                        maxLength={10}
                    />
                    <TextAreaInput
                        name="address"
                        label="Address"
                        placeholder="Enter Address"
                        isRequired
                        // maxLength={100}
                        // minRows={3}
                    />
                    <TextInput
                        type="text"
                        name="trnNo"
                        label="TRN Number(Optional)"
                        placeholder="Enter TRN Number"
                        maxLength={15}
                        minLength={10}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default React.memo(CustomerModal);
