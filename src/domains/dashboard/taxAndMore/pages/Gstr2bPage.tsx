import { useCallback, useEffect, useRef, useState } from 'react';

import { InfoCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Flex, Spin, Typography } from 'antd';
import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { MONTH_NAMES } from './ims/imsUtils';
import {
    exportGstr2b,
    exportGstr2bReconciliationReport,
    regenerateGstr2b,
    getGstr2bRegenStatus,
} from '../api/tax';
import FetchStateBanner from '../components/gstr2b/FetchStateBanner';
import Gstr2bDataPanel from '../components/gstr2b/Gstr2bDataPanel';
import Gstr2bSidebar from '../components/gstr2b/Gstr2bSidebar';
import PageHeader from '../components/gstr2b/PageHeader';
import PeriodBar from '../components/gstr2b/PeriodBar';
import StepBanner from '../components/gstr2b/StepBanner';
import useGstr2bData from '../hooks/useGstr2bData';
import { FINANCIAL_YEARS } from '../utils/data';
import type { FetchState, MatchFilter, TabKey } from '../utils/gstr2bTypes';

const Gstr2bPage = () => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { activeSetup } = useAppSelector(state => state.reducer.taxMore);
    const gstin = activeSetup?.gstin ?? '';

    const [search, setSearch] = useState('');
    const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
    const [fetchState, setFetchState] = useState<FetchState>('idle');
    const [selectedFY, setSelectedFY] = useState(FINANCIAL_YEARS[0]);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [activeTab, setActiveTab] = useState<TabKey>('B2B');
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

    const handleFYChange = (fy: string) => {
        setSelectedFY(fy);
        setSelectedMonth(new Date().getMonth() + 1);
        setFetchState('idle');
    };

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
        setFetchState('idle');
    };

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setExpandedKeys([]);
        setSearch('');
    };

    const onExpand = (expanded: boolean, record: { id: string }) =>
        setExpandedKeys(
            expanded ? [...expandedKeys, record.id] : expandedKeys.filter(k => k !== record.id)
        );

    const fyStart = selectedFY ? parseInt(selectedFY.split('-')[0], 10) : new Date().getFullYear();
    const calYear = selectedMonth >= 4 ? fyStart : fyStart + 1;
    const periodLabel = `${MONTH_NAMES[selectedMonth - 1]} ${calYear}`;

    const gstr2bParams =
        gstin && selectedFY && selectedMonth
            ? { gstin, financialYear: selectedFY, month: selectedMonth }
            : null;

    const {
        b2bRows,
        b2baRows,
        cdnRows,
        impgRows,
        isdRows,
        tdsRows,
        tcsRows,
        itcSummary,
        itcAvailable,
        itcNotAvailable,
        generatedDate,
        isLoading,
        requiresAuth,
        hasData,
        isReconciled,
        fetch: fetchGstr2b,
        fetchReconStatus,
        markReconciled,
    } = useGstr2bData(gstr2bParams);

    useEffect(() => {
        setExpandedKeys([]);
    }, [hasData]);

    const handleExportCsv = useCallback(async () => {
        const resp = await exportGstr2b({
            userId: id,
            userType: role,
            gstin,
            financialYear: selectedFY,
            month: selectedMonth,
            type: 'excel',
            search: search || undefined,
            matchStatus: matchFilter !== 'all' ? matchFilter : undefined,
        });
        if (!resp || !resp.status) {
            dispatch(
                showToast({
                    description: (resp as any)?.message || 'No data available for export',
                    variant: 'error',
                })
            );
            return;
        }
        const arrayBuffer = new Uint8Array(resp.data.buffer.data);
        const blob = new Blob([arrayBuffer], { type: resp.data.fileType });
        saveAs(blob, `GSTR2B_${gstin}_${selectedFY}_${selectedMonth}.xlsx`);
    }, [dispatch, id, role, gstin, selectedFY, selectedMonth, search, matchFilter]);

    const handleDownloadReport = useCallback(async () => {
        const resp = await exportGstr2bReconciliationReport({
            userId: id,
            userType: role,
            gstin,
            financialYear: selectedFY,
            month: selectedMonth,
        });
        if (!resp || !resp.status) {
            dispatch(
                showToast({
                    description: (resp as any)?.message || 'No data available for export',
                    variant: 'error',
                })
            );
            return;
        }
        const arrayBuffer = new Uint8Array(resp.data.buffer.data);
        const blob = new Blob([arrayBuffer], { type: resp.data.fileType });
        saveAs(blob, `GSTR2B_Reconciliation_${gstin}_${selectedFY}_${selectedMonth}.xlsx`);
    }, [dispatch, id, role, gstin, selectedFY, selectedMonth]);

    const handleFetch = useCallback(async () => {
        if (!gstin || !selectedFY || !selectedMonth) return;
        setFetchState('fetching');
        const success = await fetchGstr2b();
        setFetchState(success ? 'loaded' : 'idle');
        if (success) fetchReconStatus();
    }, [gstin, selectedFY, selectedMonth, fetchGstr2b, fetchReconStatus]);

    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    const handleRegenerate = useCallback(async () => {
        if (!gstin || !selectedFY || !selectedMonth) return;
        setFetchState('regen-polling');
        const postResp = await regenerateGstr2b({
            userId: id,
            userType: role,
            gstin,
            financialYear: selectedFY,
            month: selectedMonth,
        });
        if (!postResp || !postResp.status) {
            setFetchState('loaded');
            return;
        }
        const poll = async () => {
            const statusResp = await getGstr2bRegenStatus({ userId: id, userType: role, gstin });
            if (statusResp && statusResp.status && statusResp.data?.processing === false) {
                stopPolling();
                const success = await fetchGstr2b();
                setFetchState(success ? 'loaded' : 'idle');
                if (success) fetchReconStatus();
            } else if (!statusResp || !statusResp.status) {
                stopPolling();
                setFetchState('loaded');
            } else {
                pollTimerRef.current = setTimeout(poll, 3000);
            }
        };
        pollTimerRef.current = setTimeout(poll, 3000);
    }, [gstin, selectedFY, selectedMonth, id, role, fetchGstr2b, fetchReconStatus]);

    useEffect(() => stopPolling, []);

    const filtered = b2bRows.filter(r => {
        const matchesSearch =
            !search ||
            r.supplierName.toLowerCase().includes(search.toLowerCase()) ||
            r.gstin.toLowerCase().includes(search.toLowerCase()) ||
            r.invoiceNo.toLowerCase().includes(search.toLowerCase());
        return matchesSearch && (matchFilter === 'all' || r.status === matchFilter);
    });

    return (
        <Flex vertical gap={16}>
            <PeriodBar
                selectedFY={selectedFY}
                selectedMonth={selectedMonth}
                onFYChange={handleFYChange}
                onMonthChange={handleMonthChange}
            />
            <StepBanner periodLabel={periodLabel} />
            <PageHeader
                fetchState={fetchState}
                periodLabel={periodLabel}
                isReconciled={isReconciled}
                hasGstin={!!gstin}
                onFetch={handleFetch}
                onMarkReconciled={markReconciled}
                onFetchStateChange={setFetchState}
                onExportCsv={handleExportCsv}
            />
            <FetchStateBanner
                fetchState={fetchState}
                periodLabel={periodLabel}
                itcAvailable={itcAvailable}
                itcNotAvailable={itcNotAvailable}
                generatedDate={generatedDate}
                onRegenerate={handleRegenerate}
                onFetchStateChange={setFetchState}
            />

            {requiresAuth && (
                <Flex
                    gap={10}
                    align="flex-start"
                    className="border border-[#fcd34d] rounded-[14px] px-6 py-5"
                    style={{ backgroundColor: '#fffbeb' }}
                >
                    <InfoCircleOutlined
                        style={{ fontSize: 18, color: '#f59e0b', flexShrink: 0, marginTop: 2 }}
                    />
                    <Flex vertical gap={4}>
                        <Typography.Text
                            className="font-medium"
                            style={{ fontSize: 16, color: '#1e293b' }}
                        >
                            GST Portal Session Expired
                        </Typography.Text>
                        <Typography.Text className="text-xs" style={{ color: '#92400e' }}>
                            Your portal session has expired. Please reconnect via the portal
                            settings to fetch GSTR-2B data.
                        </Typography.Text>
                    </Flex>
                </Flex>
            )}

            {isLoading && (
                <Flex justify="center" align="center" style={{ padding: '40px 0' }}>
                    <Spin
                        indicator={<SyncOutlined spin style={{ fontSize: 28, color: '#ff4f4f' }} />}
                    />
                </Flex>
            )}

            {!isLoading && (
                <Flex gap={16} align="flex-start" wrap="wrap">
                    <Gstr2bDataPanel
                        search={search}
                        onSearchChange={setSearch}
                        matchFilter={matchFilter}
                        onMatchFilterChange={setMatchFilter}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        filtered={filtered}
                        expandedKeys={expandedKeys}
                        onExpand={onExpand}
                        b2baRows={b2baRows}
                        cdnRows={cdnRows}
                        impgRows={impgRows}
                        isdRows={isdRows}
                        tdsRows={tdsRows}
                        tcsRows={tcsRows}
                        amdRows={[]}
                    />
                    <Gstr2bSidebar
                        itcSummary={itcSummary}
                        b2bRows={b2bRows}
                        hasData={hasData}
                        onDownloadReport={handleDownloadReport}
                    />
                </Flex>
            )}
        </Flex>
    );
};

export default Gstr2bPage;
