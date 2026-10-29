import { useState, useEffect, type CSSProperties } from 'react';

import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Table, Empty, Tooltip, Space, InputNumber, Modal, Descriptions } from 'antd';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { ApplicationPayload, EntityType, Shareholder } from '../../types';
import AddShareholderDrawer, { ShareholderFormData } from '../AddShareholderDrawer';

interface CapitalProps {
    entityType?: string;
}

// Shareholding-pattern table cell styles — match the Figma spec for this section.
const headerCellStyle: CSSProperties = {
    backgroundColor: '#fafbfb',
    color: '#42526d',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    fontSize: 13,
    lineHeight: '20px',
    padding: '14px 30px',
    borderBottom: '1px solid #eaecf0',
    borderRight: 'none',
};
const bodyCellStyle: CSSProperties = {
    color: '#42526d',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 400,
    fontSize: 14,
    lineHeight: '22px',
    padding: '18px 30px',
    borderBottom: '1px solid #eaecf0',
    borderRight: 'none',
};

const Capital = ({ entityType }: CapitalProps) => {
    const { values, setFieldValue, setFieldTouched, touched, errors } = useFormikContext<ApplicationPayload>();
    const dispatch = useAppDispatch();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [viewIndex, setViewIndex] = useState<number | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const capital = values.capital || {
        authorizedCapital: 0,
        paidUpCapital: 0,
        faceValuePerShare: 10,
        shareholders: [],
    };

    const shareholders = capital.shareholders || [];
    const isLLP = entityType === EntityType.LLP;

    const getShareholderLimits = (type?: string): { min: number; max: number | null } => {
        if (type === EntityType.PRIVATE_LIMITED) return { min: 2, max: 200 };
        if (type === EntityType.PUBLIC_LIMITED) return { min: 7, max: null };
        if (type === EntityType.OPC) return { min: 1, max: 1 };
        if (type === EntityType.LLP) return { min: 2, max: null };
        return { min: 1, max: null };
    };

    const { min: minShareholders, max: maxShareholders } = getShareholderLimits(entityType);
    const atMaxShareholders = maxShareholders !== null && shareholders.length >= maxShareholders;
    const atMinShareholders = shareholders.length <= minShareholders;

    // Accepts optional overrides so callers can compute with pending values before setFieldValue resolves
    const calculatePaidUpShares = (paidUp?: number, faceValue?: number) => {
        const p = paidUp ?? capital.paidUpCapital ?? 0;
        const f = faceValue ?? capital.faceValuePerShare ?? 0;
        return f > 0 ? Math.round(p / f) : 0;
    };

    const calculateAuthorizedShares = () => {
        const authorized = capital.authorizedCapital || 0;
        const faceValue = capital.faceValuePerShare || 0;
        return faceValue > 0 ? Math.round(authorized / faceValue) : 0;
    };

    const paidUpShares = calculatePaidUpShares();

    // OPC: auto-sync the single shareholder from directors[0] or additionalShareholders[0]
    useEffect(() => {
        if (entityType !== EntityType.OPC) return;

        const source = values.additionalShareholders?.length
            ? values.additionalShareholders[0]
            : values.directors?.[0];
        if (!source?.name) return;

        const current = values.capital?.shareholders?.[0];
        if (current?.name === source.name && current?.email === source.email) return;

        const synced: Shareholder = {
            name: source.name,
            email: source.email || '',
            mobile: source.mobile || '',
            panNumber: source.nationality === 'Indian' ? (source.panNumber || '') : '',
            passportNumber: source.nationality !== 'Indian' ? (source.passportNumber || '') : '',
            nationality: source.nationality || '',
            shareholding: 100,
            sharesAllotted: current?.sharesAllotted ?? 0,
        };

        setFieldValue('capital.shareholders', [synced]);
    }, [entityType, values.directors, values.additionalShareholders]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isLLP) return;
        const directors = values.directors || [];
        const current = values.capital?.shareholders || [];

        const needsSync =
            directors.length !== current.length ||
            directors.some((d, i) => d.name !== current[i]?.name);

        if (!needsSync) return;

        const synced: Shareholder[] = directors.map(director => {
            const existing = current.find(sh => sh.name === director.name);
            return {
                name: director.name,
                email: director.email || '',
                mobile: director.mobile || '',
                panNumber: director.panNumber || '',
                nationality: director.nationality || '',
                shareholding: existing?.shareholding ?? 0,
                sharesAllotted: existing?.sharesAllotted ?? 0,
            };
        });

        const total = synced.reduce((sum, sh) => sum + (sh.sharesAllotted ?? 0), 0);
        const withPct = synced.map(sh => ({
            ...sh,
            shareholding: total > 0
                ? parseFloat((((sh.sharesAllotted ?? 0) / total) * 100).toFixed(2))
                : 0,
        }));

        setFieldValue('capital.shareholders', withPct);
        setFieldValue('capital.authorizedCapital', total);
    }, [isLLP, values.directors]); // eslint-disable-line react-hooks/exhaustive-deps

    const editData: ShareholderFormData | undefined =
        editIndex !== null && shareholders[editIndex]
            ? {
                  name: shareholders[editIndex].name,
                  nationality: shareholders[editIndex].nationality ?? '',
                  email: shareholders[editIndex].email ?? '',
                  mobile: shareholders[editIndex].mobile ?? '',
                  panNumber: shareholders[editIndex].panNumber ?? '',
                  passportNumber: shareholders[editIndex].passportNumber ?? '',
              }
            : undefined;

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setEditIndex(null);
    };

    const handleAddShareholderSubmit = (data: ShareholderFormData) => {
        if (editIndex !== null) {
            const updated = shareholders.map((sh, i) =>
                i === editIndex
                    ? {
                          ...sh,
                          name: data.name,
                          nationality: data.nationality,
                          email: data.email,
                          mobile: data.mobile,
                          panNumber: data.nationality === 'Indian' ? data.panNumber : '',
                          passportNumber: data.nationality !== 'Indian' ? data.passportNumber : '',
                      }
                    : sh
            );
            setFieldValue('capital.shareholders', updated);
            setEditIndex(null);
            dispatch(showToast({ variant: 'success', description: 'Shareholder updated successfully' }));
        } else {
            setFieldValue('capital.shareholders', [
                ...shareholders,
                {
                    name: data.name,
                    shareholding: 0,
                    sharesAllotted: 0,
                    email: data.email,
                    mobile: data.mobile,
                    panNumber: data.nationality === 'Indian' ? data.panNumber : '',
                    passportNumber: data.nationality !== 'Indian' ? data.passportNumber : '',
                    nationality: data.nationality,
                } as Shareholder,
            ]);
            dispatch(showToast({ variant: 'success', description: 'Shareholder added successfully' }));
        }
    };

    const handleRemoveShareholder = (index: number) => {
        const remaining = shareholders.filter((_, i) => i !== index);
        if (isLLP) {
            // Recalculate all remaining partners' % based on their contributions
            const totalShares = remaining.reduce((sum, sh) => sum + (sh.sharesAllotted ?? 0), 0);
            const withPct = remaining.map(sh => ({
                ...sh,
                shareholding: totalShares > 0
                    ? parseFloat((((sh.sharesAllotted ?? 0) / totalShares) * 100).toFixed(2))
                    : 0,
            }));
            setFieldValue('capital.shareholders', withPct);
            setFieldValue('capital.authorizedCapital', totalShares);
        } else {
            setFieldValue('capital.shareholders', remaining);
        }
    };

    const handleSharesChange = (index: number, value: number | null) => {
        const newShares = value ?? 0;

        const updated = shareholders.map((sh, i) =>
            i === index ? { ...sh, sharesAllotted: newShares } : sh
        );

        let withPct: typeof updated;
        if (isLLP) {
            const totalShares = updated.reduce((sum, sh) => sum + (sh.sharesAllotted ?? 0), 0);
            withPct = updated.map(sh => ({
                ...sh,
                shareholding: totalShares > 0
                    ? parseFloat((((sh.sharesAllotted ?? 0) / totalShares) * 100).toFixed(2))
                    : 0,
            }));
            setFieldValue('capital.authorizedCapital', totalShares);
        } else {
            withPct = updated.map(sh => ({
                ...sh,
                shareholding: paidUpShares > 0
                    ? parseFloat((((sh.sharesAllotted ?? 0) / paidUpShares) * 100).toFixed(2))
                    : 0,
            }));
        }

        setFieldValue('capital.shareholders', withPct);
        setFieldTouched(`capital.shareholders[${index}].shareholding`, true, false);
    };

    const handleTotalCapitalChange = (value: number | null) => {
        const total = value ?? 0;
        setFieldValue('capital.authorizedCapital', total);

        if (shareholders.length === 0) return;

        const perPartner = Math.floor(total / shareholders.length);
        const remainder = total - perPartner * shareholders.length;

        const updated = shareholders.map((sh, i) => ({
            ...sh,
            sharesAllotted: i === shareholders.length - 1 ? perPartner + remainder : perPartner,
        }));

        const withPct = updated.map(sh => ({
            ...sh,
            shareholding: total > 0
                ? parseFloat((((sh.sharesAllotted ?? 0) / total) * 100).toFixed(2))
                : 0,
        }));

        setFieldValue('capital.shareholders', withPct);
    };

    // Recalculates all shareholders' % when paid-up capital or face value changes
    const recalculateOnCapitalChange = (newPaidUpShares: number) => {
        if (shareholders.length === 0) return;
        const updated = shareholders.map(sh => ({
            ...sh,
            shareholding: newPaidUpShares > 0
                ? parseFloat((((sh.sharesAllotted ?? 0) / newPaidUpShares) * 100).toFixed(2))
                : 0,
        }));
        setFieldValue('capital.shareholders', updated);
    };

    const handleNumericKeyDown = (maxDigits?: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
        ];
        if (allowedKeys.includes(e.key)) return;
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
        if (/^\d$/.test(e.key)) {
            if (maxDigits !== undefined) {
                const digits = (e.currentTarget as HTMLInputElement).value.replace(/[^0-9]/g, '');
                if (digits.length >= maxDigits) {
                    e.preventDefault();
                    return;
                }
            }
            return;
        }
        e.preventDefault();
    };

    const capitalErrors = (errors as any)?.capital;
    const capitalTouched = (touched as any)?.capital;

    const fieldError = (field: string) =>
        capitalTouched?.[field] && capitalErrors?.[field] ? (
            <p data-form-error="true" className="text-errorTextRed text-[12px] mt-1">{capitalErrors[field]}</p>
        ) : null;

    const nonLlpInfoBox = (
        <div className="bg-bgCreamLight rounded-[16px] px-4 py-[10px] flex gap-2 items-start w-full">
            <ExclamationCircleFilled className="text-[#ffa940] text-base mt-[2px] shrink-0" />
            <div className="text-[12px]">
                <p className="font-medium text-[rgba(0,0,0,0.85)] mb-2">Understanding Capital Structure:</p>
                <div className="text-slate-500 space-y-[10px]">
                    <p><span className="text-slate-900">• Authorized Capital</span>: Maximum capital the company can raise</p>
                    <p><span className="text-slate-900">• Paid-up Capital</span>: Actual capital invested by shareholders</p>
                    <p><span className="text-slate-900">• Face Value</span>: Nominal value of each share</p>
                    <p className="text-slate-900">• Total shareholding must equal 100%</p>
                    <p className="text-slate-900">• Private Limited: 2–200 shareholders &nbsp;|&nbsp; Public Limited: min 7 &nbsp;|&nbsp; OPC: exactly 1</p>
                </div>
            </div>
        </div>
    );

    const llpInfoBox = (
        <div className="bg-bgCreamLight rounded-[16px] px-4 py-[10px] flex gap-2 items-start w-full">
            <ExclamationCircleFilled className="text-[#ffa940] text-base mt-[2px] shrink-0" />
            <div className="text-[12px]">
                <p className="font-medium text-[rgba(0,0,0,0.85)] mb-2">Understanding LLP Capital:</p>
                <div className="text-slate-500 space-y-[10px]">
                    <p><span className="text-slate-900">• Initial Contribution</span>: Total capital contributed by all partners to the LLP</p>
                    <p><span className="text-slate-900">• Contribution Amount</span>: Each partner&apos;s share of the total capital invested</p>
                    <p><span className="text-slate-900">• % Profit Share</span>: Partner&apos;s proportional entitlement to profits and losses</p>
                    <p className="text-slate-900">• Total profit sharing must equal 100%</p>
                </div>
            </div>
        </div>
    );

    const calculatedValuesBox = (
        <div className="border border-zinc-200 rounded-[22px] p-6 space-y-6">
            <h3 className="text-[18px] font-medium text-black leading-[28px]">Calculated Values</h3>
            <div className="bg-[#fff7f7] border border-[#ffd6d6] rounded-[16px] p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                        <p className="text-[14px] text-slate-500 mb-3">Authorized Shares</p>
                        <p className="text-[28px] sm:text-[32px] font-medium text-black tracking-[-0.16px]">
                            {calculateAuthorizedShares().toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="flex-1 sm:border-l sm:border-slate-500 sm:pl-6 border-t border-slate-500 pt-4 sm:pt-0 sm:border-t-0">
                        <p className="text-[14px] text-slate-500 mb-3">Paid-up Shares</p>
                        <p className="text-[28px] sm:text-[32px] font-medium text-black tracking-[-0.16px]">
                            {paidUpShares.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const shareholdingTable = (isLLPEntity: boolean) => (
        <div className="border border-zinc-200 rounded-[22px] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-[18px] font-medium text-black leading-[28px]">
                    {isLLPEntity ? 'Profit Sharing Pattern' : 'Shareholding Pattern'}
                </h3>
                {!isLLPEntity && entityType !== EntityType.OPC && (
                    <Tooltip title={atMaxShareholders ? `Maximum ${maxShareholders} shareholders allowed` : undefined}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => { setEditIndex(null); setDrawerOpen(true); }}
                            disabled={atMaxShareholders}
                            className="!h-12 !rounded-[7px] !text-[16px] !font-normal w-full sm:w-auto !bg-lightRed hover:!bg-lightRedHover disabled:opacity-50"
                        >
                            Add Shareholder
                        </Button>
                    </Tooltip>
                )}
            </div>

            <div className="bg-white border border-[#eff1f4] rounded-[10px] overflow-hidden">
                <Table
                    scroll={{ x: 600 }}
                    dataSource={shareholders.map((sh, idx) => ({
                        key: idx,
                        index: idx,
                        name: sh.name,
                        sharesAllotted: sh.sharesAllotted ?? 0,
                        holding: `${sh.shareholding || 0}%`,
                    }))}
                    columns={[
                        {
                            title: isLLPEntity ? 'Partner Name' : 'Shareholder Name',
                            dataIndex: 'name',
                            key: 'name',
                            onHeaderCell: () => ({ style: headerCellStyle }),
                            onCell: () => ({ style: bodyCellStyle }),
                        },
                        {
                            title: isLLPEntity ? 'Contribution Amount (₹)' : 'Shares Allotted',
                            dataIndex: 'sharesAllotted',
                            key: 'sharesAllotted',
                            width: 275,
                            onHeaderCell: () => ({ style: headerCellStyle }),
                            onCell: () => ({ style: bodyCellStyle }),
                            render: (val: number, row: { index: number }) => {
                                const sharesTouched = (capitalTouched as any)?.shareholders?.[row.index]?.sharesAllotted
                                    || (capitalTouched as any)?.shareholders?.[row.index]?.shareholding;
                                const sharesAllottedError = (capitalErrors as any)?.shareholders?.[row.index]?.sharesAllotted;
                                const hasError = sharesTouched && (val === 0 || Boolean(sharesAllottedError));
                                const otherSharesTotal = shareholders.reduce(
                                    (sum, sh, i) => (i !== row.index ? sum + (sh.sharesAllotted ?? 0) : sum),
                                    0
                                );
                                const maxShares = isLLPEntity
                                    ? 1000000000
                                    : Math.max(0, paidUpShares - otherSharesTotal);
                                return (
                                    <div>
                                        <InputNumber
                                            prefix={isLLPEntity ? '₹ ' : undefined}
                                            value={val}
                                            min={0}
                                            max={maxShares}
                                            onChange={v => handleSharesChange(row.index, v)}
                                            onKeyDown={handleNumericKeyDown(10)}
                                            className="w-full !bg-slate-50 !border-slate-200 !rounded-[8px]"
                                            formatter={v =>
                                                v === undefined || v === null
                                                    ? ''
                                                    : formatNumberWithLocalString(v, 0, 0)
                                            }
                                            parser={v => Number(`${v}`.replace(/[^0-9]/g, ''))}
                                            status={hasError ? 'error' : ''}
                                            controls={false}
                                        />
                                        {hasError && (
                                            <p data-form-error="true" className="text-errorTextRed text-[12px] mt-1">
                                                {isLLPEntity
                                                    ? (sharesAllottedError || 'Contribution amount must be at least ₹1')
                                                    : 'Shares allotted must be greater than 0'}
                                            </p>
                                        )}
                                    </div>
                                );
                            },
                        },
                        {
                            title: isLLPEntity ? '% Profit Share' : '% Holding',
                            dataIndex: 'holding',
                            key: 'holding',
                            width: 156,
                            onHeaderCell: () => ({ style: headerCellStyle }),
                            onCell: () => ({ style: bodyCellStyle }),
                        },
                        {
                            title: 'Actions',
                            key: 'actions',
                            width: 220,
                            align: 'right' as const,
                            onHeaderCell: () => ({ style: headerCellStyle }),
                            onCell: () => ({ style: bodyCellStyle }),
                            render: (_: unknown, __: unknown, idx: number) => (
                                <Space size={32}>
                                    <Tooltip title="View">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined style={{ fontSize: 20, color: '#ff4f4f' }} />}
                                            onClick={() => setViewIndex(idx)}
                                            className="hover:!bg-bgRedLight transition-colors"
                                        />
                                    </Tooltip>
                                    {!isLLPEntity && entityType !== EntityType.OPC && (
                                        <>
                                            <Tooltip title="Edit">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined style={{ fontSize: 20, color: '#ff4f4f' }} />}
                                                    onClick={() => { setEditIndex(idx); setDrawerOpen(true); }}
                                                    className="hover:!bg-bgRedLight transition-colors"
                                                />
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    icon={<DeleteOutlined style={{ fontSize: 20, color: '#ff4f4f' }} />}
                                                    onClick={() => handleRemoveShareholder(idx)}
                                                    disabled={atMinShareholders}
                                                    className="hover:!bg-bgRedLight transition-colors"
                                                />
                                            </Tooltip>
                                        </>
                                    )}
                                </Space>
                            ),
                        },
                    ]}
                    pagination={false}
                    bordered={false}
                    locale={{
                        emptyText: (
                            <Empty description={isLLPEntity ? 'No partners added' : 'No shareholders added'} />
                        ),
                    }}
                />
            </div>
            {capitalTouched?.shareholders !== undefined && typeof capitalErrors?.shareholders === 'string' && (
                <p data-form-error="true" className="text-errorTextRed text-[12px] mt-2">{capitalErrors.shareholders}</p>
            )}
            {Array.isArray(capitalErrors?.shareholders) &&
                (capitalErrors.shareholders as Array<{ panNumber?: string; passportNumber?: string; email?: string } | undefined>).map(
                    (err, idx) => {
                        const parts = [err?.panNumber, err?.passportNumber, err?.email].filter(Boolean);
                        if (parts.length === 0) return null;
                        const label = shareholders[idx]?.name || `Shareholder ${idx + 1}`;
                        return (
                            <p key={idx} data-form-error="true" className="text-errorTextRed text-[12px] mt-1">
                                <span className="font-medium">{label}:</span>
                                <span> {parts.join(' · ')}</span>
                            </p>
                        );
                    }
                )}
        </div>
    );

    const viewModal = (isLLPEntity: boolean) =>
        viewIndex !== null && shareholders[viewIndex] ? (
            <Modal
                open
                onCancel={() => setViewIndex(null)}
                footer={<Button onClick={() => setViewIndex(null)} className="hover:!bg-gray-50 transition-colors">Close</Button>}
                title={
                    <span className="text-[18px] font-medium">
                        {isLLPEntity ? 'Partner Details' : 'Shareholder Details'}
                    </span>
                }
                centered
            >
                <Descriptions column={1} bordered size="small" className="mt-4">
                    <Descriptions.Item label="Name">{shareholders[viewIndex].name}</Descriptions.Item>
                    <Descriptions.Item label="Nationality">{shareholders[viewIndex].nationality}</Descriptions.Item>
                    <Descriptions.Item label="Email">{shareholders[viewIndex].email}</Descriptions.Item>
                    <Descriptions.Item label="Mobile">+91 {shareholders[viewIndex].mobile}</Descriptions.Item>
                    {shareholders[viewIndex].nationality === 'Indian'
                        ? <Descriptions.Item label="PAN">{shareholders[viewIndex].panNumber}</Descriptions.Item>
                        : <Descriptions.Item label="Passport Number">{shareholders[viewIndex].passportNumber}</Descriptions.Item>
                    }
                    <Descriptions.Item label={isLLPEntity ? 'Contribution Amount' : 'Shares Allotted'}>
                        {isLLPEntity ? '₹ ' : ''}
                        {(shareholders[viewIndex].sharesAllotted ?? 0).toLocaleString('en-IN')}
                    </Descriptions.Item>
                    <Descriptions.Item label={isLLPEntity ? '% Profit Share' : '% Holding'}>
                        {shareholders[viewIndex].shareholding ?? 0}%
                    </Descriptions.Item>
                </Descriptions>
            </Modal>
        ) : null;

    // ── LLP ──────────────────────────────────────────────────────────────────────
    if (isLLP) {
        return (
            <div className="space-y-5">
                <div className="space-y-5">
                    <div className="border border-zinc-200 rounded-[22px] p-6 space-y-6">
                        <h3 className="text-[18px] font-medium text-black leading-[28px]">
                            Capital Contribution
                        </h3>
                        <div className="w-full md:w-1/2">
                            <div className="text-[14px] text-textNearBlack mb-3">Total Capital Contribution <span className="text-[12px] text-slate-500">(Max ₹1,00,00,00,000)</span></div>
                            <InputNumber
                                prefix="₹ "
                                value={capital.authorizedCapital || undefined}
                                min={0}
                                max={1000000000}
                                onChange={handleTotalCapitalChange}
                                onKeyDown={handleNumericKeyDown(10)}
                                className="!w-full [&_.ant-input-number-input-wrap]:!h-16 [&_.ant-input-number-input]:!h-16 [&_.ant-input-number-input]:!leading-[64px] [&_.ant-input-number-prefix]:!flex [&_.ant-input-number-prefix]:!items-center !text-lg"
                                formatter={v =>
                                    v === undefined || v === null
                                        ? ''
                                        : formatNumberWithLocalString(v, 0, 0)
                                }
                                parser={v => Number(`${v}`.replace(/[^0-9]/g, ''))}
                                size="large"
                                controls={false}
                            />
                            <p className="text-[12px] text-zinc-600 mt-2">Enter total to split equally, or set individual contributions below</p>
                        </div>
                    </div>

                    {shareholdingTable(true)}
                    {llpInfoBox}
                </div>

                {viewModal(true)}
            </div>
        );
    }

    // ── Non-LLP (Private / Public / OPC) ─────────────────────────────────────────
    return (
        <div className="space-y-5">
            <div className="space-y-5">
                <div className="border border-zinc-200 rounded-[22px] p-6 space-y-6">
                    <h3 className="text-[18px] font-medium text-black leading-[28px]">Capital Structure</h3>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-[60px]">
                        <div className="flex-1">
                            <div className="text-[14px] text-textNearBlack mb-3">
                                <span>Authorized Capital </span>
                                <span className="text-[12px] text-slate-500">(Min ₹1,00,000 – Max ₹1,00,00,00,000)</span>
                            </div>
                            <InputNumber
                                prefix="₹"
                                value={capital.authorizedCapital || undefined}
                                min={100000}
                                max={1000000000}
                                onChange={v => setFieldValue('capital.authorizedCapital', v ?? 0)}
                                onKeyDown={handleNumericKeyDown(10)}
                                className="!w-full [&_.ant-input-number-input-wrap]:!h-16 [&_.ant-input-number-input]:!h-16 [&_.ant-input-number-input]:!leading-[64px] [&_.ant-input-number-prefix]:!flex [&_.ant-input-number-prefix]:!items-center !text-lg"
                                formatter={v =>
                                    v === undefined || v === null
                                        ? ''
                                        : formatNumberWithLocalString(v, 0, 0)
                                }
                                parser={v => Number(`${v}`.replace(/[^0-9]/g, ''))}
                                size="large"
                                status={capitalTouched?.authorizedCapital && capitalErrors?.authorizedCapital ? 'error' : ''}
                                controls={false}
                            />
                            {fieldError('authorizedCapital')}
                        </div>

                        <div className="flex-1">
                            <div className="text-[14px] text-textNearBlack mb-3">
                                <span>Paid-up Capital </span>
                                <span className="text-[12px] text-slate-500">(Cannot exceed authorized)</span>
                            </div>
                            <InputNumber
                                prefix="₹"
                                value={capital.paidUpCapital || undefined}
                                min={1}
                                max={capital.authorizedCapital}
                                onChange={v => {
                                    const newPaidUp = v ?? 0;
                                    setFieldValue('capital.paidUpCapital', newPaidUp);
                                    const newPaidUpShares = calculatePaidUpShares(newPaidUp, capital.faceValuePerShare);
                                    recalculateOnCapitalChange(newPaidUpShares);
                                }}
                                onKeyDown={handleNumericKeyDown(10)}
                                className="!w-full [&_.ant-input-number-input-wrap]:!h-16 [&_.ant-input-number-input]:!h-16 [&_.ant-input-number-input]:!leading-[64px] [&_.ant-input-number-prefix]:!flex [&_.ant-input-number-prefix]:!items-center !text-lg"
                                formatter={v =>
                                    v === undefined || v === null
                                        ? ''
                                        : formatNumberWithLocalString(v, 0, 0)
                                }
                                parser={v => Number(`${v}`.replace(/[^0-9]/g, ''))}
                                size="large"
                                status={capitalTouched?.paidUpCapital && capitalErrors?.paidUpCapital ? 'error' : ''}
                                controls={false}
                            />
                            {fieldError('paidUpCapital')}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="text-[14px] text-textNearBlack mb-3">
                            <span>Face Value per Share </span>
                            <span className="text-[12px] text-slate-500">(Typically ₹10)</span>
                        </div>
                        <InputNumber
                            prefix="₹"
                            value={capital.faceValuePerShare || undefined}
                            min={1}
                            onChange={v => {
                                const newFaceValue = v ?? 0;
                                setFieldValue('capital.faceValuePerShare', newFaceValue);
                                const newPaidUpShares = calculatePaidUpShares(capital.paidUpCapital, newFaceValue);
                                recalculateOnCapitalChange(newPaidUpShares);
                            }}
                            onKeyDown={handleNumericKeyDown(10)}
                            className="!w-full [&_.ant-input-number-input-wrap]:!h-16 [&_.ant-input-number-input]:!h-16 [&_.ant-input-number-input]:!leading-[64px] [&_.ant-input-number-prefix]:!flex [&_.ant-input-number-prefix]:!items-center !text-lg"
                            size="large"
                            status={capitalTouched?.faceValuePerShare && capitalErrors?.faceValuePerShare ? 'error' : ''}
                            controls={false}
                        />
                        {fieldError('faceValuePerShare')}
                    </div>
                </div>

                {calculatedValuesBox}
                {shareholdingTable(false)}
                {nonLlpInfoBox}
            </div>

            <AddShareholderDrawer
                open={drawerOpen}
                onClose={handleDrawerClose}
                onSubmit={handleAddShareholderSubmit}
                editData={editData}
            />
            {viewModal(false)}
        </div>
    );
};

export default Capital;
