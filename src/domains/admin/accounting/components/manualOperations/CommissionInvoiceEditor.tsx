import { useEffect, useState } from 'react';

import { Button, Card, Col, Flex, Form, Row, Select, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import {
    CommissionInvoice,
    CommissionInvoiceBilledTo,
    CommissionInvoicePlacement,
    CommissionInvoiceState,
} from '../../types/commissionInvoice';
import { formatInr } from '../../utils/commission';

export const NO_PERMISSION_TEXT = 'Sorry, you do not have permission to perform this action';

export const MAX_RECIPIENTS = 5;

const PREVIEW_DELAY_MS = 300;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const billedToSchema = Yup.object({
    companyName: Yup.string()
        .trim()
        .max(120, 'Company name can be at most 120 characters')
        .required('Company name is required'),
    address: Yup.string().trim().max(300, 'Address can be at most 300 characters'),
    state: Yup.string().trim().max(120, 'State can be at most 120 characters'),
    gstin: Yup.string().trim().max(20, 'GSTIN can be at most 20 characters'),
});

const sameBilledTo = (a: CommissionInvoiceBilledTo, b: CommissionInvoiceBilledTo) =>
    a.companyName === b.companyName &&
    a.address === b.address &&
    a.state === b.state &&
    a.gstin === b.gstin;

const trimmed = (values: CommissionInvoiceBilledTo): CommissionInvoiceBilledTo => ({
    companyName: (values.companyName || '').trim(),
    address: (values.address || '').trim(),
    state: (values.state || '').trim(),
    gstin: (values.gstin || '').trim(),
});

export const stateOptions = (states: CommissionInvoiceState[], current: string[]) => {
    const options = states.map(state => ({
        value: state.name,
        label: `${state.name} (${state.code})`,
    }));
    const known = new Set(states.map(state => state.name));
    current
        .filter((value, index) => value && !known.has(value) && current.indexOf(value) === index)
        .forEach(value => options.unshift({ value, label: `${value} (as generated)` }));
    return options;
};

export const taxLabelOf = (placement: CommissionInvoicePlacement) =>
    placement.taxLines.length
        ? placement.taxLines.map(line => line.label).join(' + ')
        : (placement.taxCase || '—').split('+').join(' + ');

export const invalidRecipients = (recipients: string[]) =>
    recipients.filter(email => !EMAIL_PATTERN.test(email.trim()));

const sendHintOf = (canUpdate: boolean, recipients: string[], badRecipients: string[]) => {
    if (!canUpdate) return NO_PERMISSION_TEXT;
    if (!recipients.length) return 'Add at least one email address';
    if (badRecipients.length) return `Not an email address: ${badRecipients.join(', ')}`;
    if (recipients.length > MAX_RECIPIENTS) return `At most ${MAX_RECIPIENTS} addresses at a time`;
    return '';
};

const formatMoment = (value: string | null | undefined) =>
    value ? dayjs(value).format('DD MMM YYYY HH:mm') : '';

// Re-renders the preview a moment after the accountant stops typing, with what the invoice
// would read if these values were saved.
const DraftWatcher = ({
    saved,
    onDraft,
}: {
    saved: CommissionInvoiceBilledTo;
    onDraft: (draft: CommissionInvoiceBilledTo | null) => void;
}) => {
    const { values } = useFormikContext<CommissionInvoiceBilledTo>();

    useEffect(() => {
        const draft = trimmed(values);
        if (sameBilledTo(draft, saved)) {
            onDraft(null);
            return undefined;
        }
        const timer = setTimeout(() => onDraft(draft), PREVIEW_DELAY_MS);
        return () => clearTimeout(timer);
    }, [values, saved, onDraft]);

    return null;
};

type CommissionInvoiceEditorProps = {
    invoice: CommissionInvoice;
    previewHtml: string;
    placement: CommissionInvoicePlacement;
    canUpdate: boolean;
    isSaving: boolean;
    isSending: boolean;
    onDraft: (draft: CommissionInvoiceBilledTo | null) => void;
    onSave: (billedTo: CommissionInvoiceBilledTo) => void;
    onSend: (to: string[]) => void;
};

const CommissionInvoiceEditor = ({
    invoice,
    previewHtml,
    placement,
    canUpdate,
    isSaving,
    isSending,
    onDraft,
    onSave,
    onSend,
}: CommissionInvoiceEditorProps) => {
    const [recipients, setRecipients] = useState<string[]>(invoice.vendor.emails);

    useEffect(() => {
        setRecipients(invoice.vendor.emails);
    }, [invoice.id, invoice.source, invoice.vendor.emails]);

    const badRecipients = invalidRecipients(recipients);
    const sendHint = sendHintOf(canUpdate, recipients, badRecipients);
    const states = stateOptions(invoice.states, [
        invoice.billedTo.state,
        invoice.originalBilledTo.state,
    ]);

    return (
        <Row gutter={[20, 20]}>
            <Col xs={24} xl={14}>
                <Card
                    className="rounded-xl border border-borderCard shadow-none"
                    title={`${invoice.documentTitle} ${invoice.invoiceNumber}`}
                    extra={
                        <Typography.Text className="text-[13px] text-textBody">
                            {invoice.vendor.name}
                            {invoice.issuedDate
                                ? ` · ${dayjs(invoice.issuedDate).format('DD MMM YYYY')}`
                                : ''}
                            {` · ${formatInr(invoice.total)}`}
                        </Typography.Text>
                    }
                >
                    <iframe
                        title="Invoice preview"
                        srcDoc={previewHtml}
                        sandbox=""
                        className="h-[900px] w-full rounded-lg border border-borderCard bg-white"
                    />
                </Card>
            </Col>
            <Col xs={24} xl={10}>
                <Flex vertical gap={20}>
                    <Card
                        className="rounded-xl border border-borderCard shadow-none"
                        title="Billed to"
                    >
                        <Formik
                            initialValues={invoice.billedTo}
                            validationSchema={billedToSchema}
                            enableReinitialize
                            onSubmit={values => onSave(trimmed(values))}
                        >
                            {formik => (
                                <Form layout="vertical" onFinish={() => formik.handleSubmit()}>
                                    <DraftWatcher saved={invoice.billedTo} onDraft={onDraft} />
                                    <TextInput
                                        name="companyName"
                                        label="Company name"
                                        placeholder="Vendor’s registered name"
                                        type="text"
                                        maxLength={120}
                                        isRequired
                                    />
                                    <TextAreaInput
                                        name="address"
                                        label="Address"
                                        placeholder="Street, building, area"
                                        maxLength={300}
                                    />
                                    <SelectInput
                                        name="state"
                                        label="State"
                                        placeholder="Select state"
                                        options={states}
                                        showSearch
                                        allowClear
                                        optionFilterProp="children"
                                    />
                                    <TextInput
                                        name="gstin"
                                        label="GSTIN"
                                        placeholder="15 characters, optional"
                                        type="text"
                                        maxLength={20}
                                    />
                                    <Typography.Paragraph className="!mb-1 text-[13px] font-medium text-textHeadings">
                                        {`Place of supply: ${placement.placeOfSupply || '—'} · Tax: ${taxLabelOf(placement)}`}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph className="!mb-3 text-[13px] text-textBody">
                                        The GSTIN’s state sets the place of supply when one is
                                        given, else the state picked above. Across the state line
                                        the tax is IGST; inside it, CGST and SGST. The tax amount
                                        itself does not change.
                                    </Typography.Paragraph>
                                    {invoice.edited && (
                                        <Typography.Paragraph className="!mb-3 text-[13px] text-textBody">
                                            Last changed
                                            {invoice.edited.byName
                                                ? ` by ${invoice.edited.byName}`
                                                : ''}
                                            {invoice.edited.at
                                                ? ` on ${formatMoment(invoice.edited.at)}`
                                                : ''}
                                            . The invoice was generated billed to{' '}
                                            {invoice.originalBilledTo.companyName || '—'}
                                            {invoice.originalBilledTo.address
                                                ? `, ${invoice.originalBilledTo.address}`
                                                : ''}
                                            {invoice.originalBilledTo.state
                                                ? `, ${invoice.originalBilledTo.state}`
                                                : ''}
                                            .
                                        </Typography.Paragraph>
                                    )}
                                    <Flex gap={8} wrap="wrap">
                                        <Tooltip title={canUpdate ? '' : NO_PERMISSION_TEXT}>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={isSaving}
                                                disabled={
                                                    !canUpdate ||
                                                    sameBilledTo(
                                                        trimmed(formik.values),
                                                        invoice.billedTo
                                                    )
                                                }
                                            >
                                                Save changes
                                            </Button>
                                        </Tooltip>
                                        <Button
                                            disabled={sameBilledTo(
                                                trimmed(formik.values),
                                                invoice.originalBilledTo
                                            )}
                                            onClick={() =>
                                                formik.setValues(invoice.originalBilledTo)
                                            }
                                        >
                                            Reset to original
                                        </Button>
                                    </Flex>
                                </Form>
                            )}
                        </Formik>
                    </Card>
                    <Card
                        className="rounded-xl border border-borderCard shadow-none"
                        title="Send to vendor"
                    >
                        <Typography.Paragraph className="!mb-3 text-[13px] text-textBody">
                            The invoice is sent as it is saved above, as a PDF, from Peko’s support
                            address. The vendor’s email on file is filled in; change it or add more.
                        </Typography.Paragraph>
                        <Select
                            mode="tags"
                            className="w-full"
                            placeholder="Email addresses"
                            aria-label="Recipients"
                            value={recipients}
                            onChange={value => setRecipients(value as string[])}
                            tokenSeparators={[',', ' ', ';']}
                            open={false}
                            disabled={!canUpdate}
                        />
                        <Flex gap={8} align="center" className="mt-3" wrap="wrap">
                            <Tooltip title={sendHint}>
                                <Button
                                    type="primary"
                                    loading={isSending}
                                    disabled={Boolean(sendHint)}
                                    onClick={() => onSend(recipients.map(email => email.trim()))}
                                >
                                    Send invoice
                                </Button>
                            </Tooltip>
                            {sendHint && canUpdate && (
                                <Typography.Text className="text-[13px] text-red-600">
                                    {sendHint}
                                </Typography.Text>
                            )}
                        </Flex>
                        {invoice.sends.length > 0 && (
                            <Flex vertical gap={4} className="mt-4">
                                <Typography.Text className="text-[13px] font-medium text-textHeadings">
                                    Sent before
                                </Typography.Text>
                                {invoice.sends.slice(0, 5).map(send => (
                                    <Typography.Text
                                        key={`${send.at}:${send.to.join(',')}`}
                                        className="text-[13px] text-textBody"
                                    >
                                        {send.to.join(', ')} on {formatMoment(send.at)}
                                        {send.byName ? ` by ${send.byName}` : ''}
                                    </Typography.Text>
                                ))}
                            </Flex>
                        )}
                    </Card>
                </Flex>
            </Col>
        </Row>
    );
};

export default CommissionInvoiceEditor;
