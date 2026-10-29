import React, { useState } from 'react';

import { Button, Flex, Modal, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';
import { useDispatch } from 'react-redux';

import GenericTable from '@components/atomic/GenericTable';
import { showToast } from '@src/slices/apiSlice';

import csvIcon from '../../assets/icons/csvIcon.svg';
import { useVendor } from '../../hooks/useVendor';

const { Text } = Typography;
const { Dragger } = Upload;

type Props = {
    open:      boolean;
    onClose:   () => void;
    onSuccess?: () => void;
};

type PreviewRow = Record<string, string>;

const parseCSV = (text: string): { columns: ColumnsType<PreviewRow>; rows: PreviewRow[] } => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return { columns: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const columns: ColumnsType<PreviewRow> = headers.map(h => ({
        title: h,
        dataIndex: h,
        key: h,
        ellipsis: true,
    }));

    const rows: PreviewRow[] = lines.slice(1).map((line, i) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: PreviewRow = { key: String(i) };
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        return row;
    });

    return { columns, rows };
};

const ImportCSVModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { importCSV, isSubmitting } = useVendor();
    const [fileList, setFileList]             = useState<UploadFile[]>([]);
    const [rawFile, setRawFile]               = useState<File | null>(null);
    const [previewColumns, setPreviewColumns] = useState<ColumnsType<PreviewRow>>([]);
    const [previewRows, setPreviewRows]       = useState<PreviewRow[]>([]);

    const beforeUpload = (file: File) => {
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
        if (!isCSV) {
            dispatch(showToast({ variant: 'error', description: 'Only CSV files are supported.' }));
            return Upload.LIST_IGNORE;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const { columns, rows } = parseCSV(text);
            if (!columns.length) {
                dispatch(showToast({ variant: 'error', description: 'CSV file is empty or missing headers.' }));
                return;
            }
            setPreviewColumns(columns);
            setPreviewRows(rows);
        };
        reader.readAsText(file);

        setRawFile(file);
        setFileList([file as any]);
        return false;
    };

    const reset = () => {
        setFileList([]);
        setRawFile(null);
        setPreviewColumns([]);
        setPreviewRows([]);
    };

    const handleConfirm = async () => {
        if (!rawFile) return;
        const ok = await importCSV(rawFile);
        if (ok) {
            reset();
            onClose();
            onSuccess?.();
        }
    };

    const handleCancel = () => {
        reset();
        onClose();
    };

    const hasPreview = previewRows.length > 0;

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            title={<Text strong style={{ fontSize: 24, fontFamily: 'Roboto, sans-serif' }}>Import from CSV</Text>}
            footer={null}
            width={780}
            styles={{
                content: { borderRadius: 26, padding: '36px 40px 28px' },
                body: { paddingTop: 16 },
            }}
        >
            <Dragger
                fileList={fileList}
                beforeUpload={beforeUpload}
                onRemove={reset}
                accept=".csv"
                style={{ borderRadius: 15, marginBottom: 16, borderColor: '#cbd0dc', borderWidth: 2 }}
            >
                <Flex vertical align="center" gap={12}>
                    <img src={csvIcon} alt="csv" style={{ width: 27, height: 27 }} />
                    <p style={{ margin: 0, fontSize: 17, color: '#292d32', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        Click to upload CSV file
                    </p>
                    <Button
                        style={{
                            borderRadius: 9,
                            borderColor: '#cbd0dc',
                            color: '#54575c',
                            fontSize: 17,
                            height: 'auto',
                            padding: '9px 19px',
                        }}
                    >
                        Browse File
                    </Button>
                </Flex>
            </Dragger>

            {hasPreview && (
                <>
                    <GenericTable
                        columns={previewColumns}
                        dataSource={previewRows.slice(0, 5)}
                        pagination={false}
                        size="small"
                        style={{ marginBottom: 6 }}
                        scroll={{ x: true }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Preview shows {Math.min(5, previewRows.length)} of {previewRows.length} rows
                    </Text>
                </>
            )}

            <Flex gap={12} style={{ marginTop: 20 }}>
                <Button
                    type="primary"
                    danger
                    style={{ borderRadius: 8, flex: 1 }}
                    onClick={handleConfirm}
                    disabled={!hasPreview}
                    loading={isSubmitting}
                >
                    Confirm Import
                </Button>
                <Button
                    style={{ borderRadius: 8, flex: 1, borderColor: '#ff4f4f', color: '#ff4f4f' }}
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
            </Flex>
        </Modal>
    );
};

export default ImportCSVModal;
