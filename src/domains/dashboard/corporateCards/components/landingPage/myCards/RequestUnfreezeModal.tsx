import { useState } from 'react';

import { Button, Input, Modal, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useUnfreezeRequestApi } from '../../../hooks/user/useUnfreezeRequestApi';
import { REASON_NOTE_MIN, sanitizeReasonNote } from '../../../utils/cardsData';
import { REQUEST_UNFREEZE_COPY as C } from '../../../utils/myCardsData';
import { MyCard } from '../../../utils/types';
import CardThumb from '../../common/CardThumb';
import {
    MODAL_CLOSE_ICON,
    PineLabsFooter,
    ROUNDED_MODAL_CLASSNAMES,
} from '../../common/modalProps';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface RequestUnfreezeModalProps {
    card: MyCard | null;
    onClose: () => void;
    onSuccess?: () => void;
}

const RequestUnfreezeModal = ({ card, onClose, onSuccess }: RequestUnfreezeModalProps) => {
    const dispatch = useAppDispatch();
    const { submitUnfreezeRequest, isLoading } = useUnfreezeRequestApi();
    const [reason, setReason] = useState('');

    const reasonTrimmed = reason.trim();
    const reasonTooShort = reasonTrimmed.length > 0 && reasonTrimmed.length < REASON_NOTE_MIN;
    const isReasonValid = !reasonTooShort;
    const frozenReason = card?.freezeReasonNote || card?.freezeReasonLabel;

    const handleClose = () => {
        setReason('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!card) return;
        const res = await submitUnfreezeRequest({
            cardIssuanceId: card.key,
            reason: reasonTrimmed || undefined,
        });
        if (res) {
            dispatch(showToast({ variant: 'success', description: C.success }));
            onSuccess?.();
            handleClose();
        }
    };

    return (
        <Modal
            open={card !== null}
            onCancel={handleClose}
            footer={null}
            centered
            width={520}
            destroyOnHidden
            classNames={ROUNDED_MODAL_CLASSNAMES}
            closeIcon={MODAL_CLOSE_ICON}
        >
            {card && (
                <div className="flex flex-col gap-5 py-2">
                    <div className="flex flex-col gap-1">
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {C.title}
                        </Title>
                        <Text className="text-sm text-textBody">{C.subtitle}</Text>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-borderCard p-4">
                        <CardThumb />
                        <div className="flex min-w-0 flex-col">
                            <Text className="text-sm text-textHeadings">
                                **** **** **** {card.last4}
                            </Text>
                            <Text className="text-xs text-textGreyLight">{card.kind}</Text>
                        </div>
                    </div>

                    {frozenReason && (
                        <div className="flex flex-col gap-1">
                            <Text className="text-sm text-textBody">{C.frozenReasonLabel}</Text>
                            <Text className="text-sm font-medium text-textHeadings">
                                {frozenReason}
                            </Text>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Text className="text-sm text-textBody">{C.reasonLabel}</Text>
                        <TextArea
                            rows={4}
                            placeholder={C.reasonPlaceholder}
                            value={reason}
                            onChange={event => setReason(sanitizeReasonNote(event.target.value))}
                            maxLength={250}
                            status={reasonTooShort ? 'error' : ''}
                        />
                        {reasonTooShort && (
                            <Text className="text-xs text-textLightRed">
                                Please enter at least {REASON_NOTE_MIN} characters.
                            </Text>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button danger size="large" onClick={handleClose} disabled={isLoading}>
                            {C.cancel}
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            loading={isLoading}
                            disabled={!isReasonValid}
                            onClick={handleSubmit}
                        >
                            {C.submit}
                        </Button>
                    </div>

                    <PineLabsFooter />
                </div>
            )}
        </Modal>
    );
};

export default RequestUnfreezeModal;
