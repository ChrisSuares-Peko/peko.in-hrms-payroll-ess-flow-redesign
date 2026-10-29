import React, { useEffect, useMemo, useState } from 'react';

import {
    CarOutlined,
    CreditCardOutlined,
    FileSearchOutlined,
    HistoryOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    SwapOutlined,
    TeamOutlined,
    UserOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Card,
    Col,
    Flex,
    Row,
    Select,
    Skeleton,
    Tag,
    Tooltip,
    Typography,
} from 'antd';

import { formattedDateOnly } from '@utils/dateFormat';
import { removeEmoji } from '@utils/regex';

import { KYB_STATUS_META } from '../../manage/component/corporateCardApplications/statusMeta';
import ActivityTable from '../components/ActivityTable';
import CardsTable, { CardWithHolder } from '../components/CardsTable';
import DispatchesTable from '../components/DispatchesTable';
import { money } from '../components/lookupMeta';
import LookupTransactionsTable from '../components/LookupTransactionsTable';
import MembersTable from '../components/MembersTable';
import RequestsTable from '../components/RequestsTable';
import TopUpsTable from '../components/TopUpsTable';
import { useCorporateCardLookup } from '../hooks/useCorporateCardLookup';

const { Title, Text } = Typography;

type Section =
    | 'members'
    | 'kyc'
    | 'cards'
    | 'dispatches'
    | 'topUps'
    | 'transactions'
    | 'activity'
    | 'requests';

const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
};

const ProfileRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <Flex
        justify="space-between"
        align="center"
        className="py-2 border-b border-[#f5f5f5] last:border-0"
    >
        <Text type="secondary" className="text-xs uppercase tracking-wide shrink-0">
            {label}
        </Text>
        {/* Long values (emails, dates on a phone) are cut short; the tooltip shows them in full. */}
        <Text
            className="font-medium text-right ml-4 max-w-[65%]"
            ellipsis={{ tooltip: typeof value === 'string' ? value : undefined }}
        >
            {value ?? '-'}
        </Text>
    </Flex>
);

type StatCardProps = {
    section: Section;
    activeSection: Section;
    onSelect: (section: Section) => void;
    loading: boolean;
    icon: React.ReactNode;
    value: React.ReactNode;
    label: string;
    hint?: React.ReactNode;
    bg: string;
    valueClass: string;
};

// The same clickable tile as Corporate Lookup: picking one swaps the table below.
const StatCard = ({
    section,
    activeSection,
    onSelect,
    loading,
    icon,
    value,
    label,
    hint,
    bg,
    valueClass,
}: StatCardProps) => {
    const active = activeSection === section;
    return (
        <Tooltip title={`Click to view ${label.toLowerCase()}`} placement="top">
            <Card
                className={[
                    'rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                    active ? 'border-red-200 bg-red-50 ring-2 ring-red-200' : `border-none ${bg}`,
                ].join(' ')}
                styles={{ body: { padding: '24px' } }}
                onClick={() => onSelect(section)}
            >
                <Skeleton
                    loading={loading}
                    active
                    avatar={{ shape: 'circle' }}
                    paragraph={{ rows: 1 }}
                    title={false}
                    className="mt-2"
                >
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-sm ${active ? 'bg-red-100' : 'bg-white'}`}
                    >
                        {icon}
                    </div>
                    <Title level={5} className={`!m-0 font-bold break-words ${valueClass}`}>
                        {value}
                    </Title>
                    <Text className="text-[#595959] text-xs mt-1 block font-medium uppercase tracking-wide">
                        {label}
                    </Text>
                    {hint && <Text className="text-[#8c8c8c] text-xs block">{hint}</Text>}
                </Skeleton>
            </Card>
        </Tooltip>
    );
};

const CorporateCardLookup: React.FC = () => {
    const [selected, setSelected] = useState<number | undefined>();
    // Controlled so emojis are stripped from what the box shows, not just from what is searched.
    const [searchValue, setSearchValue] = useState('');
    const [activeSection, setActiveSection] = useState<Section>('members');
    const { isLoading, data, searchCorporate, options, fetchingOptions, onSearchDropdown, clear } =
        useCorporateCardLookup();

    useEffect(() => {
        onSearchDropdown('');
    }, [onSearchDropdown]);

    const corporateId = data?.profile?.corporateId;
    const companyInitials = getInitials(data?.profile?.companyName);
    const kybMeta = data ? KYB_STATUS_META[data.kyb.status] : null;
    const stats = data?.stats;
    const kycApproved = stats?.kycByStatus?.COMPLETED ?? 0;
    const kycRejected = stats?.kycByStatus?.REJECTED ?? 0;
    const kycTotal = stats ? stats.admins + stats.employees : 0;

    const allCards = useMemo<CardWithHolder[]>(
        () =>
            data
                ? [
                      ...data.members.flatMap(member =>
                          member.cards.map(card => ({ ...card, holderName: member.name }))
                      ),
                      ...data.unassignedCards.map(card => ({ ...card, holderName: null })),
                  ]
                : [],
        [data]
    );

    const statProps = { activeSection, onSelect: setActiveSection, loading: isLoading };

    return (
        <>
            {/* Page Header */}
            <Flex align="center" gap={12} className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <CreditCardOutlined className="text-brandColor text-xl" />
                </div>
                <div>
                    <Title level={4} className="!m-0 font-bold">
                        Corporate Card Lookup
                    </Title>
                    <Text type="secondary" className="text-xs">
                        Search a corporate to view its card programme, people, cards and activity
                    </Text>
                </div>
            </Flex>

            {/* Search Bar */}
            <Row gutter={16} className="mb-6">
                <Col flex="auto">
                    <Select<number>
                        showSearch
                        size="large"
                        placeholder={
                            <span className="flex items-center gap-2 text-gray-400">
                                <SearchOutlined /> Search by Company Name or Account ID
                            </span>
                        }
                        value={selected}
                        onSelect={(value: number) => {
                            setSelected(value);
                            setSearchValue('');
                            searchCorporate(value);
                        }}
                        searchValue={searchValue}
                        onSearch={text => {
                            const cleaned = text.replace(removeEmoji, '');
                            setSearchValue(cleaned);
                            onSearchDropdown(cleaned);
                        }}
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
                                    {String(option.data.label)?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <span>
                                    {option.data.label}
                                    {option.data.accountId && (
                                        <>
                                            {' '}
                                            - <strong>{option.data.accountId}</strong>
                                        </>
                                    )}
                                </span>
                            </Flex>
                        )}
                        className="w-full text-left [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selection-item]:text-left shadow-sm"
                        allowClear
                        onClear={() => {
                            setSelected(undefined);
                            setSearchValue('');
                            clear();
                            onSearchDropdown('');
                        }}
                    />
                </Col>
            </Row>

            {/* Profile and KYB Cards */}
            <Row gutter={[24, 24]} className="mb-6">
                <Col xs={24} md={12}>
                    <Card className="rounded-2xl border-[#f0f0f0] shadow-sm h-full">
                        <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} title={false}>
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
                            <ProfileRow
                                label="Contact Person"
                                value={data?.profile?.contactPersonName}
                            />
                            <ProfileRow label="Email" value={data?.profile?.email} />
                            <ProfileRow label="Phone" value={data?.profile?.phone} />
                            <ProfileRow
                                label="Wallet Card"
                                value={
                                    data?.wallet?.svcCardNumberLast4
                                        ? `•••• ${data.wallet.svcCardNumberLast4}`
                                        : undefined
                                }
                            />
                        </Skeleton>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card className="rounded-2xl border-[#f0f0f0] shadow-sm h-full">
                        <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} title={false}>
                            <Flex
                                align="center"
                                justify="space-between"
                                className="mb-4 pb-4 border-b border-[#f5f5f5]"
                            >
                                <Title level={5} className="!m-0 font-bold">
                                    KYB Onboarding
                                </Title>
                                {kybMeta && (
                                    <Tag
                                        className="rounded-full px-3 font-semibold text-xs uppercase border-0"
                                        style={{
                                            color: kybMeta.color,
                                            backgroundColor: kybMeta.bg,
                                        }}
                                    >
                                        {kybMeta.label}
                                    </Tag>
                                )}
                            </Flex>
                            <ProfileRow label="KYB Reference" value={data?.kyb?.kybReference} />
                            <ProfileRow label="Business Type" value={data?.kyb?.businessType} />
                            <ProfileRow
                                label="Applied On"
                                value={
                                    data?.profile?.appliedOn
                                        ? formattedDateOnly(new Date(data.profile.appliedOn))
                                        : undefined
                                }
                            />
                            <ProfileRow
                                label="Last Updated"
                                value={
                                    data?.kyb?.updatedAt
                                        ? formattedDateOnly(new Date(data.kyb.updatedAt))
                                        : undefined
                                }
                            />
                            {data?.kyb?.status === 'REJECTED' && data.kyb.rejectionReason && (
                                <Alert
                                    type="error"
                                    showIcon
                                    className="mt-3"
                                    message="Rejection reason"
                                    description={data.kyb.rejectionReason}
                                />
                            )}
                        </Skeleton>
                    </Card>
                </Col>
            </Row>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <StatCard
                    {...statProps}
                    section="members"
                    icon={<TeamOutlined className="text-blue-500" style={{ fontSize: 18 }} />}
                    value={stats ? `${stats.admins} / ${stats.employees}` : '-'}
                    label="Admins / Employees"
                    bg="bg-[#eff4ff]"
                    valueClass="text-blue-700"
                />
                <StatCard
                    {...statProps}
                    section="kyc"
                    icon={
                        <SafetyCertificateOutlined
                            className="text-green-500"
                            style={{ fontSize: 18 }}
                        />
                    }
                    value={stats ? `${kycApproved} / ${kycTotal}` : '-'}
                    label="KYC Approved"
                    hint={stats && kycRejected ? `${kycRejected} rejected` : undefined}
                    bg="bg-[#ebfbf3]"
                    valueClass="text-green-700"
                />
                <StatCard
                    {...statProps}
                    section="cards"
                    icon={
                        <CreditCardOutlined className="text-purple-500" style={{ fontSize: 18 }} />
                    }
                    value={stats?.cards ?? '-'}
                    label="Cards Issued"
                    hint={
                        stats
                            ? [
                                  `${stats.cardsByType.Virtual ?? 0} virtual`,
                                  `${stats.cardsByType.Physical ?? 0} physical`,
                                  `${stats.frozenCards} frozen`,
                                  stats.pendingCards ? `${stats.pendingCards} pending` : null,
                                  stats.failedCards ? `${stats.failedCards} failed` : null,
                              ]
                                  .filter(Boolean)
                                  .join(' · ')
                            : undefined
                    }
                    bg="bg-[#f5f0ff]"
                    valueClass="text-purple-700"
                />
                <StatCard
                    {...statProps}
                    section="dispatches"
                    icon={<CarOutlined className="text-sky-500" style={{ fontSize: 18 }} />}
                    value={stats ? (stats.cardsByType.Physical ?? 0) : '-'}
                    label="Physical Dispatches"
                    bg="bg-[#f0f7ff]"
                    valueClass="text-sky-700"
                />
                <StatCard
                    {...statProps}
                    section="topUps"
                    icon={<WalletOutlined className="text-emerald-500" style={{ fontSize: 18 }} />}
                    value={data ? money(data.wallet.balance) : '-'}
                    label="Wallet Balance"
                    hint={
                        data
                            ? `${stats?.topUpCount ?? 0} ${stats?.topUpCount === 1 ? 'credit' : 'credits'} · ${money(data.wallet.totalCredited)} in`
                            : undefined
                    }
                    bg="bg-[#ecfdf5]"
                    valueClass="text-emerald-700"
                />
                <StatCard
                    {...statProps}
                    section="transactions"
                    icon={<SwapOutlined className="text-orange-500" style={{ fontSize: 18 }} />}
                    value={stats?.transactionCount ?? '-'}
                    label="Transactions"
                    hint={data ? `${money(data.wallet.totalSpent)} spent` : undefined}
                    bg="bg-[#fff7f0]"
                    valueClass="text-orange-700"
                />
                <StatCard
                    {...statProps}
                    section="activity"
                    icon={<HistoryOutlined className="text-rose-500" style={{ fontSize: 18 }} />}
                    value={stats?.activityCount ?? '-'}
                    label="Platform Activity"
                    bg="bg-[#fff1f2]"
                    valueClass="text-rose-700"
                />
                <StatCard
                    {...statProps}
                    section="requests"
                    icon={
                        <FileSearchOutlined className="text-amber-500" style={{ fontSize: 18 }} />
                    }
                    value={stats?.requestCount ?? '-'}
                    label="Card Requests"
                    bg="bg-[#fffbeb]"
                    valueClass="text-amber-700"
                />
            </div>

            {(activeSection === 'members' || activeSection === 'kyc') && (
                <MembersTable
                    members={data?.members ?? []}
                    loading={isLoading}
                    membersUnavailable={data?.membersUnavailable}
                    membersCapped={data?.membersCapped}
                />
            )}
            {activeSection === 'cards' && (
                <Card
                    className="rounded-2xl border-[#f0f0f0] shadow-none"
                    styles={{ body: { padding: '24px' } }}
                >
                    <Title level={5} className="!m-0 font-semibold pb-4">
                        Cards
                    </Title>
                    <CardsTable cards={allCards} showHolder loading={isLoading} pageSize={10} />
                </Card>
            )}
            {activeSection === 'dispatches' && <DispatchesTable corporateId={corporateId} />}
            {activeSection === 'topUps' && <TopUpsTable corporateId={corporateId} />}
            {activeSection === 'transactions' && (
                <LookupTransactionsTable corporateId={corporateId} />
            )}
            {activeSection === 'activity' && <ActivityTable corporateId={corporateId} />}
            {activeSection === 'requests' && <RequestsTable corporateId={corporateId} />}
        </>
    );
};

export default CorporateCardLookup;
