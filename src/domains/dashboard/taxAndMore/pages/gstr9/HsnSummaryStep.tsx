import { useState } from 'react';

import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    DownloadOutlined,
    PlusOutlined,
    SaveOutlined,
    SyncOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { Button, Flex, Input, Typography } from 'antd';

// ─── Types & Constants ────────────────────────────────────────────────────────

type TabKey = 'table17' | 'table18';
type HsnRow = { id: number } & Record<string, string>;

const TABS: { key: TabKey; label: string }[] = [
    { key: 'table17', label: 'Table 17 — Outward Supplies' },
    { key: 'table18', label: 'Table 18 — Inward Supplies' },
];

const HSN_COLS = [
    { key: 'hsnSac', label: 'HSN/SAC', width: 110 },
    { key: 'description', label: 'Description', width: 150 },
    { key: 'qty', label: 'Qty', width: 80 },
    { key: 'uom', label: 'UoM', width: 80 },
    { key: 'taxableValue', label: 'Taxable Value (₹)', width: 140 },
    { key: 'rate', label: 'Rate %', width: 80 },
    { key: 'igst', label: 'IGST (₹)', width: 110 },
    { key: 'cgst', label: 'CGST (₹)', width: 110 },
    { key: 'sgst', label: 'SGST/UTGST (₹)', width: 130 },
    { key: 'cess', label: 'CESS (₹)', width: 110 },
];

const newRow = (id: number): HsnRow =>
    HSN_COLS.reduce((acc, col) => ({ ...acc, [col.key]: '' }), { id } as HsnRow);

// ─── Table 17 ─────────────────────────────────────────────────────────────────

const HsnTable17 = () => {
    const [rows, setRows] = useState<HsnRow[]>([newRow(1), newRow(2)]);

    const updateCell = (id: number, key: string, val: string) =>
        setRows(prev => prev.map(r => (r.id === id ? { ...r, [key]: val } : r)));

    const addRow = () => setRows(prev => [...prev, newRow(Math.max(...prev.map(r => r.id)) + 1)]);

    return (
        <>
            {/* Actions bar */}
            <Flex
                justify="space-between"
                align="center"
                className="px-5 py-3 border-b border-[#eaecf0]"
            >
                <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                    Tax liability on advances received (Table 11A)
                </Typography.Text>
                <Flex gap={8}>
                    <Button icon={<DownloadOutlined />} size="small">
                        Template
                    </Button>
                    <Button icon={<UploadOutlined />} size="small">
                        Upload
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={addRow}
                    >
                        Add
                    </Button>
                </Flex>
            </Flex>

            {/* Scrollable table */}
            <div className="overflow-x-auto">
                <table style={{ minWidth: 1020, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr className="bg-[#fafbfb] border-b border-[#eaecf0]">
                            {HSN_COLS.map(col => (
                                <th
                                    key={col.key}
                                    className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                    style={{ color: '#42526d', minWidth: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.id} className="border-b border-[#eaecf0] last:border-b-0">
                                {HSN_COLS.map(col => (
                                    <td key={col.key} className="px-2 py-2">
                                        <Input
                                            placeholder="Enter"
                                            value={row[col.key]}
                                            onChange={e =>
                                                updateCell(row.id, col.key, e.target.value)
                                            }
                                            style={{
                                                borderRadius: 6,
                                                fontSize: 13,
                                                minWidth: col.width - 16,
                                            }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HsnSummaryStep = ({ onBack, onNext }: { onBack: () => void; onNext: () => void }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('table17');

    return (
        <Flex vertical gap={0}>
            {/* Page header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={8} className="mb-4">
                <Typography.Text className="font-bold" style={{ fontSize: 16, color: '#1e293b' }}>
                    HSN-wise Summary of Outward (17) and Inward (18) Supplies
                </Typography.Text>
                <Button
                    icon={<SyncOutlined />}
                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f' }}
                >
                    Validate HSN Codes
                </Button>
            </Flex>

            {/* Tab bar */}
            <div className="flex border-b border-[#e2e8f0] gap-1 mb-4" style={{ marginBottom: -1 }}>
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

            {/* Table card — Table 17 and 18 share the same structure */}
            <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white mt-4 mb-4">
                <HsnTable17 key={activeTab} />
            </div>

            {/* Save GSTR-9 Draft button */}
            <Button
                type="primary"
                danger
                icon={<SaveOutlined />}
                block
                style={{
                    height: 48,
                    borderRadius: 12,
                    marginBottom: 16,
                    fontSize: 15,
                    fontWeight: 500,
                }}
            >
                Save GSTR-9 Draft
            </Button>

            {/* Footer nav */}
            <Flex justify="space-between" wrap="wrap" gap={8}>
                <Button icon={<ArrowLeftOutlined />} style={{ height: 40 }} onClick={onBack}>
                    Back
                </Button>
                <Button
                    type="primary"
                    danger
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    style={{ height: 40 }}
                    onClick={onNext}
                >
                    Proceed to File
                </Button>
            </Flex>
        </Flex>
    );
};

export default HsnSummaryStep;
