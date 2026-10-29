import { useState } from 'react';

import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

import Gstr9FormTable4 from './Gstr9FormTable4';
import Gstr9FormTable5 from './Gstr9FormTable5';
import Gstr9FormTable6 from './Gstr9FormTable6';
import { deriveTable4, deriveTable5 } from './gstr9Utils';
import { Gstr9DraftData } from '../../types';
// import Table7Reversals from './Table7Reversals'; // Table 7 not available from auto-calc response — comes from Details API only

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = 'table4' | 'table5' | 'table6';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'table4', label: 'Table 4 — Outward' },
    { key: 'table5', label: 'Table 5 — Non-Tax' },
    { key: 'table6', label: 'Table 6 — ITC' },
    // { key: 'table7', label: 'Table 7 — Reversals' }, // not in auto-calc response
];

// ─── Component ────────────────────────────────────────────────────────────────

const GstrFormStep = ({
    draftData,
    nextLoading,
    onBack,
    onNext,
}: {
    draftData: Gstr9DraftData | null;
    nextLoading?: boolean;
    onBack: () => void;
    onNext: () => void | Promise<void>;
}) => {
    const [activeTab, setActiveTab] = useState<TabKey>('table4');

    const fd = draftData?.formData;
    const secSum = fd?.sec_sum ?? [];
    const table4 = fd?.table4 ?? deriveTable4(secSum);
    const table5 = fd?.table5 ?? deriveTable5(secSum);
    const table6 = fd?.table6;

    const TAB_KEYS: TabKey[] = ['table4', 'table5', 'table6'];
    const tabIdx = TAB_KEYS.indexOf(activeTab);
    const isLastTab = tabIdx === TAB_KEYS.length - 1;

    const handleBack = () => {
        if (tabIdx === 0) onBack();
        else setActiveTab(TAB_KEYS[tabIdx - 1]);
    };

    const handleNext = () => {
        if (isLastTab) onNext();
        else setActiveTab(TAB_KEYS[tabIdx + 1]);
    };

    return (
        <Flex vertical gap={16}>
            {/* Tab bar */}
            <div className="flex border-b border-[#e2e8f0] gap-1 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        className="px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                        style={{
                            color: activeTab === tab.key ? '#ff4f4f' : '#475569',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.key ? '#ff4f4f' : 'transparent'}`,
                            marginBottom: -1,
                            cursor: 'pointer',
                        }}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {(() => {
                const nav = (
                    <>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            style={{ height: 40 }}
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            type="primary"
                            danger
                            loading={isLastTab && nextLoading}
                            icon={<ArrowRightOutlined />}
                            iconPosition="end"
                            style={{ height: 40 }}
                            onClick={handleNext}
                        >
                            {isLastTab ? 'Save GSTR-9 Draft' : 'Next'}
                        </Button>
                    </>
                );
                if (activeTab === 'table4')
                    return <Gstr9FormTable4 initialTable4={table4} footer={nav} />;
                if (activeTab === 'table5')
                    return <Gstr9FormTable5 initialTable5={table5} footer={nav} />;
                return <Gstr9FormTable6 initialTable6={table6} footer={nav} />;
            })()}
        </Flex>
    );
};

export default GstrFormStep;
