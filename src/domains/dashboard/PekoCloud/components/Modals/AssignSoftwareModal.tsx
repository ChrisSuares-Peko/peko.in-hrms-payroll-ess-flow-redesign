import React, { useRef } from 'react';

import { Form } from 'antd';
import { FormikProps } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import useAssignSubscription from '../../hooks/subscriptionHooks/useAssignSubscriptionApi';
import { useGetSubscriptions } from '../../hooks/subscriptionHooks/useGetSubscriptionsApi';
import { subscriptionAssignSchema } from '../../schema';

interface AssignSoftwareModalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AssignSoftwareModal = ({ open, handleCancel, reloadTable }: AssignSoftwareModalProps) => {
    const subscriptionAssignForm = useRef<FormikProps<any>>(null);
    const dispatch = useAppDispatch();
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const employeeOptions = generateEmployeesDropdown(data) || [];
    const { subscriptionsData, generateSubscriptionsDropdown } = useGetSubscriptions();
    const { handleAssignSubscription, submitLoading } = useAssignSubscription();

    const handleFormSubmit = async (values: any) => {
        const selectedEmployee = employeeOptions.find(option => option.value === values.assignTo);
        const selectedSubscription = subscriptionsData.find(
            subscription => subscription.id === values.cloudSoftwareId
        );

        const employeeAlreadyAssigned = selectedSubscription?.assignTo.find(
            (assign: any) => assign.id === selectedEmployee?.value
        );
        if (!employeeAlreadyAssigned) {
            const payload = {
                subscriptionId: selectedSubscription ? selectedSubscription.id : null,
                employeeName: selectedEmployee ? selectedEmployee.label : '',
                id: selectedEmployee ? selectedEmployee.value : '',
            };

            await handleAssignSubscription(payload);
            handleCancel();
            if (reloadTable) reloadTable(p => !p);
        } else {
            dispatch(
                showToast({
                    description: 'Subscription is already assigned to the employee',
                    variant: 'error',
                })
            );
        }
    };

    return (
        <CustomModalWithForm
            modalTitle="Assign Subscription"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                assignTo: '',
                cloudSoftwareId: '',
            }}
            validationSchema={subscriptionAssignSchema}
            reinitialise
            isLoading={submitLoading}
            formRefName={subscriptionAssignForm}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInputWithSearch
                        name="assignTo"
                        options={employeeOptions}
                        placeholder="Select employees"
                        label="Employee name"
                        isRequired
                    />
                    <SelectInputWithSearch
                        name="cloudSoftwareId"
                        label="Software"
                        placeholder="Select software"
                        isRequired
                        options={generateSubscriptionsDropdown(subscriptionsData) || []}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default AssignSoftwareModal;
