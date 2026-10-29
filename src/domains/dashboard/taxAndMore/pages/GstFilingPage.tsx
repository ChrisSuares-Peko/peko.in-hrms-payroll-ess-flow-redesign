import { useCallback, useEffect, useState } from 'react';

import {
    CloseOutlined,
    LinkOutlined,
    RetweetOutlined,
    RightOutlined,
    WifiOutlined,
} from '@ant-design/icons';
import { Button, Col, Flex, Modal, Row, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getGstPortalSession } from '../api/tax';
import ConnectGstModal from '../components/ConnectGstModal';
import useGstSetup from '../hooks/useGstSetup';
import { setActiveSetup, setGstPortalUsername } from '../slice/taxMoreSlice';
import { GstSetup, GstTool, GstWorkflowStep, UpcomingDeadline } from '../types';
import {
    GST_TOOLS,
    GST_WORKFLOW_STEPS,
    INDIAN_STATES,
    MONTH_LABELS,
    UPCOMING_DEADLINES,
} from '../utils/data';

const badgeStyle: React.CSSProperties = {
    backgroundColor: '#fff1f2',
    color: '#b91c1c',
    borderRadius: 9999,
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 600,
    lineHeight: '15px',
    border: 'none',
};

const WorkflowStep = ({ step }: { step: GstWorkflowStep }) => (
    <Flex
        align="center"
        justify="space-between"
        className="border-b border-[#cbd5e1]/50 last:border-b-0 px-4 sm:px-6 py-4 sm:py-5"
    >
        <Flex gap={10} align="flex-start" className="flex-1 min-w-0 mr-4">
            <Flex
                align="center"
                justify="center"
                className="rounded-full flex-shrink-0 bg-[#fef2f2]"
                style={{ width: 40, height: 40 }}
            >
                <Typography.Text
                    className="text-sm font-medium text-brandColor"
                    style={{ lineHeight: '14px' }}
                >
                    {step.step}
                </Typography.Text>
            </Flex>
            <Flex vertical gap={6}>
                <Flex gap={6} align="center" wrap="wrap">
                    <Typography.Text
                        className="font-semibold text-base text-[#1e293b]"
                        style={{ lineHeight: '24px' }}
                    >
                        {step.title}
                    </Typography.Text>
                    <Tag style={badgeStyle}>{step.badge}</Tag>
                </Flex>
                <Typography.Text className="text-sm text-[#475569]" style={{ lineHeight: '22px' }}>
                    {step.description}
                </Typography.Text>
                {step.dueDate && (
                    <Typography.Text
                        className="text-[10px] text-[#9ca3af]"
                        style={{ lineHeight: '15px' }}
                    >
                        {step.dueDate}
                    </Typography.Text>
                )}
            </Flex>
        </Flex>
        <RightOutlined className="text-[#475569] flex-shrink-0" style={{ fontSize: 14 }} />
    </Flex>
);

const DeadlineItem = ({ item, onClick }: { item: UpcomingDeadline; onClick?: () => void }) => (
    <Flex
        align="center"
        justify="space-between"
        className="border-b border-[#cbd5e1]/50 last:border-b-0 px-6 py-[14px]"
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
    >
        <Flex gap={10} align="center">
            <Flex
                vertical
                align="center"
                justify="center"
                gap={6}
                className="rounded-[10px] bg-[#fef2f2] flex-shrink-0 text-brandColor"
                style={{ width: 54, height: 54 }}
            >
                <Typography.Text
                    className="font-bold text-brandColor"
                    style={{ fontSize: 16, lineHeight: '14px' }}
                >
                    {item.day}
                </Typography.Text>
                <Typography.Text
                    className="font-medium text-brandColor uppercase"
                    style={{ fontSize: 10, lineHeight: '10px' }}
                >
                    {item.month}
                </Typography.Text>
            </Flex>
            <Flex vertical gap={4}>
                <Flex gap={6} align="center">
                    <Typography.Text
                        className="font-semibold text-base text-[#1e293b]"
                        style={{ lineHeight: '24px' }}
                    >
                        {item.title}
                    </Typography.Text>
                    <Tag style={badgeStyle}>{item.status}</Tag>
                </Flex>
                <Typography.Text className="text-xs text-[#475569]" style={{ lineHeight: '16px' }}>
                    {item.period}
                </Typography.Text>
            </Flex>
        </Flex>
        <RightOutlined className="text-[#475569] flex-shrink-0" style={{ fontSize: 14 }} />
    </Flex>
);

const ToolCard = ({ tool, onClick }: { tool: GstTool; onClick?: () => void }) => (
    <Flex
        vertical
        gap={18}
        className="bg-white border border-[#cbd5e1] rounded-2xl p-6 h-[190px] cursor-pointer hover:shadow-sm transition-shadow"
        onClick={onClick}
    >
        <Flex
            align="center"
            justify="center"
            className="bg-[#fef2f2] rounded-[14px] flex-shrink-0"
            style={{ width: 44, height: 44 }}
        >
            <LinkOutlined className="text-brandColor" style={{ fontSize: 20 }} />
        </Flex>
        <Flex vertical gap={6}>
            <Typography.Text
                className="font-semibold text-[#101828]"
                style={{ fontSize: 18, lineHeight: '28px' }}
            >
                {tool.title}
            </Typography.Text>
            <Typography.Text className="text-sm text-[#475569]" style={{ lineHeight: '22px' }}>
                {tool.description}
            </Typography.Text>
        </Flex>
    </Flex>
);

const getToolClick = (
    toolId: string,
    navigate: (path: string) => void
): (() => void) | undefined => {
    if (toolId === 'invoice')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.ims}`);
    if (toolId === 'purchases')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstr2b}`);
    if (toolId === 'ledger')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstLedger}`);
    if (toolId === 'annual')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.fileGstr9}`);
    if (toolId === 'compliance')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.supplierCompliance}`);
    if (toolId === 'verify')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstinLookup}`);
    if (toolId === 'filings')
        return () => navigate(`${paths.dashboard.taxMore}/${paths.taxMore.filingHistory}`);
    return undefined;
};

// Derive state name from the first 2 digits of a GSTIN
const stateFromGstin = (gstin: string) =>
    INDIAN_STATES.find(s => s.code === gstin.slice(0, 2))?.name ?? '';

// Build the ordered list of months for a financial year (Apr → Mar)
const buildFyMonths = (fy: string) => {
    const startYear = parseInt(fy.split('-')[0], 10);
    return [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map(m => ({
        value: m,
        label: `${MONTH_LABELS[m - 1]} ${m >= 4 ? startYear : startYear + 1}`,
    }));
};

const GstFilingPage = () => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { activeSetup } = useAppSelector(state => state.reducer.taxMore);
    const navigate = useNavigate();
    const [switchModalOpen, setSwitchModalOpen] = useState(false);
    const [connectModalOpen, setConnectModalOpen] = useState(false);

    // Default selected month = current calendar month
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

    // Portal session state — null = not yet checked, false = not connected, true = connected
    const [portalConnected, setPortalConnected] = useState<boolean | null>(null);
    const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

    const { setups, isLoading: setupsLoading } = useGstSetup();

    const STEP_ROUTES: Record<number, string> = {
        1: paths.taxMore.uploadSalesInvoices,
        2: paths.taxMore.fileGstr1,
        3: paths.taxMore.ims,
        4: paths.taxMore.gstr2b,
        5: paths.taxMore.fileGstr3b,
        6: paths.taxMore.gstLedger,
    };

    const currentSetup: GstSetup | null =
        setups.find(s => String(s.id) === String(activeSetup?.id)) ?? setups[0] ?? null;

    // Check actual portal session from Redis whenever the active GSTIN changes
    const checkSession = useCallback(async () => {
        if (!currentSetup?.gstin) return;
        const data = await getGstPortalSession({
            userId: id,
            userType: role,
            gstin: currentSetup.gstin,
        });
        setPortalConnected(!!(data && (data as any).connected));
    }, [id, role, currentSetup?.gstin]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const handleSessionConnected = (expiresAt: number, username: string) => {
        dispatch(setGstPortalUsername(username));
        setPortalConnected(true);
        setSessionExpiresAt(expiresAt);
        setConnectModalOpen(false);
    };

    const handleSwitchSetup = (setup: GstSetup) => {
        dispatch(setActiveSetup(setup));
        setPortalConnected(null); // will re-check on next render
        setSwitchModalOpen(false);
    };

    // Remaining session time label
    const sessionLabel = (() => {
        if (!sessionExpiresAt) return null;
        const msLeft = sessionExpiresAt - Date.now();
        if (msLeft <= 0) return null;
        const hrs = Math.floor(msLeft / 3_600_000);
        const mins = Math.floor((msLeft % 3_600_000) / 60_000);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    })();

    if (!setupsLoading && setups.length === 0) {
        return (
            <Flex vertical gap={24} align="center" justify="center" style={{ minHeight: 300 }}>
                <Typography.Text className="text-[#475569]">No GST setup found.</Typography.Text>
                <Button type="primary" danger onClick={() => setConnectModalOpen(true)}>
                    Connect GSTIN
                </Button>
                <ConnectGstModal
                    open={connectModalOpen}
                    onClose={() => setConnectModalOpen(false)}
                    onConnected={handleSessionConnected}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={48}>
            {/* Business header */}
            <Flex
                align="center"
                justify="space-between"
                wrap="wrap"
                gap={12}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-4 sm:px-6 py-[14px]"
            >
                <Flex gap={10} align="center" style={{ minWidth: 0 }}>
                    <Flex
                        align="center"
                        justify="center"
                        className="bg-brandColor rounded-full flex-shrink-0"
                        style={{ width: 36, height: 36 }}
                    >
                        <Typography.Text
                            className="font-medium text-white"
                            style={{ fontSize: 16, lineHeight: '16px' }}
                        >
                            {(currentSetup?.legalName ?? currentSetup?.gstin ?? 'G').charAt(0)}
                        </Typography.Text>
                    </Flex>
                    <Flex vertical gap={6} style={{ minWidth: 0 }}>
                        <Typography.Text
                            className="font-semibold text-base text-[#1e293b]"
                            style={{ lineHeight: '24px' }}
                        >
                            {currentSetup?.legalName ??
                                currentSetup?.tradeName ??
                                currentSetup?.gstin ??
                                '—'}
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm text-[#475569]"
                            style={{ lineHeight: '22px' }}
                        >
                            {currentSetup?.gstin}
                            {currentSetup?.gstin && stateFromGstin(currentSetup.gstin)
                                ? ` · ${stateFromGstin(currentSetup.gstin)}`
                                : ''}
                        </Typography.Text>
                    </Flex>
                </Flex>

                <Flex gap={8} align="center" wrap="wrap">
                    <Button
                        icon={<RetweetOutlined />}
                        onClick={() => setSwitchModalOpen(true)}
                        style={{ height: 40, borderColor: '#cbd5e1', color: '#475569' }}
                    >
                        Switch GSTIN
                    </Button>

                    {portalConnected === true ? (
                        <Flex
                            vertical
                            gap={2}
                            className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3"
                        >
                            <Flex gap={8} align="center">
                                <WifiOutlined className="text-[#22c55e]" style={{ fontSize: 14 }} />
                                <Typography.Text
                                    className="font-medium text-[#15803d]"
                                    style={{ fontSize: 13 }}
                                >
                                    GST Portal Connected
                                </Typography.Text>
                            </Flex>
                            {sessionLabel && (
                                <Typography.Text className="text-[11px] text-[#16a34a] pl-[22px]">
                                    Session expires in {sessionLabel}
                                </Typography.Text>
                            )}
                        </Flex>
                    ) : (
                        <Flex
                            align="center"
                            justify="space-between"
                            wrap="wrap"
                            className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl px-4 py-3"
                            gap={12}
                        >
                            <Flex gap={8} align="center">
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="bg-[#cbd5e1] rounded-full flex-shrink-0"
                                    style={{ width: 28, height: 28 }}
                                >
                                    <WifiOutlined className="text-white" style={{ fontSize: 12 }} />
                                </Flex>
                                <Flex vertical gap={1}>
                                    <Typography.Text
                                        className="font-medium text-[#6b7280]"
                                        style={{ fontSize: 12 }}
                                    >
                                        GST Portal Not Connected
                                    </Typography.Text>
                                    {portalConnected === false && (
                                        <Typography.Text className="text-[10px] text-[#ef4444]">
                                            Session expired — reconnect to file
                                        </Typography.Text>
                                    )}
                                </Flex>
                            </Flex>
                            <Button
                                type="primary"
                                danger
                                icon={<RightOutlined />}
                                iconPosition="end"
                                style={{ height: 40 }}
                                onClick={() => setConnectModalOpen(true)}
                            >
                                {portalConnected === false ? 'Reconnect' : 'Connect'}
                            </Button>
                        </Flex>
                    )}
                </Flex>
            </Flex>

            {/* Workflow + Deadlines */}
            <Flex gap={24} align="flex-start" wrap="wrap">
                {/* GST Filing Workflow */}
                <div
                    className="border border-[#cbd5e1] rounded-[20px] overflow-hidden"
                    style={{ flex: '2 1 280px', minWidth: 0 }}
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        wrap="wrap"
                        gap={8}
                        className="bg-white border-b border-[#cbd5e1] px-4 sm:px-6 py-[14px]"
                    >
                        <Flex vertical gap={6}>
                            <Typography.Text
                                className="font-semibold text-base text-[#1e293b]"
                                style={{ lineHeight: '24px' }}
                            >
                                GST Filing Workflow
                            </Typography.Text>
                            <Typography.Text
                                className="text-sm text-[#475569]"
                                style={{ lineHeight: '22px' }}
                            >
                                {GST_WORKFLOW_STEPS.filter(s => s.badge === 'Next').length === 0
                                    ? GST_WORKFLOW_STEPS.length
                                    : GST_WORKFLOW_STEPS.findIndex(s => s.badge === 'Next')}{' '}
                                of {GST_WORKFLOW_STEPS.length} steps completed ·{' '}
                                {buildFyMonths(currentSetup?.financialYear ?? '2024-25').find(
                                    m => m.value === selectedMonth
                                )?.label ?? '—'}
                            </Typography.Text>
                        </Flex>
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                            className="h-8 px-3 text-xs text-[#475569] border border-[#cbd5e1] rounded-lg bg-white cursor-pointer outline-none"
                        >
                            {buildFyMonths(currentSetup?.financialYear ?? '2024-25').map(m => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </Flex>
                    {GST_WORKFLOW_STEPS.map(step => (
                        <button
                            key={step.step}
                            type="button"
                            className={`w-full text-left ${STEP_ROUTES[step.step] ? 'cursor-pointer hover:bg-[#fafafa]' : 'cursor-default'} transition-colors`}
                            onClick={() =>
                                STEP_ROUTES[step.step] &&
                                navigate(`${paths.dashboard.taxMore}/${STEP_ROUTES[step.step]}`)
                            }
                        >
                            <WorkflowStep step={step} />
                        </button>
                    ))}
                </div>

                {/* Upcoming Deadlines */}
                <div
                    className="border border-[#cbd5e1] rounded-[20px] overflow-hidden"
                    style={{ flex: '1 1 280px', minWidth: 0 }}
                >
                    <div className="bg-white border-b border-[#cbd5e1]/50 px-6 py-[14px]">
                        <Typography.Text
                            className="font-semibold text-base text-[#1e293b]"
                            style={{ lineHeight: '24px' }}
                        >
                            Upcoming Deadlines
                        </Typography.Text>
                    </div>
                    {UPCOMING_DEADLINES.map(item => {
                        const deadlineRoute: Record<string, string> = {
                            'GSTR-1': `/${paths.taxMore.index}/${paths.taxMore.fileGstr1}`,
                            'IMS Review': `/${paths.taxMore.index}/${paths.taxMore.ims}`,
                            'GSTR-3B': `/${paths.taxMore.index}/${paths.taxMore.fileGstr3b}`,
                            'GSTR-9 Annual': `/${paths.dashboard.taxMore}/${paths.taxMore.fileGstr9}`,
                        };
                        const route = deadlineRoute[item.title];
                        return (
                            <DeadlineItem
                                key={item.id}
                                item={item}
                                onClick={route ? () => navigate(route) : undefined}
                            />
                        );
                    })}
                </div>
            </Flex>

            {/* All Tools */}
            <Flex vertical gap={24}>
                <Typography.Text
                    className="font-semibold text-[#1e293b]"
                    style={{ fontSize: 20, lineHeight: '28px' }}
                >
                    All Tools
                </Typography.Text>
                <Row gutter={[24, 24]}>
                    {GST_TOOLS.map(tool => (
                        <Col key={tool.id} xs={24} md={12} lg={8}>
                            <ToolCard tool={tool} onClick={getToolClick(tool.id, navigate)} />
                        </Col>
                    ))}
                </Row>
            </Flex>

            {/* Connect GST Portal Modal */}
            <ConnectGstModal
                open={connectModalOpen}
                onClose={() => setConnectModalOpen(false)}
                onConnected={handleSessionConnected}
                prefillGstin={
                    portalConnected === false ? (currentSetup?.gstin ?? undefined) : undefined
                }
            />

            {/* Switch GSTIN Modal */}
            <Modal
                open={switchModalOpen}
                onCancel={() => setSwitchModalOpen(false)}
                footer={null}
                closable={false}
                width={440}
                styles={{ body: { padding: 0 } }}
                style={{ borderRadius: 16 }}
            >
                <Flex
                    align="center"
                    justify="space-between"
                    className="px-6 py-4 border-b border-[#f1f5f9]"
                >
                    <Typography.Text className="font-semibold text-base text-[#1e293b]">
                        Switch GSTIN
                    </Typography.Text>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => setSwitchModalOpen(false)}
                        className="text-[#6b7280]"
                    />
                </Flex>
                <Flex vertical>
                    {setups.map(setup => (
                        <button
                            key={setup.id}
                            type="button"
                            className={`w-full text-left px-6 py-4 border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#fef2f2] transition-colors ${
                                setup.id === currentSetup?.id ? 'bg-[#fef2f2]' : 'bg-white'
                            }`}
                            onClick={() => handleSwitchSetup(setup)}
                        >
                            <Flex gap={12} align="flex-start">
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="bg-brandColor rounded-full flex-shrink-0"
                                    style={{ width: 36, height: 36 }}
                                >
                                    <Typography.Text
                                        className="font-semibold text-white"
                                        style={{ fontSize: 14 }}
                                    >
                                        {(setup.legalName ?? setup.gstin).charAt(0)}
                                    </Typography.Text>
                                </Flex>
                                <Flex vertical gap={4}>
                                    <Typography.Text className="font-semibold text-base text-[#1e293b]">
                                        {setup.legalName ?? setup.tradeName ?? setup.gstin}
                                    </Typography.Text>
                                    <Typography.Text className="text-sm text-[#475569]">
                                        {setup.gstin}
                                    </Typography.Text>
                                    <Typography.Text className="text-xs text-[#475569]">
                                        FY {setup.financialYear}
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                        </button>
                    ))}
                </Flex>
            </Modal>
        </Flex>
    );
};

export default GstFilingPage;
