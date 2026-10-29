import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateEmployeeApiNew } from '../../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { salarySchema } from '../../../schema/employeeProfile';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    initialValues: {
        id: string;
        monthlyBasic: number | null;
        homeAllowances: number | null;
        travelAllowances: number | null;
        medicalAllowances: number | null;
        otherAllowances: number | null;
        other: number | null;
    };
};

const SalaryDetailsDrawer = ({ handleCancel, open, initialValues, setRefState }: Props) => {
    const { updateSalaryDetails } = useUpdateEmployeeApiNew();
    return (
        <CustomModalWithForm
            modalTitle="Salary Details"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const salaryData = {
                    id: initialValues.id,
                    salaryInformation: {
                        basicPay: Number(values.basicPay).toFixed(2),
                        homeAllowances: Number(values.homeAllowances).toFixed(2),
                        travelAllowances: Number(values.travelAllowances).toFixed(2),
                        medicalAllowances: Number(values.medicalAllowances).toFixed(2),
                        otherAllowances: Number(values.otherAllowances).toFixed(2),
                        other: Number(values.other).toFixed(2),
                    },
                };
                const res = await updateSalaryDetails(salaryData);
                if (res) setRefState(new Date().valueOf());
                handleCancel();
            }}
            initialValues={{
                basicPay: initialValues?.monthlyBasic ?? '',
                homeAllowances: initialValues?.homeAllowances ?? '',
                travelAllowances: initialValues?.travelAllowances ?? '',
                medicalAllowances: initialValues?.medicalAllowances ?? '',
                otherAllowances: initialValues?.otherAllowances ?? '',
                other: initialValues?.other ?? '',
            }}
            validationSchema={salarySchema}
            reinitialise
        >
            <Form layout="vertical">
                <TextInput
                    name="basicPay"
                    label="Monthly Basic"
                    type="text"
                    placeholder="Enter Monthly Basic"
                    classes="rounded-sm"
                    allowDecimalsOnly
                    isRequired
                />
                <TextInput
                    name="homeAllowances"
                    label="Home Allowances"
                    type="text"
                    placeholder="Enter Home Allowances"
                    classes="rounded-sm"
                    allowDecimalsOnly
                    isRequired
                />
                <TextInput
                    name="travelAllowances"
                    label="Emergency Travel Allowances"
                    type="text"
                    placeholder="Enter Travel Allowances"
                    classes="rounded-sm"
                    allowDecimalsOnly
                    isRequired
                />
                <TextInput
                    name="medicalAllowances"
                    label="Medical Allowances"
                    type="text"
                    placeholder="Enter Medical Allowances"
                    classes="rounded-sm"
                    allowDecimalsOnly
                    isRequired
                />
                <TextInput
                    name="otherAllowances"
                    label="Other Allowances"
                    type="text"
                    placeholder="Enter Other Allowances"
                    classes="rounded-sm"
                    allowNumbersOnly
                />
                {/* <TextInput
                    name="other"
                    label="Other"
                    type="text"
                    placeholder="Other"
                    classes="rounded-sm"
                    allowNumbersOnly
                /> */}
            </Form>
        </CustomModalWithForm>
    );
};

export default SalaryDetailsDrawer;
