import { useState } from 'react';

import {
    CheckCircleFilled,
    DownOutlined,
    // IdcardOutlined,
    PlusOutlined,
    SearchOutlined,
    UpOutlined,
    // UserOutlined,
} from '@ant-design/icons';
import { Button, Flex, Input, Typography } from 'antd';

import useAddToCustomers from '../hooks/useAddToCustomers';
import useAddToSuppliers from '../hooks/useAddToSuppliers';
import useGstinSearch from '../hooks/useGstinSearch';
import usePanSearch from '../hooks/usePanSearch';

type SearchMode = 'gstin' | 'pan';

interface GstinResult {
    gstin: string;
    name: string;
    tradeName: string;
    taxpayerType: string;
    state: string;
    stateCode: string;
    registrationDate: string;
    status: 'Active' | 'Inactive' | 'Cancelled';
    address: string;
    primaryAddress: string;
    primaryCity: string;
    primaryPincode: string;
}

interface PanGstinRow {
    gstin: string;
    state: string;
    registrationDate: string;
    status: 'Active' | 'Inactive' | 'Cancelled';
    companyName: string;
    taxpayerType: string;
    pan: string;
    address: string;
    primaryAddress: string;
    primaryCity: string;
    primaryPincode: string;
}

interface PanResult {
    pan: string;
    gstins: PanGstinRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusStyle = (status: string) => {
    if (status === 'Active') return { backgroundColor: '#ecfdf5', color: '#16a34a' };
    if (status === 'Cancelled') return { backgroundColor: '#fef2f2', color: '#ef4444' };
    return { backgroundColor: '#f1f5f9', color: '#475569' };
};

const StatusBadge = ({ status }: { status: string }) => (
    <span
        style={{
            ...getStatusStyle(status),
            borderRadius: 60,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 500,
        }}
    >
        {status}
    </span>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptyState = ({ mode }: { mode: SearchMode }) => (
    <Flex vertical align="center" justify="center" gap={12} style={{ minHeight: 220 }}>
        <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, backgroundColor: '#f1f5f9' }}
        >
            <SearchOutlined style={{ fontSize: 32, color: '#94a3b8' }} />
        </div>
        <Flex vertical align="center" gap={4}>
            <Typography.Text
                className="font-medium text-center"
                style={{ fontSize: 15, color: '#1e293b' }}
            >
                {mode === 'gstin'
                    ? 'Enter a GSTIN to verify and fetch details'
                    : 'Enter a PAN to verify and fetch details'}
            </Typography.Text>
            <Typography.Text className="text-xs text-center" style={{ color: '#94a3b8' }}>
                {mode === 'gstin'
                    ? 'Supports all registered taxpayers on GST portal'
                    : 'Fetches all GSTINs registered under this PAN'}
            </Typography.Text>
        </Flex>
    </Flex>
);

const GstinFormatGuide = () => (
    <div className="border border-[#e2e8f0] rounded-[10px] overflow-hidden mt-4">
        <div className="px-4 py-3 bg-[#fafbfb] border-b border-[#eaecf0]">
            <Typography.Text className="text-xs font-semibold" style={{ color: '#42526d' }}>
                GSTIN Format
            </Typography.Text>
        </div>
        <div className="px-4 py-3">
            <div className="flex gap-[3px] mb-3 flex-wrap">
                {['27', 'AABCS', '1429', 'B', '1', 'Z', '0'].map((seg, i) => (
                    <span
                        key={i}
                        className="text-xs font-mono font-bold px-2 py-1 rounded"
                        style={{
                            backgroundColor: [
                                '#fef2f2',
                                '#eff6ff',
                                '#f0fdf4',
                                '#fffbeb',
                                '#fdf4ff',
                                '#eff6ff',
                                '#fef2f2',
                            ][i],
                            color: [
                                '#dc2626',
                                '#3b82f6',
                                '#16a34a',
                                '#f59e0b',
                                '#9333ea',
                                '#3b82f6',
                                '#dc2626',
                            ][i],
                        }}
                    >
                        {seg}
                    </span>
                ))}
            </div>
            <Flex vertical gap={4}>
                {[
                    ['27', 'State Code'],
                    ['AABCS', 'First 5 chars of PAN'],
                    ['1429', 'Entity Registration No.'],
                    ['B', 'Entity Type'],
                    ['1', 'Default (1)'],
                    ['Z', 'Default (Z)'],
                    ['0', 'Check Digit'],
                ].map(([code, label]) => (
                    <Flex key={code} gap={8} align="center">
                        <Typography.Text
                            className="text-xs font-mono font-semibold"
                            style={{ color: '#475569', minWidth: 44 }}
                        >
                            {code}
                        </Typography.Text>
                        <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                            — {label}
                        </Typography.Text>
                    </Flex>
                ))}
            </Flex>
        </div>
    </div>
);

// ─── GSTIN Result Card ────────────────────────────────────────────────────────

const GstinResultCard = ({
    result,
    onAddToSuppliers,
    onAddToCustomers,
    isAdding,
    isAddingSupplier,
    customerAdded,
    supplierAdded,
}: {
    result: GstinResult;
    onAddToSuppliers: () => void;
    onAddToCustomers: () => void;
    isAdding: boolean;
    isAddingSupplier: boolean;
    customerAdded: boolean;
    supplierAdded: boolean;
}) => (
    <div className="border border-[#bbf7d0] rounded-[14px] overflow-hidden bg-white">
        <Flex
            align="center"
            justify="space-between"
            wrap="wrap"
            gap={8}
            className="px-4 sm:px-6 py-4 border-b border-[#e2e8f0]"
            style={{ backgroundColor: '#f0fdf4' }}
        >
            <Flex gap={10} align="center">
                <CheckCircleFilled style={{ fontSize: 20, color: '#16a34a' }} />
                <Flex vertical gap={2}>
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 16, color: '#16a34a' }}
                    >
                        GSTIN Verified
                    </Typography.Text>
                    <Typography.Text className="text-xs font-mono" style={{ color: '#16a34a' }}>
                        {result.gstin}
                    </Typography.Text>
                </Flex>
            </Flex>
            <StatusBadge status={result.status} />
        </Flex>

        <div className="px-6 py-5">
            <Flex vertical gap={4} className="mb-5">
                <Typography.Text className="font-bold" style={{ fontSize: 18, color: '#1e293b' }}>
                    {result.name}
                </Typography.Text>
                <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                    {result.tradeName}
                </Typography.Text>
            </Flex>

            <div className="grid gap-y-4 gap-x-6 grid-cols-2 sm:grid-cols-3">
                {[
                    { label: 'GSTIN', value: result.gstin, mono: true },
                    { label: 'Taxpayer Type', value: result.taxpayerType, mono: false },
                    { label: 'State', value: `${result.state} (${result.stateCode})`, mono: false },
                    { label: 'Registration Date', value: result.registrationDate, mono: false },
                    { label: 'Status', value: result.status, badge: true },
                ].map(({ label, value, mono, badge }) => (
                    <Flex key={label} vertical gap={3}>
                        <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
                            {label}
                        </Typography.Text>
                        {badge ? (
                            <StatusBadge status={value} />
                        ) : (
                            <Typography.Text
                                className={`text-sm font-medium${mono ? ' font-mono' : ''}`}
                                style={{ color: '#1e293b' }}
                            >
                                {value}
                            </Typography.Text>
                        )}
                    </Flex>
                ))}
            </div>

            <div className="border-t border-[#f1f5f9] mt-5 pt-4">
                <Typography.Text className="text-xs block mb-1" style={{ color: '#94a3b8' }}>
                    Registered Address
                </Typography.Text>
                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                    {result.address}
                </Typography.Text>
            </div>

            <Flex gap={10} wrap="wrap" className="mt-5">
                {!supplierAdded && (
                    <Button
                        icon={<PlusOutlined />}
                        style={{ borderColor: '#e2e8f0', color: '#475569', height: 36 }}
                        size="small"
                        loading={isAddingSupplier}
                        onClick={onAddToSuppliers}
                    >
                        Add to Suppliers
                    </Button>
                )}
                {!customerAdded && (
                    <Button
                        icon={<PlusOutlined />}
                        style={{ borderColor: '#e2e8f0', color: '#475569', height: 36 }}
                        size="small"
                        loading={isAdding}
                        onClick={onAddToCustomers}
                    >
                        Add to Customers
                    </Button>
                )}
                {/* <Button icon={<FileTextOutlined />} style={{ borderColor: '#e2e8f0', color: '#475569', height: 36 }} size="small" onClick={onCreditReturn}>Credit Return</Button> */}
                {/* <Button icon={<ExportOutlined />} style={{ borderColor: '#e2e8f0', color: '#475569', height: 36 }} size="small" onClick={onExport}>Export</Button> */}
            </Flex>
        </div>
    </div>
);

// ─── PAN Result ───────────────────────────────────────────────────────────────

const PanResultCard = ({ result }: { result: PanResult }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0]));
    const [addingCustomerIndex, setAddingCustomerIndex] = useState<number | null>(null);
    const [addingSupplierIndex, setAddingSupplierIndex] = useState<number | null>(null);
    const [addedCustomerRows, setAddedCustomerRows] = useState<Set<number>>(new Set());
    const [addedSupplierRows, setAddedSupplierRows] = useState<Set<number>>(new Set());
    const { addToCustomers } = useAddToCustomers();
    const { addToSuppliers } = useAddToSuppliers();

    const handleAddToCustomers = async (row: PanGstinRow, i: number) => {
        setAddingCustomerIndex(i);
        const success = await addToCustomers({
            name: row.companyName,
            gstin: row.gstin,
            phoneNumber: '',
            primaryAddress: row.primaryAddress,
            primaryCity: row.primaryCity,
            primaryState: row.state,
            primaryPincode: row.primaryPincode,
            primaryCountry: 'India',
        });
        if (success) setAddedCustomerRows(prev => new Set(prev).add(i));
        setAddingCustomerIndex(null);
    };

    const handleAddToSuppliers = async (row: PanGstinRow, i: number) => {
        setAddingSupplierIndex(i);
        const success = await addToSuppliers({
            businessName: row.companyName,
            gstin: row.gstin,
            contactPerson: row.companyName,
            email: '',
            tags: [],
            paymentTerms: '',
            status: 'Active',
        });
        if (success) setAddedSupplierRows(prev => new Set(prev).add(i));
        setAddingSupplierIndex(null);
    };

    const toggle = (i: number) =>
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(i)) {
                next.delete(i);
            } else {
                next.add(i);
            }
            return next;
        });

    return (
        <div className="border border-[#e2e8f0] rounded-[14px] bg-white">
            {/* Header */}
            <Flex
                align="center"
                justify="space-between"
                className="px-5 py-4 border-b border-[#eaecf0]"
            >
                <Flex vertical gap={2}>
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 15, color: '#1e293b' }}
                    >
                        GSTINs linked to PAN
                    </Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
                        {result.gstins.length} registrations found
                    </Typography.Text>
                </Flex>
                {/* <Button icon={<ExportOutlined />} size="small" style={{ borderColor: '#e2e8f0', color: '#475569', height: 32 }}>Export</Button> */}
            </Flex>

            {/* Table header */}
            <div className="overflow-x-auto">
                <div
                    className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                    style={{ gridTemplateColumns: '2fr 1.5fr 1.2fr 0.8fr 1fr 40px', minWidth: 560 }}
                >
                    {['GSTIN', 'State', 'Registration Date', 'Status', '', ''].map((h, i) => (
                        <div
                            key={i}
                            className="px-4 py-3 text-xs font-semibold whitespace-nowrap"
                            style={{ color: '#42526d' }}
                        >
                            {h}
                        </div>
                    ))}
                </div>

                {result.gstins.map((row, i) => {
                    const isOpen = expandedRows.has(i);
                    return (
                        <div
                            key={i}
                            className="border-b border-[#eaecf0] last:border-b-0"
                            style={{ minWidth: 560 }}
                        >
                            {/* Main row */}
                            <div
                                className="grid items-center hover:bg-[#fafafa] cursor-pointer"
                                style={{
                                    gridTemplateColumns: '2fr 1.5fr 1.2fr 0.8fr 1fr 40px',
                                    minHeight: 52,
                                    minWidth: 560,
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggle(i)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') toggle(i);
                                }}
                            >
                                <div className="px-4 py-3">
                                    <Typography.Text
                                        className="text-sm font-mono font-medium whitespace-nowrap"
                                        style={{ color: '#1e293b' }}
                                    >
                                        {row.gstin}
                                    </Typography.Text>
                                </div>
                                <div className="px-4 py-3">
                                    <Typography.Text
                                        className="text-sm whitespace-nowrap"
                                        style={{ color: '#475569' }}
                                    >
                                        {row.state}
                                    </Typography.Text>
                                </div>
                                <div className="px-4 py-3">
                                    <Typography.Text
                                        className="text-sm whitespace-nowrap"
                                        style={{ color: '#475569' }}
                                    >
                                        {row.registrationDate}
                                    </Typography.Text>
                                </div>
                                <div className="px-4 py-3">
                                    <StatusBadge status={row.status} />
                                </div>
                                <div
                                    role="none"
                                    className="px-2 py-3 flex items-center gap-2"
                                    onClick={e => e.stopPropagation()}
                                    onKeyDown={e => e.stopPropagation()}
                                >
                                    {!addedSupplierRows.has(i) && (
                                        <Button
                                            icon={<PlusOutlined />}
                                            size="small"
                                            style={{
                                                borderColor: '#e2e8f0',
                                                color: '#475569',
                                                height: 28,
                                                fontSize: 11,
                                            }}
                                            loading={addingSupplierIndex === i}
                                            onClick={() => handleAddToSuppliers(row, i)}
                                        >
                                            Add to Suppliers
                                        </Button>
                                    )}
                                    {!addedCustomerRows.has(i) && (
                                        <Button
                                            icon={<PlusOutlined />}
                                            size="small"
                                            style={{
                                                borderColor: '#e2e8f0',
                                                color: '#475569',
                                                height: 28,
                                                fontSize: 11,
                                            }}
                                            loading={addingCustomerIndex === i}
                                            onClick={() => handleAddToCustomers(row, i)}
                                        >
                                            Add to Customers
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-center">
                                    {isOpen ? (
                                        <UpOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                                    ) : (
                                        <DownOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                                    )}
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isOpen && (
                                <div className="border-t border-[#eaecf0] bg-[#fafbfc] px-4 py-4">
                                    <Flex align="center" justify="space-between" className="mb-3">
                                        <Flex vertical gap={2}>
                                            <Typography.Text
                                                className="font-semibold text-sm"
                                                style={{ color: '#1e293b' }}
                                            >
                                                {row.companyName}
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-xs"
                                                style={{ color: '#64748b' }}
                                            >
                                                {row.taxpayerType} · {row.state.split(' ')[0]}
                                            </Typography.Text>
                                        </Flex>
                                        <StatusBadge status={row.status} />
                                    </Flex>
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                        <Flex vertical gap={2}>
                                            <Typography.Text
                                                className="text-xs"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                Reg. Date
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm font-medium"
                                                style={{ color: '#1e293b' }}
                                            >
                                                {row.registrationDate}
                                            </Typography.Text>
                                        </Flex>
                                        <Flex vertical gap={2}>
                                            <Typography.Text
                                                className="text-xs"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                PAN
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm font-medium font-mono"
                                                style={{ color: '#1e293b' }}
                                            >
                                                {row.pan}
                                            </Typography.Text>
                                        </Flex>
                                        <Flex vertical gap={2}>
                                            <Typography.Text
                                                className="text-xs"
                                                style={{ color: '#94a3b8' }}
                                            >
                                                Address
                                            </Typography.Text>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#475569' }}
                                            >
                                                {row.address}
                                            </Typography.Text>
                                        </Flex>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const GstinLookupPage = () => {
    const [mode] = useState<SearchMode>('gstin');
    const [gstinInput, setGstinInput] = useState('');
    const [panInput, setPanInput] = useState('');
    const [customerAdded, setCustomerAdded] = useState(false);
    const [supplierAdded, setSupplierAdded] = useState(false);

    const { result: apiResult, isSearching, search } = useGstinSearch();
    const { addToCustomers, isAdding } = useAddToCustomers();
    const { addToSuppliers, isAdding: isAddingSupplier } = useAddToSuppliers();
    const { businesses, isSearching: isPanSearching, search: panSearch } = usePanSearch();

    const panResult: PanResult | null =
        businesses.length > 0
            ? {
                  pan: panInput,
                  gstins: businesses.map(b => ({
                      gstin: b.gstin,
                      state: b.state || '',
                      registrationDate: b.registrationDate || '',
                      status: (['Active', 'Inactive', 'Cancelled'].includes(b.status)
                          ? b.status
                          : 'Inactive') as PanGstinRow['status'],
                      companyName: b.legalName || b.tradeName || '',
                      taxpayerType: b.taxpayerType || '',
                      pan: panInput,
                      address: [b.primaryAddress, b.primaryCity, b.primaryPincode]
                          .filter(Boolean)
                          .join(', '),
                      primaryAddress: b.primaryAddress,
                      primaryCity: b.primaryCity,
                      primaryPincode: b.primaryPincode,
                  })),
              }
            : null;

    const gstinResult: GstinResult | null = apiResult
        ? {
              gstin: apiResult.gstin,
              name: apiResult.lgnm,
              tradeName: apiResult.tradeNam,
              taxpayerType: apiResult.ctb,
              state: apiResult.stj,
              stateCode: apiResult.gstin.substring(0, 2),
              registrationDate: apiResult.rgdt,
              status: apiResult.sts as 'Active' | 'Inactive' | 'Cancelled',
              address: [
                  apiResult.pradr?.addr?.loc,
                  apiResult.pradr?.addr?.st,
                  apiResult.pradr?.addr?.pncd,
              ]
                  .filter(Boolean)
                  .join(', '),
              primaryAddress: [
                  apiResult.pradr?.addr?.bnm,
                  apiResult.pradr?.addr?.bno,
                  apiResult.pradr?.addr?.flno,
                  apiResult.pradr?.addr?.st,
              ]
                  .filter(Boolean)
                  .join(', '),
              primaryCity: apiResult.pradr?.addr?.loc || '',
              primaryPincode: apiResult.pradr?.addr?.pncd || '',
          }
        : null;

    const handleGstinSearch = () => {
        if (!gstinInput.trim()) return;
        setCustomerAdded(false);
        search(gstinInput.trim());
    };

    const handlePanSearch = () => {
        if (!panInput.trim()) return;
        panSearch(panInput.trim());
    };

    // const switchMode = (m: SearchMode) => {
    //     setMode(m);
    //     clear();
    //     clearPan();
    //     setGstinInput('');
    //     setPanInput('');
    // };

    return (
        <Flex vertical gap={20}>
            {/* Page title */}
            <Typography.Text className="font-bold" style={{ fontSize: 22, color: '#1e293b' }}>
                GSTIN Lookup
            </Typography.Text>

            {/* Mode toggle — PAN search disabled (state_code required by vendor API, not yet supported in UI) */}
            {/* <Flex gap={0} className="border border-[#e2e8f0] rounded-[10px] overflow-hidden w-fit bg-white">
                <button
                    type="button"
                    onClick={() => switchMode('gstin')}
                    className="flex items-center gap-2 px-5 py-[10px] text-sm font-medium transition-colors"
                    style={{
                        backgroundColor: mode === 'gstin' ? '#fef2f2' : 'white',
                        color: mode === 'gstin' ? '#ff4f4f' : '#475569',
                        border: 'none',
                        cursor: 'pointer',
                        borderRight: '1px solid #e2e8f0',
                    }}
                >
                    <UserOutlined style={{ fontSize: 14 }} />
                    Search by GSTIN
                </button>
                <button
                    type="button"
                    onClick={() => switchMode('pan')}
                    className="flex items-center gap-2 px-5 py-[10px] text-sm font-medium transition-colors"
                    style={{
                        backgroundColor: mode === 'pan' ? '#fef2f2' : 'white',
                        color: mode === 'pan' ? '#ff4f4f' : '#475569',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <IdcardOutlined style={{ fontSize: 14 }} />
                    Search by PAN
                </button>
            </Flex> */}

            {/* Search card with gradient background */}
            <div
                className="rounded-[14px] px-4 sm:px-8 py-5 sm:py-8"
                style={{
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #fff0f0 100%)',
                }}
            >
                <Flex gap={12} align="center">
                    <Input
                        allowClear
                        placeholder={
                            mode === 'gstin'
                                ? 'Enter GSTIN (e.g. 27AABCS1429B1Z0)'
                                : 'Enter PAN (e.g. AAPFU0939F)'
                        }
                        value={mode === 'gstin' ? gstinInput : panInput}
                        onChange={e => {
                            const val = e.target.value
                                .replace(/[^a-zA-Z0-9]/g, '')
                                .toUpperCase();
                            if (mode === 'gstin') {
                                setGstinInput(val);
                            } else {
                                setPanInput(val);
                            }
                        }}
                        onKeyDown={e => {
                            if (e.key !== 'Enter') return;
                            if (mode === 'gstin') {
                                handleGstinSearch();
                            } else {
                                handlePanSearch();
                            }
                        }}
                        maxLength={mode === 'gstin' ? 15 : 10}
                        style={{ height: 40, fontSize: 14, color: '#1e293b', flex: 1 }}
                    />
                    <Button
                        type="primary"
                        danger
                        loading={mode === 'gstin' ? isSearching : isPanSearching}
                        style={{ height: 50, fontWeight: 500, fontSize: 15 }}
                        className="w-full sm:w-auto sm:px-8"
                        onClick={mode === 'gstin' ? handleGstinSearch : handlePanSearch}
                    >
                        Search
                    </Button>
                </Flex>
            </div>

            {/* Main layout: content + sidebar */}
            <Flex gap={16} align="flex-start">
                {/* Left content */}
                <div className="flex-1 min-w-0">
                    {mode === 'gstin' && !gstinResult && (
                        <>
                            <EmptyState mode="gstin" />
                            <GstinFormatGuide />
                        </>
                    )}
                    {mode === 'gstin' && gstinResult && (
                        <GstinResultCard
                            result={gstinResult}
                            onAddToSuppliers={async () => {
                                const success = await addToSuppliers({
                                    businessName: gstinResult.name,
                                    gstin: gstinResult.gstin,
                                    contactPerson: gstinResult.name,
                                    email: '',
                                    tags: [],
                                    paymentTerms: '',
                                    status: 'Active',
                                });
                                if (success) setSupplierAdded(true);
                            }}
                            onAddToCustomers={async () => {
                                const success = await addToCustomers({
                                    name: gstinResult.name,
                                    gstin: gstinResult.gstin,
                                    phoneNumber: '',
                                    primaryAddress: gstinResult.primaryAddress,
                                    primaryCity: gstinResult.primaryCity,
                                    primaryState: gstinResult.state,
                                    primaryPincode: gstinResult.primaryPincode,
                                    primaryCountry: 'India',
                                });
                                if (success) setCustomerAdded(true);
                            }}
                            isAdding={isAdding}
                            isAddingSupplier={isAddingSupplier}
                            customerAdded={customerAdded}
                            supplierAdded={supplierAdded}
                        />
                    )}
                    {mode === 'pan' && !panResult && <EmptyState mode="pan" />}
                    {mode === 'pan' && panResult && <PanResultCard result={panResult} />}
                </div>
            </Flex>
        </Flex>
    );
};

export default GstinLookupPage;
