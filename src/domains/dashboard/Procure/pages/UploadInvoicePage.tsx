import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DeleteOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Input, Modal, Row, Select, Typography, Upload } from 'antd';
import { RcFile, UploadFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { Formik, useFormikContext } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import invoiceDetails from '@src/domains/dashboard/Procure/assets/icons/invoiceUploadIcon.svg';
import invoicingDocumentIcon from '@src/domains/dashboard/Procure/assets/icons/invoicingDocumentIcon.svg';
import linkToPurchase from '@src/domains/dashboard/Procure/assets/icons/linkToPurchase.svg';
import newRFQImage from '@src/domains/dashboard/Procure/assets/images/newRFQImage.svg';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import ScrollToError from '../components/ScrollToError';
import { useInvoice } from '../hooks/useInvoice';
import { usePurchaseOrder } from '../hooks/usePurchaseOrder';
import { uploadInvoiceSchema } from '../schema';
import { INVOICE_ALLOWED_FILE_TYPES, PO_STEPS, PO_TIPS } from '../utils/data';

const { Title, Text } = Typography;

const SectionHeader: React.FC<{ icon: string; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <Flex gap={14} align="center" style={{ marginBottom: 18 }}>
        <Flex align="center" justify="center" style={{ background: '#fff4f4', borderRadius: 10, width: 37, height: 37, flexShrink: 0 }}>
            <img src={icon} alt={title} style={{ width: 24, height: 24 }} />
        </Flex>
        <Flex vertical gap={2}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>{title}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{subtitle}</Text>
        </Flex>
    </Flex>
);

const InvoiceDragger: React.FC = () => {
    const { setFieldValue } = useFormikContext<any>();
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const beforeUpload = (file: RcFile) => {
        if (!INVOICE_ALLOWED_FILE_TYPES.includes(file.type)) return Upload.LIST_IGNORE;
        if (file.size / 1024 > 5120) return Upload.LIST_IGNORE;
        return true;
    };

    const customRequest = ({ file, onSuccess }: any) => {
        const f = file as File;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFieldValue('invoiceFile', reader.result.split(',')[1]);
                setFieldValue('invoiceFileFormat', f.type.split('/')[1]);
                setFieldValue('invoiceFileName', f.name);
                setFileList([{ uid: '-1', name: f.name, status: 'done' }]);
            }
        };
        reader.readAsDataURL(f);
        onSuccess?.('ok');
    };

    const onRemove = () => {
        setFieldValue('invoiceFile', '');
        setFieldValue('invoiceFileFormat', '');
        setFieldValue('invoiceFileName', '');
        setFileList([]);
        return true;
    };

    return (
        <Upload.Dragger
            accept={INVOICE_ALLOWED_FILE_TYPES.join(',')}
            maxCount={1}
            fileList={fileList}
            beforeUpload={beforeUpload}
            customRequest={customRequest}
            onRemove={onRemove}
            style={{ borderRadius: 12, background: '#fafafa', border: '1px solid #d9d9d9' }}
        >
            <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#ff4f4f', fontSize: 32 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>
                Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', width: 395, margin: '0 auto' }}>
                Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files
            </p>
        </Upload.Dragger>
    );
};

const fmt = (n: number) =>
    `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FormSpy: React.FC<{
    setPoId: React.Dispatch<React.SetStateAction<number>>;
    poDetail: any;
}> = ({ setPoId, poDetail }) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const prefilledPoId = useRef<number>(0);

    useEffect(() => {
        setPoId(Number(values.purchaseOrder) || 0);
    }, [values.purchaseOrder, setPoId]);

    useEffect(() => {
        if (poDetail?.lineItems?.length && poDetail.id !== prefilledPoId.current) {
            prefilledPoId.current = poDetail.id;
            setFieldValue('lineItems', poDetail.lineItems.map((item: any) => ({
                key: Math.random().toString(36).slice(2),
                description: item.description ?? '',
                qty: String(item.qty ?? ''),
                unit: item.unit ?? '',
                unitPrice: String(item.unitPrice ?? ''),
                taxRate: String(item.taxRate ?? '18'),
                gstType: item.gstType ?? 'exclusive',
            })));
        }
    }, [poDetail, setFieldValue]);

    return null;
};

const PoAmountSummary: React.FC<{ poTotal: number; alreadyInvoiced: number; isLoading: boolean }> = ({ poTotal, alreadyInvoiced, isLoading }) => {
    if (!poTotal) return null;
    const remaining = poTotal - alreadyInvoiced;
    return (
        <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
            {[
                { label: 'PO Total', value: fmt(poTotal) },
                { label: 'Already Invoiced', value: fmt(alreadyInvoiced) },
                { label: 'Remaining', value: fmt(remaining), warn: remaining < 0 },
            ].map(({ label, value, warn }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', minWidth: 130 }}>
                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', display: 'block' }}>{label}</Text>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: warn ? '#f5222d' : '#000', display: 'block', marginTop: 2 }}>
                        {isLoading ? '…' : value}
                    </Text>
                </div>
            ))}
        </Flex>
    );
};

const GST_RATES = ['0', '5', '12', '18', '28'];
const GST_TYPES = [{ value: 'exclusive', label: 'Exclusive' }, { value: 'inclusive', label: 'Inclusive' }];

interface LineItem {
    key: string;
    description: string;
    qty: string;
    unit: string;
    unitPrice: string;
    taxRate: string;
    gstType: string;
}

const emptyLineItem = (): LineItem => ({
    key: Math.random().toString(36).slice(2),
    description: '', qty: '', unit: '', unitPrice: '', taxRate: '18', gstType: 'exclusive',
});

const calcNet = (item: LineItem): number => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    if (item.gstType === 'inclusive') return qty * unitPrice;
    return qty * unitPrice * (1 + taxRate / 100);
};

const calcInvoiceTotal = (lineItems: LineItem[]): number =>
    lineItems.reduce((sum, item) => sum + calcNet(item), 0);

const LineItemsSection: React.FC = () => {
    const { values, setFieldValue, errors, submitCount } = useFormikContext<any>();
    const items: LineItem[] = values.lineItems ?? [];
    const showErrors = submitCount > 0;

    const update = (idx: number, field: keyof LineItem, value: string) =>
        setFieldValue('lineItems', items.map((it, i) => i === idx ? { ...it, [field]: value } : it));

    const add = () => setFieldValue('lineItems', [...items, emptyLineItem()]);
    const remove = (idx: number) => setFieldValue('lineItems', items.filter((_, i) => i !== idx));

    const total = calcInvoiceTotal(items);
    const rowErrors = (errors.lineItems as any) ?? [];

    return (
        <Flex vertical gap={12} style={{ marginBottom: 16 }}>
            {items.map((item, idx) => {
                const net = calcNet(item);
                const err = rowErrors[idx] ?? {};
                return (
                    <Card key={item.key} size="small" style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} styles={{ body: { padding: '14px 16px' } }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Item {idx + 1}</Text>
                            {items.length > 1 && (
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(idx)} />
                            )}
                        </Flex>
                        <Form.Item
                            label={<Text style={{ fontSize: 11, color: '#999' }}>Description</Text>}
                            style={{ marginBottom: 10 }}
                            validateStatus={showErrors && err.description ? 'error' : ''}
                            help={showErrors ? err.description : ''}
                        >
                            <Input
                                placeholder="Item description"
                                value={item.description}
                                onChange={e => update(idx, 'description', e.target.value)}
                                maxLength={200}
                            />
                        </Form.Item>
                        <Row gutter={12} style={{ marginBottom: 10 }}>
                            <Col xs={8}>
                                <Form.Item label={<Text style={{ fontSize: 11, color: '#999' }}>Qty</Text>} style={{ marginBottom: 0 }}
                                    validateStatus={showErrors && err.qty ? 'error' : ''}
                                    help={showErrors ? err.qty : ''}
                                >
                                    <Input
                                        placeholder="0"
                                        value={item.qty}
                                        onChange={e => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) update(idx, 'qty', e.target.value); }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={8}>
                                <Form.Item label={<Text style={{ fontSize: 11, color: '#999' }}>Unit</Text>} style={{ marginBottom: 0 }}>
                                    <Input
                                        placeholder="Pcs / Kg / Hr"
                                        value={item.unit}
                                        onChange={e => update(idx, 'unit', e.target.value)}
                                        maxLength={20}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={8}>
                                <Form.Item label={<Text style={{ fontSize: 11, color: '#999' }}>Unit Price (₹)</Text>} style={{ marginBottom: 0 }}
                                    validateStatus={showErrors && err.unitPrice ? 'error' : ''}
                                    help={showErrors ? err.unitPrice : ''}
                                >
                                    <Input
                                        placeholder="0.00"
                                        value={item.unitPrice}
                                        onChange={e => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) update(idx, 'unitPrice', e.target.value); }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={12} align="bottom">
                            <Col xs={8}>
                                <Form.Item label={<Text style={{ fontSize: 11, color: '#999' }}>GST Rate</Text>} style={{ marginBottom: 0 }}>
                                    <Select
                                        value={item.taxRate || undefined}
                                        placeholder="GST %"
                                        onChange={v => update(idx, 'taxRate', v)}
                                        options={GST_RATES.map(r => ({ value: r, label: `GST ${r}%` }))}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={8}>
                                <Form.Item label={<Text style={{ fontSize: 11, color: '#999' }}>GST Type</Text>} style={{ marginBottom: 0 }}>
                                    <Select
                                        value={item.gstType}
                                        onChange={v => update(idx, 'gstType', v)}
                                        options={GST_TYPES}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={8}>
                                <Form.Item label={<Text style={{ fontSize: 11, color: '#999' }}>Net Amount</Text>} style={{ marginBottom: 0 }}>
                                    <div style={{ padding: '4px 11px', background: '#f5f5f5', borderRadius: 6, border: '1px solid #e8e8e8', minHeight: 32, display: 'flex', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 13, fontWeight: 600, color: net > 0 ? '#000' : '#bbb' }}>
                                            {net > 0 ? fmt(net) : '—'}
                                        </Text>
                                    </div>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                );
            })}
            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={add}
                block
                style={{ borderRadius: 10, borderColor: '#ff4f4f', color: '#ff4f4f', height: 40 }}
            >
                Add Line Item
            </Button>
            {showErrors && typeof errors.lineItems === 'string' && (
                <Text style={{ color: '#ff4d4f', fontSize: 12 }}>{errors.lineItems as string}</Text>
            )}
            {total > 0 && (
                <Flex justify="flex-end">
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 16px', textAlign: 'right' }}>
                        <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', display: 'block' }}>Invoice Total</Text>
                        <Text style={{ fontSize: 16, fontWeight: 700, display: 'block', marginTop: 2 }}>{fmt(total)}</Text>
                    </div>
                </Flex>
            )}
        </Flex>
    );
};

const UploadInvoicePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const defaultPoId = location.state?.defaultPoId;
    const { create, isSubmitting } = useInvoice();

    const initialValues = {
        purchaseOrder: defaultPoId ? String(defaultPoId) : '',
        accountNumber: '',
        ifscCode: '',
        invoiceNumber: '',
        invoiceDate: '',
        receivedDate: '',
        dueDate: '',
        notes: '',
        invoiceFile: '',
        invoiceFileFormat: '',
        invoiceFileName: '',
        lineItems: [emptyLineItem()],
    };
    const { dropdownData: purchaseOrders, fetchDropdownData } = usePurchaseOrder();

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

    const [selectedPoId, setSelectedPoId] = useState<number>(defaultPoId ? Number(defaultPoId) : 0);
    const { detail: poDetail } = usePurchaseOrder(selectedPoId ? String(selectedPoId) : undefined);
    const [pendingValues, setPendingValues] = useState<typeof initialValues | null>(null);
    const invoiceFilters = useMemo(() => selectedPoId ? { purchaseOrderId: selectedPoId, limit: 50 } : undefined, [selectedPoId]);
    const { tableData: existingInvoices, isLoading: isLoadingInvoices } = useInvoice(invoiceFilters);

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.invoicing.index}`);

    const doCreate = async (values: typeof initialValues) => {
        const selectedPO = purchaseOrders.find(po => po.id === Number(values.purchaseOrder));
        const invoiceTotal = calcInvoiceTotal(values.lineItems);
        const result = await create({
            purchaseOrderId: Number(values.purchaseOrder),
            vendorId: selectedPO?.vendorId ?? 0,
            invoiceNumber: values.invoiceNumber,
            amount: invoiceTotal,
            invoiceDate: values.invoiceDate,
            receivedDate: values.receivedDate || undefined,
            dueDate: values.dueDate || undefined,
            accountNumber: values.accountNumber || undefined,
            ifscCode: values.ifscCode || undefined,
            notes: values.notes || undefined,
            attachments: values.invoiceFileName
                ? [{ fileName: values.invoiceFileName, fileBase64: values.invoiceFile, fileFormat: values.invoiceFileFormat }]
                : undefined,
            lineItems: values.lineItems.map(item => ({
                description: item.description,
                qty: Number(item.qty),
                unit: item.unit,
                unitPrice: Number(item.unitPrice),
                taxRate: item.taxRate,
                gstType: item.gstType,
                total: calcNet(item),
            })),
        });
        if (result) handleCancel();
        setPendingValues(null);
    };

    const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
        const selectedPO = purchaseOrders.find(po => po.id === Number(values.purchaseOrder));
        const poTotal = Number(selectedPO?.totalAmount) || 0;
        if (poTotal > 0) {
            const alreadyInvoiced = existingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
            const totalAfter = alreadyInvoiced + calcInvoiceTotal(values.lineItems);
            if (totalAfter > poTotal + 0.01) {
                dispatch(showToast({ variant: 'error', description: `Invoice total ${fmt(totalAfter)} exceeds the PO value of ${fmt(poTotal)}. Cannot upload an invoice beyond the PO limit.` }));
                setSubmitting(false);
                return;
            }
            if (totalAfter < poTotal - 0.01) {
                setPendingValues(values);
                setSubmitting(false);
                return;
            }
        }
        await doCreate(values);
    };

    const poOptions = purchaseOrders.map(po => ({
        value: String(po.id),
        label: po.refNumber + (po.vendor?.businessName ? ` — ${po.vendor.businessName}` : ''),
    }));

    return (
        <>
        {pendingValues && (() => {
            const selPO = purchaseOrders.find(po => po.id === Number(pendingValues.purchaseOrder));
            const poTotal = Number(selPO?.totalAmount) || 0;
            const alreadyInvoiced = existingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
            const enteredAmount = calcInvoiceTotal(pendingValues.lineItems);
            const totalAfter = alreadyInvoiced + enteredAmount;
            const isOver = totalAfter > poTotal;
            return (
                <Modal
                    open
                    title="Invoice amount mismatch"
                    okText="Yes, proceed"
                    cancelText="Review invoice"
                    okButtonProps={{ danger: true, loading: isSubmitting }}
                    onOk={() => doCreate(pendingValues)}
                    onCancel={() => setPendingValues(null)}
                >
                    <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>
                        This invoice (<strong>{fmt(enteredAmount)}</strong>) will bring the total invoiced for this PO to{' '}
                        <strong>{fmt(totalAfter)}</strong>, which {isOver ? 'exceeds' : 'is short of'} the PO value of{' '}
                        <strong>{fmt(poTotal)}</strong> by <strong>{fmt(Math.abs(totalAfter - poTotal))}</strong>.
                    </p>
                    <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
                        Are you sure you want to upload this invoice against this PO?
                    </p>
                </Modal>
            );
        })()}
        <Formik initialValues={initialValues} validationSchema={uploadInvoiceSchema} onSubmit={handleSubmit}>
            {({ values, handleSubmit: formikSubmit }) => {
                const selectedPO = purchaseOrders.find(po => po.id === Number(values.purchaseOrder));
                const poTotal = Number(selectedPO?.totalAmount) || 0;
                const alreadyInvoiced = existingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
                return (
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card bordered={false} className="rounded-3xl w-full" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 32 } }}>
                                <Title level={4} className="text-center" style={{ marginBottom: 4 }}>Upload Invoice</Title>
                                <Text className="text-[#000000] text-xs block mb-10 text-center">
                                    Capture a vendor invoice manually and match it to the correct purchase order
                                </Text>

                                <Form layout="vertical" onFinish={formikSubmit}>
                                    <ScrollToError />
                                    <FormSpy setPoId={setSelectedPoId} poDetail={poDetail} />
                                    {/* Link to Purchase Order */}
                                    <Card bordered={false} className="rounded-3xl mb-4 mt-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '20px 24px'  } }}>
                                        <SectionHeader
                                            icon={linkToPurchase}
                                            title="Link to Purchase Order"
                                            subtitle="Choose the PO this invoice belongs to and confirm the vendor context"
                                        />
                                        <SelectInputWithSearch
                                            name="purchaseOrder"
                                            label="Purchase Order"
                                            placeholder="Select a purchase order"
                                            options={poOptions}
                                            isRequired
                                            isDisabled={!!defaultPoId}
                                        />
                                        <Row gutter={16}>
                                            <Col xs={24} sm={12}>
                                                <TextInput
                                                    name="accountNumber"
                                                    label="Account Number"
                                                    type="text"
                                                    placeholder="Enter Account Number"
                                                    formItemClass="!mb-0"
                                                    allowNumbersOnly
                                                />
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <TextInput
                                                    name="ifscCode"
                                                    label="IFSC Code"
                                                    type="text"
                                                    placeholder="Enter IFSC Code"
                                                    formItemClass="!mb-0"
                                                    allowAlphabetsAndNumbersOnly
                                                    convertToUppercase
                                                    maxLength={11}
                                                />
                                            </Col>
                                        </Row>
                                        <Row gutter={24} style={{ marginTop: 16 }}>
                                            <Col xs={24} sm={12}>
                                                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                                                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', display: 'block' }}>Vendor</Text>
                                                    <Text style={{ fontSize: 12, color: '#000', display: 'block', fontWeight: 500, marginTop: 4 }}>
                                                        {selectedPO?.vendor?.businessName ?? 'Select a PO first'}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', display: 'block', marginTop: 4 }}>
                                                        Vendor details will auto-fill from the linked PO
                                                    </Text>
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                                                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', display: 'block' }}>Vendor</Text>
                                                    <Text style={{ fontSize: 12, color: '#000', display: 'block', fontWeight: 500, marginTop: 4 }}>
                                                        {selectedPO?.vendor?.businessName ?? 'Select a PO first'}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', display: 'block', marginTop: 4 }}>
                                                        Vendor details will auto-fill from the linked PO
                                                    </Text>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>

                                    {/* Invoice Details */}
                                     <Card bordered={false} className="rounded-3xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '20px 24px'  } }}>
                                        <SectionHeader
                                            icon={invoiceDetails}
                                            title="Invoice Details"
                                            subtitle="Capture the metadata exactly as received from the vendor"
                                        />
                                        <PoAmountSummary poTotal={poTotal} alreadyInvoiced={alreadyInvoiced} isLoading={isLoadingInvoices} />
                                        <Row gutter={16} style={{ marginBottom: 16 }}>
                                            <Col xs={24}>
                                                <TextInput
                                                    name="invoiceNumber"
                                                    label="Invoice Number"
                                                    type="text"
                                                    placeholder="Enter Invoice number"
                                                    isRequired
                                                    formItemClass="!mb-0"
                                                    maxLength={18}
                                                    allowAlphabetsNumberAndSpecialCharacters={['-', '_', '/']}
                                                />
                                            </Col>
                                        </Row>
                                        <Form.Item label={<Text style={{ fontSize: 13, fontWeight: 500 }}>Line Items</Text>} style={{ marginBottom: 0, marginTop: 16 }} required>
                                            <LineItemsSection />
                                        </Form.Item>
                                        <Row gutter={16} style={{ marginTop: 16 }}>
                                            <Col xs={24} sm={8}>
                                                <DatePickerInput
                                                    name="invoiceDate"
                                                    label="Invoice Date"
                                                    placeholder="Select date"
                                                    isRequired
                                                    needConfirm={false}
                                                    formItemClass="!mb-0"
                                                    classes="w-full"
                                                    maxDate={dayjs()}
                                                />
                                            </Col>
                                            <Col xs={24} sm={8}>
                                                <DatePickerInput
                                                    name="receivedDate"
                                                    label="Received Date"
                                                    placeholder="Select date"
                                                    isRequired
                                                    needConfirm={false}
                                                    formItemClass="!mb-0"
                                                    classes="w-full"
                                                    maxDate={dayjs()}
                                                />
                                            </Col>
                                            <Col xs={24} sm={8}>
                                                <DatePickerInput
                                                    name="dueDate"
                                                    label="Due Date"
                                                    placeholder="Select date"
                                                    needConfirm={false}
                                                    formItemClass="!mb-0"
                                                    classes="w-full"
                                                    minDate={dayjs()}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>

                                    {/* Invoice Documents */}
                                     <Card bordered={false} className="rounded-3xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '20px 24px'  } }}>
                                        <SectionHeader
                                            icon={invoicingDocumentIcon}
                                            title="Invoice Documents"
                                            subtitle="Upload the invoice plus any supporting delivery or approval documents"
                                        />
                                        <Form.Item label="Attachment" style={{ marginBottom: 8 }}>
                                            <InvoiceDragger />
                                        </Form.Item>
                                        <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', display: 'block', textAlign: 'center' }}>
                                            Simulated upload. Filenames are stored in session storage and shown in the invoice detail view.
                                        </Text>
                                    </Card>

                                    {/* Notes & Intake Context */}
                                     <Card className="rounded-3xl border border-gray-100 mb-4" styles={{ body: { padding: '20px 24px 8px'  } }}>
                                        <SectionHeader
                                            icon={invoicingDocumentIcon}
                                            title="Notes & Intake Context"
                                            subtitle="Capture anything procurement or finance should know before payment"
                                        />
                                        <TextAreaInput
                                            name="notes"
                                            label="Notes"
                                            placeholder="Enter notes"
                                            minRows={4}
                                            showCount
                                            maxLength={250}
                                        />
                                    </Card>

                                    <Flex gap={10} style={{ marginTop: 0 }}>
                                        <Button
                                            type="primary"
                                            danger
                                            htmlType="submit"
                                            loading={isSubmitting}
                                        >
                                            Upload Invoice
                                        </Button>
                                        <Button
                                            danger
                                            onClick={handleCancel}
                                            disabled={isSubmitting}
                                            style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                        >
                                            Cancel
                                        </Button>
                                    </Flex>
                                </Form>
                            </Card>
                        </Col>

                        {/* Right Sidebar */}
                        <Col xs={24} lg={8}>
                            <>
        <Card bordered={false} className="rounded-3xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
            <Card
                className="mb-4 rounded-xl !bg-[#FAF9F6] !border-0"
                styles={{ body: { padding: '20px 16px', display: 'flex', justifyContent: 'center' } }}
            >
                <img src={newRFQImage} alt="tips" style={{ width: 160, opacity: 0.9 }} />
            </Card>
            <Text strong className="block !mb-1" style={{ fontWeight: 500, fontSize: 18 }}>Tips</Text>
            <Flex vertical gap={28} className="mb-4 mt-6">
                {PO_TIPS.map((tip, i) => (
                    <Flex key={i} gap={10} align="flex-start">
                        <span className="shrink-0 w-[10px] h-[10px] rounded-full mt-1 block" style={{ background: '#ff4f4f' }} />
                        <Text style={{ fontSize: 14, color: '#7d7d7d', lineHeight: '22px' }}>{tip}</Text>
                    </Flex>
                ))}
            </Flex>
        </Card>

        <Card className="rounded-3xl border border-gray-100" styles={{ body: { padding: 24 } }}>
            <Text strong className="block !mb-5" style={{ fontWeight: 500, fontSize: 18 }}>
                What happens next?
            </Text>
            <Flex vertical gap={12} className="mt-6">
                {PO_STEPS.map((step, i) => (
                    <Card
                        key={i}
                        size="small"
                        className="!rounded-[28px] !bg-[#faf9f6] !border-0"
                        styles={{ body: { padding: '30px 21px' } }}
                    >
                        <Flex gap={21} align="center">
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    flexShrink: 0,
                                    width: 47,
                                    height: 47,
                                    minWidth: 47,
                                    minHeight: 47,
                                    borderRadius: 23.5,
                                    background: '#fff',
                                    border: '1px solid #f0f0f0',
                                    fontWeight: 600,
                                    fontSize: 22,
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                                {i + 1}
                            </Flex>
                            <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', lineHeight: '22px' }}>
                                {step}
                            </Text>
                        </Flex>
                    </Card>
                ))}
            </Flex>
        </Card>
    </>
                        </Col>
                    </Row>
                );
            }}
        </Formik>
        </>
    );
};

export default UploadInvoicePage;
