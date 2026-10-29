import { Modal, Typography } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import MarkAttendanceForm from './MarkAttendanceForm';
import { updateAttendance } from '../../api/dashBoardIndex';
import { markAttendanceSchema } from '../../schema/attendanceSchema';

export type EditAttendanceInitialValues = {
    attendanceId: string;
    employeeId: string;
    employeeName: string;
    date: string;
    status: string;
    checkIn: string;
    checkOut: string;
    lateMinutes?: number;
    notes: string;
};

type Props = {
    open: boolean;
    initialValues: EditAttendanceInitialValues | null;
    onCancel: () => void;
    onSuccess?: () => void;
};

const EditAttendanceModal = ({ open, initialValues, onCancel, onSuccess }: Props) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const formInitialValues = {
        employee: initialValues?.employeeId ?? '',
        date: initialValues?.date ?? '',
        checkIn: initialValues?.checkIn ?? '',
        checkOut: initialValues?.checkOut ?? '',
        status: initialValues?.status ?? 'present',
        notes: initialValues?.notes ?? '',
    };

    return (
        <Formik
            initialValues={formInitialValues}
            validationSchema={markAttendanceSchema}
            enableReinitialize
            onSubmit={async (values, { setSubmitting }) => {
                if (!initialValues?.attendanceId) return;
                const result = await updateAttendance({
                    userType: role,
                    userId: id,
                    attendanceId: initialValues.attendanceId,
                    status: values.status,
                    checkIn: values.checkIn || undefined,
                    checkOut: values.checkOut || undefined,
                    lateMinutes: initialValues.lateMinutes,
                    notes: values.notes || undefined,
                });
                setSubmitting(false);
                if (result.success) {
                    dispatch(showToast({ description: 'Attendance updated successfully', variant: 'success' }));
                    onSuccess?.();
                    onCancel();
                } else {
                    dispatch(showToast({ description: result.errorMessage ?? 'Failed to update attendance', variant: 'error' }));
                }
            }}
        >
            {({ handleSubmit, resetForm, isSubmitting }) => (
                <Modal
                    title={
                        <div>
                            <Typography.Text className="text-lg font-semibold block">
                                Edit Attendance
                            </Typography.Text>
                            <Typography.Text className="text-sm text-gray-400 font-normal">
                                Update check-in / check-out details
                            </Typography.Text>
                        </div>
                    }
                    open={open}
                    onCancel={() => { resetForm(); onCancel(); }}
                    onOk={() => handleSubmit()}
                    okText="Save"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: isSubmitting }}
                    width={520}
                    destroyOnClose
                    styles={{ body: { paddingBlock: 12 } }}
                >
                    <MarkAttendanceForm
                        disableEmployee
                        disableDate
                        hideNotes
                        employeeName={initialValues?.employeeName}
                    />
                </Modal>
            )}
        </Formik>
    );
};

export default EditAttendanceModal;
