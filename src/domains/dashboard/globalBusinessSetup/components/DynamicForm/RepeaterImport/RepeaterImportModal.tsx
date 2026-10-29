import React from 'react';

import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Modal, Spin, Upload } from 'antd';

import { IMPORT_ACCEPT } from './mapColumns';
import PreviewTable from './PreviewTable';
import { ParsedImport } from './types';

interface RepeaterImportModalProps {
    open: boolean;
    noun: string;
    parsing: boolean;
    parsed: ParsedImport | null;
    hasData: boolean;
    countryLabelById?: Record<string, string>;
    onFile: (file: File) => void;
    onDownloadTemplate: () => void;
    onExport: () => void;
    onApply: () => void;
    onClose: () => void;
}

/**
 * Two-stage bulk-import modal: (1) drop a CSV/Excel file (+ template/export
 * downloads), (2) preview the parsed rows with warnings, then import.
 */
const RepeaterImportModal: React.FC<RepeaterImportModalProps> = ({
    open,
    noun,
    parsing,
    parsed,
    hasData,
    countryLabelById,
    onFile,
    onDownloadTemplate,
    onExport,
    onApply,
    onClose,
}) => {
    const warnings: string[] = parsed
        ? [
              ...(parsed.unmatchedColumns.length
                  ? [`Ignored column(s): ${parsed.unmatchedColumns.join(', ')}`]
                  : []),
              ...(parsed.unmatchedRequiredFields.length
                  ? [
                        `Required field(s) missing a column: ${parsed.unmatchedRequiredFields.join(', ')}`,
                    ]
                  : []),
              ...parsed.warnings,
          ]
        : [];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={`Bulk Import — ${noun}`}
            width={parsed ? 900 : 560}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                parsed && (
                    <Button key="apply" type="primary" danger onClick={onApply}>
                        Import {parsed.instances.length} item(s)
                    </Button>
                ),
            ]}
        >
            {parsing && (
                <Flex justify="center" className="py-10">
                    <Spin />
                </Flex>
            )}
            {!parsing && !parsed && (
                <Flex vertical gap={12}>
                    <Upload.Dragger
                        accept={IMPORT_ACCEPT}
                        maxCount={1}
                        showUploadList={false}
                        beforeUpload={file => {
                            onFile(file);
                            return false;
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag a CSV / Excel file here</p>
                        <p className="ant-upload-hint">
                            Columns are matched to fields by their labels — start from the template
                            for a guaranteed match.
                        </p>
                    </Upload.Dragger>
                    <Flex gap={8} wrap="wrap">
                        <Button icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
                            Download template
                        </Button>
                        {hasData && (
                            <Button icon={<DownloadOutlined />} onClick={onExport}>
                                Download current data
                            </Button>
                        )}
                    </Flex>
                </Flex>
            )}
            {!parsing && parsed && (
                <Flex vertical gap={12}>
                    {warnings.length > 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Review before importing"
                            description={
                                <ul className="mb-0 pl-4">
                                    {warnings.map(w => (
                                        <li key={w}>{w}</li>
                                    ))}
                                </ul>
                            }
                        />
                    )}
                    <PreviewTable
                        mappings={parsed.mappings}
                        instances={parsed.instances}
                        rowValidations={parsed.rowValidations}
                        countryLabelById={countryLabelById}
                    />
                    <Alert
                        type="info"
                        showIcon
                        message="Rows with warnings can still be imported — fix them from the form afterwards. Importing replaces the section's current entries."
                    />
                </Flex>
            )}
        </Modal>
    );
};

export default RepeaterImportModal;
