import { useState } from 'react';

import { Col, Form, Input, Row, Select, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import GetEmployeeDetails from '../../hooks/employeeHooks/useReportingStaffApi';
import { leaves as LeaveOption } from '../../types/leaveSection';
import { stripEmoji } from '../../utils/timesheet/tabHelpers';

const STATUS_OPTIONS = [
    { label: 'Present', value: 'present' },
    { label: 'Late', value: 'late' },
    { label: 'Absent', value: 'absent' },
    { label: 'On Leave', value: 'on-leave' },
];

const TimePickerField = ({
    name,
    label,
    required: isRequired,
}: {
    name: string;
    label: string;
    required?: boolean;
}) => {
    const { setFieldValue, values, touched, errors } = useFormikContext<any>();
    const isActive = values.status === 'present' || values.status === 'late';
    const value = values[name] ? dayjs(values[name], 'HH:mm') : undefined;
    const isTouched = (touched as any)[name];
    const error = (errors as any)[name];

    return (
        <Form.Item
            label={label}
            required={isRequired}
            validateStatus={isTouched && error ? 'error' : ''}
            help={isTouched && error ? error : undefined}
        >
            <TimePicker
                value={value}
                format="hh:mm A"
                use12Hours
                className="w-full"
                placeholder="Select time"
                onChange={time => setFieldValue(name, time ? time.format('HH:mm') : '')}
                allowClear
                disabled={!isActive}
            />
        </Form.Item>
    );
};

const EmployeeSelectField = ({ getLeave }: { getLeave: (empId: string) => void }) => {
    const { setFieldValue, values, touched, errors } = useFormikContext<any>();
    const [search, setSearch] = useState('');
    const { data: employees, isLoading } = GetEmployeeDetails(search);

    const isTouched = (touched as any).employee;
    const error = (errors as any).employee;

    return (
        <Form.Item
            label="Employee"
            required
            validateStatus={isTouched && error ? 'error' : ''}
            help={isTouched && error ? error : undefined}
        >
            <Select
                showSearch
                filterOption={false}
                placeholder="Search employee..."
                loading={isLoading}
                options={employees.filter(e => e.value !== 'N/A')}
                value={values.employee || undefined}
                onSearch={v => setSearch(stripEmoji(v))}
                onChange={v => {
                    setFieldValue('employee', v);
                    getLeave(v);
                }}
                className="w-full"
            />
        </Form.Item>
    );
};

const StatusSelectField = () => {
    const { setFieldValue, values, touched, errors } = useFormikContext<any>();
    const isTouched = (touched as any).status;
    const error = (errors as any).status;

    return (
        <Form.Item
            label="Status"
            required
            validateStatus={isTouched && error ? 'error' : ''}
            help={isTouched && error ? error : undefined}
        >
            <Select
                options={STATUS_OPTIONS}
                value={values.status || undefined}
                placeholder="Select status"
                onChange={v => setFieldValue('status', v)}
                className="w-full"
            />
        </Form.Item>
    );
};

const LeaveTypeSelectField = ({ leaves }: { leaves: LeaveOption[] }) => {
    const { setFieldValue, values, touched, errors } = useFormikContext<any>();
    if (values.status !== 'on-leave') return null;

    const isTouched = (touched as any).typeOfLeave;
    const error = (errors as any).typeOfLeave;

    return (
        <Form.Item
            label="Leave Type"
            required
            validateStatus={isTouched && error ? 'error' : ''}
            help={isTouched && error ? error : undefined}
        >
            <Select
                options={leaves}
                value={values.typeOfLeave || undefined}
                placeholder="Select leave type"
                onChange={v => setFieldValue('typeOfLeave', v)}
                className="w-full"
            />
        </Form.Item>
    );
};

const DateField = () => {
    const { values } = useFormikContext<any>();
    return (
        <Form.Item label="Date" required>
            <Input
                value={values.date ? dayjs(values.date).format('DD MMM YYYY') : ''}
                disabled
                className="w-full"
            />
        </Form.Item>
    );
};

interface MarkAttendanceFormProps {
    disableEmployee?: boolean;
    employeeName?: string;
    disableDate?: boolean;
    hideNotes?: boolean;
    showLeaveType?: boolean;
    leaves?: LeaveOption[];
    getLeave?: (empId: string) => void;
}

const MarkAttendanceForm = ({
    disableEmployee,
    employeeName,
    disableDate,
    hideNotes,
    showLeaveType,
    leaves = [],
    getLeave = () => {},
}: MarkAttendanceFormProps = {}) => (
    <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
        <Row gutter={16}>
            <Col span={12}>
                {disableDate ? (
                    <DateField />
                ) : (
                    <DatePickerInput
                        name="date"
                        label="Date"
                        placeholder="Select date"
                        classes="w-full"
                        needConfirm={false}
                        maxDate={dayjs()}
                        isRequired
                    />
                )}
            </Col>
            <Col span={12}>
                {disableEmployee ? (
                    <Form.Item label="Employee" required>
                        <Input value={employeeName} disabled className="w-full" />
                    </Form.Item>
                ) : (
                    <EmployeeSelectField getLeave={getLeave} />
                )}
            </Col>
        </Row>

        <StatusSelectField />

        {showLeaveType && <LeaveTypeSelectField leaves={leaves} />}

        <Row gutter={16}>
            <Col span={12}>
                <TimePickerField name="checkIn" label="Check-In Time" required />
            </Col>
            <Col span={12}>
                <TimePickerField name="checkOut" label="Check-Out Time" />
            </Col>
        </Row>

        {!hideNotes && (
            <TextAreaInput
                name="notes"
                label="Notes"
                placeholder="Add any notes about this attendance record..."
                minRows={2}
                maxLength={300}
                showCount
            />
        )}
    </Form>
);

export default MarkAttendanceForm;
