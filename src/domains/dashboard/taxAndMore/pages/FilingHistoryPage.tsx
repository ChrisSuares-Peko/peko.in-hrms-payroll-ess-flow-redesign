import { useState } from 'react';

import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DownOutlined,
    ExportOutlined,
    FileTextOutlined,
    RightOutlined,
    UpOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Button, Flex, Select, Skeleton, Typography } from 'antd';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/hooks';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import useFilingHistory from '../hooks/useFilingHistory';
import { FilingHistoryEntry } from '../types';
import { FINANCIAL_YEARS } from '../utils/data';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_SHORT = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

type FilingStatus = 'Filed' | 'Pending' | 'Upcoming' | 'Late';
type ViewTab = 'matrix' | 'listing';
type ReturnType = 'GSTR-1' | 'GSTR-3B';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapStatus = (s: FilingHistoryEntry['gstr1'], month: number, year: number): FilingStatus => {
    if (!s) {
        const now = new Date();
        const endOfMonth = new Date(year, month, 0);
        return now > endOfMonth ? 'Pending' : 'Upcoming';
    }
    if (s.status === 'filed') return 'Filed';
    return 'Pending';
};

const STATUS_CONFIG: Record<FilingStatus, { bg: string; color: string; label: string }> = {
    Filed: { bg: '#ecfdf5', color: '#16a34a', label: 'Filed' },
    Pending: { bg: '#fffbeb', color: '#f59e0b', label: 'Pending' },
    Upcoming: { bg: '#f8fafc', color: '#94a3b8', label: 'Upcoming' },
    Late: { bg: '#fef2f2', color: '#ef4444', label: 'Late' },
};

const getReturnTypeStyle = (returnType: ReturnType) => {
    if (returnType === 'GSTR-1') return { backgroundColor: '#eff6ff', color: '#3b82f6' };
    return { backgroundColor: '#fdf4ff', color: '#9333ea' };
};

const StatusBadge = ({ status }: { status: FilingStatus }) => {
    const cfg = STATUS_CONFIG[status];
    return (
        <span
            style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                borderRadius: 60,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 500,
            }}
        >
            {cfg.label}
        </span>
    );
};

const getFileNowPath = (returnType: ReturnType) => {
    if (returnType === 'GSTR-3B') return `${paths.dashboard.taxMore}/${paths.taxMore.fileGstr3b}`;
    return `${paths.dashboard.taxMore}/${paths.taxMore.fileGstr1}`;
};

interface ListingRow {
    id: string;
    returnType: ReturnType;
    period: string;
    fp: string;
    fy: string;
    filedOn: string;
    arn: string;
    status: FilingStatus;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FilingHistoryPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { activeSetup, selectedFinancialYear } = useAppSelector(state => state.reducer.taxMore);
    const gstin = activeSetup?.gstin ?? '';
    const defaultFY = selectedFinancialYear ?? activeSetup?.financialYear ?? FINANCIAL_YEARS[0];

    const [selectedFY, setSelectedFY] = useState<string>(defaultFY);
    const [activeTab, setActiveTab] = useState<ViewTab>('matrix');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const { data, isLoading } = useFilingHistory(
        gstin ? { gstin, financialYear: selectedFY } : null
    );

    const toggleRow = (id: string) =>
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = (view: 'matrix' | 'listing') => {
        if (!data || data.length === 0) {
            dispatch(showToast({ description: 'No data available to export', variant: 'error' }));
            return;
        }
        setIsExporting(true);
        try {
            let csv = '';
            if (view === 'matrix') {
                csv = 'Period,GSTR-1 Status,GSTR-3B Status\n';
                csv += (data ?? [])
                    .map(entry => {
                        const period = `${MONTH_SHORT[entry.month]} ${entry.year}`;
                        const g1 = mapStatus(entry.gstr1, entry.month, entry.year);
                        const g3b = mapStatus(entry.gstr3b, entry.month, entry.year);
                        return `${period},${g1},${g3b}`;
                    })
                    .join('\n');
            } else {
                csv = 'Return Type,Period,FP,FY,Filed On,ARN / ACK,Status\n';
                csv += (data ?? [])
                    .flatMap(entry => {
                        const period = `${MONTH_SHORT[entry.month]} ${entry.year}`;
                        const fp = `${String(entry.month).padStart(2, '0')}${entry.year}`;
                        return [
                            [
                                'GSTR-1',
                                period,
                                fp,
                                selectedFY,
                                entry.gstr1?.filedAt ?? '—',
                                entry.gstr1?.ackNum ?? '—',
                                mapStatus(entry.gstr1, entry.month, entry.year),
                            ].join(','),
                            [
                                'GSTR-3B',
                                period,
                                fp,
                                selectedFY,
                                entry.gstr3b?.filedAt ?? '—',
                                entry.gstr3b?.ackNum ?? '—',
                                mapStatus(entry.gstr3b, entry.month, entry.year),
                            ].join(','),
                        ];
                    })
                    .join('\n');
            }
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `FilingHistory_${gstin}_${selectedFY}_${view}.csv`);
        } finally {
            setIsExporting(false);
        }
    };

    // ── Derived data ──────────────────────────────────────────────────────────

    const matrixRows = (data ?? []).map((entry, i) => ({
        key: `m-${i}`,
        period: `${MONTH_SHORT[entry.month]} ${entry.year}`,
        gstr1: mapStatus(entry.gstr1, entry.month, entry.year),
        gstr3b: mapStatus(entry.gstr3b, entry.month, entry.year),
    }));

    const listingRows: ListingRow[] = (data ?? []).flatMap((entry, i) => {
        const period = `${MONTH_SHORT[entry.month]} ${entry.year}`;
        const fp = `${String(entry.month).padStart(2, '0')}${entry.year}`;
        return [
            {
                id: `g1-${i}`,
                returnType: 'GSTR-1' as ReturnType,
                period,
                fp,
                fy: selectedFY,
                filedOn: entry.gstr1?.filedAt ?? '—',
                arn: entry.gstr1?.ackNum ?? '—',
                status: mapStatus(entry.gstr1, entry.month, entry.year),
            },
            {
                id: `g3b-${i}`,
                returnType: 'GSTR-3B' as ReturnType,
                period,
                fp,
                fy: selectedFY,
                filedOn: entry.gstr3b?.filedAt ?? '—',
                arn: entry.gstr3b?.ackNum ?? '—',
                status: mapStatus(entry.gstr3b, entry.month, entry.year),
            },
        ];
    });

    const totalReturns = listingRows.length;
    const totalFiled = listingRows.filter(r => r.status === 'Filed').length;
    const pending = listingRows.filter(r => r.status === 'Pending').length;
    const late = listingRows.filter(r => r.status === 'Late').length;
    const complianceScore = totalReturns > 0 ? Math.round((totalFiled / totalReturns) * 100) : 0;

    const STAT_CARDS = [
        {
            value: `${totalFiled}/${totalReturns}`,
            label: 'Returns Filed',
            icon: <FileTextOutlined style={{ fontSize: 18, color: '#f97316' }} />,
            bg: '#fff7ed',
            iconBg: '#ffedd5',
        },
        {
            value: String(pending),
            label: 'Pending',
            icon: <ClockCircleOutlined style={{ fontSize: 18, color: '#6366f1' }} />,
            bg: '#eef2ff',
            iconBg: '#e0e7ff',
        },
        {
            value: String(late),
            label: 'Late Filings',
            icon: <WarningOutlined style={{ fontSize: 18, color: '#f43f5e' }} />,
            bg: '#fff1f2',
            iconBg: '#ffe4e6',
        },
        {
            value: `${complianceScore}%`,
            label: 'Compliance Score',
            icon: <CheckCircleOutlined style={{ fontSize: 18, color: '#22c55e' }} />,
            bg: '#f0fdf4',
            iconBg: '#dcfce7',
        },
    ];

    return (
        <Flex vertical gap={20}>
            {/* Header */}
            <Flex align="flex-start" justify="space-between">
                <Flex vertical gap={4}>
                    <Typography.Text
                        className="font-bold"
                        style={{ fontSize: 22, color: '#1e293b' }}
                    >
                        Filing History
                    </Typography.Text>
                    <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                        GSTR-1 · GSTR-3B — all return filings in one view
                    </Typography.Text>
                </Flex>
                <Flex gap={10} align="center">
                    <Select
                        value={selectedFY}
                        options={FINANCIAL_YEARS.map(f => ({ value: f, label: `FY ${f}` }))}
                        style={{ width: 180 }}
                        getPopupContainer={() => document.body}
                        onChange={setSelectedFY}
                    />
                    <Button
                        icon={<ExportOutlined />}
                        style={{ borderColor: '#e2e8f0', color: '#475569', height: 36 }}
                        loading={isExporting}
                        onClick={() => handleExport(activeTab === 'listing' ? 'listing' : 'matrix')}
                    >
                        Export
                    </Button>
                </Flex>
            </Flex>

            {/* Stat cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {STAT_CARDS.map(card => (
                    <div
                        key={card.label}
                        className="rounded-[14px] px-5 py-4"
                        style={{ backgroundColor: card.bg }}
                    >
                        <Flex gap={12} align="center">
                            <div
                                className="flex items-center justify-center rounded-full flex-shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: card.iconBg }}
                            >
                                {card.icon}
                            </div>
                            <Flex vertical gap={2}>
                                {isLoading ? (
                                    <Skeleton.Input active size="small" style={{ width: 60 }} />
                                ) : (
                                    <Typography.Text
                                        className="font-bold"
                                        style={{
                                            fontSize: 24,
                                            color: '#1e293b',
                                            lineHeight: '30px',
                                        }}
                                    >
                                        {card.value}
                                    </Typography.Text>
                                )}
                                <Typography.Text className="text-xs" style={{ color: '#64748b' }}>
                                    {card.label}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[#e2e8f0] gap-1">
                {[
                    {
                        key: 'matrix' as ViewTab,
                        label: 'Month-wise Matrix',
                        icon: <FileTextOutlined style={{ fontSize: 13 }} />,
                    },
                    {
                        key: 'listing' as ViewTab,
                        label: 'Detailed Listing',
                        icon: <FileTextOutlined style={{ fontSize: 13 }} />,
                    },
                ].map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className="flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                        style={{
                            color: activeTab === tab.key ? '#ff4f4f' : '#475569',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.key ? '#ff4f4f' : 'transparent'}`,
                            marginBottom: -1,
                            cursor: 'pointer',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Month-wise Matrix ── */}
            {activeTab === 'matrix' && (
                <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
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
                                Filing Matrix
                            </Typography.Text>
                            <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
                                {matrixRows.length} periods shown
                            </Typography.Text>
                        </Flex>
                        <Button
                            icon={<ExportOutlined />}
                            size="small"
                            style={{ borderColor: '#e2e8f0', color: '#475569', height: 32 }}
                            loading={isExporting}
                            onClick={() => handleExport('matrix')}
                        >
                            Export
                        </Button>
                    </Flex>

                    <div
                        className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                        style={{ gridTemplateColumns: '1.5fr 1fr 1fr 40px' }}
                    >
                        {['Period', 'GSTR-1', 'GSTR-3B', ''].map((h, i) => (
                            <div
                                key={i}
                                className="px-5 py-3 text-xs font-semibold"
                                style={{ color: '#42526d' }}
                            >
                                {h}
                            </div>
                        ))}
                    </div>

                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="px-5 py-4 border-b border-[#eaecf0]">
                                  <Skeleton active paragraph={false} />
                              </div>
                          ))
                        : matrixRows.map(row => {
                              const isOpen = expandedRows.has(row.key);
                              return (
                                  <div
                                      key={row.key}
                                      className="border-b border-[#eaecf0] last:border-b-0"
                                  >
                                      <div
                                          className="grid items-center hover:bg-[#fafafa] cursor-pointer transition-colors"
                                          style={{
                                              gridTemplateColumns: '1.5fr 1fr 1fr 40px',
                                              minHeight: 52,
                                          }}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => toggleRow(row.key)}
                                          onKeyDown={e => {
                                              if (e.key === 'Enter' || e.key === ' ')
                                                  toggleRow(row.key);
                                          }}
                                      >
                                          <div className="px-5 py-3">
                                              <Typography.Text
                                                  className="text-sm font-medium"
                                                  style={{ color: '#1e293b' }}
                                              >
                                                  {row.period}
                                              </Typography.Text>
                                          </div>
                                          <div className="px-5 py-3">
                                              <StatusBadge status={row.gstr1} />
                                          </div>
                                          <div className="px-5 py-3">
                                              <StatusBadge status={row.gstr3b} />
                                          </div>
                                          <div className="flex items-center justify-center">
                                              {isOpen ? (
                                                  <UpOutlined
                                                      style={{ fontSize: 11, color: '#94a3b8' }}
                                                  />
                                              ) : (
                                                  <DownOutlined
                                                      style={{ fontSize: 11, color: '#94a3b8' }}
                                                  />
                                              )}
                                          </div>
                                      </div>
                                      {isOpen && (
                                          <div className="bg-[#fafbfc] border-t border-[#eaecf0] px-5 py-4">
                                              <div
                                                  className="grid gap-4"
                                                  style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
                                              >
                                                  {(['GSTR-1', 'GSTR-3B'] as ReturnType[]).map(
                                                      rt => {
                                                          const status =
                                                              rt === 'GSTR-1'
                                                                  ? row.gstr1
                                                                  : row.gstr3b;
                                                          return (
                                                              <div
                                                                  key={rt}
                                                                  className="bg-white border border-[#e2e8f0] rounded-[10px] px-4 py-3"
                                                              >
                                                                  <Flex
                                                                      align="center"
                                                                      justify="space-between"
                                                                      className="mb-2"
                                                                  >
                                                                      <Typography.Text
                                                                          className="text-sm font-semibold"
                                                                          style={{
                                                                              color: '#1e293b',
                                                                          }}
                                                                      >
                                                                          {rt}
                                                                      </Typography.Text>
                                                                      <StatusBadge
                                                                          status={status}
                                                                      />
                                                                  </Flex>
                                                                  <Typography.Text
                                                                      className="text-xs"
                                                                      style={{ color: '#94a3b8' }}
                                                                  >
                                                                      Period: {row.period}
                                                                  </Typography.Text>
                                                              </div>
                                                          );
                                                      }
                                                  )}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                </div>
            )}

            {/* ── Detailed Listing ── */}
            {activeTab === 'listing' && (
                <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
                    <div
                        className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                        style={{ gridTemplateColumns: '1fr 1fr 1.2fr 1.2fr 1.8fr 1fr 100px' }}
                    >
                        {['Return', 'Period', 'FP / FY', 'Filed On', 'ARN / ACK', 'Status', ''].map(
                            (h, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-3 text-xs font-semibold"
                                    style={{ color: '#42526d' }}
                                >
                                    {h}
                                </div>
                            )
                        )}
                    </div>

                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="px-5 py-4 border-b border-[#eaecf0]">
                                  <Skeleton active paragraph={false} />
                              </div>
                          ))
                        : listingRows.map(row => (
                              <div
                                  key={row.id}
                                  className="grid items-center border-b border-[#eaecf0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
                                  style={{
                                      gridTemplateColumns: '1fr 1fr 1.2fr 1.2fr 1.8fr 1fr 100px',
                                      minHeight: 52,
                                  }}
                              >
                                  <div className="px-4 py-3">
                                      <span
                                          style={{
                                              ...getReturnTypeStyle(row.returnType),
                                              borderRadius: 60,
                                              padding: '2px 10px',
                                              fontSize: 11,
                                              fontWeight: 600,
                                          }}
                                      >
                                          {row.returnType}
                                      </span>
                                  </div>
                                  <div className="px-4 py-3">
                                      <Typography.Text
                                          className="text-sm"
                                          style={{ color: '#475569' }}
                                      >
                                          {row.period}
                                      </Typography.Text>
                                  </div>
                                  <div className="px-4 py-3">
                                      <Typography.Text
                                          className="text-xs block"
                                          style={{ color: '#475569' }}
                                      >
                                          fp: {row.fp}
                                      </Typography.Text>
                                      <Typography.Text
                                          className="text-xs block"
                                          style={{ color: '#94a3b8' }}
                                      >
                                          fy: {row.fy}
                                      </Typography.Text>
                                  </div>
                                  <div className="px-4 py-3">
                                      <Typography.Text
                                          className="text-sm"
                                          style={{
                                              color: row.filedOn === '—' ? '#cbd5e1' : '#475569',
                                          }}
                                      >
                                          {row.filedOn}
                                      </Typography.Text>
                                  </div>
                                  <div className="px-4 py-3">
                                      <Typography.Text
                                          className="text-xs font-mono"
                                          style={{ color: row.arn === '—' ? '#cbd5e1' : '#475569' }}
                                      >
                                          {row.arn}
                                      </Typography.Text>
                                  </div>
                                  <div className="px-4 py-3">
                                      <StatusBadge status={row.status} />
                                  </div>
                                  <div className="px-4 py-3">
                                      {(row.status === 'Pending' || row.status === 'Late') && (
                                          <Button
                                              type="primary"
                                              danger
                                              size="small"
                                              icon={<RightOutlined />}
                                              iconPosition="end"
                                              style={{ fontSize: 11, height: 28, fontWeight: 500 }}
                                              onClick={() =>
                                                  navigate(getFileNowPath(row.returnType))
                                              }
                                          >
                                              File Now
                                          </Button>
                                      )}
                                      {row.status === 'Filed' && (
                                          <button
                                              type="button"
                                              className="flex items-center gap-1 text-xs font-medium"
                                              style={{
                                                  color: '#475569',
                                                  background: 'none',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  padding: 0,
                                              }}
                                              onClick={() =>
                                                  navigate(getFileNowPath(row.returnType))
                                              }
                                          >
                                              View <RightOutlined style={{ fontSize: 10 }} />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                </div>
            )}
        </Flex>
    );
};

export default FilingHistoryPage;
