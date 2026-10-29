import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import LinkDocumentHeader from './LinkDocumentHeader';
import LinkDocumentInvoiceTab from './LinkDocumentInvoiceTab';
import { LinkDocumentModalProps, SCROLL_AREA } from './LinkDocumentModal.constants';
import LinkDocumentUploadTab from './LinkDocumentUploadTab';
import useLinkDocumentModal from './useLinkDocumentModal';
import { linkDocumentCopy } from '../../utils/linkDocumentData';

const { Text } = Typography;

const LinkDocumentModal = ({ open, transaction, onClose, onLinked }: LinkDocumentModalProps) => {
    const {
        activeTab,
        search,
        setSearch,
        invoices,
        loadingInvoices,
        selected,
        uploadedFile,
        submitting,
        inputRef,
        isUpload,
        isBills,
        activeTabLabel,
        linkedInvoiceIds,
        attachedDocuments,
        resetState,
        switchTab,
        toggleSelect,
        handleFiles,
        selectedCount,
        hasSelection,
        handleContinue,
    } = useLinkDocumentModal({ open, transaction, onClose, onLinked });

    return (
        <Modal
            open={open}
            onCancel={onClose}
            afterClose={resetState}
            footer={null}
            closable={false}
            centered
            width="min(680px, 95vw)"
            styles={{
                content: { borderRadius: 28, padding: 0, overflow: 'hidden' },
                body: { padding: 0 },
            }}
        >
            <Flex vertical gap={20} className={`${SCROLL_AREA} px-6 py-7 sm:px-8`}>
                <LinkDocumentHeader
                    description={transaction?.description}
                    activeTab={activeTab}
                    activeTabLabel={activeTabLabel}
                    switchTab={switchTab}
                />

                {isUpload && (
                    <LinkDocumentUploadTab
                        inputRef={inputRef}
                        uploadedFile={uploadedFile}
                        attachedDocuments={attachedDocuments}
                        handleFiles={handleFiles}
                    />
                )}

                {isBills && (
                    <Text className="py-10 text-center text-sm text-muted">
                        {linkDocumentCopy.billsComingSoon}
                    </Text>
                )}

                {!isUpload && !isBills && (
                    <LinkDocumentInvoiceTab
                        search={search}
                        setSearch={setSearch}
                        invoices={invoices}
                        loadingInvoices={loadingInvoices}
                        selected={selected}
                        selectedCount={selectedCount}
                        linkedInvoiceIds={linkedInvoiceIds}
                        toggleSelect={toggleSelect}
                    />
                )}

                {hasSelection ? (
                    <Flex gap={12} className="w-full flex-col sm:flex-row sm:items-center">
                        <Button
                            onClick={onClose}
                            disabled={submitting}
                            className="h-12 w-full min-w-0 !text-bodyText sm:flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            loading={submitting}
                            onClick={handleContinue}
                            className="h-12 w-full min-w-0 sm:flex-1"
                        >
                            {isUpload
                                ? 'Attach Document'
                                : `Link ${selectedCount} ${selectedCount === 1 ? 'Invoice' : 'Invoices'}`}
                            <ArrowRightOutlined className="ml-1" />
                        </Button>
                    </Flex>
                ) : (
                    <Button type="primary" danger onClick={onClose} className="h-12 w-full">
                        Close
                    </Button>
                )}
            </Flex>
        </Modal>
    );
};

export default LinkDocumentModal;
