import { ReactNode } from 'react';

import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { LinkableDocument } from '../../utils/linkDocumentData';

const { Text } = Typography;

const STATUS_STYLES: Record<string, string> = {
    Paid: '!bg-success-surface !text-green-600',
    Pending: '!bg-warning-surface !text-warning',
    Overdue: '!bg-danger-surface !text-red-600',
};
const STATUS_FALLBACK = '!bg-slate-100 !text-bodyText';

interface LinkableDocumentItemProps {
    document: LinkableDocument;

    icon: ReactNode;
    selected: boolean;

    alreadyLinked?: boolean;
    onLink: () => void;
}

const LinkableDocumentItem = ({
    document,
    icon,
    selected,
    alreadyLinked = false,
    onLink,
}: LinkableDocumentItemProps) => {
    let linkLabel = 'Link';
    if (alreadyLinked) linkLabel = 'Linked';
    else if (selected) linkLabel = 'Selected';

    return (
        <Flex
            align="center"
            justify="space-between"
            gap={16}
            className={`rounded-2xl border bg-white px-4 py-4 transition-colors ${
                selected || alreadyLinked ? 'border-danger bg-red-50' : 'border-borderSubtle'
            }`}
        >
            <Flex align="center" gap={12} className="min-w-0">
                <Flex
                    align="center"
                    justify="center"
                    className="size-9 shrink-0 rounded-lg bg-surfaceGray text-bodyText"
                >
                    {icon}
                </Flex>
                <Flex vertical gap={4} className="min-w-0">
                    <Flex align="center" gap={8} wrap="wrap">
                        <Text className="text-sm font-semibold text-ink">{document.reference}</Text>
                        {document.status && (
                            <Tag
                                bordered={false}
                                className={`!m-0 !rounded-full !px-2 !py-0.5 !text-xs !font-medium ${
                                    STATUS_STYLES[document.status] ?? STATUS_FALLBACK
                                }`}
                            >
                                {document.status}
                            </Tag>
                        )}
                    </Flex>
                    <Text className="truncate text-xs text-muted">
                        {document.party} · {document.date}
                    </Text>
                </Flex>
            </Flex>

            <Flex vertical align="flex-end" gap={4} className="shrink-0">
                <Text className="text-sm font-semibold text-ink">
                    ₹{formatNumberWithLocalString(document.amount)}
                </Text>
                <Button
                    type="link"
                    onClick={onLink}
                    disabled={alreadyLinked}
                    icon={
                        selected || alreadyLinked ? (
                            <CheckOutlined />
                        ) : (
                            <PlusOutlined className="!text-xs" />
                        )
                    }
                    className={`!h-auto !p-0 !text-sm !font-medium hover:!opacity-80 ${
                        selected || alreadyLinked ? '!text-success' : '!text-danger'
                    }`}
                >
                    {linkLabel}
                </Button>
            </Flex>
        </Flex>
    );
};

export default LinkableDocumentItem;
