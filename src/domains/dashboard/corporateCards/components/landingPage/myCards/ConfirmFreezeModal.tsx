import { Button, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { FreezeCardValues, freezeCardSchema } from '../../../schema/freezeCardSchema';
import {
    FREEZE_CONFIRM_WORD,
    FREEZE_REASON_NOTE_MAX,
    FREEZE_REASON_OPTIONS,
    FREEZE_REASON_OTHERS,
    sanitizeReasonNote,
} from '../../../utils/cardsData';
import { MyCard } from '../../../utils/types';
import {
    MODAL_CLOSE_ICON,
    PineLabsFooter,
    ROUNDED_MODAL_CLASSNAMES,
} from '../../common/modalProps';

const { Title, Text } = Typography;

const TIGHT_FIELD = '!mb-0';

/** What the cardholder tells us about the freeze; the reason code is mandatory, the note only for Others. */
export interface FreezeCardReason {
    reason: number;
    reasonNote?: string;
}

interface ConfirmFreezeModalProps {
    /** The card to freeze; modal is open when non-null. */
    card: MyCard | null;
    onClose: () => void;
    /** Called with the card and its freeze reason once confirmed. Parent performs the freeze. */
    onConfirm: (card: MyCard, values: FreezeCardReason) => void;
    isLoading?: boolean;
}

interface ConfirmFreezeContentProps extends Omit<ConfirmFreezeModalProps, 'card'> {
    card: MyCard;
}

/**
 * Form body. Mounted only while a card is selected (see the `card &&` guard plus `destroyOnHidden`), so
 * every field starts empty on each open without a reset effect to keep in step with the field list.
 */
const ConfirmFreezeContent = ({
    card,
    onClose,
    onConfirm,
    isLoading,
}: ConfirmFreezeContentProps) => (
    <Formik<FreezeCardValues>
        initialValues={{ confirm: '', reason: undefined, note: '' }}
        validationSchema={freezeCardSchema}
        validateOnMount
        onSubmit={values =>
            onConfirm(card, {
                reason: values.reason as number,
                reasonNote: values.note.trim() || undefined,
            })
        }
    >
        {({ submitForm, isValid, values, setFieldValue }) => (
            <Form layout="vertical" className="flex flex-col gap-5" onFinish={submitForm}>
                <div className="flex flex-col gap-2">
                    <Title level={4} className="!mb-0 !text-textHeadings">
                        Confirm freeze
                    </Title>
                    <Text className="text-sm text-textBody">
                        You are about to freeze 1 card. Type {FREEZE_CONFIRM_WORD} below to confirm.
                    </Text>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Text className="text-sm text-textBody">
                        Type{' '}
                        <span className="font-semibold text-textHeadings">
                            {FREEZE_CONFIRM_WORD}
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

                {values.reason === FREEZE_REASON_OTHERS && (
                    <div className="flex flex-col gap-1.5">
                        <Text className="text-sm text-textBody">
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button danger onClick={onClose} disabled={isLoading} className="font-medium">
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        disabled={!isValid}
                        loading={isLoading}
                        onClick={submitForm}
                        className="font-medium"
                    >
                        Freeze card
                    </Button>
                </div>

                <PineLabsFooter />
            </Form>
        )}
    </Formik>
);

/** Cardholder freeze confirmation — asks for a reason and requires typing FREEZE before freezing. */
const ConfirmFreezeModal = ({ card, onClose, onConfirm, isLoading }: ConfirmFreezeModalProps) => (
    <Modal
        open={card !== null}
        onCancel={onClose}
        footer={null}
        centered
        width={480}
        destroyOnHidden
        classNames={ROUNDED_MODAL_CLASSNAMES}
        closeIcon={MODAL_CLOSE_ICON}
    >
        {card && (
            <ConfirmFreezeContent
                card={card}
                onClose={onClose}
                onConfirm={onConfirm}
                isLoading={isLoading}
            />
        )}
    </Modal>
);

export default ConfirmFreezeModal;
