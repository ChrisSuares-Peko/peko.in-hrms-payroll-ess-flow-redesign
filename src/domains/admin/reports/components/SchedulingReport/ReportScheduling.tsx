import React, { useEffect, useState } from 'react';

import { Col, Row, Skeleton } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import SchedulerCard from './SchedulerCard';
import { useGetShedulerData } from '../../hooks/useGetSchedulerData';
import { RolePermissionAccessData } from '../../types/reportsScheduling';
import { schedulerTitles } from '../../utils/data';


const ReportTab = () => {
    const { isLoading, scheduler, handleUpdateBtn } = useGetShedulerData();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Scheduling Reports'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    return (
        <Row gutter={isLoading ? [60, 100] : [20, 30]} className="my-6">
            {isLoading
                ? schedulerTitles.map((item, i) => (
                      <Col xs={24} md={12} xl={12} xxl={8} key={i}>
                          <Skeleton active />
                      </Col>
                  ))
                : scheduler &&
                  Object.values(scheduler).map((item, i) => (
                      <Col xs={24} md={12} xl={12} xxl={8} key={i}>
                          <SchedulerCard
                              email={item.email}
                              title={item.title}
                              isActive={item.isActive}
                              scheduledTime={item.scheduledTime}
                              scheduledDay={item.title === 'Weekly Scheduler' && item.scheduledDay}
                              handleUpdateBtn={handleUpdateBtn}
                              key={i}
                              accessPermission={accessPermission}
                          />
                      </Col>
                  ))}
        </Row>
    );
};

export default ReportTab;
