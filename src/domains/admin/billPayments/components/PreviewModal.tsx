/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Modal, Space, Table, Typography, Tag, Progress, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { Biller } from '../types/billers';

const { Text } = Typography;

const BATCH_SIZE = 10000; 

interface PreviewModalProps {
    open: boolean;
    onCancel: () => void;
    previewData: Biller[];
    totalCount: number;
    onConfirm: (selectedBillers: Biller[]) => Promise<boolean>;
    isLoading?: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
    open,
    onCancel,
    previewData,
    totalCount,
    onConfirm,
    isLoading,
}) => {
    const [selectedBillers, setSelectedBillers] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });

    const allBillerIds = useMemo(() => new Set(previewData.map(b => b.blr_id)), [previewData]);

    useEffect(() => {
        setSelectedBillers(new Set(allBillerIds));
    }, [allBillerIds]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedBillers(new Set(allBillerIds));
        } else {
            setSelectedBillers(new Set());
        }
    };

    const handleRowSelect = (billerId: string, checked: boolean) => {
        setSelectedBillers(prev => {
            const newSelected = new Set(prev);
            if (checked) {
                newSelected.add(billerId);
            } else {
                newSelected.delete(billerId);
            }
            return newSelected;
        });
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        const selectedArray = previewData.filter(b => selectedBillers.has(b.blr_id));

        const batches: Biller[][] = [];
        for (let i = 0; i < selectedArray.length; i += BATCH_SIZE) {
            batches.push(selectedArray.slice(i, i + BATCH_SIZE));
        }

        setUploadProgress({ current: 0, total: batches.length });

        try {
            for (let i = 0; i < batches.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                const success = await onConfirm(batches[i]);
                if (!success) {
                    setIsSubmitting(false);
                    setUploadProgress({ current: 0, total: 0 });
                    return;
                }
                setUploadProgress({ current: i + 1, total: batches.length });
            }
            
            setSelectedBillers(new Set());
            onCancel();
        } catch (error) {
            // Error handled by onConfirm
        } finally {
            setIsSubmitting(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const columns: ColumnsType<Biller> = [
        {
            title: (
                <Checkbox
                    checked={selectedBillers.size === allBillerIds.size && allBillerIds.size > 0}
                    indeterminate={
                        selectedBillers.size > 0 && selectedBillers.size < allBillerIds.size
                    }
                    onChange={e => handleSelectAll(e.target.checked)}
                />
            ),
            key: 'select',
            width: 50,
            render: (_: any, record: Biller) => (
                <Checkbox
                    checked={selectedBillers.has(record.blr_id)}
                    onChange={e => handleRowSelect(record.blr_id, e.target.checked)}
                />
            ),
        },
        {
            title: 'Biller ID',
            dataIndex: 'blr_id',
            key: 'blr_id',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Name',
            dataIndex: 'blr_name',
            key: 'blr_name',
        },
        {
            title: 'Category',
            dataIndex: 'blr_category_name',
            key: 'blr_category_name',
        },
        {
            title: 'Coverage',
            dataIndex: 'blr_coverage',
            key: 'blr_coverage',
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: Biller) => (
                <Space>
                    {record.isExisting && <Tag color="blue">Existing</Tag>}
                    {record.isDisabled && <Tag color="red">Disabled</Tag>}
                    {!record.isExisting && !record.isDisabled && <Tag color="green">New</Tag>}
                </Space>
            ),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title="Preview Billers"
            width={1000}
            footer={[
                <Button key="cancel" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleConfirm}
                    loading={isSubmitting}
                    disabled={selectedBillers.size === 0 || isLoading}
                >
                    Upload Selected ({selectedBillers.size})
                </Button>,
            ]}
        >
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center">
                    <Text>
                        Total billers found: <Text strong>{totalCount}</Text>
                    </Text>
                    <Text type="secondary">
                        Selected: <Text strong>{selectedBillers.size.toLocaleString()}</Text>
                        {selectedBillers.size > BATCH_SIZE && (
                            <Text type="warning" style={{ marginLeft: 8 }}>
                                (Will be uploaded in {Math.ceil(selectedBillers.size / BATCH_SIZE)} batches)
                            </Text>
                        )}
                    </Text>
                </Flex>

                {uploadProgress.total > 0 && (
                    <Alert
                        message={`Uploading batch ${uploadProgress.current} of ${uploadProgress.total}`}
                        description={
                            <Progress
                                percent={Math.round((uploadProgress.current / uploadProgress.total) * 100)}
                                status="active"
                            />
                        }
                        type="info"
                        showIcon
                    />
                )}

                <Table
                    columns={columns}
                    dataSource={previewData}
                    rowKey="blr_id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        pageSizeOptions: [50, 100, 200, 500],
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total.toLocaleString()} billers`,
                        showQuickJumper: true,
                        onChange: (page, pageSize) => {
                            setPagination({ current: page, pageSize });
                        },
                        onShowSizeChange: (current, size) => {
                            setPagination({ current: 1, pageSize: size });
                        },
                    }}
                    scroll={{ y: 500, x: 'max-content' }}
                />
            </Flex>
        </Modal>
    );
};

export default PreviewModal;
