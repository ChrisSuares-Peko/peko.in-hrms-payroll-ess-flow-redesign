import { useState } from 'react';

import { WarningOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Modal, Segmented, Switch, Tooltip, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import snowflakeIcon from '../../assets/icons/snowflake.svg';
import { useMerchantCategoriesApi } from '../../hooks/admin/useMerchantCategoriesApi';
import { useTerminateCardApi } from '../../hooks/admin/useTerminateCardApi';
import { useUpdateCardSettingsApi } from '../../hooks/admin/useUpdateCardSettingsApi';
import { useCardStatusApi } from '../../hooks/user/useCardStatusApi';
import {
    composeTerminateReason,
    FREEZE_REASON_NOTE_MAX,
    FREEZE_REASON_OPTIONS,
    FREEZE_REASON_OTHERS,
    freezeReasonSummary,
    reasonNoteSchema,
    sanitizeReasonNote,
    TERMINATE_REASON_NOTE_MAX,
    TERMINATE_REASON_OPTIONS,
    TERMINATE_REASON_OTHERS,
} from '../../utils/cardsData';
import { formatRupeesDecimal } from '../../utils/helpers';
import { FREQUENCY_OPTIONS, restrictedCategoryNames } from '../../utils/issueCardData';
import { CardData, CardRecord } from '../../utils/types';
import { MODAL_CLOSE_ICON, PineLabsFooter, ROUNDED_MODAL_CLASSNAMES } from '../common/modalProps';

type ManageableCard = CardData | CardRecord;

const { Text, Title } = Typography;

type Tab = 'Status' | 'Limits & controls' | 'Lifecycle';
const TABS: Tab[] = ['Status', 'Limits & controls', 'Lifecycle'];

const MAX_CARD_LIMIT_DIGITS = 10;

const TERMINATE_CONFIRM_WORD = 'TERMINATE';

const MANAGE_MODAL_CLASSNAMES = {
    ...ROUNDED_MODAL_CLASSNAMES,
    content: `${ROUNDED_MODAL_CLASSNAMES.content} max-sm:!p-4`,
};

const TAB_BODY_CLASSNAME = '-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1';

const TIGHT_FIELD = '!mb-0';

const cardBalanceDisplay = (c: ManageableCard) =>
    'remaining' in c ? formatRupeesDecimal(c.remaining) : (c.balance ?? formatRupeesDecimal(0));

/* ------------------------------------------------------------------ *
 * Schemas — one per form island. The submit button of each is gated on
 * its own schema, so no component-level "is this valid" flags survive.
 * ------------------------------------------------------------------ */

interface FreezeValues {
    reason?: number;
    note: string;
}

const freezeSchema = Yup.object({
    reason: Yup.number().required('Please select a reason to freeze the card.'),
    note: reasonNoteSchema(FREEZE_REASON_NOTE_MAX).when('reason', {
        is: FREEZE_REASON_OTHERS,
        then: schema => schema.required('Please enter the reason to freeze the card.'),
    }),
});

interface TerminateValues {
    reason?: string;
    note: string;
    confirm: string;
}

const terminateSchema = Yup.object({
    reason: Yup.string().required('Please select a termination reason.'),
    note: reasonNoteSchema(TERMINATE_REASON_NOTE_MAX),
    confirm: Yup.string()
        .trim()
        .oneOf([TERMINATE_CONFIRM_WORD], `Type ${TERMINATE_CONFIRM_WORD} to confirm.`)
        .required(`Type ${TERMINATE_CONFIRM_WORD} to confirm.`),
});

interface LimitsValues {
    cardLimit: string;
    frequency?: string;
    perTxnLimit: string;
    restrictedCategories: string[];
    atmEnabled: boolean;
}

const positiveAmount = (label: string) =>
    Yup.string().test('positive', `${label} must be greater than 0.`, value => Number(value) > 0);

const limitsSchema = Yup.object({
    cardLimit: positiveAmount('Card limit').required('Card limit is required.'),
    frequency: Yup.string().required('Frequency is required.'),
    perTxnLimit: Yup.string().test(
        'positive-if-set',
        'Per-transaction limit must be greater than 0.',
        value => !value || Number(value) > 0
    ),
});

interface ManageCardModalProps {
    card: ManageableCard | null;
    onClose: () => void;
    onRequestPhysical?: () => void;
    onSuccess?: () => void;
}

type ManageCardContentProps = Omit<ManageCardModalProps, 'card'> & { card: ManageableCard };

/**
 * Modal body. Mounted only while a card is selected (see the `card &&` guard plus `destroyOnHidden`), so
 * every field seeds itself from that card on mount and closing the modal discards the state — no prefill
 * effect and no manual reset to keep in step with the field list.
 */
const ManageCardContent = ({
    card,
    onClose,
    onRequestPhysical,
    onSuccess,
}: ManageCardContentProps) => {
    const dispatch = useAppDispatch();
    const { submitSettings, isLoading: settingsLoading } = useUpdateCardSettingsApi();
    const { submitCardStatus, isLoading: statusLoading } = useCardStatusApi();
    const { submitTerminate, isLoading: terminateLoading } = useTerminateCardApi();
    const { categories: merchantCategories } = useMerchantCategoriesApi();

    const [tab, setTab] = useState<Tab>('Status');

    const isCardRecord = 'perTxnLimit' in card;
    const isPhysical = isCardRecord && (card as CardRecord).type === 'Physical';
    const limitCard = isCardRecord ? (card as CardRecord) : null;
    const terminationStatus = 'terminationStatus' in card ? card.terminationStatus : null;

    const [frozen, setFrozen] = useState('status' in card && card.status === 'Frozen');
    const [terminated, setTerminated] = useState(
        terminationStatus === 'REQUESTED' || terminationStatus === 'COMPLETED'
    );
    const [isFullyTerminated] = useState(terminationStatus === 'COMPLETED');

    const frozenReason = limitCard ? freezeReasonSummary(limitCard) : null;

    const canConvertToPhysical = !isPhysical && !frozen && !terminated;
    const visibleTabs = canConvertToPhysical ? TABS : TABS.filter(t => t !== 'Lifecycle');
    const activeTab = visibleTabs.includes(tab) ? tab : 'Status';

    const toast = (description: string) => dispatch(showToast({ variant: 'success', description }));

    const applyCardState = async (freeze: boolean, values?: FreezeValues) => {
        const res = await submitCardStatus(
            card.key,
            freeze ? 'freeze' : 'unfreeze',
            freeze ? values?.reason : undefined,
            freeze && values?.reason === FREEZE_REASON_OTHERS ? values.note.trim() : undefined
        );
        if (res) {
            setFrozen(freeze);
            toast(`Card ••${card.last4} ${freeze ? 'frozen' : 'unfrozen'} successfully`);
            onSuccess?.();
        } else {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not update card status. Please try again.',
                })
            );
        }
    };

    const renderFreezeSection = () => (
        <Formik<FreezeValues>
            initialValues={{ reason: undefined, note: '' }}
            validationSchema={freezeSchema}
            onSubmit={values => applyCardState(true, values)}
        >
            {({ values, setFieldValue, submitForm }) => (
                <Form
                    layout="vertical"
                    onFinish={submitForm}
                    className="flex flex-col gap-3 rounded-2xl border border-borderCard p-4"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src={snowflakeIcon} alt="" className="h-5 w-5" />
                            <div className="flex flex-col gap-0.5">
                                <Text className="text-sm font-semibold text-textHeadings">
                                    Freeze card
                                </Text>
                                <Text className="text-xs text-textBody">
                                    Temporarily block all transactions. You can unfreeze any time.
                                </Text>
                            </div>
                        </div>
                        <Tooltip
                            title={
                                !frozen && !values.reason
                                    ? 'Select a freeze reason to enable card freezing.'
                                    : undefined
                            }
                        >
                            <Switch
                                checked={frozen}
                                loading={statusLoading}
                                disabled={
                                    !isCardRecord ||
                                    terminated ||
                                    (!frozen &&
                                        (!values.reason ||
                                            (values.reason === FREEZE_REASON_OTHERS &&
                                                values.note.trim() === '')))
                                }
                                onChange={next => (next ? submitForm() : applyCardState(false))}
                            />
                        </Tooltip>
                    </div>
                    {frozen && frozenReason && (
                        <div className="rounded-xl bg-bgLightGray px-3 py-2">
                            <Text className="text-xs text-textBody">{frozenReason}</Text>
                        </div>
                    )}
                    {isCardRecord && !terminated && !frozen && (
                        <div className="flex flex-col gap-1.5">
                            <Text className="text-xs text-textBody">
                                Select a reason to freeze this card
                                <span className="ml-0.5 text-errorTextRed">*</span>
                            </Text>
                            <SelectInput
                                name="reason"
                                placeholder="Select reason"
                                options={FREEZE_REASON_OPTIONS}
                                formItemClass={TIGHT_FIELD}
                                handleChange={value => {
                                    if (Number(value) !== FREEZE_REASON_OTHERS)
                                        setFieldValue('note', '', false);
                                }}
                            />
                        </div>
                    )}
                    {isCardRecord &&
                        !terminated &&
                        !frozen &&
                        values.reason === FREEZE_REASON_OTHERS && (
                            <div className="flex flex-col gap-1.5">
                                <Text className="text-xs text-textBody">
                                    Enter Reason
                                    <span className="ml-0.5 text-errorTextRed">*</span>
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
                        )}
                </Form>
            )}
        </Formik>
    );

    const renderTerminateSection = () => {
        if (isFullyTerminated) {
            return (
                <div className="flex flex-col gap-2 rounded-2xl border border-errorTextRed/30 bg-bgLightPink p-4">
                    <div className="flex items-center gap-2">
                        <WarningOutlined className="text-errorTextRed" />
                        <Text className="text-sm font-semibold text-errorTextRed">
                            Card permanently terminated
                        </Text>
                    </div>
                    <Text className="text-sm text-errorTextRed">
                        This card has been permanently terminated and cannot be reactivated, frozen,
                        or unfrozen.
                    </Text>
                </div>
            );
        }

        if (terminated) {
            return (
                <div className="flex flex-col gap-2 rounded-2xl border border-errorTextRed/30 bg-bgLightPink p-4">
                    <div className="flex items-center gap-2">
                        <WarningOutlined className="text-errorTextRed" />
                        <Text className="text-sm font-semibold text-errorTextRed">
                            Card termination request submitted
                        </Text>
                    </div>
                    <Text className="text-sm text-errorTextRed">
                        Your card termination request has been received. Your card will remain{' '}
                        <span className="font-semibold">frozen</span> while we process your request
                        and cannot be reactivated during this time. Once the request is completed,
                        the card will be permanently terminated.
                    </Text>
                </div>
            );
        }

        return (
            <Formik<TerminateValues>
                initialValues={{ reason: undefined, note: '', confirm: '' }}
                validationSchema={terminateSchema}
                validateOnMount
                onSubmit={async values => {
                    const res = await submitTerminate(
                        Number(card.key),
                        composeTerminateReason(values.reason!, values.note)
                    );
                    if (res) {
                        setTerminated(true);
                        setFrozen(true);
                        toast('Card termination request submitted.');
                        onSuccess?.();
                    }
                }}
            >
                {({ values, setFieldValue, isValid, submitForm }) => (
                    <Form
                        layout="vertical"
                        onFinish={submitForm}
                        className="flex flex-col gap-3 rounded-2xl border border-errorTextRed/30 p-4"
                    >
                        <div className="flex items-center gap-2">
                            <WarningOutlined className="text-errorTextRed" />
                            <Text className="text-sm font-semibold text-errorTextRed">
                                Terminate card
                            </Text>
                        </div>
                        <Text className="text-sm text-textBody">
                            Permanently cancels the card. Remaining balance (
                            {cardBalanceDisplay(card)}) will be returned to the wallet. This action
                            cannot be undone.
                        </Text>
                        <div className="flex flex-col gap-1.5">
                            <Text className="text-xs text-textBody">
                                Select Reason
                                <span className="ml-0.5 text-errorTextRed">*</span>
                            </Text>
                            <SelectInput
                                name="reason"
                                placeholder="Select termination reason"
                                options={TERMINATE_REASON_OPTIONS}
                                formItemClass={TIGHT_FIELD}
                                handleChange={value => {
                                    if (value !== TERMINATE_REASON_OTHERS)
                                        setFieldValue('note', '', false);
                                }}
                            />
                        </div>
                        {values.reason === TERMINATE_REASON_OTHERS && (
                            <div className="flex flex-col gap-1.5">
                                <Text className="text-xs text-textBody">
                                    Enter Reason (optional)
                                </Text>
                                <InputTextArea
                                    name="note"
                                    placeholder="Enter termination reason"
                                    autoSize={{ minRows: 3 }}
                                    maxLength={TERMINATE_REASON_NOTE_MAX}
                                    transform={sanitizeReasonNote}
                                    formItemClass={TIGHT_FIELD}
                                />
                            </div>
                        )}
                        <Text className="text-sm text-textBody">
                            Type{' '}
                            <span className="font-semibold text-textHeadings">
                                {TERMINATE_CONFIRM_WORD}
                            </span>{' '}
                            to confirm
                        </Text>
                        <TextInput
                            name="confirm"
                            type="text"
                            placeholder="Type"
                            formItemClass={TIGHT_FIELD}
                        />
                        <Button
                            danger
                            type="primary"
                            loading={terminateLoading}
                            disabled={!isCardRecord || !isValid}
                            onClick={submitForm}
                            className="w-fit font-medium"
                        >
                            Terminate card
                        </Button>
                    </Form>
                )}
            </Formik>
        );
    };

    const renderLimitsTab = () => (
        <Formik<LimitsValues>
            initialValues={{
                cardLimit: limitCard?.cardLimit ? String(limitCard.cardLimit) : '',
                frequency: limitCard?.limitFrequency || undefined,
                perTxnLimit: limitCard?.perTxnLimit ? String(limitCard.perTxnLimit) : '',
                restrictedCategories: restrictedCategoryNames(limitCard?.restrictedCategories),
                atmEnabled: !!limitCard?.atmEnabled,
            }}
            validationSchema={limitsSchema}
            validateOnMount
            onSubmit={async values => {
                const res = await submitSettings(card.key, {
                    cardLimit: Number(values.cardLimit),
                    ...(values.perTxnLimit ? { perTxnLimit: Number(values.perTxnLimit) } : {}),
                    frequency: values.frequency!,
                    restrictedCategories: values.restrictedCategories,
                    atmEnabled: values.atmEnabled,
                });
                if (res) {
                    toast('Card settings updated successfully');
                    onSuccess?.();
                    onClose();
                }
            }}
        >
            {({ values, errors, setFieldValue, isValid, submitForm }) => (
                <Form layout="vertical" onFinish={submitForm} className={TAB_BODY_CLASSNAME}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Text className="text-sm text-textBody">
                                Card limit (INR)
                                <span className="ml-0.5 text-errorTextRed">*</span>
                            </Text>
                            <TextInput
                                name="cardLimit"
                                type="text"
                                placeholder="Type"
                                allowNumbersOnly
                                inputMode="numeric"
                                maxLength={MAX_CARD_LIMIT_DIGITS}
                                formItemClass={TIGHT_FIELD}
                            />
                            {!errors.cardLimit && (
                                <Text className="text-xs text-textGreyLight">
                                    Maximum this card can spend per month. Cards share the wallet
                                    pool — actual spend is first-come-first-served.
                                </Text>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Text className="text-sm text-textBody">
                                Frequency<span className="ml-0.5 text-errorTextRed">*</span>
                            </Text>
                            <SelectInput
                                name="frequency"
                                placeholder="Select"
                                options={FREQUENCY_OPTIONS}
                                formItemClass={TIGHT_FIELD}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Text className="text-sm text-textBody">Per-transaction limit (INR)</Text>
                        <TextInput
                            name="perTxnLimit"
                            type="text"
                            placeholder="Type"
                            allowNumbersOnly
                            inputMode="numeric"
                            maxLength={MAX_CARD_LIMIT_DIGITS}
                            formItemClass={TIGHT_FIELD}
                        />
                        {!errors.perTxnLimit && (
                            <Text className="text-xs text-textGreyLight">
                                Maximum amount allowed for a single transaction on this card.
                            </Text>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 rounded-2xl border border-borderCard p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col gap-0.5">
                                <Text className="text-sm font-semibold text-textHeadings">
                                    Merchant categories
                                </Text>
                                <Text className="text-xs text-textBody">
                                    Selected categories will be restricted.
                                </Text>
                            </div>
                            <span className="shrink-0 rounded-full bg-bgLightPink px-3 py-1 text-xs font-medium text-textLightRed">
                                Restrict
                            </span>
                        </div>
                        <Checkbox.Group
                            value={values.restrictedCategories}
                            onChange={next => setFieldValue('restrictedCategories', next)}
                            className="w-full"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {merchantCategories.map(({ category }) => (
                                    <Checkbox key={category} value={category}>
                                        <span className="text-sm text-textBody">{category}</span>
                                    </Checkbox>
                                ))}
                            </div>
                        </Checkbox.Group>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-borderCard p-4">
                        <div className="flex flex-col gap-0.5">
                            <Text className="text-sm font-semibold text-textHeadings">
                                ATM withdrawals
                            </Text>
                            <Text className="text-xs text-textBody">
                                Allow cash withdrawals at ATMs. Daily ATM limit is capped at 20% of
                                the assigned card limit.
                            </Text>
                        </div>
                        <Switch
                            checked={values.atmEnabled}
                            onChange={next => setFieldValue('atmEnabled', next)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button danger onClick={onClose} className="font-medium">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            loading={settingsLoading}
                            disabled={!isCardRecord || !isValid}
                            onClick={submitForm}
                            className="font-medium"
                        >
                            Save
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );

    return (
        <div className="flex flex-col gap-5 py-2">
            <div className="flex flex-col gap-0.5 pr-7">
                <Title
                    level={4}
                    className="!mb-0 break-words !text-base !text-textHeadings sm:!text-xl"
                >
                    Manage card · **** **** **** {card.last4}
                </Title>
                <div className="flex items-center justify-between gap-2 text-xs text-textGreyLight sm:text-sm">
                    <span>{('nameOnCard' in card && card.nameOnCard) || card.holder}</span>
                    <span>{'type' in card ? (card.type ?? 'Virtual') : 'Physical'} card</span>
                    <span>Remaining balance {cardBalanceDisplay(card)}</span>
                </div>
            </div>

            <div className="hide-scrollbar -mx-1 overflow-x-auto px-1">
                <Segmented
                    value={activeTab}
                    onChange={value => setTab(value as Tab)}
                    options={visibleTabs.map(t => {
                        const isLimitsDisabled = t === 'Limits & controls' && terminated;
                        return {
                            value: t,
                            disabled: isLimitsDisabled,
                            label: (
                                <Tooltip
                                    title={
                                        isLimitsDisabled
                                            ? 'This card is undergoing termination. Limit and control settings cannot be modified.'
                                            : t
                                    }
                                    trigger={['hover', 'click']}
                                >
                                    <span>{t}</span>
                                </Tooltip>
                            ),
                        };
                    })}
                    block
                    style={{ borderRadius: 9999, padding: '4px' }}
                    className="w-max [&_.ant-segmented-item]:!flex-none [&_.ant-segmented-item]:!rounded-full [&_.ant-segmented-thumb]:!rounded-full [&_.ant-segmented-item-selected]:!rounded-full [&_.ant-segmented-item-selected]:!text-textLightRed [&_.ant-segmented-item:not(.ant-segmented-item-selected):hover]:!bg-transparent sm:w-full sm:[&_.ant-segmented-item]:!flex-1"
                />
            </div>

            {activeTab === 'Status' && (
                <div className={TAB_BODY_CLASSNAME}>
                    {renderFreezeSection()}

                    {frozen || terminated ? (
                        <div className="flex items-start gap-2 rounded-xl border border-errorTextRed/30 bg-bgLightPink px-4 py-3">
                            <WarningOutlined className="mt-0.5 text-errorTextRed" />
                            <Text className="text-sm text-errorTextRed">
                                <span className="font-semibold">Current state: </span>
                                All purchases are declined. Existing authorizations may still
                                settle.
                            </Text>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 rounded-xl border border-savingsTagLightText/30 bg-savingsTagLightBg px-4 py-3">
                            <span className="mt-0.5 text-savingsTagLightText">ⓘ</span>
                            <Text className="text-sm text-savingsTagLightText">
                                <span className="font-semibold">Current state: </span>
                                Card is active and accepting transactions per the configured limits
                                and controls.
                            </Text>
                        </div>
                    )}

                    {renderTerminateSection()}
                </div>
            )}

            {activeTab === 'Limits & controls' && renderLimitsTab()}

            {activeTab === 'Lifecycle' && (
                <div className={TAB_BODY_CLASSNAME}>
                    <div className="flex flex-col gap-3 rounded-2xl border border-borderCard p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-textBody">▤</span>
                            <Text className="text-sm font-semibold text-textHeadings">
                                Convert to Physical Card
                            </Text>
                        </div>
                        <Text className="text-sm text-textBody">
                            Order a physical card with the same card number, expiry, and CVV as this
                            virtual card. It will be shipped to the cardholder.
                        </Text>
                        <Button
                            danger
                            onClick={() => {
                                onClose();
                                onRequestPhysical?.();
                            }}
                            className="w-fit font-medium"
                        >
                            Convert to Physical Card
                        </Button>
                    </div>
                </div>
            )}
            <PineLabsFooter />
        </div>
    );
};

/** Admin "Manage card" modal — Status, Limits & controls (single Save) and Lifecycle tabs. */
const ManageCardModal = ({ card, onClose, onRequestPhysical, onSuccess }: ManageCardModalProps) => (
    <Modal
        open={card !== null}
        onCancel={onClose}
        footer={null}
        centered
        width={540}
        destroyOnHidden
        classNames={MANAGE_MODAL_CLASSNAMES}
        closeIcon={MODAL_CLOSE_ICON}
    >
        {card && (
            <ManageCardContent
                key={card.key}
                card={card}
                onClose={onClose}
                onRequestPhysical={onRequestPhysical}
                onSuccess={onSuccess}
            />
        )}
    </Modal>
);

export default ManageCardModal;
