import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeList } from '../../api/employeeApi';
import type { EmploymentStage, EmploymentStageCounts, EmploymentStageFilter } from '../../types/types';

interface UseEmployeeListApiProps {
    initialPage?: number;
    initialLimit?: number;
    employeeStatus: 'active' | 'past';
    offboardReload?: boolean;
    ''?: string;
    initialSortOrder?: string;
    sortField: string;
    sortOrder: string;
    debouncedSearch: string;
    /** Active Employees filter chip; undefined = All. */
    stage?: EmploymentStageFilter;
}
export interface Employee {
    profileImage: string;
    personalInformation: {
        corporateUser: string;
        fullName: string;

        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        email: string;
        personalAddress: string;
        nationality: string;
        isGccNationality: string | boolean;
        emergencyContactName: string;
        emergencyContactRelation: string;
        emergencyContactNo: string;
        qualification?: string;
        experienceInYear?: string;
        experienceInMonth?: string;
        maritialStatus?: string;
    };

    employeeInformation: {
        probation: string;
        designation: any;
        dateOfJoin: string;
        employeeId: string;
        workingHours: number;
        department: { departmentName: string; id: string };
        workingDays: number;
        employeeStatus: string;
        reportingStaff: string;
        schedule?: string;
        jobType: string;
        employeeType?: string;
    };
    salaryInformation: {
        basicPay: number;
        travelAllowances: number | null;
        homeAllowances: number | null;
        medicalAllowances: number | null;
        otherAllowances: number | null;
        other: number | null;
    };
    employeeDocuments: {
        name: string;
        url: string;
        expiryDate: string;
    }[];
    bankDetails: {
        beneficiaryName: string;
        accountNumber: string;
        swiftCode?: string; // Optional if needed
        bankName: string;
        ibanNumber: string;
        bankBranch?: string; // Optional if needed
        accountType?: string | null; // Optional if needed
    };
    isCompleted: boolean;

    createdAt: string;
    updatedAt: string;
    workSchedule: {
        days: {
            monday: boolean;
            tuesday: boolean;
            wednesday: boolean;
            thursday: boolean;
            friday: boolean;
            saturday: boolean;
            sunday: boolean;
        };
        startTime: string;
        endTime: string;
        breakTimeHrs: number;
        overTime?: string; // Optional if needed
    };
    offBoardingInformation?: {
        lastWorkingDay: string;
        resignationLetter: string;
        noticePeriod: number;
        offBoardingType: string;
        reasonForOffBoarding: string;
    };
    /** Set by the API: NOTICE_PERIOD through the last working day, PAST after it. */
    offBoardingStage?: 'NOTICE_PERIOD' | 'PAST' | null;
    employmentStage?: EmploymentStage;
    emergencyNo: string;
    id: string;
}

export function useEmployeeListApi({
    initialPage = 1,
    initialLimit = 10,
    employeeStatus = 'active',
    offboardReload,
    sortField,
    sortOrder,
    debouncedSearch,
    stage,
}: UseEmployeeListApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [tableData, setTableData] = useState<Employee[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [count, setCount] = useState(0);
    const [stageCounts, setStageCounts] = useState<EmploymentStageCounts | undefined>();

    const GetEmployeesList = useCallback(async () => {
        setIsLoading(true);
        const data = await getEmployeeList({
            userId: id,
            userType: role,

            page: currentPage,
            limit,
            searchText: debouncedSearch,
            status: employeeStatus,
            sortField,
            sortOrder,
            stage,
        });

        if (data) {
            const employeeData = data;
            setTableData(employeeData.rows);
            setCount(employeeData.count);
            setStageCounts(employeeData.stageCounts);
            setIsLoading(false);
        } else {


            setIsLoading(false);
        }
    }, [id, role, currentPage, limit, debouncedSearch, employeeStatus, sortField, sortOrder, stage]);

    useEffect(() => {
        GetEmployeesList();
    }, [GetEmployeesList, offboardReload, sortField, sortOrder]);

    const refetch = () => {
        GetEmployeesList();
    };

    return {
        data: tableData,
        isLoading,
        currentPage,
        setCurrentPage,
        limit,
        setLimit,
        count,
        stageCounts,
        refetch,
    };
}
