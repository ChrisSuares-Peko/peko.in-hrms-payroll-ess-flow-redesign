import { memo, useMemo } from 'react';

import { Col, Row, Skeleton } from 'antd';

import SchedulerCard from './SchedulerCard';
import { useGetShedulerData } from '../hooks/useGetShedulerData';
import { schedulerTitles } from '../utils/data';

const ReportTab = () => {
    const { isLoading, scheduler, handleUpdateBtn } = useGetShedulerData();

    const skeletonItems = useMemo(
        () =>
            schedulerTitles.map((item, i) => (
                <Col xs={24} md={12} xl={12} xxl={8} key={i}>
                    <Skeleton active />
                </Col>
            )),
        []
    );

    const schedulerCards = useMemo(
        () =>
            scheduler
                ? Object.values(scheduler).map((item, i) => (
                      <Col xs={24} md={12} xl={12} xxl={8} key={i}>
                          <SchedulerCard
                              email={item.email}
                              title={item.title}
                              isActive={item.isActive}
                              scheduledTime={item.scheduledTime}
                              scheduledDay={item.title === 'Weekly Scheduler' && item.scheduledDay}
                              handleUpdateBtn={handleUpdateBtn}
                              key={i}
                          />
                      </Col>
                  ))
                : null,
        [scheduler, handleUpdateBtn]
    );

    const content = useMemo(
        () => (isLoading ? skeletonItems : schedulerCards),
        [isLoading, skeletonItems, schedulerCards]
    );

    return (
        <Row gutter={isLoading ? [60, 100] : [20, 30]} className="my-6">
            {content}
        </Row>
    );
};

export default memo(ReportTab);
