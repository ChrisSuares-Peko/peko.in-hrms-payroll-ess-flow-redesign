import { useState } from 'react';

import { Button, Row, Tabs, TabsProps, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import AddHolidaysModal from '../components/modals/AddHolidaysModal';
import MarkAttendanceModal from '../components/modals/MarkAttendanceModal';
import DailyLogTab from '../components/timesheet/DailyLogTab';
import DisputeTab from '../components/timesheet/DisputeTab';
import HolidaysTab from '../components/timesheet/HolidaysTab';
import MonthlySummaryTab from '../components/timesheet/MonthlySummaryTab';
import OvertimeTab from '../components/timesheet/OvertimeTab';
import ShiftScheduleTab from '../components/timesheet/ShiftScheduleTab';

const tabItems: TabsProps['items'] = [
    { key: '1', label: 'Daily Log' },
    { key: '2', label: 'Monthly Summary' },
    { key: '3', label: 'Overtime' },
    { key: '4', label: 'Holidays' },
    { key: '5', label: 'Shift Schedule' },
    { key: '6', label: 'Dispute' },
];

const Timesheet = () => {
    const [activeTab, setActiveTab] = useState('1');
    const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
    const [addHolidayOpen, setAddHolidayOpen] = useState(false);
    const [dailyRefetchTrigger, setDailyRefetchTrigger] = useState(0);
    const { xs, md } = useScreenSize();

    const getButtonSize = (): 'small' | 'large' | 'middle' => {
        if (xs) return 'small';
        if (md) return 'large';
        return 'middle';
    };
    const btnSize = getButtonSize();

    return (
        <>
            <Row justify="space-between" align="middle" className="mb-4">
                <Typography.Text className="text-xl font-medium">Attendance</Typography.Text>
                {(activeTab === '1' || activeTab === '2') && (
                    <Button danger size={btnSize} onClick={() => setMarkAttendanceOpen(true)}>
                        Mark Attendance
                    </Button>
                )}
                {activeTab === '4' && (
                    <Button danger size={btnSize} onClick={() => setAddHolidayOpen(true)}>
                        Add Holiday
                    </Button>
                )}
            </Row>

            <MarkAttendanceModal
                open={markAttendanceOpen}
                onCancel={() => setMarkAttendanceOpen(false)}
                onSuccess={() => setDailyRefetchTrigger(t => t + 1)}
            />

            <AddHolidaysModal
                open={addHolidayOpen}
                holidayType="ADD"
                holiDayData={null}
                handleCancel={() => setAddHolidayOpen(false)}
                setRefresh={() => setDailyRefetchTrigger(t => t + 1)}
                setHolidayData={() => {}}
            />

            <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} />

            {activeTab === '1' && <DailyLogTab refetchTrigger={dailyRefetchTrigger} />}
            {activeTab === '2' && <MonthlySummaryTab />}
            {activeTab === '3' && <OvertimeTab />}
            {activeTab === '4' && <HolidaysTab refetchTrigger={dailyRefetchTrigger} />}
            {activeTab === '5' && <ShiftScheduleTab />}
            {activeTab === '6' && <DisputeTab />}
        </>
    );
};

export default Timesheet;
