import React from 'react';

import { EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Row, Col, Select, Space, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import { Incrementdata } from '../../utils/deductions/deductionData';
import SalaryStatusBadge from '../salaryStatusBadge';

const { Option } = Select;

const LeavePolicies = () => {
    const columns = [
        {
            title: 'Date Added',
            dataIndex: 'dateAdded',
            key: 'dateAdded',
        },
        {
            title: 'Previous Basic Salary',
            dataIndex: 'previousBasicSalary',
            key: 'previousBasicSalary',
        },
        {
            title: 'Increment Percentage/Amount',
            dataIndex: 'incrementAmount',
            key: 'incrementAmount',
        },
        {
            title: 'New Basic Salary',
            dataIndex: 'newBasicSalary',
            key: 'newBasicSalary',
        },
        {
            title: 'Effective Month and Year',
            dataIndex: 'effectiveDate',
            key: 'effectiveDate',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any) => <SalaryStatusBadge status="PAID" />,
        },
        {
            title: 'Action',
            key: 'action',
            render: () => (
                <Space size="middle">
                    <Button
                        className="border-0 "
                        icon={<EditOutlined className="text-[#E30000]" />}
                    />

                    <Button className="border-0">
                        <DeleteOutlined className="text-[#E30000]" />
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                <Col md={4}>
                    <Typography.Text className="font-semibold text-lg">Increment</Typography.Text>
                </Col>
                <Col>
                    <Space>
                        <Select placeholder="Month" style={{ width: 120 }}>
                            <Option value="January">January</Option>
                            <Option value="February">February</Option>
                        </Select>
                        <Select placeholder="Year" style={{ width: 120 }}>
                            <Option value="2023">2023</Option>
                            <Option value="2022">2022</Option>
                        </Select>
                        <Button icon={<DownloadOutlined />}>Export</Button>
                        <Button danger>Add Increment</Button>
                    </Space>
                </Col>
            </Row>

            <GenericTable columns={columns} dataSource={Incrementdata} pagination={false} />
        </div>
    );
};

export default LeavePolicies;
