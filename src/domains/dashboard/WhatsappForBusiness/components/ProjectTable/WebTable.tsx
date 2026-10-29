/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useState } from 'react';

import { Table, Button, Tag, Col, Pagination, Tooltip } from 'antd';
import { ReactSVG } from 'react-svg';

import BuyCreditModal from './ByCreditModal';
import pause from '../../assets/images/ProjectTable/pause-circle.svg';
import play from '../../assets/images/ProjectTable/play-circle.svg';
import { useReActivateBillingApi } from '../../hooks/useReActivateBilling';
import { useStopBillingApi } from '../../hooks/useStopBilling';
import { Project } from '../../types/types';

interface WebTableProps {
    projectData: Project[] | undefined;
    isLoading: boolean;
    refreshProjects: () => void;
}

const WebTable: React.FC<WebTableProps> = ({ projectData, isLoading, refreshProjects }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { stopBilling, isLoading: isStopping } = useStopBillingApi();
    const { reactivateBilling, isLoading: isReactivating } = useReActivateBillingApi();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const handleStopBilling = useCallback(
        async (projectId: number) => {
            await stopBilling(projectId);
            refreshProjects(); // Optionally, refresh the project data here
        },
        [refreshProjects, stopBilling]
    );

    const handleReactivateBilling = useCallback(
        async (projectId: number) => {
            await reactivateBilling(projectId);
            refreshProjects();
            // Optionally, refresh the project data here
        },
        [reactivateBilling, refreshProjects]
    );

    const handleBuyCreditClick = (project: Project) => {
        setSelectedProject(project);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Project Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'WCC Credit',
            dataIndex: 'credit',
            key: 'credit',
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
        },
        {
            title: 'Project Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const statusStyle = status === 'active' ? 'green' : 'gold';
                const newStatus = status === 'active' ? 'Active' : 'Paused';
                return (
                    <Tag color={statusStyle} className="rounded-full">
                        • {newStatus}
                    </Tag>
                );
            },
        },
        {
            title: 'Buy WCC Credit',
            key: 'buyCredit',
            render: (text: string, record: Project) => (
                <Button type="default" danger onClick={() => handleBuyCreditClick(record)}>
                    Buy WCC Credit
                </Button>
            ),
        },
        {
            title: 'Manage Billing',
            dataIndex: 'subscription_status',
            key: 'subscription_status',
            render: (subscription_status: string, record: Project) => {
                const isStoppingOrReactivating = isStopping || isReactivating;
                const StatusIcon = subscription_status === 'active' ? pause : play;
                // const handleClick =
                //     subscription_status === 'active'
                //         ? () => handleStopBilling(record.id)
                //         : () => handleReactivateBilling(record.id);

                const tooltipMessage =
                    subscription_status === 'active'
                        ? 'Your current billing status is active. Click here to stop.'
                        : 'Your current billing status is inactive. Click here to reactivate.';

                return (
                    <Tooltip title={tooltipMessage}>
                        <Button
                            type="link"
                            disabled={isStoppingOrReactivating}
                            // onClick={handleClick}
                        >
                            <ReactSVG src={StatusIcon} className="pt-2" />
                        </Button>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <Col>
            <Table
                dataSource={projectData}
                className="mt-10"
                columns={columns}
                loading={isLoading}
                pagination={false}
                rowKey="name"
            />
            <Pagination
                className="sm:text-end text-center mt-10 "
                total={projectData?.length}
                current={currentPage}
                defaultPageSize={pageSize}
                onChange={page => {
                    setCurrentPage(page);
                    setPageSize(pageSize);
                }}
            />
            <BuyCreditModal
                isVisible={isModalVisible}
                project={selectedProject}
                handleCancel={() => setIsModalVisible(false)}
            />
        </Col>
    );
};

export default WebTable;
