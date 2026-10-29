import React from 'react';

import { Col, Flex, Row, Table } from 'antd';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import AlertsMobileView from './AlertsMobileView';
import { useGetDashToDoApi } from '../../hooks/dashboardHooks/useGetDashTaskDataApi';
import { alertsColumn } from '../../utils/alerts';

const AlertsTable = () => {
    const screen = useScreenSize();
    const { toDoData, isLoading } = useGetDashToDoApi();
    const navigate = useNavigate();
    return (
        <>
            {screen.xs ? (
                <AlertsMobileView isLoading={isLoading} tableDatas={toDoData} />
            ) : (
                <Row className="">
                    <Col span={24} className="">
                        <Flex vertical className="">
                            <Table
                                className="mt-7"
                                scroll={{ x: 568 }}
                                dataSource={toDoData.map(item => ({
                                    ...item,
                                    key: `${item.title}-${item.subTitle}`,
                                }))}
                                columns={alertsColumn((path: string, option: any) =>
                                    navigate(path, option)
                                )}
                                size="small"
                                pagination={false}
                                loading={isLoading}
                            />
                        </Flex>
                    </Col>
                </Row>
            )}
        </>
    );
};
export default AlertsTable;
