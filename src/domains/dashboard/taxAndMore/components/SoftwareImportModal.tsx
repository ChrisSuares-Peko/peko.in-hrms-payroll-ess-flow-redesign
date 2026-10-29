import { useState } from 'react';

import { CloseCircleOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Table, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getSalesInvoiceImportTemplate, parseSalesInvoiceImport } from '../api/tax';
import { AddSalesInvoiceItem } from '../types';
import { SOFTWARE_OPTIONS } from '../utils/data';

const { Dragger } = Upload;

interface SoftwareImportModalProps {
    open: boolean;
    softwareId: string;
    onClose: () => void;
    onImport: (items: AddSalesInvoiceItem[]) => Promise<boolean>;
}

const SOFTWARE_INSTRUCTIONS: Record<string, string> = {
    tally: 'In TallyPrime: Go to Gateway of Tally → Display More Reports → GST Reports → GSTR-1. Export as Excel/CSV using the export option.',
    zoho: 'In Zoho Books: Go to Reports → GST Reports → GSTR-1. Click Export and choose CSV format.',
    busy: 'In Busy Accounting: Go to Reports → GST Reports → GSTR-1 Report. Use the Export option to save as CSV.',
    marg: 'In MARG ERP 9+: Go to GST → GST Reports → GSTR-1. Click Export and save as CSV/Excel.',
};

const PREVIEW_HEADERS = [
    'Invoice No',
    'Invoice Date',
    'Invoice Type',
    'Buyer Name',
    'Buyer GSTIN',
    'HSN Code',
    'Place of Supply',
    'Taxable Amount',
    'CGST',
    'SGST',
    'IGST',
];

const PREVIEW_COLS: ColumnsType<Record<string, string> & { _key: string }> = PREVIEW_HEADERS.map(
    h => ({
        title: h,
        dataIndex: h,
        key: h,
        ellipsis: true,
        width: 120,
    })
);

const itemsToPreview = (items: AddSalesInvoiceItem[]) =>
    items.map((item, i) => ({
        _key: String(i),
        'Invoice No': item.invoiceNo ?? '',
        'Invoice Date': item.invoiceDate ?? '',
        'Invoice Type': item.invoiceType ?? '',
        'Buyer Name': item.buyerName ?? '',
        'Buyer GSTIN': item.buyerGstin ?? '',
        'HSN Code': item.hsnCode ?? '',
        'Place of Supply': item.placeOfSupply ?? '',
        'Taxable Amount': item.taxableAmount != null ? String(item.taxableAmount) : '',
        CGST: item.cgst != null ? String(item.cgst) : '',
        SGST: item.sgst != null ? String(item.sgst) : '',
        IGST: item.igst != null ? String(item.igst) : '',
    }));

const SoftwareImportModal = ({ open, softwareId, onClose, onImport }: SoftwareImportModalProps) => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const [parsedItems, setParsedItems] = useState<AddSalesInvoiceItem[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

    const software = SOFTWARE_OPTIONS.find(s => s.id === softwareId);

    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const resp = await getSalesInvoiceImportTemplate({
                userId,
                userType,
                software: softwareId,
            });
            if (!resp || !resp.status) {
                dispatch(
                    showToast({ variant: 'error', description: 'Failed to download template.' })
                );
                return;
            }
            const { buffer, fileType, fileName } = resp.data;
            const blob = new Blob([new Uint8Array(buffer.data)], { type: fileType });
            saveAs(blob, fileName);
        } catch {
            dispatch(showToast({ variant: 'error', description: 'Failed to download template.' }));
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const beforeUpload = (file: File) => {
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
        const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        if (!isCSV && !isXLSX) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Only CSV or Excel (.xlsx) files are supported.',
                })
            );
            return Upload.LIST_IGNORE;
        }

        setIsParsing(true);
        parseSalesInvoiceImport({ userId, userType, file, software: softwareId })
            .then(resp => {
                if (!resp || !resp.status || !resp.data?.items?.length) {
                    dispatch(
                        showToast({
                            variant: 'error',
                            description:
                                (resp as any)?.message ??
                                'No valid invoices found. Please check the file format.',
                        })
                    );
                    return;
                }
                setParsedItems(resp.data.items);
            })
            .catch(() => {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Failed to parse file. Please try again.',
                    })
                );
            })
            .finally(() => setIsParsing(false));

        return false;
    };

    const handleConfirm = async () => {
        setIsImporting(true);
        const ok = await onImport(parsedItems);
        setIsImporting(false);
        if (ok) handleClose();
    };

    const handleClose = () => {
        setParsedItems([]);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            closable={false}
            width={700}
            centered
            styles={{
                content: { padding: 0, borderRadius: 20, overflow: 'hidden' },
                body: { padding: 0 },
            }}
        >
            {/* Header */}
            <Flex align="flex-start" justify="space-between" className="px-8 pt-8 pb-5">
                <Flex vertical gap={4}>
                    <Typography.Title
                        level={3}
                        className="!mb-0 !font-bold text-[#0f172a]"
                        style={{ lineHeight: '36px' }}
                    >
                        Import from {software?.name ?? 'Software'}
                    </Typography.Title>
                    <Typography.Text className="text-sm text-[#64748b]">
                        Upload a CSV or Excel file with your invoice data
                    </Typography.Text>
                </Flex>
                <Button
                    type="text"
                    icon={<CloseCircleOutlined style={{ fontSize: 22, color: '#94a3b8' }} />}
                    onClick={handleClose}
                    style={{ padding: 0, height: 'auto', marginTop: 2 }}
                />
            </Flex>

            <div className="border-t border-[#f1f5f9]" />

            <Flex vertical gap={16} className="px-8 py-6">
                {/* Instructions */}
                {softwareId && SOFTWARE_INSTRUCTIONS[softwareId] && (
                    <Flex
                        className="bg-[#f0fdf4] rounded-xl px-4 py-3 border border-[#bbf7d0]"
                        gap={8}
                    >
                        <Typography.Text className="text-sm text-[#166534]">
                            <strong>How to export:</strong> {SOFTWARE_INSTRUCTIONS[softwareId]}
                        </Typography.Text>
                    </Flex>
                )}

                {/* Template download */}
                <Flex
                    align="center"
                    justify="space-between"
                    className="bg-[#f8fafc] rounded-xl px-4 py-3 border border-[#e2e8f0]"
                >
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                            Download {software?.name ?? ''} Template
                        </Typography.Text>
                        <Typography.Text className="text-xs text-[#64748b]">
                            Pre-formatted template matching {software?.name ?? 'your software'}{' '}
                            export columns
                        </Typography.Text>
                    </Flex>
                    <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        loading={isDownloadingTemplate}
                        onClick={handleDownloadTemplate}
                        style={{ borderColor: '#cbd5e1', color: '#475569' }}
                    >
                        Download
                    </Button>
                </Flex>

                {/* Upload */}
                <Dragger
                    accept=".csv,.xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    disabled={isParsing}
                    style={{ borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 2 }}
                >
                    <Flex vertical align="center" gap={8} className="py-4">
                        <InboxOutlined style={{ fontSize: 32, color: '#94a3b8' }} />
                        <Typography.Text className="text-sm font-medium text-[#1e293b]">
                            {isParsing ? 'Parsing file…' : 'Click or drag CSV / Excel file here'}
                        </Typography.Text>
                        <Typography.Text className="text-xs text-[#94a3b8]">
                            Supports .csv and .xlsx
                        </Typography.Text>
                    </Flex>
                </Dragger>

                {/* Preview */}
                {parsedItems.length > 0 && (
                    <Flex vertical gap={6}>
                        <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                            Preview — {parsedItems.length} invoice
                            {parsedItems.length !== 1 ? 's' : ''} found
                        </Typography.Text>
                        <Table
                            columns={PREVIEW_COLS}
                            dataSource={itemsToPreview(parsedItems.slice(0, 5))}
                            rowKey="_key"
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                        {parsedItems.length > 5 && (
                            <Typography.Text className="text-xs text-[#94a3b8]">
                                Showing 5 of {parsedItems.length} rows
                            </Typography.Text>
                        )}
                    </Flex>
                )}

                {/* Actions */}
                <Flex gap={10}>
                    <Button
                        type="primary"
                        danger
                        disabled={parsedItems.length === 0}
                        loading={isImporting}
                        onClick={handleConfirm}
                        style={{ flex: 1, height: 40 }}
                    >
                        Import{' '}
                        {parsedItems.length > 0
                            ? `${parsedItems.length} Invoice${parsedItems.length !== 1 ? 's' : ''}`
                            : 'Invoices'}
                    </Button>
                    <Button
                        onClick={handleClose}
                        style={{ flex: 1, height: 40, borderColor: '#cbd5e1', color: '#475569' }}
                    >
                        Cancel
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default SoftwareImportModal;
