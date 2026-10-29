import React, { useEffect, useState } from 'react';

import {
    BankOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CreditCardOutlined,
    SearchOutlined,
    SwapOutlined,
    UserOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { Avatar, Card, Col, Flex, Row, Select, Skeleton, Tag, Tooltip, Typography } from 'antd';

import { formattedDateOnly } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CorporateOrdersTable from '../components/CorporateOrdersTable';
import CorporateSubscriptionsTable from '../components/CorporateSubscriptionsTable';
import { useCorporateLookup } from '../hooks/useCorporateLookup';
import useCorporateSubscriptions from '../hooks/useCorporateSubscriptions';

const { Title, Text } = Typography;

const subscriptionStatusColor: Record<string, string> = {
    ACTIVE: 'success',
    CANCELLED: 'error',
    EXPIRED: 'default',
    PENDING: 'warning',
};

const getInitials = (name?: string) => {
    if (!name) return '';
    return name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
};

const ProfileRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Flex
        justify="space-between"
        align="center"
        className="py-2 border-b border-[#f5f5f5] last:border-0"
    >
        <Text type="secondary" className="text-xs uppercase tracking-wide shrink-0">
            {label}
        </Text>
        <Text className="font-medium text-right ml-4 truncate max-w-[65%]">{value ?? '-'}</Text>
    </Flex>
);

const CorporateLookup: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const [activeTable, setActiveTable] = useState<'transactions' | 'subscriptions'>(
        'transactions'
    );
    const { isLoading, data, searchCorporate, options, fetchingOptions, onSearchDropdown } =
        useCorporateLookup();

    useEffect(() => {
        onSearchDropdown('');
    }, [onSearchDropdown]);

    const subscriptionStatus = data?.subscription?.status?.toUpperCase();
    const companyInitials = getInitials(data?.profile?.companyName);

    const {
        isLoading: subsLoading,
        tableData: subsData,
        count: subsCount,
        page: subsPage,
        searchText: subsSearchText,
        handlePageChange: subsHandlePageChange,
        handleTableChange: subsHandleTableChange,
        handleSearchChange: subsHandleSearchChange,
    } = useCorporateSubscriptions(data?.profile?.credentialId);

    return (
        <>
            {/* Page Header */}
            <Flex align="center" gap={12} className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <BankOutlined className="text-brandColor text-xl" />
                </div>
                <div>
                    <Title level={4} className="!m-0 font-bold">
                        Corporate Lookup
                    </Title>
                    <Text type="secondary" className="text-xs">
                        Search and view corporate account details
                    </Text>
                </div>
            </Flex>

            {/* Search Bar */}
            <Row gutter={16} className="mb-6">
                <Col flex="auto">
                    <Select
                        showSearch
                        size="large"
                        placeholder={
                            <span className="flex items-center gap-2 text-gray-400">
                                <SearchOutlined /> Search by Account ID or Email
                            </span>
                        }
                        value={searchText || undefined}
                        onChange={value => setSearchText(value)}
                        onSelect={value => {
                            setSearchText(value);
                            searchCorporate(value);
                        }}
                        onSearch={onSearchDropdown}
                        filterOption={false}
                        loading={fetchingOptions}
                        options={options}
                        optionRender={option => (
                            <Flex gap={10} align="center">
                                <Avatar
                                    size="small"
                                    style={{
                                        backgroundColor: '#FF3A3A',
                                        fontSize: 11,
                                        flexShrink: 0,
                                    }}
                                >
                                    {option.data.label?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <span>
                                    {option.data.label}
                                    {option.data.partnerName && (
                                        <>
                                            {' '}
                                            - <strong>{option.data.partnerName}</strong>
                                        </>
                                    )}
                                </span>
                            </Flex>
                        )}
                        className="w-full text-left [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selection-item]:text-left shadow-sm"
                        allowClear
                        onClear={() => {
                            setSearchText('');
                            onSearchDropdown('');
                        }}
                    />
                </Col>
            </Row>

            {/* Profile and Subscription Cards */}
            <Row gutter={[24, 24]} className="mb-6">
                <Col xs={24} md={12}>
                    <Card className="rounded-2xl border-[#f0f0f0] shadow-sm h-full">
                        <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} title={false}>
                            {/* Avatar + name header */}
                            <Flex
                                align="center"
                                gap={14}
                                className="mb-4 pb-4 border-b border-[#f5f5f5]"
                            >
                                <Avatar
                                    size={52}
                                    icon={!companyInitials ? <UserOutlined /> : undefined}
                                    style={{
                                        backgroundColor: '#FF3A3A',
                                        fontSize: 18,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                >
                                    {companyInitials || undefined}
                                </Avatar>
                                <div className="min-w-0">
                                    <Title level={5} className="!m-0 font-bold truncate">
                                        {data?.profile?.companyName ?? 'No corporate selected'}
                                    </Title>
                                    <Text type="secondary" className="text-xs">
                                        ID: {data?.profile?.accountId ?? '-'}
                                    </Text>
                                </div>
                            </Flex>
                            <ProfileRow label="Email" value={data?.profile?.email} />
                            <ProfileRow label="Phone" value={data?.profile?.phone} />
                        </Skeleton>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card className="rounded-2xl border-[#f0f0f0] shadow-sm h-full">
                        <Skeleton loading={isLoading} active paragraph={{ rows: 3 }} title={false}>
                            <Flex
                                align="center"
                                justify="space-between"
                                className="mb-4 pb-4 border-b border-[#f5f5f5]"
                            >
                                <Title level={5} className="!m-0 font-bold">
                                    Subscription
                                </Title>
                                {subscriptionStatus && (
                                    <Tag
                                        color={
                                            subscriptionStatusColor[subscriptionStatus] ?? 'default'
                                        }
                                        className="rounded-full px-3 font-semibold text-xs uppercase"
                                    >
                                        {data?.subscription?.status}
                                    </Tag>
                                )}
                            </Flex>
                            <ProfileRow label="Package" value={data?.subscription?.package} />
                            <ProfileRow label="Billing" value={data?.subscription?.billing} />
                        </Skeleton>
                    </Card>
                </Col>
            </Row>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 mb-6">
                {/* Joined Date */}
                <Card
                    className="rounded-2xl border-none bg-[#eff4ff]"
                    styles={{ body: { padding: '24px' } }}
                >
                    <Skeleton
                        loading={isLoading}
                        active
                        avatar={{ shape: 'circle' }}
                        paragraph={{ rows: 1 }}
                        title={false}
                        className="mt-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                            <CalendarOutlined className="text-blue-500" style={{ fontSize: 18 }} />
                        </div>
                        <Title level={5} className="!m-0 font-bold text-blue-700">
                            {data?.profile?.joinedDate
                                ? formattedDateOnly(new Date(data.profile.joinedDate))
                                : '-'}
                        </Title>
                        <Text className="text-[#595959] text-xs mt-1 block font-medium uppercase tracking-wide">
                            Joined Date
                        </Text>
                    </Skeleton>
                </Card>

                {/* Total Transactions — clickable */}
                <Tooltip title="Click to view transactions" placement="top">
                    <Card
                        className={[
                            'rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                            activeTable === 'transactions'
                                ? 'border-red-200 bg-red-50 ring-2 ring-red-200'
                                : 'border-none bg-[#fff7f0]',
                        ].join(' ')}
                        styles={{ body: { padding: '24px' } }}
                        onClick={() => setActiveTable('transactions')}
                    >
                        <Skeleton
                            loading={isLoading}
                            active
                            avatar={{ shape: 'circle' }}
                            paragraph={{ rows: 1 }}
                            title={false}
                            className="mt-2"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-sm ${activeTable === 'transactions' ? 'bg-red-100' : 'bg-white'}`}
                            >
                                <SwapOutlined
                                    className="text-orange-500"
                                    style={{ fontSize: 18 }}
                                />
                            </div>
                            <Title level={5} className="!m-0 font-bold text-orange-700">
                                {data?.stats?.totalTransactions ?? '-'}
                            </Title>
                            <Text className="text-[#595959] text-xs mt-1 block font-medium uppercase tracking-wide">
                                Total Transactions
                            </Text>
                        </Skeleton>
                    </Card>
                </Tooltip>

                {/* Total Amount Spent */}
                <Card
                    className="rounded-2xl border-none bg-[#f5f0ff]"
                    styles={{ body: { padding: '24px' } }}
                >
                    <Skeleton
                        loading={isLoading}
                        active
                        avatar={{ shape: 'circle' }}
                        paragraph={{ rows: 1 }}
                        title={false}
                        className="mt-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                            <WalletOutlined className="text-purple-500" style={{ fontSize: 18 }} />
                        </div>
                        <Title level={5} className="!m-0 font-bold text-purple-700">
                            {data?.stats?.totalAmountSpent != null
                                ? `₹ ${formatNumberWithLocalString(Number(data.stats.totalAmountSpent))}`
                                : '-'}
                        </Title>
                        <Text className="text-[#595959] text-xs mt-1 block font-medium uppercase tracking-wide">
                            Total Amount Spent
                        </Text>
                    </Skeleton>
                </Card>

                {/* Subscriptions — clickable */}
                <Tooltip title="Click to view subscriptions" placement="top">
                    <Card
                        className={[
                            'rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                            activeTable === 'subscriptions'
                                ? 'border-red-200 bg-red-50 ring-2 ring-red-200'
                                : 'border-none bg-[#ebfbf3]',
                        ].join(' ')}
                        styles={{ body: { padding: '24px' } }}
                        onClick={() => setActiveTable('subscriptions')}
                    >
                        <Skeleton
                            loading={isLoading}
                            active
                            avatar={{ shape: 'circle' }}
                            paragraph={{ rows: 1 }}
                            title={false}
                            className="mt-2"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-sm ${activeTable === 'subscriptions' ? 'bg-red-100' : 'bg-white'}`}
                            >
                                <CreditCardOutlined
                                    className="text-green-500"
                                    style={{ fontSize: 18 }}
                                />
                            </div>
                            <Title level={5} className="!m-0 font-bold text-green-700">
                                {subsCount || '-'}
                            </Title>
                            <Text className="text-[#595959] text-xs mt-1 block font-medium uppercase tracking-wide">
                                Subscriptions
                            </Text>
                        </Skeleton>
                    </Card>
                </Tooltip>

                {/* Last Transaction */}
                <Card
                    className="rounded-2xl border-none bg-[#f0f7ff]"
                    styles={{ body: { padding: '24px' } }}
                >
                    <Skeleton
                        loading={isLoading}
                        active
                        avatar={{ shape: 'circle' }}
                        paragraph={{ rows: 1 }}
                        title={false}
                        className="mt-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                            <ClockCircleOutlined
                                className="text-sky-500"
                                style={{ fontSize: 18 }}
                            />
                        </div>
                        <Title level={5} className="!m-0 font-bold text-sky-700">
                            {data?.stats?.lastTransaction ?? '-'}
                        </Title>
                        <Text className="text-[#595959] text-xs mt-1 block font-medium uppercase tracking-wide">
                            Last Transaction
                        </Text>
                    </Skeleton>
                </Card>
            </div>

            {activeTable === 'transactions' ? (
                <CorporateOrdersTable corporateId={data?.profile?.credentialId} />
            ) : (
                <CorporateSubscriptionsTable
                    isLoading={subsLoading}
                    tableData={subsData}
                    count={subsCount}
                    page={subsPage}
                    searchText={subsSearchText}
                    handlePageChange={subsHandlePageChange}
                    handleTableChange={subsHandleTableChange}
                    handleSearchChange={subsHandleSearchChange}
                />
            )}
        </>
    );
};

export default CorporateLookup;
