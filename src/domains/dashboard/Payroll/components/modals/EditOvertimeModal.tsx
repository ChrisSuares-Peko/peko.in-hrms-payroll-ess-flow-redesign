import { useRef } from 'react';

import { Modal } from 'antd';
import { type FormikProps } from 'formik';

import EditOvertimeForm, { type EditOvertimeFormValues } from './EditOvertimeForm';
import type { UpdateOvertimeArgs } from '../../hooks/dashboardHooks/useUpdateOvertime';

export type OvertimeEditInitialValues = {
    employeeId: string;
    overTimeDate: string;
    extraHours: number;
    overTimeRate: number;
    totalWorkingHours: number;
    hourlyRate: number;
    overtimeAmount: number;
    notes?: string | null;
};

interface Props {
    open: boolean;
    overtimeId: string | null;
    initialValues: OvertimeEditInitialValues | null;
    isLoading: boolean;
    onSubmit: (args: UpdateOvertimeArgs) => void;
    onClose: () => void;
}

const EditOvertimeModal = ({ open, overtimeId, initialValues, isLoading, onSubmit, onClose }: Props) => {
    const formikRef = useRef<FormikProps<EditOvertimeFormValues>>(null);

    const formInitialValues: EditOvertimeFormValues = {
        overTimeDate: initialValues?.overTimeDate ?? '',
        extraHours: initialValues?.extraHours != null ? String(initialValues.extraHours) : '',
        overTimeRate: initialValues?.overTimeRate != null ? String(initialValues.overTimeRate) : '',
        totalWorkingHours: initialValues?.totalWorkingHours != null ? String(initialValues.totalWorkingHours) : '',
        hourlyRate: initialValues?.hourlyRate != null ? String(initialValues.hourlyRate) : '',
        overTimeAmount: initialValues?.overtimeAmount != null ? String(initialValues.overtimeAmount) : '',
        notes: initialValues?.notes ?? '',
    };

    const handleFormSubmit = (values: EditOvertimeFormValues) => {
        if (!overtimeId) return;
        onSubmit({
            overtimeId,
            overTimeDate: values.overTimeDate,
            extraHours: parseFloat(values.extraHours),
            overTimeRate: values.overTimeRate,
            totalWorkingHours: parseFloat(values.totalWorkingHours),
            hourlyRate: values.hourlyRate,
            overTimeAmount: values.overTimeAmount,
            notes: values.notes || undefined,
        });
    };

    return (
        <Modal
            open={open}
            title="Edit Overtime"
            okText="Save"
            cancelText="Cancel"
            onOk={() => formikRef.current?.submitForm()}
            onCancel={onClose}
            confirmLoading={isLoading}
            width={480}
            okButtonProps={{ danger: true }}
        >
            <div className="mt-4">
                <EditOvertimeForm
                    employeeId={initialValues?.employeeId ?? ''}
                    initialValues={formInitialValues}
                    formikRef={formikRef}
                    onSubmit={handleFormSubmit}
                />
            </div>
        </Modal>
    );
};

export default EditOvertimeModal;
