import { useState } from 'react';

import { Empty, Flex, Spin } from 'antd';

import CashFlowSection from './CashFlowSection';
import CashFlowSummaryBox from './CashFlowSummaryBox';
import { CfSection, cashFlowStatementTitle } from '../../utils/cashFlowData';
import { CashFlowSummaryBoxData } from '../../utils/cashFlowViewModel';
import SectionCard from '../profitLoss/SectionCard';

interface CashFlowStatementCardProps {
    sections: CfSection[];
    summary: CashFlowSummaryBoxData;
    loading?: boolean;
}

const CashFlowStatementCard = ({ sections, summary, loading }: CashFlowStatementCardProps) => {
    // Sections default to expanded; the map only tracks the ones the user has toggled shut.
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const toggle = (id: string) => {
        setOpenMap(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
    };

    let body;
    if (loading) {
        body = (
            <Flex align="center" justify="center" className="min-h-[200px] w-full">
                <Spin />
            </Flex>
        );
    } else if (!sections.length) {
        body = (
            <Flex align="center" justify="center" className="min-h-[200px] w-full">
                <Empty description="No cash flow data" />
            </Flex>
        );
    } else {
        body = (
            <Flex vertical gap={16} className="w-full">
                {sections.map(section => (
                    <CashFlowSection
                        key={section.id}
                        section={section}
                        open={openMap[section.id] ?? true}
                        onToggle={toggle}
                    />
                ))}

                <CashFlowSummaryBox rows={summary.rows} closing={summary.closing} />
            </Flex>
        );
    }

    return <SectionCard title={cashFlowStatementTitle}>{body}</SectionCard>;
};

export default CashFlowStatementCard;
