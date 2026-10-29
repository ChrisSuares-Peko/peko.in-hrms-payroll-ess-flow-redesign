import type React from 'react';

import { CheckCircleFilled, DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { Flex, Input, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import {
    amdColumns,
    b2baColumns,
    b2bColumns,
    cdnColumns,
    impgColumns,
    isdColumns,
    tcsColumns,
    tdsColumns,
} from '../../utils/gstr2bColumns';
import { MATCH_FILTERS, TAB_TITLES, TABS, fmt } from '../../utils/gstr2bConstants';
import type {
    Gstr2bAmdRow,
    Gstr2bB2baRow,
    Gstr2bCdnRow,
    Gstr2bImpgRow,
    Gstr2bIsdRow,
    Gstr2bRow,
    Gstr2bTcsRow,
    Gstr2bTdsRow,
    MatchFilter,
    TabKey,
} from '../../utils/gstr2bTypes';

interface Props {
    search: string;
    onSearchChange: (v: string) => void;
    matchFilter: MatchFilter;
    onMatchFilterChange: (v: MatchFilter) => void;
    activeTab: TabKey;
    onTabChange: (tab: TabKey) => void;
    filtered: Gstr2bRow[];
    expandedKeys: React.Key[];
    onExpand: (expanded: boolean, record: { id: string }) => void;
    b2baRows?: Gstr2bB2baRow[];
    cdnRows?: Gstr2bCdnRow[];
    impgRows?: Gstr2bImpgRow[];
    isdRows?: Gstr2bIsdRow[];
    tdsRows?: Gstr2bTdsRow[];
    tcsRows?: Gstr2bTcsRow[];
    amdRows?: Gstr2bAmdRow[];
}

const expandBase = {
    expandRowByClick: true,
    showExpandColumn: false,
};

const DetailCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-white rounded-lg px-4 py-3 border border-[#e2e8f0]">
        <Typography.Text className="text-xs block mb-1" style={{ color: '#64748b' }}>
            {label}
        </Typography.Text>
        <Typography.Text className="text-sm font-medium" style={{ color: '#1e293b' }}>
            {value}
        </Typography.Text>
    </div>
);

const Gstr2bDataPanel = ({
    search,
    onSearchChange,
    matchFilter,
    onMatchFilterChange,
    activeTab,
    onTabChange,
    filtered,
    expandedKeys,
    onExpand,
    b2baRows: b2baRowsProp,
    cdnRows: cdnRowsProp,
    impgRows: impgRowsProp,
    isdRows: isdRowsProp,
    tdsRows: tdsRowsProp,
    tcsRows: tcsRowsProp,
    amdRows: amdRowsProp,
}: Props) => {
    const applyFilter = <T extends { status: string }>(rows: T[]) =>
        matchFilter === 'all' ? rows : rows.filter(r => r.status === matchFilter);

    const effectiveB2baRows = applyFilter(b2baRowsProp ?? []);
    const effectiveCdnRows = applyFilter(cdnRowsProp ?? []);
    const effectiveImpgRows = applyFilter(impgRowsProp ?? []);
    const effectiveIsdRows = applyFilter(isdRowsProp ?? []);
    const effectiveTdsRows = applyFilter(tdsRowsProp ?? []);
    const effectiveTcsRows = applyFilter(tcsRowsProp ?? []);

    const TAB_COUNTS: Record<TabKey, number> = {
        B2B: filtered.length,
        B2BA: effectiveB2baRows.length,
        CDN: effectiveCdnRows.length,
        IMPG: effectiveImpgRows.length,
        ISD: effectiveIsdRows.length,
        TDS: effectiveTdsRows.length,
        TCS: effectiveTcsRows.length,
        AMD: (amdRowsProp ?? []).length,
    };

    const chevronCol: ColumnsType<any>[0] = {
        key: 'chevron',
        width: 48,
        render: (_: any, record: any) => (
            <div style={{ textAlign: 'center', color: '#475569' }}>
                {expandedKeys.includes(record.id) ? (
                    <UpOutlined style={{ fontSize: 12 }} />
                ) : (
                    <DownOutlined style={{ fontSize: 12 }} />
                )}
            </div>
        ),
    };

    const expandConfig = { ...expandBase, expandedRowKeys: expandedKeys, onExpand };

    return (
        <div
            className="border border-[#cbd5e1] rounded-[20px] overflow-hidden bg-white [&_.ant-table-thead_th]:whitespace-nowrap"
            style={{ flex: '1 1 320px', minWidth: 0 }}
        >
            {/* Filters row */}
            <div className="px-6 py-5">
                <Flex gap={16} align="flex-end" wrap="wrap">
                    <Flex vertical gap={6} className="flex-1">
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#1e293b' }}
                        >
                            Search Supplier / Invoice
                        </Typography.Text>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#a1a1aa' }} />}
                            placeholder="Search supplier name, GSTIN or invoice no…"
                            value={search}
                            onChange={e =>
                                onSearchChange(
                                    e.target.value.replace(/\p{Emoji_Presentation}/gu, '')
                                )
                            }
                            allowClear
                            style={{ height: 40 }}
                        />
                    </Flex>

                    <Flex vertical gap={6}>
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#1e293b' }}
                        >
                            Match Status
                        </Typography.Text>
                        <div
                            className="flex items-center border border-[#e4e4e7] rounded-lg px-2 gap-1"
                            style={{ height: 41, backgroundColor: 'white' }}
                        >
                            {MATCH_FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    type="button"
                                    className="px-4 rounded-md text-sm font-normal transition-colors whitespace-nowrap"
                                    style={{
                                        height: 30,
                                        backgroundColor:
                                            matchFilter === f.key ? '#fef2f2' : 'transparent',
                                        color: matchFilter === f.key ? '#ff4f4f' : '#475569',
                                        border: 'none',
                                    }}
                                    onClick={() => onMatchFilterChange(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </Flex>
                </Flex>
            </div>

            {/* Tab bar */}
            <div className="border-t border-[#e2e8f0] overflow-x-auto">
                <div className="flex" style={{ minWidth: 'max-content' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className="flex-shrink-0 flex items-center justify-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                            style={{
                                color: activeTab === tab.key ? '#ff4f4f' : '#475569',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `2px solid ${activeTab === tab.key ? '#ff4f4f' : 'transparent'}`,
                            }}
                        >
                            {tab.label}
                            <span
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: activeTab === tab.key ? '#fef2f2' : '#f1f5f9',
                                    color: activeTab === tab.key ? '#ff4f4f' : '#64748b',
                                }}
                            >
                                {TAB_COUNTS[tab.key]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table section title */}
            <div className="px-4 sm:px-6 py-3 border-t border-[#e2e8f0] flex flex-wrap items-center gap-2 justify-between">
                <Flex gap={8} align="center">
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 18, color: '#1e293b' }}
                    >
                        {TAB_TITLES[activeTab]}
                    </Typography.Text>
                    <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                        ({TAB_COUNTS[activeTab]} records)
                    </Typography.Text>
                </Flex>
                {!['AMD', 'TCS', 'TDS', 'ISD'].includes(activeTab) && (
                    <Typography.Text
                        className="text-xs hidden sm:block"
                        style={{ color: '#475569' }}
                    >
                        Click any row to expand invoice details
                    </Typography.Text>
                )}
            </div>

            {/* B2B */}
            {activeTab === 'B2B' && (
                <Table
                    columns={[...b2bColumns, chevronCol]}
                    dataSource={filtered}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bRow) => (
                            <div className="bg-[#f8fafc] px-6 py-5">
                                <div
                                    className="grid gap-6"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    }}
                                >
                                    <div>
                                        <Typography.Text
                                            className="text-sm font-semibold mb-5 block"
                                            style={{ color: '#1e293b' }}
                                        >
                                            Invoice Details
                                        </Typography.Text>
                                        <div className="flex flex-col gap-3 mt-3">
                                            {[
                                                { label: 'Invoice No', value: record.invoiceNo },
                                                {
                                                    label: 'Invoice Date',
                                                    value: record.invoiceDate,
                                                },
                                                { label: 'Supplier GSTIN', value: record.gstin },
                                                {
                                                    label: 'Place of Supply',
                                                    value: record.placeOfSupply,
                                                },
                                                {
                                                    label: 'Reverse Charge',
                                                    value: record.reverseCharge ? 'Yes' : 'No',
                                                },
                                                {
                                                    label: 'Taxable Value',
                                                    value: `₹${fmt(record.taxable)}`,
                                                },
                                            ].map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="flex justify-between gap-4"
                                                >
                                                    <Typography.Text
                                                        className="text-xs"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-xs font-medium"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {value}
                                                    </Typography.Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <Typography.Text
                                            className="text-sm font-semibold mb-5 block"
                                            style={{ color: '#1e293b' }}
                                        >
                                            Tax Breakdown
                                        </Typography.Text>
                                        <div className="flex flex-col gap-2 mt-3">
                                            {[
                                                { label: 'IGST', value: `₹${fmt(record.igst)}` },
                                                { label: 'CGST', value: `₹${fmt(record.cgst)}` },
                                                {
                                                    label: 'SGST/UTGST',
                                                    value: `₹${fmt(record.sgst)}`,
                                                },
                                                { label: 'Cess', value: `₹${fmt(record.cess)}` },
                                                {
                                                    label: 'Total Tax',
                                                    value: `₹${fmt(record.totalTax)}`,
                                                },
                                                {
                                                    label: 'Invoice Value',
                                                    value: `₹${fmt(record.invoiceValue)}`,
                                                },
                                            ].map(({ label, value }) => (
                                                <div
                                                    key={label}
                                                    className="flex justify-between gap-4"
                                                >
                                                    <Typography.Text
                                                        className="text-xs"
                                                        style={{ color: '#64748b' }}
                                                    >
                                                        {label}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        className="text-xs font-medium"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        {value}
                                                    </Typography.Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <Typography.Text
                                            className="text-sm font-semibold mb-5 block"
                                            style={{ color: '#1e293b' }}
                                        >
                                            Reconciliation
                                        </Typography.Text>
                                        <div className="flex flex-col gap-3">
                                            <div
                                                className="flex items-center gap-2 rounded-lg px-3 py-2"
                                                style={{
                                                    backgroundColor: '#ecfdf5',
                                                    border: '1px solid #81cf92',
                                                }}
                                            >
                                                <CheckCircleFilled
                                                    style={{ color: '#43b75d', fontSize: 14 }}
                                                />
                                                <Typography.Text
                                                    className="text-xs font-medium"
                                                    style={{ color: '#43b75d' }}
                                                >
                                                    Matched with purchase ledger
                                                </Typography.Text>
                                            </div>
                                            {/* <div className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                <CheckOutlined style={{ color: '#475569', fontSize: 14 }} />
                                                <Typography.Text className="text-xs font-medium" style={{ color: '#475569' }}>Mark as reviewed</Typography.Text>
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* B2BA */}
            {activeTab === 'B2BA' && (
                <Table
                    columns={[...b2baColumns, chevronCol]}
                    dataSource={effectiveB2baRows}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bB2baRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        {
                                            label: 'Taxable Value',
                                            orig: record.origTaxable,
                                            amend: record.amendTaxable,
                                        },
                                        {
                                            label: 'IGST',
                                            orig: record.origIgst,
                                            amend: record.amendIgst,
                                        },
                                        {
                                            label: 'CGST',
                                            orig: record.origCgst,
                                            amend: record.amendCgst,
                                        },
                                        {
                                            label: 'SGST',
                                            orig: record.origSgst,
                                            amend: record.amendSgst,
                                        },
                                    ].map(({ label, orig, amend }) => {
                                        const delta = amend - orig;
                                        return (
                                            <div
                                                key={label}
                                                className="bg-white rounded-lg px-4 py-3 border border-[#e2e8f0]"
                                            >
                                                <Typography.Text
                                                    className="text-xs font-semibold block mb-2"
                                                    style={{ color: '#64748b' }}
                                                >
                                                    {label}
                                                </Typography.Text>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Typography.Text
                                                        className="text-sm"
                                                        style={{ color: '#475569' }}
                                                    >
                                                        ₹{(orig ?? 0).toFixed(2)}
                                                    </Typography.Text>
                                                    <span
                                                        style={{ color: '#94a3b8', fontSize: 14 }}
                                                    >
                                                        →
                                                    </span>
                                                    <Typography.Text
                                                        className="text-sm font-semibold"
                                                        style={{ color: '#1e293b' }}
                                                    >
                                                        ₹{(amend ?? 0).toFixed(2)}
                                                    </Typography.Text>
                                                </div>
                                                {delta !== 0 && (
                                                    <Typography.Text
                                                        className="text-xs mt-1 block"
                                                        style={{
                                                            color:
                                                                delta > 0 ? '#43b75d' : '#ef4444',
                                                        }}
                                                    >
                                                        {delta > 0 ? '+' : ''}
                                                        {Math.abs(delta).toFixed(2)}
                                                    </Typography.Text>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* CDN */}
            {activeTab === 'CDN' && (
                <Table
                    columns={[...cdnColumns, chevronCol]}
                    dataSource={effectiveCdnRows}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bCdnRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        { label: 'Supplier Name', value: record.supplierName },
                                        { label: 'Supplier GSTIN', value: record.gstin },
                                        { label: 'Note No', value: record.noteNo },
                                        { label: 'Note Date', value: record.noteDate },
                                        { label: 'Note Type', value: record.noteType },
                                        { label: 'ITC (₹)', value: `₹${fmt(record.itc)}` },
                                        { label: 'Status', value: record.status },
                                    ].map(({ label, value }) => (
                                        <DetailCard key={label} label={label} value={value} />
                                    ))}
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* IMPG */}
            {activeTab === 'IMPG' && (
                <Table
                    columns={[...impgColumns, chevronCol]}
                    dataSource={effectiveImpgRows}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bImpgRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        {
                                            label: 'Supplier Name',
                                            value: record.supplierName || '—',
                                        },
                                        { label: 'Bill of Entry No.', value: record.billNo },
                                        { label: 'B/E Date', value: record.billDate },
                                        { label: 'Port Code', value: record.portCode },
                                        {
                                            label: 'Assessable Value (₹)',
                                            value: `₹${fmt(record.taxable)}`,
                                        },
                                        { label: 'IGST Paid (₹)', value: `₹${fmt(record.igst)}` },
                                        {
                                            label: 'Cess (₹)',
                                            value: record.cess ? `₹${fmt(record.cess)}` : '—',
                                        },
                                        { label: 'Status', value: record.status },
                                    ].map(({ label, value }) => (
                                        <DetailCard key={label} label={label} value={value} />
                                    ))}
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* ISD */}
            {activeTab === 'ISD' && (
                <Table
                    columns={[...isdColumns, chevronCol]}
                    dataSource={effectiveIsdRows}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bIsdRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        { label: 'ISD Name', value: record.isdName },
                                        { label: 'ISD GSTIN', value: record.isdGstin },
                                        { label: 'Document Type', value: record.docType },
                                        { label: 'Document No.', value: record.docNo },
                                        { label: 'Document Date', value: record.docDate },
                                        {
                                            label: 'IGST (₹)',
                                            value: record.igst ? `₹${fmt(record.igst)}` : '—',
                                        },
                                        {
                                            label: 'CGST (₹)',
                                            value: record.cgst ? `₹${fmt(record.cgst)}` : '—',
                                        },
                                        {
                                            label: 'SGST (₹)',
                                            value: record.sgst ? `₹${fmt(record.sgst)}` : '—',
                                        },
                                        {
                                            label: 'Cess (₹)',
                                            value: record.cess ? `₹${fmt(record.cess)}` : '—',
                                        },
                                    ].map(({ label, value }) => (
                                        <DetailCard key={label} label={label} value={value} />
                                    ))}
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* TDS */}
            {activeTab === 'TDS' && (
                <Table
                    columns={[...tdsColumns, chevronCol]}
                    dataSource={effectiveTdsRows}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bTdsRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        { label: 'Deductor GSTIN', value: record.deductorGstin },
                                        {
                                            label: 'Deductor Name',
                                            value: record.deductorName || '—',
                                        },
                                        {
                                            label: 'TDS Amount (₹)',
                                            value: `₹${fmt(record.tdsAmount)}`,
                                        },
                                        { label: 'Period', value: record.period || '—' },
                                        {
                                            label: 'Cash Ledger Credit (₹)',
                                            value: `₹${fmt(record.cashLedgerCredit)}`,
                                        },
                                    ].map(({ label, value }) => (
                                        <DetailCard key={label} label={label} value={value} />
                                    ))}
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* TCS */}
            {activeTab === 'TCS' && (
                <Table
                    columns={[...tcsColumns, chevronCol]}
                    dataSource={effectiveTcsRows}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bTcsRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        {
                                            label: 'E-Commerce Operator',
                                            value: record.operatorName,
                                        },
                                        { label: 'ECO GSTIN', value: record.ecoGstin },
                                        {
                                            label: 'Supplies through ECO (₹)',
                                            value: `₹${fmt(record.suppliesValue)}`,
                                        },
                                        {
                                            label: 'TCS Collected (₹)',
                                            value: `₹${fmt(record.tcsCollected)}`,
                                        },
                                        { label: 'Period', value: record.period || '—' },
                                    ].map(({ label, value }) => (
                                        <DetailCard key={label} label={label} value={value} />
                                    ))}
                                </div>
                            </div>
                        ),
                    }}
                />
            )}

            {/* AMD */}
            {activeTab === 'AMD' && (
                <Table
                    columns={[...amdColumns, chevronCol]}
                    dataSource={amdRowsProp ?? []}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                        ...expandConfig,
                        expandedRowRender: (record: Gstr2bAmdRow) => (
                            <div className="bg-[#f8fafc] px-6 py-4">
                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    }}
                                >
                                    {[
                                        { label: 'Original Document', value: record.originalDoc },
                                        { label: 'Amendment Type', value: record.amendmentType },
                                        { label: 'Changed By', value: record.changedBy },
                                        { label: 'Change Date', value: record.changeDate },
                                        {
                                            label: 'ITC Impact (₹)',
                                            value: `${record.itcSign}₹${fmt(record.itcImpact)}`,
                                        },
                                    ].map(({ label, value }) => (
                                        <DetailCard key={label} label={label} value={value} />
                                    ))}
                                    <div
                                        className="bg-white rounded-lg px-4 py-3 border border-[#e2e8f0]"
                                        style={{ gridColumn: '1 / -1' }}
                                    >
                                        <Typography.Text
                                            className="text-xs block mb-1"
                                            style={{ color: '#64748b' }}
                                        >
                                            What Changed
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: '#475569', lineHeight: '1.6' }}
                                        >
                                            {record.whatChanged}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </div>
                        ),
                    }}
                />
            )}
        </div>
    );
};

export default Gstr2bDataPanel;
