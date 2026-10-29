import { CloseOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import ImportInfoCards from './ImportInfoCards';
import { downloadImportTemplate } from './importTransaction.helpers';
import ImportUploadZone from './ImportUploadZone';
import { useImportTransactions } from './useImportTransactions';
import { importTransactionsModal } from '../../utils/transactionsData';

const { Title, Text } = Typography;

interface ImportTransactionsModalProps {
    open: boolean;
    onClose: () => void;

    onImport?: (file: File) => Promise<void> | void;
    onImported?: () => void;
}

const ImportTransactionsModal = ({
    open,
    onClose,
    onImport,
    onImported,
}: ImportTransactionsModalProps) => {
    const { fileInputRef, fileName, submitting, reset, handleFiles, handleSubmit } =
        useImportTransactions({ onClose, onImport, onImported });

    return (
        <Modal
            open={open}
            onCancel={onClose}
            afterClose={reset}
            footer={null}
            closable={false}
            centered
            width="min(818px, 95vw)"
            styles={{
                content: { borderRadius: 28, padding: 0, overflow: 'hidden' },
                body: { padding: 0 },
            }}
        >
            <Flex
                vertical
                gap={24}
                className="hide-scrollbar max-h-[90vh] overflow-y-auto px-6 py-7 sm:px-9 sm:py-9"
            >
                <Flex align="flex-start" justify="space-between" gap={12}>
                    <Flex vertical gap={4} className="min-w-0">
                        <Title
                            level={3}
                            className="!mb-0 !text-xl !font-semibold !text-ink md:!text-2xl"
                        >
                            {importTransactionsModal.title}
                        </Title>
                        <Text className="text-sm text-muted">
                            {importTransactionsModal.subtitle}
                        </Text>
                    </Flex>
                    <Button
                        type="text"
                        aria-label="Close"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        className="!h-auto shrink-0 !p-1 !text-slate-400 hover:!text-bodyText"
                    />
                </Flex>

                <ImportUploadZone
                    fileInputRef={fileInputRef}
                    fileName={fileName}
                    onFiles={handleFiles}
                />

                <ImportInfoCards onDownloadTemplate={downloadImportTemplate} />

                <Flex gap={12} className="w-full flex-col sm:flex-row">
                    <Button
                        size="large"
                        onClick={onClose}
                        disabled={submitting}
                        className="!h-12 flex-1 !rounded-xl !border-borderSubtle !text-danger"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSubmit}
                        loading={submitting}
                        className="!h-12 flex-1 !rounded-xl"
                    >
                        {importTransactionsModal.submitLabel}
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default ImportTransactionsModal;
