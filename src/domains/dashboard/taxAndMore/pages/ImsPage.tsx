import { useCallback, useEffect, useState } from 'react';

import { CalendarOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Select, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import Gstr3bModal from './ims/Gstr3bModal';
import ImsSidebar from './ims/ImsSidebar';
import {
    getMonthOptions,
    mapApiSuppliers,
    MONTH_NAMES,
    SELECT_STYLE,
    StatusFilter,
    TypeTab,
} from './ims/imsUtils';
import RecipientView from './ims/RecipientView';
import SupplierView from './ims/SupplierView';
import useAddedBackLiabilities from '../hooks/useAddedBackLiabilities';
import useImsData from '../hooks/useImsData';
import useImsSupplierData from '../hooks/useImsSupplierData';
import { ImsInvoiceStatus } from '../types';
import { FINANCIAL_YEARS } from '../utils/data';

const ImsPage = () => {
    const navigate = useNavigate();
    const { activeSetup, selectedFinancialYear } = useAppSelector(state => state.reducer.taxMore);

    const [activeMainTab, setActiveMainTab] = useState<'recipient' | 'supplier'>('recipient');
    const [gstr3bModalOpen, setGstr3bModalOpen] = useState(false);
    const [activeTypeTab, setActiveTypeTab] = useState<TypeTab>('all');
    const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [debouncedSupplierSearch, setDebouncedSupplierSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSupplierSearch(supplierSearch), 400);
        return () => clearTimeout(timer);
    }, [supplierSearch]);

    const [selectedFY, setSelectedFY] = useState<string>(
        selectedFinancialYear ?? activeSetup?.financialYear ?? FINANCIAL_YEARS[0]
    );
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [debouncedFY, setDebouncedFY] = useState(selectedFY);
    const [debouncedMonth, setDebouncedMonth] = useState(selectedMonth);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedFY(selectedFY);
            setDebouncedMonth(selectedMonth);
        }, 500);
        return () => clearTimeout(t);
    }, [selectedFY, selectedMonth]);

    const gstin = activeSetup?.gstin ?? '';
    const apiTab = activeTypeTab === 'ecommerce' ? 'ecom' : activeTypeTab;
    let apiActionFilter: string | undefined;
    if (activeStatusFilter === 'all') apiActionFilter = undefined;
    else if (activeStatusFilter === 'to-review') apiActionFilter = 'to_review';
    else apiActionFilter = activeStatusFilter;

    const imsParams =
        gstin && debouncedFY && debouncedMonth
            ? {
                  gstin,
                  financialYear: debouncedFY,
                  month: debouncedMonth,
                  tab: apiTab,
                  ...(apiActionFilter ? { actionFilter: apiActionFilter } : {}),
                  page,
                  limit: 10,
                  ...(debouncedSearch ? { search: debouncedSearch } : {}),
              }
            : null;

    const {
        imsData,
        itcEstimate,
        saveHistory,
        isLoading,
        actioningId,
        isSaving,
        hasUnsavedChanges,
        isProceeding,
        actionInvoice,
        save,
        proceed,
    } = useImsData(imsParams);

    const supplierBaseParams =
        gstin && debouncedFY && debouncedMonth
            ? { gstin, financialYear: debouncedFY, month: debouncedMonth }
            : null;
    const supplierParams = supplierBaseParams
        ? {
              ...supplierBaseParams,
              ...(debouncedSupplierSearch ? { search: debouncedSupplierSearch } : {}),
          }
        : null;
    const {
        customers: supplierCustomers,
        summary: supplierSummary,
        isLoading: isSupplierLoading,
    } = useImsSupplierData(supplierParams);
    const { liabilities, isLoading: isLiabilitiesLoading } =
        useAddedBackLiabilities(supplierBaseParams);

    const handleInvoiceAction = useCallback(
        (invId: string, status: ImsInvoiceStatus) => {
            const imsAction = status === 'to-review' ? 'noaction' : status;
            actionInvoice(invId, imsAction);
        },
        [actionInvoice]
    );

    const handleSaveAndProceed = useCallback(async () => {
        const saved = await save();
        if (saved) {
            const ok = await proceed();
            if (ok) {
                setGstr3bModalOpen(false);
                navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstr2b}`);
            }
        }
    }, [save, proceed, navigate]);

    const mappedSuppliers = imsData ? mapApiSuppliers(imsData.suppliers) : [];
    const filteredSuppliers = mappedSuppliers;
    const totalCount = imsData?.itcEstimate?.totalCount ?? 0;
    const reviewedCount = imsData?.itcEstimate?.reviewedCount ?? 0;
    const notReviewedCount = totalCount - reviewedCount;

    const fyStart = selectedFY ? parseInt(selectedFY.split('-')[0], 10) : new Date().getFullYear();
    const calYear = selectedMonth >= 4 ? fyStart : fyStart + 1;
    const periodLabel = `${MONTH_NAMES[selectedMonth - 1]} ${calYear}`;

    const monthOptions = getMonthOptions(fyStart);

    return (
        <>
            <Flex vertical gap={16}>
                <Row
                    align="middle"
                    gutter={[12, 8]}
                    className="bg-white border border-[#cbd5e1] rounded-[14px] px-4 sm:px-6 py-[14px]"
                >
                    <Col xs={24} sm="auto" className="flex flex-wrap items-center gap-2">
                        <CalendarOutlined style={{ fontSize: 16, color: '#475569' }} />
                        <Typography.Text
                            className="text-xs font-medium whitespace-nowrap"
                            style={{ color: '#475569' }}
                        >
                            Period
                        </Typography.Text>
                        <Flex gap={8} wrap="wrap">
                            <Select
                                value={selectedFY}
                                onChange={setSelectedFY}
                                options={FINANCIAL_YEARS.map(fy => ({
                                    value: fy,
                                    label: `FY ${fy}`,
                                }))}
                                style={{ ...SELECT_STYLE, minWidth: 110 }}
                                variant="outlined"
                            />
                            <Select
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                options={monthOptions}
                                style={{ ...SELECT_STYLE, minWidth: 120 }}
                                variant="outlined"
                            />
                        </Flex>
                    </Col>
                    <Col xs={24} sm="auto" className="sm:ml-auto">
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#475569' }}
                        >
                            Showing data for {periodLabel}
                        </Typography.Text>
                    </Col>
                </Row>

                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    gap={8}
                    className="border border-[#81cf92] rounded-[14px] px-4 sm:px-6 py-3"
                    style={{ backgroundColor: '#ecfdf5' }}
                >
                    <Flex gap={6} align="center" wrap="wrap">
                        <CalendarOutlined style={{ fontSize: 14, color: '#43b75d' }} />
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#43b75d' }}
                        >
                            Step 3 of 6 — Review IMS
                        </Typography.Text>
                        <Typography.Text className="text-[11px]" style={{ color: '#43b75d' }}>
                            Completed ✓
                        </Typography.Text>
                    </Flex>
                    <Typography.Text className="text-xs font-medium" style={{ color: '#475569' }}>
                        {periodLabel}
                    </Typography.Text>
                </Flex>

                <Flex vertical gap={0}>
                    <Flex
                        align="center"
                        justify="space-between"
                        wrap="wrap"
                        gap={8}
                        className="px-0 py-3"
                    >
                        <Flex vertical gap={2}>
                            <Typography.Text
                                className="font-semibold"
                                style={{ fontSize: 20, color: '#1f2937' }}
                            >
                                Invoice Management
                            </Typography.Text>
                            <Typography.Text className="text-sm" style={{ color: '#6b7280' }}>
                                Review supplier invoices before filing GSTR-3B
                            </Typography.Text>
                        </Flex>
                        <Select
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            options={monthOptions}
                            style={{ ...SELECT_STYLE, minWidth: 120 }}
                            variant="outlined"
                        />
                    </Flex>

                    <Flex gap={0} className="border-b border-[#e2e8f0]">
                        {(['recipient', 'supplier'] as const).map(tab => (
                            <button
                                key={tab}
                                type="button"
                                className="px-4 sm:px-8 py-3 text-sm font-medium capitalize transition-colors"
                                style={{
                                    color: activeMainTab === tab ? '#ff4f4f' : '#1e293b',
                                    borderBottom:
                                        activeMainTab === tab
                                            ? '2px solid #ff4f4f'
                                            : '2px solid transparent',
                                    marginBottom: -1,
                                }}
                                onClick={() => setActiveMainTab(tab)}
                            >
                                {tab === 'recipient' ? '👤 Recipient' : '📦 Supplier'}
                            </button>
                        ))}
                    </Flex>
                </Flex>

                <Row gutter={[16, 16]} align="top">
                    <Col xs={24} xl={17}>
                        {activeMainTab === 'supplier' && (
                            <SupplierView
                                customers={supplierCustomers}
                                isLoading={isSupplierLoading}
                                liabilities={liabilities}
                                isLiabilitiesLoading={isLiabilitiesLoading}
                                saveHistory={saveHistory}
                                search={supplierSearch}
                                onSearchChange={setSupplierSearch}
                            />
                        )}
                        {activeMainTab === 'recipient' && (
                            <RecipientView
                                isLoading={isLoading}
                                actioningId={actioningId}
                                saveHistory={saveHistory}
                                reconciliationId={
                                    imsData?.reconciliationId
                                        ? String(imsData.reconciliationId)
                                        : undefined
                                }
                                deadline={imsData?.deadline}
                                reviewedCount={reviewedCount}
                                totalCount={totalCount}
                                filteredSuppliers={filteredSuppliers}
                                tabCounts={imsData?.tabCounts ?? null}
                                actionCounts={imsData?.actionCounts ?? null}
                                pagination={imsData?.pagination ?? null}
                                expandedId={expandedId}
                                activeTypeTab={activeTypeTab}
                                activeStatusFilter={activeStatusFilter}
                                search={search}
                                onTypeTabChange={t => {
                                    setActiveTypeTab(t);
                                    setPage(1);
                                }}
                                onStatusFilterChange={f => {
                                    setActiveStatusFilter(f);
                                    setPage(1);
                                }}
                                onSearchChange={setSearch}
                                onPageChange={setPage}
                                onToggleExpand={id =>
                                    setExpandedId(prev => (prev === id ? null : id))
                                }
                                onInvoiceAction={handleInvoiceAction}
                            />
                        )}
                    </Col>
                    <Col xs={24} xl={7}>
                        <ImsSidebar
                            activeMainTab={activeMainTab}
                            isLoading={isLoading}
                            isSaving={isSaving}
                            hasUnsavedChanges={hasUnsavedChanges}
                            itcEstimate={itcEstimate}
                            supplierSummary={supplierSummary}
                            pendingCount={notReviewedCount}
                            onSave={save}
                            onGoToGstr2b={() => setGstr3bModalOpen(true)}
                            onGoToGstr1a={() =>
                                navigate(`${paths.dashboard.taxMore}/${paths.taxMore.fileGstr1}`, {
                                    state: { goToAmendments: true },
                                })
                            }
                        />
                    </Col>
                </Row>
            </Flex>

            <Gstr3bModal
                open={gstr3bModalOpen}
                pendingCount={notReviewedCount}
                hasUnsavedChanges={hasUnsavedChanges}
                isProceeding={isProceeding}
                isSaving={isSaving}
                onClose={() => setGstr3bModalOpen(false)}
                onSaveAndProceed={handleSaveAndProceed}
                onProceed={async () => {
                    const ok = await proceed();
                    if (ok) {
                        setGstr3bModalOpen(false);
                        navigate(`${paths.dashboard.taxMore}/${paths.taxMore.gstr2b}`);
                    }
                }}
            />
        </>
    );
};

export default ImsPage;
