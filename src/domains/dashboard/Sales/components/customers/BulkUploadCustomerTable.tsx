import { useEffect, useState } from 'react';

import { Button, Col, Pagination, Row, Table, Tooltip, Typography } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import BulkUploadCustomerEditModal from './BulkUploadCustomerEditModal';
import { BulkCustomerRow } from '../../types/customer';

type BulkCustomerDisplayRow = {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    gstin: string;
    primaryCity: string;
    primaryState: string;
    errors: string[];
};

type BulkUploadCustomerTableProps = {
    onCountChange: (total: number, errors: number, successes: number) => void;
};

const BulkUploadCustomerTable = ({ onCountChange }: BulkUploadCustomerTableProps) => {
    const jsonData = useAppSelector(state => state.reducer.salesBulkCustomer);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedCustomerInfo, setSelectedCustomerInfo] = useState<{
        data: BulkCustomerRow | undefined;
        index: number;
    }>();

    useEffect(() => {
        const errorCount = jsonData.filter(item => item.errors.length > 0).length;
        const successCount = jsonData.filter(item => item.errors.length === 0).length;
        onCountChange(jsonData.length, errorCount, successCount);
    }, [jsonData, onCountChange]);

    // The row's own index in jsonData is used as the table's rowKey — an uploaded row's
    // Phone Number / GSTIN is exactly what's being validated here, so it can arrive blank
    // or duplicated across error rows.
    const displayData: BulkCustomerDisplayRow[] = jsonData.map((item, index) => ({
        id: String(index),
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email,
        gstin: item.gstin,
        primaryCity: item.primaryCity,
        primaryState: item.primaryState,
        errors: item.errors,
    }));

    const paginatedData = displayData.slice((current - 1) * pageSize, current * pageSize);

    const handleClick = (id: string) => {
        const index = Number(id);
        const customer = jsonData[index];
        if (customer) {
            setSelectedCustomerInfo({ data: customer, index });
            setIsModalVisible(true);
        }
    };

    const columns: TableColumnsType<BulkCustomerDisplayRow> = [
        {
            title: '#',
            key: 'serial',
            render: (_text, _record, index) => (current - 1) * pageSize + index + 1,
        },
        {
            title: 'Customer Name',
            dataIndex: 'name',
            render: (name: string) => <Typography.Text>{name}</Typography.Text>,
        },
        {
            title: 'Phone Number',
            dataIndex: 'phoneNumber',
            render: (phoneNumber: string) => <Typography.Text>{phoneNumber}</Typography.Text>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            render: (email: string) => <Typography.Text>{email || '-'}</Typography.Text>,
        },
        {
            title: 'GSTIN',
            dataIndex: 'gstin',
            render: (gstin: string) => <Typography.Text>{gstin || '-'}</Typography.Text>,
        },
        {
            title: 'City',
            dataIndex: 'primaryCity',
            render: (primaryCity: string) => <Typography.Text>{primaryCity}</Typography.Text>,
        },
        {
            title: 'State',
            dataIndex: 'primaryState',
            render: (primaryState: string) => <Typography.Text>{primaryState}</Typography.Text>,
        },
        {
            title: 'Status',
            dataIndex: 'errors',
            render: (errors: string[]) =>
                errors.length === 0 ? (
                    <Typography.Text style={{ color: 'green' }}>Success</Typography.Text>
                ) : (
                    <Tooltip
                        title={
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {errors.map(error => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        }
                    >
                        <Typography.Text style={{ color: 'red', cursor: 'pointer' }}>
                            {`Error (${errors.length})`}
                        </Typography.Text>
                    </Tooltip>
                ),
        },
        {
            title: 'Actions',
            dataIndex: 'id',
            width: '10%',
            render: (id: string) => (
                <Button type="link" onClick={() => handleClick(id)} style={{ color: 'red' }}>
                    View and Edit
                </Button>
            ),
        },
    ];

    const handleTableChange: TableProps<BulkCustomerDisplayRow>['onChange'] = pagination => {
        if (pagination.current) setCurrent(pagination.current);
        if (pagination.pageSize) setPageSize(pagination.pageSize);
    };

    return (
        <>
            <Row className="mt-4" gutter={[0, 20]}>
                <Col span={24}>
                    <Table
                        rowKey={record => record.id}
                        columns={columns}
                        scroll={{ x: 992 }}
                        dataSource={paginatedData}
                        onChange={handleTableChange}
                        pagination={false}
                    />
                </Col>
                <Col span={24}>
                    <div className="flex xs:justify-center md:justify-end xs:mt-4">
                        <Pagination
                            current={current}
                            pageSize={pageSize}
                            total={jsonData.length}
                            showSizeChanger={false}
                            onChange={(page, size) => {
                                setCurrent(page);
                                setPageSize(size);
                            }}
                        />
                    </div>
                </Col>
            </Row>
            {isModalVisible && (
                <BulkUploadCustomerEditModal
                    open={isModalVisible}
                    handleCancel={() => setIsModalVisible(false)}
                    customerData={selectedCustomerInfo?.data}
                    customerIndex={selectedCustomerInfo?.index}
                />
            )}
        </>
    );
};

export default BulkUploadCustomerTable;
