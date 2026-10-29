import { useState } from 'react';

import {
    ArrowRightOutlined,
    BellOutlined,
    CheckCircleFilled,
    DownOutlined,
    ExclamationCircleFilled,
    WarningFilled,
} from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { faqHint } from '../../faq/FaqHint';
import { AccountingAlert, AccountingAlertIssue, AlertTone } from '../../utils/dashboardData';

type AlertsPanelProps = {
    alerts: AccountingAlert[];
};

type ToneStyle = {
    bar: string;
    icon: JSX.Element;
    count: string;
    pill: string;
    word: [string, string];
};

const TONES: Record<AlertTone, ToneStyle> = {
    error: {
        bar: 'bg-red-500',
        icon: <ExclamationCircleFilled className="text-red-500 text-base" />,
        count: 'bg-bgLightRed text-red-700',
        pill: 'bg-red-600 text-white',
        word: ['critical', 'critical'],
    },
    warning: {
        bar: 'bg-amber-400',
        icon: <WarningFilled className="text-amber-500 text-base" />,
        count: 'bg-bgLightYellow text-amber-700',
        pill: 'bg-amber-500 text-white',
        word: ['warning', 'warnings'],
    },
};

const plural = (count: number, [one, many]: [string, string]) => (count === 1 ? one : many);

const IssueRow = ({
    issue,
    onOpen,
}: {
    issue: AccountingAlertIssue;
    onOpen: (to: string) => void;
}) => (
    <Flex
        align="center"
        gap={12}
        className="px-3 py-2 border-t border-solid border-borderCard first:border-t-0 bg-white"
        data-testid="alert-issue"
    >
        <Flex vertical className="min-w-0 flex-1">
            <Typography.Text className="text-[13px] font-medium text-textHeadings truncate">
                {issue.label}
            </Typography.Text>
            {issue.detail && (
                <Typography.Text className="text-xs text-textBody leading-snug">
                    {issue.detail}
                </Typography.Text>
            )}
        </Flex>
        <Typography.Link
            className="text-xs font-semibold whitespace-nowrap shrink-0"
            onClick={() => onOpen(issue.to)}
        >
            {issue.action} <ArrowRightOutlined className="text-[10px]" />
        </Typography.Link>
    </Flex>
);

const AlertCard = ({
    alert,
    open,
    onToggle,
    onOpen,
}: {
    alert: AccountingAlert;
    open: boolean;
    onToggle: () => void;
    onOpen: (to: string) => void;
}) => {
    const tone = TONES[alert.tone];
    const expandable = alert.issues.length > 0;
    const shown = alert.issues.length;
    const total = shown + alert.hidden;
    const summaryId = `alert-${alert.key}-summary`;

    return (
        <div className="relative overflow-hidden rounded-[10px] border border-solid border-borderCard bg-white">
            <span className={`absolute left-0 top-0 h-full w-1 ${tone.bar}`} aria-hidden />
            <button
                type="button"
                className="w-full text-left bg-transparent border-0 px-4 pt-3 pb-2 pl-5 cursor-pointer"
                onClick={onToggle}
                aria-expanded={expandable ? open : undefined}
                aria-controls={expandable ? summaryId : undefined}
                disabled={!expandable}
            >
                <Flex align="center" gap={10}>
                    {tone.icon}
                    <Typography.Text className="text-[13px] font-semibold text-textHeadings">
                        {alert.title}
                        {faqHint('Dashboard', 'Alerts', alert.title)}
                    </Typography.Text>
                    <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tone.count}`}
                    >
                        {total}
                    </span>
                    {expandable && (
                        <DownOutlined
                            className={`ml-auto text-[11px] text-textBody transition-transform ${
                                open ? 'rotate-180' : ''
                            }`}
                        />
                    )}
                </Flex>
                <Typography.Text className="block mt-1.5 text-[12.5px] leading-snug text-textBody">
                    {alert.body}
                </Typography.Text>
            </button>
            <Flex align="center" justify="space-between" gap={8} className="px-4 pl-5 pb-3">
                <Typography.Link
                    className="text-xs font-semibold w-fit"
                    onClick={() => onOpen(alert.to)}
                >
                    {alert.action} <ArrowRightOutlined className="text-[10px]" />
                </Typography.Link>
                {expandable && (
                    <Typography.Text className="text-[11px] text-textBody">
                        {open ? 'Hide' : 'Show'} {shown} {plural(shown, ['issue', 'issues'])}
                    </Typography.Text>
                )}
            </Flex>
            {expandable && open && (
                <div
                    id={summaryId}
                    className="border-t border-solid border-borderCard bg-bgGray max-h-72 overflow-y-auto"
                >
                    {alert.issues.map(issue => (
                        <IssueRow key={issue.key} issue={issue} onOpen={onOpen} />
                    ))}
                    {alert.hidden > 0 && (
                        <Flex
                            align="center"
                            justify="space-between"
                            gap={8}
                            className="px-3 py-2 border-t border-solid border-borderCard"
                        >
                            <Typography.Text className="text-xs text-textBody">
                                {alert.hidden} more not listed here
                            </Typography.Text>
                            <Typography.Link
                                className="text-xs font-semibold whitespace-nowrap"
                                onClick={() => onOpen(alert.to)}
                            >
                                See all <ArrowRightOutlined className="text-[10px]" />
                            </Typography.Link>
                        </Flex>
                    )}
                </div>
            )}
        </div>
    );
};

const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
    const navigate = useNavigate();
    const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
    const errors = alerts.filter(alert => alert.tone === 'error').length;
    const warnings = alerts.length - errors;

    const toggle = (key: string) => setOpenKeys(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <Card
            className="w-full border border-borderCard shadow-none rounded-xl"
            styles={{ body: { padding: 0 } }}
        >
            <Flex
                align="center"
                gap={10}
                wrap="wrap"
                className="px-5 py-4 border-b border-borderCard"
            >
                <BellOutlined className="text-base text-textHeadings" />
                <Typography.Text className="text-[15px] font-semibold text-textHeadings">
                    Alerts
                </Typography.Text>
                <Flex gap={6} className="ml-auto" data-testid="alert-totals">
                    {errors > 0 && (
                        <span
                            className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${TONES.error.pill}`}
                        >
                            {errors} {plural(errors, TONES.error.word)}
                        </span>
                    )}
                    {warnings > 0 && (
                        <span
                            className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${TONES.warning.pill}`}
                        >
                            {warnings} {plural(warnings, TONES.warning.word)}
                        </span>
                    )}
                    {alerts.length === 0 && (
                        <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold bg-bgLightGreen text-green-700">
                            All clear
                        </span>
                    )}
                </Flex>
            </Flex>
            <Flex vertical gap={10} className="p-4">
                {alerts.length === 0 && (
                    <Flex align="center" gap={10} className="py-2">
                        <CheckCircleFilled className="text-green-600 text-base" />
                        <Typography.Text className="text-sm text-textBody">
                            No alerts right now. Everything is in order.
                        </Typography.Text>
                    </Flex>
                )}
                {alerts.map(alert => (
                    <AlertCard
                        key={alert.key}
                        alert={alert}
                        open={Boolean(openKeys[alert.key])}
                        onToggle={() => toggle(alert.key)}
                        onOpen={to => navigate(to)}
                    />
                ))}
            </Flex>
        </Card>
    );
};

export default AlertsPanel;
