import React, { useState } from 'react';

import { Col, Row, Tabs, TabsProps } from 'antd';
import { Content } from 'antd/es/layout/layout';

import LeaveModal from '../components/Leaves/LeaveModal';
import LeavesAttendanceHeader from '../components/Leaves/LeavesAttendanceHeader';
import LeavesTable from '../components/Leaves/LeavesTable';
import LeaveRequestsTab from '../components/timesheet/LeaveRequestsTab';

const EmployeeLeave = () => {
    const [openLeaveApplicationModal, setOpenLeaveApplicationModal] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState('1');
    const [reloadTable, setReloadTable] = useState(false);

    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);

    const handleChangeMonth = (value: any) => {
        setMonth(value);
        setReloadTable(prev => !prev);
    };

    const handleChangeYear = (value: any) => {
        setYear(value);
        setReloadTable(prev => !prev);
    };
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Leaves',
            children: (
                <LeavesTable
                    reloadTable={reloadTable}
                    setReloadTable={setReloadTable}
                    month={month}
                    year={year}
                    handleChangeMonths={handleChangeMonth}
                    handleChangeYears={handleChangeYear}
                />
            ),
        },
        {
            key: '2',
            label: 'Leave Requests',
            children: <LeaveRequestsTab />,
        },
    ];
    return (
        <Content>
            <Row className="mt-3">
                <Col span={24}>
                    <LeavesAttendanceHeader
                        activeTab={activeTabKey}
                        onAddLeave={() => setOpenLeaveApplicationModal(true)}
                    />
                </Col>
            </Row>
            <Row>
                <Col xs={24} className="mt-5">
                    {/* <Tabs defaultActiveKey="1" items={items} /> */}
                    <Tabs
                        activeKey={activeTabKey}
                        onChange={key => setActiveTabKey(key)}
                        items={items}
                    />
                </Col>
            </Row>
            {openLeaveApplicationModal && (
                <LeaveModal
                    month={month}
                    year={year}
                    open={openLeaveApplicationModal}
                    handleCancel={() => setOpenLeaveApplicationModal(false)}
                    reloadTable={setReloadTable}
                />
            )}
        </Content>
    );
};

export default EmployeeLeave;
