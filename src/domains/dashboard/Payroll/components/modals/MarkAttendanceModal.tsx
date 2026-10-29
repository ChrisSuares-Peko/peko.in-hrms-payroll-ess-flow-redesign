import { Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import MarkAttendanceForm from './MarkAttendanceForm';
import { markAttendance } from '../../api/dashBoardIndex';
import { addLeave } from '../../api/leaveApis';
import { useAvailableLeavePoliciesApi } from '../../hooks/leavesAndAttendanceHooks/useAvailableLeavePoliciesApi';
import { markAttendanceCreateSchema } from '../../schema/attendanceSchema';

type MarkAttendanceModalProps = {
    open: boolean;
    onCancel: () => void;
    onSuccess?: () => void;
};

const MarkAttendanceModal = ({ open, onCancel, onSuccess }: MarkAttendanceModalProps) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { leaves, getLeave } = useAvailableLeavePoliciesApi();

    return (
        <Formik
            initialValues={{
                employee: '',
                date: '',
                checkIn: '',
                checkOut: '',
                status: 'present',
                notes: '',
                typeOfLeave: '',
            }}
            validationSchema={markAttendanceCreateSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
                // Send the day + HH:mm times as UTC timestamps.
                const dateUtc = values.date
                    ? dayjs(values.date).startOf('day').toISOString()
                    : values.date;
                // Combine the selected day with an HH:mm time into a UTC timestamp.
                const toUtcTime = (time: string) => {
                    if (!values.date || !time) return time;
                    const [h, m] = time.split(':').map(Number);
                    return dayjs(values.date).startOf('day').hour(h).minute(m).toISOString();
                };

                if (values.status === 'on-leave') {
                    const leaveResult = await addLeave({
                        employeeId: values.employee,
                        userId: id,
                        userType: role,
                        start: dateUtc,
                        end: dateUtc,
                        leaveCount: '1',
                        typeOfLeave: values.typeOfLeave,
                        leaveSupportingDocs: null,
                        supportingDocFormat: '',
                    });
                    if (!leaveResult) {
                        setSubmitting(false);
                        return;
                    }
                }

                const result = await markAttendance({
                    userType: role,
                    userId: id,
                    employee: values.employee,
                    date: dateUtc,
                    checkIn: toUtcTime(values.checkIn),
                    checkOut: toUtcTime(values.checkOut),
                    status: values.status,
                    notes: values.notes || undefined,
                });
                setSubmitting(false);
                if (result.success) {
                    dispatch(
                        showToast({
                            description: 'Attendance marked successfully',
                            variant: 'success',
                        })
                    );
                    resetForm();
                    onSuccess?.();
                    onCancel();
                } else {
                    dispatch(
                        showToast({
                            description: result.errorMessage ?? 'Failed to mark attendance',
                            variant: 'error',
                        })
                    );
                }
            }}
            enableReinitialize
        >
            {({ handleSubmit, resetForm, isSubmitting }) => (
                <Modal
                    title={
                        <div>
                            <Typography.Text className="text-lg font-semibold block">
                                Mark Attendance
                            </Typography.Text>
                            <Typography.Text className="text-sm text-gray-400 font-normal">
                                Record check-in / check-out for employees
                            </Typography.Text>
                        </div>
                    }
                    open={open}
                    onCancel={() => {
                        resetForm();
                        onCancel();
                    }}
                    onOk={() => handleSubmit()}
                    okText="Save"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: isSubmitting }}
                    width={520}
                    destroyOnClose
                    styles={{ body: { paddingBlock: 12 } }}
                >
                    <MarkAttendanceForm showLeaveType leaves={leaves} getLeave={getLeave} />
                </Modal>
            )}
        </Formik>
    );
};

export default MarkAttendanceModal;
