import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import { RECIPIENTS, RECIPIENT_LABELS, listOrderDocuments } from './orderDocuments';
import { useDownloadOrderDocument } from '../../hooks/useDownloadOrderDocument';
import { OrderDocumentAvailability } from '../../types/orderJournal';

type Props = {
    open: boolean;
    onClose: () => void;
    orderId: number;
    corporateTxnId: string;
    documents?: OrderDocumentAvailability;
};

const OrderDocumentsModal = ({ open, onClose, orderId, corporateTxnId, documents }: Props) => {
    const { loadingKey, downloadDocument } = useDownloadOrderDocument();

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={560}
            destroyOnClose
            title={<Typography.Text strong>Documents — {corporateTxnId}</Typography.Text>}
        >
            <Flex vertical gap={20} className="pt-2">
                {RECIPIENTS.map(recipient => {
                    const docs = listOrderDocuments(documents, recipient);
                    return (
                        <Flex vertical gap={8} key={recipient}>
                            <Typography.Text className="text-[13px] font-semibold text-textHeadings">
                                {RECIPIENT_LABELS[recipient]}
                            </Typography.Text>
                            {docs.length === 0 && (
                                <Typography.Text type="secondary" className="text-[13px]">
                                    No documents generated for this order.
                                </Typography.Text>
                            )}
                            {docs.map(({ docType, label }) => (
                                <Flex
                                    key={docType}
                                    align="center"
                                    justify="space-between"
                                    gap={12}
                                    className="rounded-lg border border-solid border-customBorderColor px-3 py-2"
                                >
                                    <Flex align="center" gap={8} className="min-w-0">
                                        <FilePdfOutlined className="text-bgOrange2" />
                                        <Typography.Text className="truncate">
                                            {label}
                                        </Typography.Text>
                                    </Flex>
                                    <Button
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        loading={
                                            loadingKey === `${orderId}:${recipient}:${docType}`
                                        }
                                        onClick={() =>
                                            downloadDocument(orderId, recipient, docType)
                                        }
                                        aria-label={`Download ${label} for order ${orderId}`}
                                        className="shrink-0 rounded-full border-customBorderColor text-bgOrange2 hover:!border-bgOrange2 hover:!text-bgOrange2 hover:!bg-bgOrangeShade"
                                    >
                                        Download
                                    </Button>
                                </Flex>
                            ))}
                        </Flex>
                    );
                })}
            </Flex>
        </Modal>
    );
};

export default OrderDocumentsModal;
