import { useState } from 'react';

import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Typography } from 'antd';

import { deriveTable4, deriveTable5 } from './gstr9Utils';
import Table5NonTaxable from './Table5NonTaxable';
import Table6ITCAvailed from './Table6ITCAvailed';
import Table9TaxPayment from './Table9TaxPayment';
import { Gstr9DraftData, Gstr9Table4 } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = 'table4' | 'table5' | 'table6' | 'table9';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'table4', label: 'Table 4 — Outward' },
    { key: 'table5', label: 'Table 5 — Non-Taxable' },
    { key: 'table6', label: 'Table 6 — ITC' },
    { key: 'table9', label: 'Table 9 — Tax Payment' },
];

type Table4RowKey = keyof Gstr9Table4;

const TABLE4_ROWS: { key: Table4RowKey; label: string }[] = [
    { key: 'b2b', label: '4A — Taxable Outward Supplies to Registered Persons (B2B)' },
    { key: 'b2c', label: '4B — Taxable Outward Supplies to Consumers (B2C)' },
    { key: 'exp', label: '4C — Zero-Rated Supplies (Export with payment of IGST)' },
    { key: 'sez', label: '4D — Supplies to SEZ Units (with IGST)' },
    { key: 'deemed', label: '4E — Deemed Exports' },
    { key: 'at', label: '4F — Advance Tax on which GST was payable' },
    { key: 'rchrg', label: '4G — Outward Supplies attracting Tax on Reverse Charge' },
    { key: 'cr_nt', label: '4H — Credit Notes Issued (net of debit notes)' },
    { key: 'dr_nt', label: '4I — Debit Notes Issued' },
    { key: 'amd_pos', label: '4J — Amendments (Positive)' },
    { key: 'amd_neg', label: '4K — Amendments (Negative)' },
];

const TABLE_COLS = ['Description', 'IGST (₹)', 'CGST (₹)', 'SGST/UTGST (₹)'];
const GRID = '3fr 1fr 1fr 1fr';

const fmt = (n: number) =>
    `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const Table4Outward = ({ table4, footer }: { table4?: Gstr9Table4; footer: React.ReactNode }) => (
    <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
        <div className="px-5 pt-5 pb-3">
            <Typography.Text className="font-semibold" style={{ fontSize: 16, color: '#1e293b' }}>
                Taxable Outward Supplies (as per GSTN auto-calculation)
            </Typography.Text>
        </div>

        <div className="mx-4 mb-4 border border-[#eaecf0] rounded-xl overflow-hidden overflow-x-auto">
            <div
                className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                style={{ gridTemplateColumns: GRID, minWidth: 520 }}
            >
                {TABLE_COLS.map(col => (
                    <div
                        key={col}
                        className="px-5 py-3 text-sm font-semibold"
                        style={{ color: '#42526d' }}
                    >
                        {col}
                    </div>
                ))}
            </div>

            {TABLE4_ROWS.map(row => {
                const entry = table4?.[row.key];
                return (
                    <div
                        key={row.key}
                        className="grid items-center border-b border-[#eaecf0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
                        style={{ gridTemplateColumns: GRID, minHeight: 52, minWidth: 520 }}
                    >
                        <div className="px-5 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#1e293b' }}>
                                {row.label}
                            </Typography.Text>
                        </div>
                        <div className="px-5 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(entry?.iamt ?? 0)}
                            </Typography.Text>
                        </div>
                        <div className="px-5 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(entry?.camt ?? 0)}
                            </Typography.Text>
                        </div>
                        <div className="px-5 py-3">
                            <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                {fmt(entry?.samt ?? 0)}
                            </Typography.Text>
                        </div>
                    </div>
                );
            })}
        </div>

        <Divider className="m-0" />
        <Flex justify="space-between" wrap="wrap" gap={8} className="px-5 py-4">
            {footer}
        </Flex>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AutoCalculatedReview = ({
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

    // Use structured fields if present, otherwise derive from sec_sum
    const table4 = fd?.table4 ?? deriveTable4(secSum);
    const table5 = fd?.table5 ?? deriveTable5(secSum);
    const table6 = fd?.table6;
    const table8 = fd?.table8;
    const table9 = fd?.table9;

    const TAB_KEYS: TabKey[] = ['table4', 'table5', 'table6', 'table9'];
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
        <Flex vertical gap={20}>
            {/* Tab bar */}
            <div className="flex border-b border-[#e2e8f0] overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        className="flex-1 py-3 text-sm font-medium whitespace-nowrap transition-colors text-center"
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
                            {isLastTab ? 'Review Section 8A ITC' : 'Next'}
                        </Button>
                    </>
                );
                if (activeTab === 'table4') return <Table4Outward table4={table4} footer={nav} />;
                if (activeTab === 'table5')
                    return <Table5NonTaxable table5={table5} footer={nav} />;
                if (activeTab === 'table6')
                    return <Table6ITCAvailed table6={table6} table8={table8} footer={nav} />;
                return <Table9TaxPayment table9={table9} footer={nav} />;
            })()}
        </Flex>
    );
};

export default AutoCalculatedReview;
