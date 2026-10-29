import { useEffect, useMemo, useState } from 'react';

import { Empty, Flex, Input, Pagination, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';

import { getComplianceListApi } from '../api';
import iconDocSearch from '../assets/icons/icon-doc-search.svg';
import { selectAllDrafts } from '../slices/complianceFormSlice';
import type { ComplianceItem } from '../types';
import { complianceHealthItems, type MyComplianceRow } from '../utils/data';
import { getMyCompliancesColumns } from '../utils/myCompliancesColumns';
import useFilter, { COMPLIANCE_FILTER_INITIAL_STATE, type ComplianceFilterState } from '../utils/useFilter';

const { Text, Title } = Typography;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyCompliances() {
    const navigate = useNavigate();
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);
    const allDrafts = useAppSelector(selectAllDrafts);

    const [filter, setFilter] = useState<ComplianceFilterState>(COMPLIANCE_FILTER_INITIAL_STATE);
    const [apiData, setApiData] = useState<ComplianceItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const { handleSearch, handlePageChange } = useFilter({ setFilter });

    useEffect(() => {
        setLoading(true);
        getComplianceListApi({
            userId,
            userType,
            page: filter.page,
            pageSize: filter.pageSize,
            searchText: filter.searchText,
            from: filter.from,
            to: filter.to,
            status: filter.status,
        })
            .then((res) => {
                if (res) {
                    setApiData(res.rows);
                    setTotal(res.recordsTotal);
                }
            })
            .finally(() => setLoading(false));
    }, [userId, userType, filter]);

    // Merge API records with static catalog metadata (deduplicate by title)
    const rows = useMemo((): MyComplianceRow[] => {
        const seen = new Set<string>();
        return apiData.flatMap((record) => {
            if (seen.has(record.title)) return [];
            seen.add(record.title);
            const catalogItem =
                complianceHealthItems.find((item) => item.title === record.title) ??
                complianceHealthItems.find((item) => item.complianceType === record.complianceType && !item.sectionOnly);
            return [{ ...(catalogItem ?? { id: record.title, title: record.title }), apiRecord: record } as MyComplianceRow];
        });
    }, [apiData]);

    // Draft rows from persisted Redux slice (one per compliance type with in-progress data)
    const draftRows = useMemo((): MyComplianceRow[] => {
        const apiComplianceTypes = new Set(apiData.map((r) => r.complianceType));
        const apiTitles = new Set(apiData.map((r) => r.title));
        return Object.entries(allDrafts)
            .filter(([complianceType, draft]) => {
                const catalogItem = complianceHealthItems.find(
                    (item) => item.complianceType === complianceType && !item.sectionOnly
                );
                const alreadySubmitted =
                    apiComplianceTypes.has(complianceType) ||
                    (catalogItem && apiTitles.has(catalogItem.title));
                return !alreadySubmitted &&
                    (Object.keys(draft.companyInfo).length > 0 || draft.currentStep > 0);
            })
            .flatMap(([complianceType]) => {
                const catalogItem = complianceHealthItems.find(
                    (item) => item.complianceType === complianceType && !item.sectionOnly
                );
                return catalogItem ? [{ ...catalogItem, isDraft: true } as MyComplianceRow] : [];
            });
    }, [allDrafts, apiData]);

    const displayRows = useMemo(
        () => [...draftRows, ...rows],
        [draftRows, rows]
    );

    const columns = getMyCompliancesColumns(navigate);

    return (
        <Flex vertical gap={24} style={{ width: '100%', paddingBottom: 48 }}>
            <Flex vertical gap={6}>
                <Title level={2} style={{ fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 600, lineHeight: '38px', color: '#101828', margin: 0 }}>
                    My compliances
                </Title>
                <Text style={{ fontSize: 'clamp(14px, 1.2vw, 20px)', color: '#6a7282', lineHeight: '32px' }}>
                    Track your compliance status, upcoming deadlines, and pending actions in one place.
                </Text>
            </Flex>

            <Input
                prefix={
                    <img
                        src={iconDocSearch}
                        alt=""
                        className="size-[18px] mr-1"
                        style={{ filter: 'invert(70%) sepia(5%) saturate(500%) hue-rotate(200deg) brightness(90%) contrast(85%)' }}
                    />
                }
                placeholder="Search compliances..."
                value={filter.searchText}
                onChange={handleSearch}
                allowClear
                style={{ height: 44, borderRadius: 8, borderColor: '#e4e4e7', fontSize: 14, width: '100%' }}
            />

            <Spin spinning={loading}>
                <Flex vertical style={{ background: '#FFFFFF', border: '1px solid #EFF1F4', borderRadius: 20, overflow: 'hidden', width: '100%' }}>
                    {!loading && displayRows.length === 0 ? (
                        <Empty description="No compliance records found" style={{ padding: '40px 0' }} />
                    ) : (
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                            <GenericTable
                                rowKey="id"
                                columns={columns}
                                dataSource={displayRows}
                                pagination={false}
                                scroll={{ x: 1100 }}
                            />
                        </div>
                    )}
                </Flex>
                {total > filter.pageSize && (
                    <Pagination
                        current={filter.page}
                        total={total}
                        pageSize={filter.pageSize}
                        onChange={handlePageChange}
                        size="default"
                        className="text-end pt-7"
                    />
                )}
            </Spin>
        </Flex>
    );
}
