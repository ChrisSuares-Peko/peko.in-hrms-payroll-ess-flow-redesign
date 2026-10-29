import { useCallback, useEffect, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Input, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import CommissionInvoiceEditor from '../components/manualOperations/CommissionInvoiceEditor';
import TabHeader from '../components/serviceDetail/TabHeader';
import { commissionInvoicePath } from '../config/manualOperations';
import { ACCOUNTING_SERVICE_CATEGORY } from '../config/servicePaths';
import useCommissionInvoice from '../hooks/useCommissionInvoice';
import {
    CommissionInvoiceBilledTo,
    CommissionInvoiceMatch,
    CommissionInvoiceSource,
    CommissionInvoiceTarget,
} from '../types/commissionInvoice';
import { formatInr } from '../utils/commission';

export const COMMISSION_INVOICE_INTRO =
    'Find a commission invoice by the order’s transaction id or by the entry number of a commission recorded by hand. Check how it reads, change who it is billed to and send it to the vendor. The state picked sets the place of supply and whether IGST or CGST and SGST applies. The billed-to you save stays on the invoice and is used whenever it is downloaded or sent again.';

const SOURCE_LABELS: Record<CommissionInvoiceSource, string> = {
    order: 'Order',
    manual: 'Recorded by hand',
};

const targetFromParams = (params: URLSearchParams): CommissionInvoiceTarget | null => {
    const vendorId = params.get('vendor');
    const source = params.get('source');
    const id = params.get('id');
    if (!vendorId || !id || (source !== 'order' && source !== 'manual')) return null;
    return { vendorId, source, id };
};

const matchColumns = (
    open: (match: CommissionInvoiceMatch) => void
): GenericColumns<CommissionInvoiceMatch> => [
    {
        title: 'Invoice',
        key: 'invoiceNumber',
        width: 160,
        render: (_, row) => row.invoiceNumber || '—',
    },
    { title: 'Vendor', key: 'vendorName', width: 200, render: (_, row) => row.vendorName || '—' },
    {
        title: 'Date',
        key: 'issuedDate',
        width: 130,
        render: (_, row) => (row.issuedDate ? dayjs(row.issuedDate).format('DD MMM YYYY') : '—'),
    },
    { title: 'Amount', key: 'total', width: 140, render: (_, row) => formatInr(row.total) },
    { title: 'Source', key: 'source', width: 150, render: (_, row) => SOURCE_LABELS[row.source] },
    {
        title: 'Actions',
        key: 'actions',
        width: 120,
        neverFold: true,
        render: (_, row) => (
            <Button size="small" onClick={() => open(row)} aria-label={`Open ${row.invoiceNumber}`}>
                Open
            </Button>
        ),
    },
];

const CommissionInvoice = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(services?.data, 'Vendors', ACCOUNTING_SERVICE_CATEGORY);
    const canUpdate = Boolean(access?.update);

    const {
        matches,
        searched,
        isSearching,
        invoice,
        target,
        isLoading,
        notFound,
        previewHtml,
        placement,
        isSaving,
        isSending,
        search,
        open,
        preview,
        save,
        send,
        close,
    } = useCommissionInvoice();

    const [text, setText] = useState('');
    const requested = useMemo(() => targetFromParams(searchParams), [searchParams]);
    const requestedKey = requested
        ? `${requested.vendorId}:${requested.source}:${requested.id}`
        : '';

    useEffect(() => {
        if (requested) {
            open(requested);
        } else {
            close();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestedKey]);

    const goTo = useCallback(
        (match: CommissionInvoiceTarget) => navigate(commissionInvoicePath(match)),
        [navigate]
    );

    const onSearch = async (value: string) => {
        const found = await search(value);
        if (found.length === 1) goTo(found[0]);
        else if (target) navigate(commissionInvoicePath(), { replace: true });
    };

    const onSave = async (billedTo: CommissionInvoiceBilledTo) => {
        const result = await save(billedTo);
        if (result) dispatch(showToast({ description: result.message, variant: 'success' }));
    };

    const onSend = async (to: string[]) => {
        const result = await send(to);
        if (result) dispatch(showToast({ description: result.message, variant: 'success' }));
    };

    const showMatches = !invoice && !isLoading && matches.length > 1;
    const showNoMatch = !invoice && !isLoading && !isSearching && searched && matches.length === 0;

    return (
        <Flex vertical gap={20}>
            <TabHeader
                title="Commission Invoice"
                description={COMMISSION_INVOICE_INTRO}
                action={
                    <Input.Search
                        className="w-[360px] max-w-full"
                        placeholder="Transaction id or entry number"
                        enterButton={<SearchOutlined />}
                        value={text}
                        loading={isSearching}
                        onChange={changed => setText(changed.target.value)}
                        onSearch={onSearch}
                        aria-label="Transaction id or entry number"
                    />
                }
            />

            {isLoading && <Skeleton active paragraph={{ rows: 8 }} />}

            {showNoMatch && (
                <Card className="rounded-xl border border-borderCard shadow-none text-center">
                    <Typography.Title level={5} className="!text-textHeadings">
                        No commission invoice for {searched}
                    </Typography.Title>
                    <Typography.Text className="text-textBody">
                        An order shows up once its payment raised a commission invoice; a commission
                        recorded by hand by its entry number. Check it on the vendor’s Commissions
                        tab and try again.
                    </Typography.Text>
                </Card>
            )}

            {!isLoading && notFound && !showNoMatch && (
                <Card className="rounded-xl border border-borderCard shadow-none text-center">
                    <Typography.Title level={5} className="!text-textHeadings">
                        Invoice not available
                    </Typography.Title>
                    <Typography.Text className="text-textBody">
                        This entry has no commission invoice to show, or the vendor does not earn a
                        commission on it.
                    </Typography.Text>
                </Card>
            )}

            {showMatches && (
                <GenericTable
                    rowKey={row => `${row.source}:${row.vendorId}:${row.id}`}
                    columns={matchColumns(goTo)}
                    dataSource={matches}
                    pagination={false}
                    className="rounded-xl border border-solid border-borderCard overflow-hidden"
                />
            )}

            {invoice && (
                <CommissionInvoiceEditor
                    key={`${invoice.source}:${invoice.vendor.id}:${invoice.id}`}
                    invoice={invoice}
                    previewHtml={previewHtml}
                    placement={placement ?? invoice}
                    canUpdate={canUpdate}
                    isSaving={isSaving}
                    isSending={isSending}
                    onDraft={preview}
                    onSave={onSave}
                    onSend={onSend}
                />
            )}
        </Flex>
    );
};

export default CommissionInvoice;
