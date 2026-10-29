import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { payrollLWFSchema } from '../../schema/EmployeeSalary'; // Adjusted schema name for LWF
import SelectInput from '../EmployeeProfile/SelectInput';

interface LWFModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRowData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const LWFModal = ({
    open,
    handleCancel,
    selectedRowData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: LWFModalProps) => {
    const handleFormSubmit = async (values: any) => {};

    // Destructure the relevant fields from selectedRowData
    const {
        EmployeeContriRate,
        EmployerContriRate,
        EmployeeContriAmount,
        EmployerContriAmount,
        status,
    } = selectedRowData || {};

    return (
        <CustomModalWithForm
            modalTitle={selectedRowData ? 'Labor Welfare Fund' : 'Labor Welfare Fund'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                EmployeeContriRate: EmployeeContriRate || '',
                EmployerContriRate: EmployerContriRate || '',
                EmployeeContriAmount: EmployeeContriAmount || '',
                EmployerContriAmount: EmployerContriAmount || '',
                status: status || 'Active', // Defaulting to 'Active'
            }}
            validationSchema={payrollLWFSchema} // Adjusted schema name for LWF
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="EmployeeContriRate"
                        type="text"
                        placeholder="Enter employee contribution rate"
                        label="Employee Contribution Rate"
                        isRequired
                        allowNumbersOnly
                        maxLength={6}
                    />
                    <TextInput
                        name="EmployerContriRate"
                        type="text"
                        placeholder="Enter employer contribution rate"
                        label="Employer Contribution Rate"
                        isRequired
                        allowNumbersOnly
                        maxLength={6}
                    />
                    <TextInput
                        name="EmployeeContriAmount"
                        type="text"
                        placeholder="Enter employee contribution amount"
                        label="Employee Contribution Amount"
                        isRequired
                        allowNumbersOnly
                        maxLength={10}
                    />
                    <TextInput
                        name="EmployerContriAmount"
                        type="text"
                        placeholder="Enter employer contribution amount"
                        label="Employer Contribution Amount"
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

export default LWFModal;
