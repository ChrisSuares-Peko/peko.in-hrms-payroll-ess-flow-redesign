import { useEffect, useState } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Table, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import { AddSalesInvoiceItem } from '../types';

const { Dragger } = Upload;

interface InvoiceCsvUploadModalProps {
    open: boolean;
    title: string;
    templateHeaders: string[];
    templateSample: string[];
    templateFilename: string;
    onClose: () => void;
    onImport: (items: AddSalesInvoiceItem[]) => Promise<void>;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const COL_MAP: Record<string, keyof AddSalesInvoiceItem> = {
    invoiceno: 'invoiceNo',
    invoicenum: 'invoiceNo',
    invoicenumber: 'invoiceNo',
    voucherno: 'invoiceNo',
    billno: 'invoiceNo',
    noteno: 'invoiceNo',
    notenum: 'invoiceNo',
    invoicedate: 'invoiceDate',
    date: 'invoiceDate',
    billdate: 'invoiceDate',
    voucherdate: 'invoiceDate',
    notedate: 'invoiceDate',
    invoicetype: 'invoiceType',
    supplytype: 'supplyType',
    supplytypeintrainter: 'supplyType',
    buyername: 'buyerName',
    partyname: 'buyerName',
    receivername: 'buyerName',
    customername: 'buyerName',
    buyergstin: 'buyerGstin',
    gstin: 'buyerGstin',
    receivergstin: 'buyerGstin',
    partygstin: 'buyerGstin',
    hsncode: 'hsnCode',
    hsn: 'hsnCode',
    placeofsupply: 'placeOfSupply',
    statecode: 'placeOfSupply',
    pos: 'placeOfSupply',
    taxableamount: 'taxableAmount',
    taxablevalue: 'taxableAmount',
    grossadvance: 'taxableAmount',
    grosstaxable: 'taxableAmount',
    cgst: 'cgst',
    cgstamount: 'cgst',
    sgst: 'sgst',
    sgstamount: 'sgst',
    igst: 'igst',
    igstamount: 'igst',
    notetype: 'noteType',
    notetypecd: 'noteType',
    exporttype: 'exportType',
    exporttypewpaywopay: 'exportType',
    portcode: 'portCode',
    cdnurtype: 'portCode',
    shippingbillno: 'shippingBillNo',
    sbno: 'shippingBillNo',
    shippingbilldate: 'shippingBillDate',
    sbdate: 'shippingBillDate',
    taxrate: 'taxRate',
    rate: 'taxRate',
};

const parseDate = (raw: string): string => {
    if (!raw) return raw;
    const t = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const m = t.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return t;
};

const parseCSV = (text: string): AddSalesInvoiceItem[] => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const keys: (keyof AddSalesInvoiceItem | null)[] = headers.map(
        h => COL_MAP[normalize(h)] ?? null
    );

    return lines
        .slice(1)
        .map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const item: Partial<AddSalesInvoiceItem> = {};
            keys.forEach((key, idx) => {
                if (!key) return;
                const val = vals[idx] ?? '';
                if (!val) return;
                if (
                    key === 'taxableAmount' ||
                    key === 'cgst' ||
                    key === 'sgst' ||
                    key === 'igst' ||
                    key === 'taxRate'
                ) {
                    const num = parseFloat(val.replace(/,/g, ''));
                    if (!Number.isNaN(num)) (item as any)[key] = num;
                } else if (key === 'invoiceDate' || key === 'shippingBillDate') {
                    (item as any)[key] = parseDate(val);
                } else {
                    (item as any)[key] = val;
                }
            });
            return item as AddSalesInvoiceItem;
        })
        .filter(i => i.invoiceNo || i.placeOfSupply || i.taxableAmount != null);
};

const InvoiceCsvUploadModal = ({
    open,
    title,
    templateHeaders,
    templateSample,
    templateFilename,
    onClose,
    onImport,
}: InvoiceCsvUploadModalProps) => {
    const dispatch = useDispatch();
    const [parsedItems, setParsedItems] = useState<AddSalesInvoiceItem[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (open) {
            setParsedItems([]);
            setIsImporting(false);
        }
    }, [open]);

    const previewCols: ColumnsType<Record<string, string>> = templateHeaders.map(h => ({
        title: h,
        dataIndex: h,
        key: h,
        ellipsis: true,
        width: 120,
    }));

    const FIELD_DISPLAY: Record<string, (item: AddSalesInvoiceItem) => string> = {
        'Invoice No': i => i.invoiceNo ?? '',
        'Invoice Date': i => i.invoiceDate ?? '',
        'Invoice Type': i => i.invoiceType ?? '',
        'Receiver GSTIN': i => i.buyerGstin ?? '',
        'Receiver Name': i => i.buyerName ?? '',
        'Place of Supply': i => i.placeOfSupply ?? '',
        'HSN Code': i => i.hsnCode ?? '',
        'Taxable Amount': i => (i.taxableAmount != null ? String(i.taxableAmount) : ''),
        CGST: i => (i.cgst != null ? String(i.cgst) : ''),
        SGST: i => (i.sgst != null ? String(i.sgst) : ''),
        IGST: i => (i.igst != null ? String(i.igst) : ''),
        'Note No': i => i.invoiceNo ?? '',
        'Note Date': i => i.invoiceDate ?? '',
        'Note Type (C/D)': i => i.noteType ?? '',
        'Export Type (WPAY/WOPAY)': i => i.exportType ?? '',
        'Port Code': i => i.portCode ?? '',
        'Shipping Bill No': i => i.shippingBillNo ?? '',
        'Shipping Bill Date': i => i.shippingBillDate ?? '',
        'Tax Rate (%)': i => (i.taxRate != null ? String(i.taxRate) : ''),
        'Supply Type (INTRA/INTER)': i => i.supplyType ?? '',
        'Gross Advance': i => (i.taxableAmount != null ? String(i.taxableAmount) : ''),
        'CDNUR Type': i => i.portCode ?? '',
    };
    const previewRows = parsedItems.slice(0, 5).map((item, idx) => {
        const row: Record<string, string> = { key: String(idx) };
        templateHeaders.forEach(h => {
            row[h] = FIELD_DISPLAY[h] ? FIELD_DISPLAY[h](item) : '';
        });
        return row;
    });

    const beforeUpload = (file: File) => {
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
        if (!isCSV) {
            dispatch(showToast({ variant: 'error', description: 'Only CSV files are supported.' }));
            return Upload.LIST_IGNORE;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target?.result as string;
            const items = parseCSV(text);
            if (!items.length) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description:
                            'No valid invoices found. Ensure the file has Invoice No and Invoice Date columns.',
                    })
                );
                return;
            }
            setParsedItems(items);
        };
        reader.readAsText(file);
        return false;
    };

    const handleConfirm = async () => {
        setIsImporting(true);
        try {
            await onImport(parsedItems);
            handleClose();
        } catch (err: any) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: err?.message || 'Import failed. Please try again.',
                })
            );
        } finally {
            setIsImporting(false);
        }
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
            title={
                <Typography.Text strong style={{ fontSize: 18 }}>
                    {title}
                </Typography.Text>
            }
            width={700}
            centered
            destroyOnClose
        >
            <Flex vertical gap={14} className="pt-2">
                {/* Template download */}
                {/* <Flex align="center" justify="space-between" className="bg-[#f8fafc] rounded-xl px-4 py-3 border border-[#e2e8f0]">
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-sm font-semibold text-[#1e293b]">Download CSV Template</Typography.Text>
                        <Typography.Text className="text-xs text-[#64748b]">Fill and upload this template to bulk import invoices</Typography.Text>
                    </Flex>
                    <Button
                        size="small"
                        style={{ borderColor: '#cbd5e1', color: '#475569' }}
                        onClick={() => downloadCsv(templateHeaders, templateSample, templateFilename)}
                    >
                        Download
                    </Button>
                </Flex> */}

                {/* Upload */}
                <Dragger
                    accept=".csv"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    style={{ borderRadius: 10, borderColor: '#cbd5e1' }}
                >
                    <Flex vertical align="center" gap={6} className="py-3">
                        <InboxOutlined style={{ fontSize: 28, color: '#94a3b8' }} />
                        <Typography.Text className="text-sm font-medium text-[#1e293b]">
                            Click or drag CSV file here
                        </Typography.Text>
                        <Typography.Text className="text-xs text-[#94a3b8]">
                            Required: Invoice No, Invoice Date
                        </Typography.Text>
                    </Flex>
                </Dragger>

                {/* Preview */}
                {parsedItems.length > 0 && (
                    <Flex vertical gap={4}>
                        <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                            {parsedItems.length} invoice{parsedItems.length !== 1 ? 's' : ''} ready
                            to import
                        </Typography.Text>
                        <Table
                            columns={previewCols}
                            dataSource={previewRows}
                            rowKey="key"
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
                        style={{ flex: 1, height: 38 }}
                    >
                        Import{' '}
                        {parsedItems.length > 0
                            ? `${parsedItems.length} Invoice${parsedItems.length !== 1 ? 's' : ''}`
                            : ''}
                    </Button>
                    <Button onClick={handleClose} style={{ flex: 1, height: 38 }}>
                        Cancel
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default InvoiceCsvUploadModal;
