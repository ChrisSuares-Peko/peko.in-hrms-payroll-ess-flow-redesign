import React, { useMemo, useState } from 'react';

import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import InvoiceListItem from '../components/eWaybill/InvoiceListItem';
import InvoiceSelectionPanel from '../components/eWaybill/InvoiceSelectionPanel';
import TransportDetailsCard from '../components/eWaybill/TransportDetailsCard';
import LeftHeader from '../components/shared/LeftHeader';
import useEWaybillInvoices from '../hooks/eWayBill/useEWaybillInvoices';
import useGenerateEWaybill from '../hooks/eWayBill/useGenerateEWaybill';
import { ActiveWaybillEntry } from '../types/eWaybill';

const EWaybill: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedInvoiceId = (location.state as { preselectedInvoiceId?: string } | null)
        ?.preselectedInvoiceId;

    const [filters, setFilters] = useState({ searchText: '' });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(
        preselectedInvoiceId
    );

    const { invoices, recordsTotal, isLoading, hasMore, loadMore } = useEWaybillInvoices(
        filters.searchText
    );
    const { generate } = useGenerateEWaybill(selectedInvoiceId);

    // TODO: replace with API-driven active waybills
    const activeWaybills = useMemo<ActiveWaybillEntry[]>(() => [], []);

    const displayedInvoices = useMemo(
        () =>
            preselectedInvoiceId
                ? invoices.filter(inv => inv.id === preselectedInvoiceId)
                : invoices,
        [invoices, preselectedInvoiceId]
    );

    const selectedInvoice = useMemo(
        () => invoices.find(inv => inv.id === selectedInvoiceId),
        [invoices, selectedInvoiceId]
    );

    return (
        <Content className="px-0">
            <LeftHeader
                title="Generate E-Waybill"
                titleClass="text-xl md:text-2xl"
                description="Link transport details to an active IRN"
            />

            <Flex gap={20} className="flex-col lg:flex-row lg:items-stretch mt-7">
                <Flex className="w-full h-[420px] lg:h-auto lg:w-[45%] lg:flex-shrink-0 lg:relative">
                    <Flex className="lg:absolute lg:inset-0 overflow-hidden w-full h-full">
                        <InvoiceSelectionPanel
                            eligibleInvoices={displayedInvoices}
                            recordsTotal={
                                preselectedInvoiceId ? displayedInvoices.length : recordsTotal
                            }
                            activeWaybills={activeWaybills}
                            selectedInvoiceId={selectedInvoiceId}
                            searchText={searchText}
                            isLoading={isLoading}
                            hasMore={preselectedInvoiceId ? false : hasMore}
                            onSearchChange={preselectedInvoiceId ? undefined : updateSearchText}
                            onSelect={inv => setSelectedInvoiceId(inv.id)}
                            onLoadMore={loadMore}
                        />
                    </Flex>
                </Flex>

                <Flex vertical gap={20} className="flex-1 min-w-0">
                    {selectedInvoice && <InvoiceListItem invoice={selectedInvoice} />}
                    <TransportDetailsCard
                        key={selectedInvoiceId ?? 'none'}
                        onCancel={() =>
                            navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicing}`)
                        }
                        onSubmit={generate}
                        submitDisabled={!selectedInvoiceId}
                    />
                </Flex>
            </Flex>
        </Content>
    );
};

export default EWaybill;
