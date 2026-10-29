import { useEffect, useMemo, useState } from 'react';

import { CrownOutlined } from '@ant-design/icons';
import { Alert, Flex, Segmented, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';

import CardsTable from './CardsTable';
import { DateCell, KYC_LABELS, StatusPill } from './lookupMeta';
import LookupTableCard from './LookupTableCard';
import { LookupMember } from '../types';

type RoleFilter = 'All' | 'Admins' | 'Employees';

const PAGE_SIZE = 10;

const columns: TableProps<LookupMember>['columns'] = [
    {
        title: 'Name',
        key: 'name',
        render: (_: unknown, member) => (
            <Flex vertical>
                <Flex gap={6} align="center">
                    <Typography.Text className="font-medium">{member.name || '-'}</Typography.Text>
                    {member.isAccountOwner && (
                        <Tag icon={<CrownOutlined />} color="gold" className="rounded-full m-0">
                            Account owner
                        </Tag>
                    )}
                </Flex>
                <Typography.Text type="secondary" className="text-xs">
                    {member.email || '-'}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {member.mobileNo || '-'}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        render: (role: string) => (
            <Tag className="rounded-full m-0" color={role === 'Admin' ? 'red' : 'default'}>
                {role}
            </Tag>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string | null) => <StatusPill status={status} />,
    },
    {
        title: 'KYC Status',
        key: 'kyc',
        render: (_: unknown, member) => {
            const status = member.kyc?.status ?? 'NOT_STARTED';
            return (
                <Flex vertical gap={2} className="max-w-[260px]">
                    <StatusPill status={status} label={KYC_LABELS[status]} />
                    {member.kyc?.reason && (
                        <Typography.Text type="danger" className="text-xs whitespace-normal">
                            {member.kyc.reason}
                        </Typography.Text>
                    )}
                </Flex>
            );
        },
    },
    {
        title: 'Cards',
        key: 'cards',
        render: (_: unknown, member) => {
            const virtual = member.cards.filter(c => c.type !== 'Physical').length;
            const physical = member.cards.length - virtual;
            return member.cards.length ? (
                <Typography.Text>
                    {virtual} virtual · {physical} physical
                </Typography.Text>
            ) : (
                <Typography.Text type="secondary">None</Typography.Text>
            );
        },
    },
    {
        title: 'Added On',
        dataIndex: 'addedOn',
        key: 'addedOn',
        render: (value: string | null) => <DateCell value={value} />,
    },
];

type Props = {
    members: LookupMember[];
    loading: boolean;
    membersUnavailable?: boolean;
    membersCapped?: boolean;
};

const MembersTable = ({ members, loading, membersUnavailable, membersCapped }: Props) => {
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [members, roleFilter]);

    const filtered = useMemo(
        () =>
            members.filter(member => {
                if (roleFilter === 'Admins') return member.role === 'Admin';
                if (roleFilter === 'Employees') return member.role !== 'Admin';
                return true;
            }),
        [members, roleFilter]
    );
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <Flex vertical gap={12}>
            {membersUnavailable && (
                <Alert
                    type="warning"
                    showIcon
                    message="The member directory could not be reached, so only cardholders are listed and their names may be missing."
                />
            )}
            {membersCapped && (
                <Alert
                    type="info"
                    showIcon
                    message="This corporate has more members than can be shown at once."
                />
            )}
            <LookupTableCard<LookupMember>
                title="Admins & Employees"
                subtitle="Expand a row to see the cards allocated to that person"
                extra={
                    <Segmented<RoleFilter>
                        options={['All', 'Admins', 'Employees']}
                        value={roleFilter}
                        onChange={setRoleFilter}
                    />
                }
                columns={columns}
                dataSource={pageRows}
                rowKey="id"
                loading={loading}
                emptyText="No members found"
                expandable={{
                    expandedRowRender: member => <CardsTable cards={member.cards} />,
                    rowExpandable: member => member.cards.length > 0,
                }}
                pagination={{
                    page,
                    pageSize: PAGE_SIZE,
                    total: filtered.length,
                    onChange: setPage,
                }}
            />
        </Flex>
    );
};

export default MembersTable;
