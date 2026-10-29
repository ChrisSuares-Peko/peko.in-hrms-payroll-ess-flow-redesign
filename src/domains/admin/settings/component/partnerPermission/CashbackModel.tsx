import React, { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Modal, Table, Skeleton, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type CashbackData = {
    serviceName: string;
    packageStatus: Record<string, string>[];
};

type CashbackModalProps = {
    open: boolean;
    handleCancel: () => void;
    data: CashbackData[] | null;
    partnerName: string | null;
    isLoading: boolean;
};

const CashbackModal: React.FC<CashbackModalProps> = ({
    open,
    handleCancel,
    data,
    partnerName,
    isLoading,
}) => {
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        if (data) {
            const transformedData = data.map((service: any, index: number) => ({
                key: index,
                serviceName: service.serviceName,
                ...service.packageStatus[0],
            }));
            setTableData(transformedData);
        }
    }, [data]);

    const columns: ColumnsType<any> =
        data && data.length > 0
            ? [
                  {
                      title: 'Service Name',
                      dataIndex: 'serviceName',
                      key: 'serviceName',
                      fixed: 'left',
                      width: 200, // Fixed width for the first column
                  },
                  ...Object.keys(data[0].packageStatus[0]).map(key => ({
                      title: key,
                      dataIndex: key,
                      key,
                      render: (value: string) => {
                          if (value === 'YES') {
                              return <CheckOutlined style={{ color: 'green' }} />;
                          }
                          if (value === 'NONE') {
                              return null;
                          }
                          return <CloseOutlined style={{ color: 'red' }} />;
                      },
                      width: 120, // Set column width dynamically if needed
                  })),
              ]
            : [];

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
            ]}
            title={`Services Cashback Status (${partnerName || 'N/A'})`}
            centered
            width="90vw" // Set modal width dynamically
            bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }} // Scrollable content
        >
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <Table
                        columns={columns}
                        dataSource={tableData}
                        pagination={false}
                        bordered={false}
                        style={{ minWidth: '800px' }} // Ensure a minimum width for the table
                        scroll={{ x: 'max-content', y: 'calc(80vh - 160px)' }} // Enable horizontal scrolling for wide tables
                    />
                </div>
            )}
        </Modal>
    );
};

export default CashbackModal;
