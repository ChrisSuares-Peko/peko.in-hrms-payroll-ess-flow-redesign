import { useState } from 'react';

import { CloudUploadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Modal, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useImportEmailTemplates from '../../hooks/useImportEmailTemplates';
import { CreateEmailTemplatePayload } from '../../types/emailTemplate';

type ImportEmailTemplatesModalProps = {
    open: boolean;
    onClose: () => void;
    onImported: () => void;
};

const readFileAsTemplates = (file: File): Promise<CreateEmailTemplatePayload[]> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                if (!Array.isArray(parsed)) throw new Error('not an array');
                resolve(parsed);
            } catch {
                reject(new Error('That file is not a valid JSON array of email templates.'));
            }
        };
        reader.onerror = reject;
    });

const ImportEmailTemplatesModal = ({
    open,
    onClose,
    onImported,
}: ImportEmailTemplatesModalProps) => {
    const dispatch = useAppDispatch();
    const { importFile, isImporting } = useImportEmailTemplates();
    const [file, setFile] = useState<File | null>(null);
    const [overwrite, setOverwrite] = useState(false);

    const resetAndClose = () => {
        setFile(null);
        setOverwrite(false);
        onClose();
    };

    const beforeUpload = (candidate: RcFile) => {
        const isJson = candidate.type === 'application/json' || candidate.name.endsWith('.json');
        if (!isJson) {
            dispatch(showToast({ description: 'Please upload a .json file.', variant: 'error' }));
            return Upload.LIST_IGNORE;
        }
        setFile(candidate);
        return false;
    };

    const handleImport = async () => {
        if (!file) return;

        let templates: CreateEmailTemplatePayload[];
        try {
            templates = await readFileAsTemplates(file);
        } catch (error) {
            dispatch(
                showToast({
                    description:
                        error instanceof Error ? error.message : 'Could not read that file.',
                    variant: 'error',
                })
            );
            return;
        }

        const response = await importFile(templates, overwrite);
        if (response) {
            dispatch(
                showToast({
                    description: `Import finished — ${response.created} created, ${response.updated} updated, ${response.skipped} skipped, ${response.failed} failed.`,
                    variant: 'success',
                })
            );
            onImported();
            resetAndClose();
        } else {
            dispatch(
                showToast({ description: 'Failed to import email templates.', variant: 'error' })
            );
        }
    };

    return (
        <Modal
            title="Import Email Templates"
            open={open}
            onCancel={resetAndClose}
            footer={[
                <Button key="cancel" onClick={resetAndClose}>
                    Cancel
                </Button>,
                <Button
                    key="import"
                    type="primary"
                    danger
                    disabled={!file}
                    loading={isImporting}
                    onClick={handleImport}
                >
                    Import
                </Button>,
            ]}
            centered
        >
            <Flex vertical gap={12} className="mt-4">
                <Typography.Text className="text-textGray text-sm">
                    Upload a JSON file containing one or more email templates to import.
                </Typography.Text>
                <Upload.Dragger
                    accept=".json,application/json"
                    multiple={false}
                    maxCount={1}
                    fileList={
                        file ? [{ uid: file.name, name: file.name, status: 'done' as const }] : []
                    }
                    beforeUpload={beforeUpload}
                    onRemove={() => setFile(null)}
                >
                    <Flex vertical align="center" gap={4} className="py-4">
                        <CloudUploadOutlined className="text-3xl text-textGray" />
                        <Typography.Text className="text-sm font-medium">
                            Click or drag a JSON file to this area
                        </Typography.Text>
                    </Flex>
                </Upload.Dragger>
                <Checkbox checked={overwrite} onChange={e => setOverwrite(e.target.checked)}>
                    Overwrite existing templates with matching keys
                </Checkbox>
            </Flex>
        </Modal>
    );
};

export default ImportEmailTemplatesModal;
