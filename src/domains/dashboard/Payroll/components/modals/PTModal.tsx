import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { payrollPTSchema } from '../../schema/EmployeeSalary';
import SelectInput from '../EmployeeProfile/SelectInput';

interface PTModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRowData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const PTModal = ({
    open,
    handleCancel,
    selectedRowData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: PTModalProps) => {
    const handleFormSubmit = async (values: any) => {};

    // Destructure the relevant fields from selectedRowData
    const { state, PTNumber, PTRate, PTContriAmount, status } = selectedRowData || {};

    return (
        <CustomModalWithForm
            modalTitle={selectedRowData ? 'Professional Tax' : 'Professional Tax'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                state: state || '',
                PTNumber: PTNumber || '',
                PTRate: PTRate || '',
                PTContriAmount: PTContriAmount || '',
                status: status || 'Active',
            }}
            validationSchema={payrollPTSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInput
                        name="state"
                        label="State"
                        placeholder="Select state"
                        isRequired
                        options={[]}
                    />
                    <TextInput
                        name="PTNumber"
                        type="text"
                        placeholder="Enter PT number"
                        label="PT Number"
                        isRequired
                        allowNumbersOnly
                        maxLength={15}
                    />
                    <TextInput
                        name="PTRate"
                        type="text"
                        placeholder="Enter PT rate"
                        label="PT Rate"
                        isRequired
                        allowNumbersOnly
                        maxLength={6}
                    />
                    <TextInput
                        name="PTContriAmount"
                        type="text"
                        placeholder="Enter PT contribution amount"
                        label="PT Contribution Amount"
                        isRequired
                        allowNumbersOnly
                        maxLength={10}
                    />
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        isRequired
                        options={[
                            { label: 'Active', value: 'Active' },
                            { label: 'Inactive', value: 'Inactive' },
                        ]}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default PTModal;
