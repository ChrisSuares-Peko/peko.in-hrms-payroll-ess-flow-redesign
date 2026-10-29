import { useMemo, useState } from 'react';

import { Button, Checkbox, Form, Modal, Spin, Typography } from 'antd';
import { Formik } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useAdminCardsApi } from '../../hooks/admin/useAdminCardsApi';
import { useBulkCardStateApi } from '../../hooks/admin/useBulkCardStateApi';
import {
    BULK_FREEZE_CONFIRM_WORD,
    bulkFreezeSchema,
    BulkFreezeValues,
} from '../../schema/bulkFreezeSchema';
import {
    FREEZE_REASON_NOTE_MAX,
    FREEZE_REASON_OPTIONS,
    FREEZE_REASON_OTHERS,
    sanitizeReasonNote,
} from '../../utils/cardsData';
import { MODAL_CLOSE_ICON, PineLabsFooter, ROUNDED_MODAL_CLASSNAMES } from '../common/modalProps';

const { Title, Text } = Typography;

export type BulkCardMode = 'freeze' | 'unfreeze';

interface BulkCardActionModalProps {
    open: boolean;
    mode: BulkCardMode;
    onClose: () => void;
    onSuccess?: () => void;
}

const COPY: Record<
    BulkCardMode,
    { title: string; description: string; cta: string; empty: string }
> = {
    freeze: {
        title: 'Bulk freeze cards',
        description:
            'Choose which active cards to freeze. New transactions will be declined until they are unfrozen.',
        cta: 'Freeze cards',
        empty: 'No active cards to freeze.',
    },
    unfreeze: {
        title: 'Bulk unfreeze cards',
        description:
            'Choose which frozen cards to reactivate. They will resume accepting transactions immediately.',
        cta: 'Unfreeze cards',
        empty: 'No frozen cards to unfreeze.',
    },
};

const MAX_BULK = 100;
const TIGHT_FIELD = '!mb-0';

/**
 * Inner body. Mounted only while the modal is open (antd lazy-mounts + `destroyOnHidden` unmounts on close),
 * so the eligible-card fetch runs once per open and all local state resets on close without manual cleanup.
 */
const BulkCardActionContent = ({
    mode,
    onClose,
    onSuccess,
}: Omit<BulkCardActionModalProps, 'open'>) => {
    const dispatch = useAppDispatch();
    const { submitBulkCardState, isLoading: submitting } = useBulkCardStateApi();
    const { cards, total, isLoading } = useAdminCardsApi(
        1,
        MAX_BULK,
        undefined,
        undefined,
        mode === 'freeze' ? 'Active' : 'Frozen'
    );

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [step, setStep] = useState<'select' | 'confirm'>('select');

    const copy = COPY[mode];

    /**
     * A card with a termination request against it is frozen, but it cannot be unfrozen — the server
     * refuses it with a 409 and the card stays frozen. Listing it would only let an admin select a card
     * that is guaranteed to come back in the "could not be updated" count.
     *
     * Matches the server's rule rather than the narrower one: `hasBlockingTermination` locks a card whose
     * termination is in progress OR already completed, so any terminationStatus at all disqualifies it.
     * Freezing is unaffected — those cards are already frozen and never appear in the freeze list.
     */
    const eligible = useMemo(
        () => (mode === 'freeze' ? cards : cards.filter(card => !card.terminationStatus)),
        [cards, mode]
    );
    const keys = useMemo(() => eligible.map(card => card.key), [eligible]);
    const lockedCount = cards.length - eligible.length;
    const allChecked = selected.size === keys.length && keys.length > 0;
    const indeterminate = selected.size > 0 && selected.size < keys.length;

    const toggleAll = (checked: boolean) => setSelected(checked ? new Set(keys) : new Set());
    const toggleOne = (key: string) =>
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const runBulk = async (values?: BulkFreezeValues) => {
        const note = values?.note?.trim();
        const res = await submitBulkCardState({
            action: mode,
            cardIds: [...selected],
            ...(mode === 'freeze'
                ? { reason: values?.reason, ...(note ? { reasonNote: note } : {}) }
                : {}),
        });
        if (!res) return; // failure already surfaced by the response interceptor
        const { summary } = res.data;
        dispatch(
            showToast({
                variant: 'success',
                description: `${summary.succeeded} Card(s) ${mode === 'freeze' ? 'frozen' : 'unfrozen'} successfully`,
            })
        );
        if (summary.failed > 0) {
            dispatch(
                showToast({
                    variant: 'warning',
                    description: `${summary.failed} card${
                        summary.failed === 1 ? '' : 's'
                    } could not be updated. Please try again.`,
                })
            );
        }
        onSuccess?.();
        onClose();
    };

    const renderCardList = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Spin />
                </div>
            );
        }
        if (keys.length === 0) {
            return (
                <div className="px-4 py-10 text-center text-sm text-textGreyLight">
                    {copy.empty}
                </div>
            );
        }
        return (
            <>
                <div className="flex items-center justify-between gap-3 border-b border-borderDivider px-4 py-3">
                    <Checkbox
                        checked={allChecked}
                        indeterminate={indeterminate}
                        onChange={event => toggleAll(event.target.checked)}
                    >
                        <span className="text-sm font-medium text-textHeadings">Select all</span>
                    </Checkbox>
                    <span className="text-sm text-textGreyLight">({keys.length})</span>
                </div>
                <ul className="flex max-h-64 flex-col overflow-y-auto">
                    {eligible.map(card => (
                        <li
                            key={card.key}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                            <Checkbox
                                checked={selected.has(card.key)}
                                onChange={() => toggleOne(card.key)}
                            >
                                <span className="text-sm text-textHeadings">
                                    {[`•• ${card.last4}`, card.nameOnCard, card.holder]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </span>
                            </Checkbox>
                            <span className="text-xs text-textGreyLight">{card.type}</span>
                        </li>
                    ))}
                </ul>
            </>
        );
    };

    if (step === 'confirm') {
        return (
            <Formik<BulkFreezeValues>
                initialValues={{ confirm: '', reason: undefined, note: '' }}
                validationSchema={bulkFreezeSchema}
                validateOnMount
                onSubmit={runBulk}
            >
                {({ submitForm, isValid, values, setFieldValue }) => (
                    <Form layout="vertical" className="flex flex-col gap-5" onFinish={submitForm}>
                        <div className="flex flex-col gap-2">
                            <Title level={4} className="!mb-0 !text-textHeadings">
                                Confirm freeze
                            </Title>
                            <Text className="text-sm text-textBody">
                                You are about to freeze {selected.size} card
                                {selected.size === 1 ? '' : 's'}. Type {BULK_FREEZE_CONFIRM_WORD}{' '}
                                below to confirm.
                            </Text>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Text className="text-sm text-textBody">
                                Type{' '}
                                <span className="font-semibold text-textHeadings">
                                    {BULK_FREEZE_CONFIRM_WORD}
                                </span>{' '}
                                to confirm
                            </Text>
                            <TextInput
                                name="confirm"
                                type="text"
                                placeholder="Type"
                                formItemClass={TIGHT_FIELD}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Text className="text-sm text-textBody">
                                Select Reason
                                <span className="ml-0.5 text-errorTextRed">*</span>
                            </Text>
                            <SelectInput
                                name="reason"
                                placeholder="Select Reason"
                                options={FREEZE_REASON_OPTIONS}
                                formItemClass={TIGHT_FIELD}
                                handleChange={value => {
                                    if (Number(value) !== FREEZE_REASON_OTHERS)
                                        setFieldValue('note', '', false);
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Text className="text-sm text-textBody">
                                {values.reason === FREEZE_REASON_OTHERS ? (
                                    <>
                                        Enter Reason
                                        <span className="ml-0.5 text-errorTextRed">*</span>
                                    </>
                                ) : (
                                    'Enter Reason (optional)'
                                )}
                            </Text>
                            <InputTextArea
                                name="note"
                                placeholder="Enter"
                                autoSize={{ minRows: 3 }}
                                maxLength={FREEZE_REASON_NOTE_MAX}
                                transform={sanitizeReasonNote}
                                formItemClass={TIGHT_FIELD}
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    danger
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="font-medium"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    disabled={!isValid}
                                    loading={submitting}
                                    onClick={submitForm}
                                    className="font-medium"
                                >
                                    {copy.cta}
                                </Button>
                            </div>
                            <PineLabsFooter />
                        </div>
                    </Form>
                )}
            </Formik>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <Title level={4} className="!mb-0 !text-textHeadings">
                    {copy.title}
                </Title>
                <Text className="text-sm text-textBody">{copy.description}</Text>
                {total > MAX_BULK && (
                    <Text className="text-xs text-textOrange">
                        Showing the first {eligible.length} of {total} cards. Process the rest in a
                        later batch.
                    </Text>
                )}
                {/* Never drop rows silently — the Cards table shows these as frozen, so their absence
                    here needs saying, or it reads as cards having gone missing. */}
                {lockedCount > 0 && (
                    <Text className="text-xs text-textGreyLight">
                        {lockedCount} frozen card{lockedCount === 1 ? '' : 's'} awaiting termination{' '}
                        {lockedCount === 1 ? 'is' : 'are'} not listed — a card cannot be unfrozen
                        once termination is requested.
                    </Text>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-borderCard">
                {renderCardList()}
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button danger onClick={onClose} className="font-medium">
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        disabled={selected.size === 0}
                        loading={mode === 'unfreeze' && submitting}
                        onClick={() => (mode === 'freeze' ? setStep('confirm') : runBulk())}
                        className="font-medium"
                    >
                        {copy.cta}
                    </Button>
                </div>
                <PineLabsFooter />
            </div>
        </div>
    );
};

/** Bulk freeze / unfreeze cards modal. Freeze adds a reason + "type FREEZE to confirm" step. */
const BulkCardActionModal = ({ open, mode, onClose, onSuccess }: BulkCardActionModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={480}
        destroyOnHidden
        classNames={ROUNDED_MODAL_CLASSNAMES}
        closeIcon={MODAL_CLOSE_ICON}
    >
        <BulkCardActionContent mode={mode} onClose={onClose} onSuccess={onSuccess} />
    </Modal>
);

export default BulkCardActionModal;
