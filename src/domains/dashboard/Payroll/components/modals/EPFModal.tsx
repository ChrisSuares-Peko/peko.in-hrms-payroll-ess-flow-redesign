import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { payrollEPFSchema } from '../../schema/EmployeeSalary';
import SelectInput from '../EmployeeProfile/SelectInput';

interface EPFModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRowData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const EPFModal = ({
    open,
    handleCancel,
    selectedRowData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: EPFModalProps) => {
    const handleFormSubmit = async (values: any) => {
        // Add form submission logic here
    };

    // Extract data from selectedRowData for initial form values
    const {
        EPFNumber,
        UAN,
        EmployeeContriRate,
        EmployerContriRate,
        EmployeeContriAmount,
        EmployerContriAmount,
        status,
    } = selectedRowData || {};

    return (
        <CustomModalWithForm
            modalTitle="Employees Provident Fund"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                EPFNumber: EPFNumber || '',
                UAN: UAN || '',
                EmployeeContriRate: EmployeeContriRate || '',
                EmployerContriRate: EmployerContriRate || '',
                EmployeeContriAmount: EmployeeContriAmount || '',
                EmployerContriAmount: EmployerContriAmount || '',
                status: status || 'Active',
            }}
            validationSchema={payrollEPFSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="EPFNumber"
                        type="text"
                        placeholder="Enter EPF number"
                        label="EPF Number"
                        isRequired
                        allowNumbersOnly
                        maxLength={6}
                    />
                    <TextInput
                        name="UAN"
                        type="text"
                        placeholder="Enter UAN number"
                        label="UAN Number"
                        isRequired
                        allowNumbersOnly
                        maxLength={6}
                    />
                    <TextInput
                        name="EmployeeContriRate"
                        type="text"
                        placeholder="Enter employee contribution rate"
                        label="Employee Contribution Rate"
                        isRequired
                        allowNumbersOnly
                    />
                    <TextInput
                        name="EmployerContriRate"
                        type="text"
                        placeholder="Enter employer contribution rate"
                        label="Employer Contribution Rate"
                        isRequired
                        allowNumbersOnly
                    />
                    <TextInput
                        name="EmployeeContriAmount"
                        type="text"
                        placeholder="Enter employee contribution amount"
                        label="Employee Contribution Amount"
                        isRequired
                        allowNumbersOnly
                    />
                    <TextInput
                        name="EmployerContriAmount"
                        type="text"
                        placeholder="Enter employer contribution amount"
                        label="Employer Contribution Amount"
                        isRequired
                        allowNumbersOnly
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

export default EPFModal;
