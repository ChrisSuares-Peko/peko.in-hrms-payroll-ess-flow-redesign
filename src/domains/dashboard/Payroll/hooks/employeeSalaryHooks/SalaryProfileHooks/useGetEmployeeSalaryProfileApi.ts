import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeSalaryProfile } from '../../../api/employeeSalaryApi/SalaryProfileApi/index';
import {
    salaryTableData,
    SalaryProfileResponse,
} from '../../../types/salaryProfileTypes/ProfileTypes/index';

export default function GetEmployeeSalaryProfileDetails(employeeId: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [profileDetails, setProfileDetails] = useState<salaryTableData>();
    const [isLoading, setIsLoading] = useState(false);

    const getSalaryProfiledetails = useCallback(async () => {
        setIsLoading(true);
        const data: SalaryProfileResponse | false = await employeeSalaryProfile({
            userId: id,
            userType: role,
            employeeId,
        });
        if (data) {
            const profileDetailData = data as SalaryProfileResponse;

            const arr = {
                employeeId: profileDetailData?.employee._id ?? '',
                fullName: profileDetailData?.employee?.fullName ?? '',
                department:
                    profileDetailData.employee?.employeeInformation?.department?.departmentName ??
                    '',
                designation: profileDetailData?.employee?.employeeInformation?.designation ?? '',
                profileImage: profileDetailData?.employee?.profileImage ?? '',
                basicSalary: profileDetailData?.salaryInfo?.salaryInformation?.basicPay ?? 0,
                homeAllowance:
                    profileDetailData?.salaryInfo?.salaryInformation?.homeAllowances ?? 0,
                travelAllowance:
                    profileDetailData?.salaryInfo?.salaryInformation?.travelAllowances ?? 0,
                otherAllowance:
                    profileDetailData?.salaryInfo?.salaryInformation?.otherAllowances ?? 0,
                medicalAllowance:
                    profileDetailData?.salaryInfo?.salaryInformation?.medicalAllowances ?? 0,
                other: profileDetailData?.salaryInfo?.salaryInformation?.other ?? 0,

                startTime: profileDetailData?.employee?.workSchedule?.startTime ?? '',
                endTime: profileDetailData?.employee?.workSchedule?.endTime ?? '',
                dateOfJoin: profileDetailData?.employee?.employeeInformation?.dateOfJoin ?? '',
                attendance: profileDetailData?.salaryInfo?.attendancePercentage ?? '',
                totalAllowance: profileDetailData?.salaryInfo?.totalAllowance ?? 0,
                totalPay: profileDetailData.salaryInfo.totalPayable ?? 0,
                year: profileDetailData.salaryInfo.year ?? '',
                month: profileDetailData.salaryInfo.month ?? '',
                salaryStatus: profileDetailData.salaryInfo.paymentStatus ?? '',
                emailId: profileDetailData.employee.personalEmail ?? '',
                totalIncentive: profileDetailData.salaryInfo.totalIncentive ?? 0,
                totalBonus: profileDetailData.salaryInfo.totalBonus ?? 0,
                totalOvertime: profileDetailData.salaryInfo.totalOvertime ?? 0,
                totalPayable: profileDetailData.salaryInfo.totalPayable ?? 0,
                totalOtherDeduction: profileDetailData.salaryInfo.totalOtherDeduction ?? 0,
                schedule: profileDetailData?.employee?.employeeInformation?.schedule ?? '',
                isEmployeeDeleted: profileDetailData?.employee?.isEmployeeDeleted ?? '',
            };
            setProfileDetails(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, employeeId]);

    useEffect(() => {
        getSalaryProfiledetails();
    }, [getSalaryProfiledetails]);

    return { profileData: profileDetails, loader: isLoading };
}
