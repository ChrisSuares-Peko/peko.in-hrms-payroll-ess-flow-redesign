import React from 'react';

import { FileTextOutlined } from '@ant-design/icons';
import { Drawer, Flex, Pagination, Spin, Typography } from 'antd';

import LeftHeader from './LeftHeader';

interface ListDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    isLoading: boolean;
    isEmpty: boolean;
    totalRecords: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    emptyText?: string;
    children?: React.ReactNode;
}

const ListDrawer: React.FC<ListDrawerProps> = ({
    open,
    onClose,
    title,
    description,
    isLoading,
    isEmpty,
    totalRecords,
    page,
    pageSize,
    onPageChange,
    emptyText = 'No data found',
    children,
}) => {
    const renderBody = () => {
        if (isLoading) {
            return (
                <Flex justify="center" align="center" className="min-h-[400px]">
                    <Spin />
                </Flex>
            );
        }
        if (isEmpty) {
            return (
                <Flex vertical align="center" justify="center" gap={8} className="min-h-[400px]">
                    <FileTextOutlined className="text-3xl text-[#D0D5DD]" />
                    <Typography.Text className="text-sm text-[#6A7282]">{emptyText}</Typography.Text>
                </Flex>
            );
        }
        return children;
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={520}
            closable={false}
            destroyOnHidden
            styles={{
                body: { padding: 0 },
                header: { padding: '16px 24px' },
                footer: {
                    padding: '14px 24px',
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                },
            }}
            title={<LeftHeader title={title} description={description} />}
            footer={
                totalRecords > pageSize ? (
                    <Flex justify="center">
                        <Pagination
                            current={page}
                            pageSize={pageSize}
                            total={totalRecords}
                            onChange={onPageChange}
                            showSizeChanger={false}
                        />
                    </Flex>
                ) : (
                    <Typography.Text className="text-[#475569] text-sm font-medium block text-center">
                        Showing {isLoading ? '…' : totalRecords} of {totalRecords}
                    </Typography.Text>
                )
            }
        >
            {renderBody()}
        </Drawer>
    );
};

export default ListDrawer;
