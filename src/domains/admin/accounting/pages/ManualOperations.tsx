import { useMemo, useState } from 'react';

import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Flex, Input, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { findRolesService } from '@utils/findRolesService';

import { LEDGER_LEAF_BY_KIND } from '../config/ledgerPaths';
import {
    MANUAL_OPERATIONS,
    MANUAL_OPERATIONS_INTRO,
    MANUAL_OPERATION_GROUPS,
    ManualOperation,
} from '../config/manualOperations';
import { faqHint } from '../faq/FaqHint';

export const NO_OPERATION_MATCH = 'No operation matches your search.';

const OperationCard = ({ operation }: { operation: ManualOperation }) => (
    <Card className="w-full h-full border border-borderCard shadow-none rounded-xl">
        <Flex vertical gap={12} className="h-full">
            <Flex gap={12} align="flex-start">
                <Flex
                    align="center"
                    justify="center"
                    className="w-10 h-10 shrink-0 bg-bgIconCard rounded-full text-lg text-textHeadings"
                >
                    {operation.icon}
                </Flex>
                <Flex vertical gap={2}>
                    <Typography.Text className="text-[15px] text-textHeadings">
                        {operation.title}
                        {faqHint('Manual Operations', 'Cards', operation.title)}
                    </Typography.Text>
                    <Typography.Text className="text-[13px] text-textBody">
                        {operation.description}
                    </Typography.Text>
                </Flex>
            </Flex>
            <Flex justify="end" className="mt-auto">
                <Link to={operation.path} aria-label={`Open ${operation.title}`}>
                    <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end">
                        Open
                    </Button>
                </Link>
            </Flex>
        </Flex>
    </Card>
);

const matches = (operation: ManualOperation, term: string) =>
    !term ||
    [operation.title, operation.description, operation.group].some(text =>
        text.toLowerCase().includes(term)
    );

const ManualOperations = () => {
    const [search, setSearch] = useState('');
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const openLeaves = useMemo(
        () =>
            new Set(
                Object.values(LEDGER_LEAF_BY_KIND)
                    .map(leaf => leaf.label)
                    .filter(
                        label => findRolesService(services?.data, label, 'Accounting')?.hasAccess
                    )
            ),
        [services]
    );

    const term = search.trim().toLowerCase();
    const groups = MANUAL_OPERATION_GROUPS.map(group => ({
        group,
        operations: MANUAL_OPERATIONS.filter(
            operation =>
                operation.group === group &&
                (!operation.ledger ||
                    openLeaves.has(LEDGER_LEAF_BY_KIND[operation.ledger.kind].label)) &&
                matches(operation, term)
        ),
    })).filter(entry => entry.operations.length > 0);

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {MANUAL_OPERATIONS_INTRO}
                </Typography.Text>
                <Input
                    allowClear
                    prefix={<SearchOutlined className="text-navTextColor" />}
                    placeholder="Search operations"
                    aria-label="Search operations"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    className="w-full sm:w-72"
                />
            </Flex>
            {groups.length === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={NO_OPERATION_MATCH} />
            )}
            {groups.map(({ group, operations }) => (
                <Flex vertical gap={12} key={group}>
                    <Typography.Text strong className="text-[15px] text-textHeadings">
                        {group}
                    </Typography.Text>
                    <Row gutter={[24, 24]}>
                        {operations.map(operation => (
                            <Col xs={24} md={12} xl={8} key={operation.key}>
                                <OperationCard operation={operation} />
                            </Col>
                        ))}
                    </Row>
                </Flex>
            ))}
        </Flex>
    );
};

export default ManualOperations;
