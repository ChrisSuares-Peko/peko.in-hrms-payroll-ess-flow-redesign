import { FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { removeEmoji } from '@src/utils/regex';

import LinkableDocumentItem from './LinkableDocumentItem';
import { LinkableInvoice } from '../../api/transactions';
import { linkDocumentCopy } from '../../utils/linkDocumentData';

const { Text } = Typography;

interface LinkDocumentInvoiceTabProps {
    search: string;
    setSearch: (value: string) => void;
    invoices: LinkableInvoice[];
    loadingInvoices: boolean;
    selected: Record<string, LinkableInvoice>;
    selectedCount: number;
    linkedInvoiceIds: Set<string>;
    toggleSelect: (invoice: LinkableInvoice) => void;
}

const LinkDocumentInvoiceTab = ({
    search,
    setSearch,
    invoices,
    loadingInvoices,
    selected,
    selectedCount,
    linkedInvoiceIds,
    toggleSelect,
}: LinkDocumentInvoiceTabProps) => {
    const renderInvoices = () => {
        if (loadingInvoices) return <Spin className="!flex justify-center py-10" />;
        if (invoices.length === 0) {
            return (
                <Text className="py-6 text-center text-sm text-muted">
                    {linkDocumentCopy.emptyInvoices}
                </Text>
            );
        }
        return (
            <Flex vertical gap={12}>
                {invoices.map(invoice => {
                    const key = String(invoice.id);
                    return (
                        <LinkableDocumentItem
                            key={key}
                            document={{
                                id: key,
                                reference: invoice.reference,
                                party: invoice.party ?? '—',
                                date:
                                    invoice.date && dayjs(invoice.date).isValid()
                                        ? dayjs(invoice.date).format('MMM DD')
                                        : '—',
                                amount: invoice.amount ?? 0,
                                status: invoice.status ?? '',
                            }}
                            icon={<FileTextOutlined />}
                            selected={Boolean(selected[key])}
                            alreadyLinked={linkedInvoiceIds.has(key)}
                            onLink={() => toggleSelect(invoice)}
                        />
                    );
                })}
            </Flex>
        );
    };

    return (
        <Flex vertical gap={12}>
            <Input
                value={search}
                onChange={event => setSearch(event.target.value.replace(removeEmoji, ''))}
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder={linkDocumentCopy.searchInvoices}
                size="large"
                allowClear
                className="!rounded-xl"
            />

            {selectedCount > 0 && (
                <Flex wrap="wrap" gap={8}>
                    {Object.values(selected).map(invoice => (
                        <Tag
                            key={invoice.id}
                            closable
                            onClose={() => toggleSelect(invoice)}
                            className="!m-0 !rounded-full !border-danger !bg-red-50 !px-3 !py-1 !text-xs !font-medium !text-danger"
                        >
                            {invoice.reference}
                        </Tag>
                    ))}
                </Flex>
            )}
            {renderInvoices()}
        </Flex>
    );
};

export default LinkDocumentInvoiceTab;
