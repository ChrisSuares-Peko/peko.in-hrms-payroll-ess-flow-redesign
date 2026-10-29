import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, Col, Flex, Form, Modal, Row, Typography } from 'antd';
import { Formik, setNestedObjectValues, useFormikContext } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BasicInformation from './BasicInformation';
import LineItems, { LineItem } from './LineItems';
import SelectVendors from './SelectVendors';
import TermsAndNotes from './TermsAndNotes';
import TipsPanel from './TipsPanel';
import { useRFQ } from '../../../hooks/useRFQ';
import { useVendor } from '../../../hooks/useVendor';
import { newRFQSchema } from '../../../schema';
import { resetRFQDraft, setRFQDraft } from '../../../slices/rfqDraftSlice';
import { CreateRFQPayload, PurchaseRequestDetail, Vendor } from '../../../types';

const { Title, Text } = Typography;

const VENDOR_FILTERS = { page: 1, limit: 100 };

// Auto-saves form values to Redux with 800ms debounce — excludes attachments (base64 too large)
const AutoSaveDraft: React.FC<{ submittedRef: React.MutableRefObject<boolean> }> = ({ submittedRef }) => {
    const { values } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const valuesRef = useRef(values);
    valuesRef.current = values;

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const rest = (({ prAttachments: _, ...r }) => r)(valuesRef.current);
            dispatch(setRFQDraft(rest));
        }, 800);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            // Skip unmount save if the form was submitted — prevents overwriting the reset.
            // Must read submittedRef.current here (not snapshot it earlier) since submission
            // can happen after this effect last ran but before this cleanup fires on unmount.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (submittedRef.current) return;
            const rest = (({ prAttachments: _, ...r }) => r)(valuesRef.current);
            dispatch(setRFQDraft(rest));
        };
    }, [values, dispatch, submittedRef]);

    return null;
};

const NewRFQ: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const fromPR = location.state?.fromPR as PurchaseRequestDetail | undefined;

    const savedDraft = useAppSelector(state => state.reducer.rfqDraft);
    const hasDraft = !!(
        savedDraft?.title ||
        savedDraft?.deadline ||
        savedDraft?.lineItems?.some((i: any) => i.description)
    );

    const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const submittedRef = useRef(false);

    const { create, saveDraft, isSubmitting, vendorEmailError, clearVendorEmailError } = useRFQ();
    const { vendors, fetchVendors } = useVendor(undefined, VENDOR_FILTERS);

    // Restore selected vendor objects from saved draft IDs once vendor list loads
    // Skip when coming from a PR — draft vendors shouldn't bleed into a fresh PR-to-RFQ conversion
    useEffect(() => {
        if (fromPR || !hasDraft || !vendors.length || !savedDraft.invitedVendors?.length) return;
        const restored = vendors.filter(v => savedDraft.invitedVendors.includes(v.id));
        if (restored.length) setSelectedVendors(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vendors]);

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}`);

    const notes = fromPR?.notes ?? '';

    // Computed once on mount — empty deps prevent enableReinitialize from
    // resetting the form on every re-render when state like prAttachments changes
    const initialValues = useMemo(() => {
        const baseInitial = {
            title: fromPR?.title ?? '',
            prRef: fromPR ? String(fromPR.id) : '',
            deadline: fromPR?.neededBy ? fromPR.neededBy.split('T')[0] : '',
            terms: '',
            notes,
            attachments: [] as { fileName: string; fileBase64: string; fileFormat: string }[],
            prAttachments: (fromPR?.attachments?.map(a => ({ fileName: a.fileName, url: a.url })) ?? []) as { fileName: string; url: string }[],
            lineItems: (fromPR?.lineItems?.length
                ? fromPR.lineItems.map((li, i) => ({
                    key: String(i + 1),
                    description: li.itemName,
                    qty: li.qty,
                    unit: li.unit || 'Unit',
                    price: li.estUnitCost ?? '',
                }))
                : [{ key: '1', description: '', qty: 1, unit: 'Unit', price: '' }]) as LineItem[],
            invitedVendors: [] as number[],
            invitedEmails: [] as string[],
        };
        if (!fromPR && hasDraft) {
            return {
                ...baseInitial,
                ...savedDraft,
                attachments: (savedDraft.attachments ?? []) as { fileName: string; fileBase64: string; fileFormat: string }[],
                lineItems: savedDraft.lineItems?.length ? savedDraft.lineItems as LineItem[] : baseInitial.lineItems,
            };
        }
        return baseInitial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — compute once on mount

    const buildPayload = (values: typeof initialValues, send: boolean): CreateRFQPayload => ({
        title: values.title,
        type: 'RFQ',
        submissionDeadline: values.deadline ? `${values.deadline}T23:59:59.000Z` : values.deadline,
        termsAndConditions: values.terms || undefined,
        buyerNotes: values.notes || undefined,
        purchaseRequestId: values.prRef ? Number(values.prRef) : null,
        invitedVendors: selectedVendors.map(v => v.id),
        invitedEmails: values.invitedEmails?.length ? values.invitedEmails : undefined,
        invitedEmailsCategory: values.invitedEmails?.length && fromPR?.category ? fromPR.category : undefined,
        attachments: values.attachments.length ? values.attachments : undefined,
        prAttachments: values.prAttachments,
        send,
        lineItems: values.lineItems.map((item, index) => ({
            description: item.description,
            qty: Number(item.qty),
            unit: item.unit,
            estUnitCost: Number(item.price),
            sortOrder: index + 1,
        })),
    });

    const onSubmit = async (values: typeof initialValues) => {
        const result = await create(buildPayload(values, true));
        if (result) {
            submittedRef.current = true;
            dispatch(resetRFQDraft());
            handleCancel();
        }
    };

    const onSaveAsDraft = async (values: typeof initialValues) => {
        setIsSavingDraft(true);
        // Calls the dedicated /draft endpoint — no required-field validation on BE or FE
        const result = await saveDraft({
            title: values.title || undefined,
            type: 'RFQ',
            submissionDeadline: values.deadline ? `${values.deadline}T23:59:59.000Z` : undefined,
            termsAndConditions: values.terms || undefined,
            buyerNotes: values.notes || undefined,
            purchaseRequestId: values.prRef ? Number(values.prRef) : null,
            invitedVendors: selectedVendors.map(v => v.id),
            invitedEmails: values.invitedEmails?.length ? values.invitedEmails : undefined,
            invitedEmailsCategory: values.invitedEmails?.length && fromPR?.category ? fromPR.category : undefined,
            attachments: values.attachments.length ? values.attachments : undefined,
            prAttachments: values.prAttachments,
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
            submittedRef.current = true;
            dispatch(resetRFQDraft());
            handleCancel();
        }
    };

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
                <Card bordered={false} className="rounded-3xl" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 32 } }}>
                    <Title level={4} className="text-center" style={{ marginBottom: 4 }}>New Request for Quotation</Title>
                    <div style={{ marginBottom: 20 }} className="text-center">
                        <Text className="text-[#000000] text-xs">
                            Send a quotation request to one or more vendors
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
                                const next = [...values.lineItems, { key: String(Date.now()), description: '', qty: '', unit: 'Unit', price: '' }];
                                setFieldValue('lineItems', next);
                            };

                            const removeItem = (key: string) => {
                                const next = values.lineItems.filter(i => i.key !== key);
                                setFieldValue('lineItems', next);
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
                                    <AutoSaveDraft submittedRef={submittedRef} />
                                    <BasicInformation />
                                    <LineItems addItem={addItem} removeItem={removeItem} />
                                    <SelectVendors
                                        vendorOptions={vendors.filter(v => v.status === 'Active')}
                                        selectedVendors={selectedVendors}
                                        setSelectedVendors={setSelectedVendors}
                                        refetchVendors={fetchVendors}
                                    />
                                    <TermsAndNotes />

                                    <Flex gap={12}>
                                        <Button type="primary" danger htmlType="submit" loading={isSubmitting} disabled={isSavingDraft}>
                                            Create and Send
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

export default NewRFQ;
