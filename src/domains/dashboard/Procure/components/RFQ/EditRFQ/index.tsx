import React, { useEffect, useRef, useState } from 'react';

import { Button, Card, Col, Flex, Form, Grid, Modal, Row, Spin, Typography } from 'antd';
import { Formik, setNestedObjectValues, useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { useRFQ } from '../../../hooks/useRFQ';
import { useVendor } from '../../../hooks/useVendor';
import { newRFQSchema } from '../../../schema';
import { resetRFQDraft, setRFQDraft } from '../../../slices/rfqDraftSlice';
import { UpdateRFQPayload, Vendor } from '../../../types';
import BasicInformation from '../NewRFQ/BasicInformation';
import LineItems, { LineItem } from '../NewRFQ/LineItems';
import SelectVendors from '../NewRFQ/SelectVendors';
import TermsAndNotes from '../NewRFQ/TermsAndNotes';
import TipsPanel from '../NewRFQ/TipsPanel';

const { Title, Text } = Typography;

const VENDOR_FILTERS = { page: 1, limit: 100 };

const AutoSaveDraft: React.FC<{ rfqId: number }> = ({ rfqId }) => {
    const { values } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valuesRef = useRef(values);
    valuesRef.current = values;

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { attachments: _attachments, ...rest } = valuesRef.current;
            dispatch(setRFQDraft({ ...rest, rfqId }));
        }, 800);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            // Flush immediately on unmount so navigating away never loses data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { attachments: _attachments, ...rest } = valuesRef.current;
            dispatch(setRFQDraft({ ...rest, rfqId }));
        };
    }, [values, dispatch, rfqId]);

    return null;
};

const EditRFQ: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { md } = Grid.useBreakpoint();
    const { detail, isSubmitting, update, saveExistingDraft, vendorEmailError, clearVendorEmailError } = useRFQ(id);
    const { vendors, fetchVendors } = useVendor(undefined, VENDOR_FILTERS);
    const savedDraft = useAppSelector(state => state.reducer.rfqDraft);

    const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [initialValues, setInitialValues] = useState({
        title: '',
        prRef: '',
        deadline: '',
        terms: '',
        notes: '',
        attachments: [] as { fileName: string; fileBase64: string; fileFormat: string }[],
        prAttachments: [] as { fileName: string; url: string }[],
        lineItems: [{ key: '1', description: '', qty: 1, unit: 'Unit', price: '' }] as LineItem[],
        invitedVendors: [] as number[],
        invitedEmails: [] as string[],
    });

    useEffect(() => {
        if (!detail) return;

        const existingVendors: Vendor[] = (detail.vendorInvites ?? [])
            .filter(inv => inv.vendor)
            .map(inv => inv.vendor as Vendor);
        const existingEmails: string[] = (detail.vendorInvites ?? [])
            .filter(inv => !inv.vendor && inv.externalEmail)
            .map(inv => inv.externalEmail as string);

        // Check if there's an unsaved draft for this specific RFQ
        const hasDraft = savedDraft?.rfqId === detail.id;

        const fromApi = {
            title: detail.title ?? '',
            prRef: detail.purchaseRequestId ? String(detail.purchaseRequestId) : '',
            deadline: detail.submissionDeadline ? detail.submissionDeadline.split('T')[0] : '',
            terms: detail.termsAndConditions ?? '',
            notes: detail.buyerNotes ?? '',
            attachments: [] as { fileName: string; fileBase64: string; fileFormat: string }[],
            prAttachments: (detail.attachments?.map((a: any) => ({ fileName: a.fileName, url: a.url })) ?? []) as { fileName: string; url: string }[],
            lineItems: detail.lineItems?.length
                ? detail.lineItems.map(li => ({
                    key: String(li.id),
                    description: li.description,
                    qty: li.qty,
                    unit: li.unit || 'Unit',
                    price: li.estUnitCost,
                }))
                : [{ key: '1', description: '', qty: 1, unit: 'Unit', price: '' }],
            invitedVendors: existingVendors.map(v => v.id),
            invitedEmails: existingEmails,
        };

        if (hasDraft) {
            // Merge unsaved draft over API data — preserves mid-edit changes
            const draftVendorIds = savedDraft.invitedVendors?.length ? savedDraft.invitedVendors : fromApi.invitedVendors;
            const restoredVendors = vendors.length
                ? vendors.filter(v => draftVendorIds.includes(v.id))
                : existingVendors;
            setSelectedVendors(restoredVendors);
            setInitialValues({
                ...fromApi,
                title:    savedDraft.title    || fromApi.title,
                deadline: savedDraft.deadline || fromApi.deadline,
                terms:    savedDraft.terms    !== undefined ? savedDraft.terms    : fromApi.terms,
                notes:    savedDraft.notes    !== undefined ? savedDraft.notes    : fromApi.notes,
                lineItems: savedDraft.lineItems?.length ? savedDraft.lineItems as typeof fromApi.lineItems : fromApi.lineItems,
                invitedVendors: draftVendorIds,
                invitedEmails:  savedDraft.invitedEmails?.length ? savedDraft.invitedEmails : fromApi.invitedEmails,
            });
        } else {
            setSelectedVendors(existingVendors);
            setInitialValues(fromApi);
        }
        setIsInitialized(true);
    }, [detail]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-run vendor restore once vendor list loads (vendors arrives after detail)
    useEffect(() => {
        if (!vendors.length || !detail) return;
        const hasDraft = savedDraft?.rfqId === detail.id;
        const vendorIds = hasDraft && savedDraft.invitedVendors?.length
            ? savedDraft.invitedVendors
            : (detail.vendorInvites ?? []).filter(inv => inv.vendor).map(inv => inv.vendor!.id);
        const resolved = vendors.filter(v => vendorIds.includes(v.id));
        if (resolved.length) setSelectedVendors(resolved);
    }, [vendors]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}/${id}`);

    const buildPayload = (values: typeof initialValues): UpdateRFQPayload => ({
        title: values.title,
        submissionDeadline: values.deadline ? `${values.deadline}T23:59:59.000Z` : undefined,
        termsAndConditions: values.terms || undefined,
        buyerNotes: values.notes || undefined,
        attachments: values.attachments.length ? values.attachments : undefined,
        prAttachments: values.prAttachments,
        invitedVendors: selectedVendors.map(v => v.id),
        invitedEmails: values.invitedEmails?.length ? values.invitedEmails : undefined,
        lineItems: values.lineItems.map((item, index) => ({
            description: item.description,
            qty: Number(item.qty),
            unit: item.unit,
            estUnitCost: Number(item.price),
            sortOrder: index + 1,
        })),
    });

    const onSubmit = async (values: typeof initialValues) => {
        const result = await update(id!, buildPayload(values));
        if (result) {
            dispatch(resetRFQDraft());
            handleCancel();
        }
    };

    const onSaveAsDraft = async (values: typeof initialValues) => {
        setIsSavingDraft(true);
        const result = await saveExistingDraft(id!, {
            title: values.title || undefined,
            submissionDeadline: values.deadline ? `${values.deadline}T23:59:59.000Z` : undefined,
            termsAndConditions: values.terms || undefined,
            buyerNotes: values.notes || undefined,
            attachments: values.attachments.length ? values.attachments : undefined,
            prAttachments: values.prAttachments,
            invitedVendors: selectedVendors.map(v => v.id),
            invitedEmails: values.invitedEmails?.length ? values.invitedEmails : undefined,
            lineItems: values.lineItems
                .filter(item => item.description)
                .map((item, index) => ({
                    description: item.description,
                    qty: Number(item.qty) || 1,
                    unit: item.unit,
                    estUnitCost: Number(item.price) || 0,
                    sortOrder: index + 1,
                })),
        });
        setIsSavingDraft(false);
        if (result) {
            dispatch(resetRFQDraft());
            handleCancel();
        }
    };

    if (!detail || !isInitialized) {
        return <Flex justify="center" className="p-16"><Spin /></Flex>;
    }

    return (
        <>
        <Modal
            open={!!vendorEmailError}
            title="Vendor Email Missing"
            onCancel={clearVendorEmailError}
            footer={[
                <Button key="cancel" onClick={clearVendorEmailError}>Cancel</Button>,
                ...(vendorEmailError?.vendorsWithoutEmail?.length === 1
                    ? [<Button key="go" type="primary" danger onClick={() => { clearVendorEmailError(); navigate(`${paths.dashboard.procure}/vendor/edit/${vendorEmailError.vendorsWithoutEmail[0].id}`); }}>Go to Vendor</Button>]
                    : []),
            ]}
        >
            <p style={{ marginBottom: 12 }}>
                The following vendor(s) don&apos;t have an email address. Please add an email address before sending the RFQ:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
                {vendorEmailError?.vendorsWithoutEmail?.map(v => (
                    <li key={v.id} style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{v.businessName}</span>
                    </li>
                ))}
            </ul>
        </Modal>
        <Row gutter={24}>
            <Col xs={24} lg={15}>
                <Card className="rounded-3xl border border-gray-100" styles={{ body: { padding: md ? 32 : 16 } }}>
                    <Title level={4} className="text-center" style={{ marginBottom: 4 }}>
                        Edit RFQ {detail?.refNumber ? `· ${detail.refNumber}` : ''}
                    </Title>
                    <div style={{ marginBottom: 20 }} className="text-center">
                        <Text className="text-[#000000] text-xs">
                            Update this request for quotation
                        </Text>
                    </div>
                    <Formik
                        initialValues={initialValues}
                        enableReinitialize
                        validationSchema={newRFQSchema}
                        onSubmit={onSubmit}
                    >
                        {({ handleSubmit, setFieldValue, values, validateForm, setTouched }) => {
                            const addItem = () => {
                                setFieldValue('lineItems', [
                                    ...values.lineItems,
                                    { key: String(Date.now()), description: '', qty: '', unit: 'Unit', price: '' },
                                ]);
                            };

                            const removeItem = (key: string) => {
                                setFieldValue('lineItems', values.lineItems.filter(i => i.key !== key));
                            };

                            return (
                                <Form layout="vertical" onFinish={async () => {
                                    const errors = await validateForm();
                                    if (Object.keys(errors).length > 0) {
                                        setTouched(setNestedObjectValues(errors, true));
                                        requestAnimationFrame(() => {
                                            const firstError = document.querySelector('.ant-form-item-has-error, [data-form-error="true"]');
                                            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        });
                                        return;
                                    }
                                    handleSubmit();
                                }}>
                                    <AutoSaveDraft rfqId={detail.id} />
                                    <BasicInformation />
                                    <LineItems addItem={addItem} removeItem={removeItem} />
                                    <SelectVendors
                                        vendorOptions={vendors.filter(v => v.status === 'Active')}
                                        selectedVendors={selectedVendors}
                                        setSelectedVendors={setSelectedVendors}
                                        refetchVendors={fetchVendors}
                                    />
                                    <TermsAndNotes />

                                    <Flex gap={12} wrap="wrap">
                                        <Button type="primary" danger htmlType="submit" loading={isSubmitting} disabled={isSavingDraft}>
                                            Save Changes
                                        </Button>
                                        <Button
                                            danger
                                            onClick={async () => {
                                                const errors = await validateForm();
                                                if (Object.keys(errors).length > 0) {
                                                    setTouched(setNestedObjectValues(errors, true));
                                                    requestAnimationFrame(() => {
                                                        const firstError = document.querySelector('.ant-form-item-has-error, [data-form-error="true"]');
                                                        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    });
                                                    return;
                                                }
                                                onSaveAsDraft(values);
                                            }}
                                            loading={isSavingDraft}
                                            disabled={isSubmitting}
                                            style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                        >
                                            Save as Draft
                                        </Button>
                                        <Button
                                            onClick={handleCancel}
                                            disabled={isSubmitting || isSavingDraft}
                                        >
                                            Cancel
                                        </Button>
                                    </Flex>
                                </Form>
                            );
                        }}
                    </Formik>
                </Card>
            </Col>

            <Col xs={24} lg={9}>
                <TipsPanel />
            </Col>
        </Row>
        </>
    );
};

export default EditRFQ;
