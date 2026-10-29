import React, { useEffect, useState } from 'react';

import { Flex, Grid, Tabs, TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import AssetsTab from '../components/employeeDetails/AssetsTab';
import DocumentsTab from '../components/employeeDetails/DocumentsTab';
import EmployeeDetailsHeader from '../components/employeeDetails/EmployeeDetailsHeader';
import LeavePolicyTable from '../components/employeeDetails/LeavePolicyTable';
import PayoutDetails from '../components/employeeDetails/PayoutDetails';
import StatutoryTab from '../components/employeeDetails/StatutoryTab';
import AttendanceTab from '../components/employeeDetails/tabs/AttendanceTab';
import BankTab from '../components/employeeDetails/tabs/BankTab';
import InformationTab from '../components/employeeDetails/tabs/BasicInformationTab';
import Reimbursement from '../components/employeeDetails/tabs/Reimbursement';
import SalaryStructureTab from '../components/employeeDetails/tabs/SalaryStructureTab';
import GetEmployeeDetails from '../hooks/employeeHooks/useGetEmployee';


type Props = {};

const EmployeeDetails = (props: Props) => {
    const screens = Grid.useBreakpoint();
    const location = useLocation();
    const { employeeId } = location.state;
    const [refState, setRefState] = useState(0);
    const [activeTabKey, setActiveTabKey] = useState('1');
   
    const { data, getEmployeeDetails, isLoading } = GetEmployeeDetails(employeeId ?? '');
   
   

    useEffect(() => {
        getEmployeeDetails();
    }, [getEmployeeDetails, refState]);

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Basic Information',
            children: (
                <InformationTab
                    employeeData={data && data}
                    setRefState={setRefState}
                    isLoading={isLoading}
                />
            ),
        },
        {
            key: '2',
            destroyInactiveTabPane: true,
            label: 'Salary Structure (CTC)',
            children: <SalaryStructureTab employeeData={data && data} />,
        },
        {
            key: '8',
            label: 'Statutory Components',
            children: (
                <StatutoryTab
                    employeeData={data && data}
                    onNavigateToBasicInfo={() => setActiveTabKey('1')}
                />
            ),
            disabled: false,
        },
        {
            key: '4',
            label: 'Leave Policies',
            children: <LeavePolicyTable employeeId={employeeId} />,
            disabled: false,
        },
        {
            key: '5',
            label: 'Extra benefits',
            children: <PayoutDetails />,
            disabled: false,
        },
        {
            key: '6',
            label: 'Reimbursement',
            children: <Reimbursement />,
            disabled: false,
        },
        {
            key: '9',
            label: 'Bank Details',
            children: <BankTab employeeData={data && data} />,
            disabled: false,
        },
        {
            key: '10',
            label: 'Documents',

            children: (
                <DocumentsTab
                    employeeData={data && data}
                    isLoading={isLoading}
                />
            ),
            disabled: false ,
        },
        {
            key: '11',
            label: 'Assets',
            children: (
                <AssetsTab
                    employeeData={data && data}
                    isLoading={isLoading}

                />
            ),
            disabled: false,
        },
        {
            key: '12',
            label: 'Attendance',
            children: (
                <AttendanceTab
                    employeeId={employeeId ?? ''}
                    dateOfJoin={
                        data && typeof data !== 'boolean'
                            ? data.employeeInformation?.dateOfJoin
                            : undefined
                    }
                />
            ),
            disabled: false,
        },
    //  (data?.offBoardingInformation && {
    //         key: '12',
    //         label: 'Offboarding',
    //         children: (
    //             <OffboardTab
    //                 employeeData={data && data}
    //                 isLoading={isLoading}
    //                 setRefresh={()=>getEmployeeDetails()}
    //                 setCurrentPage={setCurrentPage}
    //             />
    //         ),
    //         disabled: false,
    //     }),
    ];
    return (
        <Flex vertical>
            <EmployeeDetailsHeader data={data && data} setRefState={setRefState} />
            <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                className="w-full mt-2 -ml-8"
                items={items}
                style={{ paddingLeft: screens.xxl ? '10px' : '5px' }}
            />
        </Flex>
    );
};

export default EmployeeDetails;
