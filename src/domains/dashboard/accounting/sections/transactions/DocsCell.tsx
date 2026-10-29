import { CloseOutlined, PaperClipOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Popconfirm, Tooltip, Typography } from 'antd';

import { TransactionDocumentRef, TransactionLinkRef } from '../../utils/transactionsData';

const { Text } = Typography;

const REMOVE_BTN =
    '!size-5 !min-w-0 !rounded !p-0 !text-slate-400 hover:!bg-red-50 hover:!text-danger';

interface DocsCellProps {
    links?: TransactionLinkRef[];

    documents?: TransactionDocumentRef[];

    onView?: () => void;
    onAttach?: () => void;
    onUnlink?: (linkId: number) => void;
    onRemoveDoc?: (documentId: number) => void;
}

const DocsCell = ({
    links = [],
    documents = [],
    onView,
    onAttach,
    onUnlink,
    onRemoveDoc,
}: DocsCellProps) => {
    const invoiceLinks = links.filter(link => link.targetType === 'INVOICING');
    const hasContent = invoiceLinks.length > 0 || documents.length > 0;

    if (!hasContent) {
        return (
            <Button
                type="link"
                onClick={onAttach}
                icon={<PlusOutlined className="!text-xs" />}
                className="!h-auto !p-0 !text-sm !font-medium !text-muted hover:!text-bodyText"
            >
                Attach
            </Button>
        );
    }

    return (
        <Flex vertical gap={6} align="flex-start" className="min-w-0">
            {invoiceLinks.map(link => (
                <Flex key={link.id} align="center" gap={4} className="min-w-0">
                    <Button
                        type="link"
                        onClick={onView}
                        className="!h-auto !p-0 !text-sm !font-semibold !text-danger !underline !underline-offset-2 hover:!opacity-80"
                    >
                        Invoice #{link.targetId}
                    </Button>
                    <Tooltip title="Unlink invoice">
                        <Button
                            type="text"
                            aria-label="Unlink invoice"
                            icon={<CloseOutlined className="!text-[10px]" />}
                            onClick={() => onUnlink?.(link.id)}
                            className={REMOVE_BTN}
                        />
                    </Tooltip>
                </Flex>
            ))}

            {documents.map(doc => (
                <Flex key={doc.id} align="center" gap={4} className="w-full min-w-0">
                    <Tooltip title={doc.name}>
                        <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 flex-1 items-center gap-1 text-xs font-medium text-bodyText hover:text-ink"
                        >
                            <PaperClipOutlined className="!text-[10px] !shrink-0" />
                            <Text
                                ellipsis
                                className="!m-0 min-w-0 flex-1 !text-xs !font-medium !text-inherit"
                            >
                                {doc.name}
                            </Text>
                        </a>
                    </Tooltip>
                    <Popconfirm
                        title="Remove this document?"
                        okText="Remove"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onRemoveDoc?.(doc.id)}
                    >
                        <Button
                            type="text"
                            aria-label="Remove document"
                            icon={<CloseOutlined className="!text-[10px]" />}
                            className={REMOVE_BTN}
                        />
                    </Popconfirm>
                </Flex>
            ))}

            <Button
                type="link"
                onClick={onAttach}
                icon={<PlusOutlined className="!text-[10px]" />}
                className="!h-auto !p-0 !text-xs !font-medium !text-muted hover:!text-bodyText"
            >
                Add more
            </Button>
        </Flex>
    );
};

export default DocsCell;
