import { useState } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Menu, Typography } from 'antd';
import { Link } from 'react-router-dom';

import PageTabs from '@src/domains/dashboard/corporateCards/components/common/PageTabs';

import StatusPill from './common/StatusPill';
import { DrillPanel } from '../context/AccountingShellContext';

type AccountingDrillPanelProps = {
    panel: DrillPanel;
    mode?: 'vertical' | 'horizontal';
};

const INITIAL_SUBTITLE_ITEMS = 3;

const PanelHeader = ({ panel }: { panel: DrillPanel }) => {
    const [showAllSubtitle, setShowAllSubtitle] = useState(false);
    const subtitleItems = panel.subtitle?.split(' · ') ?? [];
    const hasMoreSubtitle =
        panel.subtitleExpandable && subtitleItems.length > INITIAL_SUBTITLE_ITEMS;
    const subtitle =
        hasMoreSubtitle && !showAllSubtitle
            ? `${subtitleItems.slice(0, INITIAL_SUBTITLE_ITEMS).join(' · ')} · …`
            : panel.subtitle;

    return (
        <Flex vertical gap={4} className="pb-4 border-b border-solid border-gray-200">
            <Typography.Text className="text-base font-semibold leading-snug text-textHeadings">
                {panel.title}
            </Typography.Text>
            {panel.subtitle && (
                <>
                    <Typography.Text className="text-xs text-navTextColor">
                        {subtitle}
                    </Typography.Text>
                    {hasMoreSubtitle && (
                        <Button
                            type="link"
                            size="small"
                            className="h-auto self-start px-0 text-xs"
                            onClick={() => setShowAllSubtitle(value => !value)}
                        >
                            {showAllSubtitle ? 'Show less' : 'Show more'}
                        </Button>
                    )}
                </>
            )}
            {panel.status && (
                <div className="mt-1">
                    <StatusPill {...panel.status} />
                </div>
            )}
        </Flex>
    );
};

const AccountingDrillPanel = ({ panel, mode = 'vertical' }: AccountingDrillPanelProps) => {
    const back = (
        <Link
            to={panel.backTo}
            className="inline-flex items-center gap-2 text-[13px] text-textBody hover:text-brandColor"
        >
            <ArrowLeftOutlined />
            {panel.backLabel}
        </Link>
    );

    if (mode === 'horizontal') {
        return (
            <Flex vertical gap={12} className="pb-4">
                {back}
                <PanelHeader panel={panel} />
                <PageTabs
                    tabs={panel.tabs.map(tab => ({ key: tab.key, label: tab.label }))}
                    activeKey={panel.activeKey}
                    onChange={panel.onTabChange}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical className="min-h-svh px-3 py-4" data-testid="accounting-drill-panel">
            <div className="px-2">{back}</div>
            <div className="px-2 pt-4">
                <PanelHeader panel={panel} />
            </div>
            <Menu
                mode="inline"
                selectedKeys={[panel.activeKey]}
                onClick={({ key }) => panel.onTabChange(key)}
                className="mt-2 border-none bg-transparent"
                items={panel.tabs.map(tab => ({
                    key: tab.key,
                    icon: <span className="text-lg">{tab.icon}</span>,
                    label: tab.label,
                }))}
            />
        </Flex>
    );
};

export default AccountingDrillPanel;
