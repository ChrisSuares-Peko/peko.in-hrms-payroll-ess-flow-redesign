import { useState } from 'react';

import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Input, Pagination, Row, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { paths } from '@src/routes/paths';

import { NewHireRow, useGetNewHireList } from '../../hooks/employeeHooks/useGetNewHireList';

const offerStatusColor: Record<NewHireRow['offerStatus'], { color: string; bg: string }> = {
    Pending: { color: '#B78912', bg: '#FFFAE6' },
    Signed: { color: '#027A48', bg: '#ECFDF3' },
    Rejected: { color: '#B42318', bg: '#FEF3F2' },
};

const OfferStatusTag = ({ status }: { status: NewHireRow['offerStatus'] }) => {
    const style = offerStatusColor[status];
    return (
        <Tag
            bordered={false}
            className="rounded-full px-3"
            style={{ color: style.color, backgroundColor: style.bg }}
        >
            {status}
        </Tag>
    );
};

const NewHireTab = () => {
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const { rows, count, isLoading, pageSize } = useGetNewHireList(searchText, page);
    const navigate = useNavigate();

    const goToProfile = (row: NewHireRow) => {
        navigate(
            `/${paths.payroll.index}/${paths.payroll.employees}/${paths.payroll.newHireProfile}`,
            {
                state: { employeeId: row.id },
            }
        );
    };

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_: unknown, row: NewHireRow) => (
                <Row
                    gutter={10}
                    align="middle"
                    className="cursor-pointer"
                    onClick={() => goToProfile(row)}
                >
                    <Col>
                        <Avatar
                            src={row.profileImage || undefined}
                            style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F' }}
                        >
                            {row.initials}
                        </Avatar>
                    </Col>
                    <Col>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-gray-400">{row.email}</div>
                    </Col>
                </Row>
            ),
        },
        {
            title: 'Role',
            key: 'role',
            render: (_: unknown, row: NewHireRow) => (
                <div>
                    <div>{row.role}</div>
                    {row.department && (
                        <div className="text-xs text-gray-400">{row.department}</div>
                    )}
                </div>
            ),
        },
        {
            title: 'Join Date',
            key: 'joinDate',
            render: (_: unknown, row: NewHireRow) =>
                row.joinDate ? new Date(row.joinDate).toLocaleDateString('en-GB') : '—',
        },
        {
            title: 'Offer Letter Status',
            key: 'offerStatus',
            render: (_: unknown, row: NewHireRow) => <OfferStatusTag status={row.offerStatus} />,
        },
        {
            title: 'Phone Number',
            key: 'phone',
            dataIndex: 'phone',
        },
        {
            title: '',
            key: 'action',
            width: 60,
            render: (_: unknown, row: NewHireRow) => (
                <Button
                    type="text"
                    icon={<EyeOutlined style={{ color: '#ff4f4f' }} />}
                    onClick={() => goToProfile(row)}
                />
            ),
        },
    ];

    return (
        <Row gutter={[10, 16]}>
            <Col md={24} xs={24}>
                <Input
                    placeholder="Search by name, role, email or phone number"
                    suffix={<SearchOutlined />}
                    allowClear
                    value={searchText}
                    onChange={e => {
                        setPage(1);
                        setSearchText(e.target.value);
                    }}
                />
            </Col>
            <Col span={24}>
                <GenericTable
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    loading={isLoading}
                    pagination={false}
                />
            </Col>
            {count > pageSize && (
                <Col span={24}>
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={count}
                        onChange={setPage}
                        className="text-center md:text-end"
                    />
                </Col>
            )}
        </Row>
    );
};

export default NewHireTab;
