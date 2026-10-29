import React, { useEffect, useState } from 'react';

import { Row, Col, TabsProps, Tabs } from 'antd';
import { useParams } from 'react-router-dom';

import useDebounce from '@src/hooks/useDebounce';

import LeaveSummaryHeader from '../components/LeaveSummary/LeaveSummaryHeader';
import LeaveSummaryTable from '../components/LeaveSummary/LeaveSummaryTable';
// import GetEmployeeDetails from '../hooks/employeeHooks/useGetEmployee';
import { useLeaveProfileDetailsApi } from '../hooks/leavesAndAttendanceHooks/useLeaveProfileDetailsApi';
import { filterState } from '../types/types';
import useFilter from '../utils/general/useFilter';

const LeaveSummary: React.FC = () => {
    const { id: employeeId } = useParams<{ id: string }>();
    const [reloadTable, setReloadTable] = useState(false);
    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();
    const initialValues = {
        searchText: '',
        sort: 'ASC',
        page: 1,
        limit: 10,
        filter: '',
        year: initialYear,
        month: initialMonth,
    };
    const [filter, setFilter] = useState<filterState>(initialValues);
    const { handleSearch,  } = useFilter({
        setFilter,
    });
    const debouncedSearch = useDebounce(filter.searchText, 500);

    const { leaveData, employeeDetails, getLeave,isLoading } = useLeaveProfileDetailsApi(
        filter.page,
        filter.limit,

        debouncedSearch,
        reloadTable
    );

    useEffect(() => {
        if (employeeId) {
            getLeave(employeeId);
        }
    }, [employeeId, getLeave,reloadTable]);

   
    const [activeTabKey, setActiveTabKey] = useState<string>('1');
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Leave Summary',
            children: (
                <LeaveSummaryTable
                    key="Leave Summary"
                    data={leaveData}
                    handleSearch={handleSearch}
                    eId={employeeId}
                    setReloadTable={setReloadTable}
                    isloading={isLoading}
                    searchText={filter.searchText}
                />
            ),
        },
    ];
    const handleTabChange = (key: string) => {
        setActiveTabKey(key);
    };
    return (
        <Row>
            <Col md={24}>
                <LeaveSummaryHeader
                    profileImage={employeeDetails?.profileImage}
                    fullName={employeeDetails?.fullName}
                    designation={employeeDetails?.designation}
                />
            </Col>
            <Col md={24} xs={24} sm={24}>
                <Tabs
                    activeKey={activeTabKey}
                    defaultActiveKey="1"
                    items={items}
                    onChange={handleTabChange}
                />
            </Col>
        </Row>
    );
};

export default LeaveSummary;
