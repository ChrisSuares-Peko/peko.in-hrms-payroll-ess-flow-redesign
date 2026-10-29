import { Flex, Typography } from 'antd';

import LedgerFilters from './LedgerFilters';
import PendingReturnsSection from './PendingReturnsSection';
import SummaryBar from './SummaryBar';
import TypeBadge from './TypeBadge';
import type { CashLedgerTransaction, ReturnLiabilityData } from '../../types';

const fmt = (n: number) =>
    Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
    from?: string;
    to?: string;
    fyStart: number;
    isExporting: boolean;
    credits: number;
    debits: number;
    rows: CashLedgerTransaction[];
    isLoading: boolean;
    liabilityTransactions?: ReturnLiabilityData['transactions'];
    onFromChange: (v: string | undefined) => void;
    onToChange: (v: string | undefined) => void;
    onExport: () => void;
}

const COLS = '1.2fr 1.8fr 2.5fr 1fr 1fr 1.2fr 1.2fr';
const HEADERS = [
    'Date',
    'Reference No.',
    'Description',
    'Tax Head',
    'Type',
    'Amount (₹)',
    'Balance After (₹)',
];

const CashLedgerTab = ({
    from,
    to,
    fyStart,
    isExporting,
    credits,
    debits,
    rows,
    isLoading,
    liabilityTransactions,
    onFromChange,
    onToChange,
    onExport,
}: Props) => (
    <Flex vertical gap={16}>
        <div className="border border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white px-4 sm:px-6 py-5">
            <LedgerFilters
                from={from}
                to={to}
                fyStart={fyStart}
                isExporting={isExporting}
                onFromChange={onFromChange}
                onToChange={onToChange}
                onExport={onExport}
            />
            <SummaryBar
                leftLabel="Credits"
                leftValue={`+₹${fmt(credits)}`}
                rightLabel="Debits"
                rightValue={`-₹${fmt(Math.abs(debits))}`}
            />
            <div className="border border-[#eaecf0] rounded-[10px] overflow-x-auto">
                <div
                    className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                    style={{ gridTemplateColumns: COLS, minWidth: 640 }}
                >
                    {HEADERS.map((h, i) => (
                        <div
                            key={i}
                            className="px-4 py-3 text-sm font-semibold whitespace-nowrap"
                            style={{ color: '#42526d' }}
                        >
                            {h}
                        </div>
                    ))}
                </div>
                {isLoading && (
                    <div className="px-4 py-8 text-center">
                        <Typography.Text style={{ color: '#94a3b8' }}>Loading...</Typography.Text>
                    </div>
                )}
                {!isLoading && rows.length === 0 && (
                    <div className="px-4 py-8 text-center">
                        <Typography.Text style={{ color: '#94a3b8' }}>
                            No transactions found
                        </Typography.Text>
                    </div>
                )}
                {!isLoading &&
                    rows.map((row, i) => (
                        <div
                            key={i}
                            className="grid items-center border-b border-[#eaecf0] last:border-b-0 hover:bg-[#fafafa]"
                            style={{ gridTemplateColumns: COLS, minHeight: 52, minWidth: 640 }}
                        >
                            <div className="px-4 py-3">
                                <Typography.Text className="text-xs" style={{ color: '#475569' }}>
                                    {row.date}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text
                                    className="text-xs font-mono"
                                    style={{ color: '#475569' }}
                                >
                                    {row.refNo}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text className="text-xs" style={{ color: '#1e293b' }}>
                                    {row.desc}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text className="text-xs" style={{ color: '#475569' }}>
                                    {row.taxHead}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <TypeBadge type={row.type} />
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text
                                    className="text-sm font-medium"
                                    style={{ color: row.amount >= 0 ? '#16a34a' : '#dc2626' }}
                                >
                                    {row.amount >= 0 ? '+' : '-'}₹{fmt(Math.abs(row.amount))}
                                </Typography.Text>
                            </div>
                            <div className="px-4 py-3">
                                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                    ₹{fmt(row.balanceAfter)}
                                </Typography.Text>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
        <PendingReturnsSection transactions={liabilityTransactions} />
    </Flex>
);

export default CashLedgerTab;
