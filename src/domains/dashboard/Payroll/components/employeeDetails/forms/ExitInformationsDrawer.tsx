import React from 'react';

import { Form } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateEmployeeApiNew } from '../../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { offBoardSchema } from '../../../schema/employeeProfile';
import SelectInput from '../../EmployeeProfile/SelectInput';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    initialValues: {
        id: string;
        lastWorkingDay: string;
        noticePeriod: number;
        offBoardingType: string;
        reasonForOffBoarding: string;
    };
};
const resignationTypes = [
    { key: 1, id: 1, value: 'RESIGNATION', label: 'Resignation', name: 'resignation' },
    { key: 2, id: 2, value: 'SUSPENSION', label: 'Suspension', name: 'suspension' },
];

const ExitInformationsDrawer = ({ handleCancel, open, initialValues, setRefState }: Props) => {
    const { updateExitInfo } = useUpdateEmployeeApiNew();

    return (
        <CustomModalWithForm
            modalTitle="Exit Informations"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const employeeInformation = {
                    id: initialValues.id,
                    employeeInformation: values,
                };

                const res = await updateExitInfo(employeeInformation);
                if (res) setRefState(new Date().valueOf());
                handleCancel();
            }}
            initialValues={{
                lastWorkingDay: initialValues?.lastWorkingDay ?? '',
                noticePeriod: initialValues?.noticePeriod ?? '',
                offBoardingType: initialValues?.offBoardingType ?? '',
                reasonForOffBoarding: initialValues?.reasonForOffBoarding ?? '',
            }}
            validationSchema={offBoardSchema}
        >
            <Form layout="vertical">
                <DatePickerInput
                    name="lastWorkingDay"
                    label="Last day of employee"
                    placeholder="Enter Last day of employee"
                    classes="rounded-sm"
                    isRequired
                />
                <SelectInput
                    isRequired
                    name="offBoardingType"
                    label="Type Of Resignation"
                    placeholder="Type Of Resignation"
                    options={resignationTypes}
                    classes="rounded-sm"
                />
                <TextInput
                    name="noticePeriod"
                    label="Notice Period"
                    type="text"
                    placeholder="Enter Notice Period"
                    classes="rounded-sm"
                    allowNumbersOnly
                    isRequired
                />
                <TextInput
                    name="reasonForOffBoarding"
                    label="Reason of Resignation"
                    type="text"
                    placeholder="Enter Reason of Resignation"
                    classes="rounded-sm"
                    allowAlphabetsAndSpaceOnly
                    isRequired
                />
            </Form>
        </CustomModalWithForm>
    );
};

export default ExitInformationsDrawer;
