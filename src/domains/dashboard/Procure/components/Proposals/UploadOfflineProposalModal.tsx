import React, { useEffect, useRef, useState } from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Flex, Form, Grid, Modal, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, FormikProps } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { getRFQById } from '../../api';
import { useProposals } from '../../hooks/useProposals';
import { useVendor } from '../../hooks/useVendor';
import { uploadOfflineProposalSchema } from '../../schema';
import { PAYMENT_TERMS, UPLOAD_PROPOSAL_STEP_LABELS } from '../../utils/data';
import ScrollToError from '../ScrollToError';

const { Text } = Typography;
const { useBreakpoint } = Grid;

type LineItem = { key: string; description: string; qty: string; unitPrice: string };
type FormValues = {
    rfqId: number | null;
    invitedVendorId: number | null;
    totalAmount: string;
    validUntil: string;
    paymentTerms: string;
    notes: string;
    lineItems: LineItem[];
};

type Props = { open: boolean; onClose: () => void; rfqId?: number | string; onSuccess?: () => void };

const StepIndicator: React.FC<{ index: number; current: number }> = ({ index, current }) => {
    const isActive = current >= index;
    return (
        <Flex align="center" gap={10} className="shrink-0">
            <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${isActive ? 'bg-[#ff4f4f]' : 'bg-[#eeeeee]'}`}>
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-[#a9acb4]'}`}>
                    {index + 1}
                </span>
            </div>
            <Text className={`!text-sm !font-medium hidden sm:inline ${isActive ? '!text-[#393a42]' : '!text-[#a9acb4]'}`}>
                {UPLOAD_PROPOSAL_STEP_LABELS[index]}
            </Text>
        </Flex>
    );
};

const StepConnector: React.FC = () => (
    <div className="flex-1 h-px bg-[#d9d9d9] mx-1" />
);

const initialValues: FormValues = {
    rfqId: null,
    invitedVendorId: null,
    totalAmount: '',
    validUntil: '',
    paymentTerms: '',
    notes: '',
    lineItems: [{ key: '1', description: '', qty: '', unitPrice: '' }],
};

const UploadOfflineProposalModal: React.FC<Props> = ({ open, onClose, rfqId: prefillRfqId, onSuccess }) => {
    const screens = useBreakpoint();
    const isMobile = !screens.sm;

    const [step, setStep] = useState(0);
    const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
    const [step1Error, setStep1Error] = useState('');
    const [step2Error, setStep2Error] = useState('');

    const formikRef = useRef<FormikProps<FormValues>>(null);

    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const { rfqListDropdown, fetchRfqListDropdown, create, isSubmitting } = useProposals();

    useEffect(() => { if (open) fetchRfqListDropdown(); }, [open, fetchRfqListDropdown]);

    useEffect(() => {
        if (open && prefillRfqId) {
            const id = Number(prefillRfqId);
            setSelectedRfqId(id);
            setStep(1);
            setTimeout(() => formikRef.current?.setFieldValue('rfqId', id), 0);
        }
    }, [open, prefillRfqId]);

    const { fetchVendorsWithoutPagination, vendors } = useVendor();
    useEffect(() => { if (open) fetchVendorsWithoutPagination(); }, [open, fetchVendorsWithoutPagination]);

    const [selectedRfqDetail, setSelectedRfqDetail] = useState<any>(null);
    const [selectedInvite, setSelectedInvite] = useState<any>(null);

    useEffect(() => {
        if (!selectedRfqId) { setSelectedRfqDetail(null); return; }
        getRFQById({ corporateId: String(corporateId), id: selectedRfqId }).then(data => {
            if (data) setSelectedRfqDetail(data);
        });
    }, [selectedRfqId, corporateId]);

    const reset = () => {
        setStep(prefillRfqId ? 1 : 0);
        setSelectedRfqId(null);
        setSelectedRfqDetail(null);
        setSelectedInvite(null);
        setStep1Error('');
        setStep2Error('');
        formikRef.current?.resetForm();
        if (prefillRfqId) {
            setTimeout(() => formikRef.current?.setFieldValue('rfqId', Number(prefillRfqId)), 0);
        }
    };

    const handleClose = () => { reset(); onClose(); };

    const handleFormSubmit = async (values: FormValues) => {
        let resolvedVendorId = Number(values.invitedVendorId);
        if (selectedInvite?.vendor == null && selectedInvite?.externalEmail) {
            const matched = vendors.find((vd: any) => vd.email?.toLowerCase() === selectedInvite.externalEmail.toLowerCase());
            if (matched) resolvedVendorId = matched.id;
        }
        const result = await create({
            rfqId: Number(values.rfqId),
            vendorId: resolvedVendorId,
            totalAmount: values.totalAmount ? Number(values.totalAmount) : undefined,
            validUntil: values.validUntil || undefined,
            paymentTerms: values.paymentTerms || undefined,
            notes: values.notes || undefined,
            lineItems: (() => {
                const filled = values.lineItems.filter(i => i.description.trim() !== '' || Number(i.unitPrice) > 0);
                return filled.length > 0
                    ? filled.map(({ description, qty, unitPrice }) => ({ description, qty: Number(qty), unitPrice: Number(unitPrice) }))
                    : undefined;
            })(),
            isOffline: true,
        });
        if (result) { handleClose(); onSuccess?.(); }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            title={null}
            footer={null}
            width={isMobile ? '95%' : 620}
            destroyOnHidden
            styles={{ content: { borderRadius: isMobile ? 20 : 41, padding: isMobile ? '20px 16px' : '36px 38px' }, body: { padding: 0 } }}
        >
            <Flex vertical gap={22}>
                <Text className="!text-[24px] !font-medium !text-black">Upload Offline Proposal</Text>
                <Card style={{ borderRadius: isMobile ? 16 : 26, boxShadow: '0px 1.2px 12px 0px rgba(122,122,122,0.06)' }} styles={{ body: { padding: isMobile ? 16 : 33 } }}>
                    <Text className="!text-xs !text-[#a9acb4] block">
                        Enter details from a vendor&apos;s emailed quote &mdash; it&apos;ll appear just like an online proposal.
                    </Text>

                    <Formik
                        innerRef={formikRef}
                        initialValues={initialValues}
                        validationSchema={uploadOfflineProposalSchema}
                        onSubmit={handleFormSubmit}
                    >
                        {({ values, setFieldValue, handleSubmit }) => {
                            const selectedRfq = rfqListDropdown.find((r: any) => r.id === values.rfqId) ?? null;
                            const selectedVendorData = selectedRfqDetail?.vendorInvites?.find((v: any) => {
                                if (v.vendor != null) return v.vendor.id === values.invitedVendorId;
                                const matched = vendors.find((vd: any) => vd.email?.toLowerCase() === v.externalEmail?.toLowerCase());
                                return matched ? matched.id === values.invitedVendorId : v.id === values.invitedVendorId;
                            });
                            const resolvedVendorName = (() => {
                                if (selectedVendorData?.vendor?.businessName) return selectedVendorData.vendor.businessName;
                                if (selectedVendorData?.externalEmail) {
                                    const m = vendors.find((vd: any) => vd.email?.toLowerCase() === selectedVendorData.externalEmail.toLowerCase());
                                    return m?.businessName ?? selectedVendorData.externalEmail;
                                }
                                return null;
                            })();
                            const selectedVendorName = resolvedVendorName;

                            const handleNext = () => {
                                if (step === 0) {
                                    if (!values.rfqId) { setStep1Error('Please select an RFQ to continue'); return; }
                                    setStep1Error('');
                                }
                                if (step === 1) {
                                    if (!values.invitedVendorId) { setStep2Error('Please select a vendor to continue'); return; }
                                    setStep2Error('');
                                }
                                setStep(s => s + 1);
                            };

                            const addLineItem = () =>
                                setFieldValue('lineItems', [...values.lineItems, { key: String(Date.now()), description: '', qty: '', unitPrice: '' }]);

                            const removeLineItem = (key: string) =>
                                setFieldValue('lineItems', values.lineItems.filter(i => i.key !== key));

                            // ── Step 1 ───────────────────────────────────────────────────────────
                            const renderStep1 = () => (
                                <Flex vertical gap={12}>
                                    <Flex vertical gap={6}>
                                        <Text className="!text-base !font-medium !text-[#505051]">Request for Quote</Text>
                                        <Text className="!text-sm !text-[#a9acb4]">Which RFQ is this vendor&apos;s proposal in response to?</Text>
                                    </Flex>

                                    <SelectInputWithSearch
                                        name="rfqId"
                                        placeholder="Search and select an RFQ"
                                        options={rfqListDropdown.map((r: any) => ({ value: Number(r.id), label: r.title }))}
                                        handleChange={(val: any) => {
                                            setSelectedInvite(null);
                                            setFieldValue('invitedVendorId', '');
                                            if (val == null || val === '') {
                                                setSelectedRfqId(null);
                                                setFieldValue('rfqId', null);
                                                setStep1Error('');
                                                return;
                                            }
                                            const numVal = Number(val);
                                            setSelectedRfqId(numVal);
                                            setFieldValue('rfqId', numVal);
                                            setStep1Error('');
                                        }}
                                    />
                                    {step1Error && <Text className="!text-[#ff4f4f] !text-xs">{step1Error}</Text>}

                                    {selectedRfq && (
                                        <Flex vertical gap={6} className="bg-[#fff1f0] border border-[#ffccc7] rounded-lg px-[14px] py-3">
                                            <Flex justify="space-between" align="center">
                                                <Text className="!text-[11px] !text-[#a9acb4] uppercase tracking-[0.05em] !font-medium">Selected RFQ</Text>
                                            </Flex>
                                            <Text strong className="!text-sm">{selectedRfq.title}</Text>
                                            <Text className="!text-xs !text-[#a9acb4]">
                                                Ref: {selectedRfq.refNumber}&emsp;Vendors: {selectedRfqDetail?.vendorInvites?.length ?? selectedRfq.vendorInvites?.total ?? 0} invited
                                            </Text>
                                        </Flex>
                                    )}
                                </Flex>
                            );

                            // ── Step 2 ───────────────────────────────────────────────────────────
                            const renderStep2 = () => (
                                <Flex vertical gap={16}>
                                    <Text className="!text-base !font-medium !text-[#505051]">Which vendor submitted this proposal?</Text>

                                    <Flex vertical gap={4}>
                                        <Text className="!text-[13px] !text-[#a9acb4]">Invited to this RFQ</Text>
                                        <SelectInputWithSearch
                                            name="invitedVendorId"
                                            placeholder="Search and select vendor"
                                            options={(selectedRfqDetail?.vendorInvites ?? []).map((v: any) => {
                                            if (v.vendor != null) return { value: v.vendor.id, label: v.vendor.businessName };
                                            const matched = vendors.find((vd: any) => vd.email?.toLowerCase() === v.externalEmail?.toLowerCase());
                                            return matched
                                                ? { value: matched.id, label: matched.businessName }
                                                : { value: v.id, label: `${v.externalEmail ?? '—'} (External)` };
                                        })}
                                            handleChange={(val: any) => {
                                                setStep2Error('');
                                                const invite = (selectedRfqDetail?.vendorInvites ?? []).find((v: any) => {
                                                    if (v.vendor != null) return v.vendor.id === Number(val);
                                                    const matched = vendors.find((vd: any) => vd.email?.toLowerCase() === v.externalEmail?.toLowerCase());
                                                    return matched ? matched.id === Number(val) : v.id === Number(val);
                                                });
                                                setSelectedInvite(invite ?? null);
                                            }}
                                        />
                                    </Flex>

                                    {step2Error && <Text className="!text-[#ff4f4f] !text-xs">{step2Error}</Text>}
                                </Flex>
                            );

                            // ── Step 3 ───────────────────────────────────────────────────────────
                            const renderStep3 = () => (
                                <Form layout="vertical" onFinish={handleSubmit}>
                                    <Flex vertical gap={10}>
                                        <div className="bg-[#fafafa] rounded-xl p-4">
                                            <Flex vertical gap={3}>
                                                <Text className="!text-base !font-medium !text-black">{selectedVendorName}</Text>
                                                <Text className="!text-sm !text-[rgba(0,0,0,0.5)]">{selectedRfq?.title}</Text>
                                            </Flex>
                                        </div>

                                        <Alert
                                            message="Enter the key details from the vendor's emailed quote. Adding line items is optional but enables full side-by-side price comparison."
                                            type="warning"
                                            showIcon
                                            className="text-xs"
                                        />

                                        <Flex gap={16} wrap="wrap">
                                            <div className="flex-1 min-w-[180px]">
                                                <TextInput
                                                    name="totalAmount"
                                                    label="Total Amount (₹)"
                                                    type="text"
                                                    placeholder="Enter total amount"
                                                    allowTwoDecimalsOnly
                                                    isRequired
                                                    maxLength={10}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[180px]">
                                                <DatePickerInput
                                                    name="validUntil"
                                                    label="Valid Until"
                                                    placeholder="Select date"
                                                    classes="w-full"
                                                    needConfirm={false}
                                                    minDate={dayjs().add(1, 'day')}
                                                    isRequired
                                                />
                                            </div>
                                        </Flex>

                                        <SelectInput
                                            name="paymentTerms"
                                            label="Payment Terms"
                                            placeholder="Select payment terms"
                                            options={PAYMENT_TERMS}
                                            classes="w-full"
                                        />

                                        <div className="bg-[#fafafa] rounded-xl p-3 sm:p-6">
                                            <Flex justify="space-between" align="flex-start">
                                                <Flex vertical gap={3}>
                                                    <Text className="!text-base !font-medium !text-black">Add line item</Text>
                                                    <Text className="!text-sm !text-[rgba(0,0,0,0.5)]">Optional - enables full side by side price comparisons</Text>
                                                </Flex>
                                            </Flex>
                                            <Divider className="!my-3" />
                                            <Text className="!text-xs !text-[rgba(0,0,0,0.5)] block !mb-3">
                                                Enter line items from the vendor&apos;s quote to enable per-item price comparison.
                                            </Text>

                                            <div className="overflow-x-auto -mx-1">
                                                <Table
                                                    size="small"
                                                    pagination={false}
                                                    dataSource={values.lineItems}
                                                    rowKey="key"
                                                    className="mt-2 [&_.ant-table-cell]:align-top"
                                                    columns={[
                                                        {
                                                            title: 'Description', dataIndex: 'description',
                                                            render: (_: string, _record: LineItem, i: number) => (
                                                                <TextInput
                                                                    name={`lineItems[${i}].description`}
                                                                    type="text"
                                                                    placeholder="Enter Description"
                                                                    size="small"
                                                                    removeEmoji
                                                                    formItemClass="!mb-0"
                                                                    maxLength={200}
                                                                />
                                                            ),
                                                        },
                                                        {
                                                            title: 'Qty', dataIndex: 'qty', width: 80,
                                                            render: (_: string, _record: LineItem, i: number) => (
                                                                <TextInput
                                                                    name={`lineItems[${i}].qty`}
                                                                    type="text"
                                                                    placeholder="1"
                                                                    size="small"
                                                                    allowTwoDecimalsOnly
                                                                    inputMode="numeric"
                                                                    maxLength={8}
                                                                    formItemClass="!mb-0"
                                                                />
                                                            ),
                                                        },
                                                        {
                                                            title: 'Unit Price', dataIndex: 'unitPrice', width: 110,
                                                            render: (_: string, _record: LineItem, i: number) => (
                                                                <TextInput
                                                                    name={`lineItems[${i}].unitPrice`}
                                                                    type="text"
                                                                    placeholder="0"
                                                                    size="small"
                                                                    allowTwoDecimalsOnly
                                                                    inputMode="decimal"
                                                                    prefix="₹"
                                                                    maxLength={8}
                                                                    formItemClass="!mb-0"
                                                                />
                                                            ),
                                                        },
                                                        {
                                                            title: 'Total', width: 100,
                                                            render: (_: any, record: LineItem) => (
                                                                <Text className="!text-xs whitespace-nowrap pt-[5px] block">₹ {(Number(record.qty) * Number(record.unitPrice)).toFixed(2)}</Text>
                                                            ),
                                                        },
                                                        {
                                                            title: '', width: 40,
                                                            render: (_: any, record: LineItem) => (
                                                                <Button type="text" icon={<DeleteOutlined />} size="small" disabled={values.lineItems.length === 1} onClick={() => removeLineItem(record.key)} className="!pt-[5px]" />
                                                            ),
                                                        },
                                                    ]}
                                                    footer={() => (
                                                        <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={addLineItem} block>
                                                            Add row
                                                        </Button>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <TextAreaInput
                                            name="notes"
                                            label="Notes"
                                            placeholder=""
                                            minRows={3}
                                            removeEmoji
                                        />
                                    </Flex>
                                </Form>
                            );

                            const stepContent = [renderStep1, renderStep2, renderStep3];

                            return (
                                <>
                                    <ScrollToError />
                                    <Flex align="center" className="mb-6 mt-5">
                                        <StepIndicator index={0} current={step} />
                                        <StepConnector />
                                        <StepIndicator index={1} current={step} />
                                        <StepConnector />
                                        <StepIndicator index={2} current={step} />
                                    </Flex>

                                    {stepContent[step]()}

                                    <Flex gap={9} className="mt-6">
                                        <Button
                                            danger
                                            className="flex-1 !h-10 !rounded-lg"
                                            style={{ borderColor: '#ff4f4f', color: '#ff4f4f' }}
                                            onClick={step > 0 ? () => setStep(s => s - 1) : handleClose}
                                        >
                                            {step > 0 ? 'Back' : 'Cancel'}
                                        </Button>
                                        {step < 2 && (
                                            <Button
                                                type="primary"
                                                danger
                                                className="flex-1 !h-10 !rounded-lg"
                                                onClick={handleNext}
                                            >
                                                Next
                                            </Button>
                                        )}
                                        {step === 2 && (
                                            <Button
                                                type="primary"
                                                danger
                                                loading={isSubmitting}
                                                className="flex-1 !h-10 !rounded-lg !bg-[#ff4f4f]"
                                                onClick={() => formikRef.current?.submitForm()}
                                            >
                                                Submit
                                            </Button>
                                        )}
                                    </Flex>
                                </>
                            );
                        }}
                    </Formik>
                </Card>
            </Flex>
        </Modal>
    );
};

export default UploadOfflineProposalModal;
