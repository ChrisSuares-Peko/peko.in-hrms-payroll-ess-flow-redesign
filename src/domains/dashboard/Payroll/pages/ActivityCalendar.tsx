import React, { useEffect, useRef, useState } from 'react';

import Calendar from '@toast-ui/react-calendar'; // Import Calendar component
import { Button, Card, Col, Flex, Row, Select, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';


import UpcomingActivityCard from '@domains/dashboard/Payroll/components/ActivityCalender/UpcomingActivityCard';



import { ActivityCalendarModal } from '../components/modals/ActivityCalendarModal';
import AddHolidaysModal from '../components/modals/AddHolidaysModal';
import { useUpcomingActivityApi } from '../hooks/dashboardHooks/useUpcomingActivityApi';
import { monthsArray, years } from '../utils/salaryTable/data';

type Props = {};
const ActivityCalendar = (props: Props) => {
    const [openAddHolidaysModal, setOpenAddHolidaysModal] = useState(false);
    const [openCalendarModal, setOpenCalendarModal] = useState(false);
    const { calendarData, data, setRefresh, isLoading } = useUpcomingActivityApi();
    const [holidayData, setHolidayData] = useState<any>();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [holidayType, setHolidayType] = useState<string>('');
    const [showLottie, setShowLottie] = useState(false);
    const [modalTimeout, setModalTimeout] = useState<NodeJS.Timeout | null>(null);

    const initialYear = new Date().getFullYear();
    const initialMonth = new Date().getMonth() + 1;
    const onClickSchedule = (e: any) => {
        if (e.event.body === 'HOLIDAY') {
            setOpenAddHolidaysModal(true);
            setHolidayData(e.event);
        } else {
            setOpenCalendarModal(true);
            setHolidayData(e.event);
        }
        if (e.event.title.toLowerCase().includes('birthday')) {
            setShowLottie(true);

            const timeout = setTimeout(() => {
                setOpenCalendarModal(true);
                setHolidayData(e.event);
                setShowLottie(false);
            }, 3000);

            setModalTimeout(timeout);
        } else {
            setHolidayData(e.event);
        }
    };
    useEffect(() => {}, [showLottie]);

    // useEffect(
    //     () => () => {
    //         if (modalTimeout) {
    //             clearTimeout(modalTimeout);
    //         }
    //     },
    //     [modalTimeout]
    // );

    useEffect(
        () => () => {
            if (modalTimeout) {
                clearTimeout(modalTimeout);
            }
        },
        [modalTimeout]
    );

    useEffect(() => {
        if (!openCalendarModal && modalTimeout) {
            clearTimeout(modalTimeout);
            setShowLottie(false);
        }
    }, [openCalendarModal, modalTimeout]);

    const calendarRef = useRef<any>(null);
    useEffect(() => {
        if (calendarRef.current) {
            const calendarInstance = calendarRef.current.getInstance();
            calendarInstance.setDate(new Date(currentYear, currentMonth - 1));
        }
    }, [currentMonth, currentYear]);

 
   
    // const hasBirthdayToday = calendarData.some(event => {
    //     const eventDate = new Date(event.start).toISOString().split('T')[0];
    //     return eventDate === todayStr && event.category === 'Birthday';
    // });
  

    const handleData = () => {
        setOpenAddHolidaysModal(false);
        setHolidayType('');
        setHolidayData(null);
    };
    const handleAddHoliday = () => {
        setHolidayType('ADD');
        setOpenAddHolidaysModal(true);
    };
    function updateCategoryToAllDay(datas: any[]): any[] {
        return datas.map(details => {
            const { activityType, ...rest } = details;
            return {
                ...rest,
                category: 'allday',
                body: activityType,
            };
        });
    }
    const updatedDatas = updateCategoryToAllDay(calendarData);
    return (
        <Content>
            {/* { showLottie && (
                                <Flex
                                    justify="center"
                                    style={{ height: '600px', marginBottom: '' }}
                                >
                                    <Lottie options={defaultOptions} height={650} width={650} />
                                </Flex>
                            )} */}
            <Row gutter={[20, 20]}>
                <Col span={24}>
                    <Flex justify="end" gap={15}>
                        <Button type="default" danger onClick={handleAddHoliday}>
                            Add Holiday
                        </Button>

                        {/* {progress === '100%' && ( */}
                        {/* <Button
                            type="default"
                            danger
                            onClick={() =>
                                navigate(
                                    `/${paths.payroll.index}/${paths.payroll.activityCalendar}/${paths.payroll.announcements}`
                                )
                            }
                        >
                            Announcements
                        </Button> */} 
                        
                        {/* )} */}
                        
                    </Flex>
                </Col>
                <Col xs={24} md={16}>
                    {/* { showLottie && (
                                <Flex
                                    justify="center"
                                    style={{ height: '1000px', marginBottom: '' }}
                                >
                                    <Lottie options={defaultOptions} height={300} width={300} />
                                </Flex>
                            )} */}
                    <Card bordered>
                        <Flex justify="space-between" align="center">
                            <Typography.Text className="font-medium">
                                Holidays and Events
                            </Typography.Text>
                            <Flex justify="space-between" className="xs:mt-10 md:mt-0" gap={10}>
                                <Flex className="md:w-40">
                                    <Select
                                        options={monthsArray}
                                        className="w-full"
                                        onChange={value => setCurrentMonth(Number(value))}
                                        defaultValue={initialMonth.toString()}
                                    />
                                </Flex>
                                <Flex className="md:w-40">
                                    <Select
                                        options={years}
                                        className="w-full"
                                        onChange={value => setCurrentYear(value)}
                                        defaultValue={initialYear}
                                    />
                                </Flex>
                            </Flex>
                        </Flex>
                        {/* { showLottie && (
                                <Flex
                                    justify="center"
                                    style={{ height: '1000px', marginBottom: '' }}
                                >
                                    <Lottie options={defaultOptions} height={300} width={300} />
                                </Flex>
                            )} */}
                        <Flex className="mt-4">
                            {isLoading ? (
                                <div style={{ width: '100%', height: '600px' }}>
                                    <Skeleton active paragraph={{ rows: 10, width: '100%' }} />
                                </div>
                            ) : (
                                <Content className="calendar-container">
                                    <Calendar
                                        ref={calendarRef}
                                        height="600px"
                                        view="month"
                                        events={updatedDatas}
                                        onClickEvent={onClickSchedule}
                                        gridSelection={false}
                                        template={{
                                            popupDetailDate: schedule =>
                                                `<div class="toastui-calendar-popup-date">${schedule.title}</div>`,
                                        }}
                                    />
                                </Content>
                            )}
                        </Flex>
                    </Card>
                </Col>
                <UpcomingActivityCard setRefresh={setRefresh} data={data} isLoading={isLoading} />
            </Row>
            {openAddHolidaysModal && (
                <AddHolidaysModal
                    holidayType={holidayType}
                    open={openAddHolidaysModal}
                    handleCancel={handleData}
                    setRefresh={setRefresh}
                    holiDayData={holidayData}
                    setHolidayData={setHolidayData}
                />
            )}
            {/* { showLottie && (
                                <Flex
                                    justify="center"
                                    style={{ height: '1000px', marginBottom: '' }}
                                >
                                    <Lottie options={defaultOptions} height={900} width={900} />
                                </Flex>
                            )} */}

            <ActivityCalendarModal
                open={openCalendarModal}
                handleCancel={() => setOpenCalendarModal(false)}
                holiDayData={holidayData}
            />
        </Content>
    );
};
export default ActivityCalendar;
