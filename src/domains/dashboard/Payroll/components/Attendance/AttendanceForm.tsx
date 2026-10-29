import React, { useEffect } from 'react';

import { Form } from 'antd';
// import { useFormikContext } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
// import { useAppSelector } from '@src/hooks/store';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import { useAvailableLeaves } from '../../hooks/leaveHooks/useAvailableLeaveApi';
import { AttendanceRow } from '../../types/attendance/attendanceTypes';
// import { LeaveRequestFormType } from '../../types/leaveSection';

interface AttendanceFormProps {
    selectedRecordData?: AttendanceRow | null;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const LeaveForm = ({
    selectedRecordData,
    employeeIdFromProfile,
    month,
    year,
}: AttendanceFormProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee(month, year);
    // const [isEmployeeSelected, setIsEmployeeSelected] = useState<boolean>(false);

    const { getLeave } = useAvailableLeaves();
    // const { values, setFieldValue } = useFormikContext<LeaveRequestFormType>();
    // const { dateOfJoin } = useAppSelector(state => state.reducer.payrollSalary);
    // const [dateOfJoined, setDateOfJoin] = useState<string | undefined>();

    useEffect(() => {
        if (selectedRecordData) {
            getLeave(selectedRecordData.employeeId);
        }
        if (employeeIdFromProfile) {
            getLeave(employeeIdFromProfile);
        }
    }, [getLeave, selectedRecordData, employeeIdFromProfile]);
    return (
        <Form layout="vertical">
            <SelectInputWithSearch
                name="employeeId"
                options={generateEmployeesDropdown(data) || []}
                placeholder="Select employee"
                label="Employee name"
                isRequired
                disableDeselect
                handleChange={e => {
                    getLeave(e);
                    // setIsEmployeeSelected(true);
                    // const employeeData = generateEmployeesDropdown(data).find(
                    //     emp => emp.value === e
                    // );
                    // setDateOfJoin(employeeData?.dateOfJoin);
                }}
            />

            <TextInput
                name="leaveCount"
                label="Total Work Days"
                type="text"
                placeholder="Enter total work days"
                maxLength={3}
                allowNumbersOnly
                isRequired
            />
            <TextInput
                name="leaveCount"
                label="Loss Of Pay"
                type="text"
                placeholder="Enter loss of pay"
                maxLength={3}
                allowNumbersOnly
                isRequired
            />
            <TextInput
                name="leaveCount"
                label="Total Pay Days"
                type="text"
                placeholder="Enter total pay days"
                maxLength={3}
                allowNumbersOnly
                isRequired
            />
        </Form>
    );
};

export default LeaveForm;
